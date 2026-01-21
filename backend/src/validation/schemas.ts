import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const assetSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['CRYPTO', 'STOCK', 'MUTUAL_FUND', 'GOLD', 'SILVER', 'CASH']),
    symbol: z.string().optional(),
    platform: z.string().optional().default('Unknown'),
    quantity: z.number().positive(),
    investedAmount: z.number().positive(),
    manualPrice: z.number().optional(),
    manualCurrentValue: z.number().optional(),
    date: z.string().optional(),
});
