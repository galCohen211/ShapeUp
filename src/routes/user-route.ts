import express from 'express';
import UserController from '../controllers/user-controller';

const router = express.Router();

router.post('/callback', UserController.loginGoogle);

export default router;
