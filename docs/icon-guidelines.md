# Icon Library Guidelines

The Scruffy icon library lives in `components/icons/ScruffyIcon.tsx`.  Icons are
purpose-built for the Scruffy Butts brand so they feel cohesive with the rest of
our glassmorphic UI.

## Available icons

| Name      | Description & primary use                                              |
|-----------|------------------------------------------------------------------------|
| `logomark`| Circular paw badge used for the main navigation brand mark.            |
| `paw`     | Versatile paw outline for pet-related badges, buttons, and stats.      |
| `dog`     | Friendly dog face accent for authentication and onboarding surfaces.   |

Import the `ScruffyIcon` component and pass the icon `name` to render any asset:

```tsx
import { ScruffyIcon } from '@/components/icons';

export function Example() {
  return (
    <button className="inline-flex items-center gap-2 rounded-full bg-brand-bubble px-4 py-2 text-white">
      <ScruffyIcon name="paw" size={20} aria-hidden />
      Book grooming
    </button>
  );
}
```

## Design & implementation rules

- **Viewbox:** All icons are drawn on a `24 × 24` artboard and exported as
  React SVG fragments from `ScruffyIcon.tsx`.
- **Line weight:** Use a stroke width of `1.6` with rounded caps and joins. This
  keeps outlines balanced with the typography weights used throughout the app.
- **Color:** Icons inherit their color from `currentColor`. Apply Tailwind
  classes such as `text-brand-bubble` on the parent element instead of hardcoded
  fills. When a fill is required, keep it monochrome and use the same color as
  the stroke.
- **Scaling:** Set the `size` prop (or Tailwind width/height utilities) rather
  than editing the viewbox. This preserves stroke consistency.
- **Accessibility:** Decorative icons should keep `aria-hidden` (the default).
  Provide a `title` or `aria-label` when the icon conveys essential meaning.
- **New icons:** Add the vector to the `iconShapes` map in
  `ScruffyIcon.tsx`. Match the existing coordinate grid, maintain optical
  balance, and test the asset at `20px`, `24px`, and `32px` to ensure clarity.

Following these guidelines keeps every pictogram consistent in weight, rhythm,
and tone so the brand feels intentional across surfaces.
