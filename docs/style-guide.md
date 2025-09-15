# UI Style Guide

This project now relies on a shared set of Tailwind tokens to keep our surfaces, typography, and spacing consistent. Tokens are defined in [`tailwind.config.ts`](../tailwind.config.ts) and surfaced as utility classes. You can also import the `designTokens` export when a JavaScript representation is helpful (for example, when configuring charts).

## Color tokens

| Token | Utility prefix | Notes |
| --- | --- | --- |
| `colors.primary.*`, `colors.secondary.*`, `colors.brand.*` | `bg-`, `text-`, `from-`, `to-` | Brand palette for gradients, accents, and status messaging. |
| `colors.surface.glass` | `bg-surface-glass` | Translucent glass backgrounds (used by the glass panel). |
| `colors.surface.hover` | `bg-surface-hover` | Hover overlays for navigation and interactive elements. |
| `colors.surface.overlay` | `bg-surface-overlay` | High-contrast overlays such as active navigation states. |
| `colors.surface.frosted` | `bg-surface-frosted` | Solid frosted cards. |
| `colors.surface.strong` | `bg-surface-strong` | Opaque chips or avatar backgrounds. |
| `colors.border.*` | `border-border-*`, `ring-border-*` | Border and ring accents tuned for glass surfaces. |
| `colors.text.inverse*` | `text-text-inverse*` | Inverse text levels when sitting on dark or gradient surfaces. |

## Spacing tokens

Spacing tokens live under `spacing.space-*` and are available through sizing, padding, margin, gap, and inset utilities (e.g. `px-space-lg`, `gap-space-xs`, `h-space-3xl`).

| Token | Value | Common usage |
| --- | --- | --- |
| `space-2xs` | `0.25rem` | Tight gutters and icon paddings. |
| `space-xs` | `0.5rem` | Small gaps and compact controls. |
| `space-sm` | `0.75rem` | Input padding and condensed stack spacing. |
| `space-md` | `1rem` | Default body padding and gaps. |
| `space-lg` | `1.5rem` | Card padding and section gutters. |
| `space-xl` | `2rem` | Wider layout gutters. |
| `space-3xl` | `3rem` | Avatar sizing (e.g. the nav paw icon). |
| `space-4xl` to `space-8xl` | `4rem` – `20rem` | Large glows and hero layout offsets. |

## Typography tokens

Typography is grouped under `typography`:

- Font sizes: `text-label-xs`, `text-body-sm`, `text-body-md`, `text-title-sm`, `text-title-md`, `text-display-sm`
- Font weights: `font-regular`, `font-medium`, `font-emphasis`, `font-strong`, `font-display`, `font-brand`
- Letter spacing helpers: `tracking-eyebrow` for the eyebrow/label treatment and `tracking-brand` for subtle negative spacing on display text.

Combine font-size and weight tokens to match the product voice. For example, the brand wordmark uses `text-title-md font-brand tracking-brand`.

## Elevation tokens

Elevation tokens map to the `shadow-elevation-*` utilities. Use larger values sparingly to maintain depth hierarchy.

| Token | Use case |
| --- | --- |
| `shadow-elevation-xs` | Inputs and lightweight controls. |
| `shadow-elevation-sm` | Active navigation or chips. |
| `shadow-elevation-md` | Cards and widgets on light surfaces. |
| `shadow-elevation-lg` | Prominent glass panels and dashboard widgets. |

## Usage examples

```tsx
// Navigation link (TopNav.tsx)
<Link
  href="/dashboard"
  className="nav-link text-text-inverse-muted hover:text-text-inverse"
>
  Dashboard
</Link>

// Widget container (Widget.tsx)
<div className="rounded-5xl border border-border-contrast bg-gradient-to-br from-brand-oceanDark ... shadow-elevation-lg" />
```

Refer back to this guide when building new components so that colors, spacing, typography, and elevation stay consistent across the application.
