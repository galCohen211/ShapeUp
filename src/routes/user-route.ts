import express from 'express';
import UserController from '../controllers/user-controller';

const router = express.Router();

router.post('/google', (req, res) => {
    UserController.googleLogin}); //get



export default router;
