/**
 * AnimatedLogo — cosmic orbital mark for the site header.
 *
 * A glowing star core with two orbiting planets and a twinkling
 * sparkle, built from pure CSS animations (see globals.css,
 * "ANIMATED LOGO" section). Honors prefers-reduced-motion.
 */
interface AnimatedLogoProps {
  /**
   * Pixel size of the square logo mark. When omitted, sizing is left
   * to CSS (--logo-size, default 44px) so media queries can scale it.
   */
  size?: number;
  className?: string;
}

export function AnimatedLogo({ size, className = '' }: AnimatedLogoProps) {
  return (
    <span
      className={`cosmic-logo ${className}`}
      style={size != null ? { ['--logo-size' as string]: `${size}px` } : undefined}
      aria-hidden="true"
    >
      <span className="cosmic-logo-star" />
      <span className="cosmic-logo-orbit cosmic-logo-orbit-a">
        <span className="cosmic-logo-planet cosmic-logo-planet-a" />
      </span>
      <span className="cosmic-logo-orbit cosmic-logo-orbit-b">
        <span className="cosmic-logo-planet cosmic-logo-planet-b" />
      </span>
      <span className="cosmic-logo-sparkle" />
    </span>
  );
}

export default AnimatedLogo;
