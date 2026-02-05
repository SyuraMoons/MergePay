import { Router } from 'express';
import {
  executeCctpTransfer,
  resumeCctpTransfer,
  getCctpStatus,
} from '../controllers/transfer-controller.js';

const router = Router();

router.post('/cctp', executeCctpTransfer);
router.post('/cctp/resume', resumeCctpTransfer);
router.get('/cctp/status/:txHash', getCctpStatus);

export default router;
