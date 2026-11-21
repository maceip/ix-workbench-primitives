import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxAttestationLedger, type LedgerEntry } from './AttestationLedger';

const h = (n: number) =>
  `sha256-${String(n).padStart(64, '0')}`;

const entries: LedgerEntry[] = [
  { artifact: 'nanvix-kernel', prevHash: h(0), artifactHash: h(1), vexStatus: 'under_investigation', signedBy: 'ci@conduit-lab' },
  { artifact: 'nanvix-kernel', prevHash: h(1), artifactHash: h(2), vexStatus: 'affected', signedBy: 'redteam@nightfall' },
  { artifact: 'nanvix-kernel', prevHash: h(2), artifactHash: h(3), vexStatus: 'fixed', signedBy: 'ci@conduit-lab' },
  { artifact: 'nanvix-kernel', prevHash: h(3), artifactHash: h(4), vexStatus: 'not_affected', signedBy: 'vex@spar' },
];

describe('IxAttestationLedger', () => {
  it('renders the hash-chained entry strip with VEX status', () => {
    render(<IxAttestationLedger entries={entries} />);
    expect(document.querySelectorAll('.ix-ledger-entry').length).toBe(4);
    expect(screen.getByTestId('ledger-entry-1').textContent).toContain('affected');
    expect(screen.getByTestId('ledger-entry-2').textContent).toContain('fixed');
    expect(screen.getByText('genesis')).toBeTruthy();
    expect(screen.getAllByText('signed: ci@conduit-lab').length).toBe(2);
  });

  it('verifies a contiguous chain', () => {
    render(<IxAttestationLedger entries={entries} />);
    expect(screen.getByTestId('chain-state').textContent).toBe('HASH CHAIN VALID');
    expect(screen.getByTestId('chain-state').getAttribute('data-valid')).toBe('true');
  });

  it('detects broken prev_hash → artifact_hash linkage', () => {
    const broken = [...entries];
    broken[2] = { ...broken[2], prevHash: h(99) };
    render(<IxAttestationLedger entries={broken} />);
    const state = screen.getByTestId('chain-state');
    expect(state.textContent).toBe('HASH CHAIN BREAK at entry 2');
    expect(state.getAttribute('data-valid')).toBe('false');
    expect(screen.getByTestId('ledger-entry-2').getAttribute('data-chain-break')).toBe('true');
  });

  it('reports an empty ledger as invalid rather than valid', () => {
    render(<IxAttestationLedger entries={[]} />);
    expect(screen.getByTestId('chain-state').getAttribute('data-valid')).toBe('false');
  });
});
