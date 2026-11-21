import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { IxExchangeDiff } from './ExchangeDiff';

const baselineText = [
  'POST /api/v1/tlv/upload HTTP/1.1',
  'Host: target.local',
  'Content-Type: application/octet-stream',
  'Content-Length: 24',
  '',
  '\x16\x00\x04T\x00\x10AAAA',
].join('\n');

const mutatedText = [
  'POST /api/v1/tlv/upload HTTP/1.1',
  'Host: target.local',
  'Content-Type: application/octet-stream',
  'Content-Length: 2048',
  'X-Extra: bypass',
  '',
  '\x16\xff\xffT\x40\x10AAAA',
].join('\n');

describe('IxExchangeDiff', () => {
  it('aligns both panes via LCS and counts differing lines', () => {
    render(<IxExchangeDiff label="TLV upload exchange" baselineText={baselineText} mutatedText={mutatedText} />);
    // LCS alignment: CL pair → 2 rows, X-Extra insert → 1, payload pair → 2 = 5 differing rows
    expect(screen.getByTestId('exchange-delta').textContent).toBe('Δ 5 differing lines');
    // baseline pane shows its 2 changed rows, mutated pane its 3
    const differing = document.querySelectorAll('.ix-exchange-line[data-differs="true"]');
    expect(differing.length).toBe(5);
    expect(screen.getByText('X-Extra: bypass').closest('.ix-exchange-line')!.getAttribute('data-differs')).toBe('true');
  });

  it('shows identical exchanges with zero delta', () => {
    render(<IxExchangeDiff label="same" baselineText={baselineText} mutatedText={baselineText} />);
    expect(screen.getByTestId('exchange-delta').textContent).toBe('Δ 0 differing lines');
    expect(document.querySelectorAll('.ix-exchange-line[data-differs="true"]').length).toBe(0);
  });

  it('toggles between raw and hex/ascii modes', () => {
    render(<IxExchangeDiff label="TLV upload exchange" baselineText={baselineText} mutatedText={mutatedText} />);
    fireEvent.click(screen.getByTestId('exchange-mode'));
    const hexRows = document.querySelectorAll('.ix-exchange-hexrow');
    expect(hexRows.length).toBeGreaterThan(0);
    expect(hexRows[0].textContent).toMatch(/^[0-9a-f]{8} {2}/);
    fireEvent.click(screen.getByTestId('exchange-mode'));
    expect(document.querySelectorAll('.ix-exchange-hexrow').length).toBe(0);
  });

  it('fires the replay trigger with the mutated payload', () => {
    let replayed: string | null = null;
    render(
      <IxExchangeDiff
        label="TLV upload exchange"
        baselineText={baselineText}
        mutatedText={mutatedText}
        onReplay={(payload) => { replayed = payload; }}
      />,
    );
    const button = screen.getByTestId('exchange-replay') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(replayed).toBe(mutatedText);
  });

  it('disables replay when no handler is wired', () => {
    render(<IxExchangeDiff label="TLV upload exchange" baselineText={baselineText} mutatedText={mutatedText} />);
    expect((screen.getByTestId('exchange-replay') as HTMLButtonElement).disabled).toBe(true);
  });
});
