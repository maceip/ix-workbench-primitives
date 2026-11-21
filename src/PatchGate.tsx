import React, { useMemo } from 'react';

export type DiffLineKind = 'context' | 'add' | 'del' | 'hunk';

export interface DiffLine {
  kind: DiffLineKind;
  text: string;
  oldNo?: number;
  newNo?: number;
}

export interface SandboxCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface IxPatchGateProps {
  patchId: string;
  title: string;
  diffLines: DiffLine[];
  checks: SandboxCheck[];
  onPromote?: (patchId: string, allChecksPassed: boolean) => void;
}

export const IxPatchGate: React.FC<IxPatchGateProps> = ({
  patchId,
  title,
  diffLines,
  checks,
  onPromote,
}) => {
  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  const failing = checks.filter((c) => !c.passed);
  const diffStats = useMemo(() => {
    let add = 0;
    let del = 0;
    for (const line of diffLines) {
      if (line.kind === 'add') add++;
      if (line.kind === 'del') del++;
    }
    return { add, del };
  }, [diffLines]);

  return (
    <div className="ix-patch-gate" data-testid="patch-gate">
      <div className="ix-patch-toolbar">
        <span data-testid="patch-title">{title}</span>
        <span data-testid="patch-stats">
          +{diffStats.add} −{diffStats.del} · {checks.filter((c) => c.passed).length}/
          {checks.length} checks
        </span>
      </div>

      <div className="ix-patch-diff">
        <div className="ix-patch-diff-rows">
          {diffLines.map((line, i) => (
            <div
              key={i}
              className="ix-diff-line"
              data-kind={line.kind}
              data-testid={line.kind === 'hunk' ? `diff-hunk-${i}` : undefined}
            >
              <span className="ix-diff-oldno">{line.oldNo ?? ''}</span>
              <span className="ix-diff-newno">{line.newNo ?? ''}</span>
              <span className="ix-diff-marker">
                {line.kind === 'add' ? '+' : line.kind === 'del' ? '−' : line.kind === 'hunk' ? '@' : ' '}
              </span>
              <code>{line.text}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="ix-patch-checks" data-testid="sandbox-checks">
        {checks.map((check) => (
          <div key={check.id} className="ix-patch-check" data-passed={check.passed}>
            <span className="ix-patch-check-state" data-testid={`check-${check.id}`}>
              {check.passed ? 'PASS' : 'FAIL'}
            </span>
            <span className="ix-patch-check-label">{check.label}</span>
            <span className="ix-patch-check-detail">{check.detail}</span>
          </div>
        ))}
      </div>

      <div className="ix-patch-gate-footer">
        {allPassed ? (
          <span className="ix-patch-gate-status" data-state="open">
            Gate open — sandbox verified, exec untouched
          </span>
        ) : (
          <span className="ix-patch-gate-status" data-state="blocked" data-testid="gate-blocked">
            Gate blocked — {failing.map((c) => c.label).join(', ')}
          </span>
        )}
        <button
          type="button"
          className="ix-patch-promote"
          data-testid="promote-button"
          disabled={!allPassed}
          onClick={() => {
            if (allPassed) onPromote?.(patchId, true);
          }}
        >
          Promote to trunk
        </button>
      </div>
    </div>
  );
};
