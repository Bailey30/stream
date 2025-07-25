import ClientRTC from "../src/client/clientRTCPeer.js";
import ClientSocket from "../src/client/clientSocket.js";
import SignallingService from "../src/client/signallingService.js";

async function page() {
  const signallingService = new SignallingService();
  const socket = new ClientSocket(signallingService);
  await socket.awaitConnection();

  async function getStream(socket) {
    if (socket.isInitiator()) {
      console.log("[Attempting to get stream for initiator]");
      return await navigator.mediaDevices.getUserMedia({
        video: true,
      });
    }
  }
  const stream = await getStream(socket);

  const video = document.querySelector("video");

  const rtc = new ClientRTC(
    signallingService,
    socket.isInitiator(),
    socket.isInitiator() && stream,
    video,
  );
}

page();
