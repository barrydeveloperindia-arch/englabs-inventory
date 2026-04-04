
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SOTAVision } from '../../components/agents/SOTAVision';

// Mock ONNX Runtime
vi.mock('onnxruntime-web', () => ({
    InferenceSession: {
        create: vi.fn().mockResolvedValue({
            inputNames: ['images'],
            outputNames: ['output0'],
            run: vi.fn().mockResolvedValue({
                output0: { data: new Float32Array(8400 * 12).fill(0) }
            })
        })
    },
    Tensor: vi.fn().mockImplementation((type, data, dims) => ({ type, data, dims })),
    env: { wasm: { wasmPaths: '' } }
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
    Camera: () => <div data-testid="icon-camera" />,
    Eye: () => <div data-testid="icon-eye" />,
    Zap: () => <div data-testid="icon-zap" />,
    ShieldAlert: () => <div data-testid="icon-shield" />,
    Activity: () => <div data-testid="icon-activity" />,
    Settings2: () => <div data-testid="icon-settings" />,
    Scan: () => <div data-testid="icon-scan" />,
    Share2: () => <div data-testid="icon-share" />,
    Link: () => <div data-testid="icon-link" />,
    BarChart3: () => <div data-testid="icon-chart" />,
    Video: () => <div data-testid="icon-video" />,
    Maximize2: () => <div data-testid="icon-maximize" />
}));

describe('SOTAVision Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock requestAnimationFrame
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(cb, 0));

        // Mock Browser Globals
        class MediaStreamMock {
            getTracks() { return []; }
        }
        vi.stubGlobal('MediaStream', MediaStreamMock);

        // Mock HTMLVideoElement methods
        window.HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
        window.HTMLVideoElement.prototype.pause = vi.fn();
        window.HTMLVideoElement.prototype.load = vi.fn();

        // Mock mediaDevices
        Object.defineProperty(global.navigator, 'mediaDevices', {
            value: {
                getUserMedia: vi.fn().mockResolvedValue(new MediaStreamMock())
            },
            writable: true
        });
    });

    it('should show loading state and then sensor grid', async () => {
        render(<SOTAVision isActive={true} />);
        expect(screen.getAllByText(/VIGI C440/i)[0]).toBeInTheDocument();
    });

    it('should switch to ready state after ONNX init', async () => {
        render(<SOTAVision isActive={true} />);
        await waitFor(() => {
            expect(screen.getByText(/Neural Cortex SOTA/i)).toBeInTheDocument();
        });
    });

    it('should render the video and canvas elements', async () => {
        render(<SOTAVision isActive={true} />);
        await waitFor(() => {
            const video = document.querySelector('video');
            const canvas = document.querySelector('canvas');
            expect(video).toBeInTheDocument();
            expect(canvas).toBeInTheDocument();
        });
    });

    it('should display performance metrics', async () => {
        render(<SOTAVision isActive={true} />);
        await waitFor(() => {
            expect(screen.getByText(/FPS/i)).toBeInTheDocument();
            expect(screen.getByText(/Lat:/i)).toBeInTheDocument();
        });
    });

    it('should handle sensor switching', async () => {
        render(<SOTAVision isActive={true} />);

        await waitFor(() => {
            expect(screen.getByText(/VIGI Bridge/i)).toBeInTheDocument();
        });

        // Find a sensor element (Aisle 1)
        const sensorItem = screen.getByTestId('sensor-SENS_AISLE_01');
        fireEvent.click(sensorItem);

        // Check if active class updated
        expect(sensorItem).toHaveClass('bg-cyan-500/10');
    });

    it('should handle camera access rejection gracefully', async () => {
        (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(new Error("Permission Denied"));
        render(<SOTAVision isActive={true} />);

        await waitFor(() => {
            // Should still show the UI and not crash
            expect(screen.getAllByText(/VIGI C440/i)[0]).toBeInTheDocument();
        });
    });
});
