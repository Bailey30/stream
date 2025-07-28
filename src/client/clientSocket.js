import { io } from "socket.io-client";

/**
 * WebSocket wrapper for handling signaling.
 */
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

    await this.#awaitEvent(socket, "connect");
    console.log("[socket connected]");

    this.id = socket.id;
    this.signallingService.socketClient = this;

    socket.emit("requestRoom");

    const roomData = await this.#awaitEvent(socket, "room");
    this.#onRoom(roomData);

    this.#listen();

    return socket;
  }

  isInitiator() {
    console.log("[isInitiator]", this.id === this.room.initiator);
    return this.id === this.room.initiator;
  }

  roomActive() {
    return !!this.room.initiator;
  }

  #listen() {
    this.socket.on("signal", (data) => this.#onSignal(data));
    this.socket.on("userConnected", (data) => this.#onPeerConnected(data));
    this.socket.on("peerDisconnected", () => this.#onPeerDisconnected());
    this.socket.on("joined", (data) => this.#onJoin(data));
  }

  /**
   * Emits a "join" event to the websocket which stores the socket ID in an array of active connections.
   **/
  async join() {
    this.socket.emit("join");
    const data = await this.#awaitEvent(this.socket, "joined");
    this.room = data.room;
  }

  on(event, callback) {
    this.socket.on(event, () => callback(this.socket));
  }

  #onJoin(data) {
    this.room = data.room;
  }

  #onSignal(data) {
    console.log("[signal received from websocket]");
    this.signallingService.signalPeer(data);
  }

  #onPeerConnected(data) {
    this.room = data.room;

    console.log(`[User connected: ${data.connected}]`);
    console.log(`[Your id: ${this.socket.id}]`);
    console.log(
      `[Room: initiator: ${this.room.initiator}, viewer: ${this.room.viewer}]`,
    );

    this.signallingService.createPeer();
  }

  #onPeerDisconnected() {
    console.log("[peer peerDisconnected from websocket]");
  }

  #onRoom(data) {
    this.room = data.room;
  }

  #awaitEvent(emitter, eventName) {
    return new Promise((resolve) => {
      emitter.once(eventName, (data) => resolve(data));
    });
  }
}
