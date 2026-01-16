import React, { useMemo } from 'react';
import { Asset } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

interface TopMoversProps {
    assets: Asset[];
}

const TopMovers: React.FC<TopMoversProps> = ({ assets }) => {
    const { formatValue } = useCurrency() as any;
    const navigate = useNavigate();

    const { gainers, losers } = useMemo(() => {
        // Filter assets with active holdings and valid daily change
        const activeMovers = assets.filter(a =>
            (a.holdingQuantity || 0) > 0 &&
            a.dailyChangePercent !== undefined &&
            a.dailyChangePercent !== 0
        );

        const sorted = [...activeMovers].sort((a, b) => (b.dailyChangePercent || 0) - (a.dailyChangePercent || 0));

        return {
            gainers: sorted.slice(0, 3).filter(a => (a.dailyChangePercent || 0) > 0),
            losers: sorted.slice(-3).reverse().filter(a => (a.dailyChangePercent || 0) < 0)
        };
    }, [assets]);

    const MoverItem = ({ asset, isGainer }: { asset: Asset, isGainer: boolean }) => (
        <div
            onClick={() => navigate(`/assets/${asset.id}`)}
            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer transition-all group"
        >
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">{asset.name}</span>
                <span className="text-[10px] text-gray-500 uppercase">{asset.type}</span>
            </div>
            <div className="text-right">
                <div className={clsx(
                    "flex items-center justify-end gap-1 text-sm font-bold",
                    isGainer ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                    {isGainer ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(asset.dailyChangePercent || 0).toFixed(2)}%
                </div>
                <div className="text-[11px] text-gray-500">
                    {asset.dailyChangeInr && asset.dailyChangeInr >= 0 ? '+' : ''}{formatValue(asset.dailyChangeInr || 0)}
                </div>
            </div>
        </div>
    );

    if (gainers.length === 0 && losers.length === 0) return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Top Movers (Today)</h3>
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
                <Minus size={32} className="mb-2 opacity-20" />
                <p className="text-sm italic">Not enough data for today's movers yet.</p>
                <p className="text-[10px]">Changes will appear after the first price refresh of the day.</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Top Movers (Today)</h3>

            <div className="space-y-6">
                {gainers.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Top Gainers</p>
                        <div className="space-y-2">
                            {gainers.map(a => <MoverItem key={a.id} asset={a} isGainer={true} />)}
                        </div>
                    </div>
                )}

                {losers.length > 0 && (
                    <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Top Losers</p>
                        <div className="space-y-2">
                            {losers.map(a => <MoverItem key={a.id} asset={a} isGainer={false} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopMovers;
