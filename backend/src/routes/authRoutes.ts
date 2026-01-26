import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { verifyJWT } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, passwordHash });
        res.status(201).json({ success: true, message: 'User registered' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
        if (err || !user) return res.status(401).json({ error: info?.message || 'Login failed' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.json({ token, user: { id: user.id, email: user.email } });
    })(req, res, next);
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    // Redirect to frontend with token or just let it read cookie
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-callback?token=${token}`);
});

router.post('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.json({ success: true });
});

router.get('/me', verifyJWT, (req, res) => {
    const user = req.user as any;
    res.json({ id: user.id, email: user.email });
});

router.post('/change-password', verifyJWT, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById((req.user as any).id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // If user logged in via Google, they might not have a passwordHash yet
        if (user.passwordHash) {
            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
        }

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
