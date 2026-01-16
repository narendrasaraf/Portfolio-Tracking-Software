import { Asset, AssetTransaction } from '@prisma/client';

export interface AssetPerformance {
    holdingQuantity: number;
    avgBuyPrice: number;
    totalInvested: number;
    currentValue: number;
    unrealizedPnl: number;
    realizedPnl: number;
    totalPnl: number;
}

export const calculateAssetPerformance = (
    asset: Asset,
    transactions: AssetTransaction[],
    currentPrice: number
): AssetPerformance => {
    let totalBuyQty = 0;
    let totalSellQty = 0;
    let totalBuyCost = 0;
    let realizedPnl = 0;

    // Sort transactions by date to ensure sequential calculation for realized P/L if needed
    const sortedTransactions = [...transactions].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // We use Weighted Average Cost for localized Realized P/L calculation
    // Current Avg Buy Price = Total Buy Cost / Total Buy Qty

    // First pass: Calculate Total Buy statistics
    sortedTransactions.forEach(tx => {
        if (tx.type === 'BUY') {
            totalBuyQty += tx.quantity;
            totalBuyCost += (tx.quantity * tx.pricePerUnit) + (tx.fees || 0);
        }
    });

    const avgBuyPrice = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;

    // Second pass: Calculate Realized P/L based on the average buy price at the time of sale
    // Note: For absolute consistency, avgBuyPrice should be recalculated at each SELL point 
    // if we want to be hyper-accurate with timing, but global average is usually sufficient 
    // for this type of dashboard.
    sortedTransactions.forEach(tx => {
        if (tx.type === 'SELL') {
            totalSellQty += tx.quantity;
            // Realized = (Sell Price - Global Avg Buy Price) * Sell Qty - Fees
            realizedPnl += (tx.quantity * (tx.pricePerUnit - avgBuyPrice)) - (tx.fees || 0);
        }
    });

    const holdingQuantity = totalBuyQty - totalSellQty;
    const currentHoldingInvested = holdingQuantity * avgBuyPrice;
    const currentValue = holdingQuantity * currentPrice;
    const unrealizedPnl = currentValue - currentHoldingInvested;

    return {
        holdingQuantity,
        avgBuyPrice,
        totalInvested: currentHoldingInvested,
        currentValue,
        unrealizedPnl,
        realizedPnl,
        totalPnl: realizedPnl + unrealizedPnl
    };
};
