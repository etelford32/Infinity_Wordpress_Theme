import { useState } from 'react';
import { PricingCard, PricingTier } from './PricingCard';
import { useAuth } from '@lib/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@lib/api/client';

interface PricingPageProps {
  tiers?: PricingTier[];
  showIntervalToggle?: boolean;
  title?: string;
  subtitle?: string;
  onSubscribe?: (tierId: string) => Promise<void>;
}

const defaultTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    interval: 'month',
    description: 'Perfect for getting started with simulations',
    features: [
      { name: '2 simulations per day', included: true },
      { name: 'Access to basic simulations', included: true },
      { name: 'Community blueprints (view only)', included: true },
      { name: 'Standard resolution', included: true },
      { name: 'Create custom blueprints', included: false },
      { name: 'Advanced simulations', included: false },
      { name: 'Download & export', included: false },
      { name: 'VR/AR support', included: false },
    ],
    buttonText: 'Get Started',
  },
  {
    id: 'premium-monthly',
    name: 'Cosmic Explorer',
    price: 20,
    interval: 'month',
    description: 'Unlimited access to the cosmos',
    features: [
      { name: 'Unlimited simulations', included: true },
      { name: 'All simulation types', included: true },
      { name: 'Create & share blueprints', included: true },
      { name: 'High resolution rendering', included: true },
      { name: 'Advanced physics engines', included: true },
      { name: 'Download & export data', included: true },
      { name: 'Priority support', included: true },
      { name: 'VR/AR support', included: true },
    ],
    highlighted: true,
    buttonText: 'Go Premium',
    stripePriceId: 'price_premium_monthly',
  },
  {
    id: 'premium-yearly',
    name: 'Cosmic Explorer',
    price: 200,
    interval: 'year',
    description: 'Save 17% with annual billing',
    features: [
      { name: 'Unlimited simulations', included: true },
      { name: 'All simulation types', included: true },
      { name: 'Create & share blueprints', included: true },
      { name: 'High resolution rendering', included: true },
      { name: 'Advanced physics engines', included: true },
      { name: 'Download & export data', included: true },
      { name: 'Priority support', included: true },
      { name: 'VR/AR support', included: true },
      { name: 'Save $40 per year', included: true, value: '$40 savings' },
    ],
    buttonText: 'Go Premium',
    stripePriceId: 'price_premium_yearly',
  },
];

export function PricingPage({
  tiers = defaultTiers,
  showIntervalToggle = true,
  title = 'Choose Your Cosmic Journey',
  subtitle = 'Start exploring the universe with our flexible pricing plans',
  onSubscribe,
}: PricingPageProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);

  // Filter tiers by selected interval
  const filteredTiers = showIntervalToggle
    ? tiers.filter((tier) => tier.price === 0 || tier.interval === interval)
    : tiers;

  const handleSelectTier = async (tierId: string) => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate(`/login?redirect=/pricing&tier=${tierId}`);
      return;
    }

    // If free tier, just redirect to dashboard
    if (tierId === 'free') {
      navigate('/dashboard');
      return;
    }

    setLoading(tierId);

    try {
      if (onSubscribe) {
        // Custom subscription handler
        await onSubscribe(tierId);
      } else {
        // Default Stripe checkout
        const tier = tiers.find((t) => t.id === tierId);
        if (!tier?.stripePriceId) {
          throw new Error('Stripe price ID not configured for this tier');
        }

        const response = await apiClient.post('/subscriptions/checkout', {
          priceId: tier.stripePriceId,
        });

        // Redirect to Stripe Checkout
        if (response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-4">
            {title}
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Interval Toggle */}
        {showIntervalToggle && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--bg-tertiary)]">
              <button
                onClick={() => setInterval('month')}
                className={`px-6 py-3 rounded-md font-semibold transition-all duration-200 ${
                  interval === 'month'
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('year')}
                className={`px-6 py-3 rounded-md font-semibold transition-all duration-200 relative ${
                  interval === 'year'
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredTiers.map((tier) => (
            <PricingCard
              key={tier.id}
              tier={tier}
              currentTier={user?.subscription?.tierId}
              onSelect={handleSelectTier}
              loading={loading === tier.id}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--bg-tertiary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Can I switch plans later?
              </h3>
              <p className="text-[var(--text-secondary)]">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect at the start of your next billing cycle.
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--bg-tertiary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-[var(--text-secondary)]">
                We accept all major credit cards and debit cards through our secure
                Stripe payment processor.
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--bg-tertiary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-[var(--text-secondary)]">
                Absolutely. You can cancel your subscription at any time from your
                account settings. You'll continue to have access until the end of
                your current billing period.
              </p>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--bg-tertiary)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                What happens to my blueprints if I downgrade?
              </h3>
              <p className="text-[var(--text-secondary)]">
                Your created blueprints are always yours. If you downgrade to the
                free tier, you can still view and run your blueprints, but you won't
                be able to create new ones until you upgrade again.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Explore the Cosmos?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of students, educators, and space enthusiasts creating
              amazing simulations.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 bg-white text-[var(--accent-primary)] rounded-lg font-bold text-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              Start Your Free Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
