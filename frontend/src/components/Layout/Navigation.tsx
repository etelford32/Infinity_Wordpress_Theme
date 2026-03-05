import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme, THEMES } from '@lib/theme/ThemeProvider';

/* ============================================================
   NAV STRUCTURE
   The site spans four domains. Each top-level group opens a
   dropdown with contextual links and a short description.
   ============================================================ */

interface NavItem {
  label: string;
  href: string;
  icon: string;
  description: string;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Science',
    icon: '⚛',
    items: [
      {
        label: 'Simulations',
        href: '/simulations',
        icon: '🪐',
        description: 'Interactive astrophysical models',
      },
      {
        label: 'Blueprints',
        href: '/blueprints',
        icon: '📐',
        description: 'Build & share sim configurations',
      },
      {
        label: 'Challenges',
        href: '/challenges',
        icon: '🏆',
        description: 'Community physics puzzles',
      },
    ],
  },
  {
    label: 'Create',
    icon: '⚡',
    items: [
      {
        label: 'Game Dev',
        href: '/create/gamedev',
        icon: '🎮',
        description: 'Devlogs, tools & experiments',
      },
      {
        label: 'Music',
        href: '/create/music',
        icon: '🎵',
        description: 'Generative audio & compositions',
      },
    ],
  },
  {
    label: 'Wellness',
    icon: '✦',
    items: [
      {
        label: 'Yoga',
        href: '/wellness/yoga',
        icon: '🧘',
        description: 'Sequences, guides & reflections',
      },
    ],
  },
  {
    label: 'Community',
    icon: '◎',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
        description: 'Your activity & progress',
      },
      {
        label: 'Pricing',
        href: '/pricing',
        icon: '✦',
        description: 'Explorer & Cosmic tiers',
      },
    ],
  },
];

/* ============================================================
   THEME PICKER
   ============================================================ */
function ThemePicker() {
  const { theme, themeConfig, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
        style={{
          color: 'var(--text-secondary)',
          background: open ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'transparent',
        }}
        aria-label="Switch theme"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{themeConfig.icon}</span>
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-xl p-2 shadow-xl z-50 animate-fade-in"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          }}
        >
          <p
            className="px-3 pb-2 pt-1 text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Appearance
          </p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-100"
              style={{
                color: t.id === theme ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: t.id === theme ? 'rgba(var(--accent-primary-rgb), 0.09)' : 'transparent',
              }}
            >
              <span className="text-lg leading-none flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">{t.label}</div>
                <div
                  className="text-xs leading-tight mt-0.5 truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {t.description}
                </div>
              </div>
              {t.id === theme && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="flex-shrink-0"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <path d="M2 7l4 4 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MOBILE MENU TOGGLE
   ============================================================ */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M4 4l12 12M16 4L4 16" />
        </>
      ) : (
        <>
          <path d="M3 5h14M3 10h14M3 15h14" />
        </>
      )}
    </svg>
  );
}

/* ============================================================
   MAIN NAVIGATION
   ============================================================ */
export function Navigation() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(href);

  return (
    <nav className="nav-root" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group flex-shrink-0"
            aria-label="Infinity home"
          >
            <span
              className="text-2xl font-black tracking-tight leading-none transition-colors duration-150"
              style={{ color: 'var(--accent-primary)' }}
            >
              ∞
            </span>
            <span
              className="text-base font-semibold tracking-tight hidden sm:block transition-colors duration-150"
              style={{ color: 'var(--text-primary)' }}
            >
              Infinity
            </span>
          </Link>

          {/* Desktop Nav Groups */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="nav-group">
                <button
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)';
                    (e.currentTarget as HTMLElement).style.background =
                      'rgba(var(--accent-primary-rgb), 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span className="text-sm leading-none opacity-70">{group.icon}</span>
                  {group.label}
                  <svg
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="opacity-50"
                  >
                    <path
                      d="M1 1l4 4 4-4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Dropdown */}
                <div className="nav-dropdown">
                  <div className="nav-dropdown-label">{group.label}</div>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="nav-dropdown-item"
                      style={
                        isActive(item.href)
                          ? {
                              color: 'var(--accent-primary)',
                              background: 'rgba(var(--accent-primary-rgb), 0.08)',
                            }
                          : {}
                      }
                    >
                      <span className="item-icon">{item.icon}</span>
                      <div>
                        <div className="font-medium leading-tight">{item.label}</div>
                        <div
                          className="text-xs leading-tight mt-0.5"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          {item.description}
                        </div>
                      </div>
                      {isActive(item.href) && (
                        <div
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--accent-primary)' }}
                        />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemePicker />

            <Link
              to="/pricing"
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 hover:scale-105"
              style={{
                background: 'var(--accent-primary)',
                color: '#fff',
              }}
            >
              Upgrade
            </Link>

            {/* Mobile hamburger */}
            <button
              className="flex md:hidden items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t animate-slide-down"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div
                  className="flex items-center gap-2 px-1 pb-1.5 text-xs font-semibold tracking-widest uppercase"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <span>{group.icon}</span>
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-100"
                      style={{
                        color: isActive(item.href)
                          ? 'var(--accent-primary)'
                          : 'var(--text-secondary)',
                        background: isActive(item.href)
                          ? 'rgba(var(--accent-primary-rgb), 0.08)'
                          : 'transparent',
                      }}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div
              className="pt-3 border-t"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <Link
                to="/pricing"
                className="flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}
              >
                Upgrade to Cosmic Explorer
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
