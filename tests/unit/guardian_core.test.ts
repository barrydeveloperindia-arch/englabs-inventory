
import { describe, it, expect, vi } from 'vitest';
import { guardianAgent } from '../../lib/agents/guardian/GuardianCore';
import { stabilityShield } from '../../lib/agents/guardian/StabilityShield';
import { workflowMonitor } from '../../lib/agents/guardian/WorkflowMonitor';

vi.mock('../../lib/agents/guardian/StabilityShield', () => ({
    stabilityShield: {
        verifyIntegrity: vi.fn().mockResolvedValue(true),
        generateDynamicTest: vi.fn()
    }
}));

vi.mock('../../lib/agents/guardian/WorkflowMonitor', () => ({
    workflowMonitor: {
        start: vi.fn(),
        setShopId: vi.fn(),
        runFullAudit: vi.fn()
    }
}));

vi.mock('../../lib/agents/guardian/GitSync', () => ({
    gitSync: {
        pushUpdate: vi.fn().mockResolvedValue(true)
    }
}));

describe('🛡️ Guardian Agent: Core Logic Smoke Test', () => {

    it('should initialize and deploy correctly', async () => {
        await guardianAgent.deploy();

        expect(stabilityShield.verifyIntegrity).toHaveBeenCalled();
        expect(workflowMonitor.start).toHaveBeenCalled();
        expect(stabilityShield.generateDynamicTest).toHaveBeenCalled();
    });

    it('should update shopId correctly', () => {
        const testId = 'test-shop-123';
        guardianAgent.setShopId(testId);
        expect(workflowMonitor.setShopId).toHaveBeenCalledWith(testId);
    });

    it('should trigger force sync manually', async () => {
        await guardianAgent.forceSync();
        expect(stabilityShield.verifyIntegrity).toHaveBeenCalled();
        expect(workflowMonitor.runFullAudit).toHaveBeenCalled();
    });
});
