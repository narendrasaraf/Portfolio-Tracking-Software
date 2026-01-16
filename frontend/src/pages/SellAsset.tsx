import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Asset } from '../types';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type FormValues = {
    quantity: number;
    price: number;
};

const SellAsset = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    const { data: asset, isLoading: queryLoading } = useQuery<Asset>({
        queryKey: ['asset', id],
        queryFn: async () => {
            const res = await api.get(`/assets/${id}`);
            return res.data;
        }
    });

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

    const onSubmit = async (data: FormValues) => {
        if (!asset) return;
        const currentHolding = asset.holdingQuantity ?? 0;
        if (data.quantity > currentHolding) {
            alert("Cannot sell more than you hold!");
            return;
        }

        setLoading(true);
        try {
            await api.post(`/assets/${id}/sell`, {
                quantity: Number(data.quantity),
                price: Number(data.price)
            });
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['asset', id] });
            navigate('/assets');
        } catch (error) {
            alert("Failed to sell asset");
        } finally {
            setLoading(false);
        }
    };

    if (queryLoading) return <div className="p-4">Loading asset...</div>;
    if (!asset) return <div className="p-4 text-red-500">Asset not found</div>;

    return (
        <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-6">Sell Asset</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        Asset: <span className="font-bold">{asset.name}</span>
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        Total Holdings: <span className="font-bold">{asset.holdingQuantity ?? 0} {asset.symbol || ''}</span>
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity to Sell</label>
                    <input
                        type="number" step="any"
                        {...register('quantity', {
                            required: "Quantity is required",
                            max: { value: asset.holdingQuantity ?? 0, message: "Exceeds holdings" },
                            min: { value: 0.00000001, message: "Must be positive" }
                        })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.quantity && <span className="text-red-500 text-sm">{errors.quantity.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price (per unit in ₹)</label>
                    <input
                        type="number" step="any"
                        {...register('price', { required: "Price is required" })}
                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.price && <span className="text-red-500 text-sm">{errors.price.message}</span>}
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none">
                        {loading ? 'Processing...' : 'Record Sale'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SellAsset;
