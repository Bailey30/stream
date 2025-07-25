export default class SignallingService {
  constructor() {}

  signalPeer(data) {
    console.log("[signalling peer from service]");
    this.peer.signal(data);
  }

  emitSignal(data) {
    console.log("[sending signal via websocket]");
    this.socket.emit("signal", JSON.stringify(data));
  }

  createPeer() {
    this.peer.createPeer(this.socketClient.isInitiator());
  }
}
