# Styling Guide - Make It Your Own

Quick guide to customize the Infinity theme's appearance to match your personal brand.

> **Scope note:** the classic WordPress theme's styling lives in `style.css`
> (CSS variables for all four visual modes) and applies to the live site —
> sections 1, 2, and 8–10 are the ones you want for elliottelford.com.
> Sections referencing `frontend/src/...` apply only to the optional React
> simulation app, and some file paths there predate the current `routes.tsx`
> layout — treat those snippets as patterns, not exact paths.

## Quick Customization Checklist

- [ ] Choose/create your color theme
- [ ] Add your logo and branding
- [ ] Customize fonts
- [ ] Update pricing tiers
- [ ] Customize home page
- [ ] Add your personal content

## 1. Color Theme Customization

### Use Built-in Themes

The theme comes with 4 pre-built themes. Set in WordPress Customizer:

```
Appearance → Customize → Infinity Theme Settings → Visual Theme Preference
```

**Available themes:**
- `dark-cosmic` - Dark purple/blue space theme (default)
- `light-playful` - Light with pink/orange accents
- `science-light` - Clean white with professional blue
- `science-dark` - Dark mode with blue accents

### Create Your Own Color Theme

Edit `style.css` in your WordPress theme:

```css
/* Example: Personal brand colors */
[data-theme="elliot-brand"] {
  /* Accent colors - used for buttons, links, highlights */
  --color-accent-primary: #FF6B6B;      /* Your primary brand color */
  --color-accent-secondary: #4ECDC4;    /* Your secondary color */

  /* Background colors */
  --color-bg-primary: #1A1A2E;          /* Main background */
  --color-bg-secondary: #16213E;        /* Cards, sections */
  --color-bg-tertiary: #0F3460;         /* Inputs, nested elements */

  /* Text colors */
  --color-text-primary: #FFFFFF;        /* Main text */
  --color-text-secondary: #E0E0E0;      /* Secondary text */
  --color-text-tertiary: #94A1B2;       /* Muted text */

  /* Optional: Success, warning, error colors */
  --color-success: #00D9A3;
  --color-warning: #FFC107;
  --color-error: #FF5252;
}
```

Then activate it in the frontend theme state (see `frontend/src/hooks/`):

```tsx
// Set default theme to your custom theme
const [theme, setTheme] = useState<ThemeName>('elliot-brand');
```

### Color Inspiration Tools

Use these to pick your colors:
- **Coolors.co** - Generate color palettes
- **Adobe Color** - Create color schemes
- **Paletton** - Color scheme designer

**Pro Tip:** Pick one primary color you love, then use a tool to generate the rest!

## 2. Typography (Fonts)

### Add Google Fonts

1. Choose fonts at https://fonts.google.com

2. Add to `frontend/index.html`:

```html
<head>
  <!-- Your custom fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
```

3. Update `frontend/tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],           // Body font
        heading: ['Space Grotesk', 'sans-serif'], // Heading font
      },
    },
  },
}
```

4. Use in your components:

```tsx
<h1 className="font-heading">Heading</h1>
<p className="font-sans">Body text</p>
```

### Font Recommendations

**Modern & Clean:**
- Headings: Inter, Poppins, or Montserrat
- Body: Inter or Roboto

**Space/Sci-Fi:**
- Headings: Space Grotesk, Orbitron, or Exo 2
- Body: Inter or Work Sans

**Professional:**
- Headings: IBM Plex Sans, Raleway
- Body: Open Sans, Lato

## 3. Logo & Branding

### Add Your Logo

Replace logo in header component:

```tsx
// frontend/src/components/Layout/Header.tsx

<Link to="/" className="flex items-center gap-3">
  <img
    src="/logo.svg"                    // Your logo file
    alt="Elliot Telford"
    className="h-10 w-auto"
  />
  <span className="text-xl font-bold">
    Elliot Telford
  </span>
</Link>
```

Upload your logo to `frontend/public/logo.svg`

### Create a Simple SVG Logo

If you don't have a logo yet, create a text-based one:

```tsx
// Simple text logo with custom styling
<Link to="/" className="flex items-center gap-2">
  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-xl">
    ET
  </div>
  <span className="text-xl font-bold">
    Elliot Telford
  </span>
</Link>
```

### Favicon

Replace `frontend/public/favicon.ico` with your own:

1. Create a 32x32px icon
2. Use a tool like https://favicon.io to convert
3. Replace the file

## 4. Home Page Customization

### Create a Personal Hero Section

```tsx
// home route component (see frontend/src/routes.tsx)

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
            Elliot Telford
          </h1>
          <p className="text-2xl md:text-3xl text-[var(--text-secondary)] mb-8">
            Exploring the cosmos through interactive simulations
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/simulations')}
            >
              Explore Simulations
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/about')}
            >
              About Me
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            What You'll Find Here
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card hoverable>
              <div className="text-center">
                <FaRocket className="w-16 h-16 mx-auto mb-4 text-[var(--accent-primary)]" />
                <h3 className="text-2xl font-bold mb-2">Simulations</h3>
                <p className="text-[var(--text-secondary)]">
                  Interactive astrophysical simulations built with Three.js
                </p>
              </div>
            </Card>
            {/* Add more cards */}
          </div>
        </div>
      </section>
    </div>
  );
}
```

## 5. Component Styling Examples

### Styled Buttons

```tsx
// Primary CTA - your brand
<Button
  variant="primary"
  className="shadow-glow-md hover:shadow-glow-lg"
>
  Get Started
</Button>

// Subtle secondary action
<Button variant="ghost">
  Learn More
</Button>

// Custom gradient button
<Button
  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
>
  Special Action
</Button>
```

### Styled Cards

```tsx
// Glassmorphism effect
<Card
  variant="glass"
  className="backdrop-blur-xl bg-white/10 border-white/20"
>
  <h3>Glass Card</h3>
</Card>

// Elevated with glow
<Card
  variant="elevated"
  className="shadow-glow-md hover:shadow-glow-lg transition-shadow"
>
  <h3>Glowing Card</h3>
</Card>

// Gradient border
<Card className="border-2 border-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] p-[2px]">
  <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
    <h3>Gradient Border Card</h3>
  </div>
</Card>
```

### Custom Layouts

```tsx
// Two-column layout
<div className="grid md:grid-cols-2 gap-8">
  <div>Left content</div>
  <div>Right content</div>
</div>

// Three-column feature grid
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Feature 1</Card>
  <Card>Feature 2</Card>
  <Card>Feature 3</Card>
</div>

// Full-width hero with centered content
<section className="min-h-screen flex items-center justify-center">
  <div className="container mx-auto px-4 max-w-4xl">
    {/* Centered content */}
  </div>
</section>
```

## 6. Pricing Page Customization

### Update Your Pricing

```tsx
// frontend/src/components/Subscription/PricingPage.tsx

const myPricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    interval: 'month',
    description: 'Perfect for casual stargazers',
    features: [
      { name: '2 simulations per day', included: true },
      { name: 'Basic physics engines', included: true },
      { name: 'Community access', included: true },
      { name: 'Advanced features', included: false },
    ],
    buttonText: 'Start Free',
  },
  {
    id: 'premium',
    name: 'Cosmic Explorer',
    price: 20,
    interval: 'month',
    description: 'For serious space enthusiasts',
    features: [
      { name: 'Unlimited simulations', included: true },
      { name: 'All physics engines', included: true },
      { name: 'Create & share blueprints', included: true },
      { name: 'VR/AR support', included: true },
      { name: 'Priority support', included: true },
    ],
    highlighted: true,
    buttonText: 'Go Premium',
    stripePriceId: 'price_your_stripe_id',
  },
];
```

### Customize Pricing Page Title

```tsx
<PricingPage
  title="Choose Your Journey"
  subtitle="Unlock the universe with a plan that fits you"
  tiers={myPricingTiers}
/>
```

## 7. Animation & Effects

### Add Hover Animations

```tsx
// Hover lift
<div className="hover:scale-105 transition-transform duration-200">
  Lift on hover
</div>

// Hover glow
<Button className="hover:shadow-glow-lg transition-shadow">
  Glow on hover
</Button>

// Rotate on hover
<Card className="hover:rotate-1 transition-transform">
  Slight rotate
</Card>
```

### Add Entrance Animations

Install framer-motion:

```bash
npm install framer-motion
```

Use it:

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Fades in and slides up
</motion.div>
```

## 8. Quick Style Tweaks

### Rounded Corners

```tsx
// More rounded
className="rounded-2xl"  // Instead of rounded-xl

// Less rounded
className="rounded-md"   // Instead of rounded-xl

// Full circle/pill
className="rounded-full"
```

### Spacing

```tsx
// More padding
className="p-8"   // Instead of p-6

// Tighter spacing
className="gap-2" // Instead of gap-4
```

### Shadows

```tsx
// Stronger shadows
className="shadow-2xl"

// Glow effects
className="shadow-glow-lg"

// No shadow
className="shadow-none"
```

## 9. Responsive Design

### Mobile-First Approach

```tsx
// Base (mobile) → md (tablet) → lg (desktop)
<div className="text-2xl md:text-4xl lg:text-6xl">
  Responsive heading
</div>

// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop only
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile only
</div>
```

## 10. Testing Your Styles

### Browser DevTools

1. Right-click → Inspect Element
2. Edit CSS variables in real-time:
   ```css
   --color-accent-primary: #your-test-color;
   ```
3. Copy values you like

### Preview Themes

Create a theme switcher button for testing:

```tsx
<select onChange={(e) => setTheme(e.target.value)}>
  <option value="dark-cosmic">Dark Cosmic</option>
  <option value="light-playful">Light Playful</option>
  <option value="elliot-brand">My Brand</option>
</select>
```

## Style Checklist for elliottelford.com

- [ ] Pick 2-3 brand colors (primary, secondary, accent)
- [ ] Choose 1-2 fonts (heading + body)
- [ ] Create/add logo
- [ ] Update favicon
- [ ] Customize home page hero
- [ ] Update pricing tiers and prices
- [ ] Add your personal "About" section
- [ ] Test on mobile devices
- [ ] Check all components with your colors
- [ ] Get feedback from friends

## Common Patterns

### Full-width colored section

```tsx
<section className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] py-20">
  <div className="container mx-auto px-4">
    <h2 className="text-white text-4xl font-bold">
      Colored Section
    </h2>
  </div>
</section>
```

### Centered content container

```tsx
<div className="container mx-auto px-4 max-w-4xl">
  {/* Content stays centered and max-width */}
</div>
```

### Grid of cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

---

## Need Help?

The best way to learn is to experiment! Try changing one thing at a time and see what happens. Everything can be undone with git.

**Quick test workflow:**
1. Make a change
2. Save file
3. Check browser (auto-refreshes)
4. Keep or revert

Have fun making it yours! 🚀
