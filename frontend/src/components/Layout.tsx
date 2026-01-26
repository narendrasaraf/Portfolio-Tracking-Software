import { Home, PieChart, PlusCircle, LogOut, History as HistoryIcon, Bell, BarChart2, Lightbulb, User as UserIcon, Menu, X, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import clsx from 'clsx';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
    const { logout } = useAuth();
    useTheme();
    const { currency, toggleCurrency } = useCurrency();
    const location = useLocation();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    useEffect(() => {
        setIsDrawerOpen(false);
    }, [location.pathname]);

    const allNavItems = [
        { path: '/', label: 'Overview', icon: Home },
        { path: '/assets', label: 'Portfolio', icon: PieChart },
        { path: '/analytics', label: 'Analysis', icon: BarChart2 },
        { path: '/insights', label: 'Strategy', icon: Lightbulb },
        { path: '/alerts', label: 'Monitor', icon: Bell },
        { path: '/add', label: 'Invest', icon: PlusCircle },
        { path: '/history', label: 'Timeline', icon: HistoryIcon },
        { path: '/profile', label: 'Settings', icon: UserIcon },
    ];

    const mobilePrimaryItems = [
        allNavItems[0], // Overview
        allNavItems[1], // Portfolio
        allNavItems[5], // Invest
        allNavItems[7], // Settings
    ];

    const mobileDrawerItems = [
        allNavItems[2], // Analysis
        allNavItems[3], // Strategy
        allNavItems[4], // Monitor
        allNavItems[6], // Timeline
    ];

    return (
        <div className="flex flex-col h-screen bg-transparent font-sans antialiased text-slate-50">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all duration-300">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-all group">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <img src="/assets/logo.svg" alt="InvestView" className="h-6 w-6 invert brightness-0 underline" style={{ filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white">
                            InvestView
                        </h1>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] leading-none">Premium</p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                    {allNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-200 font-semibold text-sm",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    {/* Currency Toggle */}
                    <button
                        onClick={toggleCurrency}
                        className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Coins size={14} className="text-blue-400" />
                        <span className={clsx(currency === 'INR' ? "text-white" : "text-slate-500")}>INR</span>
                        <div className="w-[1px] h-3 bg-white/10"></div>
                        <span className={clsx(currency === 'USDT' ? "text-white" : "text-slate-500")}>USD</span>
                    </button>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="lg:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logout - Hidden on mobile if needed, but keeps desktop accessibility */}
                    <button
                        onClick={logout}
                        className="hidden lg:flex p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Mobile Drawer */}
            <div className={clsx(
                "fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 lg:hidden",
                isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsDrawerOpen(false)}>
                <div
                    className={clsx(
                        "absolute right-0 top-0 h-full w-72 bg-slate-900 border-l border-white/5 p-8 shadow-2xl transition-transform duration-500 ease-out",
                        isDrawerOpen ? "translate-x-0" : "translate-x-full"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-white">Menu</h2>
                            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">Navigation</p>
                        </div>
                        <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {mobileDrawerItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={clsx(
                                        "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-2xl shadow-blue-600/40"
                                            : "bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <Icon size={22} />
                                    <span className="font-bold">{item.label}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-6 mt-6 border-t border-white/5">
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-500 font-bold"
                            >
                                <LogOut size={22} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 pb-28 lg:pb-8 lg:px-12 max-w-7xl mx-auto w-full">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border-t border-white/5 flex justify-around py-4 px-6 safe-area-bottom z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
                {mobilePrimaryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center gap-1.5 transition-all duration-300 relative",
                                isActive ? "text-blue-400" : "text-slate-500"
                            )}
                        >
                            <div className={clsx(
                                "p-2 rounded-2xl transition-all duration-300",
                                isActive ? "bg-blue-500/20 scale-110 shadow-lg shadow-blue-500/10" : "hover:bg-white/5"
                            )}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                            {isActive && <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full shadow-lg shadow-blue-400"></div>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
