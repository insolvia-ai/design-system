// NATIVE LEAF — React Native primitives over the shared state
// (transfer-list.props). RN has no `<fieldset>`/`<legend>`/real checkbox
// input, so the a11y surface is rebuilt from primitives: a `Text
// accessibilityRole="header"` per column (the web leaf's `<legend>`), and each
// row a `Pressable accessibilityRole="checkbox"` drawing the same 20px
// box-plus-glyph Checkbox already draws — see checkbox.native.tsx, whose
// comment explains why `aria-checked` has to be set directly rather than left
// to `accessibilityState`: this version of react-native-web does not derive
// one from the other.
//
// Split into `Column`/`Row`/`MoveButton` subcomponents, not inlined in a
// `.map`, because each needs its OWN `useNativeFocusRing()` — one ring per
// Pressable, not one shared across every row — and a hook can only be called
// from a component, never from inside a callback passed to `.map`.
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  resolveLabels,
  useTransferListState,
  type TransferListOption,
  type TransferListOwnProps,
} from './transfer-list.props';

export interface TransferListProps extends Omit<ViewProps, 'children'>, TransferListOwnProps {
  /** Names the whole widget for a screen reader. Defaults to "Transfer list". */
  'aria-label'?: string;
}

export const TransferList = ({
  options,
  value,
  defaultValue,
  onValueChange,
  labels: labelsProp,
  showMoveAll = true,
  disabled = false,
  orientation = 'horizontal',
  style,
  'aria-label': ariaLabel,
  ...props
}: TransferListProps) => {
  const labels = resolveLabels(labelsProp);
  const state = useTransferListState(options, value, defaultValue, onValueChange);
  const vertical = orientation === 'vertical';

  return (
    <View
      role="group"
      aria-label={ariaLabel ?? 'Transfer list'}
      style={[
        styles.root,
        {
          flexDirection: vertical ? 'column' : 'row',
          alignItems: vertical ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      {...props}
    >
      <Column
        label={labels.available}
        options={state.left}
        checked={state.checkedLeft}
        onToggle={state.toggleLeft}
        disabled={disabled}
      />

      <View style={[styles.buttons, { flexDirection: vertical ? 'row' : 'column' }]}>
        <MoveButton
          label={labels.moveRight}
          glyph="›"
          disabled={disabled || !state.canMoveSelectedRight}
          onPress={state.moveSelectedRight}
        />
        <MoveButton
          label={labels.moveLeft}
          glyph="‹"
          disabled={disabled || !state.canMoveSelectedLeft}
          onPress={state.moveSelectedLeft}
        />
        {showMoveAll && (
          <MoveButton
            label={labels.moveAllRight}
            glyph="»"
            disabled={disabled || !state.canMoveAllRight}
            onPress={state.moveAllRight}
          />
        )}
        {showMoveAll && (
          <MoveButton
            label={labels.moveAllLeft}
            glyph="«"
            disabled={disabled || !state.canMoveAllLeft}
            onPress={state.moveAllLeft}
          />
        )}
      </View>

      <Column
        label={labels.chosen}
        options={state.right}
        checked={state.checkedRight}
        onToggle={state.toggleRight}
        disabled={disabled}
      />
    </View>
  );
};

function Column({
  label,
  options,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  options: readonly TransferListOption[];
  checked: ReadonlySet<string>;
  onToggle: (value: string) => void;
  disabled: boolean;
}) {
  const c = useNativeColors();
  const r = useNativeRadii();
  // The column heading is a legend, not a display heading — body family,
  // the same call Table's header cells make.
  const body = useNativeBodyFamily();
  const checkedCount = options.reduce((n, option) => n + (checked.has(option.value) ? 1 : 0), 0);

  const heading = `${label} (${checkedCount} selected / ${options.length})`;

  return (
    // `role="group"` + `aria-label` is this leaf's `<fieldset>`/`<legend>`:
    // the same pairing the web leaf gets from real form semantics, rebuilt
    // from primitives because RN has neither. The heading Text stays
    // visible AND carries `accessibilityRole="header"` for its own landmark
    // value — the two together are what a sighted AND a screen-reader user
    // each need, at the cost of the name being announced once for the group
    // and once more as its first line of content.
    <View role="group" aria-label={heading} style={styles.column}>
      <Text
        accessibilityRole="header"
        style={[styles.header, textScale.sm, { fontFamily: body, color: c.ink }]}
      >
        {heading}
      </Text>
      <ScrollView
        style={[
          styles.scroll,
          { borderRadius: r.md, borderColor: c.line, backgroundColor: c.card },
        ]}
      >
        {options.map((option) => (
          <Row
            key={option.value}
            option={option}
            checked={checked.has(option.value)}
            disabled={disabled}
            onToggle={onToggle}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function Row({
  option,
  checked,
  disabled,
  onToggle,
}: {
  option: TransferListOption;
  checked: boolean;
  disabled: boolean;
  onToggle: (value: string) => void;
}) {
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();
  const rowDisabled = disabled || (option.disabled ?? false);

  return (
    <Pressable
      accessibilityRole="checkbox"
      // Explicit, not left to "name from content": unlike `button` or
      // `option`, ARIA's `checkbox` role does not derive its name from
      // descendant text, so a Pressable with only a nested Text label — no
      // `<label for>` exists here to do it either — would announce as
      // unnamed on a real screen reader even though this package's tests
      // might still find it by content.
      accessibilityLabel={option.label}
      accessibilityState={{ checked, disabled: rowDisabled }}
      aria-checked={checked}
      disabled={rowDisabled}
      onPress={() => onToggle(option.value)}
      onFocus={() => focus.focus()}
      onBlur={() => focus.blur()}
      style={[styles.row, { opacity: rowDisabled ? 0.5 : 1 }, focus.ringStyle]}
    >
      <View
        // Named so a test can assert the glyph box's own colour — the
        // Pressable it sits inside stays transparent, unlike Checkbox's root,
        // which IS the coloured box. See transfer-list.native.test.tsx's
        // dark-mode check.
        testID={`transfer-list-box-${option.value}`}
        accessible={false}
        style={[
          styles.box,
          { borderRadius: r.sm },
          {
            borderColor: checked ? c.primary : c.line,
            backgroundColor: checked ? c.primary : c.card,
          },
        ]}
      >
        {/* See checkbox.native.tsx's Indicator comment: colour does not
            inherit through a View, so the glyph owns it directly. No body
            family, for the same reason as Checkbox's tick: a glyph in a fixed
            box keeps the platform face. */}
        {checked ? <Text style={[styles.glyph, { color: c.primaryText }]}>✓</Text> : null}
      </View>
      <Text
        accessible={false}
        numberOfLines={1}
        style={[
          styles.label,
          textScale.sm,
          { fontFamily: body },
          { color: rowDisabled ? c.muted : c.ink },
        ]}
      >
        {option.label}
      </Text>
    </Pressable>
  );
}

function MoveButton({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => focus.focus()}
      onBlur={() => focus.blur()}
      style={[
        styles.moveButton,
        { borderRadius: r.md, backgroundColor: c.surfaceAlt, opacity: disabled ? 0.5 : 1 },
        focus.ringStyle,
      ]}
    >
      {/* Decorative — the Pressable above already carries the accessible name.
          No body family: «‹›» is a glyph in a fixed box, not body copy. */}
      <Text accessible={false} style={[styles.moveButtonGlyph, { color: c.ink }]}>
        {glyph}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  column: { flex: 1, minWidth: 0 },
  header: { paddingHorizontal: spacing.xs, paddingBottom: spacing.xs, fontWeight: '500' },
  scroll: { maxHeight: 256, borderWidth: 1 },
  buttons: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  box: { height: 20, width: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 16 },
  label: { flexShrink: 1 },
  moveButton: {
    height: 32,
    minWidth: 32,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveButtonGlyph: { fontSize: 16, fontWeight: '600' },
});
