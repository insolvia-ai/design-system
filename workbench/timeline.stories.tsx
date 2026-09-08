import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Timeline as TimelineWeb } from '@design-system/timeline/timeline.web.tsx';
import { Timeline as TimelineNative } from '@design-system/timeline/timeline.native.tsx';
import type { TimelineIntent, TimelinePosition } from '@design-system/timeline/timeline.props.ts';
import { useNativeColors } from '@design-system/lib/native-theme';

import { LeafPair } from './leaf-pair.tsx';
import { InkText, MutedText } from './ink-text.tsx';

const POSITIONS = ['right', 'left', 'alternate'] as const satisfies readonly TimelinePosition[];
const INTENTS = [
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
] as const satisfies readonly TimelineIntent[];

const EVENTS = [
  {
    time: '9:30 AM',
    intent: 'primary',
    title: 'Order placed',
    detail: 'Payment authorized and the order queued for packing.',
  },
  {
    time: '11:05 AM',
    intent: 'success',
    title: 'Packed',
    detail: 'Ready for pickup at the depot.',
  },
  {
    time: '2:45 PM',
    intent: 'danger',
    title: 'Delivery failed',
    detail: 'No one was available to receive the package.',
  },
] as const satisfies readonly {
  time: string;
  intent: TimelineIntent;
  title: string;
  detail: string;
}[];

/** Three shipping events, web pane in plain `<p>`/`<strong>`, native in `InkText`/`MutedText`. */
function EventsTimelineWeb({ position }: { position?: TimelinePosition | undefined }) {
  return (
    <TimelineWeb.Root position={position}>
      {EVENTS.map((event) => (
        <TimelineWeb.Item key={event.title}>
          <TimelineWeb.Opposite>{event.time}</TimelineWeb.Opposite>
          <TimelineWeb.Marker intent={event.intent} />
          <TimelineWeb.Connector />
          <TimelineWeb.Content>
            <p>
              <strong>{event.title}</strong>
            </p>
            <p>{event.detail}</p>
          </TimelineWeb.Content>
        </TimelineWeb.Item>
      ))}
    </TimelineWeb.Root>
  );
}

function EventsTimelineNative({ position }: { position?: TimelinePosition | undefined }) {
  return (
    <TimelineNative.Root position={position}>
      {EVENTS.map((event) => (
        <TimelineNative.Item key={event.title}>
          <TimelineNative.Opposite>{event.time}</TimelineNative.Opposite>
          <TimelineNative.Marker intent={event.intent} />
          <TimelineNative.Connector />
          <TimelineNative.Content>
            <InkText style={{ fontWeight: '600' }}>{event.title}</InkText>
            <MutedText>{event.detail}</MutedText>
          </TimelineNative.Content>
        </TimelineNative.Item>
      ))}
    </TimelineNative.Root>
  );
}

type TimelineArgs = {
  position: TimelinePosition;
};

/**
 * A vertical list of events, each with a marker on a connecting hairline and
 * content beside it. `Root`/`Item`/`Marker`/`Connector`/`Content`/`Opposite`
 * are a parts object — no meta `component`, the same reason `accordion.
 * stories.tsx` and `dialog.stories.tsx` have none.
 *
 * The connector is what every item renders, and the LAST one simply does not
 * paint it — compare the bottom of each pane: the hairline stops cleanly
 * rather than dangling past the final dot.
 */
const meta = {
  title: 'Data display/Timeline',
  parameters: { layout: 'fullscreen' },
  args: {
    position: 'right',
  },
  argTypes: {
    position: { control: 'inline-radio', options: [...POSITIONS] },
  },
  render: (args) => (
    <LeafPair
      web={<EventsTimelineWeb position={args.position} />}
      native={<EventsTimelineNative position={args.position} />}
    />
  ),
} satisfies Meta<TimelineArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/**
 * All three `position` values, stacked. `right` (the default) and `left` put
 * every item on the same side of the line; `alternate` starts at `right` and
 * flips the 2nd and 4th item to `left`. The `Opposite` timestamps are what
 * makes `left` visibly different from `right` at all — without one, a row is
 * just a marker beside its content, and there is nothing on the "other side"
 * for a position to move.
 */
export const Positions: Story = {
  argTypes: { position: { control: false } },
  render: () => (
    <LeafPair
      minPaneWidth={420}
      web={
        <div className="flex flex-col gap-xl">
          {POSITIONS.map((position) => (
            <div key={position}>
              <p className="mb-sm font-body text-xs font-medium uppercase tracking-wide text-muted">
                {position}
                {position === 'right' ? ' (default)' : ''}
              </p>
              <EventsTimelineWeb position={position} />
            </div>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 24 }}>
          {POSITIONS.map((position) => (
            <View key={position}>
              <MutedText style={{ fontSize: 11, fontWeight: '600', marginBottom: 4 }}>
                {position.toUpperCase()}
                {position === 'right' ? ' (DEFAULT)' : ''}
              </MutedText>
              <EventsTimelineNative position={position} />
            </View>
          ))}
        </View>
      }
    />
  ),
};

/**
 * Every `Marker` intent on one line. `neutral` is the one that renders no
 * fill — a ring in `line` — for the same contrast reason `Badge`'s `neutral`
 * renders no dot at all: `success`/`warning` have no token-guaranteed paired
 * foreground, so nothing here ever paints TEXT in those colours, only a
 * decorative fill.
 */
export const Intents: Story = {
  argTypes: { position: { control: false } },
  render: () => (
    <LeafPair
      web={
        <TimelineWeb.Root>
          {INTENTS.map((intent) => (
            <TimelineWeb.Item key={intent}>
              <TimelineWeb.Marker intent={intent} />
              <TimelineWeb.Connector />
              <TimelineWeb.Content>
                <p>{intent}</p>
              </TimelineWeb.Content>
            </TimelineWeb.Item>
          ))}
        </TimelineWeb.Root>
      }
      native={
        <TimelineNative.Root>
          {INTENTS.map((intent) => (
            <TimelineNative.Item key={intent}>
              <TimelineNative.Marker intent={intent} />
              <TimelineNative.Connector />
              <TimelineNative.Content>
                <InkText>{intent}</InkText>
              </TimelineNative.Content>
            </TimelineNative.Item>
          ))}
        </TimelineNative.Root>
      }
    />
  ),
};

function CheckIconWeb() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckGlyphNative() {
  const c = useNativeColors();
  return (
    <InkText style={{ color: c.primaryText, fontSize: 11, fontWeight: '700', lineHeight: 12 }}>
      {'✓'}
    </InkText>
  );
}

/**
 * `Marker` takes `children` — an icon — and grows from its plain 12px dot to
 * a 24px box to hold it. The web pane draws an inline SVG check that inherits
 * its colour from the marker (`stroke="currentColor"`); the native pane
 * renders the same glyph as a `Text`, coloured by hand, because RN has no
 * `currentColor` to inherit.
 */
export const CustomMarker: Story = {
  argTypes: { position: { control: false } },
  render: () => (
    <LeafPair
      web={
        <TimelineWeb.Root>
          <TimelineWeb.Item>
            <TimelineWeb.Marker intent="primary">
              <CheckIconWeb />
            </TimelineWeb.Marker>
            <TimelineWeb.Connector />
            <TimelineWeb.Content>
              <p>
                <strong>Delivered</strong>
              </p>
            </TimelineWeb.Content>
          </TimelineWeb.Item>
        </TimelineWeb.Root>
      }
      native={
        <TimelineNative.Root>
          <TimelineNative.Item>
            <TimelineNative.Marker intent="primary">
              <CheckGlyphNative />
            </TimelineNative.Marker>
            <TimelineNative.Connector />
            <TimelineNative.Content>
              <InkText style={{ fontWeight: '600' }}>Delivered</InkText>
            </TimelineNative.Content>
          </TimelineNative.Item>
        </TimelineNative.Root>
      }
    />
  ),
};
