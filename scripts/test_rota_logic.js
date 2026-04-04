
const crypto = { randomUUID: () => Math.random().toString(36).substring(7) };

// --- MOCK DATA ---
const staff = [
    { id: '1', name: 'Bharat' },
    { id: '2', name: 'Salil' }
];

// --- LOGIC FROM StaffView.tsx (Replicated) ---
const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

// State Mocks
let shifts = [];
let rotaPreferences = [];

// Helper to Add Shift (The handleDrop logic)
function addShift(staffId, dateStr, start, end, status = 'pending') {
    const staffMember = staff.find(s => s.id === staffId);
    const newShift = {
        id: crypto.randomUUID(),
        staff_id: staffId,
        staff_name: staffMember.name,
        week_start: '2026-02-02',
        day: 'Monday', // Simplified
        start_time: start,
        end_time: end,
        total_hours: (toMinutes(end) - toMinutes(start)) / 60,
        status: status,
        date: dateStr,
        conflict: false,
        conflict_reason: ''
    };

    // 1. Conflict Check: Overlap
    const existingShifts = shifts.filter(s => s.staff_id === staffId && s.date === dateStr && s.status !== 'rejected');
    const newStart = toMinutes(newShift.start_time);
    const newEnd = toMinutes(newShift.end_time);

    for (const existing of existingShifts) {
        const existingStart = toMinutes(existing.start_time);
        const existingEnd = toMinutes(existing.end_time);

        if (existingStart < newEnd && newStart < existingEnd) {
            newShift.conflict = true;
            newShift.conflict_reason = 'Overlapping shift';
            break;
        }
    }

    // 2. Conflict Check: Weekly Limit
    const weeklyHours = shifts
        .filter(s => s.staff_id === staffId && s.week_start === newShift.week_start && s.status !== 'rejected')
        .reduce((sum, s) => sum + s.total_hours, 0);

    const pref = rotaPreferences.find(p => p.staffId === staffId && p.weekStart === newShift.week_start);
    const maxHours = pref ? pref.targetBoardHours : 40;

    if (weeklyHours + newShift.total_hours > maxHours) {
        // Only overwrite if not already overlapped (priority)
        if (!newShift.conflict) {
            newShift.conflict = true;
            newShift.conflict_reason = `Weekly limit exceeded (> ${maxHours}h)`;
        }
    }

    shifts.push(newShift);
    return newShift;
}

// --- TEST SUITE ---
console.log("--- STARTING ROTA LOGIC TESTS ---\n");

// TEST 1: Weekly Limit with Multiple Staff Preferences
console.log("Test 1: Availability Preferences");
rotaPreferences = [
    { id: 'p1', staffId: '1', weekStart: '2026-02-02', targetBoardHours: 10 }, // Bharat wants 10h
    { id: 'p2', staffId: '2', weekStart: '2026-02-02', targetBoardHours: 40 }  // Salil wants 40h
];

// Bharat: Add 8h (OK)
const s1 = addShift('1', '2026-02-02', '09:00', '17:00');
console.log(`Bharat Shift 1 (8h / Limit 10h): Conflict = ${s1.conflict}`);

// Bharat: Add 4h (Total 12h -> Exceeds 10h)
const s2 = addShift('1', '2026-02-03', '09:00', '13:00');
console.log(`Bharat Shift 2 (+4h = 12h / Limit 10h): Conflict = ${s2.conflict}, Reason = ${s2.conflict_reason}`);

// Salil: Add 8h (OK) - Ensure Bharat's limit doesn't affect Salil
const s3 = addShift('2', '2026-02-02', '09:00', '17:00');
console.log(`Salil Shift 1 (8h / Limit 40h): Conflict = ${s3.conflict}`);


// TEST 2: Overlapping Shifts
console.log("\nTest 2: Overlap Detection");
shifts = []; // Reset shifts, keep prefs
// Add Base Shift: 09:00 - 17:00
addShift('1', '2026-02-02', '09:00', '17:00');

// Overlap Case: 12:00 - 15:00
const sOverlap = addShift('1', '2026-02-02', '12:00', '15:00');
console.log(`Overlap Case (12-15 vs 09-17): Conflict = ${sOverlap.conflict}, Reason = ${sOverlap.conflict_reason}`);

// Touch Case: 17:00 - 20:00 (Should NOT overlap)
const sTouch = addShift('1', '2026-02-02', '17:00', '20:00');
console.log(`Touch Case (17-20 vs 09-17): Conflict = ${sTouch.conflict}`);


// TEST 3: Admin Rejection Logic
console.log("\nTest 3: Rejected Shift Handling");
shifts = [];
// Scenario: Staff has a shift that was REJECTED by admin.
// Does it still block the slot?
const rejectedShift = addShift('1', '2026-02-02', '09:00', '17:00', 'rejected');
console.log("Added REJECTED shift 09:00-17:00");

// Now try to add a valid shift in same slot
const newValidShift = addShift('1', '2026-02-02', '09:00', '17:00', 'pending');
console.log(`Adding new shift over REJECTED shift: Conflict = ${newValidShift.conflict}`);

if (newValidShift.conflict) {
    console.log("❌ FAILED: Logic counts REJECTED shifts as conflicts.");
} else {
    console.log("✅ PASSED: Logic ignores REJECTED shifts.");
}

console.log("\n--- TESTS COMPLETE ---");
