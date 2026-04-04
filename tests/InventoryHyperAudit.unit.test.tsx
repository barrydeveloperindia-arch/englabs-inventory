import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InventoryHyperAudit } from '../components/InventoryHyperAudit';
import React from 'react';

describe('InventoryHyperAudit component', () => {
  it('renders the Hyper-Audit Ledger heading', () => {
    render(<InventoryHyperAudit />);
    expect(screen.getByText(/HYPER-AUDIT/i)).toBeInTheDocument();
    expect(screen.getByText(/LEDGER/i)).toBeInTheDocument();
  });

  it('renders correctly the Mock Logs', () => {
    render(<InventoryHyperAudit />);
    expect(screen.getByText(/Bharat Anand/i)).toBeInTheDocument();
    expect(screen.getByText(/Stock Added/i)).toBeInTheDocument();
    expect(screen.getByText(/Gaurav Panchal/i)).toBeInTheDocument();
  });

  it('contains the Digital Thread "traceability" label', () => {
    render(<InventoryHyperAudit />);
    expect(screen.getByText(/Blockchain-Verified Traceability/i)).toBeInTheDocument();
  });
});
