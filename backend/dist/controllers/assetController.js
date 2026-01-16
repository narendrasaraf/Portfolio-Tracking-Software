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
exports.manualRefresh = exports.deleteAsset = exports.getTransactions = exports.sellAsset = exports.updateAsset = exports.addAsset = exports.getAssets = void 0;
const db_1 = require("../utils/db");
const schemas_1 = require("../validation/schemas");
const priceService_1 = require("../services/priceService");
const getAssets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const assets = yield db_1.prisma.asset.findMany();
    const prices = yield (0, priceService_1.getPriceCache)();
    // Calculate current values
    const data = assets.map(asset => {
        let currentPrice = asset.manualPrice || 0;
        let priceKey = `${asset.type}:${asset.symbol}`;
        if (prices[priceKey]) {
            currentPrice = prices[priceKey];
        }
        else if (asset.type === 'CASH') {
            currentPrice = 1; // logical multiplier for cash, though value = invested usually
        }
        let currentValue = 0;
        if (asset.type === 'CASH') {
            currentValue = asset.investedAmount;
        }
        else {
            currentValue = asset.quantity * currentPrice;
        }
        // Fallback if no price found and not cash, use invested amount or 0? 
        // Logic says: if manualPrice exists -> value = quantity * manualPrice (handled above)
        // else -> value = investedAmount (as fallback for STOCK/GOLD without manual price?)
        if (!asset.manualPrice && !prices[priceKey] && asset.type !== 'CASH') {
            currentValue = asset.investedAmount; // fallback
        }
        return Object.assign(Object.assign({}, asset), { currentPrice,
            currentValue, profit: currentValue - asset.investedAmount });
    });
    const conversionRate = prices['METADATA:USDT_INR'] || 83.5;
    res.json({
        assets: data,
        metadata: { conversionRate }
    });
});
exports.getAssets = getAssets;
const addAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validated = schemas_1.assetSchema.parse(req.body);
        if (validated.type === 'CRYPTO' && validated.symbol) {
            validated.symbol = validated.symbol.toUpperCase();
        }
        const asset = yield db_1.prisma.asset.create({
            data: validated
        });
        // Record BUY Transaction
        yield db_1.prisma.assetTransaction.create({
            data: {
                assetId: asset.id,
                type: 'BUY',
                quantity: asset.quantity,
                price: asset.investedAmount / asset.quantity
            }
        });
        // Trigger generic price refresh in background
        (0, priceService_1.refreshPrices)().catch(console.error);
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
        const validated = schemas_1.assetSchema.partial().parse(req.body);
        if (validated.type === 'CRYPTO' && validated.symbol) {
            validated.symbol = validated.symbol.toUpperCase();
        }
        const oldAsset = yield db_1.prisma.asset.findUnique({ where: { id } });
        const asset = yield db_1.prisma.asset.update({
            where: { id },
            data: validated
        });
        // Record UPDATE Transaction (only if quantity or invested amount changed)
        if (oldAsset && (validated.quantity !== undefined || validated.investedAmount !== undefined)) {
            yield db_1.prisma.assetTransaction.create({
                data: {
                    assetId: id,
                    type: 'UPDATE',
                    quantity: asset.quantity,
                    price: asset.investedAmount / asset.quantity
                }
            });
        }
        // Trigger price refresh if type or symbol changed
        if (validated.type || validated.symbol) {
            (0, priceService_1.refreshPrices)().catch(console.error);
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
        const { quantity, price } = req.body;
        const asset = yield db_1.prisma.asset.findUnique({ where: { id } });
        if (!asset)
            return res.status(404).send("Not found");
        if (quantity > asset.quantity) {
            return res.status(400).json({ error: "Selling quantity exceeds holdings" });
        }
        const sellQuantity = Number(quantity);
        const sellPrice = Number(price);
        // Calculate realized profit
        // Profit = (Sell Price - Avg Buy Price) * Quantity Sold
        const avgBuyPrice = asset.investedAmount / asset.quantity;
        const realizedProfit = (sellPrice - avgBuyPrice) * sellQuantity;
        // Record Transaction
        yield db_1.prisma.assetTransaction.create({
            data: {
                assetId: id,
                type: 'SELL',
                quantity: sellQuantity,
                price: sellPrice,
                realizedProfit
            }
        });
        // Update Asset Holdings
        const investedAmountReduction = (sellQuantity / asset.quantity) * asset.investedAmount;
        const updatedAsset = yield db_1.prisma.asset.update({
            where: { id },
            data: {
                quantity: { decrement: sellQuantity },
                investedAmount: { decrement: investedAmountReduction }
            }
        });
        res.json(updatedAsset);
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
        res.json({
            transactions,
            metadata: { conversionRate }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getTransactions = getTransactions;
const deleteAsset = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const asset = yield db_1.prisma.asset.findUnique({ where: { id } });
    if (!asset)
        return res.status(404).send("Not found");
    yield db_1.prisma.asset.delete({ where: { id } });
    res.json({ success: true });
});
exports.deleteAsset = deleteAsset;
const manualRefresh = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, priceService_1.refreshPrices)();
    res.json({ success: true });
});
exports.manualRefresh = manualRefresh;
