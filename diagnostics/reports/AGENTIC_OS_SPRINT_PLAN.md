# 📅 48-Hour Agentic OS Sprint Plan (Feb 15-16)

## 🎯 Primary Objective
Transition from "Manual Operation" to "Autonomous Coordination" by deploying the **Clawdbot Army v2.0** across the `develop` branch ecosystem.

---

## 🛠️ DAY 1: Perception, Memory & Foundation
**Focus**: Establishing the sensory inputs and persistence layer for the Agentic OS.

### 🏛️ Task 1.1: System Diagnostics & Health (Clawd-Architect)
- **Goal**: Implement the "System Diagnostics" button in `CommandCenter.tsx`.
- **Action**: Create `lib/diagnostics.ts` to perform connectivity checks for Firestore, Auth, and the Sync Bridge.
- **Success**: Diagnostics modal shows 🟢 Green for all core services.

### 🛡️ Task 1.2: Neural History Persistence (Clawd-Shield)
- **Goal**: Prevent loss of "Intelligence" on page refresh.
- **Action**: Create `lib/agenticHistory.ts`. Listen to `eventBus` and batch-write events to a new `agentic_history` collection in Firestore.
- **Success**: Event Stream repopulates from Firestore on mount.

### 💂‍♂️ Task 1.3: Mobile Task Dispatch (Clawd-Dispatcher)
- **Goal**: Human-actionable tasks must reach the mobile staff.
- **Action**: Update `taskDispatcher.ts` to push `TASK_CREATED` events to the `shops/{SHOP_ID}/tasks` collection.
- **Success**: A "Critical Queue" alert in the Web Command Center appears as a Task in the Mobile Staff App.

---

## 🚀 DAY 2: Intelligence, Vision & Feature Add
**Focus**: Deploying the "Autonomous Stock-Out Prevention" feature.

### 🧠 Task 2.1: Strategic Market Logic (Clawd-Strategist)
- **Goal**: Connect real sales velocity to the Strategist.
- **Action**: Implement `calculateSalesVelocity()` in `lib/intelligence.ts`. Strategist uses this (plus mock weather) to trigger `STRATEGIST_STOCK_PREDICTION`.
- **Success**: "Predicted Stock-Out" alerts generated in Event Stream.

### 💂‍♂️ Task 2.2: Visual Shelf Recogniton (Clawd-Guardian)
- **Goal**: Agentic "Eyes" to verify physical state.
- **Action**: Enhance `VisualCortex.tsx` with a mock "Computer Vision Overlay" that simulates object detection (Milk, Coke, Bread) and reports counts back to the `eventBus`.
- **Success**: Visual logs in the command stream showing "Item Detected: Milk (Count: 2)".

### 📊 Task 2.3: Agent Performance Index (Lead Agent / Antigravity)
- **Goal**: High-fidelity dashboard for agent efficacy.
- **Action**: Add a "Unit Efficiency" card to the `OperationalIntelligence` grid showing XP totals and Task completion rates per agent.
- **Success**: Visualization of which "Unit" is performing the most critical actions.

---

## 💡 Comprehensive Feature Add: "Self-Healing Inventory Bridge"
**The Problem**: Staff often forget to update stock when a delivery arrives, leading to customer disappointments on the mobile app.
**The Agentic Solution**: 
1. `Clawd-Guardian` (Visual) "sees" a delivery through the Vision camera.
2. `Clawd-Strategist` cross-references this with pending "Procurement" orders.
3. `Clawd-Dispatcher` creates a "Verify Delivery" task.
4. If approved, `Clawd-Bridge` automatically updates the stock across all platforms.
