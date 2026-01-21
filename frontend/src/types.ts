export type AssetType = 'CRYPTO' | 'STOCK' | 'MUTUAL_FUND' | 'GOLD' | 'SILVER' | 'CASH';

export interface Asset {
    id: string;
    name: string;
    type: AssetType;
    symbol?: string;
    platform?: string;
    // Quantity and invested are now derived
    quantity?: number;
    investedAmount?: number;

    // Performance fields (derived from transactions)
    holdingQuantity?: number;
    avgBuyPrice?: number;
    totalInvested?: number;
    currentValue?: number;
    unrealizedPnl?: number;
    realizedPnl?: number;
    totalPnl?: number;
    dailyChangeInr?: number;
    dailyChangePercent?: number;

    manualPrice?: number;
    manualCurrentValue?: number; // For GOLD/SILVER manual value override
    currentPrice?: number;
    profit?: number; // kept for compatibility
    transactions?: Transaction[];
    updatedAt: string;
}

export interface Transaction {
    id: string;
    assetId: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    pricePerUnit: number;
    fees: number;
    notes?: string;
    date: string;
}

export interface AssetTransaction extends Transaction {
    asset: Asset;
    realizedProfit?: number;
}
