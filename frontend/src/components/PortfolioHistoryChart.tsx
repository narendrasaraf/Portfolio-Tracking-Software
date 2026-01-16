import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useCurrency } from '../context/CurrencyContext';
import clsx from 'clsx';

type Range = '7D' | '1M' | '3M' | '1Y' | 'ALL';

const PortfolioHistoryChart: React.FC = () => {
    const [range, setRange] = useState<Range>('1M');
    const { formatValue } = useCurrency() as any;

    const { data, isLoading } = useQuery({
        queryKey: ['portfolioHistory', range],
        queryFn: async () => {
            const res = await api.get(`/portfolio/history?range=${range}`);
            return res.data;
        }
    });

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                        {format(parseISO(data.date), 'MMM dd, yyyy')}
                    </p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">Net Worth</span>
                            <span className="text-sm font-bold dark:text-white">{formatValue(data.netWorthInr)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">Invested</span>
                            <span className="text-sm font-medium dark:text-gray-300">{formatValue(data.investedInr)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-xs text-gray-500">P/L</span>
                            <span className={clsx("text-sm font-bold", data.profitLossInr >= 0 ? "text-green-500" : "text-red-500")}>
                                {data.profitLossInr >= 0 ? '+' : ''}{formatValue(data.profitLossInr)}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const ranges: Range[] = ['7D', '1M', '3M', '1Y', 'ALL'];

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio History</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Track your progress over time</p>
                </div>
                <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shrink-0">
                    {ranges.map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={clsx(
                                "px-3 py-1.5 text-xs font-bold transition-all rounded-lg",
                                range === r
                                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[300px] w-full">
                {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="animate-pulse text-gray-400">Loading history...</div>
                    </div>
                ) : data?.points?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.points}>
                            <defs>
                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-gray-700/50" />
                            <XAxis
                                dataKey="date"
                                fontSize={10}
                                tickFormatter={(val) => format(parseISO(val), 'MMM dd')}
                                axisLine={false}
                                tickLine={false}
                                stroke="#94a3b8"
                                dy={10}
                            />
                            <YAxis
                                fontSize={10}
                                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                                axisLine={false}
                                tickLine={false}
                                stroke="#94a3b8"
                                hide={window.innerWidth < 640}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Area
                                type="monotone"
                                dataKey="netWorthInr"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorNetWorth)"
                                animationDuration={1500}
                                connectNulls
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-50 dark:border-gray-700 rounded-2xl">
                        <p className="text-sm text-gray-400">No historical data yet. Check back tomorrow!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioHistoryChart;
