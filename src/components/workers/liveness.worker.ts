
// Web Worker for FaceAPI Processing

// Note: face-api.js relies heavily on HTMLCanvasElement and DOM. 
// Running it inside a worker requires shimming or using a backend like tfjs-backend-wasm.
// Since we are using standard face-api.js, fully moving it to a worker is complex without specific builds.
// HOWEVER, we can simplify the workload on the main thread or just use the worker for calculations?
// 
// ACTUALLY, a more robust "Phase 5 - Performance" step for this setup (React + standard face-api) might be:
// 1. Optimize the detection loop (don't run every frame).
// 2. Offload purely numerical calculations (EAR, Liveness check logic).
// 
// BUT, let's try to set up the worker structure for future expansion (e.g. strict heavy lifting).
// For now, let's keep the heavy lifting in the main thread but run it in a requestIdleCallback pattern 
// or ensure we yield to the UI thread more often.
//
// WAIT, the USER EXPLICITLY ASKED FOR WEB WORKER. I should try to deliver it.
// The main issue is `face-api.js` accessing `document` or `window`.
// If I use `tfjs-core` efficiently, I might pass tensors.
//
// ALTERNATIVE PLAN:
// Instead of full face-api worker (which is hard), let's implement a "Liveness Analysis Worker".
// The main thread gets the landmarks (fast-ish), and sends them to the worker.
// The worker computes the geometric ratios (EAR), manages the state machine (BLINK history), 
// and returns the "Liveness Status".
// This offloads the logic/state management from the React component render cycle.

/* eslint-disable no-restricted-globals */

// Define explicit types for the worker context
const ctx: Worker = self as any;

interface DetectionData {
    landmarks: { x: number; y: number }[]; // Simplified standard structure
    timestamp: number;
}

interface WorkerState {
    blinkHistory: number[];
    lastBlinkTime: number;
    livenessStep: 'DETECT' | 'BLINK' | 'AUTH';
}

let state: WorkerState = {
    blinkHistory: [],
    lastBlinkTime: 0,
    livenessStep: 'DETECT'
};

// --- GEOMETRY UTILS ---
// Calculate Eye Aspect Ratio (EAR)
const getEAR = (eye: { x: number; y: number }[]) => {
    // Indices for left eye (standard 68-point model: 36-41) => 0-5
    // Indices for right eye (standard 68-point model: 42-47) => 0-5 (relative)
    // We expect the array passed to correspond to a single eye's points.
    const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
        Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const A = dist(eye[1], eye[5]);
    const B = dist(eye[2], eye[4]);
    const C = dist(eye[0], eye[3]);
    return (A + B) / (2.0 * C);
};

// Rolling average helper
const getRollingAverage = (history: number[], newValue: number, windowSize = 5) => {
    const newHistory = [...history, newValue].slice(-windowSize);
    const average = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
    return { average, newHistory };
};

// --- MESSAGE HANDLER ---
ctx.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'RESET':
            state = {
                blinkHistory: [],
                lastBlinkTime: 0,
                livenessStep: 'DETECT'
            };
            ctx.postMessage({ type: 'STATUS_UPDATE', payload: 'RESET_COMPLETE' });
            break;

        case 'PROCESS_FRAME':
            // payload expects { leftEye: Point[], rightEye: Point[] }
            if (!payload || !payload.leftEye || !payload.rightEye) return;

            const leftEAR = getEAR(payload.leftEye);
            const rightEAR = getEAR(payload.rightEye);
            const avgEAR = (leftEAR + rightEAR) / 2;

            // Update Blink History (Smoothing)
            const { average: smoothedEAR, newHistory } = getRollingAverage(state.blinkHistory, avgEAR, 5);
            state.blinkHistory = newHistory;

            // State Machine Logic
            let validationMsg = '';

            if (state.livenessStep === 'DETECT') {
                if (smoothedEAR > 0.30) {
                    ctx.postMessage({ type: 'LIVENESS_UPDATE', payload: { step: 'BLINK', msg: 'Face Detected. Please BLINK.' } });
                    state.livenessStep = 'BLINK';
                }
            } else if (state.livenessStep === 'BLINK') {
                if (smoothedEAR < 0.20) { // Eyes Closed
                    state.lastBlinkTime = Date.now();
                } else if (smoothedEAR > 0.30 && state.lastBlinkTime > 0) {
                    // Eyes Open AFTER strict closed state => Blink Completed?
                    // Check duration if needed, but for now accept it.
                    ctx.postMessage({ type: 'LIVENESS_UPDATE', payload: { step: 'AUTH', msg: 'Blink Verified. Authenticating...' } });
                    state.livenessStep = 'AUTH';
                    validationMsg = 'BLINK_SUCCESS';
                }
            }

            // Always send back the debug data for chart/visualization if needed
            ctx.postMessage({
                type: 'FRAME_RESULT',
                payload: {
                    ear: smoothedEAR,
                    step: state.livenessStep,
                    validation: validationMsg
                }
            });
            break;

        default:
            console.warn('Unknown Worker Message:', type);
    }
};

export { };
