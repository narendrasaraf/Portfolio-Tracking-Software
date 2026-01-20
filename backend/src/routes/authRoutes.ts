import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.post('/login', (req, res) => {
    const { password } = req.body;

    // Get password from environment variable or fallback for development
    // In production, ALWAYS use the environment variable
    const adminPassword = process.env.ADMIN_PASSWORD || 'Narendra16@';

    if (password === adminPassword) {
        res.status(200).json({ success: true, message: 'Authenticated successfully' });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});

export default router;
