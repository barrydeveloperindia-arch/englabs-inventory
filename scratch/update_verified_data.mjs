import fs from 'fs';

// 🕒 VERIFIED APRIL 2026 TIMESHEET DATA (AUDITED BY SUBAGENT)
const verifiedData = [
  {
    "name": "Thakur",
    "totalRegular": "224.25",
    "totalOT": "28.18",
    "grandTotal": "252.43",
    "records": [
       { "date": "2026-04-05", "in": "09:30 AM", "out": "06:30 PM", "ot": "9.00", "note": "Sunday Worked" },
       { "date": "2026-04-19", "in": "09:00 AM", "out": "06:00 PM", "ot": "9.00", "note": "Sunday Worked" }
    ]
  },
  {
    "name": "Rajinder",
    "totalRegular": "234.00",
    "totalOT": "36.33",
    "grandTotal": "270.33",
    "records": [
       { "date": "2026-04-05", "in": "09:10 AM", "out": "06:50 PM", "ot": "9.67", "note": "Sunday Worked" },
       { "date": "2026-04-19", "in": "09:00 AM", "out": "06:30 PM", "ot": "9.50", "note": "Sunday Worked" },
       { "date": "2026-04-26", "in": "09:00 AM", "out": "06:00 PM", "ot": "9.00", "note": "Sunday Worked" }
    ]
  },
  {
    "name": "Poonam",
    "totalRegular": "225.00",
    "totalOT": "12.43",
    "grandTotal": "237.43",
    "records": [
       { "date": "2026-04-26", "in": "08:30 AM", "out": "05:00 PM", "ot": "8.50", "note": "Sunday Worked" }
    ]
  },
  {
    "name": "Arjun",
    "totalRegular": "243.00",
    "totalOT": "26.50",
    "grandTotal": "269.50",
    "records": [
       { "date": "2026-04-05", "in": "09:30 AM", "out": "06:10 PM", "ot": "8.67", "note": "Sunday Worked" },
       { "date": "2026-04-19", "in": "09:00 AM", "out": "06:00 PM", "ot": "9.00", "note": "Sunday Worked" },
       { "date": "2026-04-26", "in": "09:00 AM", "out": "06:00 PM", "ot": "9.00", "note": "Sunday Worked" }
    ]
  },
  {
    "name": "Kunwarlal",
    "totalRegular": "252.00",
    "totalOT": "31.50",
    "grandTotal": "283.50",
    "records": [
       { "date": "2026-04-05", "in": "09:10 AM", "out": "06:00 PM", "ot": "8.83", "note": "Sunday Worked" },
       { "date": "2026-04-19", "in": "09:00 AM", "out": "06:30 PM", "ot": "9.50", "note": "Sunday Worked" },
       { "date": "2026-04-26", "in": "09:00 AM", "out": "06:02 PM", "ot": "9.03", "note": "Sunday Worked" }
    ]
  },
  {
    "name": "Anurag",
    "totalRegular": "213.75",
    "totalOT": "18.00",
    "grandTotal": "231.75",
    "records": []
  },
  {
    "name": "Shubham",
    "totalRegular": "225.00",
    "totalOT": "30.58",
    "grandTotal": "255.58",
    "records": [
       { "date": "2026-04-10", "in": "09:00 AM", "out": "01:00 AM", "ot": "7.00", "note": "Late Night Shift" }
    ]
  },
  {
    "name": "Ratnesh",
    "totalRegular": "163.50",
    "totalOT": "126.37",
    "grandTotal": "289.87",
    "records": [
       { "date": "2026-04-02", "in": "09:25 AM", "out": "08:30 AM", "ot": "14.00", "note": "Overnight Shift" }
    ]
  },
  {
    "name": "Devarshu",
    "totalRegular": "198.50",
    "totalOT": "15.35",
    "grandTotal": "213.85",
    "records": []
  },
  {
    "name": "Shiv Kumar",
    "totalRegular": "153.00",
    "totalOT": "11.25",
    "grandTotal": "164.25",
    "records": []
  },
  {
    "name": "Uditanshu",
    "totalRegular": "243.00",
    "totalOT": "18.42",
    "grandTotal": "261.42",
    "records": []
  },
  {
    "name": "RAM",
    "totalRegular": "198.00",
    "totalOT": "26.87",
    "grandTotal": "224.87",
    "records": [
       { "date": "2026-04-05", "in": "09:00 AM", "out": "06:00 PM", "ot": "9.00", "note": "Sunday Worked" },
       { "date": "2026-04-19", "in": "09:00 AM", "out": "06:30 PM", "ot": "9.50", "note": "Sunday Worked" },
       { "date": "2026-04-26", "in": "09:00 AM", "out": "06:02 PM", "ot": "9.03", "note": "Sunday Worked" }
    ]
  },
  {
    "name": "Roshni",
    "totalRegular": "135.00",
    "totalOT": "5.50",
    "grandTotal": "140.50",
    "records": []
  }
];

fs.writeFileSync('c:\\Users\\SAM\\Documents\\Antigravity\\Englabs Acounts\\11_HR_Management\\Staff_Timesheets\\processed_timesheet.json', JSON.stringify(verifiedData, null, 2));

let csv = "Staff Name,Reg Hours,OT Hours,Grand Total\n";
verifiedData.forEach(s => {
    csv += `${s.name},${s.totalRegular},${s.totalOT},${s.grandTotal}\n`;
});
fs.writeFileSync('c:\\Users\\SAM\\Documents\\Antigravity\\Englabs Acounts\\11_HR_Management\\Staff_Timesheets\\April_2026_Timesheet_Report.csv', csv);

console.log('✅ Audit data updated with Sunday shifts and overnight corrections.');
