import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { refreshPrices } from '../services/priceService';

export const addTransaction = async (req: Request, res: Response) => {
    try {
        const { assetId, type, quantity, pricePerUnit, fees, notes, date } = req.body;

        const transaction = await prisma.assetTransaction.create({
            data: {
                assetId,
                type,
                quantity: Number(quantity),
                pricePerUnit: Number(pricePerUnit),
                fees: Number(fees || 0),
                notes,
                date: date ? new Date(date) : new Date()
            }
        });

        // Trigger price refresh just in case it's a new symbol
        refreshPrices().catch(console.error);

        res.json(transaction);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.assetTransaction.delete({ where: { id } });
        res.json({ success: true });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
