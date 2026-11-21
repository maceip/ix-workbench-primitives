import React, { useMemo, useState } from 'react';

export interface IxExchangeDiffProps {
  label: string;
  /** Baseline raw RFC 822 / HTTP exchange (CRLF-separated) */
  baselineText: string;
  /** Mutated exploit exchange */
  mutatedText: string;
  onReplay?: (mutatedText: string) => void;
}

interface AlignedLine {
  baseline: string | null;
  mutated: string | null;
  differs: boolean;
}

const alignLines = (baseline: string[], mutated: string[]): AlignedLine[] => {
  const n = baseline.length;
  const m = mutated.length;
  // LCS table (exchanges are tens of lines; O(n·m) is fine)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = baseline[i] === mutated[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result: AlignedLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (baseline[i] === mutated[j]) {
      result.push({ baseline: baseline[i], mutated: mutated[j], differs: false });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ baseline: baseline[i], mutated: null, differs: true });
      i++;
    } else {
      result.push({ baseline: null, mutated: mutated[j], differs: true });
      j++;
    }
  }
  while (i < n) result.push({ baseline: baseline[i++], mutated: null, differs: true });
  while (j < m) result.push({ baseline: null, mutated: mutated[j++], differs: true });
  return result;
};

const toHexDump = (text: string): string[] => {
  const bytes = new TextEncoder().encode(text);
  const rows: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const slice = bytes.subarray(i, i + 16);
    const hex = Array.from(slice, (b) => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(slice, (b) =>
      b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '·',
    ).join('');
    rows.push(`${i.toString(16).padStart(8, '0')}  ${hex.padEnd(47, ' ')}  |${ascii}|`);
  }
  return rows;
};

export const IxExchangeDiff: React.FC<IxExchangeDiffProps> = ({
  label,
  baselineText,
  mutatedText,
  onReplay,
}) => {
  const [mode, setMode] = useState<'raw' | 'hex'>('raw');

  const aligned = useMemo(
    () =>
      alignLines(
        baselineText.split('\n'),
        mutatedText.split('\n'),
      ),
    [baselineText, mutatedText],
  );
  const deltaCount = aligned.filter((l) => l.differs).length;

  return (
    <div className="ix-exchange-diff">
      <div className="ix-exchange-toolbar">
        <span>{label}</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span
            data-testid="exchange-delta"
            style={{ color: deltaCount > 0 ? 'var(--theme-color-alarm)' : 'var(--theme-color-soft-text)' }}
          >
            Δ {deltaCount} differing lines
          </span>
          <button
            type="button"
            className="ix-exchange-mode"
            data-mode={mode}
            data-testid="exchange-mode"
            onClick={() => setMode((m) => (m === 'raw' ? 'hex' : 'raw'))}
          >
            {mode === 'raw' ? 'raw' : 'hex/ascii'}
          </button>
          <button
            type="button"
            className="ix-exchange-replay"
            data-testid="exchange-replay"
            disabled={!onReplay}
            onClick={() => onReplay?.(mutatedText)}
          >
            Replay payload <kbd className="ix-kbd">⌘R</kbd>
          </button>
        </div>
      </div>

      {mode === 'raw' ? (
        <div className="ix-exchange-panes ix-scroll-pane">
          <div className="ix-exchange-pane">
            <div className="ix-exchange-pane-head">baseline</div>
            {aligned.map((line, i) => (
              <div
                key={i}
                className="ix-exchange-line"
                data-differs={line.differs && line.baseline !== null}
              >
                {line.baseline ?? ''}
              </div>
            ))}
          </div>
          <div className="ix-exchange-pane">
            <div className="ix-exchange-pane-head">mutated</div>
            {aligned.map((line, i) => (
              <div
                key={i}
                className="ix-exchange-line"
                data-differs={line.differs && line.mutated !== null}
              >
                {line.mutated ?? ''}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ix-exchange-panes ix-scroll-pane">
          <div className="ix-exchange-pane">
            <div className="ix-exchange-pane-head">baseline · hex</div>
            {toHexDump(baselineText).map((row, i) => (
              <div key={i} className="ix-exchange-line ix-exchange-hexrow">{row}</div>
            ))}
          </div>
          <div className="ix-exchange-pane">
            <div className="ix-exchange-pane-head">mutated · hex</div>
            {toHexDump(mutatedText).map((row, i) => (
              <div key={i} className="ix-exchange-line ix-exchange-hexrow">{row}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
