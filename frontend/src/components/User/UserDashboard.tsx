import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRocket,
  FaChartLine,
  FaClock,
  FaTrophy,
  FaFire,
  FaStar,
  FaPlay,
  FaCodeBranch,
  FaThumbsUp,
  FaFlag,
  FaAward,
  FaCreditCard,
  FaSignInAlt,
} from 'react-icons/fa';
import { useAuth } from '@lib/auth/AuthProvider';
import { apiClient } from '@lib/api/client';

interface UserStats {
  totalSimulations: number;
  totalDuration: number;
  totalDurationFormatted: string;
  uniqueSimulations: number;
  lastSession: string | null;
  blueprintsCreated: number;
  challengesCompleted: number;
  currentStreak: number;
  simulationsToday: number;
  remainingToday: number;
  subscriptionStatus: string;
  isPremium: boolean;
}

interface Activity {
  id: number;
  type: string;
  objectType: string | null;
  objectId: number | null;
  objectTitle: string | null;
  data: Record<string, unknown> | null;
  createdAt: string;
  timeAgo: string;
  icon: string;
  description: string;
}

interface UserDashboardProps {
  showWelcome?: boolean;
}

const activityIcons: Record<string, React.ReactNode> = {
  'simulation_started': <FaPlay className="w-5 h-5 text-blue-500" />,
  'simulation_completed': <FaRocket className="w-5 h-5 text-green-500" />,
  'blueprint_created': <FaStar className="w-5 h-5 text-purple-500" />,
  'blueprint_forked': <FaCodeBranch className="w-5 h-5 text-cyan-500" />,
  'blueprint_voted': <FaThumbsUp className="w-5 h-5 text-yellow-500" />,
  'challenge_started': <FaFlag className="w-5 h-5 text-orange-500" />,
  'challenge_completed': <FaAward className="w-5 h-5 text-amber-500" />,
  'subscription_started': <FaCreditCard className="w-5 h-5 text-green-500" />,
  'subscription_canceled': <FaCreditCard className="w-5 h-5 text-red-500" />,
  'login': <FaSignInAlt className="w-5 h-5 text-gray-500" />,
};

export function UserDashboard({ showWelcome = true }: UserDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiClient.get('/users/stats'),
        apiClient.get('/users/activity', { params: { limit: 10 } }),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data.activity || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.displayName || 'Explorer'}!
          </h1>
          <p className="text-white/90">
            {stats?.isPremium
              ? 'Enjoy unlimited cosmic exploration as a Premium member!'
              : `You have ${stats?.remainingToday ?? 0} simulation${(stats?.remainingToday ?? 0) !== 1 ? 's' : ''} remaining today.`
            }
          </p>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Simulations */}
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FaRocket className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {stats.totalSimulations}
              </span>
            </div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Simulations Run
            </h3>
          </div>

          {/* Total Time */}
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FaClock className="w-6 h-6 text-purple-500" />
              </div>
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {stats.totalDurationFormatted || formatTime(stats.totalDuration)}
              </span>
            </div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Time Exploring
            </h3>
          </div>

          {/* Blueprints Created */}
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FaStar className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {stats.blueprintsCreated}
              </span>
            </div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Blueprints Created
            </h3>
          </div>

          {/* Current Streak */}
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FaFire className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {stats.currentStreak}
              </span>
            </div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">
              Day Streak
            </h3>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FaChartLine className="w-5 h-5" />
              Recent Activity
            </h2>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0">
                    {activityIcons[activity.type] || (
                      <FaChartLine className="w-5 h-5 text-[var(--accent-primary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] mb-1">
                      {activity.description}
                    </p>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {activity.timeAgo} ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaChartLine className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--text-secondary)]">
                No recent activity yet. Start exploring!
              </p>
              <Link
                to="/simulations"
                className="inline-block mt-4 px-6 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
              >
                Browse Simulations
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/simulations"
                className="block w-full px-4 py-3 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors text-center font-medium"
              >
                Browse Simulations
              </Link>
              <Link
                to="/blueprints/create"
                className="block w-full px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-colors text-center font-medium"
              >
                Create Blueprint
              </Link>
              <Link
                to="/challenges"
                className="block w-full px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:opacity-80 transition-colors text-center font-medium"
              >
                View Challenges
              </Link>
            </div>
          </div>

          {/* Challenges Completed */}
          {stats && stats.challengesCompleted > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FaTrophy className="w-5 h-5 text-yellow-500" />
                  Challenges
                </h2>
                <Link
                  to="/challenges"
                  className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">
                    {stats.challengesCompleted}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Completed
                  </p>
                </div>
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <FaTrophy className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* Subscription Status */}
          {stats && (
            <div className={`rounded-xl p-6 ${
              stats.isPremium
                ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]'
                : 'bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)]'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <FaStar className={`w-6 h-6 ${stats.isPremium ? 'text-white' : 'text-[var(--accent-primary)]'}`} />
                <h3 className={`text-lg font-bold ${stats.isPremium ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                  {stats.isPremium ? 'Premium Member' : 'Free Tier'}
                </h3>
              </div>
              <p className={`text-sm ${stats.isPremium ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                {stats.isPremium
                  ? 'Unlimited simulations & premium features'
                  : `${stats.remainingToday} runs remaining today`
                }
              </p>
              {!stats.isPremium && (
                <Link
                  to="/pricing"
                  className="inline-block mt-3 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors text-sm font-medium"
                >
                  Upgrade to Premium
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
