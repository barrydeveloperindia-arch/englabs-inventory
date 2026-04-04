
import { describe, it, expect } from 'vitest';
import { DailyCheck } from '../../types';

describe('DailyCheck Data Structure & Photo Support', () => {

    it('should support photos for individual tasks', () => {
        const check: DailyCheck = {
            id: '123',
            date: '2026-02-12',
            type: 'Opening',
            checkedBy: 'Gaurav',
            time: '08:00',
            tasks: [
                { description: 'Shutters', completed: true, photo: 'data:image/png;base64,123' },
                { description: 'Lights', completed: true, photo: 'data:image/png;base64,456' },
                { description: 'Floor', completed: false } // No photo
            ],
            remarks: 'All good',
            timestamp: new Date().toISOString()
        };

        expect(check.tasks[0].photo).toBeDefined();
        expect(check.tasks[1].photo).toBeDefined();
        expect(check.tasks[2].photo).toBeUndefined();
    });

    it('should correctly map legacy proofPhoto data', () => {
        // Simulating the Table View Logic
        const check: DailyCheck = {
            id: 'legacy',
            date: '2026-02-11',
            type: 'Opening',
            checkedBy: 'Old System',
            time: '08:00',
            tasks: [
                { description: 'Shutters', completed: true }, // No photo on task
                { description: 'Lights', completed: true }
            ],
            proofPhoto: 'legacy_photo_url',
            timestamp: new Date().toISOString()
        };

        const rows: any[] = [];
        check.tasks.forEach((task, index) => {
            rows.push({
                task: task.description,
                proof: task.photo || (index === 0 ? check.proofPhoto : undefined)
            });
        });

        // First item should inherit legacy photo
        expect(rows[0].proof).toBe('legacy_photo_url');
        // Second item should have no photo
        expect(rows[1].proof).toBeUndefined();
    });

    it('should prioritize task photo over legacy photo', () => {
        const check: DailyCheck = {
            id: 'hybrid',
            date: '2026-02-12',
            type: 'Opening',
            checkedBy: 'New System',
            time: '08:00',
            tasks: [
                { description: 'Shutters', completed: true, photo: 'new_photo_url' }
            ],
            proofPhoto: 'old_legacy_url', // Should be ignored if task has photo? 
            // Current logic: task.photo || (index===0 ? proofPhoto : undefined)
            timestamp: new Date().toISOString()
        };

        const rows: any[] = [];
        check.tasks.forEach((task, index) => {
            rows.push({
                task: task.description,
                proof: task.photo || (index === 0 ? check.proofPhoto : undefined)
            });
        });

        expect(rows[0].proof).toBe('new_photo_url');
    });
});
