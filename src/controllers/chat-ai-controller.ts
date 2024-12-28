import { HfInference } from "@huggingface/inference";
import { Request, Response } from "express";
import User, { IUserType } from "../models/user-model";

class chatAIController {
    static async ask_question(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }
            if(user.chatGptAccess != undefined && Date.now.getTime() - user.chatGptAccess < 1000 * 60 * 60 * 24)
            {
                res.status(404).json({ message: "Not enough time has passed" });
                return;
            }
            const hf = new HfInference(process.env.AI_API_KEY);
            const question = "Hi, I want you to help me generate a workout program. My focus is legs. I workout 4 times a week. I'm a male Don't ask any additional questions"
            const response = await hf.textGeneration({
            model: "tiiuae/falcon-7b-instruct",
            inputs: `${question}`,
            });
            let filtered_response_text = response.generated_text.substring(question.length);
            user.chatGptAccess = Date.now;
            await user.save();
            res.status(200).json({ message: filtered_response_text });
        } catch (error) {
            res.status(500).json({ error: "Error in server" });
            return;
        }    
        
    }
}

export default chatAIController;
