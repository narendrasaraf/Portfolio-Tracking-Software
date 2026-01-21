import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'INR' | 'USDT';

interface CurrencyContextType {
    currency: Currency;
    toggleCurrency: () => void;
    conversionRate: number;
    formatValue: (value: number) => string;
    formatPnlPercent: (pnl: number, invested: number) => string;
    convertToSelected: (value: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrency] = useState<Currency>(() => {
        const saved = localStorage.getItem('portfolio_currency');
        return (saved as Currency) || 'INR';
    });
    const [conversionRate, setConversionRate] = useState<number>(83.5);

    useEffect(() => {
        localStorage.setItem('portfolio_currency', currency);
    }, [currency]);

    const toggleCurrency = () => {
        setCurrency(prev => prev === 'INR' ? 'USDT' : 'INR');
    };

    const convertToSelected = (value: number) => {
        if (currency === 'INR') return value;
        return value / conversionRate;
    };

    const formatValue = (value: number) => {
        const converted = convertToSelected(value);
        if (currency === 'INR') {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(converted);
        } else {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 2
            }).format(converted);
        }
    };

    const formatPnlPercent = (pnl: number, invested: number) => {
        if (!invested || invested <= 0) return "--";
        const percent = (pnl / invested) * 100;
        return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            toggleCurrency,
            conversionRate,
            setConversionRate,
            formatValue,
            formatPnlPercent,
            convertToSelected
        } as any}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
    return context;
};
