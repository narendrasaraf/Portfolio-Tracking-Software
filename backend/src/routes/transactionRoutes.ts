import { Router } from 'express';
import { addTransaction, deleteTransaction } from '../controllers/transactionController';

const router = Router();

router.post('/', addTransaction);
router.delete('/:id', deleteTransaction);

export default router;
