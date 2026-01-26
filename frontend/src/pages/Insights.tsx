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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex items-center gap-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-xl"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h2 className="heading-1">Portfolio Strategy</h2>
                    <p className="text-slate-400 font-medium">Algorithmic analysis and AI-driven portfolio optimization insights.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {insights.map(insight => {
                    const Icon = IconMap[insight.icon] || Info;
                    return (
                        <div key={insight.id} className="glass-card glass-card-hover p-8 flex flex-col sm:flex-row gap-6 group relative overflow-hidden">
                            {/* Accent Glow */}
                            <div className={clsx(
                                "absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-10 transition-all duration-500 group-hover:opacity-30",
                                insight.severity === 'ALERT' ? "bg-rose-500" :
                                    insight.severity === 'WARN' ? "bg-amber-500" :
                                        "bg-blue-500"
                            )}></div>

                            <div className={clsx(
                                "p-4 rounded-2xl shrink-0 h-fit border border-white/5 shadow-2xl transition-transform group-hover:scale-110 duration-500",
                                insight.severity === 'ALERT' ? "bg-rose-500/10 text-rose-400" :
                                    insight.severity === 'WARN' ? "bg-amber-500/10 text-amber-400" :
                                        "bg-blue-500/10 text-blue-400"
                            )}>
                                <Icon size={28} />
                            </div>

                            <div className="space-y-4 relative z-10 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={clsx(
                                            "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border",
                                            insight.severity === 'ALERT' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                insight.severity === 'WARN' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                    "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        )}>
                                            {insight.severity}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{insight.category}</span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-white leading-tight mb-2 tracking-tight">{insight.title}</h3>
                                    <p className="text-sm text-slate-400 font-medium leading-relaxed leading-7">{insight.description}</p>
                                </div>

                                <div className="pt-4 flex items-center gap-2 group-hover:gap-3 transition-all">
                                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Execute Strategy</span>
                                    <div className="flex-1 h-[1px] bg-gradient-to-r from-blue-400/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {insights.length === 0 && (
                    <div className="lg:col-span-2 py-32 glass-card border-dashed flex flex-col items-center justify-center">
                        <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/10 animate-float">
                            <Lightbulb size={48} className="text-slate-500 opacity-50" />
                        </div>
                        <p className="text-2xl font-black text-white mb-2 tracking-tight">Strategy Node: Standby</p>
                        <p className="text-slate-400 font-medium text-center max-w-sm">
                            Insufficient market parameters to generate active strategies. Maintain portfolio consistency.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Insights;
