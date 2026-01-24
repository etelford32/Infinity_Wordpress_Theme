import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Header will be added in next phase */}
      <header className="border-b border-[var(--bg-tertiary)] py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--accent-primary)]">
            ∞ Infinity
          </h1>
          <nav className="flex gap-6">
            <a
              href="/simulations"
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              Simulations
            </a>
            <a
              href="/blueprints"
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              Blueprints
            </a>
            <a
              href="/challenges"
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
            >
              Challenges
            </a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-8 px-6">
        <Outlet />
      </main>

      {/* Footer will be added in next phase */}
      <footer className="border-t border-[var(--bg-tertiary)] py-6 px-6 mt-auto">
        <div className="container mx-auto text-center text-[var(--text-tertiary)] text-sm">
          <p>&copy; {new Date().getFullYear()} Infinity Theme. Built with ❤️ and Three.js</p>
        </div>
      </footer>
    </div>
  );
}
