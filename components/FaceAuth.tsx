
import React, { useRef, useEffect, useState } from 'react';
// import * as faceapi from 'face-api.js';
const faceapi: any = null; // Temporary stub
import { Camera, X, Check, RefreshCw, AlertTriangle } from 'lucide-react';

interface FaceAuthProps {
    mode: 'enroll' | 'authenticate';
    staffDescriptors?: { staffId: string; descriptor: number[] }[]; // For authentication
    onEnroll?: (descriptor: number[]) => void;
    onAuthenticate?: (staffId: string) => void;
    onClose: () => void;
}

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export const FaceAuth: React.FC<FaceAuthProps> = ({ mode, staffDescriptors = [], onEnroll, onAuthenticate, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [modelError, setModelError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('Initializing Models...');
    const [bestMatch, setBestMatch] = useState<{ label: string; distance: number } | null>(null);
    const [livenessStep, setLivenessStep] = useState<'DETECT' | 'BLINK' | 'AUTH'>('DETECT');
    const [blinkHistory, setBlinkHistory] = useState<number[]>([]);

    // 1. Load Models
    useEffect(() => {
        const loadModels = async () => {
            try {
                setStatus('Loading Face Detection Models...');
                // Attempt to load from CDN (Primary)
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
                ]);
                setStatus('Starting Camera...');
                setIsLoading(false);
            } catch (err: any) {
                console.error("Model Load Error:", err);
                const isCORS = err.message?.includes('fetch') || err.message?.includes('origin');
                setModelError(isCORS ? "Network Security Block (CORS). Host models locally." : `Failed to load AI Models: ${err.message || 'Check connection'}`);
                setIsLoading(false);
            }
        };
        loadModels();
    }, []);

    // 2. Start Camera
    useEffect(() => {
        if (isLoading || modelError) return;

        const startVideo = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera Error:", err);
                setModelError("Camera Access Denied");
            }
        };
        startVideo();

        return () => {
            // Cleanup stream
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [isLoading, modelError]);

    // Helper: Calculate Eye Aspect Ratio - REMOVED (Moved to Worker)

    // 3. Worker Integration (Phase 5)
    useEffect(() => {
        // Initialize Worker
        let worker: Worker;
        try {
            worker = new Worker(new URL('./workers/liveness.worker.ts', import.meta.url), { type: 'module' });
        } catch (e) {
            console.warn("Worker Init Failed (likely test env):", e);
            return;
        }

        worker.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'LIVENESS_UPDATE') {
                setStatus(payload.msg);
                if (payload.step) setLivenessStep(payload.step);
            } else if (type === 'FRAME_RESULT') {
                // Optional: Update debug UI with EAR: payload.ear
                if (payload.validation === 'BLINK_SUCCESS') {
                    // Trigger Auth check next frame
                }
            } else if (type === 'STATUS_UPDATE') {
                // handle reset ack
            }
        };

        // 3.1 Detection Loop
        let isCancelled = false;

        const detectFrame = async () => {
            if (isCancelled) return;

            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended && canvasRef.current) {
                const startTime = performance.now();

                // Detect
                const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    // ... (drawing and logic remains same)
                    // Draw box
                    const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true);
                    const resized = faceapi.resizeResults(detection, dims);
                    faceapi.draw.drawDetections(canvasRef.current, resized);

                    const landmarks = resized.landmarks;
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();

                    // OFFLOAD: Send Geometry to Worker
                    if (mode === 'authenticate' && livenessStep !== 'AUTH') {
                        worker?.postMessage({
                            type: 'PROCESS_FRAME',
                            payload: { leftEye, rightEye }
                        });
                    } else if (livenessStep === 'AUTH') {
                        // Match logic
                        if (staffDescriptors.length === 0) {
                            setStatus("No Staff Enrolled yet.");
                        } else {
                            const labeledDescriptors = staffDescriptors.map(s =>
                                new faceapi.LabeledFaceDescriptors(s.staffId, [new Float32Array(s.descriptor)])
                            );

                            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45);
                            const match = faceMatcher.findBestMatch(detection.descriptor);

                            if (match.label !== 'unknown') {
                                setBestMatch(match);
                                setStatus(`Recognized: ${match.label}`);
                                onAuthenticate?.(match.label);
                                // Stop loop
                                return;
                            } else {
                                setStatus("Unknown Face");
                            }
                        }
                    } else if (mode === 'enroll') {
                        if (detection.detection.score > 0.9) {
                            setStatus("Face Captured! Saving...");
                            onEnroll?.(Array.from(detection.descriptor));
                            return;
                        } else {
                            setStatus("Hold still... (Confidence low)");
                        }
                    }

                } else {
                    if (canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                    setStatus("Looking for face...");
                    worker?.postMessage({ type: 'RESET' });
                    setLivenessStep('DETECT');
                }

                // Adaptive Frame Rate: Aim for 100ms total time, but don't crash validity
                const duration = performance.now() - startTime;
                const nextDelay = Math.max(10, 100 - duration);
                setTimeout(detectFrame, nextDelay);
            } else {
                // If video not ready, check again soon
                setTimeout(detectFrame, 500);
            }
        };

        detectFrame();

        return () => {
            isCancelled = true;
            worker?.terminate();
        };

    }, [mode, staffDescriptors, isLoading, livenessStep]); // Removed blinkHistory dependency as it is now in worker

    return (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
            <div className="bg-surface-elevated rounded-2xl overflow-hidden border border-surface-highlight max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-white/20">
                    <X className="w-5 h-5" />
                </button>

                <div className="relative aspect-[4/3] bg-black">
                    {modelError ? (
                        <div className="flex flex-col items-center justify-center h-full text-rose-400 gap-4">
                            <AlertTriangle className="w-12 h-12" />
                            <p>{modelError}</p>
                        </div>
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                onPlay={() => { }}
                                className="w-full h-full object-cover"
                            />
                            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                            {/* Overlay UI */}
                            <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded-lg pointer-events-none opacity-50 flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-dashed border-white/30 rounded-full" />
                            </div>

                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                                    <div className="flex flex-col items-center gap-2">
                                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                        <p className="text-white text-sm font-bold animate-pulse">{status}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-6 text-center space-y-2">
                    <h3 className="text-lg font-black uppercase text-ink-base">
                        {mode === 'enroll' ? 'Register Face ID' : 'Face Verification'}
                    </h3>
                    <p className={`text-sm font-bold uppercase tracking-wide ${bestMatch ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {status}
                    </p>
                </div>
            </div>
        </div>
    );
};
