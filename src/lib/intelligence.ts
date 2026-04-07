import { InventoryItem, Transaction } from '../types';

export interface MarketInsight {
    sku: string;
    name: string;
    currentStock: number;
    velocity: number; // units per day
    daysOfStockLeft: number;
    recommendation: 'REORDER' | 'DISCOUNT' | 'HOLD';
    confidence: number;
}

/**
 * Calculates the sales velocity for a specific item over a given period.
 */
export const calculateSalesVelocity = (transactions: Transaction[], itemId: string, days: number): number => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const relevantTx = transactions.filter(t =>
        new Date(t.timestamp).getTime() >= cutoff.getTime() &&
        t.items.some(ti => ti.id === itemId)
    );

    const totalQty = relevantTx.reduce((acc, t) => {
        const item = t.items.find(ti => ti.id === itemId);
        return acc + (item?.qty || 0);
    }, 0);

    return totalQty / days;
};

/**
 * Audits the accuracy of intelligence predictions against actual transaction outcomes.
 */
export const auditIntelligenceAccuracy = (predictions: any[], transactions: Transaction[]): number => {
    if (predictions.length === 0) return 100;

    let correct = 0;
    predictions.forEach(p => {
        const salesAfter = transactions.filter(t =>
            new Date(t.timestamp) > new Date(p.timestamp) &&
            t.items.some(ti => ti.name === p.item)
        ).length;

        if (p.action === 'REORDER' && salesAfter > 0) correct++;
        else if (p.action === 'HOLD' && salesAfter === 0) correct++;
    });

    return Math.round((correct / predictions.length) * 100);
};

/**
 * Generates a revenue forecast based on historical transaction data.
 */
export const calculateRevenueForecast = (transactions: Transaction[]) => {
    // Simplified: Project last 7 days revenue to current month
    const last7Days = transactions.filter(t => {
        const diff = new Date().getTime() - new Date(t.timestamp).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
    });

    const weeklyTotal = last7Days.reduce((acc, t) => acc + t.total, 0);
    const dailyAverage = weeklyTotal / 7;

    return {
        predictedRevenue: dailyAverage * 30, // 30-day projection
        confidence: 0.88,
        trend: dailyAverage > 500 ? 'UP' : 'STABLE'
    };
};

/**
 * Generates a prioritized replenishment plan based on inventory levels and sales velocity.
 */
export const generateReplenishmentPlan = (inventory: InventoryItem[], transactions: Transaction[]) => {
    return inventory
        .filter(item => item.stock <= item.minStock)
        .map(item => {
            const velocity = calculateSalesVelocity(transactions, item.id, 7);
            const suggestedOrder = Math.max(item.minStock * 2, Math.ceil(velocity * 14)); // 14-day buffer
            return {
                sku: item.sku,
                name: item.name,
                currentStock: item.stock,
                suggestedOrder,
                estimatedCost: suggestedOrder * (item.costPrice || 0)
            };
        })
        .sort((a, b) => (a.currentStock / (a.suggestedOrder || 1)) - (b.currentStock / (b.suggestedOrder || 1)));
};

/**
 * Intelligent Analysis: Market Performance Engine
 * Integrates sales data with inventory states to predict needs.
 */
export class MarketIntelligence {

    /**
     * Analyzes inventory parity against recent transactions.
     */
    static analyzeInventory(inventory: InventoryItem[], transactions: Transaction[]) {
        console.log(`📊 [Intelligent Analysis] Starting operational performance audit...`);

        const insights: MarketInsight[] = [];

        inventory.forEach(item => {
            const velocity = calculateSalesVelocity(transactions, item.id, 7);
            const daysLeft = velocity > 0 ? item.stock / velocity : Infinity;

            let recommendation: 'REORDER' | 'DISCOUNT' | 'HOLD' = 'HOLD';
            let confidence = 0.85;

            if (daysLeft < 3 && item.stock < item.minStock) {
                recommendation = 'REORDER';
                confidence = 0.95;
            } else if (daysLeft > 60 && item.stock > item.minStock * 5) {
                recommendation = 'DISCOUNT';
                confidence = 0.75;
            }

            if (recommendation !== 'HOLD') {
                insights.push({
                    sku: item.sku,
                    name: item.name,
                    currentStock: item.stock,
                    velocity,
                    daysOfStockLeft: daysLeft,
                    recommendation,
                    confidence
                });
            }
        });

        return insights;
    }
}

/**
 * Helper to identify items with 'REORDER' recommendation.
 */
export const identifyStockRisks = (inventory: InventoryItem[], transactions: Transaction[]) => {
    const insights = MarketIntelligence.analyzeInventory(inventory, transactions);
    return inventory.filter(item =>
        insights.some(i => i.sku === item.sku && i.recommendation === 'REORDER')
    );
};
