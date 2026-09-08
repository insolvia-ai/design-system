// SHARED — no react-native / react-dom / base-ui import. Pure data plus the
// two context shapes both leaves consume: WHERE an item sits (`position`),
// and WHICH item it is (`index`/`last`). Every rendered node — the `<ol>`
// against a `View`, the dot against a filled `View` circle — stays in the
// leaves; only the shape of the state is shared.
import * as React from 'react';

export type TimelinePosition = 'right' | 'left' | 'alternate';
export type TimelineIntent = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export type TimelineMarkerVariant = 'filled' | 'outlined';
export type TimelineSide = 'left' | 'right';

/** `Timeline.Root`'s own props, shared so a leaf's `RootProps` can extend it. */
export interface TimelineRootOwnProps {
  /**
   * Which side of the connecting line the content sits on. `'alternate'`
   * flips every other item — see `resolveTimelineItemSide`.
   * @default 'right'
   */
  position?: TimelinePosition | undefined;
}

export interface TimelineRootContextValue {
  position: TimelinePosition;
}

export const TimelineRootContext = React.createContext<TimelineRootContextValue | null>(null);

export function useTimelineRootContext(part: string): TimelineRootContextValue {
  const ctx = React.useContext(TimelineRootContext);
  if (!ctx) throw new Error(`Timeline.${part} must be rendered inside <Timeline.Root>`);
  return ctx;
}

/**
 * An item's position within its Root: which one it is, and whether anything
 * comes after it. Private to this component — never exported from `index.ts`
 * — because nothing outside `Item` reads it; `Marker`/`Connector`/`Content`/
 * `Opposite` take their own props directly.
 */
export interface TimelineItemContextValue {
  index: number;
  last: boolean;
}

export const TimelineItemContext = React.createContext<TimelineItemContextValue | null>(null);

/**
 * WHY A CONTEXT PER ITEM, RATHER THAN `React.cloneElement` INJECTING HIDDEN
 * PROPS. Root already knows every item's index the moment it maps over its
 * children (`React.Children.map`, the same tool Breadcrumbs' Root uses to
 * interleave separators) — the question is only how to hand that index to an
 * `Item` that does not otherwise know its own position in the list.
 * `cloneElement` would work, but it would mean `TimelineItemProps` carrying an
 * internal `index`/`last` field that has to type-check against arbitrary
 * `Item` usage and that nothing stops a caller from passing themselves.
 * Wrapping each mapped child in its OWN `<TimelineItemContext.Provider>`
 * keeps that value out of props entirely — `Item` reads it with
 * `useContext`, exactly as `Tab`/`Panel` read `TabsRootContext`, and there is
 * no field to accidentally expose.
 */
export function useTimelineItemContext(): TimelineItemContextValue {
  const ctx = React.useContext(TimelineItemContext);
  // Falls back to "first of one" rather than throwing: an `Item` rendered
  // outside `Root` (a snapshot in a test, a story fragment) still needs a
  // side and a connector to draw, and defaulting is what every other part
  // here does when data-only props are omitted — it is not an error a caller
  // needs a stack trace for.
  return ctx ?? { index: 0, last: true };
}

/**
 * Which side an item's content sits on. Fixed positions are constant for
 * every item; `'alternate'` starts at `'right'` (matching the default fixed
 * position) and flips every OTHER item after it — so the 2nd, 4th, 6th…
 * items (`index` 1, 3, 5…) are the ones that flip to `'left'`.
 */
export function resolveTimelineItemSide(position: TimelinePosition, index: number): TimelineSide {
  if (position !== 'alternate') return position;
  return index % 2 === 0 ? 'right' : 'left';
}

/**
 * The `displayName` each leaf's part carries — matched by STRING rather than
 * by function identity so this shared, renderer-free module never has to
 * import a leaf. `Item` uses these to sort its own children into the marker
 * column vs. the content/opposite slots without either leaf hard-coding
 * "children[0] is the marker".
 */
export const TIMELINE_PART_NAMES = {
  marker: 'Timeline.Marker',
  connector: 'Timeline.Connector',
  content: 'Timeline.Content',
  opposite: 'Timeline.Opposite',
} as const;

export interface TimelineItemChildGroups {
  opposite: React.ReactElement[];
  marker: React.ReactElement[];
  connector: React.ReactElement[];
  content: React.ReactElement[];
}

/** Sorts an `Item`'s children into the four known parts. Anything else — a
 * caller's stray node — is silently dropped: `Item`'s slots are fixed, and
 * there is nowhere unrecognised content could go that would not misrepresent
 * which part it is. */
export function groupTimelineItemChildren(children: React.ReactNode): TimelineItemChildGroups {
  const groups: TimelineItemChildGroups = { opposite: [], marker: [], connector: [], content: [] };
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const name = (child.type as { displayName?: string } | undefined)?.displayName;
    if (name === TIMELINE_PART_NAMES.opposite) groups.opposite.push(child);
    else if (name === TIMELINE_PART_NAMES.marker) groups.marker.push(child);
    else if (name === TIMELINE_PART_NAMES.connector) groups.connector.push(child);
    else if (name === TIMELINE_PART_NAMES.content) groups.content.push(child);
  });
  return groups;
}

/** The dot/ring fill per intent, `neutral` excluded — see each leaf for why
 * `neutral` renders a `line`-coloured ring instead of joining this map. */
export const markerFillClass: Record<Exclude<TimelineIntent, 'neutral'>, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export const markerRingClass: Record<Exclude<TimelineIntent, 'neutral'>, string> = {
  primary: 'border-primary',
  success: 'border-success',
  warning: 'border-warning',
  danger: 'border-danger',
};

/**
 * The foreground for a CUSTOM marker's icon on a filled, non-neutral dot.
 *
 * Only `primary` and `danger` have a token-guaranteed paired foreground
 * (`primary-text`/`danger-text`) — the same gap `badge.props.ts` measures for
 * why Badge never fills its pill with `success`/`warning`. A `Marker` fills a
 * 12px dot with those colours anyway (nothing sits ON it), but a custom
 * marker draws an icon glyph on top, so `success`/`warning` fall back to
 * `ink` rather than risk an unmeasured pairing.
 */
export const markerCustomFilledTextClass: Record<Exclude<TimelineIntent, 'neutral'>, string> = {
  primary: 'text-primary-text',
  danger: 'text-danger-text',
  success: 'text-ink',
  warning: 'text-ink',
};
