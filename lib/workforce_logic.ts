
/**
 * WORKFORCE MANAGEMENT LOGIC
 * Core business logic for time calculation, shifts, and lateness.
 * Decoupled from React components for testing.
 */

// ------------------------------------------------------------------
// 1. HOUR CALCULATION
// ------------------------------------------------------------------

/**
 * Calculates hours between start and end time.
 * Logic: (End - Start).
 * @param start HH:MM string
 * @param end HH:MM string
 * @returns Number of hours (decimal)
 */
export const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, parseFloat((diff / 60).toFixed(2)));
};

/**
 * Calculates Unpaid Break Deduction.
 * If break is UNPAID, we subtract it from total hours.
 */
export const calculateHoursWithBreak = (
    start: string,
    end: string,
    breakDurationMinutes: number = 0,
    isPaidBreak: boolean = true
): number => {
    const totalHours = calculateHours(start, end);
    if (isPaidBreak) return totalHours;

    // Convert total hours to minutes
    const totalMinutes = totalHours * 60;
    const netMinutes = totalMinutes - breakDurationMinutes;

    return Math.max(0, parseFloat((netMinutes / 60).toFixed(2)));
};

// ------------------------------------------------------------------
// 2. LATENESS LOGIC
// ------------------------------------------------------------------

/**
 * Checks if a staff member is late.
 * Logic: First Shift Start + Grace Period (5 mins).
 * @param clockInTime HH:MM
 * @param scheduledStartTime HH:MM (Default 09:00 as per spec)
 * @param gracePeriodMinutes Default 5
 */
export const checkLateness = (
    clockInTime: string,
    scheduledStartTime: string = '09:00',
    gracePeriodMinutes: number = 5
): { isLate: boolean, minutesLate: number } => {
    if (!clockInTime) return { isLate: false, minutesLate: 0 };

    const [inH, inM] = clockInTime.split(':').map(Number);
    const [scH, scM] = scheduledStartTime.split(':').map(Number);

    const inTotal = inH * 60 + inM;
    const scTotal = scH * 60 + scM;
    const threshold = scTotal + gracePeriodMinutes;

    if (inTotal > threshold) {
        return { isLate: true, minutesLate: inTotal - scTotal };
    }

    return { isLate: false, minutesLate: 0 };
};
