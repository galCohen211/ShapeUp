import { io, Socket } from "socket.io-client";

const CHAT_SERVER_URL = "http://localhost:" + process.env.HTTP_SERVER_PORT; 
const PATH = "/users-chat";

const socket: Socket = io(CHAT_SERVER_URL, {
  path: PATH, 
  transports: ["websocket", "polling"], 
});

// Event: Successful connection
socket.on("connect", () => {
  console.log("Connected to the server with socket ID:", socket.id);

  socket.emit("add_user", "6761dd100731dac3efa37f1c");
  socket.emit("add_user", "6761dd100731dac3efa37f1d");
  socket.emit("communicate", "6761dd100731dac3efa37f1c", "6761dd100731dac3efa37f1d", "Hello");
  socket.disconnect();
});


// Event: Listen for errors
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});