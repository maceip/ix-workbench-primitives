# `@maceip/ix-workbench-primitives`

Shared Light DOM React 19 primitives wired to **Siemens iX (`@siemens/ix-react` v5.3.0)** CSS variables for:

- **Wireshark-class packet inspection**: 100k-row virtualized packet grids, hex/ASCII wire dumps, `kbd` shortcut badges
- **`conduit-lab`**: Nanvix formal verification (Verus obligations, Z3 counterexample bitvector state diffs, `rlimit` tick telemetry, proof-obligation DAGs)
- **`Nightfall` / `spar`**: Autonomous vulnerability discovery, multi-hop taint traces, HTTP/wire frame diffing, adversarial transcripts, sandbox-gated patch promotion, and OpenVEX / hash-chained attestation strips

All components are dependency-free (no Monaco, ag-grid, tanstack, xyflow, or echarts) and restyle themselves automatically with iX dark/light themes via `--theme-color-*` variables.

## Coverage vs. the gap analysis

| Spec primitive | Component | Status |
| :---- | :---- | :---- |
| Monospace hex dump block | `<IxHexWireViewer>` | ✅ dual-buffer byte diff, hex+ASCII, offset selection |
| Native virtualized table (100k rows) | `<IxPacketGrid>` | ✅ windowing, severity tones, row selection |
| Inline kbd shortcut badges | `.ix-kbd` (in every toolbar) + `<IxDigestBadge shortcut>` | ✅ |
| VerusSpecGutterEditor | `<IxVerusEditor>` | ✅ exec/proof/spec lanes, obligation glyphs (verified/failed/admit/timeout), inline Z3 counterexample inlays |
| ProofObligationDAG | `<IxProofDag>` | ✅ layered SVG DAG, state colors, downstream impact highlighting |
| SmtCounterexampleDiff | `<IxVerusEditor>` inlays + `<IxCausalChain>` valuation grids | ✅ pre/post symbolic state with bitvector sorts |
| QuantifierProfileFlamegraph | `<IxFlamegraph>` | ✅ icicle bars, self/subtree qi counts, solver time, hotspot threshold |
| GhostPatchCompareDrawer | `<IxGhostPatchDrawer>` | ✅ lane-annotated diff + enforcement badge that blocks exec-lane mutation |
| DataflowTrace | `<IxCausalChain>` | ✅ ingress/transform/sink stepped nodes with file:line spans and jump-to-def hooks (`onSelectStep`) |
| HttpExchangeDiff | `<IxExchangeDiff>` | ✅ dual-pane LCS-aligned raw wire diff, hex/ASCII toggle, replay trigger |
| AdversarialTranscript | `<IxAdversarialTranscript>` | ✅ claim / sandbox stdout+stderr / critic challenge / deterministic verdict timeline |
| SandboxPatchGate | `<IxPatchGate>` | ✅ unified diff + sandbox checks; promotion genuinely gated on all checks passing |
| AttestationLedgerStrip | `<IxAttestationLedger>` | ✅ hash-chained digest badges, real prev_hash→artifact_hash chain verification, OpenVEX status labels |

`<WorkbenchShell>` remains the docking demo: full-height `<IxPaneLayout>` implementing fixes for Siemens iX v5 issues `#1302` (`slot="content"` flex stretch) and `#2904` (persistent `<IxPane>` mounting to avoid `applicationLayoutService` listener leaks), plus `data-ix-theme="classic"` / `data-ix-color-schema` attributes.

## Quick Start

```bash
npm install
npm run typecheck
npm test
npm run build
```

Import styles once (`@maceip/ix-workbench-primitives/styles.css`) — it loads Siemens iX's own CSS and layers the workbench primitives on top, so every primitive follows the active iX theme.
