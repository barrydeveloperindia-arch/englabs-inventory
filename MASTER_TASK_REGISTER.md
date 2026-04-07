# 📋 ENGLABS: Master Task Register (v3.0.0)
> **Status**: [🔴 5% COMPLETE] - Building Infrastructure Foundations

## 🚧 THE WORLD-CLASS QUALITY GATES
For every task below, the following gates must be passed:
1.  **[B] Blueprint**: Is there a plan in the `docs/blueprints/` folder?
2.  **[T] TDD**: Does a reproduction test exist and PASS?
3.  **[G] Guardian**: Did `node scripts/verify-task.mjs <TASK_ID>` pass the build & logic check?
4.  **[A] Audit**: Has Agent Beta (Clawdbot) scanned the code for security/edge cases?

---

## 🏛️ PILLAR 1: IDENTITY REALIGNMENT (Branding & UX)
| Task ID | Component | Task Description | B | T | G | A | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1** | `AccessTerminal` | Migrate to "Industrial Clean" Light/Dark UX | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **1.2** | `Logo` | Standardize Brand Registry across all PDFs | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **1.3** | `Sidebar` | Update labels/icons to ENGLABS nomenclature | [ ] | [ ] | [ ] | [ ] | 🔘 ACTIVE |

## 🔐 PILLAR 2: SECURITY HARDENING (Identity & RBAC)
| Task ID | Component | Task Description | B | T | G | A | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2.1** | `Auth` | Implement Unique Staff PIN Isolation Logic | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **2.2** | `FaceAuth` | Biometric fallback & WebAuthn Integration | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **2.3** | `Types` | RBAC Level Validation (Strict Typing) | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |

## 🏗️ PILLAR 3: MODULE ISOLATION (Decoupling)
| Task ID | Component | Task Description | B | T | G | A | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1** | `Inventory` | Split `InventoryView` into sub-organisms (Table/Detail) | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **3.2** | `Projects` | Decouple `ProjectsOffice.tsx` from Sales logic | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **3.3** | `Mock` | Centralise `FirestoreMock.ts` for all modules | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |

## 🤖 PILLAR 4: AGENTIC LOGIC & VERIFICATION
| Task ID | Component | Task Description | B | T | G | A | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **4.1** | `Diagnostics` | **System Diagnostics & Health Panel (Task 1.1)** | [✅] | [✅] | [✅] | [✅] | 🟢 STABLE |
| **4.2** | `Persistence` | Neural History Storage (Firestore Bridge) | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **4.3** | `Vision` | Visual Cortex Object Detection (Shelf Scan) | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |

## 🏗️ PHASE 5: WORLD-CLASS ARCHITECTURAL REFACTOR
| Task ID | Component | Task Description | B | T | G | A | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **5.1** | `Global` | **Blueprint: Feature-Based Modular Architecture** | [✅] | [✅] | [✅] | [✅] | 🟢 STABLE |
| **5.2** | `Staff` | Refactor `StaffView.tsx` into Atomic Domain | [✅] | [✅] | [✅] | [✅] | 🟢 STABLE |
| **5.3** | `Inventory` | Refactor `InventoryView.tsx` into Atomic Domain | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |
| **5.4** | `Logic` | Extract Business Logic to Custom Hooks (`hooks/`) | [ ] | [ ] | [ ] | [ ] | ⚪ PENDING |

---

## 📈 SPRINT LOG
- **2026-04-07**: Initialised Master Task Register.
- **2026-04-07**: Resolved Vitest Deadlocks and Windows ESM Path issues.
- **2026-04-07**: Task 4.1 [System Diagnostics] verified STABLE with 100% test coverage.
