import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { Trash2, TrendingUp, TrendingDown, Edit, PlusCircle, Search, Filter } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect, useState, useMemo } from 'react';

const Assets = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { formatValue, setConversionRate } = useCurrency() as any;
    const [selectedFilter, setSelectedFilter] = useState('ALL');
    const [selectedAccount, setSelectedAccount] = useState('ALL');

    const { data: dashboardData, isLoading } = useQuery<{ assets: Asset[], metadata: { conversionRate: number } }>({
        queryKey: ['assets'],
        queryFn: async () => {
            const res = await api.get('/assets');
            return res.data;
        }
    });

    useEffect(() => {
        if (dashboardData?.metadata?.conversionRate) {
            setConversionRate(dashboardData.metadata.conversionRate);
        }
    }, [dashboardData, setConversionRate]);

    const allAssets = useMemo(() => dashboardData?.assets || [], [dashboardData]);

    // We only want to show assets with active holdings in the list/filtering
    const activeAssets = useMemo(() => allAssets.filter(a => (a.holdingQuantity ?? 0) > 0), [allAssets]);

    // Generate unique asset types for pills (only for those that exist in active assets)
    const filterTypes = useMemo(() => {
        const types = ['ALL'];
        const existingTypes = Array.from(new Set(activeAssets.map(a => a.type)));
        return [...types, ...existingTypes];
    }, [activeAssets]);

    const allAccounts = useMemo(() => {
        const accounts = Array.from(new Set(activeAssets.map(a => a.platform || 'Unknown')));
        return ['ALL', ...accounts.sort()];
    }, [activeAssets]);

    // Calculate counts for each type
    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: activeAssets.length };
        activeAssets.forEach(a => {
            c[a.type] = (c[a.type] || 0) + 1;
        });
        return c;
    }, [activeAssets]);

    // Final filtered list based on selection
    const filteredAssets = useMemo(() => {
        return activeAssets.filter(a => {
            const matchesType = selectedFilter === 'ALL' || a.type === selectedFilter;
            const matchesAccount = selectedAccount === 'ALL' || (a.platform || 'Unknown') === selectedAccount;
            return matchesType && matchesAccount;
        });
    }, [activeAssets, selectedFilter, selectedAccount]);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/assets/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        }
    });

    const formatType = (type: string) => {
        if (type === 'ALL') return 'All';
        return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
    };

    if (isLoading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    const AssetCard = ({ asset }: { asset: Asset }) => {
        const isProfit = (asset.totalPnl || 0) >= 0;
        return (
            <div
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700/50 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-50/50 dark:from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>

                <div className="flex justify-between items-start z-10">
                    <div>
                        <div className="flex gap-2 mb-2">
                            <span className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                                {asset.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-800/30">
                                {asset.platform || 'Unknown'}
                            </span>
                            {(asset as any).manualCurrentValue && (
                                <span className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-800/30">
                                    Manual
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{asset.name}</h3>
                        {asset.symbol && <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{asset.symbol}</p>}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => navigate(`/edit/${asset.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700/50 rounded-full transition-all shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Delete ' + asset.name + '?')) deleteMutation.mutate(asset.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700/50 rounded-full transition-all shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-transparent">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-0.5">Value</p>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 tracking-tight">{formatValue(asset.currentValue || 0)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-transparent">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-0.5">P/L</p>
                        <div className={clsx("flex items-center gap-1 font-bold text-sm", isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span className="tracking-tight">{formatValue(Math.abs(asset.totalPnl || 0))}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs font-medium text-gray-400 dark:text-gray-500 pt-1 px-1">
                    <span>Qty: <span className="text-gray-600 dark:text-gray-300">{asset.holdingQuantity?.toFixed(4) || asset.quantity}{['GOLD', 'SILVER'].includes(asset.type) ? 'g' : ''}</span></span>
                    <span>Inv: <span className="text-gray-600 dark:text-gray-300">{formatValue(asset.totalInvested || asset.investedAmount || 0)}</span></span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Assets</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{activeAssets.length} active holdings</p>
                </div>
                <Link to="/add" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 font-semibold text-sm group">
                    <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>Add New Asset</span>
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Filter Pills */}
                <div className="w-full flex-1">
                    <div className="flex flex-wrap gap-2">
                        {filterTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedFilter(type)}
                                className={clsx(
                                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200 border",
                                    selectedFilter === type
                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-105"
                                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                )}
                            >
                                {formatType(type)} <span className={clsx("ml-1.5 opacity-60", selectedFilter === type ? "text-white" : "text-gray-400")}>{counts[type]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Account Filter Dropdown */}
                <div className="w-full lg:w-auto relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <Filter size={14} />
                    </div>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full lg:w-56 pl-9 pr-4 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow appearance-none cursor-pointer hover:border-gray-300 dark:hover:border-gray-600"
                    >
                        <option value="ALL">All Accounts</option>
                        {allAccounts.filter(a => a !== 'ALL').map(acc => (
                            <option key={acc} value={acc}>{acc}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAssets.map(asset => (
                    <AssetCard key={asset.id} asset={asset} />
                ))}
            </div>

            {filteredAssets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
                        <Search size={32} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">No assets found</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                        {selectedFilter === 'ALL'
                            ? "Your portfolio is empty. Add your first asset to start tracking!"
                            : `No active ${formatType(selectedFilter)} assets matching your filters.`}
                    </p>
                    {selectedFilter === 'ALL' && (
                        <Link to="/add" className="mt-6 text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            Add Asset Now
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default Assets;
