import { Router } from 'express';
import {
    getAlertRules,
    createAlertRule,
    deleteAlertRule,
    getAlertEvents,
    markAlertAsRead
} from '../controllers/alertController';

const router = Router();

router.get('/rules', getAlertRules);
router.post('/rules', createAlertRule);
router.delete('/rules/:id', deleteAlertRule);
router.get('/events', getAlertEvents);
router.patch('/events/:id/read', markAlertAsRead);

export default router;
