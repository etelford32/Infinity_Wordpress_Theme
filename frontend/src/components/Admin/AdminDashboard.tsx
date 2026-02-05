import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  FaChartBar,
  FaUsers,
  FaCog,
  FaRocket,
  FaStar,
  FaTrophy,
  FaServer,
  FaShieldAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaDollarSign,
} from 'react-icons/fa';
import { useAuth, Permission } from '@lib/auth/AuthProvider';
import { apiClient } from '@lib/api/client';
import { PerformanceMetrics } from './PerformanceMetrics';
import { UserManagement } from './UserManagement';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalSimulations: number;
  simulationsToday: number;
  totalBlueprints: number;
  activeChallenges: number;
  premiumUsers: number;
  monthlyRevenue: number;
  serverStatus: 'healthy' | 'degraded' | 'down';
  pendingReports: number;
}

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  user: string;
  timestamp: string;
}

type TabId = 'overview' | 'users' | 'performance' | 'settings';

export function AdminDashboard() {
  const { hasPermission, isAdmin, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Check permission
  const canAccess = hasPermission(Permission.ACCESS_ADMIN_DASHBOARD);

  useEffect(() => {
    if (canAccess) {
      fetchDashboardData();
    }
  }, [canAccess]);

  const fetchDashboardData = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/activity'),
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data.activity || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      // Mock data for development
      setStats({
        totalUsers: 1234,
        activeUsers: 567,
        newUsersToday: 23,
        totalSimulations: 45678,
        simulationsToday: 890,
        totalBlueprints: 234,
        activeChallenges: 5,
        premiumUsers: 189,
        monthlyRevenue: 3780,
        serverStatus: 'healthy',
        pendingReports: 3,
      });
      setRecentActivity([
        {
          id: 1,
          type: 'user_signup',
          description: 'New user registered',
          user: 'john_doe',
          timestamp: '2024-02-03T10:30:00Z',
        },
        {
          id: 2,
          type: 'subscription',
          description: 'Upgraded to Premium',
          user: 'jane_smith',
          timestamp: '2024-02-03T09:15:00Z',
        },
        {
          id: 3,
          type: 'blueprint',
          description: 'Created new blueprint',
          user: 'mike_mod',
          timestamp: '2024-02-03T08:45:00Z',
        },
      ]);
    } finally {
      setLoadingStats(false);
    }
  };

  // Redirect if no access
  if (!isLoading && !canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { id: 'users', label: 'Users', icon: <FaUsers /> },
    { id: 'performance', label: 'Performance', icon: <FaServer /> },
    { id: 'settings', label: 'Settings', icon: <FaCog />, adminOnly: true },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <FaCheckCircle className="text-green-500" />;
      case 'degraded':
        return <FaExclamationTriangle className="text-yellow-500" />;
      default:
        return <FaExclamationTriangle className="text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FaShieldAlt className="w-8 h-8 text-[var(--accent-primary)]" />
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            {isAdmin ? 'Full administrative access' : 'Moderator access'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs
            .filter((tab) => !tab.adminOnly || isAdmin)
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <FaUsers className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {loadingStats ? '-' : stats?.totalUsers.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Total Users
                </h3>
                <p className="text-xs text-green-500 mt-1">
                  +{stats?.newUsersToday || 0} today
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FaRocket className="w-6 h-6 text-purple-500" />
                  </div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {loadingStats ? '-' : stats?.totalSimulations.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Simulations Run
                </h3>
                <p className="text-xs text-green-500 mt-1">
                  {stats?.simulationsToday || 0} today
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <FaStar className="w-6 h-6 text-green-500" />
                  </div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    {loadingStats ? '-' : stats?.premiumUsers.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Premium Users
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {stats
                    ? ((stats.premiumUsers / stats.totalUsers) * 100).toFixed(1)
                    : 0}
                  % conversion
                </p>
              </div>

              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <FaDollarSign className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="text-2xl font-bold text-[var(--text-primary)]">
                    ${loadingStats ? '-' : stats?.monthlyRevenue.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                  Monthly Revenue
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">This month</p>
              </div>
            </div>

            {/* Server Status & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Server Status */}
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <FaServer className="text-[var(--accent-primary)]" />
                  System Status
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <span className="text-[var(--text-secondary)]">Server Status</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`capitalize ${getStatusColor(
                          stats?.serverStatus || 'healthy'
                        )}`}
                      >
                        {stats?.serverStatus || 'Healthy'}
                      </span>
                      {getStatusIcon(stats?.serverStatus || 'healthy')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <span className="text-[var(--text-secondary)]">Active Users</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {stats?.activeUsers.toLocaleString() || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <span className="text-[var(--text-secondary)]">
                      Active Challenges
                    </span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {stats?.activeChallenges || '-'}
                    </span>
                  </div>

                  {stats?.pendingReports && stats.pendingReports > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <span className="text-yellow-500">Pending Reports</span>
                      <span className="text-yellow-500 font-bold">
                        {stats.pendingReports}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <FaChartBar className="text-[var(--accent-primary)]" />
                  Recent Activity
                </h3>

                <div className="space-y-3">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                          {activity.type === 'user_signup' && (
                            <FaUsers className="text-[var(--accent-primary)]" />
                          )}
                          {activity.type === 'subscription' && (
                            <FaStar className="text-purple-500" />
                          )}
                          {activity.type === 'blueprint' && (
                            <FaRocket className="text-blue-500" />
                          )}
                          {activity.type === 'challenge' && (
                            <FaTrophy className="text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)]">
                            {activity.description}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            @{activity.user} &bull;{' '}
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[var(--text-tertiary)] py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Performance Overview */}
            <PerformanceMetrics />
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <PerformanceMetrics refreshInterval={1000} />

            {/* Additional Performance Info */}
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Performance Optimization Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">
                    Code Splitting
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Routes are lazy-loaded to reduce initial bundle size. Consider
                    splitting large components further.
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">
                    Image Optimization
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Use WebP format and lazy loading for images. Consider using a CDN for
                    static assets.
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">
                    Caching Strategy
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    React Query handles API caching. Configure browser caching headers for
                    static assets.
                  </p>
                </div>
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">
                    Three.js Optimization
                  </h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Use LOD (Level of Detail), frustum culling, and object pooling for
                    better 3D performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <FaCog className="text-[var(--accent-primary)]" />
              System Settings
            </h3>
            <p className="text-[var(--text-secondary)]">
              System settings are managed through WordPress admin panel.
            </p>
            <a
              href="/wp-admin"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
            >
              Open WordPress Admin
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
