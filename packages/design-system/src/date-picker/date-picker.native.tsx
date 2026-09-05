// NATIVE LEAF — RN primitives around the same shared columns
// (date-picker.props). A row of `<Wheel>`s and a card around them; every
// decision about WHICH wheels and WHICH rows is shared with the web leaf, so
// the two cannot disagree about what a date is.
//
// The `.native` suffix on the Wheel import is deliberate and mirrors the
// `.web` one in the sibling leaf — see the comment there for why the
// extensionless form is the banned one.
//
// Reads Field's context when there is one, exactly as Select does.
import * as React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { Wheel } from '../wheel/wheel.native';
import {
  useDatePickerState,
  type DatePickerColumnKey,
  type DatePickerOwnProps,
} from './date-picker.props';

export interface DatePickerProps extends Omit<ViewProps, 'children'>, DatePickerOwnProps {
  /** Names the picker when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
}

/** Applies a role react-native-web forwards but RN's own types do not admit. */
function webRole(role: string): Partial<ViewProps> {
  return { role } as unknown as Partial<ViewProps>;
}

/** Names the whole picker when nothing else does. */
const GROUP_LABEL = { date: 'Date', time: 'Time', datetime: 'Date and time' } as const;

/** The gap before a column, so the date group reads apart from the time group. */
function gapBefore(key: DatePickerColumnKey, previous: DatePickerColumnKey | undefined): boolean {
  return previous !== undefined && previous === 'year' && key === 'hour';
}

export const DatePicker = ({
  mode = 'date',
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  minuteInterval = 1,
  hourCycle = 24,
  today,
  disabled = false,
  name: _name,
  style,
  // Pulled out of `props` on purpose: everything left there is spread onto the
  // ROOT View, and leaving the label in would put the accessible name on both
  // the group and whatever else carried it. Select's native leaf documents the
  // same trap in full.
  'aria-label': ariaLabel,
  ...props
}: DatePickerProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const r = useNativeRadii();
  const state = useDatePickerState({
    mode,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    minuteInterval,
    hourCycle,
    today,
  });
  const { columns, groupId, summary } = state;

  const invalid = field?.invalid ?? false;

  // `aria-describedby`, `aria-invalid`, `aria-labelledby` and `aria-live` are
  // web-only and outside RN's own types; react-native-web forwards them and a
  // device drops them. Omitted rather than set to undefined, so the group never
  // points at an element that does not exist — the same shape Field's native
  // leaf uses.
  const webAria = {
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
    ...(field === null ? {} : { 'aria-labelledby': field.labelId }),
    ...(invalid ? { 'aria-invalid': true } : {}),
  } as object;

  return (
    <View
      nativeID={field?.controlId}
      {...webRole('group')}
      accessibilityLabel={field ? undefined : (ariaLabel ?? GROUP_LABEL[mode])}
      aria-disabled={disabled}
      {...webAria}
      style={[
        styles.root,
        { borderRadius: r.lg },
        { borderColor: invalid ? c.danger : c.line, backgroundColor: c.card },
        style,
      ]}
      {...props}
    >
      {/* Six columns say a date in fragments and never say the DATE. This line
          says the whole thing — visibly, which confirms the composition at a
          glance, and as a live region, which is the only way a screen-reader
          user hears anything but "March, selected". */}
      <Text {...({ 'aria-live': 'polite' } as object)} style={[styles.summary, { color: c.ink }]}>
        {summary}
      </Text>

      <View nativeID={groupId} style={styles.columns}>
        {columns.map((column, index) => (
          <Wheel
            key={column.key}
            label={column.label}
            items={column.items}
            value={column.value}
            onValueChange={column.onValueChange}
            loop={column.loop}
            disabled={disabled}
            style={[
              { width: column.width },
              gapBefore(column.key, columns[index - 1]?.key) ? styles.groupGap : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    // Shrink-wraps on a device, exactly as the web leaf's `w-max` does. The
    // workbench's native stage is a flex column with RN's own
    // `alignItems: 'stretch'`, so a leaf that does not say this fills the pane
    // and misreports its own width — see the note in workbench/leaf-pair.tsx.
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    padding: spacing.md,
  },
  summary: { ...textScale.sm, fontWeight: '500', textAlign: 'center' },
  columns: { flexDirection: 'row', alignItems: 'stretch' },
  groupGap: { marginLeft: spacing.sm },
});
