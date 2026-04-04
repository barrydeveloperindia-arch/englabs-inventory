import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    increment,
    writeBatch,
    setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { InventoryItem, Transaction, SystemSnapshot } from '../types';

// Collection References Helper
const getInventoryRef = (userId: string) => collection(db, 'shops', userId, 'inventory');
const getTransactionsRef = (userId: string) => collection(db, 'shops', userId, 'transactions');
const getSnapshotsRef = (userId: string) => collection(db, 'shops', userId, 'snapshots');

/**
 * Real-time Inventory Subscription
 */
export const subscribeToInventory = (userId: string, callback: (items: InventoryItem[]) => void) => {
    return onSnapshot(getInventoryRef(userId), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as InventoryItem));
        console.log(`[Firestore] Sync: Inventory for ${userId} (${items.length} items)`);
        callback(items);
    });
};

/**
 * Real-time Transactions Subscription
 */
export const subscribeToTransactions = (userId: string, callback: (transactions: Transaction[]) => void) => {
    return onSnapshot(getTransactionsRef(userId), (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
        console.log(`[Firestore] Sync: Transactions for ${userId} (${transactions.length} items)`);
        callback(transactions);
    });
};

import { AttendanceRecord, Bill, DailySalesRecord, Expense, LeaveRequest, LedgerEntry, Purchase, RotaPreference, RotaShift, SalaryRecord, ShopTask, StaffMember, Supplier, UserRole } from '../types';

// Collection Helpers
// Collection Helpers - EXPORTED for Consistency
export const getStaffRef = (userId: string) => collection(db, 'shops', userId, 'staff');
export const getStaffDocRef = (userId: string, staffId: string) => doc(db, 'shops', userId, 'staff', staffId);

const getAttendanceRef = (userId: string) => collection(db, 'shops', userId, 'attendance');
const getLedgerRef = (userId: string) => collection(db, 'shops', userId, 'ledger');
const getSuppliersRef = (userId: string) => collection(db, 'shops', userId, 'suppliers');
const getRotaRef = (userId: string) => collection(db, 'shops', userId, 'rota');
const getRotaPreferencesRef = (userId: string) => collection(db, 'shops', userId, 'rota_preferences');

// --- ROTA FUNCTIONS ---

/**
 * Subscribes to Rota Shifts.
 * Returns a real-time stream of all assigned shifts.
 * Used by StaffView to render the Rota Planner.
 */
export const subscribeToRota = (userId: string, callback: (shifts: RotaShift[]) => void) => {
    return onSnapshot(getRotaRef(userId), (snapshot) => {
        const shifts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RotaShift));
        callback(shifts);
    });
};

export const subscribeToRotaPreferences = (userId: string, callback: (prefs: RotaPreference[]) => void) => {
    return onSnapshot(getRotaPreferencesRef(userId), (snapshot) => {
        const prefs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RotaPreference));
        callback(prefs);
    });
};

/**
 * Publishes a batch of Rota Shifts to Firestore.
 * Uses a WriteBatch to ensure atomicity.
 * 
 * @param userId - The Shop ID
 * @param shifts - Array of RotaShift objects to save
 */
export const publishRota = async (userId: string, shifts: RotaShift[]) => {
    const batch = writeBatch(db);
    shifts.forEach(shift => {
        // Use week_start + staff_id + day as ID to prevent duplicates if needed, or simple ID
        // Here we use existing ID or generate one.
        const ref = doc(db, 'shops', userId, 'rota', shift.id || crypto.randomUUID());
        batch.set(ref, { ...shift, id: ref.id }); // Ensure ID is set
    });
    await batch.commit();
};

export const saveRotaPreference = async (userId: string, pref: RotaPreference) => {
    const id = pref.id || crypto.randomUUID();
    const ref = doc(db, 'shops', userId, 'rota_preferences', id);
    await setDoc(ref, { ...pref, id });
};

export const subscribeToShopSettings = (userId: string, callback: (settings: any) => void) => {
    const ref = doc(db, 'shops', userId, 'settings', 'general');
    return onSnapshot(ref, (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback(null);
        }
    });
};
const getBillsRef = (userId: string) => collection(db, 'shops', userId, 'bills');
const getExpensesRef = (userId: string) => collection(db, 'shops', userId, 'expenses');
const getDailySalesRef = (userId: string) => collection(db, 'shops', userId, 'daily_sales');
const getPurchasesRef = (userId: string) => collection(db, 'shops', userId, 'purchases');

// Staff
export const subscribeToStaff = (userId: string, callback: (staff: StaffMember[]) => void) => {
    return onSnapshot(getStaffRef(userId), (snapshot) => {
        const staff = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StaffMember));
        console.log(`[Firestore] Sync: Staff for ${userId} (${staff.length} members)`);
        callback(staff);
    }, (error) => {
        console.error("🔥 Permission Error or Staff Fetch Failed:", error);
    });
};

// Attendance
export const subscribeToAttendance = (userId: string, callback: (records: AttendanceRecord[]) => void) => {
    return onSnapshot(getAttendanceRef(userId), (snapshot) => {
        const records = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AttendanceRecord));
        console.log(`[Firestore] Sync: Attendance for ${userId} (${records.length} records)`);
        callback(records);
    });
};

// Ledger (Financials)
export const subscribeToLedger = (userId: string, callback: (entries: LedgerEntry[]) => void) => {
    return onSnapshot(getLedgerRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LedgerEntry)));
    });
};

// Daily Sales
export const subscribeToDailySales = (userId: string, callback: (records: DailySalesRecord[]) => void) => {
    return onSnapshot(getDailySalesRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DailySalesRecord)));
    });
};
// Transactions
export const processTransaction = async (userId: string, transaction: Transaction) => {
    const batch = writeBatch(db);

    // 1. Add Transaction Record
    const txRef = doc(db, 'shops', userId, 'transactions', transaction.id);
    batch.set(txRef, transaction);

    // 2. Update Inventory Stock
    transaction.items.forEach(item => {
        const itemRef = doc(db, 'shops', userId, 'inventory', item.id);
        batch.update(itemRef, {
            stock: increment(-item.qty)
        });
    });

    // 3. Commit Batch
    await batch.commit();
};
// Attendance CRUD
export const addAttendanceRecord = async (userId: string, record: AttendanceRecord) => {
    const ref = doc(db, 'shops', userId, 'attendance', record.id);
    await setDoc(ref, record);
};

export const updateAttendanceRecord = async (userId: string, recordId: string, updates: Partial<AttendanceRecord>) => {
    const ref = doc(db, 'shops', userId, 'attendance', recordId);
    await updateDoc(ref, updates);
};

export const deleteAttendanceRecord = async (userId: string, recordId: string) => {
    const ref = doc(db, 'shops', userId, 'attendance', recordId);
    await deleteDoc(ref);
};

// -- MISSING EXPORTS RESTORED --

// Subscriptions
export const subscribeToSuppliers = (userId: string, callback: (items: Supplier[]) => void) => {
    return onSnapshot(getSuppliersRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Supplier)));
    });
};

export const subscribeToBills = (userId: string, callback: (items: Bill[]) => void) => {
    return onSnapshot(getBillsRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Bill)));
    });
};

export const subscribeToExpenses = (userId: string, callback: (items: Expense[]) => void) => {
    return onSnapshot(getExpensesRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense)));
    });
};

export const subscribeToPurchases = (userId: string, callback: (items: Purchase[]) => void) => {
    return onSnapshot(getPurchasesRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Purchase)));
    });
};

// CRUD: Inventory
export const addInventoryItem = async (userId: string, item: InventoryItem) => {
    const ref = doc(db, 'shops', userId, 'inventory', item.id);
    await setDoc(ref, item);
};

export const updateInventoryItem = async (userId: string, itemId: string, updates: Partial<InventoryItem>) => {
    const ref = doc(db, 'shops', userId, 'inventory', itemId);
    // Use setDoc with merge: true to handle cases where the doc might be missing (UPSERT)
    await setDoc(ref, updates, { merge: true });
};

// CRUD: Staff
export const addStaffMember = async (userId: string, staff: StaffMember) => {
    const ref = doc(db, 'shops', userId, 'staff', staff.id);
    await setDoc(ref, staff);
};

export const updateStaffMember = async (userId: string, staffId: string, updates: Partial<StaffMember>) => {
    const ref = doc(db, 'shops', userId, 'staff', staffId);
    await updateDoc(ref, updates);
};

export const deleteStaffMember = async (userId: string, staffId: string) => {
    const ref = doc(db, 'shops', userId, 'staff', staffId);
    await deleteDoc(ref);
};

// CRUD: Leaves
export const getLeavesRef = (userId: string) => collection(db, 'shops', userId, 'leaves');

export const subscribeToLeaves = (userId: string, callback: (requests: LeaveRequest[]) => void) => {
    return onSnapshot(getLeavesRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LeaveRequest)));
    });
};

export const addLeaveRequest = async (userId: string, request: LeaveRequest) => {
    const ref = doc(db, 'shops', userId, 'leaves', request.id);
    await setDoc(ref, request);
};

export const updateLeaveRequest = async (userId: string, requestId: string, updates: Partial<LeaveRequest>) => {
    const ref = doc(db, 'shops', userId, 'leaves', requestId);
    await updateDoc(ref, updates);
};

export const deleteLeaveRequest = async (userId: string, requestId: string) => {
    const ref = doc(db, 'shops', userId, 'leaves', requestId);
    await deleteDoc(ref);
};

// CRUD: Ledger
export const addLedgerEntry = async (userId: string, entry: LedgerEntry) => {
    const ref = doc(db, 'shops', userId, 'ledger', entry.id);
    await setDoc(ref, entry);
};

// CRUD: Expenses
export const addExpense = async (userId: string, expense: Expense) => {
    const ref = doc(db, 'shops', userId, 'expenses', expense.id);
    await setDoc(ref, expense);
};

// CRUD: Daily Sales (Batch Import)
export const batchImportDailySales = async (userId: string, records: DailySalesRecord[]) => {
    const batch = writeBatch(db);
    records.forEach(record => {
        const ref = doc(db, 'shops', userId, 'daily_sales', record.id);
        batch.set(ref, record);
    });
    await batch.commit();
};

// CRUD: Purchases
export const addPurchase = async (userId: string, purchase: Purchase) => {
    const ref = doc(db, 'shops', userId, 'purchases', purchase.id);
    await setDoc(ref, purchase);
};

export const updatePurchase = async (userId: string, purchaseId: string, updates: Partial<Purchase>) => {
    const ref = doc(db, 'shops', userId, 'purchases', purchaseId);
    await updateDoc(ref, updates);
};

// CRUD: Bills
export const addBill = async (userId: string, bill: Bill) => {
    const ref = doc(db, 'shops', userId, 'bills', bill.id);
    await setDoc(ref, bill);
};

export const updateBill = async (userId: string, billId: string, updates: Partial<Bill>) => {
    const ref = doc(db, 'shops', userId, 'bills', billId);
    await updateDoc(ref, updates);
};

// CRUD: Suppliers
export const addSupplier = async (userId: string, supplier: Supplier) => {
    const ref = doc(db, 'shops', userId, 'suppliers', supplier.id);
    await setDoc(ref, supplier);
};

export const updateSupplier = async (userId: string, supplierId: string, updates: Partial<Supplier>) => {
    const ref = doc(db, 'shops', userId, 'suppliers', supplierId);
    await updateDoc(ref, updates);
};

export const deleteSupplier = async (userId: string, supplierId: string) => {
    const ref = doc(db, 'shops', userId, 'suppliers', supplierId);
    await deleteDoc(ref);
};

// CRUD: Tasks
export const getTasksRef = (userId: string) => collection(db, 'shops', userId, 'tasks');

export const subscribeToTasks = (userId: string, callback: (tasks: ShopTask[]) => void) => {
    const q = query(getTasksRef(userId)); // In real app, maybe limit to recent dates
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ShopTask)));
    });
};

export const addTask = async (userId: string, task: ShopTask) => {
    const ref = doc(db, 'shops', userId, 'tasks', task.id);
    await setDoc(ref, task);
};

export const addBatchTasks = async (userId: string, tasks: ShopTask[]) => {
    const batch = writeBatch(db);
    tasks.forEach(task => {
        const ref = doc(db, 'shops', userId, 'tasks', task.id);
        batch.set(ref, task);
    });
    await batch.commit();
};

export const updateTask = async (userId: string, taskId: string, updates: Partial<ShopTask>) => {
    const ref = doc(db, 'shops', userId, 'tasks', taskId);
    await updateDoc(ref, updates);
};

import { DailyCheck, ExpiryLog, CleaningLog } from '../types';

// Daily Checks
const getDailyChecksRef = (userId: string) => collection(db, 'shops', userId, 'daily_checks');
export const subscribeToDailyChecks = (userId: string, callback: (checks: DailyCheck[]) => void) => {
    return onSnapshot(getDailyChecksRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DailyCheck)));
    });
};
export const addDailyCheck = async (userId: string, entry: DailyCheck) => {
    const ref = doc(db, 'shops', userId, 'daily_checks', entry.id);
    await setDoc(ref, entry);
};

// Expiry
const getExpiryLogsRef = (userId: string) => collection(db, 'shops', userId, 'expiry_logs');
export const subscribeToExpiryLogs = (userId: string, callback: (logs: ExpiryLog[]) => void) => {
    return onSnapshot(getExpiryLogsRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExpiryLog)));
    });
};
export const addExpiryLog = async (userId: string, log: ExpiryLog) => {
    const ref = doc(db, 'shops', userId, 'expiry_logs', log.id);
    await setDoc(ref, log);
};

// Cleaning
const getCleaningLogsRef = (userId: string) => collection(db, 'shops', userId, 'cleaning_logs');
export const subscribeToCleaningLogs = (userId: string, callback: (logs: CleaningLog[]) => void) => {
    return onSnapshot(getCleaningLogsRef(userId), (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CleaningLog)));
    });
};
export const addCleaningLog = async (userId: string, log: CleaningLog) => {
    const ref = doc(db, 'shops', userId, 'cleaning_logs', log.id);
    await setDoc(ref, log);
};

// --- NOTIFICATIONS ---
import { Notification } from '../types';

const getNotificationsRef = (userId: string) => collection(db, 'shops', userId, 'notifications');

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
    // In a real app, you might want to limit to unread or recent 50
    // But for now, we sync all and filter client side or rely on small volume
    const q = query(getNotificationsRef(userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification)));
    });
};

export const addNotification = async (userId: string, notification: Notification) => {
    const ref = doc(db, 'shops', userId, 'notifications', notification.id);
    await setDoc(ref, notification);
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
    const ref = doc(db, 'shops', userId, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
};

export const deleteNotification = async (userId: string, notificationId: string) => {
    const ref = doc(db, 'shops', userId, 'notifications', notificationId);
    await deleteDoc(ref);
};

// PAYROLL & SALARIES
const getSalariesRef = (userId: string) => collection(db, 'shops', userId, 'salaries');

export const subscribeToSalaries = (userId: string, callback: (records: SalaryRecord[]) => void) => {
    const q = query(getSalariesRef(userId), orderBy('payDate', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SalaryRecord));
        callback(records);
    });
};

export const processPayrollBatch = async (userId: string, records: Partial<SalaryRecord>[]) => {
    const batch = writeBatch(db);
    records.forEach(record => {
        const ref = doc(getSalariesRef(userId));
        batch.set(ref, {
            ...record,
            id: ref.id,
            createdAt: serverTimestamp(),
            status: record.status || 'Pending'
        });
    });
    await batch.commit();
};

// AUDIT LOGS
const getAuditLogsRef = (userId: string) => collection(db, 'shops', userId, 'audit_logs');

export const subscribeToAuditLogs = (userId: string, callback: (logs: any[]) => void) => {
    const q = query(getAuditLogsRef(userId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        callback(logs);
    });
};

export { logAudit } from './audit';
