import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { AllocationTargets } from '../hooks/useAllocation';
import { AssetType } from '../types';

interface TargetAllocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTargets: AllocationTargets;
    onSave: (targets: AllocationTargets) => void;
}

const ASSET_TYPES: AssetType[] = ['CRYPTO', 'STOCK', 'MUTUAL_FUND', 'CASH', 'GOLD', 'SILVER'];

const TargetAllocationModal: React.FC<TargetAllocationModalProps> = ({ isOpen, onClose, currentTargets, onSave }) => {
    const [targets, setTargets] = useState<AllocationTargets>(currentTargets);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const total = Object.values(targets).reduce((sum, val) => sum + val, 0);

    const handleChange = (type: AssetType, value: string) => {
        const numValue = parseFloat(value) || 0;
        setTargets(prev => ({ ...prev, [type]: numValue }));
        setError(null);
    };

    const handleSave = () => {
        if (Math.abs(total - 100) > 0.01) {
            setError(`Total must be exactly 100%. Current: ${total.toFixed(2)}%`);
            return;
        }
        onSave(targets);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border dark:border-gray-700">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-xl font-bold dark:text-white text-gray-900">Set Target Allocation</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Define your ideal portfolio balance. The sum must equal exactly 100%.
                    </p>

                    {ASSET_TYPES.map(type => (
                        <div key={type} className="flex items-center justify-between gap-4">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                {type.replace('_', ' ').toLowerCase()}
                            </label>
                            <div className="relative w-32">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={targets[type]}
                                    onChange={(e) => handleChange(type, e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 dark:text-gray-200 text-right font-mono"
                                />
                                <span className="absolute right-3 top-2 text-gray-400 font-mono">%</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 space-y-3">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Allocation</span>
                        <span className={`text-lg font-bold ${Math.abs(total - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {total.toFixed(2)}%
                        </span>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium dark:text-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                        >
                            Save Targets
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TargetAllocationModal;
