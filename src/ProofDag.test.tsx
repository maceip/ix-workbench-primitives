import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  IxProofDag,
  type ProofObligationNode,
  type ProofObligationEdge,
} from './ProofDag';

const nodes: ProofObligationNode[] = [
  { id: 'pmm_frame_valid', label: 'frame_valid', subsystem: 'PMM', state: 'verified' },
  { id: 'vmem_map', label: 'map_page_frame', subsystem: 'mm::vmem', state: 'invalidated' },
  { id: 'tlb_flush', label: 'flush_tlb', subsystem: 'hal::tlb', state: 'proving' },
  { id: 'ipc_port_map', label: 'port_map', subsystem: 'ipc::port', state: 'assumed' },
  { id: 'sched_ctx', label: 'ctx_switch', subsystem: 'sched', state: 'verified' },
];
const edges: ProofObligationEdge[] = [
  { from: 'pmm_frame_valid', to: 'vmem_map' },
  { from: 'vmem_map', to: 'tlb_flush' },
  { from: 'vmem_map', to: 'ipc_port_map' },
  { from: 'ipc_port_map', to: 'sched_ctx' },
];

describe('IxProofDag', () => {
  it('lays out nodes into layered SVG with edges', () => {
    render(<IxProofDag nodes={nodes} edges={edges} />);
    expect(screen.getByTestId('dag-summary').textContent).toBe('5 obligations · 4 edges');
    for (const n of nodes) {
      expect(screen.getByTestId(`dag-node-${n.id}`)).toBeTruthy();
    }
    const svg = screen.getByTestId('dag-svg');
    expect(svg.querySelectorAll('.ix-dag-edge').length).toBe(4);
    // pmm in layer 0, vmem layer 1, tlb/ipc layer 2, sched layer 3
    expect(svg.querySelectorAll('.ix-dag-node').length).toBe(5);
  });

  it('ignores edges referencing unknown nodes', () => {
    render(
      <IxProofDag
        nodes={nodes.slice(0, 2)}
        edges={[...edges, { from: 'ghost', to: 'pmm_frame_valid' }]}
      />,
    );
    expect(screen.getByTestId('dag-summary').textContent).toBe('2 obligations · 1 edges');
  });

  it('highlights all downstream dependents when a node is selected', () => {
    let affected = -1;
    const { container } = render(
      <IxProofDag nodes={nodes} edges={edges} onSelectNode={(_, count) => { affected = count; }} />,
    );
    fireEvent.click(screen.getByTestId('dag-node-pmm_frame_valid'));
    expect(affected).toBe(4); // vmem, tlb, ipc, sched all downstream
    expect(screen.getByTestId('dag-summary').textContent).toContain('4 downstream affected');
    expect(screen.getByTestId('dag-node-sched_ctx').getAttribute('data-affected')).toBe('true');
    const impactEdges = container.querySelectorAll('.ix-dag-edge[data-impact="true"]');
    expect(impactEdges.length).toBe(4);
    // leaf selection highlights nothing
    fireEvent.click(screen.getByTestId('dag-node-sched_ctx'));
    expect(screen.getByTestId('dag-summary').textContent).toContain('0 downstream affected');
  });

  it('colors nodes by verification state', () => {
    render(<IxProofDag nodes={nodes} edges={edges} />);
    expect(screen.getByTestId('dag-node-pmm_frame_valid').getAttribute('data-state')).toBe('verified');
    expect(screen.getByTestId('dag-node-vmem_map').getAttribute('data-state')).toBe('invalidated');
    expect(screen.getByTestId('dag-node-tlb_flush').getAttribute('data-state')).toBe('proving');
    expect(screen.getByTestId('dag-node-ipc_port_map').getAttribute('data-state')).toBe('assumed');
  });
});
