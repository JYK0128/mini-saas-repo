---
name: web-design-guidelines
description: Maintain high aesthetic standards and consistent styling in the project. Formalize visual identity, color system (OKLCH), and Tailwind v4 styling patterns.
---

# Web Design Guidelines (Premium Aesthetics)

Use this skill to ensure all UI elements in the `admin-web` and `@repo/ui` packages meet the "Rich Aesthetics" standard while utilizing the project's Tailwind v4 and OKLCH-based theme.

## 1. Core Aesthetic Principles (The "WOW" Factor)

- **Prioritize Visual Excellence**: Designs MUST feel premium. Avoid generic colors; use the project's curated OKLCH palette.
- **Dynamic Design**: Interfaces should focus on layout, typography, and color consistency. Avoid using animations or transitions.
- **Glassmorphism & Depth**: Use backdrop-blurs, subtle shadows (`shadow-sm`, `shadow-md`), and thin borders (`border-border/10`) to create layering.
- **No Placeholders**: Always use generated images or rich icons (Lucide/Geist) instead of text placeholders.

---

## 2. Color System: OKLCH & Tokens

The project uses **OKLCH** for high-precision color definitions and **CSS Tokens** for semantic consistency.

- **Semantic Tokens**:
  - `var(--background)`: Page background.
  - `var(--foreground)`: Default text color.
  - `var(--primary)`: Main brand color (Deep Zinc/Black in light, Light Zinc/White in dark).
  - `var(--muted)`, `var(--accent)`, `var(--card)`.
- **Palette Tokens** (from `variables.css`):
  - `var(--color-zinc-50)` to `var(--color-zinc-950)`.
  - `var(--color-blue-500)`, `var(--color-indigo-600)`, etc.

### [Recipe] Glassmorphic Surface

```typescript
<div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md border border-white/20 dark:border-zinc-800/50 shadow-xl rounded-2xl p-6">
  {content}
</div>
```

---

## 3. Typography & Spacing

- **Heading**: Use `font-sans` (Geist Variable) with `font-extrabold` and `tracking-tighter` for impact.
- **Body**: Standard `font-sans` with appropriate line heights (`leading-relaxed`).
- **Spacing Tokens**: Use `var(--spacing-md)` or Tailwind standard classes (`p-4`, `gap-6`).

### [Recipe] Modern Hero Header

```typescript
<h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter bg-linear-to-br from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-white dark:to-zinc-500 py-2">
  Dashboard Overview
</h1>
```

---

## 4. No Animation Rule

- **Prohibit Animations**: Explicitly do NOT use animations, transitions, or motion effects. 
- **Focus on Static Excellence**: UI should be visually stunning without relying on movement.
- **Zero Motion**: Strictly avoid `animate-in`, `hover:scale`, or any frame-based transitions.

---

## 5. Dark Mode Implementation

The project uses the `.dark` class and a `@custom-variant dark`. Always ensure dark mode compliance.

- Use the `dark:` utility: `bg-white dark:bg-zinc-950`.
- Leverage OKLCH variables which automatically swap values in the `.dark` selector in `index.css`.

---

## 6. Layout Selection: Flex vs. Grid

Choose the layout tool based on the primary axis of your distribution.

### When to use Flexbox (`flex`)

- **Horizontal Layouts**: Use for side-by-side items (rows).
- **Component Parts**: Logo + Nav in header, button groups, icon + text pairs.
- **Common Utilities**: `flex`, `items-center`, `justify-between`, `gap-x-4`.

### When to use Grid (`grid`)

- **Vertical Layouts**: Use for stacking sections and structured page architecture.
- **Complex Page Structures**: Sidebars + main content area, dashboard section stacks.
- **Card Grids**: Displaying a collection of items across multiple columns/rows.
- **Common Utilities**: `grid`, `grid-cols-12`, `grid-rows-1`, `gap-y-6`.

### [Checklist] Structured Layout

- [ ] Uses Flex for horizontal distribution (rows).
- [ ] Uses Grid for vertical distribution (stacking) and page architecture.
- [ ] Leverages `gap-*` consistently (prefers it over `margin` or `padding` for spacing children).
- [ ] Uses OKLCH-based semantic tokens.
- [ ] Does NOT include any animations or transitions.
- [ ] Supports light and dark mode with high contrast.
- [ ] Follows the Geist typography standards.
- [ ] Utilizes radius tokens for consistent rounding.
