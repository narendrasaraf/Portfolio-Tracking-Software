import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AssetTransaction } from '../types';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, History as HistoryIcon } from 'lucide-react';
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

    const transactions = [...(historyData?.transactions || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse">Retrieving Chronicles...</p>
        </div>
    );

    const TransactionItem = ({ tx }: { tx: AssetTransaction }) => {
        const isSell = tx.type === 'SELL';
        const isBuy = tx.type === 'BUY';
        const profit = tx.realizedProfit || 0;
        const isProfit = profit >= 0;

        return (
            <div className="glass-card hover:bg-white/[0.03] p-6 transition-all group border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={clsx(
                            "p-3.5 rounded-2xl shadow-xl transition-transform group-hover:scale-110",
                            isBuy && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                            isSell && "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        )}>
                            {isBuy && <ArrowUpRight size={24} />}
                            {isSell && <ArrowDownRight size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight">{tx.asset?.name || 'Deactivated Asset'}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={clsx(
                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border",
                                    isBuy && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                                    isSell && "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                )}>
                                    Operation: {tx.type}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
                                    <Clock size={12} />
                                    {format(new Date(tx.date), 'dd MMM yyyy • HH:mm')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:text-right">
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Volume</p>
                            <p className="font-bold text-sm text-white">{tx.quantity} <span className="text-slate-500 text-[10px]">{tx.asset?.symbol || ''}</span></p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Unit Price</p>
                            <p className="font-bold text-sm text-white">{formatValue(tx.pricePerUnit)}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Net Flow</p>
                            <p className="font-bold text-sm text-white">{formatValue(tx.quantity * tx.pricePerUnit)}</p>
                        </div>
                        {isSell && (
                            <div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Yield Delta</p>
                                <div className={clsx("flex items-center md:justify-end gap-1 font-black text-sm", isProfit ? "text-emerald-400" : "text-rose-400")}>
                                    {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    <span>{formatValue(Math.abs(profit))}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div>
                <h2 className="heading-1">Portfolio Chronicles</h2>
                <p className="text-slate-400 font-medium">Visualizing every strategic entry and exit in your investment timeline.</p>
            </div>

            <div className="flex flex-col gap-6">
                {transactions.map(tx => (
                    <TransactionItem key={tx.id} tx={tx} />
                ))}
            </div>

            {transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 glass-card border-dashed">
                    <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10 opacity-20">
                        <HistoryIcon size={48} className="text-slate-500" />
                    </div>
                    <p className="text-2xl font-black text-white mb-2 tracking-tight tracking-tight">Timeline: Linear Null</p>
                    <p className="text-slate-400 font-medium text-center max-w-sm">
                        No transactions detected in the local ledger. Initialize a holding to record first entry.
                    </p>
                </div>
            )}
        </div>
    );
};

export default History;
