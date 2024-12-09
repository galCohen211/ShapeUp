import express from "express";
import { connectDb } from "./mongodb";
import initRouter from "./routes/init-route";
import GymRouter from "./routes/gym-route"

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Access variables using process.env
const PORT = process.env.PORT || 3000;

app.use("/init", initRouter);
app.use("/gyms", GymRouter);

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
