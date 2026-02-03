import { Router } from 'express';
import { createUserToken } from '../controllers/userController';

const router = Router();

router.post('/token', createUserToken);

export default router;
