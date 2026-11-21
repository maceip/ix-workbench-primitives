import React, { useMemo, useState } from 'react';
import type { WorkbenchTone } from './Primitives';

export type VerusMode = 'exec' | 'proof' | 'spec';
export type ObligationState = 'verified' | 'failed' | 'admit' | 'timeout';

export interface Z3CounterexampleVariable {
  /** Rust ghost/exec symbol or bitvector name, e.g. pte.flags */
  symbol: string;
  /** SMT-LIB sort, e.g. (_ BitVec 64) */
  sort?: string;
  pre: string;
  post: string;
}

export interface VerusObligation {
  state: ObligationState;
  message: string;
  rlimitTicks?: number;
  counterexample?: Z3CounterexampleVariable[];
}

export interface VerusEditorLine {
  text: string;
  mode?: VerusMode;
  obligation?: VerusObligation;
}

export interface IxVerusEditorProps {
  fileName: string;
  lines: VerusEditorLine[];
  initialExpandedObligation?: number | null;
  onSelectLine?: (lineIndex: number) => void;
}

const GLYPHS: Record<ObligationState, string> = {
  verified: '✓',
  failed: '✗',
  admit: '!',
  timeout: '⏱',
};

export const IxVerusEditor: React.FC<IxVerusEditorProps> = ({
  fileName,
  lines,
  initialExpandedObligation = null,
  onSelectLine,
}) => {
  const [expanded, setExpanded] = useState<number | null>(initialExpandedObligation);
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const obligationStats = useMemo(() => {
    const counts = { verified: 0, failed: 0, admit: 0, timeout: 0 };
    for (const line of lines) {
      if (line.obligation) counts[line.obligation.state]++;
    }
    return counts;
  }, [lines]);

  const handleGutterClick = (index: number) => {
    setExpanded((prev) => (prev === index ? null : index));
    setActiveLine(index);
    onSelectLine?.(index);
  };

  return (
    <div className="ix-verus-editor">
      <div className="ix-verus-toolbar">
        <span
          data-testid="verus-file"
          style={{ fontFamily: 'var(--ix-wb-font-mono)' }}
        >
          {fileName}
        </span>
        <div className="ix-verus-stats" data-testid="verus-stats">
          <span data-state="verified">✓ {obligationStats.verified}</span>
          <span data-state="failed">✗ {obligationStats.failed}</span>
          <span data-state="admit">! {obligationStats.admit}</span>
          <span data-state="timeout">⏱ {obligationStats.timeout}</span>
          <span className="ix-verus-mode-legend">
            <span data-mode="exec" /> exec
            <span data-mode="proof" /> proof
            <span data-mode="spec" /> spec
          </span>
        </div>
      </div>

      <div className="ix-verus-body ix-scroll-pane">
        {lines.map((line, index) => {
          const number = index + 1;
          const mode = line.mode ?? 'exec';
          const obligation = line.obligation;
          const isActive = activeLine === index || expanded === index;
          return (
            <React.Fragment key={number}>
              <div
                className="ix-verus-line"
                data-mode={mode}
                data-active={isActive}
                onClick={() => {
                  setActiveLine(index);
                  onSelectLine?.(index);
                }}
              >
                <span className="ix-verus-gutter" data-testid={`gutter-${number}`}>
                  <span className="ix-verus-line-no">{number}</span>
                  {obligation && (
                    <button
                      type="button"
                      className="ix-verus-glyph"
                      data-state={obligation.state}
                      data-testid={`obligation-${number}`}
                      title={obligation.message}
                      aria-expanded={expanded === index}
                      aria-label={`Obligation ${obligation.state} at line ${number}: ${obligation.message}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGutterClick(index);
                      }}
                    >
                      {GLYPHS[obligation.state]}
                    </button>
                  )}
                </span>
                <code className="ix-verus-code" data-mode={mode}>
                  {line.text || ' '}
                </code>
              </div>
              {obligation && expanded === index && (
                <div className="ix-verus-inlay" data-testid={`inlay-${number}`}>
                  <div className="ix-verus-inlay-header">
                    <span
                      data-testid={`inlay-state-${number}`}
                      style={{ fontWeight: 600, textTransform: 'uppercase' }}
                      data-state={obligation.state}
                    >
                      {obligation.state}
                    </span>
                    <span style={{ fontFamily: 'var(--ix-wb-font-mono)' }}>
                      {obligation.message}
                      {obligation.rlimitTicks !== undefined &&
                        ` · rlimit ${obligation.rlimitTicks}k`}
                    </span>
                  </div>
                  {obligation.counterexample && (
                    <div className="ix-verus-ce-grid">
                      <span className="ix-verus-ce-head">symbol</span>
                      <span className="ix-verus-ce-head">pre</span>
                      <span className="ix-verus-ce-head">post</span>
                      {obligation.counterexample.map((v) => (
                        <React.Fragment key={v.symbol}>
                          <span className="ix-verus-ce-symbol">
                            {v.symbol}
                            {v.sort && (
                              <em style={{ color: 'var(--theme-color-soft-text)' }}>
                                {' '}
                                {v.sort}
                              </em>
                            )}
                          </span>
                          <span>{v.pre}</span>
                          <span data-violating={obligation.state === 'failed'}>
                            {v.post}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const verusToneForState = (state: ObligationState): WorkbenchTone =>
  state === 'verified' ? 'verified' : state === 'failed' ? 'critical' : 'warning';
