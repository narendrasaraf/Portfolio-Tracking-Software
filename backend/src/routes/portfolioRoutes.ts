import { Router } from 'express';
import { getHistory, getDailyChange } from '../controllers/portfolioController';

const router = Router();

router.get('/history', getHistory);
router.get('/daily-change', getDailyChange);

export default router;
