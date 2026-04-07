import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemDiagnostics } from '../../components/SystemDiagnostics';
import React from 'react';

// Mocking the health sensors
describe('4.1 SystemDiagnostics Component (Health Monitor)', () => {
  it('should display "HEALTHY" status when firestore is reachable', () => {
    render(<SystemDiagnostics isFirestoreOnline={true} latency={45} />);
    const status = screen.getByTestId('firestore-pulse');
    expect(status.textContent).toContain('HEALTHY');
  });

  it('should display "SYNC WARNING" when server time drift exceeds 5 seconds', () => {
    // Simulating 10 second drift
    render(<SystemDiagnostics isFirestoreOnline={true} timeDrift={10} />);
    const warning = screen.getByText(/SYNC WARNING/i);
    expect(warning).toBeDefined();
  });

  it('should report correct battery levels for mobile warehouse devices', () => {
    render(<SystemDiagnostics batteryLevel={0.15} />);
    const warning = screen.getByText(/LOW POWER/i);
    expect(warning).toBeDefined();
  });
});
