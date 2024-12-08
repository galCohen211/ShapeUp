import express from 'express';
import UserController from '../controllers/user-controller';

const router = express.Router();

router.get('/callback', UserController.loginGoogle);

export default router;
