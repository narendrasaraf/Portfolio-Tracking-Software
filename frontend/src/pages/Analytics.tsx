import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { Zap, AlertCircle, Shield, Target } from 'lucide-react';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import clsx from 'clsx';

const Analytics = () => {
    const { formatValue } = useCurrency() as any;

    const { data: assetsRes } = useQuery({
        queryKey: ['assets'],
        queryFn: async () => (await api.get('/assets')).data
    });

    const { data: historyData } = useQuery({
        queryKey: ['portfolio-history'],
        queryFn: async () => (await api.get('/portfolio/history')).data
    });

    const history = historyData?.points || [];
    const assets = assetsRes?.assets || [];

    // 1. Profit Breakdown
    const profitStats = useMemo(() => {
        const unrealized = assets.reduce((sum: number, a: Asset) => sum + (a.unrealizedPnl || 0), 0);
        const realized = assets.reduce((sum: number, a: Asset) => sum + (a.realizedPnl || 0), 0);
        return { unrealized, realized, total: unrealized + realized };
    }, [assets]);

    // 2. Volatility (7-Day Std Dev)
    const volatility = useMemo(() => {
        if (history.length < 2) return 0;
        const last7 = history.slice(-7).map((h: any) => h.totalNetWorthInr);
        const mean = last7.reduce((a: number, b: number) => a + b, 0) / last7.length;
        const squareDiffs = last7.map((v: number) => Math.pow(v - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a: number, b: number) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);
        // Volatility as percentage of mean
        return (stdDev / mean) * 100;
    }, [history]);

    // 3. Diversification Score (HHI approach: 1 - sum(p_i^2))
    const diversificationScore = useMemo(() => {
        const totalValue = assets.reduce((sum: number, a: Asset) => sum + (a.currentValue || 0), 0);
        if (totalValue === 0) return 0;
        const hhi = assets.reduce((sum: number, a: Asset) => {
            const p = (a.currentValue || 0) / totalValue;
            return sum + (p * p);
        }, 0);
        return (1 - hhi) * 100;
    }, [assets]);

    // 4. Best/Worst Performers (Today)
    const topPerformers = useMemo(() => {
        return [...assets].sort((a, b) => (b.dailyChangePercent || 0) - (a.dailyChangePercent || 0)).slice(0, 5);
    }, [assets]);

    const data = [
        { name: 'Unrealized', value: profitStats.unrealized },
        { name: 'Realized', value: profitStats.realized }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold dark:text-white">Advanced Analytics</h2>

            {/* Top Row Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-2 transition-colors">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Zap size={16} className="text-amber-500" />
                        Portfolio Volatility (7D)
                    </p>
                    <p className="text-3xl font-bold dark:text-white">{volatility.toFixed(2)}%</p>
                    <p className="text-xs text-gray-400">Standard deviation of daily net worth as % of average.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-2 transition-colors">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Shield size={16} className="text-blue-500" />
                        Diversification Score
                    </p>
                    <p className="text-3xl font-bold dark:text-white">{diversificationScore.toFixed(1)}/100</p>
                    <p className="text-xs text-gray-400">Based on HHI concentration. Higher is more diversified.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-2 transition-colors">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Target size={16} className="text-green-500" />
                        Total Realized Profit
                    </p>
                    <p className="text-3xl font-bold dark:text-white">{formatValue(profitStats.realized)}</p>
                    <p className="text-xs text-gray-400">Total profit locked in from sold assets.</p>
                </div>
            </div>

            {/* Bottom Row Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-lg font-bold dark:text-white mb-6">Profit Composition</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(v: any) => formatValue(v)}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="text-lg font-bold dark:text-white mb-6">Top Performers (Today)</h3>
                    <div className="space-y-4">
                        {topPerformers.map(asset => (
                            <div key={asset.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {(asset.symbol || 'AS').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold dark:text-white">{asset.name}</p>
                                        <p className="text-xs text-gray-500 uppercase">{asset.type}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={clsx("text-sm font-bold", (asset.dailyChangePercent || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                                        {(asset.dailyChangePercent || 0) >= 0 ? '+' : ''}{asset.dailyChangePercent?.toFixed(2)}%
                                    </p>
                                    <p className="text-xs text-gray-500">{formatValue(asset.currentValue)}</p>
                                </div>
                            </div>
                        ))}
                        {assets.length === 0 && (
                            <div className="h-[250px] flex items-center justify-center text-gray-500 text-sm">
                                Not enough data for performance ranking.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300 transition-colors">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-xs leading-relaxed">
                    <strong>Note:</strong> Mathematical models like Volatility and HHI Score are based on current snapshots and asset values. They provide general risk assessment but should not be the sole basis for investment decisions.
                </p>
            </div>
        </div>
    );
};

export default Analytics;
