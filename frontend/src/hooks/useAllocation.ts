import { useState } from 'react';
import { AssetType } from '../types';

export type AllocationTargets = Record<AssetType, number>;

const DEFAULT_TARGETS: AllocationTargets = {
    CRYPTO: 30,
    STOCK: 30,
    MUTUAL_FUND: 30,
    CASH: 10,
    GOLD: 0,
    SILVER: 0
};

const STORAGE_KEY = 'portfolio_allocation_targets';

export const useAllocation = () => {
    const [targets, setTargets] = useState<AllocationTargets>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return DEFAULT_TARGETS;
            }
        }
        return DEFAULT_TARGETS;
    });

    const saveTargets = (newTargets: AllocationTargets) => {
        setTargets(newTargets);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTargets));
    };

    return { targets, saveTargets };
};
