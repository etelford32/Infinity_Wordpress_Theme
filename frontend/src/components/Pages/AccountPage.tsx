import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  FaUser,
  FaCrown,
  FaCog,
  FaBell,
  FaShieldAlt,
  FaPalette,
  FaSignOutAlt,
  FaArrowLeft,
  FaCheckCircle,
} from 'react-icons/fa';
import { useAuth } from '@lib/auth/AuthProvider';
import { UserProfile } from '@components/User/UserProfile';
import { SubscriptionManager } from '@components/Subscription/SubscriptionManager';
import { apiClient } from '@lib/api/client';

type AccountTab = 'profile' | 'subscription' | 'settings';

const tabs: { id: AccountTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'subscription', label: 'Subscription', icon: FaCrown },
  { id: 'settings', label: 'Settings', icon: FaCog },
];

export default function AccountPage() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL
  const getTabFromPath = (): AccountTab => {
    if (location.pathname.includes('/subscription')) return 'subscription';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<AccountTab>(getTabFromPath);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState(true);
  const [theme, setTheme] = useState(() => document.body.getAttribute('data-theme') || 'dark-cosmic');
  const [notifications, setNotifications] = useState({
    email_simulations: true,
    email_challenges: true,
    email_blueprints: false,
    email_newsletter: true,
  });

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  // Fetch subscription data
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSubscription();
  }, [isAuthenticated]);

  const fetchSubscription = async () => {
    setLoadingSub(true);
    try {
      const res = await apiClient.get('/subscriptions/current');
      setSubscription(res.data.subscription || null);
      setPaymentMethod(res.data.paymentMethod || null);
    } catch {
      // No subscription or not authenticated
      setSubscription(null);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleTabChange = (tab: AccountTab) => {
    setActiveTab(tab);
    const path = tab === 'profile' ? '/account' : `/account/${tab}`;
    navigate(path, { replace: true });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    try {
      localStorage.setItem('infinity-theme', newTheme);
    } catch {}
  };

  const wpLoginUrl = (window as any).infinityData?.loginUrl || '/wp-login.php';

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] flex items-center justify-center mb-6">
          <FaUser className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Sign in to your account</h1>
        <p className="text-[var(--color-text-secondary,#b8c0d4)] mb-8 max-w-md">
          Access your profile, manage your subscription, and track your simulation history.
        </p>
        <div className="flex gap-3">
          <a
            href={wpLoginUrl}
            className="px-8 py-3 bg-[var(--color-accent-primary,#6366f1)] text-white rounded-lg font-medium hover:opacity-90 transition-colors"
          >
            Log In
          </a>
          <a
            href={`${wpLoginUrl}?action=register`}
            className="px-8 py-3 border border-[var(--color-bg-tertiary,#1e2330)] text-[var(--color-text-secondary,#b8c0d4)] rounded-lg font-medium hover:border-[var(--color-accent-primary,#6366f1)] transition-colors"
          >
            Create Account
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors md:hidden">
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Account</h1>
          <p className="text-sm text-[var(--color-text-tertiary,#7a8199)]">
            Manage your profile, subscription, and preferences
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-[var(--color-bg-secondary,#141824)] rounded-xl p-1 border border-[var(--color-bg-tertiary,#1e2330)]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-[var(--color-accent-primary,#6366f1)] text-white shadow-md'
                : 'text-[var(--color-text-secondary,#b8c0d4)] hover:text-[var(--color-text-primary,#fff)] hover:bg-[var(--color-bg-tertiary,#1e2330)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && <UserProfile />}

        {/* ===== SUBSCRIPTION TAB ===== */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {loadingSub ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[var(--color-accent-primary,#6366f1)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[var(--color-text-secondary,#b8c0d4)]">Loading subscription...</p>
                </div>
              </div>
            ) : subscription ? (
              <SubscriptionManager
                subscription={subscription}
                paymentMethod={paymentMethod}
                onUpdate={fetchSubscription}
              />
            ) : (
              /* No Subscription - Upsell */
              <div className="bg-[var(--color-bg-secondary,#141824)] rounded-xl border border-[var(--color-bg-tertiary,#1e2330)] overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] p-8 text-center">
                  <FaCrown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
                  <p className="text-white/80 max-w-md mx-auto">
                    Unlock unlimited simulations, exclusive blueprints, and premium features.
                  </p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3 mb-6">
                    {[
                      'Unlimited simulation runs per day',
                      'Access to all premium simulations',
                      'Create and publish unlimited blueprints',
                      'Priority support',
                      'Early access to new features',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-[var(--color-text-secondary,#b8c0d4)]">
                        <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/pricing"
                    className="block w-full py-3 text-center bg-[var(--color-accent-primary,#6366f1)] text-white rounded-lg font-medium hover:opacity-90 transition-colors"
                  >
                    View Pricing Plans
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Theme Settings */}
            <div className="bg-[var(--color-bg-secondary,#141824)] rounded-xl border border-[var(--color-bg-tertiary,#1e2330)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaPalette className="w-5 h-5 text-[var(--color-accent-primary,#6366f1)]" />
                <h3 className="text-lg font-bold">Appearance</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'dark-cosmic', label: 'Dark Cosmic', colors: ['#0a0e1a', '#6366f1', '#8b5cf6'] },
                  { id: 'light-playful', label: 'Light Playful', colors: ['#fef3f2', '#f472b6', '#fb923c'] },
                  { id: 'science-light', label: 'Science Light', colors: ['#f8fafc', '#3b82f6', '#06b6d4'] },
                  { id: 'science-dark', label: 'Science Dark', colors: ['#0f172a', '#60a5fa', '#22d3ee'] },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      theme === t.id
                        ? 'border-[var(--color-accent-primary,#6366f1)] shadow-md'
                        : 'border-[var(--color-bg-tertiary,#1e2330)] hover:border-[var(--color-bg-tertiary,#1e2330)]/80'
                    }`}
                  >
                    <div className="flex gap-1 mb-2">
                      {t.colors.map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{t.label}</span>
                    {theme === t.id && (
                      <FaCheckCircle className="absolute top-2 right-2 w-4 h-4 text-[var(--color-accent-primary,#6366f1)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-[var(--color-bg-secondary,#141824)] rounded-xl border border-[var(--color-bg-tertiary,#1e2330)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaBell className="w-5 h-5 text-[var(--color-accent-primary,#6366f1)]" />
                <h3 className="text-lg font-bold">Notifications</h3>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'email_simulations', label: 'New simulation recommendations' },
                  { key: 'email_challenges', label: 'New challenges available' },
                  { key: 'email_blueprints', label: 'Blueprint votes and forks' },
                  { key: 'email_newsletter', label: 'Newsletter and updates' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm text-[var(--color-text-secondary,#b8c0d4)]">{label}</span>
                    <button
                      onClick={() => setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        notifications[key as keyof typeof notifications]
                          ? 'bg-[var(--color-accent-primary,#6366f1)]'
                          : 'bg-[var(--color-bg-tertiary,#1e2330)]'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          notifications[key as keyof typeof notifications] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-[var(--color-bg-secondary,#141824)] rounded-xl border border-[var(--color-bg-tertiary,#1e2330)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaShieldAlt className="w-5 h-5 text-[var(--color-accent-primary,#6366f1)]" />
                <h3 className="text-lg font-bold">Security</h3>
              </div>
              <div className="space-y-3">
                <a
                  href="/wp-admin/profile.php"
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary,#1e2330)] rounded-lg hover:opacity-80 transition-opacity"
                >
                  <span className="text-sm font-medium">Change Password</span>
                  <span className="text-[var(--color-text-tertiary,#7a8199)]">&rarr;</span>
                </a>
                <a
                  href="/wp-admin/profile.php"
                  className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary,#1e2330)] rounded-lg hover:opacity-80 transition-opacity"
                >
                  <span className="text-sm font-medium">Manage Email</span>
                  <span className="text-[var(--color-text-tertiary,#7a8199)]">&rarr;</span>
                </a>
              </div>
            </div>

            {/* Sign Out */}
            <a
              href={(window as any).infinityData?.logoutUrl || '/wp-login.php?action=logout'}
              className="flex items-center justify-center gap-2 w-full py-3 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg font-medium transition-colors"
            >
              <FaSignOutAlt className="w-4 h-4" /> Sign Out
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
