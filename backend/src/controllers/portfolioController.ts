import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { getPriceCache } from '../services/priceService';
import { calculateAssetPerformance } from '../services/transactionService';

export const syncMissingSnapshots = async () => {
    try {
        const firstTx = await prisma.assetTransaction.findFirst({
            orderBy: { date: 'asc' }
        });
        if (!firstTx) return;

        let currentDate = new Date(firstTx.date);
        currentDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const assets = await prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = await getPriceCache();

        console.log(`[HISTORY] Starting backfill from ${currentDate.toISOString().split('T')[0]} to today.`);

        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            let totalNetWorth = 0;
            let totalInvested = 0;

            assets.forEach((asset: any) => {
                const txUpToDate = asset.transactions.filter((tx: any) => {
                    const txDate = new Date(tx.date);
                    txDate.setHours(0, 0, 0, 0);
                    return txDate <= currentDate;
                });

                if (txUpToDate.length === 0) return;

                const priceKey = `${asset.type}:${asset.symbol}`;
                let currentPrice = asset.manualPrice || 0;

                const priceInfo = prices[priceKey];
                if (priceInfo) {
                    currentPrice = priceInfo.current;
                } else if (asset.type === 'CASH') {
                    currentPrice = 1;
                }

                // Handle Silver manual price (per KG -> per Gram)
                if (asset.type === 'SILVER' && asset.manualPrice) {
                    currentPrice = asset.manualPrice / 1000;
                }

                const performance = calculateAssetPerformance(asset, txUpToDate, currentPrice);
                totalNetWorth += performance.currentValue;
                totalInvested += performance.totalInvested;
            });

            await prisma.portfolioSnapshot.upsert({
                where: { date: dateStr },
                update: {
                    netWorthInr: totalNetWorth,
                    investedInr: totalInvested,
                    profitLossInr: totalNetWorth - totalInvested
                },
                create: {
                    date: dateStr,
                    netWorthInr: totalNetWorth,
                    investedInr: totalInvested,
                    profitLossInr: totalNetWorth - totalInvested
                }
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        console.log(`[HISTORY] Backfill complete.`);
    } catch (error) {
        console.error('[HISTORY] Error backfilling snapshots:', error);
    }
};

export const createDailySnapshot = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // First, ensure all past days have snapshots
        await syncMissingSnapshots();

        const assets = await prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = await getPriceCache();

        let totalNetWorth = 0;
        let totalInvested = 0;

        assets.forEach((asset: any) => {
            const priceKey = `${asset.type}:${asset.symbol}`;
            let currentPrice = asset.manualPrice || 0;

            const priceInfo = prices[priceKey];
            if (priceInfo) {
                currentPrice = priceInfo.current;
            } else if (asset.type === 'CASH') {
                currentPrice = 1;
            }

            // Handle Silver manual price (per KG -> per Gram)
            if (asset.type === 'SILVER' && asset.manualPrice) {
                currentPrice = asset.manualPrice / 1000;
            }

            const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);
            totalNetWorth += performance.currentValue;
            totalInvested += performance.totalInvested;
        });

        const profitLoss = totalNetWorth - totalInvested;

        await prisma.portfolioSnapshot.upsert({
            where: { date: today },
            update: {
                netWorthInr: totalNetWorth,
                investedInr: totalInvested,
                profitLossInr: profitLoss
            },
            create: {
                date: today,
                netWorthInr: totalNetWorth,
                investedInr: totalInvested,
                profitLossInr: profitLoss
            }
        });

        console.log(`[SNAPSHOT] Updated daily snapshot for ${today}. Net Worth: ₹${totalNetWorth.toFixed(2)}`);
    } catch (error) {
        console.error('[SNAPSHOT] Error creating daily snapshot:', error);
    }
};

export const getHistory = async (req: Request, res: Response) => {
    const { range } = req.query;
    try {
        let dateFilter: any = {};
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

        // Get exactly yesterday's date string
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        // 1. Get netWorthYesterdayInr from exactly yesterday's snapshot
        const yesterdaySnapshot = await prisma.portfolioSnapshot.findUnique({
            where: { date: yesterdayStr }
        });

        const netWorthYesterdayInr: number | null = yesterdaySnapshot?.netWorthInr || null;

        // 2. Calculate netWorthTodayInr live (current calculated portfolio value)
        const assets = await prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = await getPriceCache();

        let netWorthTodayInr = 0;
        assets.forEach((asset: any) => {
            const isMetal = asset.type === 'GOLD' || asset.type === 'SILVER';
            const priceKey = isMetal ? `${asset.type}:LIVE` : `${asset.type}:${asset.symbol}`;

            const priceInfo = prices[priceKey];
            let currentPrice = asset.manualPrice || 0;

            if (priceInfo && !isMetal) {
                currentPrice = priceInfo.current;
            } else if (asset.type === 'CASH') {
                currentPrice = 1;
            }

            // Handle Silver manual price (per KG -> per Gram)
            if (asset.type === 'SILVER' && asset.manualPrice) {
                currentPrice = asset.manualPrice / 1000;
            }

            const performance = calculateAssetPerformance(asset, asset.transactions, currentPrice);
            netWorthTodayInr += performance.currentValue;
        });

        // 3. Calculate gain/loss logic
        // Formula: dailyGainInr = netWorthTodayInr - netWorthYesterdayInr
        // Formula: dailyGainPercent = (dailyGainInr / netWorthYesterdayInr) * 100
        let dailyChangeInr: number | null = null;
        let dailyChangePercent: number | null = null;

        if (netWorthYesterdayInr !== null && netWorthYesterdayInr > 0) {
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
