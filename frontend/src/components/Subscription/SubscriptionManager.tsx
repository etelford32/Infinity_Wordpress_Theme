import { useState } from 'react';
import { FaCreditCard, FaCalendar, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '@context/AuthContext';
import { apiClient } from '@lib/api';

interface Subscription {
  id: string;
  tierId: string;
  tierName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  price: number;
  interval: 'month' | 'year';
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}

interface SubscriptionManagerProps {
  subscription: Subscription;
  paymentMethod?: PaymentMethod;
  onUpdate?: () => void;
}

export function SubscriptionManager({
  subscription,
  paymentMethod,
  onUpdate,
}: SubscriptionManagerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const statusConfig = {
    active: {
      icon: FaCheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Active',
    },
    trialing: {
      icon: FaCheckCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Trial',
    },
    canceled: {
      icon: FaExclamationTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      label: 'Canceled',
    },
    past_due: {
      icon: FaExclamationTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Past Due',
    },
  };

  const config = statusConfig[subscription.status];
  const StatusIcon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      await apiClient.post('/subscriptions/cancel', {
        subscriptionId: subscription.id,
      });
      setShowCancelConfirm(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      await apiClient.post('/subscriptions/reactivate', {
        subscriptionId: subscription.id,
      });
      onUpdate?.();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
      alert('Failed to reactivate subscription. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/subscriptions/update-payment-method', {
        subscriptionId: subscription.id,
      });

      // Redirect to Stripe's payment method update page
      if (response.data.updateUrl) {
        window.location.href = response.data.updateUrl;
      }
    } catch (error) {
      console.error('Failed to update payment method:', error);
      alert('Failed to initiate payment method update. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {subscription.tierName}
            </h2>
            <p className="text-white/80">
              ${subscription.price}/{subscription.interval}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${config.bgColor} flex items-center gap-2`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
            <span className={`font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Billing Cycle */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaCalendar className="text-[var(--accent-primary)]" />
            <h3 className="font-semibold text-[var(--text-primary)]">
              Billing Cycle
            </h3>
          </div>
          <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[var(--text-secondary)]">Current period started</span>
              <span className="text-[var(--text-primary)] font-medium">
                {formatDate(subscription.currentPeriodStart)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">
                {subscription.cancelAtPeriodEnd ? 'Access until' : 'Next billing date'}
              </span>
              <span className="text-[var(--text-primary)] font-medium">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Your subscription is set to cancel on {formatDate(subscription.currentPeriodEnd)}.
                You'll continue to have access until then.
              </p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FaCreditCard className="text-[var(--accent-primary)]" />
              <h3 className="font-semibold text-[var(--text-primary)]">
                Payment Method
              </h3>
            </div>
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    {paymentMethod.brand.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">
                      •••• {paymentMethod.last4}
                    </p>
                    <p className="text-[var(--text-tertiary)] text-sm">
                      Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleUpdatePaymentMethod}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-[var(--bg-tertiary)]">
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={loading}
              className="w-full px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel Subscription
            </button>
          ) : subscription.cancelAtPeriodEnd ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={loading}
              className="w-full px-4 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Reactivate Subscription'}
            </button>
          ) : null}

          {subscription.status === 'past_due' && (
            <div className="space-y-3">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                  Your payment failed. Please update your payment method to continue your subscription.
                </p>
              </div>
              <button
                onClick={handleUpdatePaymentMethod}
                disabled={loading}
                className="w-full px-4 py-3 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Update Payment Method
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--bg-tertiary)] max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
              Cancel Subscription?
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              Are you sure you want to cancel your subscription? You'll continue to have
              access until {formatDate(subscription.currentPeriodEnd)}, but you won't be
              charged again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] hover:opacity-80 rounded-lg font-medium transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-red-500 text-white hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Canceling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
