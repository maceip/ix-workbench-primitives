import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxFlamegraph, type FlamegraphSpan } from './Flamegraph';

const spans: FlamegraphSpan[] = [
  { id: 'assert_map', label: 'assert(map_page_frame)', parentId: null, instantiationCount: 40, solverMs: 900 },
  { id: 'qi_frame', label: 'trigger: FrameLookup(vaddr)', parentId: 'assert_map', instantiationCount: 6_500, solverMs: 8_100 },
  { id: 'qi_flags', label: 'trigger: PteFlags(pf)', parentId: 'qi_frame', instantiationCount: 6_100, solverMs: 7_400 },
  { id: 'qi_lemma', label: 'trigger: lemma_no_rwx', parentId: 'assert_map', instantiationCount: 900, solverMs: 1_200 },
  { id: 'assert_ipc', label: 'assert(port_map)', parentId: null, instantiationCount: 260, solverMs: 300 },
];

describe('IxFlamegraph', () => {
  it('sums subtree instantiation counts and solver time', () => {
    render(<IxFlamegraph rootLabel="vmem.rs::map_page_frame" spans={spans} />);
    // total = 40 + 6500 + 6100 + 900 + 260 = 13,800 ; solver = 17,900ms
    expect(screen.getByTestId('flame-summary').textContent).toContain('13,800 qi');
    expect(screen.getByTestId('flame-summary').textContent).toContain('17.90s solver');
  });

  it('nests child bars deeper than parents and shows self/total counts', () => {
    const { container } = render(
      <IxFlamegraph rootLabel="vmem.rs::map_page_frame" spans={spans} />,
    );
    const parent = screen.getByTestId('flame-span-assert_map');
    const child = screen.getByTestId('flame-span-qi_frame');
    const grandchild = screen.getByTestId('flame-span-qi_flags');
    expect(parent.getAttribute('data-depth')).toBe('0');
    expect(child.getAttribute('data-depth')).toBe('1');
    expect(grandchild.getAttribute('data-depth')).toBe('2');
    // qi_frame shows self 6,500 of subtree 12,600
    expect(screen.getByTestId('flame-count-qi_frame').textContent).toBe('6,500 / 12,600');
    // leaf shows self only (self == subtree)
    expect(screen.getByTestId('flame-count-qi_flags').textContent).toBe('6,100');
    // bars must be wider for bigger subtrees
    const width = (id: string) =>
      screen.getByTestId(`flame-span-${id}`).querySelector<HTMLElement>('.ix-flame-bar')!
        .style.width;
    expect(parseFloat(width('qi_frame'))).toBeGreaterThan(parseFloat(width('qi_lemma')));
    expect(container.querySelectorAll('.ix-flame-row').length).toBe(5);
  });

  it('flags quantifier hotspots above the share threshold', () => {
    render(<IxFlamegraph rootLabel="vmem.rs" spans={spans} hotspotThreshold={0.5} />);
    // qi_flags subtree = 6,100 / 13,800 ≈ 0.44 → not hotspot at 0.5
    const first = render(<IxFlamegraph rootLabel="vmem.rs" spans={spans} hotspotThreshold={0.5} />);
    expect(screen.getByTestId('flame-span-qi_flags').getAttribute('data-hotspot')).toBe('false');
    first.unmount();
    render(<IxFlamegraph rootLabel="vmem.rs" spans={spans} hotspotThreshold={0.4} />);
    expect(screen.getByTestId('flame-span-qi_flags').getAttribute('data-hotspot')).toBe('true');
    expect(screen.getByTestId('flame-span-assert_ipc').getAttribute('data-hotspot')).toBe('false');
  });

  it('reports selected span and its subtree count', () => {
    let picked: { id: string; subtree: number } | null = null;
    render(
      <IxFlamegraph
        rootLabel="vmem.rs"
        spans={spans}
        onSelectSpan={(span, subtree) => { picked = { id: span.id, subtree }; }}
      />,
    );
    fireEvent.click(screen.getByTestId('flame-span-qi_frame'));
    expect(picked).toEqual({ id: 'qi_frame', subtree: 12_600 });
  });
});
