import { Server } from "socket.io";
import Room from "./room.js";

export default class ServerSocket {
  connections = [];

  constructor(httpServer) {
    const io = new Server(httpServer, {
      cors: {
        origin: "http://localhost:5173", // Allow Vite dev server
        methods: ["GET", "POST"],
      },
      path: "/socket.io/",
    });

    this.io = io;

    io.on("connection", (socket) => {
      this.#onConnection(socket);
      socket.on("join", () => this.#onJoin(socket));
      socket.on("leave", () => this.#onLeave(socket));
      socket.on("requestRoom", () => this.#onRequestRoom());
      socket.on("disconnect", (reason) =>
        this.#onDisconnection(socket, reason),
      );
      socket.on("signal", (data) => this.#sendSignal(data, socket));
      socket.on("requestInitialData", () => this.#onConnection(socket));
    });
  }

  #onRequestRoom() {
    this.io.emit("room", { room: Room.fields() });
  }

  #onJoin(socket) {
    console.log("[joined]", socket.id);
    Room.join(socket.id);
    Room.log();

    console.log(Room.fields());

    // Only sends if other person already in room.
    // Which they wont be until they click join.
    this.io.to(Room.otherUser(socket.id)).emit("userConnected", {
      connected: socket.id,
      room: Room.fields(),
    });

    this.io.emit("joined", { room: Room.fields() });
  }

  #onLeave(socket) {
    Room.log();
    console.log("[left room]", socket.id);
    const otherUser = Room.otherUser(socket.id);
    Room.leave(socket.id);
    Room.leave(otherUser);
    Room.log();
    this.io.emit("callEnded");
  }

  #onConnection(socket) {
    console.log("user has connected", socket.id);

    if (this.connections.length <= 2) {
      this.connections.push(socket.id);
    } else {
      console.log("more than 2 connections attempted");
    }
    console.log("[connected users]:", this.connections.length);
    console.log(this.connections);
  }

  #onDisconnection(socket, reason) {
    console.log("[user has disconnected]", socket.id);
    console.log(`[Reason: ${reason}]`);

    Room.leave(socket.id);
    Room.log();

    this.io.emit("peerDisconnected", {
      disconnected: socket.id,
      room: Room.fields(),
    });

    this.connections.splice(
      this.connections.indexOf((connection) => connection === socket.id),
      1,
    );
  }

  #sendSignal(data, socket) {
    this.io.to(Room.otherUser(socket.id)).emit("signal", data);
  }
}
