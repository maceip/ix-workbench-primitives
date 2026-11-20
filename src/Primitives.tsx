import React, { useState, useMemo } from 'react';

export type WorkbenchTone = 'critical' | 'warning' | 'verified' | 'neutral';

export interface IxDigestBadgeProps {
  prefix?: string;
  digest: string;
  headChars?: number;
  tailChars?: number;
  tone?: WorkbenchTone;
  statusLabel?: string;
  shortcut?: string;
  onSelect?: (digest: string) => void;
}

export const IxDigestBadge: React.FC<IxDigestBadgeProps> = ({
  prefix,
  digest,
  headChars = 6,
  tailChars = 4,
  tone = 'neutral',
  statusLabel,
  shortcut,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);

  const truncated = useMemo(() => {
    if (digest.length <= headChars + tailChars + 1) return digest;
    return `${digest.slice(0, headChars)}…${digest.slice(-tailChars)}`;
  }, [digest, headChars, tailChars]);

  const handleClick = () => {
    navigator.clipboard?.writeText(digest);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    onSelect?.(digest);
  };

  return (
    <button
      type="button"
      className="ix-digest-badge"
      onClick={handleClick}
      title={`Copy full value: ${prefix ? `${prefix}:` : ''}${digest}`}
    >
      <span className="ix-status-dot" data-tone={tone} />
      {prefix && <span style={{ color: 'var(--theme-color-soft-text)' }}>{prefix}:</span>}
      <span data-testid="digest-text">{copied ? 'COPIED' : truncated}</span>
      {statusLabel && (
        <span
          style={{
            paddingLeft: 4,
            borderLeft: '1px solid var(--theme-color-soft-bdr)',
            color: 'var(--theme-color-soft-text)',
          }}
        >
          {statusLabel}
        </span>
      )}
      {shortcut && <kbd className="ix-kbd">{shortcut}</kbd>}
    </button>
  );
};

export interface IxHexWireViewerProps {
  label: string;
  bytes: Uint8Array;
  baselineBytes?: Uint8Array;
  baseAddress?: number;
  selectedOffset?: number | null;
  onSelectOffset?: (offset: number) => void;
}

export const IxHexWireViewer: React.FC<IxHexWireViewerProps> = ({
  label,
  bytes,
  baselineBytes,
  baseAddress = 0,
  selectedOffset = null,
  onSelectOffset,
}) => {
  const rows = useMemo(() => {
    const result: Array<{ rowOffset: number; slice: Uint8Array }> = [];
    for (let i = 0; i < bytes.length; i += 16) {
      result.push({
        rowOffset: i,
        slice: bytes.subarray(i, Math.min(i + 16, bytes.length)),
      });
    }
    return result;
  }, [bytes]);

  const mutatedCount = useMemo(() => {
    if (!baselineBytes) return 0;
    let count = 0;
    for (let i = 0; i < bytes.length; i++) {
      if (baselineBytes[i] !== bytes[i]) count++;
    }
    return count;
  }, [bytes, baselineBytes]);

  return (
    <div className="ix-hex-viewer">
      <div className="ix-hex-toolbar">
        <span>{label} ({bytes.length} B)</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {baselineBytes && (
            <span
              data-testid="mutated-count"
              style={{ color: mutatedCount > 0 ? 'var(--theme-color-alarm)' : 'var(--theme-color-soft-text)' }}
            >
              Δ {mutatedCount} mutated bytes
            </span>
          )}
          <kbd className="ix-kbd">16B/row</kbd>
        </div>
      </div>

      <div className="ix-scroll-pane">
        {rows.map(({ rowOffset, slice }) => {
          const addrHex = (baseAddress + rowOffset).toString(16).padStart(8, '0');
          return (
            <div key={rowOffset} className="ix-hex-row">
              <span className="ix-hex-offset">{addrHex}</span>
              <div>
                {Array.from({ length: 16 }).map((_, colIdx) => {
                  const absOffset = rowOffset + colIdx;
                  if (colIdx >= slice.length) {
                    return <span key={colIdx} className="ix-hex-byte">  </span>;
                  }
                  const byteVal = slice[colIdx];
                  const isMutated = baselineBytes !== undefined && baselineBytes[absOffset] !== byteVal;
                  const isSelected = selectedOffset === absOffset;
                  return (
                    <span
                      key={colIdx}
                      className="ix-hex-byte"
                      data-mutated={isMutated}
                      data-selected={isSelected}
                      onClick={() => onSelectOffset?.(absOffset)}
                    >
                      {byteVal.toString(16).padStart(2, '0')}
                    </span>
                  );
                })}
              </div>
              <div>
                {Array.from(slice).map((byteVal, colIdx) => {
                  const absOffset = rowOffset + colIdx;
                  const isMutated = baselineBytes !== undefined && baselineBytes[absOffset] !== byteVal;
                  const char = byteVal >= 0x20 && byteVal <= 0x7e ? String.fromCharCode(byteVal) : '·';
                  return (
                    <span
                      key={colIdx}
                      className="ix-hex-ascii-char"
                      data-mutated={isMutated}
                      onClick={() => onSelectOffset?.(absOffset)}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface CausalStepNode {
  id: string;
  kind: 'ingress' | 'transform' | 'sink' | 'requires' | 'invariant' | 'ensures' | 'counterexample';
  tone: WorkbenchTone;
  location: string;
  expression: string;
  valuationDelta?: Record<string, { pre: string; post: string }>;
  rlimitTicks?: number;
}

export interface IxCausalChainProps {
  steps: CausalStepNode[];
  activeStepId?: string;
  onSelectStep?: (step: CausalStepNode) => void;
}

export const IxCausalChain: React.FC<IxCausalChainProps> = ({
  steps,
  activeStepId,
  onSelectStep,
}) => {
  return (
    <div className="ix-causal-list">
      {steps.map((step, index) => {
        const isSelected = step.id === activeStepId;
        return (
          <div
            key={step.id}
            className="ix-causal-node"
            style={isSelected ? { borderColor: 'var(--theme-color-primary)' } : undefined}
            onClick={() => onSelectStep?.(step)}
          >
            <div className="ix-causal-rail" data-tone={step.tone} />
            <div className="ix-causal-body">
              <div className="ix-causal-header">
                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  {index + 1}. {step.kind}
                </span>
                <span style={{ fontFamily: 'var(--ix-wb-font-mono)', color: 'var(--theme-color-soft-text)' }}>
                  {step.location}
                  {step.rlimitTicks !== undefined && ` · ${step.rlimitTicks}k ticks`}
                </span>
              </div>
              <div className="ix-causal-expr">{step.expression}</div>
              {step.valuationDelta && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr 1fr',
                    gap: 6,
                    fontSize: 11,
                    fontFamily: 'var(--ix-wb-font-mono)',
                    paddingTop: 2,
                    color: 'var(--theme-color-soft-text)',
                  }}
                >
                  {Object.entries(step.valuationDelta).map(([symbol, delta]) => (
                    <React.Fragment key={symbol}>
                      <span style={{ color: 'var(--theme-color-std-text)' }}>{symbol}</span>
                      <span>pre: {delta.pre}</span>
                      <span style={{ color: step.tone === 'critical' ? 'var(--theme-color-alarm)' : 'var(--theme-color-std-text)' }}>
                        post: {delta.post}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
