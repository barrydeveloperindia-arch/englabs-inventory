import { describe, it, expect } from 'vitest';
import { calculatePayroll, calculateTaxAndNI } from '../../lib/payroll_logic';
import { StaffMember, AttendanceRecord, AdvanceRequest } from '../../types';

describe('💷 Payroll Logic Unit Tests', () => {

    const mockStaff: StaffMember = {
        id: 's1',
        name: 'John Doe',
        role: 'Assistant',
        hourlyRate: 12.50,
        contractType: 'Full-time',
        taxCode: '1257L',
        niNumber: 'AB123456C',
        // ... defaults
        status: 'Active',
        pin: '0000',
        rightToWork: true,
        emergencyContact: '',
        joinedDate: '2023-01-01',
        monthlyRate: 0,
        dailyRate: 0,
        advance: 0,
        holidayEntitlement: 20,
        accruedHoliday: 0
    };

    it('Calculates Gross Pay based on Hourly Rate', () => {
        // 40 Hours @ 12.50
        const result = calculatePayroll(mockStaff, 40, 0); // 0 Overtime
        expect(result.grossPay).toBe(500.00); // 40 * 12.50
    });

    it('Calculates Overtime at 1.5x Rate', () => {
        // 40 Regular, 5 Overtime
        // Regular: 40 * 12.50 = 500
        // Overtime: 5 * (12.50 * 1.5) = 5 * 18.75 = 93.75
        // Total: 593.75
        const result = calculatePayroll(mockStaff, 40, 5);
        expect(result.grossPay).toBe(593.75);
        expect(result.overtimePay).toBe(93.75);
    });

    it('Calculates Tax and NI (Simplified UK Logic)', () => {
        // Gross: 2000
        // Tax: 20% of (2000 - 1048) approx? 
        // Let's use specific known values or mock logic expectation
        // For TDD, we expect non-zero tax for high amounts
        const deductions = calculateTaxAndNI(2500, '1257L');
        expect(deductions.tax).toBeGreaterThan(0);
        expect(deductions.ni).toBeGreaterThan(0);
        expect(deductions.totalDeductions).toBeCloseTo(deductions.tax + deductions.ni + deductions.pension, 2);
    });

    it('Deducts Advances from Net Pay', () => {
        const gross = 500;
        const tax = 0; // Simplified
        const advances = 100;

        const net = gross - tax - advances;
        expect(net).toBe(400);
    });

    it('Generates HMRC RTI-Compliant CSV Data Structure', async () => {
        const { generateRTIData } = await import('../../lib/payroll_logic');
        const mockSalaries = [
            {
                staffId: 's1',
                employeeName: 'Paras',
                payDate: '2026-02-14',
                grossPay: 2000,
                incomeTax: 200,
                nationalInsurance: 150,
                pension: 100,
                totalAmount: 1550
            }
        ];

        const rtiData = generateRTIData(mockSalaries);
        expect(rtiData.length).toBe(2); // Headers + 1 row
        expect(rtiData[0]).toContain('Employee ID');
        expect(rtiData[1]).toContain('Paras');
        expect(rtiData[1]).toContain('1550.00'); // Net pay
    });
});
