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
exports.checkAlerts = exports.markAlertAsRead = exports.getAlertEvents = exports.deleteAlertRule = exports.createAlertRule = exports.getAlertRules = void 0;
const db_1 = require("../utils/db");
const priceService_1 = require("../services/priceService");
const transactionService_1 = require("../services/transactionService");
const getAlertRules = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rules = yield db_1.prisma.alertRule.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(rules);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAlertRules = getAlertRules;
const createAlertRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rule = yield db_1.prisma.alertRule.create({
            data: req.body
        });
        res.status(201).json(rule);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.createAlertRule = createAlertRule;
const deleteAlertRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_1.prisma.alertRule.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.deleteAlertRule = deleteAlertRule;
const getAlertEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield db_1.prisma.alertEvent.findMany({
            orderBy: { triggeredAt: 'desc' },
            take: 50
        });
        res.json(events);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getAlertEvents = getAlertEvents;
const markAlertAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_1.prisma.alertEvent.update({
            where: { id: req.params.id },
            data: { isRead: true }
        });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.markAlertAsRead = markAlertAsRead;
const checkAlerts = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rules, assets, prices] = yield Promise.all([
            yield db_1.prisma.alertRule.findMany({ where: { enabled: true } }),
            yield db_1.prisma.asset.findMany({ include: { transactions: true } }),
            yield (0, priceService_1.getPriceCache)()
        ]);
        const totalNetWorth = assets.reduce((sum, asset) => {
            const priceKey = `${asset.type}:${asset.symbol}`;
            const currentPrice = prices[priceKey] || asset.manualPrice || 0;
            const perf = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
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
                        yield createAlertEvent(rule.id, message);
                    }
                }
            }
            else if (rule.type === 'ALLOCATION' && rule.assetType) {
                const typeTotal = assets
                    .filter(a => a.type === rule.assetType)
                    .reduce((sum, asset) => {
                    const priceKey = `${asset.type}:${asset.symbol}`;
                    const currentPrice = prices[priceKey] || asset.manualPrice || 0;
                    const perf = (0, transactionService_1.calculateAssetPerformance)(asset, asset.transactions, currentPrice);
                    return sum + perf.currentValue;
                }, 0);
                const currentPercent = (typeTotal / totalNetWorth) * 100;
                const isTriggered = rule.direction === 'ABOVE'
                    ? currentPercent >= (rule.thresholdPercent || 0)
                    : currentPercent <= (rule.thresholdPercent || 0);
                if (isTriggered) {
                    const message = `${rule.assetType} allocation is ${rule.direction.toLowerCase()} ${rule.thresholdPercent}% (Current: ${currentPercent.toFixed(2)}%)`;
                    yield createAlertEvent(rule.id, message);
                }
            }
        }
    }
    catch (error) {
        console.error('[ALERTS] Error checking alerts:', error);
    }
});
exports.checkAlerts = checkAlerts;
function createAlertEvent(ruleId, message) {
    return __awaiter(this, void 0, void 0, function* () {
        // Prevent duplicate events for the same rule in the last hour
        const lastHour = new Date(Date.now() - 3600000);
        const recent = yield db_1.prisma.alertEvent.findFirst({
            where: {
                ruleId,
                message,
                triggeredAt: { gte: lastHour }
            }
        });
        if (!recent) {
            yield db_1.prisma.alertEvent.create({
                data: { ruleId, message }
            });
            console.log(`[ALERT] Triggered: ${message}`);
        }
    });
}
