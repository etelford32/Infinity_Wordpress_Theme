import { Link } from 'react-router-dom';
import { FaRocket } from 'react-icons/fa';
import { useAuth } from '@lib/auth/AuthProvider';
import { UserDashboard } from '@components/User/UserDashboard';

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const wpLoginUrl = (window as any).infinityData?.loginUrl || '/wp-login.php';

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] flex items-center justify-center mb-6">
          <FaRocket className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Your Dashboard</h1>
        <p className="text-[var(--color-text-secondary,#b8c0d4)] mb-8 max-w-md">
          Sign in to see your simulation stats, recent activity, and quick actions.
        </p>
        <div className="flex gap-3">
          <a
            href={wpLoginUrl}
            className="px-8 py-3 bg-[var(--color-accent-primary,#6366f1)] text-white rounded-lg font-medium hover:opacity-90 transition-colors"
          >
            Log In
          </a>
          <Link
            to="/simulations"
            className="px-8 py-3 border border-[var(--color-bg-tertiary,#1e2330)] text-[var(--color-text-secondary,#b8c0d4)] rounded-lg font-medium hover:border-[var(--color-accent-primary,#6366f1)] transition-colors"
          >
            Browse as Guest
          </Link>
        </div>
      </div>
    );
  }

  return <UserDashboard showWelcome={true} />;
}
