"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
exports.assetSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.enum(['CRYPTO', 'STOCK', 'MUTUAL_FUND', 'GOLD', 'SILVER', 'CASH']),
    symbol: zod_1.z.string().optional(),
    platform: zod_1.z.string().optional().default('Unknown'),
    quantity: zod_1.z.number().positive(),
    investedAmount: zod_1.z.number().positive(),
    manualPrice: zod_1.z.number().optional(),
    manualCurrentValue: zod_1.z.number().optional(),
    date: zod_1.z.string().optional(),
});
