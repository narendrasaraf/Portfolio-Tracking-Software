import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { assetSchema } from '../validation/schemas';
import { refreshPrices, getPriceCache } from '../services/priceService';
import { calculateAssetPerformance } from '../services/transactionService';
import { createDailySnapshot } from './portfolioController';
import { checkAlerts } from './alertController';

export const getAssets = async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = await getPriceCache();
        const usdtInrRate = (await prisma.priceCache.findUnique({ where: { key: 'METADATA:USDT_INR' } }))?.priceInInr || 83.5;

        // Calculate current values based on transactions
        const data = assets.map(asset => {
            const priceKey = `${asset.type}:${asset.symbol}`;
            const priceInfo = prices[priceKey];
            let currentPrice = asset.manualPrice || 0;
            let prevPrice = null;

            if (priceInfo) {
                currentPrice = priceInfo.current;
                prevPrice = priceInfo.prev;
            } else if (asset.type === 'CASH') {
                currentPrice = 1;
            }

            const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);

            // Calculate daily change
            let dailyChangeInr = 0;
            let dailyChangePercent = 0;
            if (prevPrice && prevPrice > 0) {
                dailyChangeInr = (currentPrice - prevPrice) * (performance.holdingQuantity || 0);
                dailyChangePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
            }

            return {
                ...asset,
                ...performance,
                currentPrice,
                dailyChangeInr,
                dailyChangePercent
            };
        });

        res.json({
            assets: data,
            metadata: { conversionRate: usdtInrRate }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAssetById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const asset = await prisma.asset.findUnique({
            where: { id },
            include: { transactions: { orderBy: { date: 'desc' } } }
        });

        if (!asset) return res.status(404).json({ error: "Asset not found" });

        const prices = await getPriceCache();
        const priceKey = `${asset.type}:${asset.symbol}`;
        const priceInfo = prices[priceKey];
        let currentPrice = asset.manualPrice || 0;
        let prevPrice = null;

        if (priceInfo) {
            currentPrice = priceInfo.current;
            prevPrice = priceInfo.prev;
        } else if (asset.type === 'CASH') {
            currentPrice = 1;
        }

        const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);

        res.json({
            ...asset,
            ...performance,
            currentPrice
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

export const addAsset = async (req: Request, res: Response) => {
    try {
        const validated = assetSchema.parse(req.body);
        if (validated.type === 'CRYPTO' && validated.symbol) {
            validated.symbol = validated.symbol.toUpperCase();
        }

        // We still need quantity and investedAmount for the initial transaction
        // extract them from validated
        const { quantity, investedAmount, ...assetData } = validated;

        const asset = await prisma.asset.create({
            data: assetData
        });

        // Record initial BUY Transaction
        if (quantity > 0) {
            await prisma.assetTransaction.create({
                data: {
                    assetId: asset.id,
                    type: 'BUY',
                    quantity: Number(quantity),
                    pricePerUnit: Number(investedAmount) / Number(quantity),
                    date: new Date(),
                    notes: 'Initial purchase'
                }
            });
        }

        refreshPrices().catch(console.error);
        res.json(asset);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Only update static fields like name, symbol, manualPrice. 
        // Qty/Inv are now derived.
        const validated = assetSchema.partial().parse(req.body);
        if (validated.type === 'CRYPTO' && validated.symbol) {
            validated.symbol = validated.symbol.toUpperCase();
        }

        const asset = await prisma.asset.update({
            where: { id },
            data: {
                name: validated.name,
                symbol: validated.symbol,
                platform: (validated as any).platform,
                manualPrice: validated.manualPrice,
                type: validated.type
            } as any
        });

        if (validated.type || validated.symbol) {
            refreshPrices().catch(console.error);
        }

        res.json(asset);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const sellAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { quantity, price, fees, notes, date } = req.body;

        await prisma.assetTransaction.create({
            data: {
                assetId: id,
                type: 'SELL',
                quantity: Number(quantity),
                pricePerUnit: Number(price),
                fees: Number(fees || 0),
                notes: notes || 'Direct sale',
                date: date ? new Date(date) : new Date()
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.assetTransaction.findMany({
            include: { asset: true },
            orderBy: { date: 'desc' }
        });
        const conversionRate = (await prisma.priceCache.findUnique({ where: { key: 'METADATA:USDT_INR' } }))?.priceInInr || 83.5;
        res.json({ transactions, metadata: { conversionRate } });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        await prisma.asset.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const manualRefresh = async (req: Request, res: Response) => {
    try {
        await refreshPrices(true);
        await createDailySnapshot();
        await checkAlerts();
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
