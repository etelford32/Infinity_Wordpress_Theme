import { ReactNode } from 'react';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: {
    name: string;
    included: boolean;
    value?: string | number;
  }[];
  highlighted?: boolean;
  buttonText?: string;
  stripePriceId?: string;
}

interface PricingCardProps {
  tier: PricingTier;
  currentTier?: string;
  onSelect: (tierId: string) => void;
  loading?: boolean;
  customButton?: ReactNode;
}

function CheckIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--accent-primary)', flexShrink: 0 }}
    >
      <path d="M2 7.5l4 4 7-7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ opacity: 0.22, color: 'var(--text-tertiary)', flexShrink: 0 }}
    >
      <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" />
    </svg>
  );
}

function CurrentBadge() {
  return (
    <div className="absolute top-4 right-4 z-10">
      <span
        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: '#10b981', color: '#fff' }}
      >
        Current plan
      </span>
    </div>
  );
}

interface CardContentProps {
  tier: PricingTier;
  isFree: boolean;
  isCurrentTier: boolean;
  loading: boolean;
  highlighted: boolean;
  customButton?: ReactNode;
  onSelect: (id: string) => void;
}

function CardContent({
  tier,
  isFree,
  isCurrentTier,
  loading,
  highlighted,
  customButton,
  onSelect,
}: CardContentProps) {
  return (
    <div className="flex flex-col flex-1 p-7 pt-10">
      {/* Header */}
      <div className="mb-5">
        <h3
          className="text-xl font-bold mb-1.5 leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {tier.name}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {tier.description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-6">
        {isFree ? (
          <div
            className="text-4xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Free
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-4xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              ${tier.price}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              /{tier.interval}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mb-5 h-px" style={{ background: 'var(--glass-border)' }} aria-hidden />

      {/* Features */}
      <ul className="flex-1 space-y-3 mb-7">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-0.5">
              {feature.included ? <CheckIcon /> : <CrossIcon />}
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="text-sm leading-snug"
                style={{
                  color: feature.included ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  textDecoration: feature.included ? 'none' : 'line-through',
                  opacity: feature.included ? 1 : 0.5,
                }}
              >
                {feature.name}
              </span>
              {feature.value && (
                <span
                  className="ml-2 text-xs font-semibold"
                  style={{ color: 'var(--accent-tertiary)' }}
                >
                  {feature.value}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {customButton ?? (
        <CTAButton
          highlighted={highlighted}
          isCurrentTier={isCurrentTier}
          loading={loading}
          label={isCurrentTier ? 'Current plan' : (tier.buttonText ?? `Get ${tier.name}`)}
          onClick={() => onSelect(tier.id)}
        />
      )}
    </div>
  );
}

function CTAButton({
  highlighted,
  isCurrentTier,
  loading,
  label,
  onClick,
}: {
  highlighted: boolean;
  isCurrentTier: boolean;
  loading: boolean;
  label: string;
  onClick: () => void;
}) {
  const baseStyle: React.CSSProperties = highlighted
    ? {
        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
        color: '#fff',
        boxShadow: 'var(--shadow-glow)',
      }
    : isCurrentTier
    ? { background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }
    : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)' };

  return (
    <button
      onClick={onClick}
      disabled={loading || isCurrentTier}
      className="w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
      style={baseStyle}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="spinner w-4 h-4 border-2" />
          Processing…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

/* ============================================================
   PUBLIC EXPORT
   ============================================================ */
export function PricingCard({
  tier,
  currentTier,
  onSelect,
  loading = false,
  customButton,
}: PricingCardProps) {
  const isCurrentTier = currentTier === tier.id;
  const isFree = tier.price === 0;

  /* ── Highlighted card: glassmorphism + gradient glow border ── */
  if (tier.highlighted) {
    return (
      <div
        className="relative flex flex-col h-full pricing-highlight-glow"
        style={{ borderRadius: 20 }}
      >
        {/* Gradient border ring */}
        <div
          className="absolute inset-0 rounded-[20px]"
          style={{
            padding: 1,
            background:
              'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary), var(--accent-tertiary))',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          aria-hidden
        />

        {/* Glass interior */}
        <div
          className="relative flex flex-col h-full rounded-[19px] overflow-hidden z-10"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {/* "Most Popular" tab */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <div
              className="px-4 py-1 text-xs font-bold tracking-wider uppercase rounded-b-lg"
              style={{
                background:
                  'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                color: '#fff',
              }}
            >
              Most Popular
            </div>
          </div>

          {isCurrentTier && <CurrentBadge />}

          <CardContent
            tier={tier}
            isFree={isFree}
            isCurrentTier={isCurrentTier}
            loading={loading}
            customButton={customButton}
            onSelect={onSelect}
            highlighted
          />
        </div>
      </div>
    );
  }

  /* ── Standard card ── */
  return (
    <div
      className="relative flex flex-col h-full rounded-[16px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-sm"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
      }}
    >
      {isCurrentTier && <CurrentBadge />}
      <CardContent
        tier={tier}
        isFree={isFree}
        isCurrentTier={isCurrentTier}
        loading={loading}
        customButton={customButton}
        onSelect={onSelect}
        highlighted={false}
      />
    </div>
  );
}
