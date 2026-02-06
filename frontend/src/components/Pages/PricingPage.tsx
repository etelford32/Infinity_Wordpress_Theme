import { useState } from 'react';
import { FaCheckCircle, FaTimes, FaRocket, FaCrown } from 'react-icons/fa';
import { useAuth } from '@lib/auth/AuthProvider';
import { apiClient } from '@lib/api/client';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number;
  description: string;
  icon: React.ElementType;
  popular?: boolean;
  features: { name: string; included: boolean }[];
  cta: string;
}

const tiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    description: 'Perfect for getting started with astrophysical simulations',
    icon: FaRocket,
    features: [
      { name: '2 simulation runs per day', included: true },
      { name: 'Access to community simulations', included: true },
      { name: 'View blueprints gallery', included: true },
      { name: 'Participate in challenges', included: true },
      { name: 'Basic physics engines', included: true },
      { name: 'Unlimited simulation runs', included: false },
      { name: 'Create & publish blueprints', included: false },
      { name: 'GPU compute simulations', included: false },
      { name: 'Priority support', included: false },
      { name: 'Early access to features', included: false },
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 20,
    yearlyPrice: 192,
    description: 'For serious explorers and simulation creators',
    icon: FaCrown,
    popular: true,
    features: [
      { name: 'Unlimited simulation runs', included: true },
      { name: 'Access to all simulations', included: true },
      { name: 'Full blueprints gallery', included: true },
      { name: 'Participate in all challenges', included: true },
      { name: 'All physics engines', included: true },
      { name: 'Unlimited simulation runs', included: true },
      { name: 'Create & publish blueprints', included: true },
      { name: 'GPU compute simulations', included: true },
      { name: 'Priority support', included: true },
      { name: 'Early access to features', included: true },
    ],
    cta: 'Go Premium',
  },
];

export default function PricingPage() {
  const { isAuthenticated, user } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const wpLoginUrl = (window as any).infinityData?.loginUrl || '/wp-login.php';

  const handleSubscribe = async (tierId: string) => {
    if (!isAuthenticated) {
      window.location.href = `${wpLoginUrl}?redirect_to=${encodeURIComponent(window.location.href)}`;
      return;
    }

    if (tierId === 'free') return;

    setLoading(tierId);
    try {
      const response = await apiClient.post('/subscriptions/checkout', {
        tierId,
        interval: billing,
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your{' '}
          <span className="bg-gradient-to-r from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] bg-clip-text text-transparent">
            Plan
          </span>
        </h1>
        <p className="text-lg text-[var(--color-text-secondary,#b8c0d4)] max-w-2xl mx-auto">
          Start exploring for free or go premium for unlimited access to all simulations, blueprints, and advanced physics engines.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-[var(--color-text-primary,#fff)]' : 'text-[var(--color-text-tertiary,#7a8199)]'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billing === 'yearly' ? 'bg-[var(--color-accent-primary,#6366f1)]' : 'bg-[var(--color-bg-tertiary,#1e2330)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                billing === 'yearly' ? 'translate-x-7' : ''
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-[var(--color-text-primary,#fff)]' : 'text-[var(--color-text-tertiary,#7a8199)]'}`}>
            Yearly
          </span>
          {billing === 'yearly' && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
              Save 20%
            </span>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {tiers.map((tier) => {
          const displayPrice = billing === 'yearly' && tier.yearlyPrice
            ? Math.round(tier.yearlyPrice / 12)
            : tier.price;
          const isCurrentPlan = user?.isPremium && tier.id === 'premium';

          return (
            <div
              key={tier.id}
              className={`relative bg-[var(--color-bg-secondary,#141824)] rounded-2xl border overflow-hidden transition-transform hover:scale-[1.02] ${
                tier.popular
                  ? 'border-[var(--color-accent-primary,#6366f1)] shadow-[0_0_30px_rgba(99,102,241,0.15)]'
                  : 'border-[var(--color-bg-tertiary,#1e2330)]'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className={`p-8 ${tier.popular ? 'pt-12' : ''}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    tier.popular ? 'bg-[var(--color-accent-primary,#6366f1)]/20' : 'bg-[var(--color-bg-tertiary,#1e2330)]'
                  }`}>
                    <tier.icon className={`w-6 h-6 ${tier.popular ? 'text-[var(--color-accent-primary,#6366f1)]' : 'text-[var(--color-text-secondary,#b8c0d4)]'}`} />
                  </div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${displayPrice}</span>
                    {tier.price > 0 && <span className="text-[var(--color-text-tertiary,#7a8199)]">/month</span>}
                  </div>
                  {billing === 'yearly' && tier.yearlyPrice && (
                    <p className="text-sm text-[var(--color-text-tertiary,#7a8199)] mt-1">
                      ${tier.yearlyPrice}/year billed annually
                    </p>
                  )}
                </div>

                <p className="text-sm text-[var(--color-text-secondary,#b8c0d4)] mb-6">{tier.description}</p>

                {isCurrentPlan ? (
                  <div className="w-full py-3 text-center bg-green-500/20 text-green-400 rounded-lg font-medium">
                    Current Plan
                  </div>
                ) : tier.id === 'free' ? (
                  isAuthenticated ? (
                    <div className="w-full py-3 text-center bg-[var(--color-bg-tertiary,#1e2330)] text-[var(--color-text-secondary,#b8c0d4)] rounded-lg font-medium">
                      Your Free Plan
                    </div>
                  ) : (
                    <a href={`${wpLoginUrl}?action=register`} className="block w-full py-3 text-center border border-[var(--color-bg-tertiary,#1e2330)] rounded-lg font-medium hover:border-[var(--color-accent-primary,#6366f1)] transition-colors">
                      {tier.cta}
                    </a>
                  )
                ) : (
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={loading === tier.id}
                    className="w-full py-3 bg-gradient-to-r from-[var(--color-accent-primary,#6366f1)] to-[var(--color-accent-secondary,#8b5cf6)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading === tier.id ? 'Processing...' : tier.cta}
                  </button>
                )}

                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <FaCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <FaTimes className="w-4 h-4 text-[var(--color-text-tertiary,#7a8199)]/50 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-[var(--color-text-secondary,#b8c0d4)]' : 'text-[var(--color-text-tertiary,#7a8199)]/50'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12 text-[var(--color-text-tertiary,#7a8199)] text-sm">
        <p>Cancel anytime. No hidden fees. Payments secured by Stripe.</p>
      </div>
    </div>
  );
}
