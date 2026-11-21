import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxPacketGrid, type PacketGridRow } from './PacketGrid';

const columns = [
  { key: 'no', label: 'No.', width: 0.6, mono: true, align: 'right' as const },
  { key: 'src', label: 'Source', mono: true },
  { key: 'proto', label: 'Proto' },
  { key: 'info', label: 'Info', width: 3 },
];

function makeRows(n: number): PacketGridRow[] {
  return Array.from({ length: n }, (_, i) => ({
    no: i + 1,
    src: `10.0.0.${(i % 254) + 1}`,
    proto: 'TCP',
    info: i % 1000 === 0 ? 'RST → port 22 [SEVERITY: critical]' : `seq=${i} ack=${i + 1}`,
  }));
}

describe('IxPacketGrid', () => {
  it('virtualizes 100,000 rows to a bounded window', () => {
    const rows = makeRows(100_000);
    render(<IxPacketGrid columns={columns} rows={rows} viewportHeight={440} />);
    expect(screen.getByTestId('packet-count').textContent).toBe('100,000 packets');
    const rendered = document.querySelectorAll('[role="row"][aria-rowindex]');
    // 440px viewport ≈ 20 rows + 2*8 overscan = well under 60 rendered rows
    expect(rendered.length).toBeLessThan(60);
    expect(rendered.length).toBeGreaterThan(10);
    expect(screen.getByText('seq=1 ack=2')).toBeTruthy();
  });

  it('renders deep-slice rows only after scrolling', () => {
    const rows = makeRows(100_000);
    render(<IxPacketGrid columns={columns} rows={rows} viewportHeight={440} />);
    expect(screen.queryByText('seq=99997 ack=99998')).toBeNull();
    const viewport = screen.getByTestId('packet-grid-viewport');
    viewport.scrollTop = 99_990 * 22;
    fireEvent.scroll(viewport);
    expect(screen.getByText('seq=99997 ack=99998')).toBeTruthy();
    const rendered = document.querySelectorAll('[role="row"][aria-rowindex]');
    expect(rendered.length).toBeLessThan(60);
  });

  it('selects rows and marks severity tones', () => {
    const rows = makeRows(2000);
    let selectedIdx: number | null = null;
    const { container } = render(
      <IxPacketGrid
        columns={columns}
        rows={rows}
        viewportHeight={440}
        getRowTone={(row) => (String(row.info).includes('critical') ? 'critical' : undefined)}
        onSelectRow={(_, i) => { selectedIdx = i; }}
      />,
    );
    fireEvent.click(screen.getByText('RST → port 22 [SEVERITY: critical]'));
    expect(selectedIdx).toBe(0);
    const criticalRow = container.querySelector('[data-tone="critical"]');
    expect(criticalRow).toBeTruthy();
    expect(criticalRow?.getAttribute('aria-rowindex')).toBe('1');
  });

  it('shows the empty label when there are no rows', () => {
    render(<IxPacketGrid columns={columns} rows={[]} viewportHeight={200} />);
    expect(screen.getByText('No packets captured')).toBeTruthy();
  });

  it('uses unitLabel for the toolbar count', () => {
    render(<IxPacketGrid columns={columns} rows={makeRows(20)} viewportHeight={200} unitLabel="CVEs" />);
    expect(screen.getByTestId('packet-count').textContent).toBe('20 CVEs');
  });
});
