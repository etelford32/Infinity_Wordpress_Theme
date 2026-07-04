import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { AnimatedLogo } from '@components/UI/AnimatedLogo';

const SITE_NAME = window.infinityData?.siteName || 'Elliot Telford';

export function Layout() {
  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <Navigation />

      {/* Offset for fixed nav bar (h-16 mobile, h-20 desktop) */}
      <main className="pt-16 lg:pt-20 min-h-screen">
        <div className="max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <footer
        className="border-t py-8 px-6"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AnimatedLogo size={28} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {SITE_NAME} — explore, create, discover
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            &copy; {new Date().getFullYear()} {SITE_NAME} &middot; Co-authored with Claude
            &middot; Built with Three.js
          </p>
        </div>
      </footer>
    </div>
  );
}
