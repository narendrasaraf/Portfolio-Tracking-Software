import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AssetType } from '../types';
import { useState, useEffect } from 'react';
import MFSearch from '../components/MFSearch';
import { ChevronLeft, Save, Info, Briefcase, TrendingUp, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';

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

const AddAsset = () => {
    const navigate = useNavigate();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>();
    const [loading, setLoading] = useState(false);

    const selectedType = watch('type');

    useEffect(() => {
        if (selectedType === 'CASH') {
            setValue('quantity', 1);
        }
    }, [selectedType, setValue]);

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        try {
            let formattedSymbol = data.symbol?.trim().toUpperCase() || '';
            if (data.type === 'STOCK' && formattedSymbol && !formattedSymbol.includes('.')) {
                formattedSymbol += '.NS';
            }

            await api.post('/assets', {
                ...data,
                symbol: formattedSymbol,
                quantity: Number(data.quantity),
                investedAmount: Number(data.investedAmount),
                manualPrice: data.manualPrice ? Number(data.manualPrice) : undefined,
                manualCurrentValue: data.manualCurrentValue ? Number(data.manualCurrentValue) : undefined,
                date: data.date
            });
            navigate('/assets');
        } catch (error) {
            alert("Failed to add asset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="heading-2">Add New Investment</h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Initialization Phase</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Section 1: Classification */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <LayoutGrid size={18} />
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight">Classification</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Asset Type</label>
                            <select
                                {...register('type', { required: true })}
                                className="input-field appearance-none cursor-pointer bg-slate-900 border-white/10"
                            >
                                <option value="">Select Category</option>
                                <option value="CRYPTO">Digital Currency (Crypto)</option>
                                <option value="STOCK">Equity (NSE Stocks)</option>
                                <option value="MUTUAL_FUND">Mutual Fund (Direct/Regular)</option>
                                <option value="GOLD">Commodity (Gold)</option>
                                <option value="SILVER">Commodity (Silver)</option>
                                <option value="CASH">Fiat Currency (Cash/Bank)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Platform / Broker</label>
                            <input
                                {...register('platform')}
                                list="platforms"
                                placeholder="e.g. Zerodha, Binance, Bank"
                                className="input-field"
                            />
                            <datalist id="platforms">
                                <option value="Binance" />
                                <option value="Zerodha" />
                                <option value="Bank" />
                                <option value="Wallet" />
                                <option value="Groww" />
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* Section 2: Asset Details */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Briefcase size={18} />
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight">Asset Identifiers</h3>
                    </div>

                    {selectedType === 'MUTUAL_FUND' && (
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                            <label className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3 block">Global Fund Registry</label>
                            <MFSearch
                                onSelect={(mf) => {
                                    setValue('name', mf.schemeName);
                                    setValue('symbol', mf.schemeCode.toString());
                                }}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Asset Name</label>
                            <input
                                {...register('name', { required: "Name is required" })}
                                placeholder="Company or Coin name"
                                className="input-field"
                            />
                            {errors.name && <span className="text-rose-500 text-[10px] font-bold uppercase tracking-widest">{errors.name.message}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Identifier / Symbol</label>
                            <input
                                {...register('symbol', { required: selectedType === 'MUTUAL_FUND' })}
                                readOnly={selectedType === 'MUTUAL_FUND'}
                                placeholder={selectedType === 'CRYPTO' ? 'e.g. BTC' : selectedType === 'STOCK' ? 'e.g. RELIANCE' : 'N/A'}
                                className={clsx("input-field", selectedType === 'MUTUAL_FUND' && "opacity-50")}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Financials */}
                <div className="glass-card p-8 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <TrendingUp size={18} />
                        </div>
                        <h3 className="text-lg font-black text-white tracking-tight">Financial Parameters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                Quantity {['GOLD', 'SILVER'].includes(selectedType) ? '(g)' : ''}
                            </label>
                            <div className="relative">
                                <input
                                    type="number" step="any"
                                    {...register('quantity', { required: true })}
                                    disabled={selectedType === 'CASH'}
                                    className={clsx("input-field", selectedType === 'CASH' && "opacity-50")}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Invested Principle</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                <input
                                    type="number" step="any"
                                    {...register('investedAmount', { required: true })}
                                    className="input-field pl-8"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-1">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Purchase Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    {...register('date')}
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {(['STOCK', 'GOLD', 'SILVER'].includes(selectedType)) && (
                        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex gap-3">
                                <Info size={20} className="text-amber-400 shrink-0" />
                                <p className="text-xs text-amber-200/60 font-medium">
                                    {['GOLD', 'SILVER'].includes(selectedType)
                                        ? 'Commodity prices require manual sync. Enter current market rate.'
                                        : 'Optional: Override live market data with a custom valuation price.'}
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">
                                    Valuation Price (₹)
                                </label>
                                <input
                                    type="number" step="any"
                                    {...register('manualPrice', { required: ['GOLD', 'SILVER'].includes(selectedType) })}
                                    placeholder="Price per unit"
                                    className="input-field border-amber-500/20 focus:ring-amber-500/50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn-secondary flex-1 order-2 sm:order-1"
                    >
                        Abort Operation
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex-1 flex items-center justify-center gap-3 order-1 sm:order-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save size={20} />
                        )}
                        <span>{loading ? 'Processing...' : 'Sync Investment Data'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddAsset;
