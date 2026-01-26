"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyChange = exports.getHistory = exports.createDailySnapshot = exports.syncMissingSnapshots = void 0;
const db_1 = require("../utils/db");
const priceService_1 = require("../services/priceService");
const transactionService_1 = require("../services/transactionService");
const syncMissingSnapshots = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const firstTx = yield db_1.prisma.assetTransaction.findFirst({
            orderBy: { date: 'asc' }
        });
        if (!firstTx)
            return;
        let currentDate = new Date(firstTx.date);
        currentDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const assets = yield db_1.prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = yield (0, priceService_1.getPriceCache)();
        console.log(`[HISTORY] Starting backfill from ${currentDate.toISOString().split('T')[0]} to today.`);
        while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0];
            let totalNetWorth = 0;
            let totalInvested = 0;
            assets.forEach((asset) => {
                const txUpToDate = asset.transactions.filter((tx) => {
                    const txDate = new Date(tx.date);
                    txDate.setHours(0, 0, 0, 0);
                    return txDate <= currentDate;
                });
                if (txUpToDate.length === 0)
                    return;
                const priceKey = `${asset.type}:${asset.symbol}`;
                let currentPrice = asset.manualPrice || 0;
                const priceInfo = prices[priceKey];
                if (priceInfo) {
                    currentPrice = priceInfo.current;
                }
                else if (asset.type === 'CASH') {
                    currentPrice = 1;
                }
                // Handle Silver manual price (per KG -> per Gram)
                if (asset.type === 'SILVER' && asset.manualPrice) {
                    currentPrice = asset.manualPrice / 1000;
                }
                const performance = (0, transactionService_1.calculateAssetPerformance)(asset, txUpToDate, currentPrice);
                totalNetWorth += performance.currentValue;
                totalInvested += performance.totalInvested;
            });
            yield db_1.prisma.portfolioSnapshot.upsert({
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
    }
    catch (error) {
        console.error('[HISTORY] Error backfilling snapshots:', error);
    }
});
exports.syncMissingSnapshots = syncMissingSnapshots;
const createDailySnapshot = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date().toISOString().split('T')[0];
        // First, ensure all past days have snapshots
        yield (0, exports.syncMissingSnapshots)();
        const assets = yield db_1.prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = yield (0, priceService_1.getPriceCache)();
        let totalNetWorth = 0;
        let totalInvested = 0;
        assets.forEach((asset) => {
            const priceKey = `${asset.type}:${asset.symbol}`;
            let currentPrice = asset.manualPrice || 0;
            const priceInfo = prices[priceKey];
            if (priceInfo) {
                currentPrice = priceInfo.current;
            }
            else if (asset.type === 'CASH') {
                currentPrice = 1;
            }
            // Handle Silver manual price (per KG -> per Gram)
            if (asset.type === 'SILVER' && asset.manualPrice) {
                currentPrice = asset.manualPrice / 1000;
            }
            const performance = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
            totalNetWorth += performance.currentValue;
            totalInvested += performance.totalInvested;
        });
        const profitLoss = totalNetWorth - totalInvested;
        yield db_1.prisma.portfolioSnapshot.upsert({
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
    }
    catch (error) {
        console.error('[SNAPSHOT] Error creating daily snapshot:', error);
    }
});
exports.createDailySnapshot = createDailySnapshot;
const getHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { range } = req.query;
    try {
        let dateFilter = {};
        const now = new Date();
        if (range === '7D') {
            const last7Days = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            dateFilter = { gte: last7Days };
        }
        else if (range === '1M') {
            const last30Days = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
            dateFilter = { gte: last30Days };
        }
        else if (range === '3M') {
            const last90Days = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
            dateFilter = { gte: last90Days };
        }
        else if (range === '1Y') {
            const lastYear = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
            dateFilter = { gte: lastYear };
        }
        const snapshots = yield db_1.prisma.portfolioSnapshot.findMany({
            where: {
                date: dateFilter
            },
            orderBy: { date: 'asc' }
        });
        res.json({
            range,
            points: snapshots
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getHistory = getHistory;
const getDailyChange = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Get exactly yesterday's date string
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        // 1. Get netWorthYesterdayInr from exactly yesterday's snapshot
        const yesterdaySnapshot = yield db_1.prisma.portfolioSnapshot.findUnique({
            where: { date: yesterdayStr }
        });
        const netWorthYesterdayInr = (yesterdaySnapshot === null || yesterdaySnapshot === void 0 ? void 0 : yesterdaySnapshot.netWorthInr) || null;
        // 2. Calculate netWorthTodayInr live (current calculated portfolio value)
        const assets = yield db_1.prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = yield (0, priceService_1.getPriceCache)();
        let netWorthTodayInr = 0;
        assets.forEach((asset) => {
            const isMetal = asset.type === 'GOLD' || asset.type === 'SILVER';
            const priceKey = isMetal ? `${asset.type}:LIVE` : `${asset.type}:${asset.symbol}`;
            const priceInfo = prices[priceKey];
            let currentPrice = asset.manualPrice || 0;
            if (priceInfo && !isMetal) {
                currentPrice = priceInfo.current;
            }
            else if (asset.type === 'CASH') {
                currentPrice = 1;
            }
            // Handle Silver manual price (per KG -> per Gram)
            if (asset.type === 'SILVER' && asset.manualPrice) {
                currentPrice = asset.manualPrice / 1000;
            }
            const performance = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
            netWorthTodayInr += performance.currentValue;
        });
        // 3. Calculate gain/loss logic
        // Formula: dailyGainInr = netWorthTodayInr - netWorthYesterdayInr
        // Formula: dailyGainPercent = (dailyGainInr / netWorthYesterdayInr) * 100
        let dailyChangeInr = null;
        let dailyChangePercent = null;
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getDailyChange = getDailyChange;
