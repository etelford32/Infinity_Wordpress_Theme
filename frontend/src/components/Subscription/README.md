# Subscription System Components

Fully customizable subscription and pricing components for the Infinity WordPress Theme. These components integrate with Stripe for payment processing and WordPress for user management.

## Components Overview

### 1. PricingCard

A beautiful, customizable pricing tier card with features list, badges, and CTA button.

**Features:**
- Multiple pricing tiers (Free, Monthly, Yearly)
- Feature comparison with checkmarks/crosses
- "Most Popular" highlighted badge
- "Current Plan" indicator
- Loading states
- Fully customizable styling
- Responsive design

**Usage:**

```tsx
import { PricingCard, PricingTier } from '@components/Subscription';

const tier: PricingTier = {
  id: 'premium-monthly',
  name: 'Cosmic Explorer',
  price: 20,
  interval: 'month',
  description: 'Unlimited access to the cosmos',
  features: [
    { name: 'Unlimited simulations', included: true },
    { name: 'All simulation types', included: true },
    { name: 'VR/AR support', included: true },
  ],
  highlighted: true,
  buttonText: 'Go Premium',
  stripePriceId: 'price_premium_monthly',
};

function MyPricing() {
  return (
    <PricingCard
      tier={tier}
      currentTier={user?.subscription?.tierId}
      onSelect={(tierId) => handleSubscribe(tierId)}
      loading={false}
    />
  );
}
```

**Customization:**

The component uses CSS variables for theming:
- `--accent-primary`: Primary accent color (CTA buttons, highlights)
- `--accent-secondary`: Secondary accent color (hover states)
- `--bg-primary`: Primary background
- `--bg-secondary`: Secondary background (card)
- `--bg-tertiary`: Tertiary background (features)
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--text-tertiary`: Tertiary text color

### 2. PricingPage

Complete pricing page with multiple tiers, FAQ section, and CTA.

**Features:**
- Displays multiple pricing tiers
- Monthly/Yearly toggle with savings badge
- FAQ section
- Bottom CTA banner
- Auto-redirect to Stripe Checkout
- Login redirect for unauthenticated users

**Usage:**

```tsx
import { PricingPage } from '@components/Subscription';

function Pricing() {
  return (
    <PricingPage
      title="Choose Your Cosmic Journey"
      subtitle="Start exploring the universe"
      showIntervalToggle={true}
      onSubscribe={async (tierId) => {
        // Custom subscription logic (optional)
        await createSubscription(tierId);
      }}
    />
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tiers` | `PricingTier[]` | Default tiers | Array of pricing tiers |
| `showIntervalToggle` | `boolean` | `true` | Show monthly/yearly toggle |
| `title` | `string` | "Choose Your..." | Page title |
| `subtitle` | `string` | "Start exploring..." | Page subtitle |
| `onSubscribe` | `function` | Stripe checkout | Custom subscription handler |

**Default Tiers:**

The component comes with 3 default tiers:
1. **Explorer (Free)**: 2 simulations/day, basic features
2. **Cosmic Explorer (Monthly)**: $20/month, unlimited access
3. **Cosmic Explorer (Yearly)**: $200/year, unlimited access + savings

### 3. SubscriptionManager

Manage active subscriptions, view billing cycle, and update payment methods.

**Features:**
- Subscription status (Active, Canceled, Past Due, Trialing)
- Billing cycle information
- Payment method display and update
- Cancel/Reactivate subscription
- Confirmation modals
- Beautiful status indicators

**Usage:**

```tsx
import { SubscriptionManager } from '@components/Subscription';

function AccountSettings() {
  const { user } = useAuth();

  return (
    <SubscriptionManager
      subscription={user.subscription}
      paymentMethod={user.paymentMethod}
      onUpdate={() => {
        // Refresh subscription data
        refetchUser();
      }}
    />
  );
}
```

**Subscription Object:**

```typescript
interface Subscription {
  id: string;
  tierId: string;
  tierName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string; // ISO date
  currentPeriodEnd: string; // ISO date
  cancelAtPeriodEnd: boolean;
  price: number;
  interval: 'month' | 'year';
}
```

**Payment Method Object:**

```typescript
interface PaymentMethod {
  id: string;
  brand: string; // 'visa', 'mastercard', etc.
  last4: string;
  expiryMonth: number;
  expiryYear: number;
}
```

## Styling & Customization

### Theme Variables

All components use CSS custom properties (variables) that automatically adapt to the selected theme (Dark Cosmic, Light Playful, Science Mode):

```css
/* Example: Dark Cosmic Theme */
:root {
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --bg-primary: #0a0e1a;
  --bg-secondary: #141824;
  --bg-tertiary: #1e2330;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #64748b;
}
```

### Custom Styling

You can customize components using the `className` prop:

```tsx
<PricingCard
  tier={tier}
  onSelect={handleSelect}
  className="custom-shadow hover:scale-110"
/>
```

### Tailwind Classes

All components support Tailwind CSS classes and can be extended:

```tsx
<PricingPage
  className="my-custom-pricing-page"
  // ... other props
/>
```

## Integration with WordPress Backend

### API Endpoints

The subscription components expect these API endpoints:

```
POST /api/subscriptions/checkout
  Body: { priceId: string }
  Response: { checkoutUrl: string }

POST /api/subscriptions/cancel
  Body: { subscriptionId: string }
  Response: { success: boolean }

POST /api/subscriptions/reactivate
  Body: { subscriptionId: string }
  Response: { success: boolean }

POST /api/subscriptions/update-payment-method
  Body: { subscriptionId: string }
  Response: { updateUrl: string }
```

### Stripe Integration

The WordPress backend handles Stripe integration:

1. **Theme Activation**: Creates premium subscription product in WooCommerce
2. **Checkout**: Redirects to Stripe Checkout
3. **Webhooks**: Handles subscription events (created, updated, canceled)
4. **User Roles**: Automatically assigns "Premium Subscriber" role

### Setup Stripe

1. Install WooCommerce and WooCommerce Subscriptions plugins
2. Configure Stripe in WordPress admin (Settings → Infinity Theme → Stripe)
3. Enter your Stripe API keys (found at https://dashboard.stripe.com/apikeys)
4. Test with Stripe test mode first

```php
// In WordPress admin
Settings → Infinity Theme → Stripe
  - Stripe Publishable Key: pk_test_...
  - Stripe Secret Key: sk_test_...
  - Enable Test Mode: ✓
```

## User Flow

### Free User → Premium

1. User views pricing page (`/pricing`)
2. Clicks "Go Premium" on desired tier
3. If not logged in → redirected to login with return URL
4. If logged in → redirected to Stripe Checkout
5. Completes payment on Stripe
6. Redirected back to site with success message
7. User role updated to "Premium Subscriber"
8. Can now access unlimited simulations

### Subscription Management

1. User goes to account settings (`/account`)
2. Views SubscriptionManager component
3. Can see:
   - Current plan and status
   - Billing cycle (current period, next billing date)
   - Payment method
4. Can perform actions:
   - Cancel subscription (access continues until period end)
   - Reactivate canceled subscription
   - Update payment method
   - View billing history

## Customization Examples

### Change Pricing Tiers

```tsx
const customTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    interval: 'month',
    description: 'Perfect for beginners',
    features: [
      { name: '5 simulations per day', included: true },
      { name: 'Basic physics engine', included: true },
      { name: 'Community blueprints', included: true },
      { name: 'Advanced features', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 29,
    interval: 'month',
    description: 'For serious explorers',
    features: [
      { name: 'Unlimited simulations', included: true },
      { name: 'All physics engines', included: true },
      { name: 'Create blueprints', included: true },
      { name: 'Priority support', included: true },
    ],
    highlighted: true,
    stripePriceId: 'price_pro_monthly',
  },
];

<PricingPage tiers={customTiers} />
```

### Custom Button Text

```tsx
const tier = {
  // ... other properties
  buttonText: 'Start Your Journey',
};
```

### Custom Subscription Handler

```tsx
<PricingPage
  onSubscribe={async (tierId) => {
    // Custom logic before checkout
    await analytics.track('subscription_initiated', { tierId });

    // Proceed with default Stripe checkout
    // or implement custom payment flow
  }}
/>
```

### Disable Interval Toggle

```tsx
<PricingPage
  showIntervalToggle={false}
  tiers={[monthlyTier1, monthlyTier2]} // Only monthly tiers
/>
```

## Accessibility

All subscription components follow WCAG 2.1 AA standards:

- ✓ Keyboard navigation
- ✓ ARIA labels and roles
- ✓ Screen reader support
- ✓ Focus indicators
- ✓ Color contrast ratios
- ✓ Semantic HTML

## Best Practices

1. **Always validate on backend**: Never trust client-side subscription checks
2. **Use Stripe test mode first**: Test entire flow before going live
3. **Handle webhooks**: Implement Stripe webhooks for reliable subscription updates
4. **Clear pricing**: Be transparent about what's included in each tier
5. **Easy cancellation**: Make it easy for users to cancel (builds trust)
6. **Responsive design**: Test on mobile devices
7. **Loading states**: Always show loading indicators during async operations

## Troubleshooting

### Checkout Not Working

1. Check Stripe API keys are correct
2. Verify Stripe price IDs match your Stripe dashboard
3. Check browser console for errors
4. Ensure WooCommerce Subscriptions plugin is active

### Payment Method Update Failing

1. Verify Stripe Customer ID is stored correctly
2. Check webhook configuration
3. Test with Stripe test cards first

### Subscription Status Not Updating

1. Configure Stripe webhooks (Settings → Infinity Theme → Webhooks)
2. Webhook URL: `https://yoursite.com/wp-json/infinity/v1/stripe/webhook`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Support

For issues or questions:
- Documentation: `/docs/subscription-system`
- GitHub Issues: [Report a bug](https://github.com/yourusername/infinity-theme/issues)
- Support Forum: [Get help](https://yoursite.com/support)
