import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const TIMESHEET_PATH = 'Englabs Projects/HR & Payroll/Timesheets (Monthly)/April_2026_Processed.json';
const CONFIG_PATH = 'Englabs Projects/HR & Payroll/salary_config.json';
const LOGO_PATH = 'Logo/englabs_logo.png';
const OUTPUT_DIR = 'Englabs Projects/HR & Payroll';

// 🖼️ Load Logo and convert to Base64
const LOGO_BASE64 = fs.existsSync(LOGO_PATH) 
    ? `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`
    : '';

async function generate() {
    console.log("🚀 Initializing EngLabs Forensic Payroll Engine (Special Policy Edition)...");

    const rawData = fs.readFileSync(TIMESHEET_PATH, 'utf-8');
    const timesheets = JSON.parse(rawData);
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    const payrollSummary = [];

    for (const staff of timesheets) {
        const staffConfig = config.staff.find(s => s.name === staff.name) || { daily_rate: 0, ot_hourly_rate: 0, casual_leaves: 0 };
        
        let basicSalary = 0;
        let otPay = 0;
        let specialDutyPay = 0; // Sundays/Holidays
        let leaveBenefit = 0;

        const processedRecords = staff.records.map(r => {
            const date = new Date(r.date);
            const isSunday = date.getDay() === 0;
            const isHoliday = config.holidays.includes(r.date);
            
            let multiplier = 1.0;
            if (isHoliday) multiplier = config.holiday_multiplier || 2.0;
            else if (isSunday) multiplier = config.sunday_multiplier || 1.5;

            const hours = parseFloat(r.totalHours);
            const regHours = Math.min(hours, config.standard_day_hours);
            const otHours = Math.max(0, hours - config.standard_day_hours);

            let dayPay = 0;
            if (isSunday || isHoliday) {
                // Special Duty: All hours at multiplier
                dayPay = hours * (staffConfig.ot_hourly_rate * multiplier);
                specialDutyPay += dayPay;
            } else {
                // Normal Day
                otPay += otHours * staffConfig.ot_hourly_rate;
                basicSalary += (regHours / config.standard_day_hours) * staffConfig.daily_rate;
            }

            return { ...r, isSunday, isHoliday, dayPay };
        });

        // Casual Leave Benefit
        leaveBenefit = (staffConfig.casual_leaves || 0) * staffConfig.daily_rate;
        const totalNetPay = basicSalary + otPay + specialDutyPay + leaveBenefit;

        const record = {
            name: staff.name,
            period: config.period,
            workingDays: staff.records.filter(r => !config.holidays.includes(r.date) && new Date(r.date).getDay() !== 0).length,
            sundayWorkDays: staff.records.filter(r => new Date(r.date).getDay() === 0).length,
            holidayWorkDays: staff.records.filter(r => config.holidays.includes(r.date)).length,
            casualLeaves: staffConfig.casual_leaves || 0,
            basicSalary: Math.round(basicSalary),
            otPay: Math.round(otPay),
            specialDutyPay: Math.round(specialDutyPay),
            leaveBenefit: Math.round(leaveBenefit),
            grossSalary: Math.round(totalNetPay),
            netPay: Math.round(totalNetPay),
            dailyRate: staffConfig.daily_rate,
            otHourlyRate: staffConfig.ot_hourly_rate,
            designation: staffConfig.designation || 'Site Engineer'
        };

        payrollSummary.push(record);

        // Generate HTMLs
        const tsHtml = generateTimesheetHtml(staff, record, config);
        const psHtml = generatePayslipHtml(record, config);

        fs.writeFileSync(path.join(OUTPUT_DIR, `Timesheets (Monthly)/${staff.name}_April_2026_Timesheet.html`), tsHtml);
        fs.writeFileSync(path.join(OUTPUT_DIR, `Payslips/${staff.name}_April_2026_Payslip.html`), psHtml);
        
        console.log(`✅ Processed: ${staff.name} | Net: ₹${record.netPay}`);
    }

    // Export Master Ledger
    exportToExcel(payrollSummary);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'Payroll_Master_Report_April_2026.json'), JSON.stringify(payrollSummary, null, 2));
}

function generateTimesheetHtml(staff, record, config) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; color: #1e293b; padding: 40px; background: #f1f5f9; }
        .card { background: white; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); padding: 40px; max-width: 900px; margin: auto; border: 1px solid #e2e8f0; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .logo { width: 120px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0f172a; color: white; text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        .sunday { background: #fff7ed; color: #9a3412; font-weight: 600; }
        .holiday { background: #f0fdf4; color: #166534; font-weight: 600; }
        .summary-banner { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 30px; background: #0f172a; color: white; padding: 20px; border-radius: 12px; }
        .stat-val { font-size: 18px; font-weight: 800; }
        .stat-lab { font-size: 10px; opacity: 0.7; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div>
                <img src="${LOGO_BASE64}" class="logo">
                <h1 style="margin: 10px 0 0; font-size: 20px;">Attendance Audit: ${record.name}</h1>
            </div>
            <div style="text-align: right; color: #64748b;">
                <div>Period: <strong>${record.period}</strong></div>
                <div>Staff ID: <strong>EL-SH-${record.name.toUpperCase().substr(0,3)}</strong></div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Hours</th>
                    <th>OT</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${staff.records.map(r => {
                    const date = new Date(r.date);
                    const isSun = date.getDay() === 0;
                    const isHol = config.holidays.includes(r.date);
                    const type = isHol ? 'Public Holiday' : (isSun ? 'Sunday Duty' : 'Regular');
                    const cls = isHol ? 'holiday' : (isSun ? 'sunday' : '');
                    return `
                        <tr class="${cls}">
                            <td>${r.date}</td>
                            <td>${type}</td>
                            <td>${r.totalHours}h</td>
                            <td>${r.otHours}h</td>
                            <td>${parseFloat(r.otHours) > 0 ? 'High Capacity' : 'Normal'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <div class="summary-banner">
            <div><div class="stat-lab">Reg Working</div><div class="stat-val">${record.workingDays}d</div></div>
            <div><div class="stat-lab">Sunday Duty</div><div class="stat-val">${record.sundayWorkDays}d</div></div>
            <div><div class="stat-lab">Holiday Duty</div><div class="stat-val">${record.holidayWorkDays}d</div></div>
            <div><div class="stat-lab">Casual Leaves</div><div class="stat-val">${record.casualLeaves}d</div></div>
        </div>
    </div>
</body>
</html>
    `;
}

function generatePayslipHtml(record, config) {
    const elId = `EL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; color: #0f172a; padding: 40px; background: #f8fafc; }
        .payslip { background: white; max-width: 800px; margin: auto; padding: 50px; border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; }
        .payslip::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: #0f172a; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { width: 150px; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 30px; }
        .info-item label { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
        .info-item span { font-size: 13px; font-weight: 700; }
        .table-wrap { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2px; background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 30px; }
        .table-side { background: white; padding: 20px; }
        .side-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 15px; display: flex; justify-content: space-between; }
        .row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
        .row:last-child { border-bottom: none; }
        .amount { font-weight: 700; }
        .net-pay-box { background: #0f172a; color: white; padding: 25px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }
        .net-val { font-size: 32px; font-weight: 800; }
        .signatory-block { margin-top: 50px; display: flex; justify-content: flex-end; text-align: center; }
        .signature-line { width: 220px; border-top: 1.5px solid #0f172a; padding-top: 10px; }
        .signature-font { font-family: 'Dancing Script', cursive; font-size: 32px; color: #3b82f6; margin-bottom: -5px; transform: rotate(-2deg); }
        .footer { margin-top: 50px; font-size: 11px; color: #94a3b8; text-align: center; }
        .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 100px; font-weight: 900; color: rgba(0,0,0,0.02); pointer-events: none; }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="payslip">
        <div class="watermark">ENGLABS</div>
        <div class="header">
            <div>
                <img src="${LOGO_BASE64}" class="logo">
                <div style="font-size: 12px; font-weight: 700; color: #3b82f6; margin-top: 5px;">Forensic Project Audit Report</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Pay Period</div>
                <div style="font-size: 22px; font-weight: 800;">${record.period}</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-item"><label>Staff Name</label><span>${record.name}</span></div>
            <div class="info-item"><label>Employee ID</label><span>${elId}</span></div>
            <div class="info-item"><label>Designation</label><span>${record.designation}</span></div>
            <div class="info-item"><label>Audit Cycle</label><span>Monthly</span></div>
        </div>

        <div class="table-wrap">
            <div class="table-side">
                <div class="side-title"><span>Earnings Component</span><span>INR</span></div>
                <div class="row"><span>Basic (Days: ${record.workingDays})</span><span class="amount">₹${record.basicSalary.toLocaleString()}</span></div>
                <div class="row"><span>Overtime (Normal Duty)</span><span class="amount">₹${record.otPay.toLocaleString()}</span></div>
                <div class="row"><span style="color: #3b82f6;">Special Duty (Sun: ${record.sundayWorkDays}d, Hol: ${record.holidayWorkDays}d)</span><span class="amount">₹${record.specialDutyPay.toLocaleString()}</span></div>
                <div class="row"><span style="color: #16a34a;">Casual Leave Benefit (${record.casualLeaves}d)</span><span class="amount">₹${record.leaveBenefit.toLocaleString()}</span></div>
            </div>
            <div class="table-side" style="background: #fafafa;">
                <div class="side-title"><span>Deductions</span><span>INR</span></div>
                <div class="row"><span>Professional Tax</span><span class="amount">₹0.00</span></div>
                <div class="row"><span>Advance Adjusted</span><span class="amount">₹0.00</span></div>
                <div class="row"><span>Security Deposit</span><span class="amount">₹0.00</span></div>
            </div>
        </div>

        <div class="net-pay-box">
            <div>
                <div style="font-size: 11px; text-transform: uppercase; opacity: 0.6;">Net Audit Disbursement</div>
                <div style="font-size: 13px; font-weight: 600; margin-top: 5px;">Rupees ${numberToWords(record.netPay)} Only</div>
            </div>
            <div class="net-val">₹${record.netPay.toLocaleString()}</div>
        </div>

        <div class="signatory-block">
            <div class="signature-line">
                <div class="signature-font">SWilson</div>
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Authorized Signatory</div>
            </div>
        </div>

        <div class="footer">
            Digital Forensic Verification: <strong>EL-AUDIT-${Math.random().toString(36).substr(2, 6).toUpperCase()}</strong><br>
            © 2026 EngLabs India Pvt Ltd | Forensic Financial Intelligence
        </div>
    </div>
</body>
</html>
    `;
}

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
    const inWords = (n) => n < 20 ? a[n] : b[Math.floor(n / 10)] + a[n % 10];
    const convert = (n) => {
        if (n === 0) return '';
        let str = '';
        if (n >= 100) { str += a[Math.floor(n / 100)] + 'Hundred '; n %= 100; if (n > 0) str += 'and '; }
        str += inWords(n);
        return str;
    };
    let n = Math.floor(num);
    if (n === 0) return 'Zero';
    let str = '';
    if (n >= 100000) { str += convert(Math.floor(n / 100000)) + 'Lakh '; n %= 100000; }
    if (n >= 1000) { str += convert(Math.floor(n / 1000)) + 'Thousand '; n %= 1000; }
    str += convert(n);
    return str.trim();
}

function exportToExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Payroll");
    const fileName = `Payroll_Master_Report_April_2026.xlsx`;
    XLSX.writeFile(wb, path.join(OUTPUT_DIR, fileName));
}

generate();
