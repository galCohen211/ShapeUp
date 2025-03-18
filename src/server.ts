import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import { Server } from 'socket.io';
import * as http from "http";
import path from 'path';

import { connectDb } from "./mongodb";
import { initChat } from "./chat/chat-server";
import "./controllers/auth-controller";
import GymRouter from "./routes/gym-route"
import userRouter from "./routes/user-route";
import reviewRouter from "./routes/review-route";
import chatAIRouter from "./routes/chat-ai-route";
import https from 'https';
import fs from "fs"

const app: any = express();
const swaggerDocument = yaml.load('./swagger.yaml');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/src/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/src/assets', express.static(path.join(__dirname, 'assets')));

// Google OAuth
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Use cookies
app.use(cookieParser());

// Access variables using process.env
const PORT = process.env.PORT || 3000;

const server = http.createServer();
export const socketIOServer = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

server.listen(3002, "0.0.0.0", () => {
  console.log("Chat server is running on port 3002");
});

initChat(socketIOServer);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:4000", "http://node05.cs.colman.ac.il"], // Allow both origins
    credentials: true, // Allow sending cookies
  })
);

app.use("/api/gyms", GymRouter);
app.use("/api/users", userRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/askChatAi", chatAIRouter);

export default app;

export async function startServer(port = PORT) {
  await connectDb();
  if (process.env.NODE_ENV != "production") {
  return app.listen(port, () => console.log(`Server is up at ${port}`));
  }
  else {
    const prop = {
      key: fs.readFileSync("../../client-key.pem"),
      cert: fs.readFileSync("../../client-cert.pem")
    }
    https.createServer(prop, app).listen(port)
  }
}

if (require.main === module) {
  (async () => {
    await startServer(PORT);
  })();
}
