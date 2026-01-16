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
const refreshPrices = () => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Fetch USDT-INR Rate (Free source)
    let usdtInrRate = 83.5; // fallback
    try {
        const res = yield axios_1.default.get('https://api.exchangerate-api.com/v4/latest/USD');
        if (res.data && res.data.rates && res.data.rates.INR) {
            usdtInrRate = res.data.rates.INR;
            yield db_1.prisma.priceCache.upsert({
                where: { key: 'METADATA:USDT_INR' },
                update: { priceInInr: usdtInrRate },
                create: { key: 'METADATA:USDT_INR', type: 'METADATA', symbol: 'USDT_INR', priceInInr: usdtInrRate }
            });
        }
    }
    catch (e) {
        console.error("Error fetching USDT-INR rate", e);
    }
    const assets = yield db_1.prisma.asset.findMany({
        where: { type: { in: ['CRYPTO', 'MUTUAL_FUND'] } }
    });
    const cryptoSymbols = new Set();
    const mfSchemes = new Set();
    assets.forEach(a => {
        if (a.type === 'CRYPTO' && a.symbol)
            cryptoSymbols.add(a.symbol.toUpperCase());
        if (a.type === 'MUTUAL_FUND' && a.symbol)
            mfSchemes.add(a.symbol);
    });
    // 2. Fetch Crypto Prices from Binance (USDT Pairs)
    for (const symbol of cryptoSymbols) {
        try {
            // Binance uses SYMBOL+USDT format (e.g. BTCUSDT)
            const res = yield axios_1.default.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
            if (res.data && res.data.price) {
                const priceInUsdt = parseFloat(res.data.price);
                const priceInInr = priceInUsdt * usdtInrRate;
                yield db_1.prisma.priceCache.upsert({
                    where: { key: `CRYPTO:${symbol}` },
                    update: { priceInInr },
                    create: { key: `CRYPTO:${symbol}`, type: 'CRYPTO', symbol, priceInInr }
                });
            }
        }
        catch (e) {
            console.error(`Error fetching Binance price for ${symbol}`, e);
        }
    }
    // 3. Fetch Mutual Fund Prices
    for (const scheme of mfSchemes) {
        try {
            const res = yield axios_1.default.get(`https://api.mfapi.in/mf/${scheme}`);
            if (res.data && res.data.data && res.data.data[0]) {
                const nav = parseFloat(res.data.data[0].nav);
                yield db_1.prisma.priceCache.upsert({
                    where: { key: `MUTUAL_FUND:${scheme}` },
                    update: { priceInInr: nav },
                    create: { key: `MUTUAL_FUND:${scheme}`, type: 'MUTUAL_FUND', symbol: scheme, priceInInr: nav }
                });
            }
        }
        catch (e) {
            console.error(`Error fetching MF price for ${scheme}`, e);
        }
    }
});
exports.refreshPrices = refreshPrices;
const getPriceCache = () => __awaiter(void 0, void 0, void 0, function* () {
    const cache = yield db_1.prisma.priceCache.findMany();
    const priceMap = {};
    cache.forEach(c => {
        priceMap[c.key] = c.priceInInr;
    });
    return priceMap;
});
exports.getPriceCache = getPriceCache;
