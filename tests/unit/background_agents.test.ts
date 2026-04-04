
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackgroundAgents } from '../../lib/backgroundAgents';
import { MarketIntelligence } from '../../lib/intelligence';
import { runFullDiagnostics } from '../../lib/diagnostics';

// Mock dependency modules
vi.mock('../../lib/intelligence', () => ({
    MarketIntelligence: {
        analyzeInventory: vi.fn()
    }
}));

vi.mock('../../lib/diagnostics', () => ({
    runFullDiagnostics: vi.fn().mockResolvedValue({ status: 'OPTIMAL' })
}));

describe('BackgroundAgents Orchestrator', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        BackgroundAgents.stop(); // Ensure clean state
    });

    afterEach(() => {
        BackgroundAgents.stop();
        vi.useRealTimers();
    });

    it('should start the audit interval and run cycle after 5 minutes', async () => {
        const mockInventory = [{ id: '1', name: 'Test', sku: 'T1' }] as any;
        BackgroundAgents.updateState(mockInventory, []);
        BackgroundAgents.start();

        // Fast-forward 5 minutes
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

        expect(MarketIntelligence.analyzeInventory).toHaveBeenCalledWith(mockInventory, []);
        expect(runFullDiagnostics).toHaveBeenCalled();
    });

    it('should NOT run if inventory is empty', async () => {
        BackgroundAgents.updateState([], []);
        BackgroundAgents.start();

        await vi.advanceTimersByTimeAsync(5 * 60 * 1000);

        expect(MarketIntelligence.analyzeInventory).not.toHaveBeenCalled();
        expect(runFullDiagnostics).toHaveBeenCalled(); // Diagnostics still run
    });

    it('should stop the interval when stop() is called', async () => {
        BackgroundAgents.start();
        BackgroundAgents.stop();

        await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

        expect(MarketIntelligence.analyzeInventory).not.toHaveBeenCalled();
    });
});
