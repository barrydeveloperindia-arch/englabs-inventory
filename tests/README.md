
# 📱 Mobile Test Suite Architecture

This document outlines the testing strategy for the Command OS "Hop-In Express" mobile application. The suite is designed to ensure production-grade reliability across diverse devices and network conditions.

## 📂 Directory Structure

Tests are categorized by their scope and purpose to maintain clarity and separation of concerns.

### 1. **Unit Tests (`tests/unit/`)**
> **Focus**: Isolated component logic, utility functions, and responsive behaviors. No external dependencies (mocked).

- **`navigation.sidebar.mobile.test.tsx`**: Verifies the sidebar's responsive toggle logic independently of the full application shell.
- ... (Other unit tests)

### 2. **Smoke Tests (`tests/smoke/`)**
> **Focus**: Critical path health checks. Ensures the application can build, mount, and reach the initial screen without crashing.

- **`app.startup.mobile.test.tsx`**: Simulates a fresh app launch on a mobile viewport and checks for the splash screen -> unlock terminal transition.

### 3. **E2E / Integration Tests (`tests/e2e/`)**
> **Focus**: Full user workflows involving multiple screens, data persistence (mocked), and complex interactions.

- **`sales.workflow.mobile.test.tsx`**: The "Master Flow". Validates the end-to-end journey of a Cashier: Login -> Scan Item -> Add to Cart -> Checkout.
- **`network.resilience.mobile.test.tsx`**: Validates the application's behavior under adverse network conditions (Offline Banner, Sync Recovery).

### 4. **UI / Visual Tests (`tests/ui/`)**
> **Focus**: Layout integrity and visual correctness.

- **`mobile.layout.test.tsx`**: Checks for element visibility and positioning on specific breakpoints (iPhone SE vs iPhone 14 Pro).

---

## 🛠️ Shared Framework (`tests/framework/`)

To support robust testing, we utilize a custom framework:

- **`setupMobileTest.ts`**: Standardized environment configuration (Mocks Auth, Timers, Window props).
- **`MobileTestUtils.tsx`**: 
  - `resizeWindow(width, height)`: Simulates mobile viewports.
  - `emulateNetworkCondition(online)`: Simulates network connectivity events.
- **`FirestoreMock.ts`**: Intelligent Firestore mock that mimics real-world data structures and query paths.

## 🚀 Running Tests

Run the full mobile suite:
```bash
npx vitest run tests/e2e/sales.workflow.mobile.test.tsx tests/e2e/network.resilience.mobile.test.tsx tests/smoke/app.startup.mobile.test.tsx tests/unit/navigation.sidebar.mobile.test.tsx
```
