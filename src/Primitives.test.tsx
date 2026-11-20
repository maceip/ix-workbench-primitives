import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxDigestBadge, IxHexWireViewer, IxCausalChain } from './Primitives';

describe('@maceip/ix-workbench-primitives', () => {
  it('middle-truncates digests in IxDigestBadge', () => {
    render(
      <IxDigestBadge
        prefix="verus-smt"
        digest="8f3a91c04b77d2e8190a4c6e3b1f09a2d4c8e91c"
        tone="critical"
      />
    );
    expect(screen.getByTestId('digest-text').textContent).toBe('8f3a91…e91c');
  });

  it('computes byte-level diffs in IxHexWireViewer', () => {
    const base = new Uint8Array([0x00, 0x03, 0x00, 0x00]);
    const mutated = new Uint8Array([0x00, 0x07, 0xde, 0xad]);
    render(<IxHexWireViewer label="PTE Frame" bytes={mutated} baselineBytes={base} />);
    expect(screen.getByTestId('mutated-count').textContent).toBe('Δ 3 mutated bytes');
  });

  it('renders causal steps and symbolic Z3 valuation deltas in IxCausalChain', () => {
    const steps = [
      {
        id: 's1',
        kind: 'counterexample' as const,
        tone: 'critical' as const,
        location: 'vmem.rs:147',
        expression: 'ensures(!rwx)',
        valuationDelta: { 'pte.flags': { pre: '0x3', post: '0x7' } },
      },
    ];
    let selected = '';
    render(<IxCausalChain steps={steps} onSelectStep={(s) => { selected = s.id; }} />);
    fireEvent.click(screen.getByText('ensures(!rwx)'));
    expect(selected).toBe('s1');
  });
});
