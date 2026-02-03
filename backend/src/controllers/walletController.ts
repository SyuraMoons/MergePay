import { Request, Response } from 'express';
import { circleClient } from '../config/circle';
import { v4 as uuidv4 } from 'uuid';

export const initializeWallet = async (req: Request, res: Response) => {
    try {
        const { userId, blockchains } = req.body;

        if (!userId) {
            res.status(400).json({ error: 'userId is required' });
            return;
        }

        // In a real app, userToken should be passed or retrieved securely.
        // For this demo, we assume the client might pass a raw user token OR we regenerate it if needed.
        // However, createUserPin requires a USER TOKEN.
        // The previous endpoint /token returns a userToken. The frontend should pass it here?
        // OR we can just generate a new one since they are short lived.
        // Best practice: Frontend sends session token, Backend calls Circle.
        // Let's assume frontend sends { userToken }.

        const { userToken } = req.body;

        if (!userToken) {
            // If no token provided, we could try to generate one, but it's better to require it.
            // Actually, for simplicity, let's generate one if missing? 
            // No, 'createUserPin' takes a userToken.
            res.status(400).json({ error: 'userToken is required' });
            return;
        }

        console.log(`Initializing wallet for user: ${userId}`);

        // Create a challenge to set up the PIN
        const response = await circleClient.createUserPin({
            userToken,
            idempotencyKey: uuidv4(),
        });

        res.json({
            challengeId: response.data?.challengeId,
        });

    } catch (error: any) {
        console.error('Error initializing wallet:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createTransfer = async (req: Request, res: Response) => {
    // Implement later
    res.json({ status: 'not_implemented' });
};
