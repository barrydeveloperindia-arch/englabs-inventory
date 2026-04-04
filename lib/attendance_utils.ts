
interface AutoCheckoutResult {
    shouldCheckOut: boolean;
    reason?: string;
}

export const checkAutoCheckout = (
    shiftDateStr: string,     // 'YYYY-MM-DD'
    shiftClockIn: string,     // 'HH:MM'
    todayStr: string,         // 'YYYY-MM-DD'
    now: Date,                // Current Date object
    closingTime: string       // 'HH:MM' - Shop closing time for the shift's day
): AutoCheckoutResult => {

    // 1. Shift is from a previous day
    if (shiftDateStr < todayStr) {
        return { shouldCheckOut: true, reason: 'Previous Day' };
    }

    // 2. Shift is today, but way past closing time
    if (shiftDateStr === todayStr) {
        const [shutH, shutM] = closingTime.split(':').map(Number);

        // Create a Date object for the closing time
        const shiftCloseDate = new Date(now);
        shiftCloseDate.setHours(shutH, shutM, 0, 0);

        // 4 Hours Buffer
        const bufferMs = 4 * 60 * 60 * 1000;

        if (now.getTime() > shiftCloseDate.getTime() + bufferMs) {
            return { shouldCheckOut: true, reason: 'Past Closing Limit' };
        }
    }

    return { shouldCheckOut: false };
};

export const calculateWorkedHours = (clockIn: string, clockOut: string): number => {
    const [sH, sM] = clockIn.split(':').map(Number);
    const [eH, eM] = clockOut.split(':').map(Number);
    let hours = (eH + eM / 60) - (sH + sM / 60);
    return hours < 0 ? 0 : hours;
};
