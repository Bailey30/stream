import { io } from "socket.io-client";
import ClientRTC from "./clientRTCPeer";

export default class ClientSocket {
  signallingService;
  id = null;
  room = { initiator: null, viewer: null };
  socket = null;
  rtc = null;
  video = null;

  constructor(signallingService) {
    this.signallingService = signallingService;
  }

  async awaitConnection() {
    console.log("connecting socket");

    const socket = io(process.env.WEBSOCKET_URL);

    await new Promise((resolve) => {
      socket.on("connect", () => {
        console.log("[socket connected]");
        // socket.emit("requestInitialData");
        resolve();
      });
    });

    this.socket = socket;
    this.signallingService.socketClient = this;
    this.signallingService.socket = this.socket;
    this.listen();

    return socket;
  }

  listen() {
    this.socket.on("signal", (data) => this.onSignal(data));
    this.socket.on("userConnected", (data) => this.onPeerConnected(data));
    this.socket.on("peerDisconnected", () => this.onPeerDisconnected());
  }

  onSignal(data) {
    this.signallingService.signalPeer(data);
  }

  onPeerConnected(socket, data) {
    const room = data.room;
    console.log({ room });

    console.log(`[User connected: ${data.connected}]`);
    console.log(`[Your id: ${socket.id}]`);
    console.log(`[Room: initiator: ${room.initiator}, viewer: ${room.viewer}]`);

    this.id = socket.id;

    if (socket.id === room.initiator) {
      this.room.initiator = socket.id;
    }
  }

  onPeerDisconnected() {
    this.signallingService.createPeer();
  }

  isInitiator() {
    return this.id === this.room.initiator;
  }
}
