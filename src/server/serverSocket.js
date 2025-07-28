import { Server } from "socket.io";

const users = new Map();

class Room {
  static #initiator = null;
  static #viewer = null;
  static #users = new Map();

  static set initiator(userId) {
    this.#initiator = userId;
  }

  static get initiator() {
    return this.#initiator;
  }

  static set viewer(userId) {
    this.#viewer = userId;
  }

  static get viewer() {
    return this.#viewer;
  }

  static join(userId) {
    if (
      (!this.#initiator && !this.#viewer) ||
      (!this.#initiator && this.#viewer)
    ) {
      this.#initiator = userId;
    } else {
      this.#viewer = userId;
    }

    // TODO: handle more than two users. Reject connection.
  }

  static leave(userId) {
    if (this.#initiator === userId) {
      this.#initiator = null;
    }
    if (this.#viewer === userId) {
      this.#viewer = null;
    }
  }

  static handleConnection(userId) {
    const count = this.#users.get(userId) || 0;
    this.#users.set(userId, count + 1);
    return count === 0;
  }

  static handleDisconnection(userId) {
    const count = this.#users.get(userId) - 1;
    if (count === 0) {
      this.#users.delete(userId);
    } else {
      this.#users.set(userId, count);
    }
    return count === 0;
  }

  static log() {
    console.log(
      `[Room Members]: [initiator: ${this.#initiator}. viewer: ${this.viewer}]`,
    );
  }

  static fields() {
    return {
      initiator: this.#initiator,
      viewer: this.#viewer,
    };
  }

  static otherUser(userId) {
    if (this.#initiator === userId) {
      return this.#viewer;
    }
    if (this.#viewer === userId) {
      return this.#initiator;
    }
  }
}

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

    this.io.to(Room.otherUser(socket.id)).emit("userConnected", {
      connected: socket.id,
      room: Room.fields(),
    });

    this.io.emit("joined", { room: Room.fields() });
  }

  #onConnection(socket) {
    console.log("user has connected", socket.id);
    console.log("[connected users]:", this.connections.length);

    this.connections.push(socket.id);
    console.log(this.connections);
  }

  #onDisconnection(socket, reason) {
    console.log("[user has disconnected]", socket.id);
    console.log(`[Reason: ${reason}]`);
    console.log("[connected users]:", users.size);

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
    console.log("[signal received]", data, "[sending signal]");
    this.io.to(Room.otherUser(socket.id)).emit("signal", data);
  }
}
