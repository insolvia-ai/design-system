// SHARED — no react-native / react-dom / base-ui import. Pure TS + cn().
//
// IconButton is Button with the label taken OUT of the box and moved into the
// accessibility tree: a square target holding one glyph, named by a required
// `label`. What every intent MEANS is IMPORTED from button.props rather than
// restated, so a change of heart about what `ghost` looks like moves both
// controls at once and neither can drift into a second opinion.
//
// A BARE <button> HOLDING AN ICON IS A CONSUMER BUG, and this is the component
// that exists so it never has to be one. Three things an icon-only control
// needs, and that a hand-rolled one has to remember every time: an accessible
// name (here it is a REQUIRED prop, so a nameless one does not compile), a
// visible name for a pointer user (`title`, mirrored from the same string, so
// the two cannot disagree), and a hit area a finger can land on
// (`coarseTouchTarget`, below). Every one of those was previously supplied by
// hand at a call site, by a consumer that had grown a lint rule to keep them
// there — which is a good sign the component owed them.
import type * as React from 'react';

import { intentStyles, type ButtonIntent } from '../button/button.props';
import { cn } from '../lib/cn';
import { coarseTouchTarget, disabledStyles, focusRing } from '../lib/styles';

/**
 * Button's intents, verbatim — including `danger`.
 *
 * THIS TYPE USED TO ADD `danger` AND NOW ONLY ALIASES. The reason it was ever
 * separate is recorded in `button.props.ts`, which then had no `danger`
 * intent: the token set carried no measured foreground for a LABEL on a danger
 * fill, and this control has no label — the pixels inside its box are a glyph
 * and its accessible name is read from the accessibility tree. So `danger`
 * lived here, and widening `ButtonIntent` was refused on the grounds that it
 * would make `<Button intent="danger">` expressible before anything measured
 * said it was readable.
 *
 * `tokens` 0.4.0 measured it and shipped `danger-text`, so Button carries the
 * intent now and `danger` is no longer what makes these two sets differ.
 *
 * WHAT MAKES THEM DIFFER NOW IS `overlay`, and it is the same argument with the
 * pieces swapped. An overlay control is drawn on top of a PHOTOGRAPH — a
 * player's transport, a delete affordance on a frame, a filmstrip's arrows —
 * and the surface roles cannot express that: `bg-surface-alt` over a dark frame
 * is invisible and over a bright one is a grey box. The `overlay-*` roles can,
 * because they are the one role set that does not follow the colour scheme (a
 * photograph is not the app's canvas — `tokens.json` argues it out).
 *
 * It stays off Button for the reason `danger` once stayed off it: legibility
 * over arbitrary media is a claim about a glyph, and a RUN OF TEXT on a
 * photograph is a different and much weaker one. `overlay-ink` is measured
 * against `overlay-scrim`, which the caller has to actually lay down; a word
 * floating on an unscrimmed frame is legible over some pixels and not others,
 * and no fill row fixes that. A caller wanting a labelled control over media
 * puts the scrim down itself and reaches for `buttonClass`.
 */
export type IconButtonIntent = ButtonIntent | 'overlay';

/**
 * Square boxes on Button's own height scale: 32dp and 44dp.
 *
 * There is no `lg`. Button's `lg` exists to give a long label room to breathe
 * horizontally, and a square has no label to make room for — `md` is already
 * the WCAG 2.5.5 target-size floor (44dp), so the size above it would be a
 * bigger target than any guideline asks for. `sm` is the same deliberate
 * opt-in to a smaller target that `sizeStyles.sm` documents for Button.
 */
export type IconButtonSize = 'sm' | 'md';

/**
 * The fills — Button's map outright, no longer a copy with a row added.
 *
 * The `danger` row moved to `button.props.ts` when Button gained the intent,
 * which is what makes a text button and an icon button that destroy the same
 * thing read as one control BY CONSTRUCTION rather than by two files agreeing.
 * Re-exported under this name because that is what this component's own class
 * builder and stories call it.
 */
export const iconIntentStyles: Record<IconButtonIntent, string> = {
  ...intentStyles,
  // No fill at rest, like `ghost` — a control over media should be the glyph
  // and nothing else until it is touched. What differs from `ghost` is every
  // colour: these compose over a frame this package cannot see, which is why
  // the hover and active fills are ALPHA whites rather than a solid step.
  overlay: 'bg-transparent text-overlay-ink hover:bg-overlay-hover active:bg-overlay-active',
};

/**
 * The extra fill a PRESSED toggle wears — the intent's own pressed colour, held
 * rather than flashed. `cn()`'s twMerge drops the base `bg-*` it conflicts
 * with and leaves the `hover:`/`active:` variants alone, so a pressed control
 * still answers the pointer.
 *
 * `ghost` fills with `bg-line` rather than staying transparent. That is the one
 * row that matters on a dark media surface, where `line` is a translucent white
 * — the pressed state reads as "on" against the media instead of against a
 * background this component cannot see.
 *
 * `danger` repeats its own hover colour: the token set derives one hovered
 * danger and no pressed one, and inventing a fourth red here is exactly the
 * hard-coded value the semantic layer exists to prevent.
 */
export const pressedStyles: Record<IconButtonIntent, string> = {
  primary: 'bg-primary-active',
  secondary: 'bg-line',
  ghost: 'bg-line',
  danger: 'bg-danger-hover',
  // The same alpha the intent uses when pressed, held rather than flashed —
  // and alpha rather than a solid for the same reason as the row above.
  overlay: 'bg-overlay-active',
};

/**
 * Square boxes, matching Button's `h-8`/`h-11` exactly.
 *
 * The `text-*` step sizes the GLYPH, for the two icon shapes that follow font
 * size — an icon-font character, and an SVG sized in `em`. An SVG with its own
 * `width`/`height` ignores it, which is correct: this package ships no icons
 * deliberately, so the caller's icon keeps the last word.
 */
export const iconSizeStyles: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-11 w-11 text-base',
};

/**
 * The props both leaves share.
 *
 * `disabled` is deliberately absent: each leaf inherits its own platform's
 * (`<button disabled>` on web, `PressableProps['disabled']` on native), and
 * declaring it here would collide with the second of those, which types it as
 * `boolean | null | undefined` — the clash `toggle.native.tsx` documents.
 */
export interface IconButtonOwnProps {
  /**
   * The accessible name — REQUIRED, and the whole reason this component is
   * separate from Button.
   *
   * A button whose only child is a glyph has no accessible name unless
   * something supplies one, and `aria-label` is optional on every DOM button
   * type in React, so a plain `<button>` full of `<XIcon />` type-checks and
   * ships nameless. Making it a required prop is what moves "someone
   * remembered" to "it does not compile" — an unlabelled icon button is not
   * representable here.
   *
   * Both leaves put it in the accessibility tree ONLY (web `aria-label`, native
   * `accessibilityLabel`); the web leaf also mirrors it into `title`, so a
   * sighted pointer user gets the same word as the screen-reader one.
   */
  label: string;
  intent?: IconButtonIntent | undefined;
  size?: IconButtonSize | undefined;
  /**
   * Toggle state. OMIT IT ENTIRELY for a one-shot button — the leaves render
   * no `aria-pressed`/`accessibilityState` at all when it is `undefined`,
   * because `aria-pressed="false"` on a control that never toggles announces a
   * toggle that does not exist.
   *
   * This is a CONTROLLED, presentational prop, not a state machine: it has no
   * `defaultPressed` and no `onPressedChange`. A control that owns its own
   * pressed state is `Toggle`, which already has the standalone-or-grouped
   * model — reach for that instead of growing a second copy here.
   */
  pressed?: boolean | undefined;
  /**
   * The icon. Required: an icon button with no icon is an empty square, and
   * nothing downstream can tell that from a missing import.
   */
  children: React.ReactNode;
}

// The `| undefined` on each member is for `exactOptionalPropertyTypes`, the
// same reason `ButtonClassOptions` carries it.
export interface IconButtonClassOptions {
  intent?: IconButtonIntent | undefined;
  size?: IconButtonSize | undefined;
  pressed?: boolean | undefined;
  className?: string | undefined;
}

/**
 * The icon button's Tailwind classes, exported for the same reason
 * `buttonClass` is: a LINK that looks like an icon button (a close affordance
 * that is really an `<a href>`) needs the styling without the `<button>`.
 * Web-only (Tailwind), but string composition is platform-agnostic, so it
 * lives in the shared module.
 *
 * `intent` defaults to `ghost`, where Button defaults to `primary`. An
 * icon-only control is almost always an affordance sitting ON something else —
 * a toolbar, a card corner, a media surface — and a screen of filled squares
 * is not a design. Emphasis is available by asking for it.
 */
export function iconButtonClass({
  intent = 'ghost',
  size = 'md',
  pressed,
  className,
}: IconButtonClassOptions = {}) {
  return cn(
    'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-0 font-body no-underline transition-colors',
    focusRing,
    disabledStyles,
    iconIntentStyles[intent],
    iconSizeStyles[size],
    // `sm` ONLY. `md` is 44dp already — the floor this exists to reach — so
    // giving it the overlay too would buy nothing and would put a pseudo-
    // element the size of the button on every icon control in the package.
    size === 'sm' && coarseTouchTarget,
    pressed === true && pressedStyles[intent],
    className,
  );
}
