import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Asset, AssetType } from '../types';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MFSearch from '../components/MFSearch';

type FormValues = {
    name: string;
    type: AssetType;
    symbol: string;
    quantity: number;
    investedAmount: number;
    manualPrice?: number;
    manualCurrentValue?: number;
    platform: string;
    date?: string;
};

const EditAsset = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const { data: asset, isLoading: queryLoading } = useQuery<Asset & { manualCurrentValue?: number }>({
        queryKey: ['asset', id],
        queryFn: async () => {
            const res = await api.get('/assets');
            return res.data.assets.find((a: Asset) => a.id === id); // Fix: dashboard returns {assets, metadata}
        }
    });

    const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>();

    useEffect(() => {
        if (asset) {
            const oldestTx = asset.transactions?.length
                ? [...asset.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                : null;
            const dateStr = oldestTx ? new Date(oldestTx.date).toISOString().split('T')[0] : '';

            reset({
                name: asset.name,
                type: asset.type as AssetType,
                symbol: asset.symbol || '',
                quantity: asset.quantity,
                investedAmount: asset.investedAmount,
                manualPrice: asset.manualPrice,
                manualCurrentValue: asset.manualCurrentValue,
                platform: asset.platform || 'Unknown',
                date: dateStr
            });
        }
    }, [asset, reset]);

    const selectedType = watch('type');

    useEffect(() => {
        if (selectedType === 'CASH') {
            setValue('quantity', 1);
        }
    }, [selectedType, setValue]);

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            // Auto-format symbol
            let formattedSymbol = data.symbol?.trim().toUpperCase() || '';
            if (data.type === 'STOCK' && formattedSymbol && !formattedSymbol.includes('.')) {
                formattedSymbol += '.NS';
            }

            await api.put(`/assets/${id}`, {
                ...data,
                symbol: formattedSymbol,
                quantity: Number(data.quantity),
                investedAmount: Number(data.investedAmount),
                manualPrice: data.manualPrice ? Number(data.manualPrice) : undefined,
                manualCurrentValue: data.manualCurrentValue ? Number(data.manualCurrentValue) : undefined,
                date: data.date
            });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            navigate('/assets');
        } catch (error) {
            alert("Failed to update asset");
        } finally {
            setLoading(false);
        }
    };

    if (queryLoading) return <div className="p-4 dark:text-gray-300">Loading asset...</div>;
    if (!asset) return <div className="p-4 text-red-500">Asset not found</div>;

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Asset</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asset Type</label>
                    <select
                        {...register('type', { required: true })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Type</option>
                        <option value="CRYPTO">Crypto</option>
                        <option value="STOCK">Stock (NSE)</option>
                        <option value="MUTUAL_FUND">Mutual Fund</option>
                        <option value="GOLD">Gold</option>
                        <option value="SILVER">Silver</option>
                        <option value="CASH">Cash</option>
                    </select>
                </div>

                {selectedType === 'MUTUAL_FUND' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Mutual Fund</label>
                            <MFSearch
                                onSelect={(mf) => {
                                    setValue('name', mf.schemeName);
                                    setValue('symbol', mf.schemeCode.toString());
                                }}
                                placeholder={asset.type === 'MUTUAL_FUND' ? asset.name : "Search new Mutual Fund..."}
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                        {...register('name', { required: "Name is required" })}
                        placeholder="e.g. Bitcoin, Reliance"
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && <span className="text-red-500 text-sm">{errors.name.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account / Platform</label>
                    <input
                        {...register('platform')}
                        list="platforms"
                        placeholder="e.g. Binance, Bank, Zerodha"
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <datalist id="platforms">
                        <option value="Binance" />
                        <option value="Zerodha" />
                        <option value="Bank" />
                        <option value="Wallet" />
                        <option value="Cash" />
                        <option value="Groww" />
                        <option value="KuCoin" />
                    </datalist>
                </div>

                {selectedType === 'CRYPTO' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Binance Symbol (e.g. BTC)
                        </label>
                        <input
                            {...register('symbol')}
                            placeholder="BTC"
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Enter Binance base symbol (BTC, ETH, SOL, USDT). Live prices are fetched automatically.
                        </p>
                    </div>
                )}

                {selectedType === 'STOCK' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Yahoo Symbol (e.g. RELIANCE)
                        </label>
                        <input
                            {...register('symbol')}
                            placeholder="RELIANCE"
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Just enter the name, we'll auto-add .NS for NSE stocks.
                        </p>
                    </div>
                )}

                {selectedType === 'MUTUAL_FUND' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scheme Code</label>
                        <input
                            {...register('symbol', { required: "Scheme code is required" })}
                            readOnly
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 focus:outline-none"
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity{['GOLD', 'SILVER'].includes(selectedType) ? ' (grams)' : ''}
                        </label>
                        <div className="relative">
                            <input
                                type="number" step="any"
                                {...register('quantity', { required: true })}
                                disabled={selectedType === 'CASH'}
                                className={`w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedType === 'CASH' ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-700'} ${['GOLD', 'SILVER'].includes(selectedType) ? 'pr-8' : ''}`}
                            />
                            {['GOLD', 'SILVER'].includes(selectedType) && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">g</span>
                            )}
                        </div>
                        {selectedType === 'CASH' && <p className="text-xs text-blue-500 mt-1">Cash value uses Invested Amount directly.</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invested Amount (₹)</label>
                        <input
                            type="number" step="any"
                            {...register('investedAmount', { required: true })}
                            className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Date</label>
                    <input
                        type="date"
                        {...register('date')}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">When did you buy this asset? Updating this will recalculate your portfolio history.</p>
                </div>

                {(['STOCK', 'GOLD', 'SILVER'].includes(selectedType)) && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">
                                {['GOLD', 'SILVER'].includes(selectedType) ? 'Manual Valuation' : 'Price Override'}
                            </h4>
                            <p className="text-xs text-amber-700/70 dark:text-amber-500/70">
                                {selectedType === 'GOLD' && 'Enter the current market price for 1 gram of Gold.'}
                                {selectedType === 'SILVER' && 'Enter the current market price for 1 KG of Silver.'}
                                {selectedType === 'STOCK' && 'Optional: Enter a price per unit to override the live Yahoo Finance data.'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {selectedType === 'GOLD' ? 'Current Price per Gram (₹)' :
                                    selectedType === 'SILVER' ? 'Current Price per KG (₹)' :
                                        'Manual Price Per Unit (₹)'}
                            </label>
                            <input
                                type="number" step="any"
                                {...register('manualPrice', { required: ['GOLD', 'SILVER'].includes(selectedType) })}
                                placeholder={selectedType === 'GOLD' ? "e.g. 7500" : selectedType === 'SILVER' ? "e.g. 85000" : "Optional: Enter price per unit"}
                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                        {loading ? 'Saving...' : 'Update Asset'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditAsset;
