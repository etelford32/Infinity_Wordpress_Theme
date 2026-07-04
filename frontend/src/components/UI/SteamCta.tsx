/**
 * SteamCta — the primary conversion action for the site.
 *
 * The URL and label are set in WordPress under
 * Appearance → Customize → Steam Promotion and arrive via
 * window.infinityData. Falls back to the Steam storefront until
 * a real store URL is configured.
 */
export const STEAM_URL: string =
  window.infinityData?.steamUrl ||
  'https://store.steampowered.com/app/4094340/Explore_the_Universe_2175/';

export const STEAM_LABEL: string =
  window.infinityData?.steamLabel || 'Explore the Universe';

/** Simplified Steam piston mark. */
export function SteamIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15.5" cy="8.5" r="3.1" fill="currentColor" />
      <circle cx="7.5" cy="16.5" r="2.1" fill="currentColor" />
      <path
        d="M9.2 15.1l4.1-4.1"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SteamCtaProps {
  large?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SteamCta({ large = false, className = '', children }: SteamCtaProps) {
  return (
    <a
      href={STEAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`steam-cta ${large ? 'steam-cta-large' : ''} ${className}`}
    >
      <SteamIcon size={large ? 22 : 18} />
      {children ?? STEAM_LABEL}
    </a>
  );
}

export default SteamCta;
