import { Asset, AssetType } from '../types';

export interface Insight {
    id: string;
    title: string;
    description: string;
    severity: 'INFO' | 'WARN' | 'ALERT';
    icon: string;
    category: 'ALLOCATION' | 'PERFORMANCE' | 'RISK' | 'DIVERSIFICATION';
}

export const generateInsights = (assets: Asset[], snapshots: any[] = []): Insight[] => {
    const insights: Insight[] = [];
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);

    if (totalValue === 0) return [];

    // 1. Allocation Deviations (Example: Target vs Actual)
    // Note: In a real app, we'd fetch actual targets. For now, we use a 5% rule.
    const assetTypes = ['CRYPTO', 'STOCK', 'MUTUAL_FUND', 'GOLD', 'CASH'] as AssetType[];
    assetTypes.forEach(type => {
        const typeValue = assets.filter(a => a.type === type).reduce((sum, a) => sum + (a.currentValue || 0), 0);
        const typePercent = (typeValue / totalValue) * 100;

        // Simple heuristic: If any type > 50% excluding CASH, warn about concentration
        if (type !== 'CASH' && typePercent > 50) {
            insights.push({
                id: `high-concentration-${type}`,
                title: `High ${type} Concentration`,
                description: `Your portfolio is heavily weighted in ${type} (${typePercent.toFixed(1)}%). Consider diversifying into other asset classes.`,
                severity: 'WARN',
                icon: 'PieChart',
                category: 'DIVERSIFICATION'
            });
        }
    });

    // 2. Concentration Risk (Single Asset)
    assets.forEach(asset => {
        const assetPercent = ((asset.currentValue || 0) / totalValue) * 100;
        if (assetPercent > 30) {
            insights.push({
                id: `single-asset-risk-${asset.id}`,
                title: `Single Asset Risk: ${asset.name}`,
                description: `${asset.name} makes up ${assetPercent.toFixed(1)}% of your portfolio. This high concentration increases volatility risk.`,
                severity: 'WARN',
                icon: 'AlertTriangle',
                category: 'RISK'
            });
        }
    });

    // 3. Low Cash Buffer
    const cashValue = assets.filter(a => a.type === 'CASH').reduce((sum, a) => sum + (a.currentValue || 0), 0);
    const cashPercent = (cashValue / totalValue) * 100;
    if (cashPercent < 5) {
        insights.push({
            id: 'low-cash-buffer',
            title: 'Low Cash Buffer',
            description: `Your cash holdings are only ${cashPercent.toFixed(1)}%. Keeping a 5-10% buffer is recommended for market opportunities.`,
            severity: 'WARN',
            icon: 'Banknote',
            category: 'RISK'
        });
    }

    // 4. Performance Insights (Daily Loss)
    const totalDailyChange = assets.reduce((sum, a) => sum + (a.dailyChangeInr || 0), 0);
    const dailyPercent = (totalDailyChange / totalValue) * 100;
    if (dailyPercent < -2) {
        insights.push({
            id: 'high-daily-loss',
            title: 'Significant Daily Decline',
            description: `Your portfolio dropped ${Math.abs(dailyPercent).toFixed(1)}% today. Market volatility is currently high.`,
            severity: 'ALERT',
            icon: 'TrendingDown',
            category: 'PERFORMANCE'
        });
    } else if (dailyPercent > 3) {
        insights.push({
            id: 'high-daily-gain',
            title: 'Strong Market Rally',
            description: `Excellent! Your portfolio is up ${dailyPercent.toFixed(1)}% today. Consider if any rebalancing is needed.`,
            severity: 'INFO',
            icon: 'TrendingUp',
            category: 'PERFORMANCE'
        });
    }

    // 5. Streaks (Last 3 days snapshots)
    if (snapshots.length >= 3) {
        const last3 = snapshots.slice(-3);
        const isDownStreak = last3[2].totalNetWorthInr < last3[1].totalNetWorthInr && last3[1].totalNetWorthInr < last3[0].totalNetWorthInr;
        if (isDownStreak) {
            insights.push({
                id: 'down-streak',
                title: '3-Day Downward Trend',
                description: 'Your net worth has decreased for 3 consecutive days. This is often a good time to review your long-term strategy.',
                severity: 'INFO',
                icon: 'Calendar',
                category: 'PERFORMANCE'
            });
        }
    }

    return insights;
};
