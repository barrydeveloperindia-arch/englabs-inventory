
export type UserRole = 'Owner' | 'Director' | 'Business Coordinator' | 'Manager' | 'Accounts Officer' | 'Store In-charge' | 'Store Management' | 'Till Manager' | 'Inventory Staff' | 'Shop Assistant' | 'Cashier' | 'Assistant';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Verified';

export interface ShopTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: string; // staffId
  assignedByName?: string;
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  priority?: 'High' | 'Medium' | 'Low';
  proofPhoto?: string;
  proofPhotos?: string[];
  createdAt: string;
  completedBy?: string;
  completedAt?: string;
  notes?: string;   // For comments
}

export type ContractType = 'Full-time' | 'Part-time' | 'Zero-hour' | 'Contractor';

export type LedgerAccount =
  | 'Sales Revenue'
  | 'Cost of Goods Sold'
  | 'Inventory Asset'
  | 'Accounts Payable'
  | 'Cash in Hand'
  | 'Bank Account'
  | 'VAT Liability'
  | 'Operational Expense'
  | 'Payroll Expense'
  | 'Stock Variance';

export interface LedgerEntry {
  id: string;
  timestamp: string;
  account: LedgerAccount;
  type: 'Debit' | 'Credit';
  amount: number;
  referenceId: string;
  description: string;
  category: 'Sales' | 'Purchase' | 'Inventory' | 'Expense' | 'Payroll' | 'Adjustment';
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  category: string;
  totalSpend: number;
  outstandingBalance: number;
  orderCount: number;
  lastOrderDate?: string;
  address?: string;
  gstin?: string;
}

export interface Bill {
  id: string;
  supplierId: string;
  purchaseId: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Unpaid' | 'Partial' | 'Settled';
  note?: string;
}

export interface VatBandSummary {
  gross: number;
  net: number;
  vat: number;
}

export interface Transaction {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  vatTotal: number;
  paymentMethod: 'Cash' | 'Card';
  items: {
    id: string;
    name: string;
    brand: string;
    price: number;
    costPrice?: number;
    qty: number;
    vatRate: number;
    sku: string;
  }[];
  vatBreakdown: {
    0: VatBandSummary;
    5: VatBandSummary;
    20: VatBandSummary;
  };
}

export interface Refund {
  id: string;
  timestamp: string;
  staffId: string;
  staffName: string;
  amount: number;
  reason: string;
  originalTransactionId?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  invoiceNumber: string;
  amount: number;
  items: string; // Description
  category?: string; // Stock / Cleaning / Stationery / Repair / Other
  qty?: number;
  unitPrice?: number;
  totalAmount?: number; // alias for amount for clarity
  paymentMode?: string;
  purchasedBy?: string;
  remarks?: string;
  vendorName?: string; // Snapshot
  vendorContact?: string; // Snapshot
  condition?: 'OK' | 'Damaged';
  deliveryMethod?: 'Delivered' | 'Collected';
  status: 'Received' | 'Pending' | 'Cancelled';
  receiptData?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userRole: UserRole;
  staffName: string;
  terminalId: string;
  module: ViewType;
  details: string;
  severity: 'Info' | 'Warning' | 'Critical';
}

export interface AdjustmentLog {
  id: string;
  date: string;
  type: 'relative' | 'fixed' | 'audit';
  amount?: number;
  previousStock?: number;
  newStock?: number;
  reason: 'Inward' | 'Sale' | 'Damage' | 'Correction' | 'Return' | 'Price Revision' | 'Metadata Update' | 'Registry Creation' | 'Bulk Action' | 'VAT Change';
  note?: string;
  user?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export type UnitType = 'pcs' | 'kg' | 'g' | 'litre' | 'ml' | 'pack' | 'box' | 'unit' | 'set' | 'roll' | 'm' | 'sqm';

export interface InventoryItem {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  brand: string;
  packSize: string;
  unitType: UnitType;
  category: string;
  supplierId: string;
  origin: string;
  shelfLocation?: string;
  stock: number;
  minStock: number;
  costPrice: number;
  price: number; // This is the selling price, which should include VAT if applicable
  vatRate: number; // The VAT rate applied to this item
  status: 'Active' | 'Discontinued' | 'Out of Stock' | 'Audit' | 'UNVERIFIED' | 'VERIFIED' | 'LIVE';
  expiryDate?: string; // Corresponds to expiry_date
  batchNumber?: string;
  logs?: AdjustmentLog[];
  photo?: string;
  photoUrl?: string;
  currency?: string;
  imageUrl?: string; // Corresponds to image_url
  createdAt?: string; // Corresponds to created_at
  updatedAt?: string;
  lastBuyPrice?: number;
  rating?: number;
}

export type Product = InventoryItem;

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Sick' | 'Holiday' | 'Pending' | 'Half Day';
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  hoursWorked?: number;
  overtime?: number;
  notes?: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
}

export interface ExperienceEntry {
  company: string;
  lastSalary: number;
  salarySlip?: string;
}

export interface IdentificationDocs {
  aadhar: { number: string; proof?: string };
  pan: { number: string; proof?: string };
  voterId: { number: string; proof?: string };
  drivingLicense: { number: string; proof?: string };
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  contractType: ContractType;
  pin: string;
  loginBarcode?: string;
  niNumber: string;
  taxCode: string;
  rightToWork: boolean;
  emergencyContact: string;
  joinedDate: string;
  status: 'Active' | 'Inactive' | 'Pending Approval';
  monthlyRate: number;
  hourlyRate: number;
  dailyRate: number;
  advance: number;
  holidayEntitlement: number;
  accruedHoliday: number;
  photo?: string;
  email?: string; // Link to Firebase Auth for RBAC
  phone?: string;
  address?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  bloodGroup?: string;
  assignedShiftId?: string;
  department?: string;
  pensionEnrolment?: boolean;
  gdprConsent?: boolean;
  hmrcStarterDeclaration?: string;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  idDocuments?: IdentificationDocs;
  startingSalary?: number;
  validUntil?: string;
  holidayTaken?: number;
  holidayRemaining?: number;
  faceDescriptor?: number[];
}

export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Compassionate';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id: string;
  staffId: string;
  type: LeaveType;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
}



/**
 * Represents a single assigned shift in the Rota.
 * Generated when a manager drags a staff member onto a day.
 */
export interface RotaShift {
  id: string;
  staff_id: string;
  staff_name: string;
  week_start: string; // ISO Date YYYY-MM-DD of the Monday
  day: string;        // Full weekday name e.g. 'Monday'
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  total_hours: number;
  status: 'pending' | 'approved' | 'rejected';
  date: string;       // ISO Date YYYY-MM-DD
  conflict?: boolean; // UI-only flag for scheduling conflicts
  conflict_reason?: string;
}

/**
 * Represents a Staff Member's availability for a specific week.
 * Used to populate the "Available Staff" list in the Rota Planner.
 * Unique constraint: One record per staffId per weekStart.
 */
export interface RotaPreference {
  id: string;
  staffId: string;
  weekStart: string; // ISO Date YYYY-MM-DD
  targetBoardHours: number;
  availability?: {
    [key: string]: { // 'Monday', 'Tuesday', ...
      status: 'available' | 'unavailable' | 'specific';
      start?: string;
      end?: string;
    }
  };
}

export type ViewType =
  | 'dashboard'
  | 'sales'
  | 'inventory'
  | 'project'
  | 'skills'
  | 'test-center'
  | 'ai-command'
  | 'purchases'
  | 'financials'
  | 'staff'
  | 'help-support'
  | 'about-us'
  | 'smart-intake'
  | 'expenses'
  | 'suppliers'
  | 'salary'
  | 'sales-ledger'
  | 'support'
  | 'registers'
  | 'command-center'
  | 'system-health'
  | 'materials-master'
  | 'projects-office'
  | 'tesla-mode';


export interface Skill {
  id: string;
  title: string;
  description: string;
  category: 'Inventory' | 'Project' | 'HR' | 'Finance' | 'Automation';
  icon: string;
  workflowSteps: string[];
  status: 'Active' | 'Beta' | 'Legacy';
}

export interface TestCase {
  id: string;
  title: string;
  module: 'Inventory' | 'Project' | 'System';
  expectation: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  lastRun?: string;
}

export interface TestProject {
  id: string;
  name: string;
  cases: TestCase[];
  relatedFiles: string[];
}


export interface SalaryRecord {
  id: string;
  staffId: string;
  employeeName: string;
  month: string;
  payDate: string;
  taxCode: string;
  niNumber: string;
  basePay: number;
  overtimePay: number;
  holidayPay: number;
  sickPay: number;
  totalHours: number;
  totalOvertime: number;
  incomeTax: number;
  nationalInsurance: number;
  pension: number;
  deductions: number;
  grossPay: number;
  totalAmount: number;
  ytdGross: number;
  ytdTax: number;
  ytdNI: number;
  ytdPension: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  generatedAt: string;
}

export interface AdvanceRequest {
  id: string;
  staffId: string;
  amount: number;
  reason: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  approvedBy?: string;
  paidDate?: string;
}

export interface TimesheetSummary {
  staffId: string;
  staffName: string;
  periodStart: string;
  periodEnd: string;
  regularHours: number;
  overtimeHours: number;
  totalPayable: number;
  status: 'Draft' | 'Approved';
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface SmartIntakeItem {
  name: string;
  brand?: string;
  qty: number;
  costPrice: number;
  price: number;
  category: string;
  shelfLocation: string;
  barcode?: string;
  sku?: string;
  image?: string;
  box_2d?: [number, number, number, number];
}

export interface AIInventoryResult {
  name: string;
  brand?: string;
  qty: number;
  costPrice: number;
  price: number;
  category: string;
  shelfLocation: string;
  barcode?: string;
  sku?: string;
}

export interface AIAttendanceResult {
  employeeName: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late';
  clockIn?: string;
  clockOut?: string;
}

export interface AICommandResult {
  modality: 'INVENTORY' | 'ATTENDANCE' | 'ROLLBACK';
  inventoryItems?: AIInventoryResult[];
  attendanceRecords?: AIAttendanceResult[];
  rollbackParams?: {
    type: 'time' | 'steps';
    value: number; // minutes if time, count if steps
  };
  summary: string;
}

/**
 * System state snapshot for full rollback.
 */
export interface SystemSnapshot {
  id: string;
  timestamp: string;
  description: string;
  inventory: InventoryItem[];
  attendance: AttendanceRecord[];
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  expenses: Expense[];
  purchases: Purchase[];
  bills: Bill[];
  suppliers: Supplier[];
}

export interface DailyCheck {
  id: string;
  date: string;
  type: 'Opening' | 'Closing';
  checkedBy: string;
  time: string;
  tasks: {
    description: string;
    completed: boolean;
    photo?: string;
  }[];
  remarks?: string;
  timestamp: string;
  proofPhoto?: string;
}

export interface ExpiryLog {
  id: string;
  itemId: string;
  itemName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  action: 'Removed' | 'Returned' | 'Destroyed';
  removedDate: string;
  checkedBy: string;
  remarks?: string;
}

export interface CleaningTask {
  id: string;
  description: string;
  frequency: 'Daily' | 'Weekly' | '2 Weeks' | '4 Weeks';
  area: string;
  responsibleRole: string;
}

export interface CleaningLog {
  id: string;
  taskId: string;
  description: string;
  performedBy: string;
  date: string;
  remarks?: string;
  timestamp: string;
}

export interface DailySalesRecord {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  dayOfWeek?: string;
  categoryBreakdown: {
    rawMaterials: number;
    fasteners: number;
    electronics: number;
    pneumatics: number;
    tools: number;
    safetyGear: number;
    consumables: number;
    finishedGoods: number;
    wip: number;
    other: number;
  };
  totalSales: number;
  cashTaken: number;
  cardTaken: number;
  cashPurchases: number;
  netBalance: number;
  timestamp: string;
}

export type Permission =
  | 'inventory.create' | 'inventory.read' | 'inventory.update' | 'inventory.delete'
  | 'sales.process' | 'sales.read' | 'sales.refund'
  | 'users.manage'
  | 'reports.view' | 'reports.export'
  | 'test.manage'
  | 'billing.manage'
  | 'financials.manage'
  | 'terminal.unlock'
  | 'rota.plan';

export interface RoleDefinition {
  id: string; // e.g. 'owner', 'manager'
  role: UserRole;
  permissions: Permission[];
  description: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  read: boolean;
  createdAt: string;
  link?: string;
  actionBy?: string;
}
