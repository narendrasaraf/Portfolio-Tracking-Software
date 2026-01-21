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
            const isMetal = asset.type === 'GOLD' || asset.type === 'SILVER';
            const priceKey = isMetal ? `${asset.type}:LIVE` : `${asset.type}:${asset.symbol}`;

            const priceInfo = prices[priceKey];
            let currentPrice = asset.manualPrice || 0;
            let prevPrice = null;

            if (priceInfo && !isMetal) {
                currentPrice = priceInfo.current;
                prevPrice = priceInfo.prev;
            } else if (asset.type === 'CASH') {
                currentPrice = 1;
            }

            const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);

            // Manual valuation adjustment for metals
            if (isMetal) {
                if (asset.type === 'SILVER' && asset.manualPrice) {
                    // Convert Price per KG to Price per Gram
                    currentPrice = asset.manualPrice / 1000;
                    const adjustedPerformance = calculateAssetPerformance(asset, asset.transactions, currentPrice);
                    Object.assign(performance, adjustedPerformance);
                } else if (asset.type === 'GOLD' && asset.manualPrice) {
                    // Gold is already per gram, performance already uses currentPrice = asset.manualPrice
                }
            }

            // Calculate daily change (only if we have historical price data, not typically for manual metals unless we track history)
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
        const isMetal = asset.type === 'GOLD' || asset.type === 'SILVER';
        const priceKey = isMetal ? `${asset.type}:LIVE` : `${asset.type}:${asset.symbol}`;

        const priceInfo = prices[priceKey];
        let currentPrice = asset.manualPrice || 0;

        if (priceInfo && !isMetal) {
            currentPrice = priceInfo.current;
        } else if (asset.type === 'CASH') {
            currentPrice = 1;
        }

        const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);

        // Manual valuation adjustment for metals
        if (isMetal) {
            if (asset.type === 'SILVER' && asset.manualPrice) {
                // Convert Price per KG to Price per Gram
                currentPrice = asset.manualPrice / 1000;
                const adjustedPerformance = calculateAssetPerformance(asset, asset.transactions, currentPrice);
                Object.assign(performance, adjustedPerformance);
            }
        }

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
                    date: validated.date ? new Date(validated.date) : new Date(),
                    notes: 'Initial purchase'
                }
            });
        }

        refreshPrices().then(() => createDailySnapshot()).catch(console.error);
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
                manualCurrentValue: validated.manualCurrentValue,
                type: validated.type
            } as any
        });

        // Update the initial purchase date if provided
        if ((validated as any).date) {
            const initialTx = await prisma.assetTransaction.findFirst({
                where: { assetId: id },
                orderBy: { date: 'asc' }
            });

            if (initialTx) {
                await prisma.assetTransaction.update({
                    where: { id: initialTx.id },
                    data: { date: new Date((validated as any).date) }
                });
            }
        }

        if (validated.type || validated.symbol || (validated as any).date) {
            refreshPrices().then(() => createDailySnapshot()).catch(console.error);
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
