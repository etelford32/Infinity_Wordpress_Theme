import { ReactNode, useState } from 'react';

/* ============================================================
   SimulationInstrumentPanel
   Wraps a simulation canvas in a research-instrument aesthetic:
   — frosted-glass header with sim name + status dot
   — subtle grid overlay on the canvas
   — corner bracket decorations
   — frosted-glass footer with live data readouts
   ============================================================ */

export interface DataReadout {
  label: string;
  value: string | number;
  unit?: string;
}

interface SimulationInstrumentPanelProps {
  /** Display name shown in the header bar */
  title: string;
  /** Short tag — e.g. "N-Body", "Orbital Mechanics" */
  tag?: string;
  /** Whether the simulation is currently running */
  isRunning?: boolean;
  /** Live data readouts shown in the footer */
  readouts?: DataReadout[];
  /** The canvas / renderer to wrap */
  children: ReactNode;
  /** Optional extra controls rendered in the header right slot */
  headerActions?: ReactNode;
  /** Show the instrument grid overlay on the canvas */
  showGrid?: boolean;
  className?: string;
}

/* ── Status indicator ── */
function StatusDot({ running }: { running: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={running ? 'instrument-dot' : ''}
        style={
          !running
            ? {
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--text-tertiary)',
                opacity: 0.4,
              }
            : undefined
        }
      />
      <span style={{ color: running ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
        {running ? 'LIVE' : 'PAUSED'}
      </span>
    </span>
  );
}

/* ── Readout chip ── */
function Readout({ readout }: { readout: DataReadout }) {
  return (
    <span className="flex items-center gap-1.5">
      <span style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}>{readout.label}</span>
      <span
        className="font-mono font-semibold tabular-nums"
        style={{ color: 'var(--text-secondary)' }}
      >
        {readout.value}
        {readout.unit && (
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
            {' '}{readout.unit}
          </span>
        )}
      </span>
    </span>
  );
}

/* ── Corner SVG bracket ── */
function CornerBracket({ position }: { position: 'tl' | 'br' }) {
  const isTL = position === 'tl';
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      style={{
        position: 'absolute',
        ...(isTL ? { top: 8, left: 8 } : { bottom: 8, right: 8 }),
        color: 'var(--accent-primary)',
        opacity: 0.35,
        pointerEvents: 'none',
      }}
    >
      {isTL ? (
        <>
          <path d="M1 8V1h7" />
        </>
      ) : (
        <>
          <path d="M15 8v7H8" />
        </>
      )}
    </svg>
  );
}

/* ── Main export ── */
export function SimulationInstrumentPanel({
  title,
  tag,
  isRunning = false,
  readouts = [],
  children,
  headerActions,
  showGrid = true,
  className = '',
}: SimulationInstrumentPanelProps) {
  return (
    <div className={`instrument-panel ${className}`}>

      {/* Header */}
      <div className="instrument-panel-header">
        <div className="flex items-center gap-3">
          <StatusDot running={isRunning} />
          <span
            className="font-semibold tracking-normal normal-case text-xs"
            style={{ color: 'var(--text-secondary)', letterSpacing: '0.03em' }}
          >
            {title}
          </span>
          {tag && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wide"
              style={{
                background: 'rgba(var(--accent-primary-rgb), 0.1)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(var(--accent-primary-rgb), 0.2)',
                textTransform: 'none',
              }}
            >
              {tag}
            </span>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center gap-2 normal-case tracking-normal">
            {headerActions}
          </div>
        )}
      </div>

      {/* Canvas area */}
      <div className="relative">
        {/* Grid overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none instrument-grid"
            aria-hidden
            style={{ zIndex: 1 }}
          />
        )}

        {/* Corner brackets */}
        <CornerBracket position="tl" />
        <CornerBracket position="br" />

        {/* Actual canvas / children */}
        <div className="relative" style={{ zIndex: 0 }}>
          {children}
        </div>
      </div>

      {/* Footer readouts */}
      {readouts.length > 0 && (
        <div className="instrument-panel-footer">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {readouts.map((r, i) => (
              <Readout key={i} readout={r} />
            ))}
          </div>
          {/* Timestamp */}
          <span
            className="font-mono tabular-nums"
            style={{ color: 'var(--text-tertiary)', opacity: 0.6, fontSize: '0.65rem' }}
          >
            {new Date().toISOString().slice(11, 19)} UTC
          </span>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LiveReadouts hook — convenience helper for consumers
   Keeps a rolling set of readouts and provides an updater.
   ============================================================ */
export function useLiveReadouts(initial: DataReadout[] = []) {
  const [readouts, setReadouts] = useState<DataReadout[]>(initial);

  const update = (label: string, value: string | number, unit?: string) => {
    setReadouts((prev) => {
      const idx = prev.findIndex((r) => r.label === label);
      if (idx === -1) return [...prev, { label, value, unit }];
      const next = [...prev];
      next[idx] = { label, value, unit: unit ?? prev[idx].unit };
      return next;
    });
  };

  return { readouts, update, setReadouts };
}
