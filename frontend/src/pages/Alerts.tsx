import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset, AssetType } from '../types';
import { Bell, Trash2, CheckCircle, AlertTriangle, Plus, X, Settings2, History, Calendar } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useCurrency } from '../context/CurrencyContext';

interface AlertRule {
    id: string;
    type: 'PRICE' | 'ALLOCATION';
    enabled: boolean;
    assetId?: string;
    assetType?: AssetType;
    direction: 'ABOVE' | 'BELOW';
    thresholdValue?: number;
    thresholdPercent?: number;
}

interface AlertEvent {
    id: string;
    ruleId: string;
    triggeredAt: string;
    message: string;
    isRead: boolean;
}

const Alerts = () => {
    const queryClient = useQueryClient();
    const { formatValue } = useCurrency() as any;
    const [isAddingRule, setIsAddingRule] = useState(false);

    const { data: rules = [] } = useQuery<AlertRule[]>({
        queryKey: ['alert-rules'],
        queryFn: async () => (await api.get('/alerts/rules')).data
    });

    const { data: events = [] } = useQuery<AlertEvent[]>({
        queryKey: ['alert-events'],
        queryFn: async () => (await api.get('/alerts/events')).data
    });

    const { data: dashboardData } = useQuery<{ assets: Asset[] }>({
        queryKey: ['assets'],
        queryFn: async () => (await api.get('/assets')).data
    });

    const assets = dashboardData?.assets || [];

    const createRuleMutation = useMutation({
        mutationFn: async (newRule: Partial<AlertRule>) => {
            await api.post('/alerts/rules', newRule);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
            setIsAddingRule(false);
        }
    });

    const deleteRuleMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/alerts/rules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
        }
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/alerts/events/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alert-events'] });
        }
    });

    const [newRule, setNewRule] = useState<Partial<AlertRule>>({
        type: 'PRICE',
        direction: 'ABOVE',
        enabled: true
    });

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();
        createRuleMutation.mutate(newRule);
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="heading-1">Alert Monitor</h2>
                    <p className="text-slate-400 font-medium">Real-time surveillance of price movements and allocations.</p>
                </div>
                <button
                    onClick={() => setIsAddingRule(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} />
                    <span>Watch Rule</span>
                </button>
            </div>

            {/* Create Rule Modal */}
            {isAddingRule && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="glass-card p-10 w-full max-w-lg shadow-[0_0_100px_rgba(37,99,235,0.2)]">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Set Watchpoint</h3>
                                <p className="text-xs text-blue-400 font-black uppercase tracking-widest mt-1">Rule Configuration</p>
                            </div>
                            <button onClick={() => setIsAddingRule(false)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRule} className="space-y-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Condition Type</label>
                                <select
                                    className="input-field bg-slate-900 border-white/10 h-14"
                                    value={newRule.type}
                                    onChange={e => setNewRule({ ...newRule, type: e.target.value as any })}
                                >
                                    <option value="PRICE">Price Velocity Alert</option>
                                    <option value="ALLOCATION">Weighted Allocation Alert</option>
                                </select>
                            </div>

                            {newRule.type === 'PRICE' ? (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Asset</label>
                                    <select
                                        className="input-field bg-slate-900 border-white/10 h-14"
                                        value={newRule.assetId}
                                        onChange={e => setNewRule({ ...newRule, assetId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Asset</option>
                                        {assets.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name} ({a.symbol})</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Asset Sector</label>
                                    <select
                                        className="input-field bg-slate-900 border-white/10 h-14"
                                        value={newRule.assetType}
                                        onChange={e => setNewRule({ ...newRule, assetType: e.target.value as any })}
                                        required
                                    >
                                        <option value="">Select Sector</option>
                                        <option value="CRYPTO">Digital Assets</option>
                                        <option value="STOCK">NSE Equities</option>
                                        <option value="MUTUAL_FUND">Mutual Funds</option>
                                        <option value="GOLD">Commodities (Gold)</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Threshold</label>
                                    <select
                                        className="input-field bg-slate-900 border-white/10 h-14"
                                        value={newRule.direction}
                                        onChange={e => setNewRule({ ...newRule, direction: e.target.value as any })}
                                    >
                                        <option value="ABOVE">Ascending Target</option>
                                        <option value="BELOW">Descending Target</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                        {newRule.type === 'PRICE' ? 'Trigger Value (₹)' : 'Threshold (%)'}
                                    </label>
                                    <input
                                        type="number" step="any"
                                        className="input-field bg-slate-900 border-white/10 h-14"
                                        value={newRule.type === 'PRICE' ? newRule.thresholdValue : newRule.thresholdPercent}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            if (newRule.type === 'PRICE') setNewRule({ ...newRule, thresholdValue: val });
                                            else setNewRule({ ...newRule, thresholdPercent: val });
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createRuleMutation.isPending}
                                className="btn-primary w-full h-14 flex items-center justify-center gap-3 text-lg"
                            >
                                {createRuleMutation.isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Plus size={20} />
                                )}
                                <span>{createRuleMutation.isPending ? 'Syncing Rule...' : 'Establish Watchpoint'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Active Rules */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Settings2 className="text-blue-400" size={20} />
                        <h3 className="text-lg font-black text-white tracking-tight italic">Active Surveillance</h3>
                    </div>

                    <div className="space-y-4">
                        {rules.map(rule => {
                            const asset = assets.find(a => a.id === rule.assetId);
                            return (
                                <div key={rule.id} className="glass-card hover:bg-white/[0.03] p-5 flex justify-between items-center transition-all group">
                                    <div>
                                        <p className="text-sm font-black text-white tracking-tight">
                                            {rule.type === 'PRICE' ? asset?.name || 'Asset' : rule.assetType?.replace('_', ' ')}
                                        </p>
                                        <p className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                                            <span className={clsx(
                                                "w-1.5 h-1.5 rounded-full",
                                                rule.direction === 'ABOVE' ? "bg-emerald-500" : "bg-rose-500"
                                            )}></span>
                                            {rule.direction} {rule.type === 'PRICE' ? formatValue(rule.thresholdValue || 0) : `${rule.thresholdPercent}%`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                                        className="p-3 bg-red-500/5 hover:bg-red-500 text-slate-500 hover:text-white rounded-xl transition-all border border-transparent hover:border-red-500 opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        {rules.length === 0 && (
                            <div className="text-center py-20 glass-card border-dashed">
                                <Bell size={32} className="mx-auto mb-4 text-slate-600 opacity-30" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Surveillance Offline</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Trigged Events (Log) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <History className="text-amber-400" size={20} />
                        <h3 className="text-lg font-black text-white tracking-tight italic">Incident Registry</h3>
                    </div>

                    <div className="space-y-4">
                        {events.map(event => (
                            <div key={event.id} className={clsx(
                                "p-6 rounded-3xl border transition-all flex justify-between items-center relative overflow-hidden group",
                                event.isRead
                                    ? "bg-white/[0.02] border-white/5 opacity-50"
                                    : "glass-card border-blue-500/20 bg-blue-500/[0.02] shadow-[0_0_40px_rgba(37,99,235,0.05)]"
                            )}>
                                {!event.isRead && <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,1)]"></div>}

                                <div className="space-y-2 max-w-[80%]">
                                    <p className={clsx(
                                        "text-sm tracking-tight transition-colors leading-relaxed",
                                        event.isRead ? "text-slate-500 font-medium" : "text-white font-black"
                                    )}>
                                        {event.message}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} />
                                        {new Date(event.triggeredAt).toLocaleString()}
                                    </p>
                                </div>

                                {!event.isRead && (
                                    <button
                                        onClick={() => markReadMutation.mutate(event.id)}
                                        className="p-3 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-xl transition-all border border-blue-500/20"
                                        title="Clear Alert"
                                    >
                                        <CheckCircle size={24} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="text-center py-32 glass-card border-dashed">
                                <AlertTriangle size={48} className="mx-auto mb-4 text-slate-600 opacity-20" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Recent Incidents</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
