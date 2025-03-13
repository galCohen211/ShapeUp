import { HfInference } from "@huggingface/inference";
import { Request, Response } from "express";
import User, { IUserType } from "../models/user-model";

class chatAIController {
    static async ask_question(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            const { question } = req.body;
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            
            const hf = new HfInference(process.env.AI_API_KEY);
            const response = await hf.textGeneration({
            model: "tiiuae/falcon-7b-instruct",
            inputs: `${question}`,
            });
            
            let filtered_response_text = response.generated_text.substring(question.length);
            user.chatGptAccess = new Date();
            res.status(200).json({ message: filtered_response_text, date: user.chatGptAccess });
        } catch (error) {
            res.status(500).json({ error: "Internal server error", message: error });
            return;
        }    
        
    }
}

export default chatAIController;
