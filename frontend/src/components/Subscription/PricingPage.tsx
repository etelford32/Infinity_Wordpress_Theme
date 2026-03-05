import { useState } from 'react';
import { PricingCard, PricingTier } from './PricingCard';
import { useAuth } from '@lib/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@lib/api/client';

/* ============================================================
   DEFAULT TIERS
   ============================================================ */
const defaultTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    interval: 'month',
    description: 'Begin your journey — no commitment needed.',
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
    description: 'Unlimited access to the full simulation suite.',
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
    buttonText: 'Go Cosmic',
    stripePriceId: 'price_premium_monthly',
  },
  {
    id: 'premium-yearly',
    name: 'Cosmic Explorer',
    price: 200,
    interval: 'year',
    description: 'Save 17% — all Cosmic features, billed annually.',
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
    highlighted: true,
    buttonText: 'Go Cosmic',
    stripePriceId: 'price_premium_yearly',
  },
];

/* ============================================================
   FAQ DATA
   ============================================================ */
const FAQS = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards through Stripe. No subscription data is stored on our servers.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: "Anytime — from your account settings. You keep access until the end of the current billing period.",
  },
  {
    q: 'What happens to my blueprints if I downgrade?',
    a: "Your blueprints are always yours. On the free tier you can view and run existing ones, but creating new blueprints requires an active Cosmic plan.",
  },
];

/* ============================================================
   SOCIAL PROOF STATS
   ============================================================ */
const STATS = [
  { value: '12 k+', label: 'Active researchers' },
  { value: '80 k+', label: 'Simulations run' },
  { value: '3 200+', label: 'Community blueprints' },
  { value: '4.9 ★', label: 'Average rating' },
];

/* ============================================================
   COMPONENT
   ============================================================ */
interface PricingPageProps {
  tiers?: PricingTier[];
  showIntervalToggle?: boolean;
  title?: string;
  subtitle?: string;
  onSubscribe?: (tierId: string) => Promise<void>;
}

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

  const filteredTiers = showIntervalToggle
    ? tiers.filter((t) => t.price === 0 || t.interval === interval)
    : tiers;

  const handleSelectTier = async (tierId: string) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/pricing&tier=${tierId}`);
      return;
    }
    if (tierId === 'free') {
      navigate('/dashboard');
      return;
    }

    setLoading(tierId);
    try {
      if (onSubscribe) {
        await onSubscribe(tierId);
      } else {
        const tier = tiers.find((t) => t.id === tierId);
        if (!tier?.stripePriceId) throw new Error('Stripe price ID not configured');
        const response = await apiClient.post('/subscriptions/checkout', {
          priceId: tier.stripePriceId,
        });
        if (response.data.checkoutUrl) {
          window.location.href = response.data.checkoutUrl;
        }
      }
    } catch (err) {
      console.error('Subscription error:', err);
      alert('Failed to process subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      className="min-h-screen py-16 px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Hero Header ── */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          {/* Eyebrow label */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="h-px w-8 flex-shrink-0"
              style={{ background: 'var(--accent-primary)', opacity: 0.5 }}
            />
            <span
              className="text-xs font-semibold tracking-[0.2em] uppercase"
              style={{ color: 'var(--accent-primary)' }}
            >
              Pricing
            </span>
            <div
              className="h-px w-8 flex-shrink-0"
              style={{ background: 'var(--accent-primary)', opacity: 0.5 }}
            />
          </div>

          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-balance leading-[1.15]"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          <p
            className="text-lg leading-relaxed text-balance"
            style={{ color: 'var(--text-secondary)' }}
          >
            {subtitle}
          </p>
        </div>

        {/* ── Stats strip ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14 rounded-2xl p-6"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div
                className="text-2xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {s.value}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Interval Toggle ── */}
        {showIntervalToggle && (
          <div className="flex justify-center mb-10">
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
              }}
            >
              {(['month', 'year'] as const).map((iv) => (
                <button
                  key={iv}
                  onClick={() => setInterval(iv)}
                  className="relative px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={
                    interval === iv
                      ? {
                          background: 'var(--accent-primary)',
                          color: '#fff',
                          boxShadow: 'var(--shadow-glow)',
                        }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {iv === 'month' ? 'Monthly' : 'Yearly'}
                  {iv === 'year' && (
                    <span
                      className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: '#10b981', color: '#fff' }}
                    >
                      −17%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Pricing Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-20">
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

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto mb-20">
          <div className="text-center mb-8">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>

        {/* ── CTA Banner ── */}
        <div className="relative overflow-hidden rounded-2xl">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 60%, var(--accent-tertiary) 100%)',
              opacity: 0.95,
            }}
          />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 instrument-grid opacity-20"
            aria-hidden
          />
          <div className="relative z-10 text-center px-8 py-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              Ready to explore the cosmos?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Join thousands of students, educators, and researchers creating
              astrophysical simulations.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-150 hover:scale-105 active:scale-[0.98] shadow-lg"
              style={{ background: '#fff', color: 'var(--accent-primary)' }}
            >
              Start free — no card required
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── FAQ accordion item ── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-colors duration-150"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span
          className="font-semibold text-sm leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {question}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-tertiary)' }}
        >
          <path d="M3 6l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}
