import React, { useMemo, useState } from 'react';

export type ObligationNodeState = 'verified' | 'assumed' | 'invalidated' | 'proving';

export interface ProofObligationNode {
  id: string;
  label: string;
  subsystem?: string;
  state: ObligationNodeState;
}

export interface ProofObligationEdge {
  from: string;
  to: string;
}

export interface IxProofDagProps {
  nodes: ProofObligationNode[];
  edges: ProofObligationEdge[];
  width?: number;
  layerHeight?: number;
  nodeWidth?: number;
  selectedNodeId?: string | null;
  onSelectNode?: (node: ProofObligationNode, affectedCount: number) => void;
}

const NODE_HEIGHT = 34;

export const IxProofDag: React.FC<IxProofDagProps> = ({
  nodes,
  edges,
  width = 760,
  layerHeight = 74,
  nodeWidth = 150,
  selectedNodeId = null,
  onSelectNode,
}) => {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedNodeId ?? internalSelected;

  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  const validEdges = useMemo(
    () => edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to)),
    [edges, nodeIds],
  );

  const { layers, layout } = useMemo(() => {
    const inDeg = new Map<string, number>();
    const adj = new Map<string, string[]>();
    for (const n of nodes) {
      inDeg.set(n.id, 0);
      adj.set(n.id, []);
    }
    for (const e of validEdges) {
      adj.get(e.from)!.push(e.to);
      inDeg.set(e.to, (inDeg.get(e.to) ?? 0) + 1);
    }
    // longest-path layering (Kahn); cycle members keep their last computed layer
    const layerOf = new Map<string, number>();
    const queue = nodes.filter((n) => inDeg.get(n.id) === 0).map((n) => n.id);
    const pendingDeg = new Map(inDeg);
    while (queue.length > 0) {
      const id = queue.shift()!;
      const layer = layerOf.get(id) ?? 0;
      for (const next of adj.get(id)!) {
        layerOf.set(next, Math.max(layerOf.get(next) ?? 0, layer + 1));
        const d = (pendingDeg.get(next) ?? 1) - 1;
        pendingDeg.set(next, d);
        if (d === 0) queue.push(next);
      }
    }
    let fallback = 0;
    for (const n of nodes) if (!layerOf.has(n.id)) layerOf.set(n.id, fallback++);

    const byLayer = new Map<number, string[]>();
    for (const n of nodes) {
      const layer = layerOf.get(n.id) ?? 0;
      const bucket = byLayer.get(layer) ?? [];
      bucket.push(n.id);
      byLayer.set(layer, bucket);
    }
    const sortedLayers = [...byLayer.keys()].sort((a, b) => a - b);
    const position = new Map<string, { x: number; y: number }>();
    sortedLayers.forEach((layer, layerIdx) => {
      const bucket = byLayer.get(layer)!;
      const step = width / (bucket.length + 1);
      bucket.forEach((id, colIdx) => {
        position.set(id, { x: step * (colIdx + 1) - nodeWidth / 2, y: layerIdx * layerHeight });
      });
    });
    return {
      layers: sortedLayers,
      layout: { position, maxLayer: sortedLayers.length - 1 },
    };
  }, [nodes, validEdges, width, layerHeight, nodeWidth]);

  const descendantsOf = (rootId: string): Set<string> => {
    const adj = new Map<string, string[]>();
    for (const e of validEdges) {
      const bucket = adj.get(e.from) ?? [];
      bucket.push(e.to);
      adj.set(e.from, bucket);
    }
    const seen = new Set<string>();
    const stack = [rootId];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      for (const next of adj.get(cur) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    return seen;
  };

  const descendants = useMemo(
    () => (selected ? descendantsOf(selected) : new Set<string>()),
    [selected, validEdges],
  );

  const height = (layout.maxLayer + 1) * layerHeight + NODE_HEIGHT;

  return (
    <div className="ix-proof-dag">
      <div className="ix-dag-toolbar">
        <span data-testid="dag-summary">
          {nodes.length} obligations · {validEdges.length} edges
          {selected && ` · ${descendants.size} downstream affected`}
        </span>
        <span className="ix-dag-legend">
          <span data-state="verified" /> verified
          <span data-state="assumed" /> assumed
          <span data-state="invalidated" /> invalidated
          <span data-state="proving" /> proving
        </span>
      </div>
      <div className="ix-dag-canvas-wrap">
        <svg
          data-testid="dag-svg"
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="graphics-object"
          aria-label="Proof obligation dependency graph"
        >
          {validEdges.map((edge, i) => {
            const from = layout.position.get(edge.from);
            const to = layout.position.get(edge.to);
            if (!from || !to) return null;
            const x1 = from.x + nodeWidth / 2;
            const y1 = from.y + NODE_HEIGHT;
            const x2 = to.x + nodeWidth / 2;
            const y2 = to.y;
            const mid = (y1 + y2) / 2;
            const inImpact = selected === edge.from || (descendants.has(edge.from) && descendants.has(edge.to));
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}
                className="ix-dag-edge"
                data-impact={inImpact}
                data-source={edge.from}
                data-target={edge.to}
              />
            );
          })}
          {nodes.map((node) => {
            const pos = layout.position.get(node.id);
            if (!pos) return null;
            const isSelected = selected === node.id;
            const isAffected = descendants.has(node.id);
            return (
              <g
                key={node.id}
                data-testid={`dag-node-${node.id}`}
                data-state={node.state}
                data-selected={isSelected}
                data-affected={isAffected}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="ix-dag-node"
                onClick={() => {
                  setInternalSelected(node.id);
                  onSelectNode?.(node, descendantsOf(node.id).size);
                }}
              >
                <rect width={nodeWidth} height={NODE_HEIGHT} rx={3} />
                <text x={10} y={15} className="ix-dag-node-label">
                  {node.label}
                </text>
                {node.subsystem && (
                  <text x={10} y={27} className="ix-dag-node-sub">
                    {node.subsystem}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
