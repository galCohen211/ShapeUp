import express from "express";
import { connectDb } from "./mongodb";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import "../src/controllers/user-controller";
import initRouter from "./routes/init-route";
import userRouter from "./routes/user-route";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Google OAuth
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Access variables using process.env
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use("/init", initRouter);
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
