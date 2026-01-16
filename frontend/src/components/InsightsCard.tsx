import React from 'react';
import { Insight } from '../services/insightsService';
import { Lightbulb, ChevronRight, AlertTriangle, Info, Bell, PieChart, TrendingUp, TrendingDown, Calendar, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const IconMap: Record<string, any> = {
    Lightbulb, AlertTriangle, Info, Bell, PieChart, TrendingUp, TrendingDown, Calendar, Banknote
};

interface InsightsCardProps {
    insights: Insight[];
}

const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
    const navigate = useNavigate();
    const topInsights = insights.slice(0, 3);

    if (insights.length === 0) return null;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                    <Lightbulb size={20} className="text-amber-500" />
                    Portfolio Insights
                </h3>
                <button
                    onClick={() => navigate('/insights')}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                    View All <ChevronRight size={14} />
                </button>
            </div>

            <div className="space-y-3">
                {topInsights.map(insight => {
                    const Icon = IconMap[insight.icon] || Info;
                    return (
                        <div key={insight.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 transition-colors">
                            <div className={clsx(
                                "p-2 rounded-lg shrink-0",
                                insight.severity === 'ALERT' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                                    insight.severity === 'WARN' ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                        "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            )}>
                                <Icon size={18} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{insight.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{insight.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InsightsCard;
