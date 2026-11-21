import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import type { WorkbenchTone } from './Primitives';

export interface PacketGridColumn {
  key: string;
  label: string;
  /** Relative flex width; defaults to 1 */
  width?: number;
  mono?: boolean;
  align?: 'left' | 'right';
}

export type PacketGridRow = Record<string, string | number | null | undefined>;

export interface IxPacketGridProps {
  columns: PacketGridColumn[];
  rows: ReadonlyArray<PacketGridRow>;
  rowHeight?: number;
  /** Height of the scroll viewport; the grid fills its parent when omitted */
  viewportHeight?: number | string;
  overscan?: number;
  getRowTone?: (row: PacketGridRow, index: number) => WorkbenchTone | undefined;
  selectedRowIndex?: number | null;
  onSelectRow?: (row: PacketGridRow, index: number) => void;
  emptyLabel?: string;
}

const DEFAULT_VIEWPORT_TEST_HEIGHT = 400;

export const IxPacketGrid: React.FC<IxPacketGridProps> = ({
  columns,
  rows,
  rowHeight = 22,
  viewportHeight,
  overscan = 8,
  getRowTone,
  selectedRowIndex = null,
  onSelectRow,
  emptyLabel = 'No packets captured',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportPx, setViewportPx] = useState(
    typeof viewportHeight === 'number' ? viewportHeight : DEFAULT_VIEWPORT_TEST_HEIGHT,
  );

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
  }, []);

  useEffect(() => {
    if (typeof viewportHeight === 'number') return;
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setViewportPx(el.clientHeight));
    ro.observe(el);
    setViewportPx(el.clientHeight);
    return () => ro.disconnect();
  }, [viewportHeight]);

  const range = useMemo(() => {
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visible = Math.ceil(viewportPx / rowHeight) + 2 * overscan;
    const last = Math.min(rows.length, first + visible);
    return { first, last };
  }, [scrollTop, viewportPx, rowHeight, overscan, rows.length]);

  const windowed = rows.slice(range.first, range.last);

  const gridTemplate = columns
    .map((c) => `minmax(0, ${c.width ?? 1}fr)`)
    .join(' ');

  return (
    <div className="ix-packet-grid">
      <div className="ix-packet-grid-toolbar">
        <span data-testid="packet-count">
          {rows.length.toLocaleString('en-US')} packets
        </span>
        <kbd className="ix-kbd">↑↓ navigate</kbd>
      </div>
      <div
        className="ix-packet-grid-header"
        role="row"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {columns.map((col) => (
          <span
            key={col.key}
            role="columnheader"
            style={{
              textAlign: col.align === 'right' ? 'right' : 'left',
              fontFamily: col.mono ? 'var(--ix-wb-font-mono)' : undefined,
            }}
          >
            {col.label}
          </span>
        ))}
      </div>
      <div
        ref={scrollRef}
        className="ix-packet-grid-body ix-scroll-pane"
        onScroll={handleScroll}
        style={
          typeof viewportHeight === 'number'
            ? { height: viewportHeight, flex: 'none' }
            : undefined
        }
        data-testid="packet-grid-viewport"
      >
        {rows.length === 0 ? (
          <div className="ix-packet-grid-empty">{emptyLabel}</div>
        ) : (
          <>
            <div style={{ height: range.first * rowHeight }} aria-hidden />
            {windowed.map((row, i) => {
              const index = range.first + i;
              const isSelected = selectedRowIndex === index;
              const tone = getRowTone?.(row, index);
              return (
                <div
                  key={index}
                  role="row"
                  aria-rowindex={index + 1}
                  aria-selected={isSelected}
                  className="ix-packet-grid-row"
                  data-selected={isSelected}
                  data-tone={tone}
                  style={{ gridTemplateColumns: gridTemplate, height: rowHeight }}
                  onClick={() => onSelectRow?.(row, index)}
                >
                  {columns.map((col) => (
                    <span
                      key={col.key}
                      role="gridcell"
                      className="ix-packet-grid-cell"
                      data-mono={col.mono}
                      style={{ textAlign: col.align === 'right' ? 'right' : 'left' }}
                    >
                      {row[col.key] ?? ''}
                    </span>
                  ))}
                </div>
              );
            })}
            <div
              style={{ height: (rows.length - range.last) * rowHeight }}
              aria-hidden
            />
          </>
        )}
      </div>
    </div>
  );
};
