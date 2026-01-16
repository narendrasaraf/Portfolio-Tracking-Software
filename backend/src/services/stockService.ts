import axios from 'axios';

export interface StockQuote {
    symbol: string;
    priceInInr: number;
}

export const fetchYahooStockQuotes = async (symbols: string[]): Promise<Map<string, number>> => {
    const quoteMap = new Map<string, number>();
    if (symbols.length === 0) return quoteMap;

    const fetchSingleSymbol = async (symbol: string) => {
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`;
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const result = response.data?.chart?.result?.[0];
            if (result?.meta?.regularMarketPrice !== undefined) {
                quoteMap.set(symbol, result.meta.regularMarketPrice);
            }
        } catch (error) {
            console.error(`Error fetching Yahoo quote for ${symbol}:`, error);
        }
    };

    await Promise.all(symbols.map(fetchSingleSymbol));
    return quoteMap;
};
