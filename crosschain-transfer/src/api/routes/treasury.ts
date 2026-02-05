import { Router } from 'express';
import {
  configureTreasuryPolicy,
  getTreasuryPolicy,
  executeTreasuryPolicy,
  canExecuteTreasuryPolicy,
  getPoolsInfo,
} from '../controllers/treasury-controller.js';

const router = Router();

router.post('/policy/configure', configureTreasuryPolicy);
router.get('/policy/:address', getTreasuryPolicy);
router.post('/policy/execute', executeTreasuryPolicy);
router.get('/policy/can-execute/:address', canExecuteTreasuryPolicy);
router.get('/pools', getPoolsInfo);

export default router;
