import { HfInference } from "@huggingface/inference";
import { Request, Response } from "express";
import User, { IUserType } from "../models/user-model";

class chatAIController {
    static async ask_question(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            const { question } = req.body;

            if (!question) {
                res.status(400).json({ error: "Question is required" });
                return;
            }

            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            const hf = new HfInference(process.env.AI_API_KEY);
            const response = await hf.textGeneration({
                model: "tiiuae/falcon-7b-instruct",
                inputs: question,
            });

            if (!response || !response.generated_text) {
                res.status(500).json({ error: "AI response error" });
                return;
            }

            let filtered_response_text = response.generated_text.substring(question.length);
            user.chatGptAccess = new Date();
            await user.save(); // Fix: Save the updated user

            res.status(200).json({ message: filtered_response_text, date: user.chatGptAccess });
        } catch (err) {
            console.error("Error in ask_question:", err);
            res.status(500).json({ error: "Internal server error", message: err });
        }
    }
}

export default chatAIController;
