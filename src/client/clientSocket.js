import { io } from "socket.io-client";

export default class ClientSocket {
  signallingService = null;
  id = null;
  room = { initiator: undefined, viewer: undefined };
  socket = null;

  constructor(signallingService) {
    this.signallingService = signallingService;
  }

  async awaitConnection() {
    console.log("connecting socket");

    const socket = io(process.env.WEBSOCKET_URL);
    this.socket = socket;

    await this.#once(socket, "connect");
    console.log("[socket connected]");

    this.id = socket.id;
    this.signallingService.socketClient = this;

    socket.emit("requestRoom");

    const roomData = await this.#once(socket, "room");
    this.#onRoom(roomData);

    this.#listen();

    return socket;
  }

  isInitiator() {
    console.log("[isInitiator]", this.id === this.room.initiator);
    return this.id === this.room.initiator;
  }

  #listen() {
    this.socket.on("signal", (data) => this.#onSignal(data));
    this.socket.on("userConnected", (data) => this.#onPeerConnected(data));
    this.socket.on("peerDisconnected", () => this.#onPeerDisconnected());
  }

  #onSignal(data) {
    this.signallingService.signalPeer(data);
  }

  #onPeerConnected(data) {
    this.room = data.room;

    console.log(`[User connected: ${data.connected}]`);
    console.log(`[Your id: ${this.socket.id}]`);
    console.log(
      `[Room: initiator: ${this.room.initiator}, viewer: ${this.room.viewer}]`,
    );
  }

  #onPeerDisconnected() {
    console.log(this.room);
    this.signallingService.createPeer();
  }

  #onRoom(data) {
    this.room = data.room;
  }

  #once(emitter, eventName) {
    return new Promise((resolve) => {
      emitter.once(eventName, (data) => resolve(data));
    });
  }
}
