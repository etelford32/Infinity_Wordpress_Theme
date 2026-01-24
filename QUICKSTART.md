# Quick Start - Get Running in 30 Minutes

The fastest path to get Infinity running on elliottelford.com.

## Before You Start

Make sure you have:
- [ ] WordPress installed on elliottelford.com
- [ ] Admin access to WordPress
- [ ] Node.js installed on your computer

## Step 1: WordPress Setup (10 minutes)

### Install Required Plugins

Log into `elliottelford.com/wp-admin` and install these:

1. **WooCommerce** - Search "WooCommerce" → Install & Activate
2. **WPGraphQL** - Search "WPGraphQL" → Install & Activate
3. **Stripe Gateway** - Search "WooCommerce Stripe Gateway" → Install & Activate

### Upload Theme

**Easiest method (ZIP upload):**

```bash
# On your computer, in the repo folder:
cd /path/to/Infinity_Wordpress_Theme

# Create a zip of WordPress files
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

Then:
1. Go to WordPress: Appearance → Themes → Add New → Upload Theme
2. Upload `infinity-theme.zip`
3. Click "Activate"

### Quick Settings

1. **Permalinks:** Settings → Permalinks → Select "Post name" → Save
2. **GraphQL:** GraphQL → Settings → Enable endpoint → Save
3. **Stripe (Test Mode):**
   - Appearance → Customize → Infinity Theme Settings
   - Add test keys from https://dashboard.stripe.com/test/apikeys
   - Enable Test Mode ✓
   - Publish

## Step 2: Frontend Setup (15 minutes)

```bash
# In the repo folder
cd frontend

# Install dependencies (one time only)
npm install

# Create .env file
cat > .env << 'EOF'
VITE_WORDPRESS_API_URL=https://elliottelford.com/graphql
VITE_WORDPRESS_REST_URL=https://elliottelford.com/wp-json
VITE_SITE_URL=https://elliottelford.com
VITE_STRIPE_PUBLIC_KEY=pk_test_your_key_here
VITE_ENV=production
EOF

# Edit .env and add your real Stripe public key

# Build it
npm run build
```

## Step 3: Deploy Frontend (5 minutes)

### Option A: Vercel (Recommended - Free & Easy)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Follow prompts, then:
1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Add all variables from your `.env` file
4. Redeploy

### Option B: Your Own Server

```bash
# Upload the dist/ folder to your web server
# Via FTP, upload contents of frontend/dist/ to your web root
```

## Step 4: Test It (5 minutes)

1. **Visit your frontend** (Vercel URL or your domain)
2. **Try the pricing page** - Should see 3 pricing tiers
3. **Create test account** - Sign up with test email
4. **Test subscription:**
   - Click "Go Premium"
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC

## Step 5: Make It Yours

### Quick Customizations

**Change Colors:**

Edit `style.css` in WordPress theme:

```css
[data-theme="dark-cosmic"] {
  --color-accent-primary: #YOUR_COLOR;
  --color-accent-secondary: #YOUR_SECONDARY;
}
```

**Change Pricing:**

Edit `frontend/src/components/Subscription/PricingPage.tsx`:
- Change prices: `price: 15` instead of `price: 20`
- Change features in the array
- Change tier names

**Add Your Logo:**

1. Put your logo in `frontend/public/logo.svg`
2. Edit `frontend/src/components/Layout/Header.tsx`
3. Rebuild and redeploy

## Common Issues

**Can't connect to WordPress:**
- Check CORS (install "WP GraphQL CORS" plugin)
- Verify URLs in `.env` are correct

**Stripe not working:**
- Make sure you used PUBLISHABLE key (starts with `pk_`)
- Check WooCommerce → Settings → Payments → Stripe is enabled

**Build errors:**
- Delete `node_modules` and run `npm install` again
- Check Node version: `node -v` (need 18+)

## Development Mode

Want to make changes locally?

```bash
# Terminal 1: WordPress (already running on elliottelford.com)

# Terminal 2: Frontend with hot reload
cd frontend
npm run dev
```

Visit `localhost:5173` - changes auto-refresh!

## Next Steps

Now that it's running:

1. **Read STYLING_GUIDE.md** - Make it look like your brand
2. **Create content** - Add simulations, write posts
3. **Customize pricing** - Set your actual prices
4. **Go live:**
   - Switch Stripe to live mode
   - Update to production keys
   - Test with real payment

## File Structure

```
Infinity_Wordpress_Theme/
├── INSTALLATION.md      ← Full detailed guide
├── STYLING_GUIDE.md     ← How to customize appearance
├── QUICKSTART.md        ← You are here!
│
├── frontend/            ← React app
│   ├── src/
│   │   ├── components/  ← UI components
│   │   ├── pages/       ← Page components
│   │   └── lib/         ← Simulations, API
│   └── package.json
│
└── (WordPress theme files in root)
    ├── style.css        ← Theme CSS & colors
    ├── functions.php    ← WordPress functionality
    └── inc/             ← Backend features
```

## Key Files to Customize

For your brand:
- `style.css` - Colors and theme variables
- `frontend/src/components/Subscription/PricingPage.tsx` - Pricing
- `frontend/src/components/Layout/Header.tsx` - Logo/nav
- `frontend/src/pages/Home.tsx` - Home page
- `frontend/.env` - Configuration

## Help Resources

- **Full Installation:** See `INSTALLATION.md`
- **Styling:** See `STYLING_GUIDE.md`
- **UI Components:** See `frontend/src/components/UI/README.md`
- **Subscription System:** See `frontend/src/components/Subscription/README.md`

---

**Stuck?** Open an issue on GitHub or check the documentation in the `/docs` folder.

**Ready to go?** Start with Step 1 above! 🚀
