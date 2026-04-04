# ENGLABS INVENTORY - Leave Approval Workflow (Strict Hierarchy)

## Overview
This document outlines the **Strict Leave Approval Workflow** derived from the Organizational Chart. Unlike the previous role-based system, this enforces specific reporting lines.

## The Hierarchy (Visual Reference)

Based on the application's Org Chart:

1.  **Core Management Trio**: Salil, Parth, Paras.
2.  **Active Operations**: Paras involves the "Employees".
3.  **Management Support**: Salil involves "Bharat" and "Gaurav".

## Approval Rules (Strict)

| Requester Group | Specific Staff | Reporting Manager (Approver) |
| :--- | :--- | :--- |
| **Employees** | `Nayan`, `Nisha`, `Harsh`, `Smit` (All Shop Assistants / Inventory) | **Paras** (Manager) |
| **Operational Manager** | **Paras** | **Salil** or **Parth** (Business Coordinators) |
| **Management Support** | **Bharat** (Owner), **Gaurav** (Manager) | **Salil** (Business Coordinator) |
| **Coordinators** | **Salil**, **Parth** | **Bharat** or **Director** (Cross-approval) |

> **Note:** "Employees" cannot approve any requests.
> **Note:** Approvers cannot approve their own requests.

## Workflow Logic (Pseudo-Code)

```javascript
function canApprove(approver, requester) {
  // 1. Self-approval is never allowed
  if (approver.id === requester.id) return false;

  const rName = requester.name.toUpperCase();
  const aName = approver.name.toUpperCase();

  // 2. Employee Level -> Reports to PARAS
  if (isEmployee(requester)) {
    return aName.includes('PARAS');
  }

  // 3. Paras -> Reports to SALIL or PARTH
  if (rName.includes('PARAS')) {
    return aName.includes('SALIL') || aName.includes('PARTH');
  }

  // 4. Support Group (Bharat/Gaurav) -> Reports to SALIL
  if (rName.includes('BHARAT') || rName.includes('GAURAV')) {
    return aName.includes('SALIL');
  }

  // 5. Fallback / Top Level
  return userRole === 'Owner'; 
}
```

## Status Visibility
*   **Pending**: Visible to Requester and their Specific Approver.
*   **Approved/Rejected**: Visible to all Management.
