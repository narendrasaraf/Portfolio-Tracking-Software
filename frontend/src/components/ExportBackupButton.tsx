import React, { useState } from 'react';
import { Download, FileJson, FileText, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const ExportBackupButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleExport = (format: 'json' | 'csv') => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const url = `${apiUrl}/backup/export?format=${format}`;
        window.open(url, '_blank');
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
            >
                <Download size={16} />
                <span>Backup / Export</span>
                <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => handleExport('json')}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg transition-colors group"
                            >
                                <FileJson size={18} className="text-gray-400 group-hover:text-blue-500" />
                                <div className="text-left">
                                    <p className="font-bold">JSON Backup</p>
                                    <p className="text-[10px] text-gray-400">Complete data restore</p>
                                </div>
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 rounded-lg transition-colors group"
                            >
                                <FileText size={18} className="text-gray-400 group-hover:text-green-500" />
                                <div className="text-left">
                                    <p className="font-bold">CSV Export</p>
                                    <p className="text-[10px] text-gray-400">Spreadsheet friendly</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportBackupButton;
