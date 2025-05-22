import { HfInference } from "@huggingface/inference";
import { Request, Response } from "express";
import User, { IUserType } from "../models/user-model";
import Gym from "../models/gym-model";

import fetch from "node-fetch";

export const askAI = async (question: string): Promise<string | null> => {
    const prompt = `<|system|>You are a helpful assistant.<|user|>${question}<|assistant|>`;
    let API_KEY = process.env.AI_API_KEY || "01234567890123456789012345678901";
    const response = await fetch("https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
        },
      }),
    });
    if (!response.ok) {
      console.error("Error response:", response.statusText);
      return null;
    }
    const raw = await response.text();
    try {
      const result = JSON.parse(raw);
      const generated = result[0]?.generated_text ?? "";
      const output = generated.replace(prompt, "").trim();
      return output;
    } catch (err) {
      console.error("JSON parse error:", err, raw);
      return null;
    }
  };



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
            res.status(404).json({ message: "User or Gym Owner not found" });
            return;
          }
      
          const aiResponse = await askAI(question);
      
          if (!aiResponse) {
            res.status(500).json({ error: "AI response error" });
            return;
          }
      
          res.status(200).json({ message: aiResponse });
        } catch (err) {
          console.error("Error in ask_question:", err);
          res.status(500).json({ error: "Internal server error", message: err });
        }
      }
      
}

export default chatAIController;
