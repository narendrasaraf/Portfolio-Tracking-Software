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
exports.getPriceCache = exports.refreshPrices = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../utils/db");
const stockService_1 = require("./stockService");
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STOCK_CACHE_TTL = 60 * 1000; // 1 minute for stocks
let usdtInrCache = null;
let cryptoPricesCache = {};
let stockPricesCache = {};
const fetchUsdtInrRate = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Use Binance USDT/INR if available, or fallback to other reliable sources is the strategy.
        // As per requirement: ALWAYS fetch USDTINR from Binance.
        const res = yield axios_1.default.get('https://api.binance.com/api/v3/ticker/price?symbol=USDTINR');
        if (res.data && res.data.price) {
            const rate = parseFloat(res.data.price);
            console.log(`[DEBUG] Fetched live USDT-INR rate from Binance: ${rate}`);
            usdtInrCache = { data: rate, updatedAt: Date.now() };
            // Persist to DB cache
            yield db_1.prisma.priceCache.upsert({
                where: { key: 'METADATA:USDT_INR' },
                update: { priceInInr: rate },
                create: { key: 'METADATA:USDT_INR', type: 'METADATA', symbol: 'USDT_INR', priceInInr: rate }
            });
            return rate;
        }
    }
    catch (e) {
        console.error("[ERROR] Failed to fetch USDT-INR rate from Binance", e);
    }
    // Fallback to last known in DB or hardcoded
    const lastDb = yield db_1.prisma.priceCache.findUnique({ where: { key: 'METADATA:USDT_INR' } });
    const fallback = (lastDb === null || lastDb === void 0 ? void 0 : lastDb.priceInInr) || (usdtInrCache === null || usdtInrCache === void 0 ? void 0 : usdtInrCache.data) || 87.0; // Updated fallback
    console.log(`[DEBUG] Using fallback USDT-INR rate: ${fallback}`);
    return fallback;
});
const fetchAllCryptoTickers = () => __awaiter(void 0, void 0, void 0, function* () {
    const prices = {};
    try {
        const res = yield axios_1.default.get('https://api.binance.com/api/v3/ticker/price');
        if (Array.isArray(res.data)) {
            res.data.forEach((item) => {
                prices[item.symbol] = parseFloat(item.price);
            });
        }
    }
    catch (e) {
        console.error("[ERROR] Failed to fetch bulk tickers from Binance", e);
    }
    return prices;
});
const refreshPrices = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (force = false) {
    const now = Date.now();
    console.log(`[DEBUG] Refreshing prices (force=${force}) at ${new Date(now).toISOString()}`);
    // 0. Pre-fetch existing cache for shifting
    const existingCache = yield db_1.prisma.priceCache.findMany();
    const cacheMap = new Map(existingCache.map(c => [c.key, c]));
    // 1. Get/Refresh USDT-INR Rate
    let usdtInrRate;
    if (!force && usdtInrCache && (now - usdtInrCache.updatedAt < CACHE_TTL)) {
        usdtInrRate = usdtInrCache.data;
        console.log(`[DEBUG] Using cached usdtInrRate: ${usdtInrRate}`);
    }
    else {
        usdtInrRate = yield fetchUsdtInrRate();
    }
    // 2. Identify required assets
    const assets = yield db_1.prisma.asset.findMany({
        where: { type: { in: ['CRYPTO', 'MUTUAL_FUND', 'STOCK'] } }
    });
    const cryptoSymbols = new Set();
    const mfSchemes = new Set();
    const stockSymbols = new Set();
    assets.forEach(a => {
        if (a.type === 'CRYPTO' && a.symbol)
            cryptoSymbols.add(a.symbol.toUpperCase());
        if (a.type === 'MUTUAL_FUND' && a.symbol)
            mfSchemes.add(a.symbol);
        if (a.type === 'STOCK' && a.symbol)
            stockSymbols.add(a.symbol);
    });
    // 3. Refresh Crypto Prices (Binance)
    // ... (rest of crypto logic remains same)
    if (cryptoSymbols.size > 0) {
        const tickers = yield fetchAllCryptoTickers();
        const apiFailed = Object.keys(tickers).length === 0;
        for (const symbol of cryptoSymbols) {
            let priceInUsdt;
            if (symbol === 'USDT') {
                priceInUsdt = 1;
            }
            else {
                const pair = `${symbol}USDT`;
                priceInUsdt = tickers[pair];
            }
            if (priceInUsdt !== undefined) {
                cryptoPricesCache[symbol] = { data: priceInUsdt, updatedAt: now };
            }
            else if (!force && cryptoPricesCache[symbol] && (now - cryptoPricesCache[symbol].updatedAt < CACHE_TTL)) {
                priceInUsdt = cryptoPricesCache[symbol].data;
            }
            else if (apiFailed && cryptoPricesCache[symbol]) {
                priceInUsdt = cryptoPricesCache[symbol].data;
            }
            if (priceInUsdt !== undefined) {
                const priceInInr = priceInUsdt * usdtInrRate;
                const key = `CRYPTO:${symbol}`;
                const existing = cacheMap.get(key);
                yield db_1.prisma.priceCache.upsert({
                    where: { key },
                    update: { priceInInr, prevPriceInInr: existing === null || existing === void 0 ? void 0 : existing.priceInInr },
                    create: { key, type: 'CRYPTO', symbol, priceInInr }
                });
            }
        }
    }
    // 4. Refresh Stock Prices (Yahoo Finance)
    if (stockSymbols.size > 0) {
        const symbolsArray = Array.from(stockSymbols);
        const stockQuotes = yield (0, stockService_1.fetchYahooStockQuotes)(symbolsArray);
        for (const symbol of symbolsArray) {
            let priceInInr = stockQuotes.get(symbol);
            if (priceInInr !== undefined) {
                stockPricesCache[symbol] = { data: priceInInr, updatedAt: now };
            }
            else if (!force && stockPricesCache[symbol] && (now - stockPricesCache[symbol].updatedAt < STOCK_CACHE_TTL)) {
                priceInInr = stockPricesCache[symbol].data;
            }
            else if (stockPricesCache[symbol]) {
                priceInInr = stockPricesCache[symbol].data;
            }
            if (priceInInr !== undefined) {
                const key = `STOCK:${symbol}`;
                const existing = cacheMap.get(key);
                yield db_1.prisma.priceCache.upsert({
                    where: { key },
                    update: { priceInInr, prevPriceInInr: existing === null || existing === void 0 ? void 0 : existing.priceInInr },
                    create: { key, type: 'STOCK', symbol, priceInInr }
                });
            }
        }
    }
    // 5. Refresh Mutual Fund Prices
    for (const scheme of mfSchemes) {
        try {
            const res = yield axios_1.default.get(`https://api.mfapi.in/mf/${scheme}`);
            if (res.data && res.data.data && res.data.data[0]) {
                const nav = parseFloat(res.data.data[0].nav);
                const key = `MUTUAL_FUND:${scheme}`;
                const existing = cacheMap.get(key);
                yield db_1.prisma.priceCache.upsert({
                    where: { key },
                    update: { priceInInr: nav, prevPriceInInr: existing === null || existing === void 0 ? void 0 : existing.priceInInr },
                    create: { key, type: 'MUTUAL_FUND', symbol: scheme, priceInInr: nav }
                });
            }
        }
        catch (e) {
            console.error(`[ERROR] Failed to fetch MF price for ${scheme}`, e);
        }
    }
});
exports.refreshPrices = refreshPrices;
const getPriceCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const cache = yield db_1.prisma.priceCache.findMany();
    const priceMap = {};
    cache.forEach(c => {
        priceMap[c.key] = { current: c.priceInInr, prev: c.prevPriceInInr };
    });
    return priceMap;
});
exports.getPriceCache = getPriceCache;
