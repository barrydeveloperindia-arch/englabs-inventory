
# Agentic OS Testing Guide

## Overview
The Agentic OS introduces a new suite of AI-driven features (Visual Cortex, Voice Command, Strategist). Reliability is ensured through a multi-tiered testing strategy.

## 1. Unit Tests (`tests/unit/`)
Tests the logic of the "Brain" and "Nervous System" in isolation using Vitest.
*   **Target:** `lib/eventBus.ts`, `lib/taskDispatcher.ts`
*   **Run:** `npx vitest run tests/unit/agentic_core.unit.test.ts`

## 2. Functional Tests (`tests/functional/`)
Tests the React components and their interaction with the mocked AI services.
*   **Target:** `pages/CommandCenter.tsx`
*   **Run:** `npx vitest run tests/functional/CommandCenter.functional.test.tsx`

## 3. Smoke Tests (`tests/smoke/`)
Verifies the end-to-end flow of a "Queue Alert" triggering a "Task Creation".
*   **Target:** Integration Logic
*   **Run:** `npx vitest run tests/smoke/agentic_ecosystem.smoke.test.ts`

## Running All Agentic Tests
To run the full suite for Phase 3:

```bash
npx vitest run tests/unit/agentic_core.unit.test.ts tests/functional/CommandCenter.functional.test.tsx tests/smoke/agentic_ecosystem.smoke.test.ts
```
