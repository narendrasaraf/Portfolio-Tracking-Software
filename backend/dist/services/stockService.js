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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchYahooStockQuotes = void 0;
const axios_1 = __importDefault(require("axios"));
const fetchYahooStockQuotes = (symbols) => __awaiter(void 0, void 0, void 0, function* () {
    const quoteMap = new Map();
    if (symbols.length === 0)
        return quoteMap;
    const fetchSingleSymbol = (symbol) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
            const response = yield axios_1.default.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            const result = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.chart) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0];
            if (((_d = result === null || result === void 0 ? void 0 : result.meta) === null || _d === void 0 ? void 0 : _d.regularMarketPrice) !== undefined) {
                quoteMap.set(symbol, result.meta.regularMarketPrice);
            }
        }
        catch (error) {
            console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
        }
    });
    yield Promise.all(symbols.map(fetchSingleSymbol));
    return quoteMap;
});
exports.fetchYahooStockQuotes = fetchYahooStockQuotes;
