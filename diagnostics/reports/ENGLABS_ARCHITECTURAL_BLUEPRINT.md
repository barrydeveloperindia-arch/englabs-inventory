# 🏗️ ENGLABS Inventory Management (v3): Architectural Blueprint
> **Role**: Senior Industrial Architect & Lead UI/UX Designer
> **Objective**: Construct a high-performance Inventory & Project Management platform (Panchkula, India context).
> **Methodology**: Atomic Design + Microservices (Service-Oriented Architecture).

---

## 🎨 Part 1: Frontend & UI/UX Architecture (Atomic Design)

We are using **"ENGLABS Industrial Clean" (Light/Dark Hybrid)** to provide a professional, high-fidelity interface for complex data tracking.

### 1.1 Atomic Decomposition
We maintain `src/components` organized as:

*   **⚛️ Atoms** (`src/components/atoms`)
    *   `Typography.tsx`: Standardized professional fonts (Inter).
    *   `Button.tsx`: Highly interactive "Premium" buttons.
    *   `Input.tsx`: Secure, validated credentials & data inputs.
    *   `Badge.tsx`: Status indicators (Active, Inactive, Pending).
    *   `Icon.tsx`: Industrial-style Lucide icons.

*   **🧬 Molecules** (`src/components/molecules`)
    *   `SearchBar.tsx`: Global system search.
    *   `StatusToggle.tsx`: User/Project status management.
    *   `AttendanceTile.tsx`: Quick clock-in/out visualization.

*   **🦠 Organisms** (`src/components/organisms`)
    *   `InventoryGrid.tsx`: Master list of assets and materials.
    *   `PersonnelLedger.tsx`: Central workforce management.
    *   `FinancialPanel.tsx`: High-level fiscal analytics.

---

## 🛠️ Part 2: Technical Architecture (Simulated Microservices)

*   **`ProjectService`**: Manages lifecycle of industrial projects.
*   **`InventoryService`**: Real-time asset tracking via Firestore.
*   **`PersonnelService`**:
    *   **Biometrics**: WebAuthn & Face ID integration for secure access.
    *   **RBAC**: Level-based access control (Director, Manager, Staff).

---

## 🚀 Execution Roadmap

1.  **Identity Realignment**: Complete the transition from legacy branding to ENGLABS.
2.  **Security Hardening**: Enforce unique PINs and biometric verification.
3.  **Module Isolation**: Ensure Inventory and Project modules are completely decoupled.
4.  **Verification**: Continuous automated testing of all critical paths.

---
**Constraints**:
*   *Location*: Panchkula, Haryana, India.
*   *Identity*: "ENGLABS Inventory".
*   *Aesthetic*: Professional, High-Contrast, "Industrial Command Center" feel.

