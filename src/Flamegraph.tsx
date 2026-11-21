import React, { useMemo, useState } from 'react';

export interface FlamegraphSpan {
  id: string;
  label: string;
  parentId?: string | null;
  instantiationCount: number;
  solverMs?: number;
}

export interface IxFlamegraphProps {
  rootLabel: string;
  spans: FlamegraphSpan[];
  /** Share of total instantiations above which a span is flagged as a qi hotspot (0–1) */
  hotspotThreshold?: number;
  onSelectSpan?: (span: FlamegraphSpan, subtreeCount: number) => void;
}

interface LaidOutSpan {
  span: FlamegraphSpan;
  depth: number;
  subtreeCount: number;
  share: number;
}

export const IxFlamegraph: React.FC<IxFlamegraphProps> = ({
  rootLabel,
  spans,
  hotspotThreshold = 0.25,
  onSelectSpan,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { rows, totalInstantiations, totalSolverMs } = useMemo(() => {
    const byId = new Map(spans.map((s) => [s.id, s]));
    const children = new Map<string | null, FlamegraphSpan[]>();
    for (const s of spans) {
      const key = s.parentId != null && byId.has(s.parentId) ? s.parentId : null;
      const bucket = children.get(key) ?? [];
      bucket.push(s);
      children.set(key, bucket);
    }

    const subtreeCountOf = (id: string): number => {
      const span = byId.get(id);
      let count = span?.instantiationCount ?? 0;
      for (const child of children.get(id) ?? []) {
        count += subtreeCountOf(child.id);
      }
      return count;
    };

    const total = (children.get(null) ?? []).reduce(
      (acc, s) => acc + subtreeCountOf(s.id),
      0,
    );

    const laidOut: LaidOutSpan[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const span of children.get(parentId) ?? []) {
        const subtreeCount = subtreeCountOf(span.id);
        laidOut.push({
          span,
          depth,
          subtreeCount,
          share: total > 0 ? subtreeCount / total : 0,
        });
        walk(span.id, depth + 1);
      }
    };
    walk(null, 0);

    const solverMs = spans.reduce((acc, s) => acc + (s.solverMs ?? 0), 0);
    return { rows: laidOut, totalInstantiations: total, totalSolverMs: solverMs };
  }, [spans]);

  return (
    <div className="ix-flamegraph">
      <div className="ix-flame-toolbar">
        <span data-testid="flame-summary">
          {rootLabel} · {totalInstantiations.toLocaleString('en-US')} qi ·{' '}
          {(totalSolverMs / 1000).toFixed(2)}s solver
        </span>
        <kbd className="ix-kbd">Z3 rlimit</kbd>
      </div>
      <div className="ix-flame-body ix-scroll-pane" role="list">
        {rows.map(({ span, depth, subtreeCount, share }) => {
          const isHotspot = share >= hotspotThreshold && span.instantiationCount > 0;
          const isSelected = selectedId === span.id;
          return (
            <div
              key={span.id}
              role="listitem"
              data-testid={`flame-span-${span.id}`}
              className="ix-flame-row"
              data-selected={isSelected}
              data-hotspot={isHotspot}
              data-depth={depth}
              onClick={() => {
                setSelectedId(span.id);
                onSelectSpan?.(span, subtreeCount);
              }}
            >
              <div
                className="ix-flame-bar"
                style={{
                  marginLeft: depth * 10,
                  width: `${Math.max(share * 100, 1.5)}%`,
                }}
              >
                <span className="ix-flame-label">{span.label}</span>
              </div>
              <span className="ix-flame-count" data-testid={`flame-count-${span.id}`}>
                {span.instantiationCount.toLocaleString('en-US')}
                {span.instantiationCount !== subtreeCount &&
                  ` / ${subtreeCount.toLocaleString('en-US')}`}
              </span>
              {span.solverMs !== undefined && (
                <span className="ix-flame-ms">{(span.solverMs / 1000).toFixed(2)}s</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
