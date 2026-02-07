import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY || 'test-api-key';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== API_KEY) {
        res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid API Key',
        });
        return;
    }

    next();
}
