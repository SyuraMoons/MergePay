import { Router } from 'express';
import {
  depositToGateway,
  transferViaGateway,
  getGatewayBalance,
} from '../controllers/gateway-controller.js';

const router = Router();

router.post('/deposit', depositToGateway);
router.post('/transfer', transferViaGateway);
router.get('/balance', getGatewayBalance);

export default router;
