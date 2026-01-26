import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { RefreshCcw, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect, useState } from 'react';

import AllocationChart from '../components/AllocationChart';
import PortfolioHistoryChart from '../components/PortfolioHistoryChart';
import TodayGainLossCard from '../components/TodayGainLossCard';
import ExportBackupButton from '../components/ExportBackupButton';
import AccountBreakdown from '../components/AccountBreakdown';
import TopMovers from '../components/TopMovers';
import RestoreBackupModal from '../components/RestoreBackupModal';
import InsightsCard from '../components/InsightsCard';
import { generateInsights } from '../services/insightsService';
import { Database } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    icon: any;
    gradient: string;
    accentColor: string;
    subValue?: string;
    isProfit?: boolean;
}

const Dashboard = () => {
    const queryClient = useQueryClient();
    const { formatValue, setConversionRate } = useCurrency() as any;
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);

    const { data: dashboardData, isLoading, isError } = useQuery<{ assets: Asset[], metadata: { conversionRate: number } }>({
        queryKey: ['assets'],
        queryFn: async () => {
            const res = await api.get('/assets');
            return res.data;
        }
    });

    const { data: history = [] } = useQuery<any[]>({
        queryKey: ['portfolio-history'],
        queryFn: async () => (await api.get('/portfolio/history')).data
    });

    useEffect(() => {
        if (dashboardData?.metadata?.conversionRate) {
            setConversionRate(dashboardData.metadata.conversionRate);
        }
    }, [dashboardData, setConversionRate]);

    const assets = dashboardData?.assets || [];

    const refreshMutation = useMutation({
        mutationFn: async () => {
            await api.post('/assets/prices/refresh');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        }
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse">Initializing Dashboard...</p>
        </div>
    );

    if (isError) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 mb-4">
                <p className="text-red-500 font-bold text-lg">System Error</p>
                <p className="text-red-400/60 text-sm">Failed to establish connection with the node.</p>
            </div>
        </div>
    );

    const totalInvested = assets.reduce((sum: number, a: Asset) => sum + (a.totalInvested || a.investedAmount || 0), 0);
    const currentNetWorth = assets.reduce((sum: number, a: Asset) => sum + (a.currentValue || 0), 0);
    const totalProfit = assets.reduce((sum: number, a: Asset) => sum + (a.totalPnl || a.profit || 0), 0);
    const isProfit = totalProfit >= 0;

    const insights = generateInsights(assets, history);

    const StatCard = ({ title, value, icon: Icon, gradient, accentColor, subValue, isProfit }: StatCardProps) => (
        <div className="glass-card glass-card-hover p-6 min-h-[160px] relative overflow-hidden group">
            {/* Background Gradient Glow */}
            <div className={clsx("absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-20 transition-all duration-500 group-hover:opacity-40", accentColor)}></div>

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</span>
                        <div className={clsx("p-2 rounded-xl bg-gradient-to-br shadow-lg", gradient)}>
                            <Icon size={16} className="text-white" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter sm:text-3xl">{value}</h3>
                </div>

                {subValue && (
                    <div className="flex items-center gap-2 mt-4">
                        <span className={clsx(
                            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black tracking-tight",
                            isProfit ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        )}>
                            {isProfit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {subValue}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="heading-1 flex items-center gap-3">
                        Dashboard
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/20">Alpha</span>
                    </h2>
                    <p className="text-slate-400 font-medium">Monitoring {assets.length} active assets across your portfolio.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsRestoreOpen(true)}
                        className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2"
                        title="Restore Backup"
                    >
                        <Database size={16} />
                        <span>Restore</span>
                    </button>

                    <button
                        onClick={() => refreshMutation.mutate()}
                        disabled={refreshMutation.isPending}
                        className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
                    >
                        <RefreshCcw size={16} className={clsx(refreshMutation.isPending && "animate-spin")} />
                        <span>{refreshMutation.isPending ? 'Syncing...' : 'Sync Prices'}</span>
                    </button>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Value"
                    value={formatValue(currentNetWorth)}
                    icon={Wallet}
                    gradient="from-blue-600 to-indigo-600"
                    accentColor="bg-blue-500"
                />
                <TodayGainLossCard />
                <StatCard
                    title="Principle"
                    value={formatValue(totalInvested)}
                    icon={DollarSign}
                    gradient="from-purple-600 to-pink-600"
                    accentColor="bg-purple-500"
                />
                <StatCard
                    title="Performance"
                    value={formatValue(Math.abs(totalProfit))}
                    subValue={`${isProfit ? '+' : '-'}${((Math.abs(totalProfit) / totalInvested) * 100 || 0).toFixed(2)}%`}
                    icon={Zap}
                    isProfit={isProfit}
                    gradient={isProfit ? "from-emerald-500 to-teal-500" : "from-rose-500 to-orange-500"}
                    accentColor={isProfit ? "bg-emerald-500" : "bg-rose-500"}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-8">
                {/* Insights Section */}
                <InsightsCard insights={insights} />

                {/* Main Charts */}
                <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white tracking-tight">Net Worth History</h3>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                            <span className="px-3 py-1 text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 rounded-lg">Realtime</span>
                        </div>
                    </div>
                    <PortfolioHistoryChart />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card p-8 h-full">
                        <AccountBreakdown assets={assets} />
                    </div>
                    <div className="glass-card p-8 h-full">
                        <TopMovers assets={assets} />
                    </div>
                </div>

                <div className="glass-card p-8">
                    <AllocationChart assets={assets} />
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <ExportBackupButton />
            </div>

            <RestoreBackupModal
                isOpen={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
