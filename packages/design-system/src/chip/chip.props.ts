// SHARED — no react-native / react-dom / base-ui import. Pure TS + cn().
//
// A chip is a bordered, pressable LABEL: a tag filter, a nav link on a phone,
// a "which of these is involved" row. What separates it from the three
// pressable things this package already ships is worth stating, because the
// question "why not just use that one" has a different answer each time.
//
//   Badge   looks like this and is not pressable — it is a status marker, and
//           giving it a press would make every status marker look actionable.
//   Toggle  is pressable and OWNS ITS STATE (standalone or through a group);
//           it also draws as a filled/unfilled control with no border, which is
//           a segmented-control shape rather than a chip shape.
//   Button  is a call to action. A row of twelve of them is not a design.
//
// So this is the fourth thing: a border at rest, a fill when pressed, and no
// state of its own. A consumer drew it three times from scratch, with three
// slightly different class strings, before collapsing them into one local
// helper — which is the shape of a gap in this package rather than a gap in
// that app.
import { cn } from '../lib/cn';
import { coarseTouchTarget, disabledStyles, focusRing } from '../lib/styles';

export type ChipSize = 'sm' | 'md';

/**
 * The two sizes, on the same height scale as Button and Toggle — `sm` is 32dp
 * and `md` is 44dp, so a chip row and a button beside it agree.
 *
 * `sm` is the one a phone's nav row wants and is where chips are most common;
 * `md` is the default anyway, because a control that defaults to below the
 * WCAG 2.5.5 target size is a defect waiting for someone to not notice it.
 * `sm` gets the coarse-pointer hit area for exactly that reason — a wide chip
 * only misses the floor vertically, and the centred overlay in
 * `coarseTouchTarget` extends it there while adding nothing to a chip already
 * wider than 44.
 */
export const chipSizeStyles: Record<ChipSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-11 gap-2 px-4 text-sm',
};

/**
 * Rest and pressed, both from the semantic layer.
 *
 * The border is what makes a chip a chip, and it is the reason a `pressed`
 * chip sets `border-primary` rather than dropping the border: a shape that
 * loses its outline when selected changes SIZE by two pixels as you press it,
 * and a row of them reflows. Both rows carry a border; only its colour moves.
 *
 * At rest the label is `muted` and the hover lifts it to `ink` — a chip row is
 * usually long, and twelve labels at full contrast compete with whatever the
 * page is actually about.
 *
 * Radius comes from `rounded-md`, so a brand whose corners are square gets
 * square chips from its own `--radius-md` and this file never learns about it.
 */
export const chipStateStyles = {
  rest: 'border-line bg-transparent text-muted hover:bg-surface-alt hover:text-ink',
  pressed: 'border-primary bg-primary text-primary-text hover:bg-primary-hover',
} as const;

// The `| undefined` on each member is for `exactOptionalPropertyTypes`, the
// same reason `ButtonClassOptions` carries it.
export interface ChipClassOptions {
  pressed?: boolean | undefined;
  size?: ChipSize | undefined;
  className?: string | undefined;
}

/**
 * The chip's Tailwind classes, exported for the reason `buttonClass` and
 * `iconButtonClass` are — and here it is the PRIMARY interface rather than a
 * convenience. The two shapes a chip actually takes are a `<button
 * aria-pressed>` and a router link, and a link cannot be a `<button>`: a
 * `NavLink` takes a FUNCTION `className` that is handed the active state, so
 * the caller needs the string, not a wrapping component.
 *
 *   <NavLink to="/runs" className={({ isActive }) => chipClass({ pressed: isActive })}>
 *
 * `Chip` itself is the `<button>` case, which is common enough to deserve the
 * component and simple enough not to need `asChild` — the same split Button
 * documents, and the reason this package ships no polymorphic `as`.
 *
 * Web-only (Tailwind), but string composition is platform-agnostic, so it
 * lives in the shared props module.
 */
export function chipClass({ pressed, size = 'md', className }: ChipClassOptions = {}) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border font-body font-medium no-underline transition-colors',
    focusRing,
    disabledStyles,
    chipSizeStyles[size],
    pressed === true ? chipStateStyles.pressed : chipStateStyles.rest,
    size === 'sm' && coarseTouchTarget,
    className,
  );
}
