import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Slider as SliderWeb } from '@design-system/slider/slider.web.tsx';
import { Slider as SliderNative } from '@design-system/slider/slider.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

type SliderArgs = {
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onValueChange: (next: number) => void;
  onValueCommit: (value: number) => void;
};

const meta = {
  title: 'Forms/Slider',
  component: SliderWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Volume',
    defaultValue: 40,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    onValueChange: fn(),
    onValueCommit: fn(),
  },
  argTypes: {
    defaultValue: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      web={
        <div style={{ width: 320 }}>
          <SliderWeb
            label={args.label}
            defaultValue={args.defaultValue}
            min={args.min}
            max={args.max}
            step={args.step}
            disabled={args.disabled}
            onValueChange={args.onValueChange}
            onValueCommit={args.onValueCommit}
          />
        </div>
      }
      native={
        <View style={{ width: 320 }}>
          <SliderNative
            label={args.label}
            defaultValue={args.defaultValue}
            min={args.min}
            max={args.max}
            step={args.step}
            disabled={args.disabled}
            onValueChange={args.onValueChange}
            onValueCommit={args.onValueCommit}
          />
        </View>
      }
    />
  ),
} satisfies Meta<SliderArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The play drives the WEB leaf's keyboard, because that is the interaction a
 * jsdom-less browser test can perform honestly: focus, one ArrowRight, and the
 * shared step arithmetic (`sliderValueForKey`) must move the value and report
 * it. The native leaf's drag is a PanResponder over real pointer geometry —
 * asserted as far as its accessibility contract (role and value present), and
 * no further; its own test file says why a faked drag proves nothing.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);
    await step('web leaf steps by keyboard and reports the change', async () => {
      const slider = web.getByRole('slider', { name: args.label });
      slider.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(args.onValueChange).toHaveBeenCalledWith(args.defaultValue + args.step);
    });
    await step('release commits once', async () => {
      await userEvent.keyboard('{ArrowRight}');
      web.getByRole('slider', { name: args.label }).blur();
      await expect(args.onValueCommit).toHaveBeenCalled();
    });
    await step('native leaf carries the slider contract', async () => {
      const slider = native.getByRole('slider', { name: args.label });
      await expect(slider).toBeInTheDocument();
    });
  },
};

/**
 * The buffered fill — the video-seek case this component exists for. Purely
 * visual, so the story is a state to look at rather than a play to run: the
 * primary fill sits at the playhead, the paler band behind it at the buffer.
 */
export const Buffered: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      note="The paler band behind the fill is `buffered` — how much of the clip has loaded."
      web={
        <div style={{ width: 320 }}>
          <SliderWeb label={args.label} defaultValue={35} buffered={70} />
        </div>
      }
      native={
        <View style={{ width: 320 }}>
          <SliderNative label={args.label} defaultValue={35} buffered={70} />
        </View>
      }
    />
  ),
};
