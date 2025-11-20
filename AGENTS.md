# AGENTS.md

Guidance for code agents working on the React + TypeScript LinkApp template. Assumes familiarity with React, TypeScript, Tailwind, and the Linktree platform.

## Quick Orientation

- This template is intended to be used as a standalone LinkApp project (not necessarily inside a monorepo). It depends on `@linktr.ee/linkapp` for build tooling, layouts, types, and deployment.
- Rendering entrypoints: `app/sheet.tsx` (default links) and `app/featured.tsx` (featured placement). Add `app/featured-carousel.tsx` if you need carousel behaviour.
- UI logic sits in `components/flex.tsx`; types in `lib/types.ts`; theme tokens in `app/globals.css`.
- Central configuration in `linkapp.config.ts` powers manifest metadata, settings schema, and preview props. The schema drives the props your components receive.

## File Map (template root)

- `app/`: layouts (`sheet.tsx`, `featured.tsx`), global styles (`globals.css`), app icon (`icon.svg`).
- `components/`: UI building blocks (`flex.tsx`); add new components here.
- `lib/`: shared types (`types.ts`).
- `public/`: static assets served from `/`.
- `linkapp.config.ts`: manifest, settings schema, preview props.
- `tsconfig.json`: TypeScript config + path alias `@/`.
- `biome.json`: lint/format rules.

## Core Commands (standalone project root)

```bash
# Dev loop
npm run dev                # hot reload via @linktr.ee/linkapp dev (Rsbuild)

# Quality gates
npm run lint               # Biome lint rules (no any, 2-space indent, 120 cols)
npm run format             # Biome format
npm run check-types        # TypeScript strict mode

# Build & deploy
npm run build              # production bundle (Rspack/Rsbuild)
npm run deploy             # deploy to prod
npx @linktr.ee/linkapp deploy --qa

# Component registry
npx @linktr.ee/linkapp add button
```

## Architecture & Data Flow

- `linkapp.config.ts` (config):
  - `manifest`: name, tagline, search terms, support links, author contacts.
  - `settings`: schema for Linktree Admin; current template exposes `statsList` as an array of `{ name, value }` (max 6, required min lengths). `array_options` define button labels and preview formatting.
  - `url_match_rules`: host/pattern matching; empty by default. Add when pairing with URL sources.
  - `preview_props`: default props for preview/dev; must align with the settings schema.
  - Uses `satisfies LinkAppConfig` for compile-time validation.
- Props pipeline:
  - Settings → validated by Linktree backend → delivered to React entry (`AppProps` in `lib/types.ts`) → consumed by `components/flex.tsx`.
  - Add/change settings in config, then mirror the shape in `lib/types.ts` and consume in components.
- Layouts:
  - `app/sheet.tsx`: wraps content with padding for classic link rows.
  - `app/featured.tsx`: bare wrapper for featured placement.
  - Add `app/featured-carousel.tsx` if the app supports `groupLayoutOption === "carousel"`.
- Theming:
  - Use Linktree design tokens exposed as CSS vars and Tailwind utilities in `globals.css`: `bg-linktree-primary`, `text-linktree-button-text`, `rounded-linktree`, `--spacing-linktree-link-gap`, font tokens, etc.
  - Never hardcode brand colors; rely on tokens to stay in sync with profile themes.

## Working Style for Agents

- Keep ASCII-only edits unless the file already requires otherwise.
- Preserve existing user changes; do not revert unrelated diffs.
- Use path alias `@/` instead of relative path soup.
- Add only concise, high-value comments when code intent is non-obvious.
- Prefer `rg` for searching; avoid destructive git commands.

## Building or Extending a LinkApp (Checklist)

1) **Define intent**: what does the LinkApp show or do? Reuse the stats scaffold or swap it for your UI.  
2) **Shape settings** in `linkapp.config.ts`:
   - Choose input types (`SettingsElementInput.text`, `array`, `select`, `boolean`).
   - Add validation early (`required`, `minLength`, `maxLength`, `maxSize`, etc.).
   - Update `preview_props` so dev/Backstage preview has realistic data.  
3) **Sync types** in `lib/types.ts` to match the config shape for end-to-end type safety.  
4) **Render layouts**:
   - Update `components/flex.tsx` or create new components under `components/`.
   - Ensure both `sheet` and `featured` layouts import the same core component unless you need divergent UIs.  
5) **Honor theming**: stick to `bg-linktree-*`, `text-linktree-*`, `rounded-linktree` utilities; avoid raw hex codes.  
6) **Validate locally**: `npm run lint`, `npm run check-types`, build if making bundler-affecting changes.  
7) **Deploy**: `npm run build && npm run deploy` (or `--qa`). Keep `linkapp.config.ts` tidy; manifest fields are required for publishing.

## Examples

**Add a toggle to hide empty stats**

`linkapp.config.ts` (settings excerpt):
```ts
{
  id: "hideEmpty",
  title: "Hide empty stats",
  inputType: SettingsElementInput.boolean,
  validation: { required: false },
}
```

`lib/types.ts`:
```ts
export type AppProps = LinktreeLinkAppContext & {
  statsList?: Stat[];
  hideEmpty?: boolean;
};
```

`components/flex.tsx`:
```ts
const stats = (props.statsList || []).filter((stat) => {
  if (!props.hideEmpty) return true;
  return stat.name?.trim() && stat.value?.trim();
});
```

**Add featured carousel support**

Create `app/featured-carousel.tsx`:
```tsx
import { Flex } from "@/components/flex";
import "./globals.css";
import type { AppProps } from "@/lib/types";

export default function FeaturedCarousel(props: AppProps) {
  return (
    <div className="px-2 py-3">
      <Flex {...props} />
    </div>
  );
}
```

Update `linkapp.config.ts`:
```ts
settings: {
  ...,
  supports_featured_layout: true,
  supports_featured_carousel_layout: true,
},
```

**Sample React TSX: hero stats card with CTA**

`linkapp.config.ts` (settings excerpt):
```ts
{
  id: "headline",
  title: "Headline",
  inputType: SettingsElementInput.text,
  validation: { required: true, minLength: 4, maxLength: 80 },
},
{
  id: "ctaLabel",
  title: "Button label",
  inputType: SettingsElementInput.text,
  validation: { required: false, maxLength: 30 },
},
{
  id: "ctaUrl",
  title: "Button link",
  inputType: SettingsElementInput.url,
  validation: { required: false },
},
```

`lib/types.ts`:
```ts
export type AppProps = LinktreeLinkAppContext & {
  statsList?: Stat[];
  headline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};
```

`components/hero.tsx`:
```tsx
import type { FC } from "react";
import type { AppProps } from "@/lib/types";

export const Hero: FC<AppProps> = ({ headline, ctaLabel, ctaUrl, statsList }) => {
  const stats = statsList?.slice(0, 4) ?? [];

  return (
    <div className="rounded-linktree bg-linktree-primary px-5 py-6 shadow-sm">
      <div className="text-lg font-semibold text-linktree-button-text">{headline || "Your headline"}</div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={`${stat.name}-${stat.value}`} className="rounded-linktree bg-linktree-button-bg/20 px-3 py-2">
            <div className="text-sm font-medium text-linktree-button-text">{stat.name}</div>
            <div className="text-xl font-bold text-linktree-button-text">{stat.value}</div>
          </div>
        ))}
      </div>
      {ctaLabel && ctaUrl ? (
        <a
          href={ctaUrl}
          className="mt-4 inline-flex w-full items-center justify-center rounded-linktree bg-linktree-button-bg px-4 py-2 text-sm font-semibold text-linktree-button-text"
        >
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
};
```

In `app/sheet.tsx` (replace `Flex` import):
```tsx
import { Hero } from "@/components/hero";
import type { AppProps } from "@/lib/types";
import "./globals.css";

export default function Classic(props: AppProps) {
  return (
    <div className="p-4">
      <Hero {...props} />
    </div>
  );
}
```

**Sample React TSX: switchable metric view (select + cards)**

`linkapp.config.ts` settings excerpt:
```ts
{
  id: "primaryMetric",
  title: "Primary metric",
  inputType: SettingsElementInput.select,
  options: [
    { label: "Followers", value: "followers" },
    { label: "Views", value: "views" },
    { label: "Projects", value: "projects" },
  ],
  validation: { required: true },
},
{
  id: "primaryValue",
  title: "Primary value",
  inputType: SettingsElementInput.text,
  validation: { required: true },
},
```

`lib/types.ts`:
```ts
export type AppProps = LinktreeLinkAppContext & {
  statsList?: Stat[];
  primaryMetric?: string;
  primaryValue?: string;
};
```

`components/metric-card.tsx`:
```tsx
import type { FC } from "react";
import type { AppProps } from "@/lib/types";

const metricLabels: Record<string, string> = {
  followers: "Followers",
  views: "Monthly views",
  projects: "Projects",
};

export const MetricCard: FC<AppProps> = ({ primaryMetric, primaryValue, statsList }) => {
  const stats = statsList ?? [];
  const label = primaryMetric ? metricLabels[primaryMetric] ?? primaryMetric : "Primary metric";

  return (
    <div className="rounded-linktree bg-linktree-primary px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-linktree-button-text/70">{label}</div>
          <div className="text-3xl font-bold text-linktree-button-text">{primaryValue || "—"}</div>
        </div>
        <div className="rounded-linktree bg-linktree-button-bg/20 px-3 py-2 text-xs font-semibold text-linktree-button-text">
          Highlights
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.slice(0, 4).map((stat) => (
          <div key={`${stat.name}-${stat.value}`} className="rounded-linktree bg-linktree-button-bg/10 px-3 py-2">
            <div className="text-xs text-linktree-button-text/70">{stat.name}</div>
            <div className="text-lg font-semibold text-linktree-button-text">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

Swap into `app/sheet.tsx` to render:
```tsx
import { MetricCard } from "@/components/metric-card";
import type { AppProps } from "@/lib/types";
import "./globals.css";

export default function Classic(props: AppProps) {
  return (
    <div className="p-4">
      <MetricCard {...props} />
    </div>
  );
}
```

## Patterns to Borrow

- If you pulled this from a larger repo, look for sibling example LinkApps for inspiration (e.g., gallery-style arrays, URL match rules, media handling). In a standalone context, mirror those patterns by extending `linkapp.config.ts` and `components/` as shown in the Examples section.

## Styling & Layout Tips

- Constraints: keep stat grid to max two columns; adjust padding/gaps based on item count (see `getGapClass`, `getPaddingClass` in `components/flex.tsx`).
- Numbers: `formatValue` already adds `K/M` suffixes; extend here for locale/units instead of reimplementing formatting downstream.
- Accessibility: keep text contrast via Linktree tokens; use semantic headings/text where possible.
- Assets: drop files into `public/` and reference with absolute paths (`/logo.svg`).
- Token cheat sheet (Tailwind utilities map to CSS vars): `bg-linktree-primary`, `text-linktree-button-text`, `bg-linktree-button-bg`, `rounded-linktree`, `text-linktree-button-text/70`.
- Keep imports of `./globals.css` in every entry component to ensure token classes exist at runtime.

## Debugging & QA

- Props sanity: log `props` in `app/sheet.tsx` during dev to confirm settings arrive as expected; ensure shape matches `linkapp.config.ts`.
- Preview data: update `preview_props` when you add settings so admin preview renders realistic content.
- Layout verification: test both `sheet` and `featured` entrypoints; keep spacing consistent with surrounding links.
- Lint/type-first: run `npm run lint && npm run check-types` before builds; Biome/TS will catch most regressions early.
- Asset paths: if images do not load, confirm they live under `public/` and are referenced with absolute paths (e.g., `/badge.svg`).

## Troubleshooting

- **Stats not rendering**: ensure `preview_props.statsList` matches the schema and that `statsList` exists in props. The UI displays a placeholder when empty.
- **Theme mismatch**: verify you are using tokenized classes and that `app/globals.css` is imported in every entry component.
- **Type errors**: align `linkapp.config.ts` settings with `lib/types.ts`; `noUncheckedIndexedAccess` is on, so guard optional props.
- **Build fails**: run `npm run lint` before `npm run build`; Biome catches most syntax/style regressions early.

## Publishing Checklist

- Manifest is fully populated (name, tagline, description array, category, search terms, author contact).
- Settings schema matches the UI and includes validation and copy for the admin panel.
- Preview props demonstrate the intended appearance with realistic values.
- Lint, type-check, and build succeed (`npm run lint && npm run check-types && npm run build`).
- If adding registry components, ensure `components.json` aliases remain correct and `globals.css` includes any base styles they require.
- Authenticated before deploy: `npx @linktr.ee/linkapp login` (or `--qa` for QA), then `npm run deploy`.
