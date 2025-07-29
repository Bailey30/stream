import ClientRTC from "./clientRTCPeer.js";
import ClientSocket from "./clientSocket.js";
import SignallingService from "./signallingService.js";

const video = document.querySelector("video");
const connection = document.getElementById("connection");
const joinButton = document.getElementById("join");
const initator_icon = document.getElementById("initiator_icon");
const viewer_icon = document.getElementById("viewer_icon");

async function getStream(socket) {
  if (socket.isInitiator()) {
    return await navigator.mediaDevices.getUserMedia({
      video: true,
    });
  }
}

async function page() {
  const signallingService = new SignallingService();
  const socketClient = new ClientSocket(signallingService);
  await socketClient.awaitConnection();

  joinButton.innerText = socketClient.roomActive() ? "Join" : "Initiate";
  socketClient.on("joined", () => {
    if (!socketClient.isInitiator()) {
      joinButton.innerText = socketClient.roomActive() ? "Join" : "Initiate";
    }
  });

  joinButton.addEventListener("click", async () => {
    await socketClient.join();
    await joinAsPeer(signallingService, socketClient, joinButton);
  });
}

async function joinAsPeer(signallingService, socket, joinButton) {
  joinButton.disabled = true;
  const stream = await getStream(socket);

  // Initiate a peer client which is ready to create and handle a peer connection.
  const rtc = new ClientRTC(
    signallingService,
    socket.isInitiator(),
    socket.isInitiator() && stream,
    video,
  );
  rtc.setUIFunc(() => updateUI(joinButton, connection, rtc, socket));

  // Initiator creates a room with "join".
  // Other peer joins room and triggers "userConnected" event while creating their own peer.
  // Initiator received "userConnected" event and creates their own peer.
  // Creating peer triggers "signal" event on peer which sends signal over websocket.
  // Each peer receives the signal and connection is established.
  // Non-intiator peer recieves stream from initator.

  if (rtc.isInitiator) {
    console.log("[initiator video starting]");
    video.srcObject = stream;
    video.play();
    joinButton.innerText = "Waiting for peer...";
  } else {
    // The initiator calls createPeer when the other user connects (in socket.onPeerConnected())
    rtc.createPeer();
  }
}

function updateUI(joinButton, connection, rtc, socket) {
  if (rtc.isInitiator) {
    initator_icon.style.display = "block";
    viewer_icon.style.display = "none";
  } else {
    initator_icon.style.display = "none";
    viewer_icon.style.display = "block";
  }

  connection.innerText = rtc.connected ? "Connected" : "Not connected";

  const roomActive = socket.roomActive();

  rtc.connected
    ? (joinButton.style.display = "none")
    : (joinButton.style.display = "block");

  if (!roomActive) {
    joinButton.innerText = "Initiate";
    joinButton.disabled = false;
    viewer_icon.style.display = "none";
  } else if (rtc.isInitiator && !rtc.connected) {
    initator_icon.style.display = "none";
  } else if (rtc.isInitiator) {
    joinButton.innerText = "Waiting for peer...";
    joinButton.disabled = true;
  } else {
    joinButton.innerText = "Initiate";
    joinButton.disabled = false;
  }
}

page();
