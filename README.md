# `@maceip/ix-workbench-primitives`

Shared Light DOM React 19 primitives wired to **Siemens iX (`@siemens/ix-react` v5.3.0)** CSS variables for:
- **`conduit-lab`**: Nanvix formal verification (Verus obligations, Z3 counterexample bitvector state diffs, `rlimit` tick telemetry)
- **`Nightfall` / `spar`**: Autonomous vulnerability discovery, multi-hop taint traces, HTTP/wire frame diffing, and OpenVEX / hash-chained attestation strips

## Included Primitives
- **`<IxDigestBadge>`**: Middle-truncated hash/attestation pill (`8f3a91…e91c`) with one-click copy, severity dot, and `<kbd>` shortcut badge.
- **`<IxHexWireViewer>`**: Dual-buffer 16-byte hex + ASCII inspector with automatic byte-level mutation diff highlighting (`data-mutated="true"`).
- **`<IxCausalChain>`**: Stepped obligation and taint propagation chain with inline symbolic Z3 `pre` / `post` valuation delta grids.
- **`<WorkbenchShell>`**: Full-height `<IxPaneLayout>` docking shell implementing fixes for Siemens iX v5 issues `#1302` (`slot="content"` flex stretch), `#2904` (persistent `<IxPane>` mounting to avoid `applicationLayoutService` listener leaks), and v5 `data-ix-theme="classic"` / `data-ix-color-schema` attributes.

## Quick Start

```bash
npm install
npm run typecheck
npm test
npm run build
```
