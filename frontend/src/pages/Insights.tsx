import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

import { generateInsights } from '../services/insightsService';
import { Lightbulb, Info, AlertTriangle, TrendingUp, TrendingDown, Calendar, Banknote, PieChart, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const IconMap: Record<string, any> = {
    Lightbulb, AlertTriangle, Info, PieChart, TrendingUp, TrendingDown, Calendar, Banknote
};

const Insights = () => {
    const navigate = useNavigate();

    const { data: assetsData } = useQuery({
        queryKey: ['assets'],
        queryFn: async () => (await api.get('/assets')).data
    });

    const { data: historyData } = useQuery({
        queryKey: ['portfolio-history'],
        queryFn: async () => (await api.get('/portfolio/history')).data
    });

    const assets = assetsData?.assets || [];
    const history = historyData?.points || [];

    const insights = generateInsights(assets, history);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
                >
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold dark:text-white">Portfolio Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map(insight => {
                    const Icon = IconMap[insight.icon] || Info;
                    return (
                        <div key={insight.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 transition-colors">
                            <div className={clsx(
                                "p-3 rounded-xl shrink-0 h-fit",
                                insight.severity === 'ALERT' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                    insight.severity === 'WARN' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                                <Icon size={24} />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className={clsx(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                        insight.severity === 'ALERT' ? "bg-red-100 text-red-600 dark:bg-red-900/40" :
                                            insight.severity === 'WARN' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40" :
                                                "bg-blue-100 text-blue-600 dark:bg-blue-900/40"
                                    )}>
                                        {insight.severity}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{insight.category}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{insight.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{insight.description}</p>
                            </div>
                        </div>
                    );
                })}
                {insights.length === 0 && (
                    <div className="md:col-span-2 py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-700 text-center text-gray-500">
                        <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">No new insights at the moment.</p>
                        <p className="text-sm">Keep tracking your portfolio for personalized suggestions.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
