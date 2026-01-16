import { Request, Response } from 'express';
import { fetchYahooStockQuotes } from '../services/stockService';

export const getStockQuotes = async (req: Request, res: Response) => {
    try {
        const symbols = (req.query.symbols as string)?.split(',') || [];
        if (symbols.length === 0) {
            return res.status(400).json({ error: 'At least one symbol is required' });
        }

        const quotesMap = await fetchYahooStockQuotes(symbols);
        const quotes = symbols.map(symbol => ({
            symbol,
            priceInInr: quotesMap.get(symbol) || null
        })).filter(q => q.priceInInr !== null);

        res.json({
            updatedAt: new Date().toISOString(),
            quotes
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
