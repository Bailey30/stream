import SimplePeer from "simple-peer";

export default class ClientRTC {
  peer = null;
  signallingService;

  constructor(signallingService, initiator = false, stream = undefined, video) {
    this.signallingService = signallingService;

    this.createPeer(initiator, stream, video);
  }

  createPeer(initiator, stream, video) {
    if (this.peer) {
      this.peer.removeAllListeners();
      this.peer.destroy();
    }

    console.log("[peer createPeer]");
    const peer = new SimplePeer({ initiator, stream });

    this.peer = peer;
    this.signallingService.peer = this.peer;

    this.peer.on("signal", (data) => this.signallingService.emitSignal(data));
    this.peer.on("connect", () => this.onConnect());
    this.peer.on("stream", (stream) => this.onStream(stream, video));
    this.peer.on("close", () => this.onClose());
    this.peer.on("error", (err) => this.onError(err));
  }

  onConnect() {
    console.log("[Peer connected]", this.peer.connected);
  }

  onStream(stream, video) {
    video.srcObject = stream;
    video.play();
  }

  onClose() {
    console.log("[peer closed]");
  }

  onError(err) {
    console.error("[Peer error:]", err);
  }
}

// start websocket
//  after websocket connected emit "initate peer" to: attempt to create peer connection
//  attempt to create peer when joining room. create
//  with stream if sending, without if receiving
//  handle on "signal" event to start connection
//      - send it with websocket
//      - when other person receives this message call peer.signal on your own peer
//  handle on "connect" to confirm connection
//  on "stream" event possible created automatically by the other peer creating an on "signal" event with their stream
//
// be "initator" if first in room
