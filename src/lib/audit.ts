import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type AuditAction =
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'SALE_COMPLETED'
    | 'SALE_VOIDED'
    | 'INVENTORY_UPDATE'
    | 'INVENTORY_DELETE'
    | 'STAFF_CREATED'
    | 'STAFF_UPDATED'
    | 'STAFF_DELETED'
    | 'SHIFT_STARTED'
    | 'SHIFT_ENDED'
    | 'SYSTEM_CONFIG_CHANGE';

export interface AuditLogEntry {
    action: AuditAction;
    actorId: string; // The Staff ID performing the action
    actorType: 'Owner' | 'Manager' | 'Cashier' | 'System';
    resourceId?: string; // ID of the item/staff/sale being affected
    details: Record<string, any>; // JSON metadata (e.g., "Changed price from $10 to $12")
    timestamp: any;
    ip?: string;
    deviceInfo?: string;
}

/**
 * 🛡️ COMPLIANCE AUDIT LOGGER
 * Writes an immutable record to the 'audit_logs' subcollection.
 * This data should be strictly read-only for most users.
 */
export const logAudit = async (
    shopId: string,
    action: AuditAction,
    actorId: string,
    actorType: 'Owner' | 'Manager' | 'Cashier' | 'System',
    details: Record<string, any>,
    resourceId?: string
) => {
    try {
        const auditRef = collection(db, 'shops', shopId, 'audit_logs');

        const entry: AuditLogEntry = {
            action,
            actorId,
            actorType,
            resourceId,
            details,
            timestamp: serverTimestamp(),
            deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        };

        await addDoc(auditRef, entry);
        // console.log(`[AUDIT] ${action} logged for ${actorId}`);
    } catch (error) {
        console.error('[AUDIT_FAILURE] Critical: Failed to write audit log', error);
        // In a strict environment, we might want to throw here to prevent the action 
        // from completing if it can't be logged (Fail-Closed).
        // For now, we log the error to console.
    }
};
