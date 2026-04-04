# ENGLABS: Official Professional Workflow (v2.0)

## 1. Executive Summary
This document codifies the "Best of the Best" operational and engineering standards for the ENGLABS Inventory & Project Management system. Our goal is 100% reliability, zero-latency synchronization, and absolute modular decoupling.

## 2. Professional Directory Architecture (ENGLABS Engine)
We follow a **Clean Feature-Based Architecture** to ensure that every business domain is isolated and scalable.

```
englabs-inventory-app/
├── src/
│   ├── app/           # Next.js App Router (Routing-only Layer)
│   ├── core/          # Cross-cutting concerns (Global)
│   │   ├── auth/      # RBAC & Identity Verification
│   │   ├── services/  # Shared logic (Firebase, etc.)
│   │   └── config/    # Environment & System constants
│   ├── features/      # The heart of the business (Domain-specific)
│   │   ├── inventory/ # High-fidelity SKU management
│   │   ├── project/   # Ledger, P&L, and Site Ops
│   │   ├── workforce/ # Talent management & Rostering
│   │   └── finance/   # Billing, Invoicing, & Cloud Sync
│   ├── ui/            # Centralized Design System (Atoms to Organisms)
│   ├── skills/        # Persistent SOP & Intelligence Layer
│   └── tests/         # Decoupled QA (Unit, Integration, E2E)
├── docs/              # Master Operational Documentation
└── public/            # Audited visual assets (PNG/SVG)
```

## 3. The Professional Business Cycle (End-to-End)

| Phase | System Module | Objective |
| :--- | :--- | :--- |
| **I. Governance** | System Blueprint | Align the entire team with the operational roadmap. |
| **II. Audit** | Materials Master | Ensure the foundation is 100% accurate (Digital vs Physical). |
| **III. Execution** | Project Desk | Real-time tracking of site consumption and P&L. |
| **IV. Intelligence** | Skill Registry | Standardize workflows via SOPs (SKILL-EN-XXX). |
| **V. Reliability** | QC Test Center | Continuous verification of system health (99% target). |

## 4. Engineering Standards (Developer Handbook)
- **TDD-First**: No major logic should be deployed without a corresponding `src/tests` file.
- **Module Separation**: Never import a feature-specific component (e.g., `ProjectLedger`) into an unrelated feature. Use the `core/services` layer for shared data access.
- **Professional Styling**: Always use the **ENGLABS Brand Token System** (Glassmorphism, Vibrant Gradients, 900+ Font-weight headings).
- **Governance First**: All new features must be represented in the **System Blueprint** before they are pushed to production.

## 6. The Autonomous Release Cycle (Antigravity Orchestrator)
To ensure 100% reliability and zero-regression deployment, all system updates must follow the **Autonomous Verified Release** protocol:

1.  **Pre-Command Audit**: The orchestrator triggers all project test suites (Vitest, Playwright).
2.  **Verification Guard**: If any test fails, the command is blocked, and the system enters "Lockdown Mode" for manual audit.
3.  **Command Execution**: The core logic is implemented/executed only after a successful pre-audit.
4.  **Post-Command Audit**: The orchestrator verifies the change and checks for regressions.
5.  **Automated GitHub Release**: On SUCCESS, the system automatically commits to the `main` branch and pushes the verified update with a professional task-linked log.

### 🛸 Usage
```powershell
npm run release:autonomous -- "Refining Module X" "npx some-command"
```

---
*Verified by Antigravity OS v1.2.0 • 2026-03-22*
