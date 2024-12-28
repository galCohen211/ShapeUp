import express from "express";
import chatAIController from "../controllers/chat-ai-controller";

const router = express.Router();

router.post("/:id", chatAIController.ask_question);

export default router;
