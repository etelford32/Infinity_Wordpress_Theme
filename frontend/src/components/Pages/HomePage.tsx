export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold mb-6 text-[var(--accent-primary)]">
        Welcome to Infinity
      </h1>
      <p className="text-2xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
        Explore the cosmos through interactive astrophysical simulations.
        Create, learn, and discover.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/simulations"
          className="px-8 py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
        >
          Explore Simulations
        </a>
        <a
          href="/pricing"
          className="px-8 py-3 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
        >
          Get Premium
        </a>
      </div>
    </div>
  );
}
