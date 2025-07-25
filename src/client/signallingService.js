export default class SignallingService {
  peerClient = null;
  socketClient = null;

  constructor() {}

  signalPeer(data) {
    console.log("[signalling peer from service]");
    this.peerClient.peer.signal(data);
  }

  emitSignal(data) {
    console.log("[sending signal via websocket]");
    this.socketClient.socket.emit("signal", JSON.stringify(data));
  }

  createPeer() {
    console.log("[create peer]", this.peer, this.peerClient);
    this.peerClient.createPeer(this.socketClient.isInitiator());
  }
}
