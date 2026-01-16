import { useState, useEffect } from 'react';
import { WifiOff, RefreshCcw } from 'lucide-react';

const OfflineBanner = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-300">
            <WifiOff size={18} />
            <span className="text-sm font-bold">
                Offline Mode: Showing last saved data
            </span>
            <button
                onClick={() => window.location.reload()}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                title="Retry connection"
            >
                <RefreshCcw size={14} />
            </button>
        </div>
    );
};

export default OfflineBanner;
