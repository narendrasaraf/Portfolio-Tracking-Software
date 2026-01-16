import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { getPriceCache } from '../services/priceService';
import { calculateAssetPerformance } from '../services/transactionService';

export const createDailySnapshot = async () => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if snapshot already exists for today
        const existing = await prisma.portfolioSnapshot.findUnique({
            where: { date: today }
        });

        if (existing) {
            console.log(`[SNAPSHOT] Today's snapshot (${today}) already exists. skipping.`);
            return;
        }

        // Calculate current state
        const assets = await prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = await getPriceCache();

        let totalNetWorth = 0;
        let totalInvested = 0;

        assets.forEach(asset => {
            const priceKey = `${asset.type}:${asset.symbol}`;
            let currentPrice = asset.manualPrice || 0;

            if (prices[priceKey]) {
                currentPrice = prices[priceKey];
            } else if (asset.type === 'CASH') {
                currentPrice = 1;
            }

            const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);
            totalNetWorth += performance.currentValue;
            totalInvested += performance.totalInvested;
        });

        const profitLoss = totalNetWorth - totalInvested;

        await prisma.portfolioSnapshot.create({
            data: {
                date: today,
                netWorthInr: totalNetWorth,
                investedInr: totalInvested,
                profitLossInr: profitLoss
            }
        });

        console.log(`[SNAPSHOT] Created daily snapshot for ${today}. Net Worth: ₹${totalNetWorth.toFixed(2)}`);
    } catch (error) {
        console.error('[SNAPSHOT] Error creating daily snapshot:', error);
    }
};

export const getHistory = async (req: Request, res: Response) => {
    const { range } = req.query;
    try {
        let dateFilter = {};
        const now = new Date();

        if (range === '7D') {
            const last7Days = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            dateFilter = { gte: last7Days };
        } else if (range === '1M') {
            const last30Days = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
            dateFilter = { gte: last30Days };
        } else if (range === '3M') {
            const last90Days = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
            dateFilter = { gte: last90Days };
        } else if (range === '1Y') {
            const lastYear = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
            dateFilter = { gte: lastYear };
        }

        const snapshots = await prisma.portfolioSnapshot.findMany({
            where: {
                date: dateFilter
            },
            orderBy: { date: 'asc' }
        });

        res.json({
            range,
            points: snapshots
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDailyChange = async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get yesterday's snapshot
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        const [yesterdaySnapshot, todaySnapshot] = await Promise.all([
            prisma.portfolioSnapshot.findUnique({ where: { date: yesterdayStr } }),
            prisma.portfolioSnapshot.findUnique({ where: { date: today } })
        ]);

        // Fallback: If today's snapshot isn't created yet, we can't show a stable "today" vs "yesterday"
        // but for immediate UI feedback, we'll return what we have.
        // If today is missing, the frontend will likely trigger a refresh which creates it.

        const netWorthTodayInr = todaySnapshot?.netWorthInr || 0;
        const netWorthYesterdayInr = yesterdaySnapshot?.netWorthInr || null;

        let dailyChangeInr = null;
        let dailyChangePercent = null;

        if (netWorthYesterdayInr && netWorthYesterdayInr > 0 && netWorthTodayInr > 0) {
            dailyChangeInr = netWorthTodayInr - netWorthYesterdayInr;
            dailyChangePercent = (dailyChangeInr / netWorthYesterdayInr) * 100;
        }

        res.json({
            today,
            yesterday: yesterdayStr,
            netWorthTodayInr,
            netWorthYesterdayInr,
            dailyChangeInr,
            dailyChangePercent
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
