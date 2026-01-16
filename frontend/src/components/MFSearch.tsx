import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';


interface MFSearchResult {
    schemeCode: number;
    schemeName: string;
}

interface MFSearchProps {
    onSelect: (scheme: MFSearchResult) => void;
    placeholder?: string;
}

const MFSearch: React.FC<MFSearchProps> = ({ onSelect, placeholder = "Search Mutual Fund..." }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MFSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim() || query.length < 3) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await axios.get(`https://api.mfapi.in/mf/search?q=${query}`);
                setResults(Array.isArray(res.data) ? res.data : []);
                setIsOpen(true);
            } catch (err) {
                setError("Search failed");
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value.length >= 3) setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-blue-500" size={18} />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl">
                    {results.length > 0 ? (
                        results.map((item) => (
                            <button
                                key={item.schemeCode}
                                type="button"
                                onClick={() => {
                                    onSelect(item);
                                    setQuery(item.schemeName);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
                            >
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{item.schemeName}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 uppercase font-bold tracking-wider">Code: {item.schemeCode}</p>
                            </button>
                        ))
                    ) : (
                        !isLoading && query.length >= 3 && (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                {error || "No mutual funds found"}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default MFSearch;
