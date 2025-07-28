import ClientRTC from "./clientRTCPeer.js";
import ClientSocket from "./clientSocket.js";
import SignallingService from "./signallingService.js";

const video = document.querySelector("video");
const role = document.getElementById("role");
const connection = document.getElementById("connection");
const joinButton = document.getElementById("join");

async function getStream(socket) {
  if (socket.isInitiator()) {
    console.log("[Attempting to get stream for initiator]");
    return await navigator.mediaDevices.getUserMedia({
      video: true,
    });
  }
}

async function page() {
  const signallingService = new SignallingService();
  const socketClient = new ClientSocket(signallingService);
  await socketClient.awaitConnection();

  joinButton.innerText = socketClient.roomActive() ? "join" : "initiate";
  socketClient.on("joined", () => {
    joinButton.innerText = socketClient.roomActive() ? "join" : "initiate";
  });

  joinButton.addEventListener("click", async () => {
    await join(signallingService, socketClient);
  });
}

async function join(signallingService, socket) {
  joinButton.innerText = "waiting for peer...";
  joinButton.disabled = true;

  await socket.join();

  const stream = await getStream(socket);

  // Initiate a peer client which is ready to create and handle a peer connection.
  const rtc = new ClientRTC(
    signallingService,
    socket.isInitiator(),
    socket.isInitiator() && stream,
    video,
  );
  rtc.setUIFunc(() => updateUI(joinButton, role, connection, rtc, socket));

  // Initiator creates a room
  // Peer joins room and triggers "userConnected" event while creating their own peer.
  // Initiator received "userConnected" event and creates their own peer.
  // Creating peer triggers "signal" event on peer which sends signal over websocket.
  // Each peer receives the signal and connection is established.
  // Non-intiator peer recieves stream from initator.

  if (rtc.isInitiator) {
    console.log("[initiator video starting]");
    video.srcObject = stream;
    video.play();
  } else {
    // The initiator calls createPeer when the other user connects (in socket.onPeerConnected())
    rtc.createPeer();
  }
}

function updateUI(joinButton, role, connection, rtc, socket) {
  role.innerHTML = rtc.isInitiator ? "initiator" : "viewer";

  connection.innerText = rtc.connected ? "connected" : "not connected";

  const roomActive = socket.roomActive();

  if (!roomActive) {
    joinButton.innerText = "initiate";
    joinButton.disabled = false;
  } else if (rtc.isInitiator) {
    joinButton.innerText = "waiting for peer...";
    joinButton.disabled = true;
  } else {
    joinButton.innerText = "initiate";
    joinButton.disabled = false;
  }

  rtc.connected
    ? (joinButton.style.display = "none")
    : (joinButton.style.display = "block");
}

page();
