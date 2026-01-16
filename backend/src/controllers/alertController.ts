import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { getPriceCache } from '../services/priceService';
import { calculateAssetPerformance } from '../services/transactionService';

export const getAlertRules = async (req: Request, res: Response) => {
    try {
        const rules = await (prisma as any).alertRule.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(rules);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createAlertRule = async (req: Request, res: Response) => {
    try {
        const rule = await (prisma as any).alertRule.create({
            data: req.body
        });
        res.status(201).json(rule);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteAlertRule = async (req: Request, res: Response) => {
    try {
        await (prisma as any).alertRule.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAlertEvents = async (req: Request, res: Response) => {
    try {
        const events = await (prisma as any).alertEvent.findMany({
            orderBy: { triggeredAt: 'desc' },
            take: 50
        });
        res.json(events);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const markAlertAsRead = async (req: Request, res: Response) => {
    try {
        await (prisma as any).alertEvent.update({
            where: { id: req.params.id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const checkAlerts = async () => {
    try {
        const [rules, assets, prices]: [any[], any[], any] = await Promise.all([
            await (prisma as any).alertRule.findMany({ where: { enabled: true } }),
            await prisma.asset.findMany({ include: { transactions: true } }),
            await getPriceCache()
        ]);

        const totalNetWorth = assets.reduce((sum: number, asset: any) => {
            const priceKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = prices[priceKey] || asset.manualPrice || 0;
            const perf = calculateAssetPerformance(asset, asset.transactions, currentPrice);
            return sum + perf.currentValue;
        }, 0);

        for (const rule of rules) {
            if (rule.type === 'PRICE' && rule.assetId) {
                const asset = assets.find(a => a.id === rule.assetId);
                if (asset) {
                    const priceKey = `${asset.type}:${asset.symbol}`;
                    const currentPrice = prices[priceKey] || asset.manualPrice || 0;

                    const isTriggered = rule.direction === 'ABOVE'
                        ? currentPrice >= (rule.thresholdValue || 0)
                        : currentPrice <= (rule.thresholdValue || 0);

                    if (isTriggered) {
                        const message = `${asset.name} price is ${rule.direction.toLowerCase()} ${rule.thresholdValue} (Current: ${currentPrice})`;
                        await createAlertEvent(rule.id, message);
                    }
                }
            } else if (rule.type === 'ALLOCATION' && rule.assetType) {
                const typeTotal = assets
                    .filter(a => a.type === rule.assetType)
                    .reduce((sum: number, asset: any) => {
                        const priceKey = `${asset.type}:${asset.symbol}`;
                        const currentPrice = prices[priceKey] || asset.manualPrice || 0;
                        const perf = calculateAssetPerformance(asset, asset.transactions, currentPrice);
                        return sum + perf.currentValue;
                    }, 0);

                const currentPercent = (typeTotal / totalNetWorth) * 100;
                const isTriggered = rule.direction === 'ABOVE'
                    ? currentPercent >= (rule.thresholdPercent || 0)
                    : currentPercent <= (rule.thresholdPercent || 0);

                if (isTriggered) {
                    const message = `${rule.assetType} allocation is ${rule.direction.toLowerCase()} ${rule.thresholdPercent}% (Current: ${currentPercent.toFixed(2)}%)`;
                    await createAlertEvent(rule.id, message);
                }
            }
        }
    } catch (error) {
        console.error('[ALERTS] Error checking alerts:', error);
    }
};

async function createAlertEvent(ruleId: string, message: string) {
    // Prevent duplicate events for the same rule in the last hour
    const lastHour = new Date(Date.now() - 3600000);
    const recent = await (prisma as any).alertEvent.findFirst({
        where: {
            ruleId,
            message,
            triggeredAt: { gte: lastHour }
        }
    });

    if (!recent) {
        await (prisma as any).alertEvent.create({
            data: { ruleId, message }
        });
        console.log(`[ALERT] Triggered: ${message}`);
    }
}
