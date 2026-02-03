import { Request, Response } from 'express';
import { circleClient } from '../config/circle';
import { v4 as uuidv4 } from 'uuid';

export const createUserToken = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        // In a real app, you would authenticate the user here.
        // For this hackathon/demo, we'll accept any userId or generate one.
        const finalUserId = userId || uuidv4();

        console.log(`Generating token for user: ${finalUserId}`);

        const response = await circleClient.createUserToken({
            userId: finalUserId,
        });

        res.json({
            userId: finalUserId,
            userToken: response.data?.userToken,
            encryptionKey: response.data?.encryptionKey,
        });
    } catch (error: any) {
        console.error('Error creating user token:', error);
        res.status(500).json({ error: error.message });
    }
};
