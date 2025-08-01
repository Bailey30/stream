import SimplePeer from "simple-peer";

export default class ClientRTC {
  signallingService = null;
  peer = null;
  connected = false;
  isInitiator = false;

  constructor(signallingService, initiator = false, stream = undefined, video) {
    this.signallingService = signallingService;
    this.isInitiator = initiator;
    this.stream = stream;
    this.video = video;
    this.signallingService.peerClient = this;

    if (initiator && !stream) {
      alert("initiator and no stream");
    }
  }

  createPeer() {
    this.#destroy();

    console.log("[initiator]", this.isInitiator);
    console.log("[peer createPeer]");

    this.peer = new SimplePeer({
      initiator: this.isInitiator,
      ...(this.stream && { stream: this.stream }),
    });

    this.#listen();
  }

  on(event, callback) {
    console.log(`setting callback: ${event}`, this.peer);
    this.peer.on(event, () => {
      callback(this.peer);
    });
  }

  #listen() {
    // "signal" event triggered when local peer has signal to send (when the peer is created).
    this.peer.on("signal", (data) => this.#onSignal(data));
    this.peer.on("connect", () => this.#onConnect());
    // "stream" event triggered when stream received.
    this.peer.on("stream", (stream) => this.#onStream(stream, this.video));
    this.peer.on("close", () => this.#onClose());
    this.peer.on("error", (err) => this.#onError(err));
  }

  #onSignal(data) {
    console.log("[peer onSignal]");
    this.signallingService.emitSignal(data);
  }

  #onConnect() {
    console.log("[Peer connected]", this.peer.connected);
    this.connected = this.peer.connected;
    this.#UpdateUI();
  }

  #onStream(stream, video) {
    console.log("[Viewer stream starting]");
    video.srcObject = stream;
    video.play();
  }

  #onClose() {
    console.log("[peer closed]");
    this.createPeer();
    this.#UpdateUI();
  }

  #onError(err) {
    console.error("[Peer error:]", err);
  }

  #destroy() {
    if (this.peer) {
      console.log("[destroying peer]");
      this.peer.removeAllListeners();
      this.peer.destroy();
      this.peer = null;
      this.connected = false;

      if (this.video.srcObject) {
        this.video.srcObject.getVideoTracks().forEach((track) => {
          track.stop();
          this.video.srcObject.removeTrack(track);
        });
      }

      this.video.srcObject = null;
      this.video.pause();
    }
  }

  callEnded() {
    this.#destroy();
    this.#UpdateUI();
  }

  #UpdateUI() {
    this.UIFunc();
  }

  setUIFunc(func) {
    this.UIFunc = func;
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
