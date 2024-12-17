import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://localhost:3001"; 
const PATH = "/users-chat";

const socket: Socket = io(SERVER_URL, {
  path: PATH, 
  transports: ["websocket", "polling"], 
});

// Event: Successful connection
socket.on("connect", () => {
  console.log("Connected to the server with socket ID:", socket.id);

  socket.emit("add_user", "12345");
  socket.emit("add_user", "6789");
  socket.emit("communicate", "6789", "12345", "Hello");
});

// Event: Listen for disconnection
socket.on("disconnect", () => {
  console.log("Disconnected from the server.");
});

// Event: Listen for errors
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});
