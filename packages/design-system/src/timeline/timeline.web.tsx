// WEB LEAF — plain React DOM + Tailwind. A vertical list of events: an
// ordered list of rows, each with a marker column (dot + hairline connector)
// beside a content block. No interaction, no keyboard grammar — this is
// Data-display chrome, not a control.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  TIMELINE_PART_NAMES,
  TimelineItemContext,
  TimelineRootContext,
  groupTimelineItemChildren,
  markerCustomFilledTextClass,
  markerFillClass,
  markerRingClass,
  resolveTimelineItemSide,
  useTimelineItemContext,
  useTimelineRootContext,
  type TimelineIntent,
  type TimelineMarkerVariant,
  type TimelineRootOwnProps,
} from './timeline.props';

export interface TimelineRootProps
  extends React.ComponentPropsWithoutRef<'ol'>, TimelineRootOwnProps {}

const TimelineRoot = React.forwardRef<HTMLOListElement, TimelineRootProps>(
  ({ className, position = 'right', children, ...props }, ref) => {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const count = items.length;

    return (
      <TimelineRootContext.Provider value={{ position }}>
        {/*
          `role="list"` is explicit rather than left to the implicit `<ol>`
          role: this list carries no bullets or numbers (nothing here sets
          `list-style`, but a consumer's own reset easily could), and Safari
          drops the implicit list semantics the moment `list-style: none`
          applies — the same reason a plain `<ul>` needs it back. Cheap
          insurance that costs nothing when the reset never happens.
        */}
        <ol ref={ref} role="list" className={cn('flex flex-col', className)} {...props}>
          {items.map((item, index) => (
            <TimelineItemContext.Provider
              key={item.key ?? index}
              value={{ index, last: index === count - 1 }}
            >
              {item}
            </TimelineItemContext.Provider>
          ))}
        </ol>
      </TimelineRootContext.Provider>
    );
  },
);
TimelineRoot.displayName = 'Timeline.Root';

export type TimelineItemProps = React.ComponentPropsWithoutRef<'li'>;

const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ className, children, ...props }, ref) => {
    const { position } = useTimelineRootContext('Item');
    const { index, last } = useTimelineItemContext();
    const side = resolveTimelineItemSide(position, index);
    const { opposite, marker, connector, content } = groupTimelineItemChildren(children);
    const hasOpposite = opposite.length > 0;
    // Root computes `last`; Item is what acts on it — the Connector a
    // consumer renders on every item is simply not placed on the last one, so
    // the line always ends cleanly with no "was this the last row" prop for
    // the caller to track themselves.
    const threeCol = hasOpposite || position === 'alternate';

    const markerColumn = (
      <div className="flex w-6 shrink-0 flex-col items-center">
        {marker}
        {last ? null : connector}
      </div>
    );

    return (
      <li
        ref={ref}
        data-side={side}
        className={cn(
          'grid gap-x-sm',
          threeCol ? 'grid-cols-[1fr_auto_1fr]' : 'grid-cols-[auto_1fr]',
          className,
        )}
        {...props}
      >
        {threeCol ? (
          side === 'right' ? (
            <>
              <div>{opposite}</div>
              {markerColumn}
              <div>{content}</div>
            </>
          ) : (
            <>
              <div>{content}</div>
              {markerColumn}
              <div>{opposite}</div>
            </>
          )
        ) : (
          <>
            {markerColumn}
            {content}
          </>
        )}
      </li>
    );
  },
);
TimelineItem.displayName = 'Timeline.Item';

export interface TimelineMarkerProps extends React.ComponentPropsWithoutRef<'div'> {
  /** @default 'primary' */
  intent?: TimelineIntent | undefined;
  /** @default 'filled' */
  variant?: TimelineMarkerVariant | undefined;
  /** An icon to render inside a 24px box instead of the plain 12px dot. */
  children?: React.ReactNode;
}

const TimelineMarker = React.forwardRef<HTMLDivElement, TimelineMarkerProps>(
  ({ className, intent = 'primary', variant = 'filled', children, ...props }, ref) => {
    const custom = children !== undefined;
    const sizeClass = custom ? 'size-6' : 'size-3';

    // `neutral` never joins the intent maps — see badge.props.ts's contrast
    // note, which is why Badge's own `neutral` renders no dot at all. A
    // Timeline marker cannot render NOTHING (it is the row's visual anchor),
    // so it takes the one pairing every scheme guarantees: a ring in `line`.
    const fillClass =
      intent === 'neutral'
        ? 'border-2 border-line bg-card'
        : variant === 'filled'
          ? markerFillClass[intent]
          : cn('border-2 bg-card', markerRingClass[intent]);

    const customTextClass =
      intent === 'neutral'
        ? 'text-ink'
        : variant === 'filled'
          ? markerCustomFilledTextClass[intent]
          : 'text-ink';

    return (
      <div
        ref={ref}
        // Decorative in every configuration, custom icon included: the
        // marker's own text/label lives in the sibling Content, never here.
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center rounded-pill',
          sizeClass,
          fillClass,
          custom && customTextClass,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TimelineMarker.displayName = TIMELINE_PART_NAMES.marker;

export type TimelineConnectorProps = React.ComponentPropsWithoutRef<'div'>;

const TimelineConnector = React.forwardRef<HTMLDivElement, TimelineConnectorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" className={cn('w-px flex-1 bg-line', className)} {...props} />
  ),
);
TimelineConnector.displayName = TIMELINE_PART_NAMES.connector;

export type TimelineContentProps = React.ComponentPropsWithoutRef<'div'>;

// A bare block — the caller's own `Text`/`<p>` supplies the typography, same
// as `Tabs.Panel`. This leaf never imports `Text`: a leaf importing another
// component's leaf is the one cross-import this package bans outright.
const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pb-lg', className)} {...props} />,
);
TimelineContent.displayName = TIMELINE_PART_NAMES.content;

export type TimelineOppositeProps = React.ComponentPropsWithoutRef<'div'>;

const TimelineOpposite = React.forwardRef<HTMLDivElement, TimelineOppositeProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('min-w-20 text-right font-body text-sm text-muted', className)}
      {...props}
    />
  ),
);
TimelineOpposite.displayName = TIMELINE_PART_NAMES.opposite;

export const Timeline = {
  Root: TimelineRoot,
  Item: TimelineItem,
  Marker: TimelineMarker,
  Connector: TimelineConnector,
  Content: TimelineContent,
  Opposite: TimelineOpposite,
};
