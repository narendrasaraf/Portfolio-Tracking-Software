import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { RefreshCcw, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: any;
    colorClass: string;
    subValue?: string;
    isProfit?: boolean;
}

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
import { useState } from 'react';

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

    if (isLoading) return <div className="p-4">Loading stats...</div>;
    if (isError) return <div className="p-4 text-red-500">Error loading data.</div>;

    // Calculations
    const totalInvested = assets.reduce((sum: number, a: Asset) => sum + (a.totalInvested || a.investedAmount || 0), 0);
    const currentNetWorth = assets.reduce((sum: number, a: Asset) => sum + (a.currentValue || 0), 0);
    const totalProfit = assets.reduce((sum: number, a: Asset) => sum + (a.totalPnl || a.profit || 0), 0);
    const isProfit = totalProfit >= 0;



    const insights = generateInsights(assets, history);

    const StatCard = ({ title, value, icon: Icon, colorClass, subValue, isProfit }: StatCardProps) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50 flex flex-col justify-between h-36 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
            <div className="z-10">
                <p className="text-gray-400 dark:text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{value}</h3>
                {subValue && (
                    <div className="flex items-center gap-1 mt-2">
                        <span className={clsx("text-sm font-bold flex items-center px-1.5 py-0.5 rounded-md",
                            isProfit
                                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                                : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                        )}>
                            {isProfit ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                            {subValue}
                        </span>
                    </div>
                )}
            </div>
            <div className={clsx("absolute -bottom-6 -right-6 p-6 rounded-full opacity-5 dark:opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12", colorClass)}>
                <Icon size={100} />
            </div>
            <div className={clsx("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent opacity-50 blur-xl pointer-events-none")}></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsRestoreOpen(true)}
                        className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Restore Backup"
                    >
                        <Database size={16} />
                        <span className="hidden sm:inline">Restore</span>
                    </button>
                    <ExportBackupButton />
                    <button
                        onClick={() => refreshMutation.mutate()}
                        disabled={refreshMutation.isPending}
                        className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCcw size={16} className={clsx(refreshMutation.isPending && "animate-spin")} />
                        <span>{refreshMutation.isPending ? 'Syncing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Net Worth"
                    value={formatValue(currentNetWorth)}
                    icon={Wallet}
                    colorClass="bg-blue-500"
                />
                <TodayGainLossCard />
                <StatCard
                    title="Total Invested"
                    value={formatValue(totalInvested)}
                    icon={DollarSign}
                    colorClass="bg-purple-500"
                />
                <StatCard
                    title="Total Profit/Loss"
                    value={formatValue(Math.abs(totalProfit))}
                    subValue={`${isProfit ? '+' : '-'}${((Math.abs(totalProfit) / totalInvested) * 100 || 0).toFixed(2)}%`}
                    icon={isProfit ? TrendingUp : TrendingDown}
                    isProfit={isProfit}
                    colorClass={isProfit ? "bg-green-500" : "bg-red-500"}
                />
            </div>

            <InsightsCard insights={insights} />

            <PortfolioHistoryChart />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AccountBreakdown assets={assets} />
                <TopMovers assets={assets} />
            </div>

            <AllocationChart assets={assets} />

            <RestoreBackupModal
                isOpen={isRestoreOpen}
                onClose={() => setIsRestoreOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
