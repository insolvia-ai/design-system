import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Text, View } from 'react-native';

import { CheckboxGroup as CheckboxGroupWeb } from '@design-system/checkbox-group/checkbox-group.web.tsx';
import { CheckboxGroup as CheckboxGroupNative } from '@design-system/checkbox-group/checkbox-group.native.tsx';
import { Checkbox as CheckboxWeb } from '@design-system/checkbox/checkbox.web.tsx';
import { Checkbox as CheckboxNative } from '@design-system/checkbox/checkbox.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const CARGO_TYPES = [
  { value: 'spice', label: 'Spice crates' },
  { value: 'bacta', label: 'Bacta tanks' },
  { value: 'torpedoes', label: 'Proton torpedoes' },
  { value: 'rations', label: 'Ration packs' },
];

/**
 * `CheckboxGroup` is a parts object (`Root` only) composed with `Checkbox`,
 * not a single component — so there is no meta `component` for the docs-page
 * props table, the same omission Dialog and CheckboxGroup's own `Checkbox`
 * make for the same reason. Args cover the group's own state
 * (`defaultValue`/`disabled`/`onValueChange`); the member checkboxes
 * (`CARGO_TYPES`) are fixed composition, the same way Dialog's content is
 * fixed and only the text args vary. `defaultValue` gets no control — it
 * seeds UNCONTROLLED state (the select.stories.tsx `defaultValue` note
 * explains the same gap).
 */
type CheckboxGroupArgs = {
  defaultValue: string[];
  disabled: boolean;
  onValueChange: (value: string[]) => void;
};

const meta = {
  title: 'Forms/CheckboxGroup',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: ['spice', 'bacta'],
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <CargoManifestWeb
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <CargoManifestNative
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<CheckboxGroupArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play checks the group's
 * accessible name (`role="group"`, `aria-label="Cargo manifest"` — see
 * `CargoManifestWeb`/`CargoManifestNative` below) and that selecting an unlisted
 * member appends it to the shared `onValueChange` array, in both panes.
 */
/** The checked glyph's rendered colour, read from the deepest node carrying it. */
function checkGlyphColour(scope: HTMLElement): string {
  const box = [...scope.querySelectorAll('[role="checkbox"]')].find(
    (el) => el.getAttribute('aria-checked') === 'true',
  );
  if (!box) throw new Error('No checked checkbox in this pane.');
  const glyph = [...box.querySelectorAll('*')].reverse().find((el) => el.textContent?.trim());
  return getComputedStyle(glyph ?? box).color;
}

export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('both leaves paint the tick the same colour', async () => {
      // Colour does not inherit through a React Native View and
      // react-native-web's Text defaults to BLACK, so the native tick rendered
      // rgb(0,0,0) on the primary-filled box while the web one was white —
      // about 1.6:1, and invisible to every other check here. axe does not read
      // the box as text for contrast purposes, and the jsdom suite computes no
      // colour at all. Comparing the two panes is what catches it.
      const webColour = checkGlyphColour(
        canvasElement.querySelector('[data-testid="leaf-pair-web"]')!,
      );
      const nativeColour = checkGlyphColour(
        canvasElement.querySelector('[data-testid="leaf-pair-native"]')!,
      );
      await expect(nativeColour).toBe(webColour);
      await expect(nativeColour).toBe('rgb(255, 255, 255)');
    });

    await step('web leaf: group is named, selecting a member updates the value', async () => {
      await expect(web.getByRole('group', { name: 'Cargo manifest' })).toBeInTheDocument();
      await userEvent.click(web.getByRole('checkbox', { name: 'Proton torpedoes' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['spice', 'bacta', 'torpedoes']);
    });

    await step('native leaf: same group semantics, same handler', async () => {
      await expect(native.getByRole('group', { name: 'Cargo manifest' })).toBeInTheDocument();
      await userEvent.click(native.getByRole('checkbox', { name: 'Proton torpedoes' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['spice', 'bacta', 'torpedoes']);
    });
  },
};

/**
 * Disabled is asserted, not clicked: the web member checkboxes are real
 * disabled `<button>`s (jest-dom's `toBeDisabled`), the native ones can only
 * speak ARIA through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<CargoManifestWeb defaultValue={['spice']} disabled />}
      native={<CargoManifestNative defaultValue={['spice']} disabled />}
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('checkbox', { name: 'Spice crates' })).toBeDisabled();
    await expect(native.getByRole('checkbox', { name: 'Spice crates' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/**
 * `CheckboxGroup.Root` sets `role="group"` on both leaves, so labelling the
 * Root itself with `aria-label`/`accessibilityLabel` is legal and correct —
 * unlike the bare `Checkbox.Root` glyph, a group isn't a toggle field. Each
 * member checkbox still renders only a glyph and needs its own name; see
 * checkbox.stories.tsx for why.
 */
function CargoManifestWeb(props: Partial<React.ComponentProps<typeof CheckboxGroupWeb.Root>>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Cargo manifest</p>
      <CheckboxGroupWeb.Root aria-label="Cargo manifest" {...props}>
        {CARGO_TYPES.map(({ value, label }) => (
          <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckboxWeb.Root aria-label={label} value={value}>
              <CheckboxWeb.Indicator>✓</CheckboxWeb.Indicator>
            </CheckboxWeb.Root>
            <span>{label}</span>
          </div>
        ))}
      </CheckboxGroupWeb.Root>
    </div>
  );
}

function CargoManifestNative(
  props: Partial<React.ComponentProps<typeof CheckboxGroupNative.Root>>,
) {
  return (
    <View style={{ gap: 8 }}>
      <InkText style={{ fontWeight: '600' }}>Cargo manifest</InkText>
      <CheckboxGroupNative.Root accessibilityLabel="Cargo manifest" {...props}>
        {CARGO_TYPES.map(({ value, label }) => (
          <View key={value} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckboxNative.Root accessibilityLabel={label} value={value}>
              {/* Raw glyph, exactly like the web call site — the native
                  Indicator colours it. A bare <Text> here inherits nothing and
                  paints black on the filled box. */}
              <CheckboxNative.Indicator>✓</CheckboxNative.Indicator>
            </CheckboxNative.Root>
            <InkText>{label}</InkText>
          </View>
        ))}
      </CheckboxGroupNative.Root>
    </View>
  );
}
