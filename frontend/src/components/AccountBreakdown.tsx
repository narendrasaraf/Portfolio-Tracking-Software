import React, { useMemo } from 'react';
import { Asset } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

interface AccountBreakdownProps {
    assets: Asset[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const AccountBreakdown: React.FC<AccountBreakdownProps> = ({ assets }) => {
    const { formatValue } = useCurrency() as any;

    const data = useMemo(() => {
        const accounts: Record<string, number> = {};
        let total = 0;

        assets.forEach(asset => {
            if ((asset.holdingQuantity || 0) > 0) {
                const platform = asset.platform || 'Unknown';
                const value = asset.currentValue || 0;
                accounts[platform] = (accounts[platform] || 0) + value;
                total += value;
            }
        });

        return Object.entries(accounts)
            .map(([name, value]) => ({
                name,
                value,
                percent: total > 0 ? (value / total) * 100 : 0
            }))
            .sort((a, b) => b.value - a.value);
    }, [assets]);

    if (data.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Net Worth by Account</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => formatValue(value)}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                    {data.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between group">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-500 transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatValue(item.value)}</p>
                                <p className="text-[10px] text-gray-500">{item.percent.toFixed(1)}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AccountBreakdown;
