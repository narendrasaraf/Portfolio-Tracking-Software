import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, PieChart, PlusCircle, LogOut, Moon, Sun, History as HistoryIcon, Bell, BarChart2, Lightbulb } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import clsx from 'clsx';

const Layout = () => {
    const { logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { currency, toggleCurrency } = useCurrency();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/assets', label: 'Assets', icon: PieChart },
        { path: '/analytics', label: 'Analytics', icon: BarChart2 },
        { path: '/insights', label: 'Insights', icon: Lightbulb },
        { path: '/alerts', label: 'Alerts', icon: Bell },
        { path: '/add', label: 'Add', icon: PlusCircle },
        { path: '/history', label: 'History', icon: HistoryIcon },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Top Bar */}
            <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3 flex justify-between items-center shadow-sm z-10 transition-colors">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Portfolio Tracker
                </h1>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    {/* Currency Toggle */}
                    <button
                        onClick={toggleCurrency}
                        className="px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                        title="Change Currency"
                    >
                        <span className={clsx(currency === 'INR' ? "text-blue-600 dark:text-blue-400" : "opacity-40 text-gray-400")}>₹</span>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <span className={clsx(currency === 'USDT' ? "text-blue-600 dark:text-blue-400" : "opacity-40 text-gray-400")}>₮</span>
                    </button>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 md:px-8 max-w-6xl mx-auto w-full">
                <Outlet />
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex justify-around py-2 safe-area-bottom z-10 shadow-lg transition-colors">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={clsx(
                                "flex flex-col items-center p-2 rounded-lg transition-colors min-w-[70px]",
                                isActive
                                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                        >
                            <Icon size={24} />
                            <span className="text-xs mt-1 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
