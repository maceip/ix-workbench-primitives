import React from 'react';
import type { WorkbenchTone } from './Primitives';

export type TranscriptTurnKind =
  | 'claim'
  | 'sandbox-stdout'
  | 'sandbox-stderr'
  | 'critic-challenge'
  | 'verdict';

export interface TranscriptTurn {
  id: string;
  kind: TranscriptTurnKind;
  agent: 'researcher' | 'critic' | 'sandbox';
  tone: WorkbenchTone;
  heading: string;
  /** Raw stdout/stderr, falsification transcript, or verdict rationale */
  body: string;
  /** Exit code, repro count, verdict label */
  meta?: string;
}

export interface IxAdversarialTranscriptProps {
  findingId: string;
  turns: TranscriptTurn[];
}

const KIND_LABELS: Record<TranscriptTurnKind, string> = {
  claim: 'Claim',
  'sandbox-stdout': 'Sandbox Stdout',
  'sandbox-stderr': 'Sandbox Stderr',
  'critic-challenge': 'Critic Challenge',
  verdict: 'Deterministic Verdict',
};

export const IxAdversarialTranscript: React.FC<IxAdversarialTranscriptProps> = ({
  findingId,
  turns,
}) => {
  const verdict = turns.find((t) => t.kind === 'verdict');
  return (
    <div className="ix-transcript" role="log" aria-label={`Adversarial verification transcript ${findingId}`}>
      <div className="ix-transcript-toolbar">
        <span data-testid="transcript-finding">{findingId}</span>
        {verdict && (
          <span
            data-testid="transcript-verdict"
            className="ix-transcript-verdict-pill"
            data-tone={verdict.tone}
          >
            {verdict.meta ?? 'VERDICT'}
          </span>
        )}
      </div>
      <div className="ix-transcript-body ix-scroll-pane">
        {turns.map((turn) => (
          <div
            key={turn.id}
            data-testid={`turn-${turn.id}`}
            className="ix-transcript-turn"
            data-kind={turn.kind}
            data-agent={turn.agent}
          >
            <div className="ix-causal-rail" data-tone={turn.tone} />
            <div className="ix-transcript-body-inner">
              <div className="ix-transcript-header">
                <span className="ix-transcript-kind">{KIND_LABELS[turn.kind]}</span>
                <span className="ix-transcript-agent">{turn.agent}</span>
                {turn.meta && (
                  <span className="ix-transcript-meta" data-testid={`meta-${turn.id}`}>
                    {turn.meta}
                  </span>
                )}
              </div>
              <div className="ix-transcript-heading">{turn.heading}</div>
              <pre className="ix-transcript-pre">{turn.body}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
