
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { eventBus, AgentEvent } from '../../lib/eventBus';
import { taskDispatcher } from '../../lib/taskDispatcher';

/**
 * @module AgenticCoreUnitTests
 * @description Unit tests for the "Nervous System" (EventBus) and "Reflexes" (TaskDispatcher).
 * Verifies that events propagate correctly and that the rule engine generates tasks as expected.
 */

describe('Agentic Core System', () => {

    // Reset EventBus subscribers between tests
    beforeEach(() => {
        // Spy on emit but Call Through to allow subscribers to react!
        vi.spyOn(eventBus, 'emit').mockImplementation(function (this: any, event) {
            // We must call the original method logic manually or use a specific vitest feature
            // But simpler: we know implementation.
            this.subject.next(event);
            return;
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Event Bus (CNS)', () => {
        it('should propagate events to subscribers', () => {
            const callback = vi.fn();
            const subscription = eventBus.subscribe(callback);

            const testEvent: AgentEvent = {
                type: 'VISION_PERSON_DETECTED',
                payload: { count: 5, confidence: 0.99, timestamp: Date.now() }
            };

            eventBus.emit(testEvent);

            expect(callback).toHaveBeenCalledWith(testEvent);
            subscription.unsubscribe();
        });

        it('should filter events using .on() helper', () => {
            const callback = vi.fn();
            const subscription = eventBus.on('VISION_QUEUE_ALERT', callback);

            // Should trigger
            const correctEvent: AgentEvent = {
                type: 'VISION_QUEUE_ALERT',
                payload: { length: 10, status: 'CRITICAL' }
            };
            eventBus.emit(correctEvent);
            expect(callback).toHaveBeenCalledWith(correctEvent.payload);

            // Should NOT trigger
            eventBus.emit({
                type: 'VISION_PERSON_DETECTED',
                payload: { count: 5, confidence: 0.99, timestamp: Date.now() }
            });
            expect(callback).toHaveBeenCalledTimes(1);

            subscription.unsubscribe();
        });
    });

    describe('Task Dispatcher (Rule Engine)', () => {
        // We rely on the side-effect of importing taskDispatcher which sets up listeners.

        it('should generate a HIGH Priority task for CRITICAL Queue Alerts', () => {
            expect(taskDispatcher).toBeDefined(); // Ensure functionality matches
            // Simulate Input: Vision Alert
            eventBus.emit({
                type: 'VISION_QUEUE_ALERT',
                payload: { length: 8, status: 'CRITICAL' }
            });

            // Verify Output: Task Creation
            expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
                type: 'TASK_CREATED',
                payload: expect.objectContaining({
                    priority: 'HIGH',
                    title: 'Open Register 2 immediately'
                })
            }));
        });

        it('should generate a MEDIUM Priority task for Stock Reorders', () => {
            // Simulate Input: Strategist Prediction
            eventBus.emit({
                type: 'STRATEGIST_STOCK_PREDICTION',
                payload: { item: 'Milk', currentStock: 2, predictedDemand: 20, action: 'REORDER' }
            });

            // Verify Output: Task Creation
            expect(eventBus.emit).toHaveBeenCalledWith(expect.objectContaining({
                type: 'TASK_CREATED',
                payload: expect.objectContaining({
                    priority: 'MEDIUM',
                    title: expect.stringContaining('Review Order: Milk')
                })
            }));
        });
    });
});
