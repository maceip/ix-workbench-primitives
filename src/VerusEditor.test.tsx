import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxVerusEditor, type VerusEditorLine } from './VerusEditor';

const lines: VerusEditorLine[] = [
  { text: 'spec fn page_frame_valid(pf: u64) -> bool {' },
  { text: '    (pf & FLAG_RWX) != FLAG_RWX', mode: 'spec' },
  { text: '}', mode: 'spec' },
  { text: 'proof fn lemma_no_rwx() {' },
  { text: '    assert(page_frame_valid(0x3) == false);', mode: 'proof', obligation: { state: 'verified', message: 'assert discharged' } },
  { text: '}', mode: 'proof' },
  { text: 'pub exec fn map_page_frame(vaddr: vaddr_t, pf: u64) -> Result<()> {' },
  { text: '    requires(page_frame_valid(pf));', mode: 'spec' },
  { text: '    pt.set(vaddr, Pte { flags: pf, .. });' },
  { text: '    ensures(!pt.lookup(vaddr).executable() || !pt.lookup(vaddr).writable());', mode: 'spec', obligation: { state: 'failed', message: 'postcondition violated at vmem.rs:147 (W^X breach)', rlimitTicks: 20, counterexample: [
    { symbol: 'pte.flags', sort: '(_ BitVec 64)', pre: '0x3', post: '0x7' },
    { symbol: 'vaddr', pre: '0x00200000', post: '0x00200000' },
  ] } },
  { text: '}', mode: 'proof', obligation: { state: 'admit', message: 'admit() — ghost lemma pending' } },
];

describe('IxVerusEditor', () => {
  it('renders exec/proof/spec mode lanes and obligation glyphs', () => {
    render(<IxVerusEditor fileName="vmem.rs" lines={lines} />);
    expect(screen.getByTestId('verus-file').textContent).toBe('vmem.rs');
    expect(document.querySelectorAll('.ix-verus-line').length).toBe(lines.length);
    expect(document.querySelector('.ix-verus-code[data-mode="spec"]')).toBeTruthy();
    expect(document.querySelector('.ix-verus-code[data-mode="proof"]')).toBeTruthy();
    expect(screen.getByTestId('obligation-5')).toBeTruthy();
    expect(screen.getByTestId('obligation-10')).toBeTruthy();
  });

  it('tallies obligation states in the toolbar', () => {
    render(<IxVerusEditor fileName="vmem.rs" lines={lines} />);
    const stats = screen.getByTestId('verus-stats');
    expect(stats.textContent).toContain('✓ 1');
    expect(stats.textContent).toContain('✗ 1');
    expect(stats.textContent).toContain('! 1');
  });

  it('expands an inline Z3 counterexample inlay on gutter click', () => {
    render(<IxVerusEditor fileName="vmem.rs" lines={lines} />);
    fireEvent.click(screen.getByTestId('obligation-10'));
    const inlay = screen.getByTestId('inlay-10');
    expect(inlay.textContent).toContain('postcondition violated at vmem.rs:147');
    expect(inlay.textContent).toContain('rlimit 20k');
    expect(inlay.textContent).toContain('pte.flags');
    expect(inlay.textContent).toContain('(_ BitVec 64)');
    expect(inlay.textContent).toContain('0x7');
    // collapsed again on second click
    fireEvent.click(screen.getByTestId('obligation-10'));
    expect(screen.queryByTestId('inlay-10')).toBeNull();
  });

  it('reports selection of lines without obligations', () => {
    let selected: number | null = null;
    render(<IxVerusEditor fileName="vmem.rs" lines={lines} onSelectLine={(i) => { selected = i; }} />);
    fireEvent.click(screen.getByText(/pub exec fn map_page_frame/));
    expect(selected).toBe(6);
  });
});
