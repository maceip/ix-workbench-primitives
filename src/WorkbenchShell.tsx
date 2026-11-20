import React, { useState, useEffect } from 'react';
import {
  IxApplication,
  IxApplicationHeader,
  IxPaneLayout,
  IxPane,
  IxCategoryFilter,
  IxBlind,
  IxSplitButton,
  IxDropdownItem,
} from '@siemens/ix-react';
import {
  IxDigestBadge,
  IxHexWireViewer,
  IxCausalChain,
  type CausalStepNode,
} from './Primitives';

export interface WorkbenchShellProps {
  title?: string;
  colorSchema?: 'dark' | 'light' | 'system';
  steps: CausalStepNode[];
  bytes: Uint8Array;
  baselineBytes?: Uint8Array;
}

export const WorkbenchShell: React.FC<WorkbenchShellProps> = ({
  title = 'CONDUIT // NIGHTFALL WORKBENCH',
  colorSchema = 'dark',
  steps,
  bytes,
  baselineBytes,
}) => {
  const [activeStepId, setActiveStepId] = useState<string>(steps[0]?.id ?? '');
  const [selectedByte, setSelectedByte] = useState<number | null>(null);
  const [leftExpanded, setLeftExpanded] = useState(true);
  const [bottomExpanded, setBottomExpanded] = useState(true);

  // Siemens iX v5 BREAKING CHANGE fix: theme-classic-dark class removed in v5;
  // use document-level data-ix-theme and data-ix-color-schema attributes.
  useEffect(() => {
    document.documentElement.setAttribute('data-ix-theme', 'classic');
    document.documentElement.setAttribute('data-ix-color-schema', colorSchema);
  }, [colorSchema]);

  return (
    <IxApplication
      data-ix-theme="classic"
      data-ix-color-schema={colorSchema}
      style={{ height: '100vh', width: '100vw' }}
    >
      <IxApplicationHeader name={title}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <IxDigestBadge
            prefix="verus-smt"
            digest="8f3a91c04b77d2e8190a4c6e3b1f09a2d4c8e91c"
            tone="critical"
            statusLabel="1 Z3 FAIL"
            shortcut="⌘P"
          />
          <IxDigestBadge
            prefix="openvex"
            digest="c41d0092e7a811f34b8a77e1209c5531a8f0b112"
            tone="verified"
            statusLabel="SANDBOX GATED"
          />
          <IxSplitButton label="Verify Module" variant="primary">
            <IxDropdownItem label="Verify Function Only (rlimit=20)" />
            <IxDropdownItem label="Synthesize Ghost Invariant" />
            <IxDropdownItem label="Run Critic Counter-PoC" />
          </IxSplitButton>
        </div>
      </IxApplicationHeader>

      <IxPaneLayout
        layout="full-vertical"
        variant="inline"
        borderless={false}
        style={{ height: 'calc(100vh - 48px)', width: '100%' }}
      >
        {/* Keep IxPane permanently mounted (toggle expanded) to avoid siemens/ix #2904 listener leak */}
        <IxPane
          slot="left"
          heading="Proof & Taint Obligations"
          size="360px"
          expanded={leftExpanded}
          onExpandedChanged={(e) => setLeftExpanded(e.detail.expanded)}
        >
          <div className="ix-slot-fill">
            <div className="ix-scroll-pane">
              <IxCausalChain
                steps={steps}
                activeStepId={activeStepId}
                onSelectStep={(step) => setActiveStepId(step.id)}
              />
            </div>
          </div>
        </IxPane>

        {/* Explicit slot="content" required by ix-pane-layout (#1302) */}
        <div slot="content" className="ix-slot-fill">
          <div
            style={{
              padding: '6px 10px',
              borderBottom: '1px solid var(--theme-color-soft-bdr)',
              background: 'var(--theme-color-2)',
            }}
          >
            <IxCategoryFilter
              placeholder="Filter obligations or packet streams..."
              uniqueCategories={false}
              filterState={{ tokens: [], categories: [] }}
              categories={{
                Module: { label: 'Module', options: ['mm::vmem', 'ipc::port', 'hal::tlb'] },
                Status: { label: 'Status', options: ['FAIL', 'VERIFIED', 'RLIMIT_TIMEOUT'] },
              }}
            />
          </div>

          <div className="ix-scroll-pane" style={{ padding: 10 }}>
            <IxBlind
              label="Z3 Counterexample :: nanvix::mm::vmem::map_page_frame"
              sublabel="Postcondition violated at vmem.rs:147 (W^X invariant breach)"
              variant="alarm"
              collapsed={false}
            >
              <div style={{ fontFamily: 'var(--ix-wb-font-mono)', fontSize: 12, padding: 6 }}>
                assertion failed: pt.lookup(vaddr).flags().writable() ==&gt; !pt.lookup(vaddr).flags().executable()
              </div>
            </IxBlind>
          </div>
        </div>

        <IxPane
          slot="bottom"
          heading="Symbolic Frame & Wire Diff Inspector"
          size="33%"
          expanded={bottomExpanded}
          onExpandedChanged={(e) => setBottomExpanded(e.detail.expanded)}
        >
          <div className="ix-slot-fill">
            <IxHexWireViewer
              label="PTE / Exploit Frame Delta"
              bytes={bytes}
              baselineBytes={baselineBytes}
              baseAddress={0x00200000}
              selectedOffset={selectedByte}
              onSelectOffset={setSelectedByte}
            />
          </div>
        </IxPane>
      </IxPaneLayout>
    </IxApplication>
  );
};
