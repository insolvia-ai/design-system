// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colors resolve at
// render time; StyleSheet.create holds scheme-independent layout only. The
// web leaf's CSS grid has no RN equivalent, so each row is built the same way
// the web leaf's explicit slots are: a fixed-width marker column between two
// flexible side slots, rather than relying on `flexDirection: 'row-reverse'`
// to flip a row — a reversal would flip EVERY row regardless of whether an
// `Opposite` exists, while the web leaf only reorders when `Opposite`/
// `alternate` is in play (see `timeline.web.tsx`'s `TimelineItem`), and the
// two leaves disagreeing about when "left" looks different from "right"
// would be exactly the kind of divergence the workbench exists to catch.
import * as React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  TIMELINE_PART_NAMES,
  TimelineItemContext,
  TimelineRootContext,
  groupTimelineItemChildren,
  resolveTimelineItemSide,
  useTimelineItemContext,
  useTimelineRootContext,
  type TimelineIntent,
  type TimelineMarkerVariant,
  type TimelineRootOwnProps,
} from './timeline.props';

export interface TimelineRootProps extends Omit<ViewProps, 'children'>, TimelineRootOwnProps {
  children?: React.ReactNode;
}

const TimelineRoot = ({ position = 'right', style, children, ...props }: TimelineRootProps) => {
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;

  return (
    <TimelineRootContext.Provider value={{ position }}>
      <View accessibilityRole="list" style={[styles.root, style]} {...props}>
        {items.map((item, index) => (
          <TimelineItemContext.Provider
            key={item.key ?? index}
            value={{ index, last: index === count - 1 }}
          >
            {item}
          </TimelineItemContext.Provider>
        ))}
      </View>
    </TimelineRootContext.Provider>
  );
};

export interface TimelineItemProps extends Omit<ViewProps, 'children'> {
  children?: React.ReactNode;
}

const TimelineItem = ({ style, children, ...props }: TimelineItemProps) => {
  const { position } = useTimelineRootContext('Item');
  const { index, last } = useTimelineItemContext();
  const side = resolveTimelineItemSide(position, index);
  const { opposite, marker, connector, content } = groupTimelineItemChildren(children);
  const hasOpposite = opposite.length > 0;
  const threeCol = hasOpposite || position === 'alternate';

  const markerColumn = (
    <View style={styles.markerColumn}>
      {marker}
      {last ? null : connector}
    </View>
  );

  return (
    // `role="listitem"` (not `accessibilityRole="none"`) so axe's `list` rule
    // sees a child role under the Root's `list` — react-native-web renders it
    // as `role="listitem"` in the DOM, and it costs nothing on a device.
    <View role="listitem" style={[styles.row, style]} {...props}>
      {threeCol ? (
        <>
          <View style={styles.sideSlot}>{side === 'right' ? opposite : content}</View>
          {markerColumn}
          <View style={styles.sideSlot}>{side === 'right' ? content : opposite}</View>
        </>
      ) : (
        <>
          {markerColumn}
          {content}
        </>
      )}
    </View>
  );
};

export interface TimelineMarkerProps extends Omit<ViewProps, 'children'> {
  /** @default 'primary' */
  intent?: TimelineIntent | undefined;
  /** @default 'filled' */
  variant?: TimelineMarkerVariant | undefined;
  /** An icon to render inside a 24px box instead of the plain 12px dot. */
  children?: React.ReactNode;
}

const TimelineMarker = ({
  intent = 'primary',
  variant = 'filled',
  style,
  children,
  ...props
}: TimelineMarkerProps) => {
  const c = useNativeColors();
  const custom = children !== undefined;
  const dim = custom ? 24 : 12;

  const fillByIntent: Record<Exclude<TimelineIntent, 'neutral'>, string> = {
    primary: c.primary,
    success: c.success,
    warning: c.warning,
    danger: c.danger,
  };

  let backgroundColor = c.card;
  let borderColor = c.line;
  let borderWidth = 2;

  if (intent !== 'neutral') {
    if (variant === 'filled') {
      backgroundColor = fillByIntent[intent];
      borderWidth = 0;
    } else {
      backgroundColor = c.card;
      borderColor = fillByIntent[intent];
    }
  }

  return (
    <View
      // Decorative in every configuration, custom icon included — see the
      // web leaf's identical note: the marker's own text/label lives in the
      // sibling Content, never here.
      accessible={false}
      style={[
        styles.marker,
        {
          width: dim,
          height: dim,
          borderRadius: radii.pill,
          backgroundColor,
          borderColor,
          borderWidth,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

export type TimelineConnectorProps = Omit<ViewProps, 'children'>;

const TimelineConnector = ({ style, ...props }: TimelineConnectorProps) => {
  const c = useNativeColors();
  return (
    <View
      accessible={false}
      style={[{ width: 1, flex: 1, backgroundColor: c.line }, style]}
      {...props}
    />
  );
};

export interface TimelineContentProps extends Omit<ViewProps, 'children'> {
  children?: React.ReactNode;
}

// A bare block — the caller's own `Text` supplies the typography, same as
// `Tabs.Panel`. This leaf never imports `Text` (the component) or its native
// leaf: a leaf importing another component's leaf is the one cross-import
// this package bans outright.
const TimelineContent = ({ style, ...props }: TimelineContentProps) => (
  <View style={[{ paddingBottom: spacing.lg }, style]} {...props} />
);

export interface TimelineOppositeProps extends Omit<ViewProps, 'children'> {
  children?: React.ReactNode;
}

// Unlike Content, Opposite owns its own typography — RN cannot cascade
// `color`/`fontSize` onto a raw string child the way the web leaf's CSS does
// onto a `<div>`, so a caller passing a plain string (a timestamp) needs this
// leaf to wrap it in a `Text` itself rather than crash.
const TimelineOpposite = ({ style, children, ...props }: TimelineOppositeProps) => {
  const c = useNativeColors();
  return (
    <View style={[styles.opposite, style]} {...props}>
      <Text style={[textScale.sm, { color: c.muted, textAlign: 'right' }]}>{children}</Text>
    </View>
  );
};

export const Timeline = {
  Root: TimelineRoot,
  Item: TimelineItem,
  Marker: TimelineMarker,
  Connector: TimelineConnector,
  Content: TimelineContent,
  Opposite: TimelineOpposite,
};

TimelineRoot.displayName = 'Timeline.Root';
TimelineItem.displayName = 'Timeline.Item';
TimelineMarker.displayName = TIMELINE_PART_NAMES.marker;
TimelineConnector.displayName = TIMELINE_PART_NAMES.connector;
TimelineContent.displayName = TIMELINE_PART_NAMES.content;
TimelineOpposite.displayName = TIMELINE_PART_NAMES.opposite;

const styles = StyleSheet.create({
  root: { flexDirection: 'column' },
  row: { flexDirection: 'row' },
  markerColumn: { width: 24, flexShrink: 0, flexDirection: 'column', alignItems: 'center' },
  sideSlot: { flex: 1 },
  marker: { alignItems: 'center', justifyContent: 'center' },
  opposite: { minWidth: 80 },
});
