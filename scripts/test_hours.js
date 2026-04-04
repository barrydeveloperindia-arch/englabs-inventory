
const SHOP_OPERATING_HOURS = {
    Monday: { start: '08:00', end: '21:00' },
    Tuesday: { start: '08:00', end: '21:00' },
    Wednesday: { start: '08:00', end: '21:00' },
    Thursday: { start: '08:00', end: '21:00' },
    Friday: { start: '08:00', end: '23:00' },
    Saturday: { start: '08:00', end: '23:00' },
    Sunday: { start: '08:00', end: '20:00' }
};

const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

function checkHours(dayName, start, end) {
    const hours = SHOP_OPERATING_HOURS[dayName];
    if (!hours) return { valid: false, reason: 'Invalid Day' };

    const shopOpen = toMinutes(hours.start);
    const shopClose = toMinutes(hours.end);
    const shiftStart = toMinutes(start);
    const shiftEnd = toMinutes(end);

    if (shiftStart < shopOpen || shiftEnd > shopClose) {
        return { valid: false, reason: `Outside shop hours (${hours.start}-${hours.end})` };
    }
    return { valid: true };
}

console.log("--- TESTING OPERATING HOURS ---");

// Test Cases
const tests = [
    { day: 'Monday', start: '08:00', end: '21:00', expect: true },
    { day: 'Monday', start: '07:00', end: '15:00', expect: false }, // Early
    { day: 'Monday', start: '13:00', end: '22:00', expect: false }, // Late
    { day: 'Friday', start: '15:00', end: '23:00', expect: true },  // Late OK
    { day: 'Friday', start: '23:00', end: '23:30', expect: false }, // Too Late
    { day: 'Sunday', start: '08:00', end: '20:00', expect: true },
    { day: 'Sunday', start: '19:00', end: '21:00', expect: false }  // Late for Sunday
];

let passed = 0;
tests.forEach((t, i) => {
    const res = checkHours(t.day, t.start, t.end);
    const ok = res.valid === t.expect;
    if (ok) passed++;
    console.log(`Test ${i + 1} [${t.day} ${t.start}-${t.end}] -> Expected: ${t.expect}, Got: ${res.valid} (${res.reason || 'OK'}) - ${ok ? 'PASSED' : 'FAILED'}`);
});

console.log(`\nPassed ${passed}/${tests.length}`);
