# Gdrive Link App

A LinkApp built with modern tools and best practices.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎨 Customization

### Update Configuration

Edit `linkapp.config.ts` to update your LinkApp metadata, settings, and URL match rules.

### Add Components

Use the component registry to add pre-built UI components:

```bash
npx @linktr.ee/linkapp add button
```

### Static Assets

Place static assets like images, SVGs, or other files in the `public/` directory. These files will be:
- Served at the root path during development (e.g., `/image.png`)
- Copied to the build output as-is (no hashing)
- Included in deployments to S3

```tsx
// Reference public assets with absolute paths
<img src="/logo.png" alt="Logo" />

// Or use them in CSS
background-image: url('/background.svg');
```

### Theming

The LinkApp automatically adapts to the Linktree profile theme. CSS custom properties are available:

- `--linktree-bg-color`
- `--linktree-text-color`
- `--linktree-border-color`
- `--linktree-border-radius`

## 🔧 Development

### Type Safety

This project uses TypeScript with strict mode enabled. The `@/` alias is configured for clean imports.

### Linting & Formatting

```bash
# Run Biome linter
npm run lint

# Format code
npm run format

# Type check
npm run check-types
```

## 📦 Deployment

```bash
# Build for production
npm run build

# Deploy to Linktree
npx @linktr.ee/linkapp deploy

# Deploy to QA
npx @linktr.ee/linkapp deploy --qa
```

## 📚 Learn More

- [LinkApp Documentation](https://docs.linktr.ee/link-apps)
- [Rsbuild Documentation](https://rsbuild.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
