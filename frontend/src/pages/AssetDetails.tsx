import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Asset, Transaction } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Clock, Tag, Info } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

const AssetDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { formatValue, formatPnlPercent } = useCurrency() as any;
    const [isAddTxOpen, setIsAddTxOpen] = useState(false);

    const { data: asset, isLoading } = useQuery<Asset & { transactions: Transaction[] }>({
        queryKey: ['asset', id],
        queryFn: async () => {
            const res = await api.get(`/assets/${id}`);
            return res.data;
        }
    });

    const deleteTxMutation = useMutation({
        mutationFn: async (txId: string) => {
            await api.delete(`/transactions/${txId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asset', id] });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
        }
    });

    if (isLoading) return <div className="p-4 dark:text-gray-300">Loading asset details...</div>;
    if (!asset) return <div className="p-4 dark:text-gray-300">Asset not found</div>;

    const stats = [
        { label: `Holding Qty${['GOLD', 'SILVER'].includes(asset.type) ? ' (grams)' : ''}`, value: asset.holdingQuantity?.toFixed(4) || '0', icon: <Tag size={16} /> },
        { label: 'Avg Buy Price', value: formatValue(asset.avgBuyPrice || 0), icon: <Info size={16} /> },
        { label: 'Current Price', value: formatValue(asset.currentPrice || 0), icon: <Clock size={16} /> },
    ];

    const pnlItems = [
        { label: 'Realized P/L', value: asset.realizedPnl || 0 },
        { label: 'Unrealized P/L', value: asset.unrealizedPnl || 0 },
        { label: 'Total P/L', value: asset.totalPnl || 0 },
    ];

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Back to Assets</span>
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                            {asset.type.replace('_', ' ')}
                        </span>
                        {asset.symbol && <span className="text-xs text-gray-400 font-mono">{asset.symbol}</span>}
                        {(asset as any).manualCurrentValue && (
                            <span className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-800/30">
                                Current value: Manual
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{asset.name}</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/edit/${asset.id}`)}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-300"
                    >
                        Edit Asset Info
                    </button>
                    <button
                        onClick={() => setIsAddTxOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Add Transaction</span>
                    </button>
                </div>
            </div>

            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
                            {stat.icon}
                            <span>{stat.label}</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pnlItems.map((item, i) => {
                    const isProfit = item.value >= 0;
                    return (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="text-gray-500 dark:text-gray-400 text-sm mb-1 block">{item.label}</span>
                            <div className={clsx(
                                "text-xl font-bold flex items-center gap-2",
                                isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                {formatValue(Math.abs(item.value))}
                                {item.label === 'Total P/L' && (
                                    <span className="text-sm opacity-80 font-medium">
                                        ({formatPnlPercent(asset.totalPnl || 0, (asset.holdingQuantity || 0) * (asset.avgBuyPrice || 0))})
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Transaction History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">Transaction History</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{asset.transactions?.length || 0} entries</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold">Type</th>
                                <th className="px-6 py-3 font-semibold">Quantity</th>
                                <th className="px-6 py-3 font-semibold">Price</th>
                                <th className="px-6 py-3 font-semibold">Fees</th>
                                <th className="px-6 py-3 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {asset.transactions?.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                            tx.type === 'BUY' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">
                                        {tx.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        {formatValue(tx.pricePerUnit)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {tx.fees > 0 ? formatValue(tx.fees) : '--'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this transaction?')) deleteTxMutation.mutate(tx.id);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!asset.transactions || asset.transactions.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400 italic">
                                        No transactions found for this asset.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Add Transaction Overlay (Mocked for now or I can implement it later) */}
            {isAddTxOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6 border dark:border-gray-700">
                        <h3 className="text-xl font-bold mb-4 dark:text-white">Add Transaction</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const data = {
                                assetId: asset.id,
                                type: formData.get('type'),
                                quantity: formData.get('quantity'),
                                pricePerUnit: formData.get('pricePerUnit'),
                                fees: formData.get('fees'),
                                date: formData.get('date'),
                                notes: formData.get('notes')
                            };
                            try {
                                await api.post('/transactions', data);
                                queryClient.invalidateQueries({ queryKey: ['asset', id] });
                                setIsAddTxOpen(false);
                            } catch (err) {
                                alert('Error adding transaction');
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                                <select name="type" className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-gray-200">
                                    <option value="BUY">BUY</option>
                                    <option value="SELL">SELL</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
                                    <input type="number" step="any" name="quantity" required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-gray-200" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Price per Unit</label>
                                    <input type="number" step="any" name="pricePerUnit" required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-gray-200" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fees</label>
                                    <input type="number" step="any" name="fees" defaultValue="0" className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-gray-200" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                                    <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-gray-200" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                                <textarea name="notes" rows={2} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-gray-200" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddTxOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-300">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetDetails;
