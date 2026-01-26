import { useEffect, useState } from 'react';

const Splash = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0F172A] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
                {/* Clean centered Icon */}
                <div className="mb-6 h-24 w-24 flex items-center justify-center">
                    <img src="/assets/logo.svg" alt="InvestView Icon" className="h-full w-auto" />
                </div>

                {/* Clear, distinct typography */}
                <h1 className="text-5xl font-black text-white tracking-tight mb-2 flex items-center gap-1">
                    InvestView
                </h1>
                <p className="text-blue-400 text-lg font-semibold tracking-[0.2em] uppercase opacity-80">
                    Track. Analyze. Grow.
                </p>
            </div>

            {/* Progress indicator */}
            <div className="absolute bottom-20 flex flex-col items-center">
                <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-progress origin-left"></div>
                </div>
            </div>

            <style>{`
                @keyframes progress {
                    0% { transform: scaleX(0); }
                    100% { transform: scaleX(1); }
                }
                .animate-progress {
                    animation: progress 1s cubic-bezier(0.65, 0, 0.35, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default Splash;
