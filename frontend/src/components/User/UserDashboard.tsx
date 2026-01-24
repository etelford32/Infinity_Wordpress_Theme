import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaRocket,
  FaChartLine,
  FaClock,
  FaHeart,
  FaTrophy,
  FaFire,
  FaStar,
} from 'react-icons/fa';
import { useAuth } from '@context/AuthContext';
import { apiClient } from '@lib/api';

interface UserStats {
  totalSimulations: number;
  totalTime: number; // in seconds
  blueprintsCreated: number;
  blueprintsLiked: number;
  achievementsUnlocked: number;
  currentStreak: number;
  longestStreak: number;
  favoriteSimulation?: string;
  rank?: string;
}

interface RecentActivity {
  id: string;
  type: 'simulation' | 'blueprint' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

interface UserDashboardProps {
  showWelcome?: boolean;
}

export function UserDashboard({ showWelcome = true }: UserDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiClient.get('/users/stats'),
        apiClient.get('/users/activity'),
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.displayName || 'Explorer'}! 👋
          </h1>
          <p className="text-white/90">
            Ready to continue your cosmic journey?
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
                {formatTime(stats.totalTime)}
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
              Day Streak 🔥
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
            <Link
              to="/activity"
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              View all
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:opacity-90 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                    {activity.type === 'simulation' && (
                      <FaRocket className="w-5 h-5 text-[var(--accent-primary)]" />
                    )}
                    {activity.type === 'blueprint' && (
                      <FaStar className="w-5 h-5 text-[var(--accent-primary)]" />
                    )}
                    {activity.type === 'achievement' && (
                      <FaTrophy className="w-5 h-5 text-[var(--accent-primary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-1">
                      {activity.description}
                    </p>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatTimeAgo(activity.timestamp)}
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
                className="block w-full px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:opacity-80 transition-colors text-center font-medium"
              >
                Create Blueprint
              </Link>
              <Link
                to="/challenges"
                className="block w-full px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] hover:opacity-80 transition-colors text-center font-medium"
              >
                View Challenges
              </Link>
            </div>
          </div>

          {/* Achievements Preview */}
          {stats && stats.achievementsUnlocked > 0 && (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FaTrophy className="w-5 h-5 text-yellow-500" />
                  Achievements
                </h2>
                <Link
                  to="/achievements"
                  className="text-sm text-[var(--accent-primary)] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-[var(--text-primary)]">
                    {stats.achievementsUnlocked}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Unlocked
                  </p>
                </div>
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <FaTrophy className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          )}

          {/* User Rank */}
          {stats?.rank && (
            <div className="bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <FaStar className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">Your Rank</h3>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.rank}
              </div>
              <p className="text-white/80 text-sm">
                Keep exploring to rank up!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
