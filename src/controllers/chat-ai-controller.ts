import { HfInference } from "@huggingface/inference";
import { Request, Response } from "express";
import User, { IUserType } from "../models/user-model";
import Gym from "../models/gym-model";

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
            const owner = await Gym.findById(userId);

            if (!user && !owner) {
                res.status(404).json({ message: "User Or Gym Owner not found" });
                return;
            }

            const hf = new HfInference(process.env.AI_API_KEY);
            const response = await hf.textGeneration({
                model: "tiiuae/falcon-7b-instruct",
                inputs: question,
                parameters: {
                    temperature: 0.7, 
                    top_p: 0.9, 
                }
            });

            if (!response || !response.generated_text) {
                res.status(500).json({ error: "AI response error" });
                return;
            }

            let filtered_response_text = response.generated_text.substring(question.length);

            res.status(200).json({ message: filtered_response_text});

        } catch (err) {
            console.error("Error in ask_question:", err);
            res.status(500).json({ error: "Internal server error", message: err });
        }
    }
}

export default chatAIController;
