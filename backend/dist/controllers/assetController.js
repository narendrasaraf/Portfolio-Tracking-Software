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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualRefresh = exports.deleteAsset = exports.getTransactions = exports.sellAsset = exports.updateAsset = exports.addAsset = exports.getAssetById = exports.getAssets = void 0;
const db_1 = require("../utils/db");
const schemas_1 = require("../validation/schemas");
const priceService_1 = require("../services/priceService");
const transactionService_1 = require("../services/transactionService");
const portfolioController_1 = require("./portfolioController");
const alertController_1 = require("./alertController");
const getAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const assets = yield db_1.prisma.asset.findMany({
            include: { transactions: true }
        });
        const prices = yield (0, priceService_1.getPriceCache)();
        const usdtInrRate = ((_a = (yield db_1.prisma.priceCache.findUnique({ where: { key: 'METADATA:USDT_INR' } }))) === null || _a === void 0 ? void 0 : _a.priceInInr) || 83.5;
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
            }
            else if (asset.type === 'CASH') {
                currentPrice = 1;
            }
            const performance = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
            // Manual valuation adjustment for metals
            if (isMetal) {
                if (asset.type === 'SILVER' && asset.manualPrice) {
                    // Convert Price per KG to Price per Gram
                    currentPrice = asset.manualPrice / 1000;
                    const adjustedPerformance = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
                    Object.assign(performance, adjustedPerformance);
                }
                else if (asset.type === 'GOLD' && asset.manualPrice) {
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
            return Object.assign(Object.assign(Object.assign({}, asset), performance), { currentPrice,
                dailyChangeInr,
                dailyChangePercent });
        });
        res.json({
            assets: data,
            metadata: { conversionRate: usdtInrRate }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAssets = getAssets;
const getAssetById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const asset = yield db_1.prisma.asset.findUnique({
            where: { id },
            include: { transactions: { orderBy: { date: 'desc' } } }
        });
        if (!asset)
            return res.status(404).json({ error: "Asset not found" });
        const prices = yield (0, priceService_1.getPriceCache)();
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
        const performance = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
        // Manual valuation adjustment for metals
        if (isMetal) {
            if (asset.type === 'SILVER' && asset.manualPrice) {
                // Convert Price per KG to Price per Gram
                currentPrice = asset.manualPrice / 1000;
                const adjustedPerformance = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
                Object.assign(performance, adjustedPerformance);
            }
        }
        res.json(Object.assign(Object.assign(Object.assign({}, asset), performance), { currentPrice }));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAssetById = getAssetById;
const addAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validated = schemas_1.assetSchema.parse(req.body);
        if (validated.type === 'CRYPTO' && validated.symbol) {
            validated.symbol = validated.symbol.toUpperCase();
        }
        // We still need quantity and investedAmount for the initial transaction
        // extract them from validated
        const { quantity, investedAmount } = validated, assetData = __rest(validated, ["quantity", "investedAmount"]);
        const asset = yield db_1.prisma.asset.create({
            data: assetData
        });
        // Record initial BUY Transaction
        if (quantity > 0) {
            yield db_1.prisma.assetTransaction.create({
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
        (0, priceService_1.refreshPrices)().then(() => (0, portfolioController_1.createDailySnapshot)()).catch(console.error);
        res.json(asset);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.addAsset = addAsset;
const updateAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        // Only update static fields like name, symbol, manualPrice. 
        // Qty/Inv are now derived.
        const validated = schemas_1.assetSchema.partial().parse(req.body);
        if (validated.type === 'CRYPTO' && validated.symbol) {
            validated.symbol = validated.symbol.toUpperCase();
        }
        const asset = yield db_1.prisma.asset.update({
            where: { id },
            data: {
                name: validated.name,
                symbol: validated.symbol,
                platform: validated.platform,
                manualPrice: validated.manualPrice,
                manualCurrentValue: validated.manualCurrentValue,
                type: validated.type
            }
        });
        // Update the initial purchase date if provided
        if (validated.date) {
            const initialTx = yield db_1.prisma.assetTransaction.findFirst({
                where: { assetId: id },
                orderBy: { date: 'asc' }
            });
            if (initialTx) {
                yield db_1.prisma.assetTransaction.update({
                    where: { id: initialTx.id },
                    data: { date: new Date(validated.date) }
                });
            }
        }
        if (validated.type || validated.symbol || validated.date) {
            (0, priceService_1.refreshPrices)().then(() => (0, portfolioController_1.createDailySnapshot)()).catch(console.error);
        }
        res.json(asset);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.updateAsset = updateAsset;
const sellAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { quantity, price, fees, notes, date } = req.body;
        yield db_1.prisma.assetTransaction.create({
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
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.sellAsset = sellAsset;
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const transactions = yield db_1.prisma.assetTransaction.findMany({
            include: { asset: true },
            orderBy: { date: 'desc' }
        });
        const conversionRate = ((_a = (yield db_1.prisma.priceCache.findUnique({ where: { key: 'METADATA:USDT_INR' } }))) === null || _a === void 0 ? void 0 : _a.priceInInr) || 83.5;
        res.json({ transactions, metadata: { conversionRate } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getTransactions = getTransactions;
const deleteAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_1.prisma.asset.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.deleteAsset = deleteAsset;
const manualRefresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, priceService_1.refreshPrices)(true);
        yield (0, portfolioController_1.createDailySnapshot)();
        yield (0, alertController_1.checkAlerts)();
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.manualRefresh = manualRefresh;
