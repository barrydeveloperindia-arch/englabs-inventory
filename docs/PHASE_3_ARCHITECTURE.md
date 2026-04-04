# Phase 3 Architecture: The Agentic Command OS
**Status:** Draft | **Target Launch:** Q3 2026 | **Focus:** AI, Automation & Hardware Integration

## 1. Executive Summary
Phase 3 transitions **ENGLABS INVENTORY Command OS** from a passive record-keeping system to an **active, agentic operating system**. The OS will no longer just *wait* for input; it will *observe* the store via cameras, *listen* to voice commands, *predict* inventory needs, and *dispatch* tasks to staff automatically.

## 2. System Architecture Diagram
The system moves to a **Hub-and-Spoke** model where the "Core OS" orchestrates specialized "Agents."

```mermaid
graph TD
    User[Staff / Manager] -->|Voice/Touch| Dashboard[Command OS Front-End]
    Camera[CCTV / Webcams] -->|RTSP Stream| VisualCortex[👁️ Visual Cortex Agent]
    Sensors[IoT / ESL Tags] -->|MQTT/Zigbee| HardwareHub[🔌 Hardware Bridge]
    
    subgraph "The Core (Brain)"
        Dashboard -->|Events| EventBus[Event Bus (RxJS)]
        VisualCortex -->|Detections| EventBus
        HardwareHub -->|Status| EventBus
        
        EventBus --> Strategist[🧠 Strategist Agent]
        EventBus --> Dispatcher[⚡ Task Dispatcher]
    end
    
    Strategist -->|Predictions| Database[(Firebase / Supabase)]
    Dispatcher -->|Notifications| StaffApp[📱 Staff Mobile App]
    Dispatcher -->|Price Updates| HardwareHub
```

---

## 3. Core Modules & Implementation Strategy

### A. 👁️ The Visual Cortex (Computer Vision & Loss Prevention)
**Goal:** Automate stock checking and security monitoring using existing cameras.

*   **Architecture:**
    *   **Edge Inference:** Run **TensorFlow.js** (Coco-SSD / MobileNet) directly on the local POS/iPad (or a dedicated Raspberry Pi "Edge Node") to process video frames locally. This protects privacy and saves bandwidth.
    *   **Detection events:**
        *   `SHELF_EMPTY_CONFIDENCE > 0.8` → Triggers "Restock Task".
        *   `QUEUE_LENGTH > 5` → Triggers "Open Till 2" Alert.
        *   `SUSPICIOUS_MOTION` (Pocketing item) → Flags timestamp in Audit Log.
*   **Tech Stack:** `TensorFlow.js`, `face-api.js` (already installed), `WebRTC`.

### B. 🧠 The Strategist Agent (Predictive Supply Chain)
**Goal:** Order stock *before* it runs out based on external factors.

*   **Architecture:**
    *   **Data Ingestion Pipeline:** A scheduled Cloud Function that aggregates:
        *   Last 30 days Sales Velocity.
        *   Local Weather Forecast (OpenWeatherMap API).
        *   Local Events (Ticketmaster/Google Events API).
    *   **Logic Engine:**
        *   *Formula:* `Predicted_Demand = (Avg_Daily_Sales * Seasonality_Factor) * Weather_Multiplier`.
    *   **Output:** automatically drafts Purchase Orders in the "Purchases" module for Manager approval.
*   **Tech Stack:** `Node.js` (Cloud Functions), `Recharts` (Visualization), `Simple-Statistics` (Lib).

### C. 🗣️ Command Voice (Hands-Free Operations)
**Goal:** Allow staff to work while carrying boxes or cleaning.

*   **Architecture:**
    *   **Wake Word:** "Hey Command" (detected locally).
    *   **Intent Recognition:**
        *   *Command:* "Mark 3 damaged milks."
        *   *NLP:* Regex or lightweight LLM (Gemini Nano) parses `{action: "waste", item: "milk", qty: 3}`.
    *   **Feedback:** Text-to-Speech confirmation ("Confirmed. 3 Milks moved to Waste.").
*   **Tech Stack:** `Web Speech API` (Native Browser), `Fuse.js` (Fuzzy matching item names).

### D. ⚡ Dynamic Task Dispatcher ("Uber for Staff")
**Goal:** optimize staff utilization during quiet periods.

*   **Architecture:**
    *   **State Machine:** Monitors Store State (Quiet/Busy).
    *   **Rule Engine:**
        *   *If* `Queue == 0` AND `Floor_Cleanliness_Timer > 4 hours`:
        *   *Then* Create Task: "Mop Aisle 1" (Priority: Medium).
    *   **Gamification:** Assigns XP/Points to the task. First staff member to claim it on the Mobile App gets the points.
*   **Tech Stack:** `Firebase Cloud Messaging (FCM)`, `RxJS` (Reactive Logic).

### E. 🌐 ESL Integration (Electronic Shelf Labels)
**Goal:** Dynamic pricing and instant inflation updates.

*   **Architecture:**
    *   **Hardware Bridge:** A local Node.js service running on the POS that talks to the ESL Gateway (e.g., Minew or SES-imagotag) via HTTP/MQTT.
    *   **Sync Logic:** When a price is changed in `AccessTerminal`, the `Hardware Bridge` pushes the new bitmap image to the physical tag immediately.
*   **Tech Stack:** `MQTT.js`, `Canvas API` (to draw tag images programmatically).

---

## 4. Implementation Roadmap

### Sprint 1: The Eyes (Visual Cortex MVP)
1.  Extend `AccessTerminal` to access background camera streams.
2.  Implement `TensorFlow.js` to detect "Person" count in queue.
3.  Display "Live Queue Count" on Dashboard.

### Sprint 2: The Voice (Voice Command MVP)
1.  Add Microphone permission handling to `useHardware`.
2.  Create `VoiceCommandOverlay` component.
3.  Implement basic commands: "Search for [Item]", "Open Register".

### Sprint 3: The Brain (Predictive Engine)
1.  Create `InventoryForecaster` utility.
2.  Integrate Weather API.
3.  Add "Recommended Order" column to Purchase Orders.

### Sprint 4: The Hardware (ESL & IoT)
1.  Mock an ESL Gateway integration.
2.  Generate "Digital Tag" previews in the Inventory screen.

## 5. Security & Privacy Considerations
*   **Local Processing:** All Computer Vision runs purely on-device (Edge). No video feeds are ever uploaded to the cloud.
*   **Voice Privacy:** Microphone only activates on "Wake Word" or button press.
*   **RBAC:** Only Managers can approve "Strategist" auto-orders.

---
**Prepared by:** Antigravity  
**Date:** February 16, 2026

## 6. Verification & Testing Strategy

To ensure reliability in the Agentic OS, a multi-layered testing strategy is employed:

### A. Unit Testing (`tests/unit/`)
*   **Focus:** Core Logic and Event Propagation.
*   **Key Tests:**
    *   `agentic_core.unit.test.ts`: Verifies the `EventBus` Pub/Sub mechanism and `TaskDispatcher` rule engine logic in isolation.
    *   **Tools:** `Vitest`, `vi.spyOn`, `RxJS`.

### B. Functional Testing (`tests/functional/`)
*   **Focus:** Component Rendering and User Interaction.
*   **Key Tests:**
    *   `CommandCenter.functional.test.tsx`: Verifies the dashboard UI, including the properties of `VisualCortex` (mocked) and `VoiceCommand` (mocked).
    *   **Tools:** `@testing-library/react`, `jsdom`.

### C. Smoke Testing (`tests/smoke/`)
*   **Focus:** End-to-End Integration (Happy Path).
*   **Key Tests:**
    *   `agentic_ecosystem.smoke.test.ts`: Simulates a full feedback loop:
        1.  `Vision Event` (Queue Alert) ->
        2.  `Event Bus` ->
        3.  `Task Dispatcher` ->
        4.  `Task Creation`.
    *   **Tools:** `Vitest`, Real Instance Injection.

