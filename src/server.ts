import express from "express";
import { connectDb } from "./mongodb";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";
import swaggerUi from 'swagger-ui-express';
import yaml from 'yamljs';
import { Server } from 'socket.io';
import * as http from "http";

import { initChat } from "./chat/chat-server";
import "./controllers/auth-controller";
import initRouter from "./routes/init-route";
import GymRouter from "./routes/gym-route"
import userRouter from "./routes/user-route";
import reviewRouter from "./routes/review-route";

const app: any = express();
const swaggerDocument = yaml.load('./swagger.yaml');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Google OAuth
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Use cookies
app.use(cookieParser());

// Access variables using process.env
const PORT = process.env.PORT || 3000;

// const server = http.createServer();
// const socketIOServer = new Server(server, {
//   path: "/users-chat",
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });
// initChat(socketIOServer)
// server.listen(process.env.HTTP_SERVER_PORT, () => {
//   console.log("Socket.IO server running on http://localhost:" + process.env.HTTP_SERVER_PORT);
// });

app.use(cors());
app.use("/init", initRouter);
app.use("/gyms", GymRouter);
app.use("/users", userRouter);
app.use("/reviews", reviewRouter);

export default app;

export async function startServer(port = PORT) {
  await connectDb();
  return app.listen(port, () => console.log(`Server is up at ${port}`));
}

if (require.main === module) {
  (async () => {
    await startServer(PORT);
  })();
}
