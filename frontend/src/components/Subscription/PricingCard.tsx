import { ReactNode } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

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

export function PricingCard({
  tier,
  currentTier,
  onSelect,
  loading = false,
  customButton,
}: PricingCardProps) {
  const isCurrentTier = currentTier === tier.id;
  const isFree = tier.price === 0;

  return (
    <div
      className={`relative flex flex-col h-full rounded-2xl border-2 transition-all duration-300 ${
        tier.highlighted
          ? 'border-[var(--accent-primary)] shadow-glow-lg scale-105 z-10'
          : 'border-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] hover:shadow-glow-md'
      } ${
        isCurrentTier ? 'bg-[var(--accent-primary)]/10' : 'bg-[var(--bg-secondary)]'
      }`}
    >
      {/* Highlighted Badge */}
      {tier.highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="px-4 py-1 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-full shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentTier && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
            Current Plan
          </span>
        </div>
      )}

      <div className="p-8 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {tier.name}
          </h3>
          <p className="text-[var(--text-tertiary)] text-sm">
            {tier.description}
          </p>
        </div>

        {/* Price */}
        <div className="mb-8">
          <div className="flex items-baseline">
            <span className="text-5xl font-bold text-[var(--text-primary)]">
              {isFree ? 'Free' : `$${tier.price}`}
            </span>
            {!isFree && (
              <span className="ml-2 text-[var(--text-tertiary)]">
                /{tier.interval}
              </span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 mb-8">
          <ul className="space-y-4">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {feature.included ? (
                    <FaCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <FaTimes className="w-5 h-5 text-[var(--text-tertiary)] opacity-30" />
                  )}
                </div>
                <div className="flex-1">
                  <span
                    className={`text-sm ${
                      feature.included
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-tertiary)] line-through'
                    }`}
                  >
                    {feature.name}
                  </span>
                  {feature.value && (
                    <span className="ml-2 text-xs text-[var(--accent-primary)] font-semibold">
                      {feature.value}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        {customButton ? (
          customButton
        ) : (
          <button
            onClick={() => onSelect(tier.id)}
            disabled={loading || isCurrentTier}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
              tier.highlighted
                ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] shadow-lg hover:shadow-xl'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white'
            } ${
              isCurrentTier
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="spinner w-5 h-5 border-2"></div>
                Processing...
              </span>
            ) : isCurrentTier ? (
              'Current Plan'
            ) : (
              tier.buttonText || `Get ${tier.name}`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
