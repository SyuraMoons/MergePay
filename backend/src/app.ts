import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

import userRoutes from './routes/userRoutes';
import walletRoutes from './routes/walletRoutes';

app.use('/api/users', userRoutes);
app.use('/api/wallets', walletRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'backend' });
});

export default app;
