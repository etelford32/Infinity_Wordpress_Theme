export default function NotFoundPage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl text-[var(--text-secondary)]">Page not found</p>
      <a href="/" className="text-[var(--accent-primary)] hover:underline mt-4 inline-block">
        Go home
      </a>
    </div>
  );
}
