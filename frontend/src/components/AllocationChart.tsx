import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Asset, AssetType } from '../types';
import { Settings } from 'lucide-react';
import AllocationSummary from './AllocationSummary';
import { useAllocation } from '../hooks/useAllocation';
import TargetAllocationModal from './TargetAllocationModal';
import { useCurrency } from '../context/CurrencyContext';

interface AllocationChartProps {
    assets: Asset[];
}

const COLORS: Record<AssetType, string> = {
    CRYPTO: '#f97316',      // orange-500
    STOCK: '#3b82f6',       // blue-500
    MUTUAL_FUND: '#22c55e', // green-500
    CASH: '#9ca3af',        // gray-400
    GOLD: '#eab308',        // yellow-500
    SILVER: '#cbd5e1'       // slate-300
};

const AllocationChart: React.FC<AllocationChartProps> = ({ assets }) => {
    const { targets, saveTargets } = useAllocation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { formatValue } = useCurrency() as any;

    const allocationData = useMemo(() => {
        // We only care about active holdings
        const activeAssets = assets.filter(a => (a.holdingQuantity ?? 0) > 0);

        // Group by type
        const totalsByType = activeAssets.reduce((acc, asset) => {
            const type = asset.type;
            const value = asset.currentValue || 0;
            acc[type] = (acc[type] || 0) + value;
            return acc;
        }, {} as Record<string, number>);

        const totalValue = Object.values(totalsByType).reduce((sum, val) => sum + val, 0);

        if (totalValue === 0) return [];

        // Map to Recharts format + include percentages
        return Object.entries(totalsByType).map(([type, value]) => ({
            name: type,
            type: type as AssetType,
            value: value,
            percentage: (value / totalValue) * 100
        })).sort((a, b) => b.value - a.value);
    }, [assets]);

    const chartData = allocationData.map(d => ({
        name: d.name.replace('_', ' ').toLowerCase(),
        value: d.value,
        type: d.type
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((data.value / allocationData.reduce((s, d) => s + d.value, 0)) * 100).toFixed(2);
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        {data.name}
                    </p>
                    <p className="text-sm font-bold dark:text-white">
                        {formatValue(data.value)}
                    </p>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                        {percentage}% of portfolio
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Asset Allocation</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current holdings vs target goals</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                    title="Set Target Allocation"
                >
                    <Settings size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Pie Chart Container */}
                <div className="h-[280px] w-full relative">
                    {allocationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.type as AssetType] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-full">
                            <p className="text-sm text-gray-400">No assets to show</p>
                        </div>
                    )}

                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total</span>
                        <span className="text-sm font-bold dark:text-white">Assets</span>
                    </div>
                </div>

                {/* Legend & Alerts */}
                <AllocationSummary
                    data={allocationData}
                    targets={targets}
                    formatValue={formatValue}
                />
            </div>

            <TargetAllocationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                currentTargets={targets}
                onSave={saveTargets}
            />
        </div>
    );
};

export default AllocationChart;
