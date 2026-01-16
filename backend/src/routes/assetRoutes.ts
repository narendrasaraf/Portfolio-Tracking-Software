import { Router } from 'express';
import { getAssets, getAssetById, addAsset, deleteAsset, manualRefresh, updateAsset, sellAsset, getTransactions } from '../controllers/assetController';

const router = Router();

router.get('/', getAssets);
router.get('/transactions', getTransactions);
router.get('/:id', getAssetById);
router.post('/', addAsset);
router.put('/:id', updateAsset);
router.post('/:id/sell', sellAsset);
router.delete('/:id', deleteAsset);
router.post('/prices/refresh', manualRefresh);

export default router;
