/**
 * Agentic OS - Background Agent Orchestrator
 * 
 * Manages periodic autonomous audits and strategic routines.
 */

import { MarketIntelligence } from './intelligence';
import { InventoryItem, Transaction } from '../types';

export class BackgroundAgents {
    private static auditInterval: any = null;
    private static currentInventory: InventoryItem[] = [];
    private static currentTransactions: Transaction[] = [];

    static start(shopId: string = 'englabs-enterprise') {
        if (this.auditInterval) return;

        console.log("🛰️ [BackgroundAgents] Initializing Operational Intelligence...");

        // Run Every 15 Minutes for Enterprise Performance Monitoring
        this.auditInterval = setInterval(() => {
            this.runCycle();
        }, 15 * 60 * 1000);
    }

    static updateState(inventory: InventoryItem[], transactions: Transaction[]) {
        this.currentInventory = inventory;
        this.currentTransactions = transactions;
    }

    private static async runCycle() {
        try {
            // 1. Strategic Inventory Audit (Intelligent Analysis)
            if (this.currentInventory.length > 0) {
                MarketIntelligence.analyzeInventory(this.currentInventory, this.currentTransactions);
            }

            console.log("🛰️ [BackgroundAgents] Performance audit cycle complete.");
        } catch (error) {
            console.error("🛰️ [BackgroundAgents] Audit failure:", error);
        }
    }

    static stop() {
        if (this.auditInterval) {
            clearInterval(this.auditInterval);
            this.auditInterval = null;
        }
    }
}
