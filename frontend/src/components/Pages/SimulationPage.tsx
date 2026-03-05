import { SimulationInstrumentPanel, useLiveReadouts } from '@components/Simulation/SimulationInstrumentPanel';
import { useParams } from 'react-router-dom';

export default function SimulationPage() {
  const { id } = useParams<{ id: string }>();
  const { readouts } = useLiveReadouts([
    { label: 'bodies', value: 0, unit: 'N' },
    { label: 'fps', value: '—', unit: 'fps' },
    { label: 'Δt', value: '1.00', unit: 'yr/s' },
  ]);

  return (
    <div>
      <SimulationInstrumentPanel
        title={id ? `Simulation — ${id}` : 'Simulation Viewer'}
        tag="N-Body"
        isRunning={false}
        readouts={readouts}
        showGrid
        headerActions={
          <span
            className="text-xs font-mono px-2 py-1 rounded"
            style={{
              background: 'rgba(var(--accent-primary-rgb), 0.08)',
              color: 'var(--text-tertiary)',
              textTransform: 'none',
              letterSpacing: 0,
            }}
          >
            v0.1-dev
          </span>
        }
      >
        {/* Placeholder canvas until Three.js renderer is wired */}
        <div
          className="w-full flex items-center justify-center"
          style={{
            minHeight: 480,
            background: 'var(--bg-primary)',
            color: 'var(--text-tertiary)',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          Renderer initializing…
        </div>
      </SimulationInstrumentPanel>
    </div>
  );
}
