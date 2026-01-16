import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { X, Upload, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';

interface RestoreBackupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RestoreBackupModal: React.FC<RestoreBackupModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'MERGE' | 'REPLACE'>('MERGE');
    const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const restoreMutation = useMutation({
        mutationFn: async () => {
            if (!file) return;
            const reader = new FileReader();
            const data = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(JSON.parse(reader.result as string));
                reader.onerror = reject;
                reader.readAsText(file);
            });

            await api.post('/backup/import', { data, mode });
        },
        onSuccess: () => {
            setSuccess(true);
            queryClient.invalidateQueries();
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFile(null);
            }, 2000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || err.message || "Failed to restore backup");
        }
    });

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        if (mode === 'REPLACE' && !isConfirmingReplace) {
            setIsConfirmingReplace(true);
            return;
        }

        restoreMutation.mutate();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl w-full max-w-md border dark:border-gray-700 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Upload size={20} className="text-blue-500" />
                        Restore Portfolio
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                            <CheckCircle size={40} />
                        </div>
                        <div>
                            <p className="text-lg font-bold dark:text-white">Restore Successful!</p>
                            <p className="text-sm text-gray-500">Your portfolio data has been restored.</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Picker */}
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className={clsx(
                                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors text-center",
                                file
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            )}>
                                <Upload size={32} className={file ? "text-blue-500" : "text-gray-400"} />
                                <p className="mt-2 text-sm font-medium dark:text-gray-200">
                                    {file ? file.name : "Click to select backup JSON"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Only .json files exported from this app</p>
                            </div>
                        </div>

                        {/* Mode Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Restore Mode</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setMode('MERGE'); setIsConfirmingReplace(false); }}
                                    className={clsx(
                                        "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1",
                                        mode === 'MERGE'
                                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                            : "border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                    )}
                                >
                                    <span>Merge</span>
                                    <span className="text-[10px] opacity-60">Keep existing, add new</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('REPLACE')}
                                    className={clsx(
                                        "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1",
                                        mode === 'REPLACE'
                                            ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                            : "border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                    )}
                                >
                                    <span>Replace</span>
                                    <span className="text-[10px] opacity-60 font-bold">Wipe & overwrite</span>
                                </button>
                            </div>
                        </div>

                        {/* Warning for Replace */}
                        {isConfirmingReplace && mode === 'REPLACE' && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3 text-red-800 dark:text-red-300 animate-pulse">
                                <AlertTriangle size={20} className="shrink-0" />
                                <div className="text-xs">
                                    <p className="font-bold">CRITICAL WARNING</p>
                                    <p>Choosing "Replace" will DELETE ALL current data including assets, transactions, and snapshots. This CANNOT be undone.</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                                <Info size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!file || restoreMutation.isPending}
                            className={clsx(
                                "w-full py-3 font-bold rounded-xl transition-all shadow-lg",
                                mode === 'REPLACE' && isConfirmingReplace
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none"
                            )}
                        >
                            {restoreMutation.isPending ? 'Restoring...' : (isConfirmingReplace ? 'I UNDERSTAND, RESTORE NOW' : 'Start Restore')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RestoreBackupModal;
