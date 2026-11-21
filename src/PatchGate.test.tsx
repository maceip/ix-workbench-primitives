import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  IxPatchGate,
  type DiffLine,
  type SandboxCheck,
} from './PatchGate';

const diffLines: DiffLine[] = [
  { kind: 'hunk', text: '@@ -410,7 +410,10 @@ static int tlv_parse(buf_t *b) {' },
  { kind: 'context', text: '    uint16_t tlv_type = buf_get16(b);', oldNo: 410, newNo: 410 },
  { kind: 'del', text: '    size_t tlv_len = buf_get16(b);', oldNo: 411 },
  { kind: 'add', text: '    size_t tlv_len = buf_get16(b);', newNo: 411 },
  { kind: 'add', text: '    if (tlv_len > b->remaining) return -EINVAL;', newNo: 412 },
  { kind: 'context', text: '    memcpy(out, b->cursor, tlv_len);', oldNo: 412, newNo: 413 },
];

const passingChecks: SandboxCheck[] = [
  { id: 'netzero', label: 'Network-zero sandbox', passed: true, detail: '0 sockets opened across 12 runs' },
  { id: 'regress', label: 'Regression matrix', passed: true, detail: '384/384 tests pass' },
  { id: 'poc', label: 'PoC crash elimination', passed: true, detail: 'NF-2025-0042 PoC exits 0/139 — no crash' },
];

const failingChecks: SandboxCheck[] = [
  ...passingChecks.slice(0, 2),
  { id: 'poc', label: 'PoC crash elimination', passed: false, detail: 'PoC still segfaults (exit=139) with patch applied' },
];

describe('IxPatchGate', () => {
  it('renders the unified diff with hunk/add/del lines and stats', () => {
    render(
      <IxPatchGate patchId="spar-patch-77" title="bounds-check tlv_len before memcpy" diffLines={diffLines} checks={passingChecks} />,
    );
    expect(screen.getByTestId('patch-title').textContent).toBe('bounds-check tlv_len before memcpy');
    expect(screen.getByTestId('patch-stats').textContent).toBe('+2 −1 · 3/3 checks');
    const rows = document.querySelectorAll('.ix-diff-line');
    expect(rows.length).toBe(6);
    expect(rows[0].getAttribute('data-kind')).toBe('hunk');
    expect(rows[2].getAttribute('data-kind')).toBe('del');
    expect(rows[3].getAttribute('data-kind')).toBe('add');
    expect(rows[4].getAttribute('data-kind')).toBe('add');
  });

  it('opens the gate and fires promotion only when all checks pass', () => {
    let promoted: string | null = null;
    render(
      <IxPatchGate
        patchId="spar-patch-77"
        title="bounds-check tlv_len"
        diffLines={diffLines}
        checks={passingChecks}
        onPromote={(id) => { promoted = id; }}
      />,
    );
    fireEvent.click(screen.getByTestId('promote-button'));
    expect(promoted).toBe('spar-patch-77');
    expect(screen.queryByTestId('gate-blocked')).toBeNull();
  });

  it('blocks promotion when any sandbox check fails', () => {
    let promoted: string | null = null;
    render(
      <IxPatchGate
        patchId="spar-patch-77"
        title="bounds-check tlv_len"
        diffLines={diffLines}
        checks={failingChecks}
        onPromote={(id) => { promoted = id; }}
      />,
    );
    const button = screen.getByTestId('promote-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(screen.getByTestId('check-poc').textContent).toBe('FAIL');
    fireEvent.click(button);
    expect(promoted).toBeNull();
    expect(screen.getByTestId('gate-blocked').textContent).toContain('PoC crash elimination');
  });
});
