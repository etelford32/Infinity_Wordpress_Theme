/**
 * AnimatedLogo — the ET orbital mark.
 *
 * ET monogram core with planets traveling tilted elliptical orbital
 * paths, built from pure CSS animations (see globals.css, "ANIMATED
 * LOGO" section). Honors prefers-reduced-motion.
 */
interface AnimatedLogoProps {
  /**
   * Pixel size of the square logo mark. When omitted, sizing is left
   * to CSS (--logo-size, default 44px) so media queries can scale it.
   */
  size?: number;
  monogram?: string;
  className?: string;
}

export function AnimatedLogo({ size, monogram = 'ET', className = '' }: AnimatedLogoProps) {
  return (
    <span
      className={`cosmic-logo ${className}`}
      style={size != null ? { ['--logo-size' as string]: `${size}px` } : undefined}
      aria-hidden="true"
    >
      <span className="cosmic-logo-monogram">{monogram}</span>
      <span className="cosmic-orbit cosmic-orbit-a">
        <span className="cosmic-orbit-ring" />
        <span className="cosmic-orbiter" />
      </span>
      <span className="cosmic-orbit cosmic-orbit-b">
        <span className="cosmic-orbit-ring" />
        <span className="cosmic-orbiter" />
      </span>
      <span className="cosmic-logo-sparkle" />
    </span>
  );
}

export default AnimatedLogo;
