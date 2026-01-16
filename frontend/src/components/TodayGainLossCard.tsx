import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import clsx from 'clsx';

const TodayGainLossCard: React.FC = () => {
    const { formatValue } = useCurrency() as any;

    const { data, isLoading } = useQuery({
        queryKey: ['dailyChange'],
        queryFn: async () => {
            const res = await api.get('/portfolio/daily-change');
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-32 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
        );
    }

    const value = data?.dailyChangeInr;
    const percent = data?.dailyChangePercent;
    const isPositive = (value || 0) >= 0;
    const hasData = value !== null && percent !== null;

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-32 relative overflow-hidden transition-colors">
            <div className="z-10">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Today's Gain/Loss</p>
                {hasData ? (
                    <>
                        <h3 className={clsx("text-2xl font-bold", isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {isPositive ? '+' : '-'}{formatValue(Math.abs(value))}
                        </h3>
                        <p className={clsx("text-sm font-medium mt-1", isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            ({isPositive ? '+' : ''}{percent.toFixed(2)}%)
                        </p>
                    </>
                ) : (
                    <div className="flex items-center space-x-2 text-gray-400 mt-2">
                        <Minus size={20} />
                        <span className="text-sm">No data yet</span>
                    </div>
                )}
            </div>
            <div className={clsx("absolute -bottom-4 -right-4 p-4 rounded-full opacity-10", isPositive ? "bg-green-500" : "bg-red-500")}>
                {isPositive ? <TrendingUp size={64} /> : <TrendingDown size={64} />}
            </div>
            {!hasData && (
                <p className="absolute bottom-2 left-5 text-[10px] text-gray-400 italic">
                    Waiting for tomorrow's comparison
                </p>
            )}
        </div>
    );
};

export default TodayGainLossCard;
