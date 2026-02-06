import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

const cctpTransferSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid private key'),
});

export function validateCctpTransfer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    cctpTransferSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues, // Zod v3 uses .issues
      });
      return;
    }
    next(error);
  }
}
