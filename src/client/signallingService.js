export default class SignallingService {
  peerClient = null;
  socketClient = null;

  signalPeer(data) {
    console.log(
      "[signalling peer from service after receiving from websocket]",
      this.peerClient.peer,
    );
    this.peerClient.peer.signal(data);
  }

  emitSignal(data) {
    console.log("[sending signal via websocket]");
    this.socketClient.socket.emit("signal", JSON.stringify(data));
  }

  createPeer() {
    console.log("[create peer]", this.peerClient);
    this.peerClient.createPeer();
  }

  callEnded() {
    this.peerClient.callEnded();
  }
}
