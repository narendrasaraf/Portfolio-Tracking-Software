import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { Trash2, TrendingUp, TrendingDown, Edit, PlusCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';
import { useEffect, useState, useMemo } from 'react';

const Assets = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { formatValue, setConversionRate, formatPnlPercent } = useCurrency() as any;
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

    if (isLoading) return <div className="p-4 dark:text-gray-300">Loading assets...</div>;

    const AssetCard = ({ asset }: { asset: Asset }) => {
        const isProfit = (asset.totalPnl || 0) >= 0;
        return (
            <div
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 transition-all hover:shadow-md cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 group"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex gap-2">
                            <span className="text-[10px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                {asset.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold tracking-wider text-blue-500 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                {asset.platform || 'Unknown'}
                            </span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{asset.name}</h3>
                        {asset.symbol && <p className="text-xs text-gray-400 dark:text-gray-500">{asset.symbol}</p>}
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => navigate(`/edit/${asset.id}`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Delete ' + asset.name + '?')) deleteMutation.mutate(asset.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Current Value</p>
                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{formatValue(asset.currentValue || 0)}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Profit/Loss</p>
                        <div className={clsx("flex items-center gap-1 font-bold text-sm", isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {isProfit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{formatValue(Math.abs(asset.totalPnl || 0))}</span>
                            <span className="text-[10px] opacity-80 font-medium ml-1">
                                ({formatPnlPercent(asset.totalPnl || 0, asset.totalInvested || 0)})
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-2 border-gray-50">
                    <span>Qty: {asset.holdingQuantity?.toFixed(4) || asset.quantity}</span>
                    <span>Inv: {formatValue(asset.totalInvested || asset.investedAmount || 0)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assets</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{activeAssets.length} total holdings</p>
                </div>
                <Link to="/add" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm">
                    <PlusCircle size={18} />
                    <span>Add Asset</span>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Filter Pills */}
                <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 scrollbar-hide flex-1">
                    {filterTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setSelectedFilter(type)}
                            className={clsx(
                                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border outline-none",
                                selectedFilter === type
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                        >
                            {formatType(type)} <span className={clsx("ml-1 opacity-70", selectedFilter === type ? "text-blue-100" : "text-gray-400")}>{counts[type]}</span>
                        </button>
                    ))}
                </div>

                {/* Account Filter Dropdown */}
                <div className="w-full sm:w-auto">
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full sm:w-48 p-2 text-sm border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">All Accounts</option>
                        {allAccounts.filter(a => a !== 'ALL').map(acc => (
                            <option key={acc} value={acc}>{acc}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map(asset => (
                    <AssetCard key={asset.id} asset={asset} />
                ))}
            </div>

            {filteredAssets.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-700">
                    {selectedFilter === 'ALL' ? "No active assets found. Add one to get started!" : `No active ${formatType(selectedFilter)} assets found.`}
                </div>
            )}
        </div>
    );
};

export default Assets;
