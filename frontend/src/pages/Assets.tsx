import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset } from '../types';
import { Trash2, TrendingUp, TrendingDown, Edit, PlusCircle, Search, Filter, Layers, Globe } from 'lucide-react';
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
    const activeAssets = useMemo(() => allAssets.filter(a => (a.holdingQuantity ?? 0) > 0), [allAssets]);

    const filterTypes = useMemo(() => {
        const types = ['ALL'];
        const existingTypes = Array.from(new Set(activeAssets.map(a => a.type)));
        return [...types, ...existingTypes];
    }, [activeAssets]);

    const allAccounts = useMemo(() => {
        const accounts = Array.from(new Set(activeAssets.map(a => a.platform || 'Unknown')));
        return ['ALL', ...accounts.sort()];
    }, [activeAssets]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: activeAssets.length };
        activeAssets.forEach(a => {
            c[a.type] = (c[a.type] || 0) + 1;
        });
        return c;
    }, [activeAssets]);

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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold animate-pulse">Scanning Portfolio...</p>
        </div>
    );

    const AssetCard = ({ asset }: { asset: Asset }) => {
        const isProfit = (asset.totalPnl || 0) >= 0;
        return (
            <div
                onClick={() => navigate(`/assets/${asset.id}`)}
                className="glass-card glass-card-hover p-6 cursor-pointer group relative overflow-hidden"
            >
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>

                <div className="flex justify-between items-start relative z-10 mb-6">
                    <div>
                        <div className="flex gap-2 mb-3">
                            <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                                {asset.type.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                                {asset.platform || 'Account'}
                            </span>
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tighter leading-tight">
                            {asset.name}
                        </h3>
                        {asset.symbol && <p className="text-xs text-slate-500 font-bold mt-1">{asset.symbol}</p>}
                    </div>

                    <div className="flex gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => navigate(`/edit/${asset.id}`)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5"
                            title="Edit"
                        >
                            <Edit size={16} />
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Delete ' + asset.name + '?')) deleteMutation.mutate(asset.id);
                            }}
                            className="p-2.5 bg-red-500/5 hover:bg-red-500 text-slate-400 hover:text-white rounded-xl transition-all border border-red-500/10 hover:border-red-500"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] uppercase font-black tracking-[0.1em] text-slate-500 mb-1">Market Value</p>
                        <p className="text-lg font-black text-white tracking-tighter">{formatValue(asset.currentValue || 0)}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] uppercase font-black tracking-[0.1em] text-slate-500 mb-1">Profit / Loss</p>
                        <div className={clsx("flex items-center gap-1 font-black text-lg tracking-tighter", isProfit ? "text-emerald-400" : "text-rose-400")}>
                            {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>{formatValue(Math.abs(asset.totalPnl || 0))}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <span className="flex items-center gap-1.5"><Layers size={12} className="text-slate-500" /> {asset.holdingQuantity?.toFixed(4) || asset.quantity} {['GOLD', 'SILVER'].includes(asset.type) ? 'g' : ''}</span>
                    <span className="flex items-center gap-1.5"><Globe size={12} className="text-slate-500" /> {formatValue(asset.totalInvested || asset.investedAmount || 0)}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="heading-1">My Portfolio</h2>
                    <p className="text-slate-400 font-medium">Managing <span className="text-white font-bold">{activeAssets.length}</span> individual positions.</p>
                </div>
                <Link to="/add" className="btn-primary flex items-center gap-2 group">
                    <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>New Investment</span>
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Filter Pills */}
                <div className="w-full flex-1 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                        {filterTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedFilter(type)}
                                className={clsx(
                                    "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border",
                                    selectedFilter === type
                                        ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105"
                                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {formatType(type)} <span className={clsx("ml-2 opacity-50", selectedFilter === type ? "text-white" : "text-slate-500")}>{counts[type]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Account Filter */}
                <div className="w-full lg:w-72 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none">
                        <Filter size={16} />
                    </div>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 text-xs font-black uppercase tracking-widest border border-white/10 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="ALL">All Platforms</option>
                        {allAccounts.filter(a => a !== 'ALL').map(acc => (
                            <option key={acc} value={acc} className="bg-slate-900">{acc}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                {filteredAssets.map(asset => (
                    <AssetCard key={asset.id} asset={asset} />
                ))}
            </div>

            {filteredAssets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 glass-card border-dashed">
                    <div className="p-6 bg-white/5 rounded-full mb-6 border border-white/10">
                        <Search size={40} className="text-slate-500" />
                    </div>
                    <p className="text-2xl font-black text-white mb-2 tracking-tight tracking-tight">System Purge: No Assets Found</p>
                    <p className="text-slate-400 font-medium text-center max-w-sm mb-8">
                        The current parameters returned zero results. Adjust your filters or initialize your first holding.
                    </p>
                    <Link to="/add" className="btn-secondary">
                        Initialize First Holding
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Assets;
