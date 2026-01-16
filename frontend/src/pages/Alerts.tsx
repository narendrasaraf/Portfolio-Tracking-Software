import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset, AssetType } from '../types';
import { Bell, Trash2, CheckCircle, AlertTriangle, Plus, X } from 'lucide-react';
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

    // Queries
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

    // Mutations
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white">Alerts & Reminders</h2>
                <button
                    onClick={() => setIsAddingRule(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} />
                    <span>New Rule</span>
                </button>
            </div>

            {/* Create Rule Modal/Form */}
            {isAddingRule && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold dark:text-white">Create Alert Rule</h3>
                            <button onClick={() => setIsAddingRule(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alert Type</label>
                                <select
                                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newRule.type}
                                    onChange={e => setNewRule({ ...newRule, type: e.target.value as any })}
                                >
                                    <option value="PRICE">Price Alert</option>
                                    <option value="ALLOCATION">Allocation Alert</option>
                                </select>
                            </div>

                            {newRule.type === 'PRICE' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Asset</label>
                                    <select
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newRule.assetId}
                                        onChange={e => setNewRule({ ...newRule, assetId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Asset</option>
                                        {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Type</label>
                                    <select
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newRule.assetType}
                                        onChange={e => setNewRule({ ...newRule, assetType: e.target.value as any })}
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="CRYPTO">Crypto</option>
                                        <option value="STOCK">Stock</option>
                                        <option value="MUTUAL_FUND">Mutual Fund</option>
                                        <option value="GOLD">Gold</option>
                                        <option value="SILVER">Silver</option>
                                        <option value="CASH">Cash</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
                                    <select
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newRule.direction}
                                        onChange={e => setNewRule({ ...newRule, direction: e.target.value as any })}
                                    >
                                        <option value="ABOVE">Above</option>
                                        <option value="BELOW">Below</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {newRule.type === 'PRICE' ? 'Price (₹)' : 'Percent (%)'}
                                    </label>
                                    <input
                                        type="number" step="any"
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none mt-2"
                            >
                                {createRuleMutation.isPending ? 'Saving...' : 'Create Rule'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Rules */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <Bell size={20} className="text-blue-500" />
                        Active Rules
                    </h3>
                    <div className="space-y-3">
                        {rules.map(rule => {
                            const asset = assets.find(a => a.id === rule.assetId);
                            return (
                                <div key={rule.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {rule.type === 'PRICE' ? asset?.name || 'Asset' : rule.assetType}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {rule.direction} {rule.type === 'PRICE' ? formatValue(rule.thresholdValue || 0) : `${rule.thresholdPercent}%`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        {rules.length === 0 && (
                            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-700 text-gray-500">
                                No alert rules set.
                            </div>
                        )}
                    </div>
                </div>

                {/* Trigged Events (Log) */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <AlertTriangle size={20} className="text-amber-500" />
                        History (Recent Events)
                    </h3>
                    <div className="space-y-3">
                        {events.map(event => (
                            <div key={event.id} className={clsx(
                                "p-4 rounded-2xl border transition-all flex justify-between items-center",
                                event.isRead
                                    ? "bg-gray-50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-60"
                                    : "bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/30 shadow-sm"
                            )}>
                                <div className="space-y-1">
                                    <p className={clsx("text-sm transition-colors", event.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white font-medium")}>
                                        {event.message}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        {new Date(event.triggeredAt).toLocaleString()}
                                    </p>
                                </div>
                                {!event.isRead && (
                                    <button
                                        onClick={() => markReadMutation.mutate(event.id)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Mark as read"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-700 text-gray-500">
                                No events triggered yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Alerts;
