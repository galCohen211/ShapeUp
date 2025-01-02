import express from "express";
import chatAIController from "../controllers/chat-ai-controller";
import { IUserType } from "../models/user-model";
import verifyToken from "../middleware/verifyToken";

const router = express.Router();

router.post("/:id", verifyToken([IUserType.USER]), chatAIController.ask_question);
/**
 * @swagger
 * /askChatAi/{id}:
 *   put:
 *     summary: Ask chat AI a question.
 *     description: Ask chat AI a question.
 *     tags:
 *       - chatAI
 *     security:
 *       - bearerAuth: []  
 *     parameters:
 *       - in: header
 *         name: access_token
 *         required: true
 *         description: The current refresh token of the user.
 *         schema:
 *           type: string
 *           example: JWT 60d0fe4f5311236168a109ca
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *           example: '60c72b2f5f1b2c001fbcf73f'
 *     responses:
 *       '200':
 *         description: Successfully got the chat AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'The answer is: ...'
 *       '404':
 *         description: User not found or not enough time has passed since last reuqest
 *       '500':
 *         description: Internal server error
 */


export default router;
