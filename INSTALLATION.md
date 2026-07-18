# Installing Infinity Theme to elliottelford.com

Complete guide to installing and customizing the Infinity WordPress theme on your website.

## Prerequisites

Before installation, ensure you have:

- ✅ WordPress 6.0 or higher installed on elliottelford.com
- ✅ PHP 8.0 or higher
- ✅ MySQL 5.7 or higher
- ✅ Node.js 18+ and npm installed locally (for frontend build)
- ✅ Git installed locally
- ✅ FTP/SFTP access or SSH access to your server
- ✅ WordPress admin access

## Installation Overview

The Infinity theme has two parts:
1. **WordPress Backend** (theme files) - Install on your WordPress site
2. **React Frontend** (static site) - Build and deploy to Vercel/hosting

## Part 1: WordPress Backend Installation

### Step 1: Clone the Repository

```bash
# On your local machine
git clone https://github.com/etelford32/Infinity_Wordpress_Theme.git
cd Infinity_Wordpress_Theme
```

### Step 2: Install Optional WordPress Plugins

No plugins are required — the classic theme (front page, blog, SEO layer,
built-in email subscriptions) works standalone, and each integration below
activates automatically when its plugin is detected. Install these only if
you're running the simulation subscription platform.

Log into your WordPress admin (elliottelford.com/wp-admin) and install these plugins:

1. **WooCommerce** (for e-commerce subscriptions)
   - Go to Plugins → Add New
   - Search for "WooCommerce"
   - Install and Activate

2. **WooCommerce Subscriptions** (for recurring payments via WooCommerce)
   - Purchase from WooCommerce.com (or use alternative like "Subscriptions for WooCommerce")
   - Upload and activate

3. **WPGraphQL** (for the headless API used by the React frontend)
   - Search for "WPGraphQL"
   - Install and Activate

4. **WPGraphQL for WooCommerce** (optional but recommended)
   - Search for "WPGraphQL WooCommerce"
   - Install and Activate

5. **Stripe Payment Gateway** (for payments)
   - Search for "WooCommerce Stripe Gateway"
   - Install and Activate

### Step 3: Upload Theme Files to WordPress

**Option A: Via FTP/SFTP**

1. Connect to your server via FTP (FileZilla, Cyberduck, etc.)
2. Navigate to `/wp-content/themes/`
3. Create a new folder called `infinity`
4. Upload all files from the repo root to `/wp-content/themes/infinity/`
   (you can skip `frontend/node_modules/` and `tools/`)

**Option B: Via SSH**

```bash
# SSH into your server
ssh your-username@elliottelford.com

# Navigate to themes directory
cd /path/to/wordpress/wp-content/themes/

# Clone just the theme files
# (you'll need to copy files from your local repo)

# Or use rsync from your local machine:
rsync -avz /local/path/to/Infinity_Wordpress_Theme/wordpress-theme/ \
  your-username@elliottelford.com:/path/to/wordpress/wp-content/themes/infinity/
```

**Option C: Via WordPress Admin (ZIP upload)**

1. On your local machine, create a ZIP of the theme:
   ```bash
   cd Infinity_Wordpress_Theme
   zip -r infinity-theme.zip \
     style.css \
     functions.php \
     header.php \
     footer.php \
     index.php \
     single-simulation.php \
     inc/ \
     README.md
   ```

2. In WordPress Admin:
   - Go to Appearance → Themes → Add New → Upload Theme
   - Upload `infinity-theme.zip`
   - Click "Install Now"

### Step 4: Activate the Theme

1. Go to Appearance → Themes in WordPress admin
2. Find "Infinity" theme
3. Click "Activate"

### Step 5: Configure Theme Settings

1. Go to Appearance → Customize → Infinity Theme Settings

2. **Stripe Configuration:**
   ```
   Stripe Publishable Key: pk_test_... (get from https://dashboard.stripe.com/test/apikeys)
   Stripe Secret Key: sk_test_... (get from Stripe dashboard)
   Enable Test Mode: ✓ (for testing)
   ```

3. **Visual Theme:**
   ```
   Default Theme: dark-cosmic
   ```

4. Click "Publish" to save settings

### Step 6: Configure WPGraphQL

1. Go to GraphQL → Settings
2. Enable GraphQL endpoint at: `https://elliottelford.com/graphql`
3. Enable introspection (for development)
4. Save changes

### Step 7: Set Up Permalinks

1. Go to Settings → Permalinks
2. Select "Post name" structure
3. Save changes

## Part 2: React Frontend Installation

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This installs:
- React, React Router, TypeScript
- Three.js, React Three Fiber
- Cannon.js (physics)
- TailwindCSS
- Axios, TanStack Query
- And all other dependencies

### Step 2: Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# frontend/.env

# WordPress GraphQL API endpoint
VITE_WORDPRESS_API_URL=https://elliottelford.com/graphql

# WordPress REST API endpoint
VITE_WORDPRESS_REST_URL=https://elliottelford.com/wp-json

# Site URL
VITE_SITE_URL=https://elliottelford.com

# Stripe Publishable Key (same as in WordPress)
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key_here

# Environment
VITE_ENV=production
```

### Step 3: Update API Configuration

Edit `frontend/src/lib/api.ts` to point to your WordPress site:

```typescript
// frontend/src/lib/api.ts

const baseURL = import.meta.env.VITE_WORDPRESS_REST_URL || 'https://elliottelford.com/wp-json';
```

### Step 4: Build the Frontend

```bash
cd frontend

# Build for production
npm run build
```

This creates an optimized build in `frontend/dist/`.

### Step 5: Deploy Frontend to Vercel

**Option A: Deploy via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel --prod
```

Follow the prompts:
- Set up and deploy? Yes
- Which scope? Your account
- Link to existing project? No
- Project name? infinity-frontend
- Directory? ./
- Override settings? No

**Option B: Deploy via Vercel Dashboard**

1. Go to https://vercel.com
2. Click "New Project"
3. Import your Git repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables (same as `.env` above)
6. Click "Deploy"

**Option C: Deploy to Your Own Server**

```bash
# Build the frontend
cd frontend
npm run build

# Upload dist/ folder to your server
rsync -avz dist/ your-username@elliottelford.com:/var/www/elliottelford.com/public_html/

# Or use FTP to upload the dist/ folder contents to your web root
```

### Step 6: Configure DNS (if using Vercel)

If deploying to Vercel and want to use elliottelford.com:

1. In Vercel dashboard, go to your project
2. Go to Settings → Domains
3. Add domain: `elliottelford.com`
4. Follow DNS configuration instructions
5. Add CNAME or A record as directed

## Part 3: WordPress Integration

### Step 1: Enable CORS (if frontend is on different domain)

Add to your theme's `functions.php`:

```php
// Allow CORS for GraphQL/REST API
add_action('init', function() {
    header("Access-Control-Allow-Origin: https://your-vercel-app.vercel.app");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
});
```

Or install "WP GraphQL CORS" plugin for easier configuration.

### Step 2: Create Test Content

1. **Create a Test Simulation:**
   - Go to Simulations → Add New in WordPress admin
   - Title: "Solar System Explorer"
   - Add simulation configuration in custom fields
   - Publish

2. **Create a Test User:**
   - Go to Users → Add New
   - Create a subscriber account
   - Test the free tier limits

### Step 3: Test Stripe Integration

1. Create a test subscription:
   - Go to WooCommerce → Products
   - Find "Premium Subscription" product (auto-created by theme)
   - Make sure it's set to $20/month
   - Set Stripe as payment method

2. Test checkout:
   - Visit your frontend pricing page
   - Try subscribing with Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

## Part 4: Customizing & Styling

### Customizing the Visual Theme

**Method 1: WordPress Customizer**

1. Go to Appearance → Customize → Infinity Theme Settings
2. Change "Visual Theme Preference" to:
   - `dark-cosmic` (default - dark purple/blue)
   - `light-playful` (light with pink/orange)
   - `science-light` (clean white with blue)
   - `science-dark` (dark with blue)

**Method 2: Custom CSS Variables**

Edit `style.css` in your theme to customize colors:

```css
/* Add after existing themes */

[data-theme="elliots-custom-theme"] {
  /* Primary colors */
  --color-accent-primary: #your-color-here;
  --color-accent-secondary: #your-secondary-color;

  /* Backgrounds */
  --color-bg-primary: #background-color;
  --color-bg-secondary: #card-background;
  --color-bg-tertiary: #input-background;

  /* Text colors */
  --color-text-primary: #main-text-color;
  --color-text-secondary: #secondary-text;
  --color-text-tertiary: #muted-text;
}
```

Then in your frontend, set the theme:

```tsx
// In ThemeProvider
<div data-theme="elliots-custom-theme">
  {children}
</div>
```

### Customizing Components

**Change Pricing Tiers:**

Edit `frontend/src/components/Subscription/PricingPage.tsx`:

```tsx
const customTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Explorer',
    price: 0,
    interval: 'month',
    description: 'Your custom description',
    features: [
      { name: 'Your custom feature 1', included: true },
      { name: 'Your custom feature 2', included: true },
      // ... add your features
    ],
  },
  // ... add more tiers
];
```

**Customize UI Components:**

All UI components accept `className` prop:

```tsx
import { Button, Card } from '@components/UI';

// Custom styled button
<Button
  variant="primary"
  className="my-custom-class shadow-2xl"
>
  My Button
</Button>

// Custom card
<Card
  className="max-w-4xl mx-auto bg-gradient-to-r from-purple-500 to-pink-500"
>
  Custom styled card
</Card>
```

**Add Your Branding:**

1. **Logo:** Replace logo in header
   ```tsx
   // frontend/src/components/Layout/Header.tsx
   <img src="/your-logo.svg" alt="Elliot Telford" />
   ```

2. **Fonts:** Add custom fonts in `frontend/index.html`:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Your+Font" rel="stylesheet">
   ```

   Then in `tailwind.config.js`:
   ```js
   theme: {
     extend: {
       fontFamily: {
         sans: ['Your Font', ...defaultTheme.fontFamily.sans],
       },
     },
   }
   ```

3. **Favicon:** Replace `frontend/public/favicon.ico`

### Customizing Simulations

Create your own simulations by extending `BaseSimulation`:

```tsx
// frontend/src/lib/simulation/simulations/MyCustomSimulation.ts

import { BaseSimulation } from '../BaseSimulation';

export class MyCustomSimulation extends BaseSimulation {
  protected async initPhysics(): Promise<void> {
    // Initialize physics
  }

  protected async createBodies(): Promise<void> {
    // Create your 3D objects
  }

  protected async onInit(): Promise<void> {
    // Additional initialization
  }

  protected onUpdate(deltaTime: number): void {
    // Update loop
  }

  protected onDispose(): void {
    // Cleanup
  }
}
```

Register it:

```tsx
// frontend/src/lib/simulation/SimulationRegistry.ts
SimulationRegistry.register('my-custom-sim', MyCustomSimulation);
```

## Development Workflow

### Local Development

```bash
# Terminal 1: Run WordPress locally (or use remote)
# Your WordPress should be accessible at http://localhost:8000

# Terminal 2: Run React dev server
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5173` with hot reload.

### Making Changes

1. Edit files in `frontend/src/`
2. See changes instantly (hot reload)
3. Build and deploy when ready:
   ```bash
   npm run build
   vercel --prod
   ```

### Updating WordPress Theme

1. Make changes to theme files
2. Upload via FTP or rsync
3. Changes take effect immediately

## Common Customizations

### Change Site Title

```tsx
// frontend/src/App.tsx
<Helmet>
  <title>Elliot Telford - Astrophysical Simulations</title>
</Helmet>
```

### Add Custom Pages

```tsx
// frontend/src/pages/About.tsx
export function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1>About Me</h1>
      <p>Your content here</p>
    </div>
  );
}

// Add to routes.tsx
{
  path: '/about',
  element: <About />,
}
```

### Customize Pricing

```tsx
// Change default price
const tier = {
  price: 15, // Instead of $20
  interval: 'month',
}
```

### Add Your Own Sections

```tsx
// frontend/src/components/Home/Hero.tsx
export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          Elliot Telford
        </h1>
        <p className="text-2xl text-[var(--text-secondary)]">
          Exploring the cosmos through code
        </p>
      </div>
    </section>
  );
}
```

## Troubleshooting

### Frontend Can't Connect to WordPress

- Check CORS settings
- Verify WordPress URL in `.env`
- Check if GraphQL endpoint is enabled

### Stripe Not Working

- Verify API keys in WordPress admin
- Make sure WooCommerce Subscriptions is active
- Check webhook URL is configured

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### CSS Not Loading

- Check Tailwind config
- Verify theme data-attribute is set
- Clear browser cache

## Next Steps

1. **Test Everything:**
   - Create test account
   - Test subscription flow
   - Test simulations
   - Test all pages

2. **Customize for Your Brand:**
   - Update colors to match your brand
   - Add your logo and favicon
   - Customize pricing tiers
   - Write your own content

3. **Create Content:**
   - Add your simulations
   - Create blog posts
   - Add documentation

4. **Go Live:**
   - Switch Stripe to live mode
   - Update DNS
   - Deploy to production
   - Test payment flow with real card

## Support Resources

- **Documentation:** `/docs` folder in repo
- **Component Library:** `/frontend/src/components/UI/README.md`
- **Subscription System:** `/frontend/src/components/Subscription/README.md`
- **WordPress Codex:** https://codex.wordpress.org
- **React Docs:** https://react.dev
- **Three.js Docs:** https://threejs.org/docs

## Quick Command Reference

```bash
# Frontend development
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Check TypeScript

# Deployment
vercel --prod        # Deploy to Vercel
rsync -avz dist/ ... # Deploy to custom server

# WordPress
# No build needed - just upload theme files
```

---

Need help with any specific step? Let me know and I can provide more detailed guidance!
