import { initiateUserControlledWalletsClient } from '@circle-fin/user-controlled-wallets';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.CIRCLE_API_KEY;

if (!apiKey) {
    throw new Error('CIRCLE_API_KEY is required in .env');
}

export const circleClient = initiateUserControlledWalletsClient({
    apiKey,
});
