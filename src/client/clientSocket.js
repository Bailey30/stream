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
    console.log("[connecting socket]");

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
    this.socket.on("peerDisconnected", (data) =>
      this.#onPeerDisconnected(data),
    );
    this.socket.on("joined", (data) => this.#onJoin(data));
    this.socket.on("callEnded", () => this.#onCallEnded());
  }

  /**
   * Emits a "join" event to the websocket which stores the socket ID in an array of active connections.
   * Saves the viewer and initiator of the room locally as other functions rely on that knowledge.
   **/
  async join() {
    this.socket.emit("join");
    const data = await this.#awaitEvent(this.socket, "joined");
    // Needs to await this event so it can get information about the room before knowing if it is the initiator or not.
    this.room = data.room;
  }

  leave() {
    this.socket.emit("leave");
  }

  #onCallEnded() {
    console.log("[call ended]");
    this.room = { initiator: undefined, viewer: undefined };
    try {
      this.signallingService.callEnded();
    } catch (error) {}
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

  #onPeerDisconnected(data) {
    console.log("[peer peerDisconnected from websocket]");
    this.room = data.room;
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
