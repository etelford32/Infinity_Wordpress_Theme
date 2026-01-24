# 🌌 Infinity WordPress Theme

**Version:** 1.0.0
**Author:** Ethan Telford
**License:** GPL v2 or later

A cutting-edge WordPress theme for creating interactive astrophysical simulations using Three.js, React, and TypeScript. Perfect for educators, astronomy enthusiasts, researchers, and simulation creators.

## ✨ Features

- 🎮 **Interactive 3D Simulations** - Solar systems, galaxies, black holes, and more
- ⚙️ **Multiple Physics Engines** - Cannon.js, Ammo.js, and GPU compute shaders
- 🎨 **Three Visual Themes** - Dark Cosmic, Light Playful, and Science Mode (light/dark)
- 💎 **Premium Subscriptions** - Built-in Stripe/WooCommerce integration
- 🛠️ **Blueprint Creator** - Users can create and share simulation configurations
- 🏆 **Gamification** - Achievements, challenges, leaderboards
- 👥 **Community Features** - Gallery, forums, voting system
- 📱 **Mobile-First Design** - WebGPU for desktop, WebGL fallback for mobile
- ♿ **Accessibility** - WCAG 2.1 AA compliant, screen reader support
- 🔌 **Headless Architecture** - WPGraphQL API + React frontend

## 📋 Requirements

- **WordPress:** 6.0 or higher
- **PHP:** 8.0 or higher
- **Node.js:** 18+ (for building frontend assets)
- **Plugins (Required):**
  - WPGraphQL
  - Advanced Custom Fields Pro
  - WooCommerce (for subscriptions)
  - WooCommerce Subscriptions

## 🚀 Installation

### 1. Install WordPress Theme

```bash
# Clone or download the theme
git clone https://github.com/etelford32/Infinity_Wordpress_Theme.git

# Move to WordPress themes directory
mv Infinity_Wordpress_Theme /path/to/wordpress/wp-content/themes/infinity

# Or upload via WordPress admin: Appearance > Themes > Add New > Upload Theme
```

### 2. Install Required Plugins

1. Go to **Plugins > Add New**
2. Install and activate:
   - WPGraphQL
   - Advanced Custom Fields Pro
   - WooCommerce
   - WooCommerce Subscriptions

### 3. Build Frontend Assets

```bash
cd /path/to/wordpress/wp-content/themes/infinity/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Or run development server
npm run dev
```

### 4. Activate Theme

1. Go to **Appearance > Themes**
2. Activate **Infinity**
3. The theme will automatically:
   - Create custom post types (Simulations, Blueprints, Challenges)
   - Set up user roles (Premium Subscriber)
   - Create database tables for analytics
   - Configure WooCommerce subscription products

## ⚙️ Configuration

### Theme Customizer

Go to **Appearance > Customize** to configure:

#### Visual Theme
- **Dark Cosmic** - Deep space aesthetic with nebula colors
- **Light Playful** - Bright, friendly UI with pastel accents
- **Science Mode (Light)** - Professional academic styling, light variant
- **Science Mode (Dark)** - Professional academic styling, dark variant

#### Subscription Settings
- **Stripe Publishable Key** - Your Stripe public API key
- **Premium Monthly Price** - Set subscription price (default: $20/month)

### Menu Setup

1. Go to **Appearance > Menus**
2. Create menus for:
   - **Primary Menu** - Main navigation
   - **Footer Menu** - Footer links

### Widget Areas

- **Sidebar** - Blog and page sidebar
- **Footer** - Footer widget area

## 📦 Custom Post Types

### Simulations

Main content type for interactive simulations.

**Custom Fields:**
- `simulation_config` (JSON) - Simulation configuration
- `physics_engine` (string) - cannon, ammo, or gpu
- `is_premium` (boolean) - Requires subscription
- `allow_parameter_control` (boolean) - Users can modify parameters
- `min_fps` (integer) - Target minimum frame rate
- `particle_count` (integer) - Number of objects
- `play_count` (integer) - Times simulation has been run
- `avg_session_duration` (integer) - Average time spent (seconds)

**Taxonomies:**
- `simulation_category` - Solar System, Galaxy, Black Hole, etc.
- `difficulty_level` - Beginner, Intermediate, Advanced
- `physics_engine` - Cannon.js, Ammo.js, GPU Compute

### Blueprints

User-created simulation configurations.

**Custom Fields:**
- `blueprint_config` (JSON) - User's configuration
- `base_simulation_id` (integer) - Source simulation
- `visibility` (string) - public, private, unlisted
- `vote_count` (integer) - Community upvotes
- `fork_count` (integer) - Times forked
- `forked_from` (integer) - Parent blueprint ID

### Challenges

Weekly/monthly simulation challenges.

**Custom Fields:**
- `challenge_config` (JSON) - Challenge setup
- `success_criteria` (JSON) - Completion requirements
- `start_date` / `end_date` (datetime) - Challenge period
- `completion_count` (integer) - Users who completed
- `attempt_count` (integer) - Total attempts

## 🔌 REST API Endpoints

Base URL: `/wp-json/infinity/v1/`

### Check Simulation Access
```
GET /simulation/{id}/access
Response: {
  "can_access": true,
  "reason": "",
  "is_premium": false,
  "is_user_premium": false,
  "remaining_simulations": 2
}
```

### Track Simulation Run
```
POST /simulation/{id}/track
Body: { "duration": 300 }
Response: {
  "success": true,
  "remaining_simulations": 1
}
```

### Get User Stats
```
GET /user/stats
Response: {
  "user_id": 123,
  "is_premium": true,
  "blueprints_created": 5,
  "challenges_completed": 3,
  "simulations_today": 0,
  "remaining_today": -1
}
```

### Vote on Blueprint
```
POST /blueprint/{id}/vote
Body: { "vote": "up" }
Response: {
  "success": true,
  "vote_count": 42,
  "user_vote": "up"
}
```

### Fork Blueprint
```
POST /blueprint/{id}/fork
Response: {
  "success": true,
  "forked_id": 456,
  "edit_url": "..."
}
```

## 🎨 Frontend Development

### Technology Stack

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Three.js + React Three Fiber** - 3D rendering
- **Next.js / Vite** - Build system
- **TailwindCSS** - Styling
- **Zustand / Jotai** - State management
- **Cannon.js / Ammo.js** - Physics engines

### Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── Layout/
│   │   ├── Simulation/
│   │   ├── Blueprint/
│   │   └── UI/
│   ├── simulations/      # Simulation implementations
│   │   ├── SolarSystem/
│   │   ├── Galaxy/
│   │   └── BlackHole/
│   ├── lib/             # Utilities
│   │   ├── physics/
│   │   ├── api/
│   │   └── utils/
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── styles/          # Global styles
├── public/              # Static assets
└── package.json
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Creating a New Simulation

1. Create simulation component in `src/simulations/YourSimulation/`
2. Implement physics using chosen engine
3. Register in simulation registry
4. Create WordPress post with matching configuration

Example simulation structure:

```typescript
// src/simulations/SolarSystem/index.tsx
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';

export const SolarSystem = ({ config }) => {
  return (
    <Canvas>
      <Physics>
        <Sun />
        <Planet name="Earth" {...config.earth} />
        <Planet name="Mars" {...config.mars} />
      </Physics>
    </Canvas>
  );
};
```

## 👥 User Roles & Capabilities

### Free User (Subscriber)
- 2 simulation runs per day
- View-only parameter controls
- Read-only forum access
- View community gallery

### Premium Subscriber ($20/month)
- Unlimited simulation runs
- Full parameter control
- Blueprint creator access
- Code tutorials & walkthroughs
- Download simulation configs (JSON)
- Forum posting & DMs
- Upload to community gallery
- Participate in challenges

### Administrator
- All premium features
- Manage simulations, blueprints, challenges
- Moderate user content
- View analytics dashboard
- Configure subscription settings

## 🎯 Simulation Configuration Format

Simulations are configured using JSON stored in post meta.

Example configuration:

```json
{
  "version": "1.0",
  "engine": "cannon",
  "scene": {
    "background": "space",
    "cameraPosition": [0, 10, 20]
  },
  "bodies": [
    {
      "id": "sun",
      "type": "sphere",
      "radius": 5,
      "mass": 1000000,
      "position": [0, 0, 0],
      "material": {
        "color": "#FDB813",
        "emissive": "#FF9500"
      }
    },
    {
      "id": "earth",
      "type": "sphere",
      "radius": 1,
      "mass": 100,
      "position": [15, 0, 0],
      "velocity": [0, 0, 5],
      "material": {
        "texture": "/textures/earth.jpg"
      }
    }
  ],
  "controls": {
    "allowMassChange": true,
    "allowVelocityChange": true,
    "allowAddRemove": false
  },
  "tutorial": {
    "enabled": true,
    "steps": [
      "Use mouse to rotate camera",
      "Scroll to zoom in/out",
      "Click planet to see information"
    ]
  }
}
```

## 📊 Analytics & Tracking

The theme tracks:

- Simulation play counts
- Average session duration
- User engagement metrics
- Subscription conversions
- Challenge completion rates
- Blueprint popularity (votes, forks)

Access analytics via WordPress admin or GraphQL API.

## 🔐 Security Best Practices

- All user input is sanitized and validated
- Nonce verification on form submissions
- Capability checks for restricted actions
- Rate limiting on API endpoints
- CORS configured for headless setup
- Stripe handles all payment data (PCI compliant)

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd frontend

# Connect to Vercel
vercel

# Set environment variables
vercel env add WORDPRESS_API_URL
vercel env add NEXT_PUBLIC_STRIPE_KEY

# Deploy
vercel --prod
```

### Backend (WP Engine)

1. Push WordPress files to WP Engine Git
2. Install plugins via WP Engine dashboard
3. Configure Stripe keys in Customizer
4. Set up SSL certificate
5. Configure headless CORS settings

### Environment Variables

```bash
# .env.local (frontend)
WORDPRESS_API_URL=https://your-site.com/graphql
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
NEXT_PUBLIC_SITE_URL=https://your-frontend.vercel.app
```

## 🛠️ Troubleshooting

### Simulations Not Loading

1. Check browser console for errors
2. Verify `frontend/dist/` files exist
3. Rebuild frontend: `npm run build`
4. Clear WordPress cache

### GraphQL Errors

1. Ensure WPGraphQL plugin is active
2. Flush permalinks: Settings > Permalinks > Save
3. Check `/graphql` endpoint is accessible

### Subscription Issues

1. Verify Stripe keys are set
2. Check WooCommerce Subscriptions is active
3. Test webhook endpoints

### Performance Issues

1. Enable WordPress object caching
2. Use CDN for assets
3. Optimize 3D models (< 10MB)
4. Reduce particle counts for mobile

## 📖 Documentation

Full documentation available at:
- [User Guide](docs/user-guide.md) - For theme users
- [Developer Guide](docs/developer-guide.md) - For developers
- [API Reference](docs/api-reference.md) - REST & GraphQL APIs

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 License

This theme is licensed under the GNU General Public License v2 or later.

## 🙏 Credits

- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **Cannon.js** - Physics engine
- **Ammo.js** - Physics engine
- **WordPress** - CMS platform
- **WPGraphQL** - GraphQL API

## 🚀 Roadmap

### Version 1.1 (Q2 2026)
- [ ] VR/AR support (WebXR)
- [ ] Real-time multiplayer simulations
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard

### Version 1.2 (Q3 2026)
- [ ] AI-assisted simulation creation
- [ ] Educational curriculum integration
- [ ] LMS plugins (Canvas, Moodle)
- [ ] Multi-language support

## 💬 Support

- **Issues:** [GitHub Issues](https://github.com/etelford32/Infinity_Wordpress_Theme/issues)
- **Discussions:** [GitHub Discussions](https://github.com/etelford32/Infinity_Wordpress_Theme/discussions)
- **Email:** support@example.com

---

Made with ❤️ and ☕ by the Infinity team
