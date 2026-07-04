import { AnimatedLogo } from '@components/UI/AnimatedLogo';
import { SteamCta, STEAM_LABEL } from '@components/UI/SteamCta';

export default function HomePage() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
      {/* Hero */}
      <section className="text-center xl:text-left py-12 xl:py-20">
        <div className="flex justify-center xl:justify-start mb-8">
          <AnimatedLogo size={96} />
        </div>
        <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-[var(--accent-primary)]">
          Explore the cosmos
        </h1>
        <p className="text-xl lg:text-2xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto xl:mx-0">
          Interactive astrophysical simulations, a living galaxy to play in,
          and tools to create and discover.
        </p>
        <div className="flex flex-wrap gap-4 justify-center xl:justify-start">
          <SteamCta large className="sm:w-auto">
            {STEAM_LABEL} — Play on Steam
          </SteamCta>
          <a
            href="/simulations"
            className="px-8 py-3 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
          >
            Explore Simulations
          </a>
        </div>
      </section>

      {/* Right rail — primary converter lives here */}
      <aside className="space-y-6 xl:sticky xl:top-24" aria-label="Featured">
        <div className="home-rail-card home-rail-card-glow">
          <span className="home-rail-badge">Now on Steam</span>
          <h2 className="text-2xl font-bold mt-4 mb-2 text-[var(--text-primary)]">
            {STEAM_LABEL}
          </h2>
          <p className="text-sm leading-relaxed mb-6 text-[var(--text-secondary)]">
            The space exploration game behind this site. Journey across a
            living galaxy, powered by the same physics you can experiment
            with right here.
          </p>
          <SteamCta large>View on Steam</SteamCta>
          <p className="text-xs mt-3 text-center text-[var(--text-tertiary)]">
            Wishlist &amp; follow to support development
          </p>
        </div>

        <div className="home-rail-card">
          <h3 className="text-sm font-semibold tracking-widest uppercase mb-3 text-[var(--text-tertiary)]">
            Start exploring
          </h3>
          <nav className="space-y-2 text-sm">
            <a href="/simulations" className="block text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
              🪐 Interactive simulations
            </a>
            <a href="/blueprints" className="block text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
              📐 Community blueprints
            </a>
            <a href="/challenges" className="block text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
              🏆 Physics challenges
            </a>
          </nav>
        </div>
      </aside>
    </div>
  );
}
