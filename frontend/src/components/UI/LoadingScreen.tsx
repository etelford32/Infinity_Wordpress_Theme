export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cosmic-bg-primary">
      <div className="text-center">
        <div className="spinner w-16 h-16 mx-auto mb-4"></div>
        <p className="text-cosmic-text-secondary text-lg">Loading...</p>
      </div>
    </div>
  );
}
