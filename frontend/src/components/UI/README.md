# UI Component Library

A comprehensive, fully customizable UI component library for the Infinity WordPress Theme. All components are theme-aware and automatically adapt to your selected visual theme (Dark Cosmic, Light Playful, Science Mode).

## Design Philosophy

- **Theme-Aware**: All components use CSS variables for automatic theme adaptation
- **Accessible**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Customizable**: Easy to customize via props and className
- **Responsive**: Mobile-first design that works on all screen sizes
- **TypeScript**: Fully typed for better developer experience
- **Consistent**: Unified design language across all components

## Components

### Button

Versatile button component with multiple variants, sizes, and states.

**Variants:**
- `primary` - Main call-to-action (default)
- `secondary` - Secondary actions
- `tertiary` - Subtle actions
- `success` - Positive actions
- `danger` - Destructive actions
- `warning` - Warning actions
- `ghost` - Transparent background
- `outline` - Outlined style

**Sizes:**
- `xs` - Extra small
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large
- `xl` - Extra large

**Usage:**

```tsx
import { Button } from '@components/UI';
import { FaRocket } from 'react-icons/fa';

// Basic button
<Button variant="primary" size="md">
  Click Me
</Button>

// With icon
<Button variant="success" icon={FaRocket} iconPosition="left">
  Launch Simulation
</Button>

// Loading state
<Button variant="primary" loading={isLoading}>
  Save Changes
</Button>

// Full width
<Button variant="primary" fullWidth>
  Continue
</Button>

// Disabled
<Button variant="danger" disabled>
  Delete
</Button>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `ButtonVariant` | `'primary'` | Button style variant |
| `size` | `ButtonSize` | `'md'` | Button size |
| `icon` | `IconType` | - | Icon component from react-icons |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `loading` | `boolean` | `false` | Show loading spinner |
| `fullWidth` | `boolean` | `false` | Take full width of container |
| `disabled` | `boolean` | `false` | Disable button |
| `className` | `string` | `''` | Additional CSS classes |

### Badge

Small label component for status indicators, counts, and tags.

**Variants:**
- `default` - Neutral gray
- `primary` - Theme primary color
- `success` - Green for success
- `warning` - Yellow for warnings
- `danger` - Red for errors
- `info` - Blue for information

**Sizes:**
- `sm` - Small
- `md` - Medium (default)
- `lg` - Large

**Usage:**

```tsx
import { Badge } from '@components/UI';
import { FaStar } from 'react-icons/fa';

// Basic badge
<Badge variant="primary">New</Badge>

// With icon
<Badge variant="success" icon={FaStar}>
  Premium
</Badge>

// Rounded (pill-shaped)
<Badge variant="danger" rounded>
  3 Errors
</Badge>

// Different sizes
<Badge variant="primary" size="sm">Small</Badge>
<Badge variant="primary" size="md">Medium</Badge>
<Badge variant="primary" size="lg">Large</Badge>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `BadgeVariant` | `'default'` | Badge style variant |
| `size` | `BadgeSize` | `'md'` | Badge size |
| `icon` | `IconType` | - | Icon component |
| `rounded` | `boolean` | `false` | Pill-shaped badge |
| `className` | `string` | `''` | Additional CSS classes |

### Card

Flexible container component for grouping related content.

**Variants:**
- `default` - Standard card with border
- `elevated` - Card with shadow elevation
- `outlined` - Card with accent border
- `glass` - Glassmorphism effect

**Padding:**
- `none` - No padding
- `sm` - Small padding
- `md` - Medium padding (default)
- `lg` - Large padding
- `xl` - Extra large padding

**Usage:**

```tsx
import { Card, CardHeader, CardBody, CardFooter, Button } from '@components/UI';
import { FaUser } from 'react-icons/fa';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</Card>

// Card with header, body, footer
<Card variant="elevated" padding="lg">
  <CardHeader
    title="User Profile"
    subtitle="Manage your account settings"
    icon={<FaUser className="w-6 h-6" />}
    action={<Button size="sm">Edit</Button>}
  />

  <CardBody>
    <p>Your profile information here.</p>
  </CardBody>

  <CardFooter>
    <Button variant="primary">Save</Button>
    <Button variant="secondary">Cancel</Button>
  </CardFooter>
</Card>

// Hoverable card
<Card hoverable clickable onClick={() => navigate('/details')}>
  <h3>Click Me</h3>
</Card>

// Gradient card
<Card gradient padding="xl">
  <h3 className="text-white">Premium Feature</h3>
</Card>
```

**Card Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `CardVariant` | `'default'` | Card style variant |
| `padding` | Padding size | `'md'` | Internal padding |
| `hoverable` | `boolean` | `false` | Hover effect |
| `clickable` | `boolean` | `false` | Pointer cursor |
| `gradient` | `boolean` | `false` | Gradient background |
| `onClick` | `function` | - | Click handler |

### Input

Text input field with label, helper text, and error states.

**Usage:**

```tsx
import { Input } from '@components/UI';
import { FaUser, FaEnvelope } from 'react-icons/fa';

// Basic input
<Input
  label="Username"
  placeholder="Enter your username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// With icon
<Input
  label="Email"
  type="email"
  icon={FaEnvelope}
  iconPosition="left"
  placeholder="you@example.com"
/>

// With error
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

// With helper text
<Input
  label="Display Name"
  helperText="This is how others will see you"
  value={displayName}
  onChange={(e) => setDisplayName(e.target.value)}
/>

// Required field
<Input
  label="Email"
  required
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text below input |
| `icon` | `IconType` | - | Icon component |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `true` | Full width |
| `required` | `boolean` | `false` | Required field indicator |

### Textarea

Multi-line text input with label and error states.

**Usage:**

```tsx
import { Textarea } from '@components/UI';

// Basic textarea
<Textarea
  label="Bio"
  placeholder="Tell us about yourself..."
  rows={4}
  value={bio}
  onChange={(e) => setBio(e.target.value)}
/>

// With character counter
<Textarea
  label="Description"
  helperText={`${description.length}/500 characters`}
  maxLength={500}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>

// With error
<Textarea
  label="Comments"
  error="Comments are required"
  value={comments}
  onChange={(e) => setComments(e.target.value)}
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Textarea label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text |
| `rows` | `number` | `4` | Number of rows |
| `fullWidth` | `boolean` | `true` | Full width |

### Select

Dropdown select input with options.

**Usage:**

```tsx
import { Select } from '@components/UI';

const options = [
  { value: 'solar', label: 'Solar System' },
  { value: 'galaxy', label: 'Galaxy' },
  { value: 'blackhole', label: 'Black Hole' },
];

<Select
  label="Simulation Type"
  options={options}
  value={simulationType}
  onChange={(value) => setSimulationType(value)}
  placeholder="Select a simulation..."
/>

// With error
<Select
  label="Physics Engine"
  options={physicsOptions}
  value={physics}
  onChange={setPhysics}
  error="Please select a physics engine"
/>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Select label |
| `options` | `Array<{value, label}>` | - | Options array |
| `value` | `string` | - | Selected value |
| `onChange` | `function` | - | Change handler |
| `placeholder` | `string` | - | Placeholder text |
| `error` | `string` | - | Error message |
| `fullWidth` | `boolean` | `true` | Full width |

## Theme Customization

All components use CSS custom properties (CSS variables) defined in your theme's `style.css`:

```css
:root {
  /* Colors */
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --bg-primary: #0a0e1a;
  --bg-secondary: #141824;
  --bg-tertiary: #1e2330;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #64748b;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-glow-sm: 0 0 10px var(--accent-primary);
  --shadow-glow-md: 0 0 20px var(--accent-primary);
  --shadow-glow-lg: 0 0 30px var(--accent-primary);
}
```

### Creating Custom Themes

To create your own theme, simply override the CSS variables:

```css
[data-theme="my-custom-theme"] {
  --accent-primary: #ff6b6b;
  --accent-secondary: #ee5a6f;
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-tertiary: #a0a0a0;
}
```

Then apply the theme:

```tsx
<div data-theme="my-custom-theme">
  {/* All components will use your custom colors */}
  <Button variant="primary">Custom Theme Button</Button>
</div>
```

## Advanced Customization

### Extending Components

You can extend components with additional styling:

```tsx
import { Button } from '@components/UI';

function MyCustomButton(props) {
  return (
    <Button
      className="my-custom-styles shadow-2xl transform rotate-3"
      {...props}
    />
  );
}
```

### Tailwind CSS Integration

All components work seamlessly with Tailwind CSS:

```tsx
<Card className="max-w-md mx-auto mt-8">
  <Button className="uppercase tracking-wider">
    Stylish Button
  </Button>
</Card>
```

### Custom Variants

Add your own variants by extending the component:

```tsx
import { Button as BaseButton, ButtonProps } from '@components/UI';

type MyButtonVariant = 'neon' | 'holographic';

function Button({ variant, ...props }: ButtonProps & { variant?: MyButtonVariant }) {
  const customVariants = {
    neon: 'bg-cyan-400 text-black hover:shadow-[0_0_20px_#22d3ee]',
    holographic: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
  };

  if (variant && variant in customVariants) {
    return <BaseButton className={customVariants[variant]} {...props} />;
  }

  return <BaseButton variant={variant} {...props} />;
}
```

## Form Examples

### Login Form

```tsx
import { Input, Button, Card, CardHeader, CardBody } from '@components/UI';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Card variant="elevated" padding="lg">
      <CardHeader
        title="Welcome Back"
        subtitle="Sign in to your account"
      />

      <CardBody>
        <form className="space-y-4">
          <Input
            label="Email"
            type="email"
            icon={FaEnvelope}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            icon={FaLock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button variant="primary" fullWidth>
            Sign In
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
```

### User Profile Form

```tsx
import { Input, Textarea, Select, Button } from '@components/UI';

function ProfileForm() {
  return (
    <form className="space-y-6">
      <Input
        label="Display Name"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Textarea
        label="Bio"
        placeholder="Tell us about yourself..."
        rows={4}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        helperText={`${bio.length}/500 characters`}
        maxLength={500}
      />

      <Select
        label="Occupation"
        options={[
          { value: 'student', label: 'Student' },
          { value: 'developer', label: 'Developer' },
          { value: 'researcher', label: 'Researcher' },
          { value: 'educator', label: 'Educator' },
        ]}
        value={occupation}
        onChange={setOccupation}
        placeholder="Select your occupation"
      />

      <div className="flex gap-3">
        <Button variant="primary">Save Changes</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
    </form>
  );
}
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape, Arrow keys)
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Error Handling**: Clear error messages
- **Required Fields**: Visual and semantic indicators

### Testing Accessibility

```tsx
// Good: Accessible button
<Button onClick={handleClick}>
  Save Changes
</Button>

// Bad: Non-accessible div
<div onClick={handleClick}>
  Save Changes
</div>
```

## Performance

Components are optimized for performance:

- **Tree-shaking**: Import only what you need
- **No runtime overhead**: CSS variables (no JS calculations)
- **Minimal re-renders**: Optimized React components
- **Small bundle size**: ~15KB gzipped for entire library

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Migration Guide

### From Other UI Libraries

**From Material-UI:**

```tsx
// Material-UI
<Button variant="contained" color="primary">Click</Button>

// Infinity UI
<Button variant="primary">Click</Button>
```

**From Chakra UI:**

```tsx
// Chakra UI
<Button colorScheme="blue" size="lg">Click</Button>

// Infinity UI
<Button variant="primary" size="lg">Click</Button>
```

## Best Practices

1. **Use semantic HTML**: Components render semantic HTML elements
2. **Provide labels**: Always use labels for form inputs
3. **Handle errors**: Show clear error messages
4. **Loading states**: Use loading prop for async operations
5. **Required fields**: Mark required fields visually and semantically
6. **Consistent spacing**: Use the spacing utilities from Tailwind
7. **Responsive design**: Test on mobile devices

## Troubleshooting

### Styles Not Applying

1. Ensure Tailwind CSS is configured correctly
2. Check that CSS variables are defined in your theme
3. Verify `data-theme` attribute is set on a parent element

### TypeScript Errors

1. Make sure you're importing types correctly
2. Update `@types/react` to latest version
3. Check that props match the interface

### Icons Not Showing

1. Install `react-icons`: `npm install react-icons`
2. Import icons from the correct package:
   ```tsx
   import { FaRocket } from 'react-icons/fa';
   ```

## Examples Repository

Find more examples at: `/docs/ui-components/examples`

## Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

## License

MIT License - see `LICENSE` file for details.
