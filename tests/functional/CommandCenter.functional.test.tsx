
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CommandCenter } from '../../pages/CommandCenter';
import { eventBus } from '../../lib/eventBus';

// Mock Visual Cortex (Edge ML Component)
vi.mock('../../components/agents/VisualCortex', () => ({
    VisualCortex: ({ isActive }: { isActive: boolean }) => (
        <div data-testid="visual-cortex-mock">
            {isActive ? "Visual Cortex: ACTIVE" : "Visual Cortex: INACTIVE"}
        </div>
    ),
}));

// Mock Voice Command (Web Speech API)
vi.mock('../../components/agents/VoiceCommand', () => ({
    VoiceCommand: ({ isActive }: { isActive: boolean }) => (
        <div data-testid="voice-command-mock">
            {isActive ? "Voice Command: LISTENING" : "Voice Command: INACTIVE"}
        </div>
    ),
}));

// Mock Strategist Agent (Logic Layer)
vi.mock('../../lib/strategistAgent', () => ({
    strategistAgent: {
        start: vi.fn(),
        stop: vi.fn()
    }
}));

// Mock History Service
vi.mock('../../lib/agenticHistory', () => ({
    agenticHistoryService: {
        getRecentHistory: vi.fn().mockResolvedValue([])
    }
}));

// Mock Voice Broadcast
vi.mock('../../lib/voiceBroadcast', () => ({
    voiceBroadcastService: {
        setMute: vi.fn()
    }
}));

// Mock Audit Service
vi.mock('../../lib/agenticAuditService', () => ({
    agenticAuditService: {
        efficiency$: {
            subscribe: (cb: any) => {
                cb(98.4);
                return { unsubscribe: vi.fn() };
            }
        },
        getCurrentEfficiency: vi.fn().mockReturnValue(98.4)
    }
}));

// Mock Firestore
vi.mock('../../lib/firestore', () => ({
    subscribeToTransactions: vi.fn().mockReturnValue(vi.fn()),
    subscribeToAttendance: vi.fn().mockReturnValue(vi.fn()),
    subscribeToStaff: vi.fn().mockImplementation((id, cb) => {
        cb([]);
        return vi.fn();
    })
}));

// Mock New Components
vi.mock('../../components/agents/CCTVStream', () => ({
    CCTVStream: () => <div data-testid="cctv-mock">CCTV Feed</div>
}));

vi.mock('../../components/StrategistAdvice', () => ({
    StrategistAdvice: () => <div data-testid="advice-mock">AI Advice</div>
}));


describe('Command Center Functional Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the dashboard layout', () => {
        render(<CommandCenter />);
        expect(screen.getByText(/Command Center/i)).toBeInTheDocument();
        expect(screen.getByText(/Neural Event Stream/i)).toBeInTheDocument();
    });

    it('should toggle all agents when "Deploy All" is clicked', async () => {
        render(<CommandCenter />);

        // Initial State: Inactive & Locked
        expect(screen.getByText("Voice Command: INACTIVE")).toBeInTheDocument();
        expect(screen.getByText(/BIOMETRIC LOCK ACTIVE/i)).toBeInTheDocument();

        // 1. Verify Identity first (required for Deploy button)
        await vi.waitUntil(() => {
            eventBus.emit({
                type: 'IDENTITY_VERIFIED',
                payload: { name: 'Test User', role: 'Owner', confidence: 0.99 }
            });
            return true;
        });

        // Check Lock state
        expect(await screen.findByText(/VERIFIED: Test User/i)).toBeInTheDocument();

        // 2. Click Deploy
        fireEvent.click(screen.getByText("Deploy All Agents"));

        // Check UI Update
        expect(screen.getByText("Voice Command: LISTENING")).toBeInTheDocument();
        expect(screen.getByText("Shutdown All Agents")).toBeInTheDocument();
    });

    it('should display live events in the Neural Stream', async () => {
        render(<CommandCenter />);

        // Verify Empty State
        expect(screen.getByText(/Waiting for agent input/i)).toBeInTheDocument();

        // Emit an Event
        await vi.waitUntil(() => {
            eventBus.emit({
                type: 'VISION_PERSON_DETECTED',
                payload: { count: 3, confidence: 0.95, timestamp: Date.now() }
            });
            return true;
        });

        // Verify Log Update
        expect(await screen.findByText(/VISION_PERSON_DETECTED/)).toBeInTheDocument();
        expect(screen.getByText(/Detected 3 persons/i)).toBeInTheDocument();
    });

    it('should render dynamic tasks correctly', async () => {
        render(<CommandCenter />);

        // Emit Task Event
        await vi.waitUntil(() => {
            eventBus.emit({
                type: 'TASK_CREATED',
                payload: { title: 'Restock Cola', priority: 'HIGH', xp: 500 }
            });
            return true;
        });

        // Verify Task Card
        expect(await screen.findByText("Restock Cola")).toBeInTheDocument();
        expect(screen.getByText("HIGH PRIORITY")).toBeInTheDocument();
        expect(screen.getByText("+500 XP")).toBeInTheDocument();
    });
});
