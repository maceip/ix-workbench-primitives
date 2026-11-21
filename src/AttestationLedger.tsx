import React, { useMemo } from 'react';
import { IxDigestBadge } from './Primitives';

export type VexStatus = 'under_investigation' | 'affected' | 'fixed' | 'not_affected';

export interface LedgerEntry {
  artifact: string;
  prevHash: string;
  artifactHash: string;
  vexStatus: VexStatus;
  signedBy?: string;
}

export interface IxAttestationLedgerProps {
  entries: LedgerEntry[];
  onInspect?: (entry: LedgerEntry, index: number) => void;
}

const VEX_TONE: Record<VexStatus, 'critical' | 'warning' | 'verified' | 'neutral'> = {
  under_investigation: 'warning',
  affected: 'critical',
  fixed: 'verified',
  not_affected: 'neutral',
};

export const IxAttestationLedger: React.FC<IxAttestationLedgerProps> = ({
  entries,
  onInspect,
}) => {
  // Real hash-chain verification: each entry's prevHash must equal the previous artifactHash.
  const chainBreaks = useMemo(() => {
    const breaks: number[] = [];
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].prevHash !== entries[i - 1].artifactHash) breaks.push(i);
    }
    return breaks;
  }, [entries]);

  const chainValid = chainBreaks.length === 0 && entries.length > 0;

  return (
    <div className="ix-ledger" data-testid="attestation-ledger">
      <div className="ix-ledger-toolbar">
        <span>Attestation ledger · {entries.length} entries</span>
        <span
          className="ix-ledger-chain-state"
          data-valid={chainValid}
          data-testid="chain-state"
        >
          {chainValid
            ? 'HASH CHAIN VALID'
            : `HASH CHAIN BREAK at entr${chainBreaks.length > 1 ? 'ies' : 'y'} ${chainBreaks.join(', ')}`}
        </span>
      </div>
      <div className="ix-ledger-strip">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="ix-ledger-entry"
            data-testid={`ledger-entry-${i}`}
            data-chain-break={chainBreaks.includes(i)}
            onClick={() => onInspect?.(entry, i)}
          >
            <span className="ix-ledger-arrow">{i === 0 ? 'genesis' : '←'}</span>
            <IxDigestBadge
              prefix={entry.artifact}
              digest={entry.artifactHash}
              tone={VEX_TONE[entry.vexStatus]}
              statusLabel={entry.vexStatus}
            />
            {entry.signedBy && (
              <span className="ix-ledger-signed">signed: {entry.signedBy}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
