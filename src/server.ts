import express from "express";
import { connectDb } from "./mongodb";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import cookieParser from "cookie-parser";

import "./controllers/auth-controller";
import initRouter from "./routes/init-route";
import GymRouter from "./routes/gym-route"
import userRouter from "./routes/user-route";

const app: any = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Google OAuth
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Use cookies
app.use(cookieParser());

// Access variables using process.env
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use("/init", initRouter);
app.use("/gyms", GymRouter);
app.use("/users", userRouter);

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
