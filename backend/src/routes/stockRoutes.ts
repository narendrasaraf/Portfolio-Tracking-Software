import { Router } from 'express';
import * as stockController from '../controllers/stockController';

const router = Router();

router.get('/quotes', stockController.getStockQuotes);

export default router;
