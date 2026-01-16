import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AssetTransaction } from '../types';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect } from 'react';

const History = () => {
    const { formatValue, setConversionRate } = useCurrency() as any;

    const { data: historyData, isLoading } = useQuery<{ transactions: AssetTransaction[], metadata: { conversionRate: number } }>({
        queryKey: ['transactions'],
        queryFn: async () => {
            const res = await api.get('/assets/transactions');
            return res.data;
        }
    });

    useEffect(() => {
        if (historyData?.metadata?.conversionRate) {
            setConversionRate(historyData.metadata.conversionRate);
        }
    }, [historyData, setConversionRate]);

    const transactions = historyData?.transactions || [];

    if (isLoading) return <div className="p-4 dark:text-gray-300">Loading history...</div>;

    const TransactionItem = ({ tx }: { tx: AssetTransaction }) => {
        const isSell = tx.type === 'SELL';
        const isBuy = tx.type === 'BUY';

        // Profit is now derived in realizedProfit if available (from SELL transactions)
        const profit = tx.realizedProfit || 0;
        const isProfit = profit >= 0;

        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2 transition-colors">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "p-2 rounded-lg",
                            isBuy && "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
                            isSell && "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        )}>
                            {isBuy && <ArrowUpRight size={20} />}
                            {isSell && <ArrowDownRight size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{tx.asset?.name || 'Unknown Asset'}</h3>
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                                    isBuy && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
                                    isSell && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                )}>
                                    {tx.type}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(tx.date), 'dd MMM yyyy, hh:mm a')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Quantity</p>
                        <p className="font-semibold text-sm dark:text-gray-200">{tx.quantity} {tx.asset?.symbol || ''}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Price/Value</p>
                        <p className="font-semibold text-sm dark:text-gray-200">{formatValue(tx.pricePerUnit)}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Value</p>
                        <p className="font-semibold text-sm dark:text-gray-200">{formatValue(tx.quantity * tx.pricePerUnit)}</p>
                    </div>
                    {isSell && (
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Realized P/L</p>
                            <div className={clsx("flex items-center gap-1 font-bold text-sm", isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                <span>{formatValue(Math.abs(profit))}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transactions.length} total events</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {transactions.map(tx => (
                    <TransactionItem key={tx.id} tx={tx} />
                ))}
            </div>

            {transactions.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-700">
                    No transactions found yet. Try adding or selling assets!
                </div>
            )}
        </div>
    );
};

export default History;
