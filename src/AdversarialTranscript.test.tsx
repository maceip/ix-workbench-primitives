import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  IxAdversarialTranscript,
  type TranscriptTurn,
} from './AdversarialTranscript';

const turns: TranscriptTurn[] = [
  {
    id: 't1',
    kind: 'claim',
    agent: 'researcher',
    tone: 'critical',
    heading: 'PoC: unauthenticated RCE viacrafted TLV length in net.c:412',
    body: 'tlv_len is attacker-controlled and used in memcpy without bounds check → heap overflow of 0x40 bytes past chunk.',
    meta: 'repro 3/3',
  },
  {
    id: 't2',
    kind: 'sandbox-stdout',
    agent: 'sandbox',
    tone: 'neutral',
    heading: 'Deterministic PoC run (isolated, network-zero)',
    body: 'segmentation fault (core dumped) at 0xdeadbeef in tlv_parse',
    meta: 'exit=139',
  },
  {
    id: 't3',
    kind: 'sandbox-stderr',
    agent: 'sandbox',
    tone: 'warning',
    heading: 'ASAN report',
    body: 'ERROR: AddressSanitizer: heap-buffer-overflow WRITE of size 8 at 0x60300000eff0',
    meta: 'asan=1',
  },
  {
    id: 't4',
    kind: 'critic-challenge',
    agent: 'critic',
    tone: 'warning',
    heading: 'Falsification attempt #1 — alternate sink reachability',
    body: 'Attempted alternate path via ipc::port::recv: sink unreachable without CAP_NET_RAW. Falsification failed — original sink reachable.',
    meta: 'attempt 1/1',
  },
  {
    id: 't5',
    kind: 'verdict',
    agent: 'critic',
    tone: 'verified',
    heading: 'Deterministic verdict',
    body: 'Claim survives falsification. Crash reproducible in isolated sandbox. Promoting to OpenVEX under_investigation.',
    meta: 'CONFIRMED',
  },
];

describe('IxAdversarialTranscript', () => {
  it('renders the full claim → sandbox → critic → verdict timeline', () => {
    render(<IxAdversarialTranscript findingId="NF-2025-0042" turns={turns} />);
    expect(screen.getByTestId('transcript-finding').textContent).toBe('NF-2025-0042');
    for (const t of turns) {
      expect(screen.getByTestId(`turn-${t.id}`)).toBeTruthy();
    }
    expect(screen.getByText('Claim')).toBeTruthy();
    expect(screen.getByText('Sandbox Stdout')).toBeTruthy();
    expect(screen.getByText('Sandbox Stderr')).toBeTruthy();
    expect(screen.getByText('Critic Challenge')).toBeTruthy();
    expect(screen.getByText('Deterministic Verdict')).toBeTruthy();
  });

  it('surfaces the deterministic verdict pill from the verdict turn', () => {
    render(<IxAdversarialTranscript findingId="NF-2025-0042" turns={turns} />);
    const pill = screen.getByTestId('transcript-verdict');
    expect(pill.textContent).toBe('CONFIRMED');
    expect(pill.getAttribute('data-tone')).toBe('verified');
  });

  it('carries execution metadata per turn', () => {
    render(<IxAdversarialTranscript findingId="NF-2025-0042" turns={turns} />);
    expect(screen.getByTestId('meta-t2').textContent).toBe('exit=139');
    expect(screen.getByTestId('meta-t3').textContent).toBe('asan=1');
  });

  it('marks agent attribution and roles', () => {
    render(<IxAdversarialTranscript findingId="NF-2025-0042" turns={turns} />);
    expect(screen.getByTestId('turn-t1').getAttribute('data-agent')).toBe('researcher');
    expect(screen.getByTestId('turn-t4').getAttribute('data-agent')).toBe('critic');
    expect(screen.getByTestId('turn-t2').getAttribute('data-agent')).toBe('sandbox');
    expect(screen.getByTestId('turn-t2').getAttribute('data-kind')).toBe('sandbox-stdout');
  });
});
