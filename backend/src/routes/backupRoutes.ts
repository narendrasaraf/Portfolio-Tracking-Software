import { Router } from 'express';
import { exportData, importData } from '../controllers/backupController';

const router = Router();

router.get('/export', exportData);
router.post('/import', importData);

export default router;
