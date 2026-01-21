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
exports.getStockQuotes = void 0;
const stockService_1 = require("../services/stockService");
const getStockQuotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const symbols = ((_a = req.query.symbols) === null || _a === void 0 ? void 0 : _a.split(',')) || [];
        if (symbols.length === 0) {
            return res.status(400).json({ error: 'At least one symbol is required' });
        }
        const quotesMap = yield (0, stockService_1.fetchYahooStockQuotes)(symbols);
        const quotes = symbols.map(symbol => ({
            symbol,
            priceInInr: quotesMap.get(symbol) || null
        })).filter(q => q.priceInInr !== null);
        res.json({
            updatedAt: new Date().toISOString(),
            quotes
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.getStockQuotes = getStockQuotes;
