import { StaffMember } from '../types';

export interface PayrollResult {
    grossPay: number;
    regularPay: number;
    overtimePay: number;
    totalHours: number;
}

export interface TaxResult {
    tax: number;
    ni: number;
    pension: number;
    totalDeductions: number;
}

/**
 * Calculates Gross Pay based on Hours and Rate.
 * Overtime defaults to 1.5x Multiplier.
 */
export const calculatePayroll = (staff: StaffMember, hours: number, overtime: number): PayrollResult => {
    const rate = staff.hourlyRate || 0;

    // Safety check
    if (rate <= 0) {
        return { grossPay: 0, regularPay: 0, overtimePay: 0, totalHours: 0 };
    }

    const grossRegular = hours * rate;
    const grossOvertime = overtime * (rate * 1.5);
    const totalGross = grossRegular + grossOvertime;

    return {
        grossPay: parseFloat(totalGross.toFixed(2)),
        regularPay: parseFloat(grossRegular.toFixed(2)),
        overtimePay: parseFloat(grossOvertime.toFixed(2)),
        totalHours: hours + overtime
    };
};

/**
 * Estimates Tax and NI based on simplified UK bands.
 * Reflects April 2024 NI rate of 8% for employees.
 */
export const calculateTaxAndNI = (gross: number, taxCode: string): TaxResult => {
    // Standard Personal Allowance ~£12,570/yr (~£1,048/mo)
    const personalAllowanceMonthly = 1048;

    // Primary Threshold (for NI) ~£1,048/mo
    const niThresholdMonthly = 1048;

    let freePay = personalAllowanceMonthly;
    const codeNum = parseInt(taxCode);
    if (!isNaN(codeNum)) {
        freePay = (codeNum * 10) / 12;
    }

    const taxableForIncomeTax = Math.max(0, gross - freePay);
    const taxableForNI = Math.max(0, gross - niThresholdMonthly);

    // Basic Rate 20%
    const tax = taxableForIncomeTax * 0.20;

    // NI Class 1 (Employee) - 8% as of April 2024
    const ni = taxableForNI * 0.08;

    // Pension 3% of Qualifying Earnings (Simplified as Gross > 520)
    const pension = gross > 520 ? gross * 0.03 : 0;

    return {
        tax: parseFloat(tax.toFixed(2)),
        ni: parseFloat(ni.toFixed(2)),
        pension: parseFloat(pension.toFixed(2)),
        totalDeductions: parseFloat((tax + ni + pension).toFixed(2))
    };
};

/**
 * Generates an RTI-compatible (Real-Time Information) payload for CSV export.
 * This can be ingested by UK payroll agents or software.
 */
export const generateRTIData = (salaries: any[]) => {
    const headers = [
        'Employee ID',
        'Payroll ID',
        'Full Name',
        'Payment Date',
        'Gross Pay',
        'Tax Deducted',
        'Employee NI',
        'Pension Contribution',
        'Net Pay'
    ];

    const rows = salaries.map(s => [
        s.staffId,
        s.payrollId || `PAY-${s.staffId.slice(0, 4)}`,
        s.employeeName,
        s.payDate,
        s.grossPay.toFixed(2),
        s.incomeTax.toFixed(2),
        s.nationalInsurance.toFixed(2),
        s.pension.toFixed(2),
        s.totalAmount.toFixed(2)
    ]);

    return [headers, ...rows];
};
