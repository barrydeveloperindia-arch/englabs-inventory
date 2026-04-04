
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventBus, AgentEvent } from '../../lib/eventBus';
import '../../lib/taskDispatcher'; // Ensure listener is attached
import { taskDispatcher } from '../../lib/taskDispatcher'; // Just to ensure import side-effect

/**
 * @module AgenticEcosystemSmokeTest
 * @description High-level integrity test for the Agentic OS.
 * Verifies that a chain reaction of events (Vision -> Strategy -> Task) occurs correctly.
 * 
 * Scenario:
 * 1. Visual Cortex detects a long queue (Simulated).
 * 2. Event Bus propagates 'VISION_QUEUE_ALERT'.
 * 3. Task Dispatcher intercepts the alert.
 * 4. Task Dispatcher creates a high-priority task.
 */
describe('Smoke Test: Agentic Ecosystem Integration', () => {

    it('should complete a full event-to-task lifecycle', async () => {

        let taskCreated = false;
        let taskPayload: any = null;

        // 1. Subscribe to the Final Outcome (Task Creation)
        const subscription = eventBus.on('TASK_CREATED', (payload: any) => {
            taskCreated = true;
            taskPayload = payload;
        });

        console.log("🔥 Smoke Test: Simulating Critical Queue Event...");

        // 2. Simulate the Trigger (Visual Cortex detecting 10 people)
        eventBus.emit({
            type: 'VISION_QUEUE_ALERT',
            payload: { length: 10, status: 'CRITICAL' }
        });

        // 3. Wait for Async Processing (if any, here it's synchronous RxJS but good to be robust)
        await new Promise(resolve => setTimeout(resolve, 100));

        // 4. Verify the Chain Reaction
        expect(taskCreated).toBe(true);
        expect(taskPayload).toBeDefined();

        // 5. Verify Logic Accuracy
        expect(taskPayload.priority).toBe('HIGH');
        expect(taskPayload.title).toContain('Open Register 2');

        console.log("✅ Smoke Test Passed: Vision Alert successfully triggered Staff Task.");

        subscription.unsubscribe();
    });
});
