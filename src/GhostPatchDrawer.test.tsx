import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxGhostPatchDrawer, type GhostDiffLine } from './GhostPatchDrawer';

const cleanLines: GhostDiffLine[] = [
  { kind: 'hunk', lane: 'proof', text: '@@ -64,6 +64,9 @@ proof fn lemma_tlb_coherent() {' },
  { kind: 'context', lane: 'proof', text: '    assert(pt.alignment_ok(addr));', oldNo: 64, newNo: 64 },
  { kind: 'add', lane: 'proof', text: '    assert(!pte.flags().executable() || !pte.flags().writable());', newNo: 65 },
  { kind: 'add', lane: 'spec', text: 'spec fn wx_exclusive(p: PteFlags) -> bool { !p.writable() || !p.executable() }', newNo: 67 },
  { kind: 'context', lane: 'proof', text: '}', oldNo: 69, newNo: 72 },
];

const dirtyLines: GhostDiffLine[] = [
  ...cleanLines,
  { kind: 'del', lane: 'exec', text: '    unsafe { core::ptr::write(vaddr as *mut u64, entry) };', oldNo: 141 },
  { kind: 'add', lane: 'exec', text: '    pt.set(vaddr, entry);', newNo: 141 },
];

describe('IxGhostPatchDrawer', () => {
  it('marks ghost-only patches as enforcement clean', () => {
    const { unmount } = render(<IxGhostPatchDrawer title="candidate-04: strengthen W^X lemma" lines={cleanLines} />);
    expect(screen.getByTestId('enforcement-badge').textContent).toBe('ENFORCEMENT CLEAN · exec untouched');
    expect((screen.getByTestId('accept-ghost') as HTMLButtonElement).disabled).toBe(false);
    unmount();
  });

  it('flags exec-lane mutations as enforcement violations and blocks acceptance', () => {
    let accepted = false;
    render(
      <IxGhostPatchDrawer
        title="candidate-05"
        lines={dirtyLines}
        onAccept={() => { accepted = true; }}
      />,
    );
    expect(screen.getByTestId('enforcement-badge').textContent).toContain('2 exec lines mutated');
    expect(document.querySelectorAll('[data-enforcement-violation="true"]').length).toBe(2);
    const button = screen.getByTestId('accept-ghost') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(accepted).toBe(false);
  });

  it('fires acceptance for clean candidates and close on demand', () => {
    let accepted = false;
    let closed = false;
    render(
      <IxGhostPatchDrawer
        title="candidate-04"
        lines={cleanLines}
        onAccept={() => { accepted = true; }}
        onClose={() => { closed = true; }}
      />,
    );
    fireEvent.click(screen.getByTestId('accept-ghost'));
    expect(accepted).toBe(true);
    fireEvent.click(screen.getByLabelText('Close drawer'));
    expect(closed).toBe(true);
  });
});
