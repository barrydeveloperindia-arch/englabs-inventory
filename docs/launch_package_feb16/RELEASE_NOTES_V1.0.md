# ENGLABS INVENTORY Command OS: Release Notes v1.0
**Project Codename**: Antigravity | **Launch Date**: Monday, 16th February 2026

## Overview
We are thrilled to announce the official launch of the Command OS, a comprehensive operating system designed to transform ENGLABS INVENTORY operations. This release introduces enterprise-grade features for workforce management, inventory control, and financial compliance, all fortified by advanced security protocols.

## Key Features

### 🛡️ Security & Compliance
![Audit Trail Dashboard](images/03_audit_log.png)
*   **Audit Trail**: A tamper-proof log of every critical system action, now accessible via the "Compliance" tab. Tracks who did what, when, and where.
*   **Access Terminal**: Secure biometric (Face ID) and PIN-based login system with role-based dashboard access.
*   **RBAC (Role-Based Access Control)**: Granular permissions ensuring staff see only what they need (e.g., Cashiers cannot access Financial Reports).

### 👥 Workforce Management
*   **Smart Rota Planner**: Interactive drag-and-drop scheduling interface with availability tracking.
*   **Real-Time Attendance**: Automated clock-in/out tracking with lateness monitoring and overtime calculation.
*   **Leave Management**: Digital leave request workflow (Annual, Sick, Compassionate) with manager approval dashboard.

### 📦 Inventory & Operations
*   **Live Stock Tracking**: Real-time inventory visibility with low-stock alerts and expiry tracking.
*   **Digital Task Lists**: Daily Opening/Closing checks and Cleaning logs replaced with digital checklists for accountability.
*   **Shelf Edge Labels**: Instant PDF generation for shelf pricing labels directly from the inventory view.

### 📊 Financial Intelligence
*   **VAT Reporting**: Automated breakdown of sales by VAT band (0%, 5%, 20%).
*   **Sales Ledger**: Detailed transaction history with drill-down capabilities.
*   **Payroll Integration**: Automated salary calculation based on verified attendance hours.

## Technical Improvements
*   **Automated Testing Pipeline**: Daily system health checks running automatically via GitHub Actions.
*   **Performance Optimization**: 40% reduction in initial load time via code splitting.
*   **Offline Resilience**: Improved handling of network drops during mobile usage (Offline Banner).

## Known Issues (Day 1)
*   **Visual Tests**: Automated UI screenshot tests are currently disabled in CI but manual verification confirms stability.
*   **Mobile Menu**: Minor animation jank on older Android devices (fix scheduled for v1.1).

## Support
For issues on launch day, please contact the IT Support Lead or use the "Report Bug" button in the Help & Support module.
