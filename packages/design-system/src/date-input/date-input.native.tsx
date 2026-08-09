// NATIVE LEAF — a React Native TextInput over the same shared mask
// (date-input.props), with a Pressable on its right that opens `DatePicker`'s
// wheels in an anchored surface. This is the leaf a React Native consumer
// renders, including in a browser through react-native-web, so it is the one
// that has to be right; it deliberately mirrors Field's own control styling,
// because a date field sitting next to a text field should not look like a
// different species.
//
// The surface is inline and absolutely positioned rather than an RN `Modal`,
// exactly as Select's list is: a Modal owns focus, and this pattern needs focus
// to stay in the text field so typing and picking are the same interaction.
// The cost is the one Popover's native leaf documents — no press-outside
// dismissal, because RN has no document to listen to — so the field closes the
// picker on its own button, on Escape where there is a keyboard, and when the
// value is picked.
import * as React from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
// Explicit `.native`, mirroring the `.web` imports in the sibling leaf.
import { DatePicker } from '../date-picker/date-picker.native';
import { PickerIcon } from './date-input-icon.native';
import {
  isErrorStatus,
  OPEN_LABEL,
  resolveFormat,
  useDateInputState,
  type DateInputOwnProps,
} from './date-input.props';

export interface DateInputProps
  extends
    Omit<TextInputProps, 'value' | 'defaultValue' | 'onChangeText' | 'editable'>,
    DateInputOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
  /** Replaces the drawn icon. See `ICON` in date-input.props.ts for the default. */
  icon?: React.ReactNode | undefined;
}

export const DateInput = ({
  mode = 'date',
  format,
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
  icon,
  placeholder,
  style,
  ...props
}: DateInputProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const focus = useNativeFocusRing();
  const state = useDateInputState({
    mode,
    format,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    today,
  });
  const { text, setText, status, open, setOpen, pick, pickerValue, rootId } = state;

  const invalid = isErrorStatus(status) || (field?.invalid ?? false);
  const surfaceId = `${rootId}-picker`;

  // Tell the enclosing Field the picker is up, so it can elevate itself. This
  // component's own `rootOpen` zIndex only orders it against ITS siblings; it
  // cannot reach past the Field wrapping it, because React Native gives every
  // View its own stacking context. field.props.ts's `controlOpen` owns the
  // reasoning, and 0.7.1 is what happens without it. Cleanup resets the flag so
  // an unmount mid-open cannot strand the Field elevated.
  const setFieldControlOpen = field?.setControlOpen;
  React.useEffect(() => {
    if (!setFieldControlOpen) return undefined;
    setFieldControlOpen(open);
    return () => setFieldControlOpen(false);
  }, [open, setFieldControlOpen]);

  // `aria-describedby` and `aria-invalid` are web-only and outside RN's own
  // types; react-native-web forwards them to the DOM regardless. Omitted rather
  // than set to undefined, so the control never points at an element that does
  // not exist — the same shape Field's native leaf uses.
  const webAria = {
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
    ...(invalid ? { 'aria-invalid': true } : {}),
  } as TextInputProps;

  return (
    <View style={[styles.root, open ? styles.rootOpen : null]}>
      <TextInput
        nativeID={field?.controlId}
        aria-labelledby={field?.labelId}
        aria-label={props['aria-label']}
        {...webAria}
        accessibilityState={{ disabled }}
        editable={!disabled}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? resolveFormat(mode, format)}
        placeholderTextColor={c.muted}
        // A digit keypad on a phone; harmless on web, where it is advisory.
        keyboardType="number-pad"
        onFocus={(event) => {
          focus.focus();
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          focus.blur();
          props.onBlur?.(event);
        }}
        // Escape closes, for the browser case. Bound here rather than on the
        // surface because opening does not move focus — it stays in the field.
        {...({
          onKeyDown: (event: { key: string; preventDefault?: () => void }) => {
            if (!open || event.key !== 'Escape') return;
            event.preventDefault?.();
            setOpen(false);
          },
        } as object)}
        style={[
          styles.control,
          {
            borderColor: invalid ? c.danger : c.line,
            backgroundColor: disabled ? c.surfaceAlt : c.card,
            color: disabled ? c.muted : c.ink,
          },
          focus.ringStyle,
          style,
        ]}
        {...props}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={OPEN_LABEL[mode]}
        accessibilityState={{ disabled, expanded: open }}
        aria-disabled={disabled}
        disabled={disabled}
        {...({
          'aria-haspopup': 'dialog',
          ...(open ? { 'aria-controls': surfaceId } : {}),
        } as object)}
        onPress={() => setOpen(!open)}
        style={styles.button}
      >
        {icon ?? <PickerIcon mode={mode} color={c.muted} />}
      </Pressable>

      {open ? (
        <View
          nativeID={surfaceId}
          // `role="dialog"` WITHOUT `aria-modal`, which would claim the rest of
          // the page is inert while it demonstrably is not. RN's own Role union
          // carries neither, and react-native-web forwards the strings.
          {...({ role: 'dialog', 'aria-label': OPEN_LABEL[mode] } as object)}
          style={styles.surface}
        >
          <DatePicker
            mode={mode}
            value={pickerValue}
            onValueChange={pick}
            {...(min === undefined ? {} : { min })}
            {...(max === undefined ? {} : { max })}
            minuteInterval={minuteInterval}
            hourCycle={hourCycle}
            {...(today === undefined ? {} : { today })}
          />
        </View>
      ) : null}
    </View>
  );
};

const CONTROL_HEIGHT = 44;

const styles = StyleSheet.create({
  root: { width: '100%', position: 'relative' },
  // Above the form controls that follow it. Not a large number on purpose — it
  // has to beat sibling content, never a Dialog, which renders through RN's
  // Modal and sits above the whole tree regardless. Select uses the same 30.
  rootOpen: { zIndex: 30 },
  control: {
    // 44dp, the WCAG 2.5.5 target-size floor. Field's own control is 40dp; a
    // date input is reached by tap far more often than a long-form text field,
    // so it takes the taller of the two. The right padding is the button's
    // room, so typed text never runs underneath it.
    height: CONTROL_HEIGHT,
    paddingLeft: spacing.sm,
    paddingRight: CONTROL_HEIGHT,
    borderWidth: 1,
    borderRadius: radii.md,
    fontSize: 14,
  },
  button: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: CONTROL_HEIGHT,
    height: CONTROL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    position: 'absolute',
    top: CONTROL_HEIGHT + spacing.xs,
    left: 0,
    zIndex: 10,
  },
});
