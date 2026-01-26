import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from './utils/passport';
import { verifyJWT } from './middleware/auth';

import assetRoutes from './routes/assetRoutes';
import stockRoutes from './routes/stockRoutes';
import transactionRoutes from './routes/transactionRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import backupRoutes from './routes/backupRoutes';
import alertRoutes from './routes/alertRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Auth routes don't need verification
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/assets', verifyJWT, assetRoutes);
app.use('/api/stocks', verifyJWT, stockRoutes);
app.use('/api/transactions', verifyJWT, transactionRoutes);
app.use('/api/portfolio', verifyJWT, portfolioRoutes);
app.use('/api/backup', verifyJWT, backupRoutes);
app.use('/api/alerts', verifyJWT, alertRoutes);

app.get('/health', (req, res) => {
    res.send('OK');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
