import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  FaHome,
  FaRocket,
  FaCubes,
  FaTrophy,
  FaTachometerAlt,
  FaUser,
  FaCrown,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaShieldAlt,
} from 'react-icons/fa';
import { useAuth } from '@lib/auth/AuthProvider';

const navLinks = [
  { to: '/simulations', label: 'Simulations', icon: FaRocket },
  { to: '/blueprints', label: 'Blueprints', icon: FaCubes },
  { to: '/challenges', label: 'Challenges', icon: FaTrophy },
  { to: '/pricing', label: 'Pricing', icon: FaCrown },
];

const mobileNavLinks = [
  { to: '/', label: 'Home', icon: FaHome },
  { to: '/simulations', label: 'Explore', icon: FaRocket },
  { to: '/challenges', label: 'Challenges', icon: FaTrophy },
  { to: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
  { to: '/account', label: 'Account', icon: FaUser },
];

export function Layout() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Sticky header scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const wpLoginUrl = (window as any).infinityData?.loginUrl || '/wp-login.php';
  const wpLogoutUrl = (window as any).infinityData?.logoutUrl || '/wp-login.php?action=logout';

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary,var(--bg-primary,#0a0e1a))] text-[var(--color-text-primary,var(--text-primary,#fff))] flex flex-col">
      {/* ===== TOP HEADER ===== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--color-bg-secondary,#141824)]/95 backdrop-blur-lg shadow-lg border-b border-[var(--color-bg-tertiary,#1e2330)]'
            : 'bg-[var(--color-bg-secondary,#141824)] border-b border-[var(--color-bg-tertiary,#1e2330)]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] bg-clip-text text-transparent">
              &#8734; Infinity
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--color-accent-primary,#6366f1)]/15 text-[var(--color-accent-primary,#6366f1)]'
                      : 'text-[var(--color-text-secondary,#b8c0d4)] hover:text-[var(--color-text-primary,#fff)] hover:bg-[var(--color-bg-tertiary,#1e2330)]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side: User Menu or Login */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] flex items-center justify-center flex-shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <FaUser className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                    {user.displayName || user.username}
                  </span>
                  {user.isPremium && (
                    <FaCrown className="w-3.5 h-3.5 text-yellow-500 hidden lg:block" />
                  )}
                  <FaChevronDown className={`w-3 h-3 text-[var(--color-text-tertiary,#7a8199)] transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--color-bg-secondary,#141824)] border border-[var(--color-bg-tertiary,#1e2330)] rounded-xl shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-[var(--color-bg-tertiary,#1e2330)]/50">
                      <p className="font-semibold truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary,#7a8199)] truncate">{user.email}</p>
                      {user.isPremium && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-semibold rounded-full">
                          <FaCrown className="w-3 h-3" /> Premium
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors">
                        <FaTachometerAlt className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors">
                        <FaUser className="w-4 h-4" /> My Account
                      </Link>
                      <Link to="/account/subscription" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors">
                        <FaCrown className="w-4 h-4" /> Subscription
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors">
                          <FaShieldAlt className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-[var(--color-bg-tertiary,#1e2330)] py-1">
                      <a href={wpLogoutUrl} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors">
                        <FaSignOutAlt className="w-4 h-4" /> Sign Out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <a href={wpLoginUrl} className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary,#b8c0d4)] hover:text-[var(--color-text-primary,#fff)] transition-colors">
                  Log In
                </a>
                <a href={`${wpLoginUrl}?action=register`} className="px-4 py-2 text-sm font-medium bg-[var(--color-accent-primary,#6366f1)] text-white rounded-lg hover:opacity-90 transition-colors">
                  Sign Up
                </a>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-tertiary,#1e2330)] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE SLIDE-OVER MENU ===== */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-72 bg-[var(--color-bg-secondary,#141824)] border-l border-[var(--color-bg-tertiary,#1e2330)] z-50 md:hidden overflow-y-auto">
            <div className="p-4 pt-20 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent-primary,#6366f1)]/15 text-[var(--color-accent-primary,#6366f1)]'
                        : 'text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" /> {label}
                </NavLink>
              ))}
              <div className="border-t border-[var(--color-bg-tertiary,#1e2330)] my-3" />
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-[var(--color-accent-primary,#6366f1)]/15 text-[var(--color-accent-primary,#6366f1)]' : 'text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)]'}`}>
                    <FaTachometerAlt className="w-5 h-5" /> Dashboard
                  </NavLink>
                  <NavLink to="/account" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-[var(--color-accent-primary,#6366f1)]/15 text-[var(--color-accent-primary,#6366f1)]' : 'text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)]'}`}>
                    <FaUser className="w-5 h-5" /> My Account
                  </NavLink>
                  {isAdmin && (
                    <NavLink to="/admin" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-[var(--color-accent-primary,#6366f1)]/15 text-[var(--color-accent-primary,#6366f1)]' : 'text-[var(--color-text-secondary,#b8c0d4)] hover:bg-[var(--color-bg-tertiary,#1e2330)]'}`}>
                      <FaShieldAlt className="w-5 h-5" /> Admin Panel
                    </NavLink>
                  )}
                </>
              ) : (
                <div className="space-y-2 px-4">
                  <a href={wpLoginUrl} className="block w-full py-3 text-center font-medium text-[var(--color-text-secondary,#b8c0d4)] border border-[var(--color-bg-tertiary,#1e2330)] rounded-lg">Log In</a>
                  <a href={`${wpLoginUrl}?action=register`} className="block w-full py-3 text-center font-medium bg-[var(--color-accent-primary,#6366f1)] text-white rounded-lg">Sign Up</a>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 pt-16 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto py-6 px-4 lg:px-6">
          <Outlet />
        </div>
      </main>

      {/* ===== DESKTOP FOOTER ===== */}
      <footer className="hidden md:block border-t border-[var(--color-bg-tertiary,#1e2330)] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[var(--color-text-tertiary,#7a8199)] text-sm">
          <p>&copy; {new Date().getFullYear()} Infinity. Built with Three.js</p>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-[var(--color-accent-primary,#6366f1)] transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>

      {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg-secondary,#141824)]/95 backdrop-blur-lg border-t border-[var(--color-bg-tertiary,#1e2330)] z-40 md:hidden safe-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNavLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[56px] rounded-lg transition-colors ${
                  isActive
                    ? 'text-[var(--color-accent-primary,#6366f1)]'
                    : 'text-[var(--color-text-tertiary,#7a8199)]'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
