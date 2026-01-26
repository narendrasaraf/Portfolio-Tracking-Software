import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { Zap, AlertCircle, Shield, Target, Activity, TrendingUp } from 'lucide-react';
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

    const profitStats = useMemo(() => {
        const unrealized = assets.reduce((sum: number, a: Asset) => sum + (a.unrealizedPnl || 0), 0);
        const realized = assets.reduce((sum: number, a: Asset) => sum + (a.realizedPnl || 0), 0);
        return { unrealized, realized, total: unrealized + realized };
    }, [assets]);

    const volatility = useMemo(() => {
        if (history.length < 2) return 0;
        const last7 = history.slice(-7).map((h: any) => h.totalNetWorthInr);
        const mean = last7.reduce((a: number, b: number) => a + b, 0) / last7.length;
        const squareDiffs = last7.map((v: number) => Math.pow(v - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a: number, b: number) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);
        return (stdDev / mean) * 100;
    }, [history]);

    const diversificationScore = useMemo(() => {
        const totalValue = assets.reduce((sum: number, a: Asset) => sum + (a.currentValue || 0), 0);
        if (totalValue === 0) return 0;
        const hhi = assets.reduce((sum: number, a: Asset) => {
            const p = (a.currentValue || 0) / totalValue;
            return sum + (p * p);
        }, 0);
        return (1 - hhi) * 100;
    }, [assets]);

    const topPerformers = useMemo(() => {
        return [...assets].sort((a, b) => (b.dailyChangePercent || 0) - (a.dailyChangePercent || 0)).slice(0, 5);
    }, [assets]);

    const data = [
        { name: 'Unrealized', value: profitStats.unrealized },
        { name: 'Realized', value: profitStats.realized }
    ];

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div>
                <h2 className="heading-1">Advanced Analytics</h2>
                <p className="text-slate-400 font-medium">Deep-dive into your portfolio's mathematical performance metrics.</p>
            </div>

            {/* Matrix Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card glass-card-hover p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                            <Zap size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stability Index</span>
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter mb-2">{volatility.toFixed(2)}%</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">7-Day Portfolio Volatility</p>
                </div>

                <div className="glass-card glass-card-hover p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                            <Shield size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security Score</span>
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter mb-2">{diversificationScore.toFixed(1)}<span className="text-lg text-slate-600 ml-1">/100</span></p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">HHI Diversification Factor</p>
                </div>

                <div className="glass-card glass-card-hover p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                            <Target size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Locked Yield</span>
                    </div>
                    <p className="text-4xl font-black text-white tracking-tighter mb-2">{formatValue(profitStats.realized)}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-loose">Total Realized Profit</p>
                </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-10">
                    <div className="flex items-center gap-3 mb-10">
                        <Activity className="text-blue-400" size={20} />
                        <h3 className="text-xl font-black text-white tracking-tight">Yield Composition</h3>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: '16px',
                                        border: '1px solid #ffffff10',
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                        color: '#fff',
                                        padding: '12px'
                                    }}
                                    formatter={(v: any) => [formatValue(v), '']}
                                />
                                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-10">
                    <div className="flex items-center gap-3 mb-10">
                        <TrendingUp className="text-emerald-400" size={20} />
                        <h3 className="text-xl font-black text-white tracking-tight">Top Movers</h3>
                    </div>
                    <div className="space-y-4">
                        {topPerformers.map(asset => (
                            <div key={asset.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-black text-sm group-hover:scale-110 transition-transform">
                                        {(asset.symbol || 'AS').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white tracking-tight">{asset.name}</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{asset.type.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={clsx(
                                        "text-base font-black tracking-tighter",
                                        (asset.dailyChangePercent || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {(asset.dailyChangePercent || 0) >= 0 ? '+' : ''}{asset.dailyChangePercent?.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] font-black text-slate-500 tracking-widest">{formatValue(asset.currentValue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-3xl flex gap-4 text-slate-400 max-w-4xl mx-auto">
                <AlertCircle size={24} className="text-blue-500 shrink-0" />
                <p className="text-xs font-medium leading-relaxed italic">
                    Mathematical models provided (Volatility index, HHI Score) are quantitative indicators based on instantaneous snapshots. These projections facilitate risk assessment but are not definitive financial mandates.
                </p>
            </div>
        </div>
    );
};

export default Analytics;
