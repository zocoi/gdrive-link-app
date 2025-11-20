import Featured from "@/app/featured";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import { THEME_PRESETS } from "@linktr.ee/linkapp/dev-server/shared/theme-presets";
import { getThemeFromUrl, mergeThemeProps } from "@linktr.ee/linkapp/dev-server/shared/theme-utils";

// Declare global window properties for theme and font application
declare global {
  interface Window {
    __linkapp_applyTheme?: (variables: Record<string, string>) => void
    __linkapp_applyFont?: (fontData: {
      fontFamily: string
      fontStyle?: string
      cssUrl?: string
    }) => void
  }
}

// Preview props injected by dev server via Rsbuild define
declare const __PREVIEW_PROPS__: Record<string, unknown>;

// Extract just the variables from THEME_PRESETS for theme lookups
const THEME_VARS = Object.fromEntries(
  Object.entries(THEME_PRESETS).map(([key, { variables }]) => [key, variables])
);

// Get theme variables and groupLayoutOption from URL
const params = new URLSearchParams(window.location.search);
const groupLayoutOptionParam = params.get('groupLayoutOption');
const themeVariables = getThemeFromUrl(THEME_VARS) || THEME_PRESETS.default.variables;

// Get the selected theme for font application
const themeKey = params.get("theme") || "default";
const selectedTheme = THEME_PRESETS[themeKey as keyof typeof THEME_PRESETS] || THEME_PRESETS.default;

// Merge with preview props and add groupLayoutOption
const previewProps = __PREVIEW_PROPS__ || {};
const mergedProps = mergeThemeProps(themeVariables, previewProps, {
  groupLayoutOption: groupLayoutOptionParam || undefined,
});

// Apply theme CSS variables on mount (always apply, even if default)
if (window.__linkapp_applyTheme) {
  window.__linkapp_applyTheme(themeVariables);
}

// Apply font on mount
if (selectedTheme.font && window.__linkapp_applyFont) {
  window.__linkapp_applyFont(selectedTheme.font);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Only Featured layout is available
const LayoutComponent = Featured;

createRoot(rootElement).render(
  <StrictMode>
    <LayoutComponent {...mergedProps} />
  </StrictMode>,
);
