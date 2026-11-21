import React, { useMemo } from 'react';
import type { DiffLine } from './PatchGate';

export type GhostLane = 'exec' | 'proof' | 'spec';

export interface GhostDiffLine extends DiffLine {
  /** Which Verus code lane this changed line belongs to */
  lane: GhostLane;
}

export interface IxGhostPatchDrawerProps {
  title: string;
  lines: GhostDiffLine[];
  onClose?: () => void;
  onAccept?: (violations: GhostDiffLine[]) => void;
}

export const IxGhostPatchDrawer: React.FC<IxGhostPatchDrawerProps> = ({
  title,
  lines,
  onClose,
  onAccept,
}) => {
  // Enforcement rule: only proof and spec lanes may change; exec must stay untouched.
  const violations = useMemo(
    () => lines.filter((l) => (l.kind === 'add' || l.kind === 'del') && l.lane === 'exec'),
    [lines],
  );
  const clean = violations.length === 0;

  return (
    <div className="ix-ghost-drawer" data-testid="ghost-drawer">
      <div className="ix-ghost-toolbar">
        <span data-testid="ghost-title">{title}</span>
        <span className="ix-ghost-badge" data-clean={clean} data-testid="enforcement-badge">
          {clean
            ? 'ENFORCEMENT CLEAN · exec untouched'
            : `ENFORCEMENT VIOLATION · ${violations.length} exec line${violations.length > 1 ? 's' : ''} mutated`}
        </span>
        {onClose && (
          <button type="button" className="ix-ghost-close" onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        )}
      </div>

      <div className="ix-ghost-diff ix-scroll-pane">
        {lines.map((line, i) => (
          <div
            key={i}
            className="ix-diff-line"
            data-kind={line.kind}
            data-lane={line.lane}
            data-enforcement-violation={line.lane === 'exec' && (line.kind === 'add' || line.kind === 'del')}
            data-testid={line.lane === 'exec' && (line.kind === 'add' || line.kind === 'del') ? `violation-${i}` : undefined}
          >
            <span className="ix-diff-oldno">{line.oldNo ?? ''}</span>
            <span className="ix-diff-newno">{line.newNo ?? ''}</span>
            <span className="ix-diff-marker">
              {line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : line.kind === 'hunk' ? '@' : ' '}
            </span>
            <span className="ix-ghost-lane">{line.lane}</span>
            <code>{line.text}</code>
          </div>
        ))}
      </div>

      <div className="ix-ghost-footer">
        <span className="ix-ghost-lane-legend">
          <span data-lane="exec" /> exec
          <span data-lane="proof" /> proof
          <span data-lane="spec" /> spec
        </span>
        <button
          type="button"
          className="ix-patch-promote"
          data-testid="accept-ghost"
          disabled={!clean}
          onClick={() => {
            if (clean) onAccept?.([]);
          }}
        >
          Accept candidate
        </button>
      </div>
    </div>
  );
};
