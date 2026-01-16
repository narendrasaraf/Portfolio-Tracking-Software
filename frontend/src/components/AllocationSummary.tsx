import React from 'react';
import { AssetType } from '../types';
import { AllocationTargets } from '../hooks/useAllocation';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';

interface AllocationSummaryProps {
    data: {
        type: AssetType;
        value: number;
        percentage: number;
    }[];
    targets: AllocationTargets;
    formatValue: (val: number) => string;
}

const AllocationSummary: React.FC<AllocationSummaryProps> = ({ data, targets, formatValue }) => {

    const getDeviation = (type: AssetType, actualPercent: number) => {
        const target = targets[type] || 0;
        const diff = actualPercent - target;
        return {
            diff,
            isWarning: Math.abs(diff) > 5
        };
    };

    const typeLabels: Record<AssetType, string> = {
        CRYPTO: 'Crypto',
        STOCK: 'Stocks',
        MUTUAL_FUND: 'Mutual Funds',
        CASH: 'Cash',
        GOLD: 'Gold',
        SILVER: 'Silver'
    };

    // Include types that have either value > 0 OR a target > 0
    const allTypes = (Object.keys(targets) as AssetType[]).filter(type => {
        const hasValue = data.find(d => d.type === type)?.value || 0;
        const hasTarget = targets[type] || 0;
        return hasValue > 0 || hasTarget > 0;
    });

    const warnings = allTypes.map(type => {
        const actual = data.find(d => d.type === type)?.percentage || 0;
        const { diff, isWarning } = getDeviation(type, actual);
        if (!isWarning) return null;
        return { type, diff };
    }).filter(Boolean);

    return (
        <div className="space-y-4">
            {warnings.length > 0 && (
                <div className="flex gap-2 items-start p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl">
                    <AlertTriangle className="text-orange-500 mt-0.5 shrink-0" size={16} />
                    <p className="text-xs text-orange-700 dark:text-orange-400 font-medium leading-relaxed">
                        Deviation Alerts: {warnings.map((w, i) => (
                            <span key={w!.type}>
                                {typeLabels[w!.type]} {w!.diff > 0 ? 'overweight' : 'underweight'} by {Math.abs(w!.diff).toFixed(1)}%
                                {i < warnings.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </p>
                </div>
            )}

            <div className="space-y-2">
                {allTypes.map(type => {
                    const item = data.find(d => d.type === type);
                    const actualPercentage = item?.percentage || 0;
                    const value = item?.value || 0;
                    const target = targets[type] || 0;
                    const { diff, isWarning } = getDeviation(type, actualPercentage);

                    return (
                        <div key={type} className="flex flex-col gap-1.5 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "w-2 h-2 rounded-full",
                                        type === 'CRYPTO' && "bg-orange-500",
                                        type === 'STOCK' && "bg-blue-500",
                                        type === 'MUTUAL_FUND' && "bg-green-500",
                                        type === 'CASH' && "bg-gray-400",
                                        type === 'GOLD' && "bg-yellow-500",
                                        type === 'SILVER' && "bg-slate-300"
                                    )} />
                                    <span className="text-sm font-semibold dark:text-gray-200">{typeLabels[type]}</span>
                                    {isWarning && (
                                        <span className={clsx(
                                            "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                            diff > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                        )}>
                                            {diff > 0 ? 'Overweight' : 'Underweight'}
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold dark:text-gray-100">{formatValue(value)}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                        {actualPercentage.toFixed(2)}% <span className="mx-1">/</span> Target {target}%
                                    </p>
                                </div>
                            </div>

                            {/* Visual Bar representation */}
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                <div
                                    className={clsx(
                                        "h-full transition-all duration-500",
                                        type === 'CRYPTO' && "bg-orange-500",
                                        type === 'STOCK' && "bg-blue-500",
                                        type === 'MUTUAL_FUND' && "bg-green-500",
                                        type === 'CASH' && "bg-gray-400",
                                        type === 'GOLD' && "bg-yellow-500",
                                        type === 'SILVER' && "bg-slate-300"
                                    )}
                                    style={{ width: `${actualPercentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AllocationSummary;
