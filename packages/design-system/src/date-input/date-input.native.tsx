// NATIVE LEAF — a React Native TextInput over the same shared mask
// (date-input.props), with a Pressable on its right that opens `DatePicker`'s
// wheels in an anchored surface. This is the leaf a React Native consumer
// renders, including in a browser through react-native-web, so it is the one
// that has to be right; it deliberately mirrors Field's own control styling,
// because a date field sitting next to a text field should not look like a
// different species.
//
// The surface never uses an RN `Modal`, exactly as Select's list does not: a
// Modal owns focus, and this pattern needs focus to stay in the text field so
// typing and picking are the same interaction. In a browser
// (react-native-web) the open surface PORTALS to `document.body`, positioned
// from the measured root, so no consumer wrapper's stacking context can paint
// over it — `../lib/overlay-portal` owns the mechanism and the reasoning. On
// a real native device it stays inline and absolutely positioned. The cost is
// the one Popover's native leaf documents — no press-outside dismissal,
// because RN has no document to listen to — so the field closes the picker on
// its own button, on Escape where there is a keyboard, and when the value is
// picked.
import * as React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
  type TextInputProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
// Explicit `.native`, mirroring the `.web` imports in the sibling leaf.
import { Calendar } from '../calendar/calendar.native';
import { DatePicker } from '../date-picker/date-picker.native';
import {
  OverlayPortal,
  overlayPortalEnabled,
  overlayPortalPosition,
  useOverlayAnchor,
} from '../lib/overlay-portal';
import { PickerIcon } from './date-input-icon.native';
import {
  isErrorStatus,
  OPEN_LABEL,
  pickerFor,
  placeSurface,
  resolveFormat,
  useDateInputState,
  type DateInputOwnProps,
  type PickerPlacement,
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
  picker,
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
  // PULLED OUT OF `props` ON PURPOSE. `props` is spread LAST onto the TextInput
  // below, so a caller's own handler left in there would replace the ring
  // wiring outright rather than run alongside it.
  onFocus,
  onBlur,
  ...props
}: DateInputProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const r = useNativeRadii();
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

  // Where the open surface escapes consumer stacking contexts. In a browser
  // it portals to document.body, positioned from this measured root; on a
  // real native device `anchor` stays null and the surface renders inline.
  const rootRef = React.useRef<View | null>(null);
  const portalEnabled = overlayPortalEnabled();
  const anchor = useOverlayAnchor(open, rootRef);

  // Flip the surface above the field when it does not fit below — the web
  // leaf's copy of this carries the reasoning. Measured from the surface's own
  // layout rather than in an effect, because React Native has no synchronous
  // box to read: `onLayout` is when its height first exists. The measured
  // height is kept as state (the portaled placement derives from it at render
  // time); the inline path keeps its original measureInWindow flip.
  const [surfaceHeight, setSurfaceHeight] = React.useState(0);
  const [placement, setPlacement] = React.useState<PickerPlacement>('below');
  const measure = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setSurfaceHeight(height);
    if (portalEnabled) return;
    rootRef.current?.measureInWindow((_x, y, _width, rootHeight) => {
      const windowHeight = Dimensions.get('window').height;
      setPlacement(placeSurface(windowHeight - (y + rootHeight), y, height));
    });
  };
  React.useEffect(() => {
    if (!open) setPlacement('below');
  }, [open]);

  // The portaled surface's placement, derived rather than stored: the anchor
  // already tracks scroll and resize, so deriving keeps the flip in step with
  // it for free. Until the first onLayout delivers a height, `below` — the
  // same first-frame assumption the inline path makes.
  const portalPlacement: PickerPlacement =
    anchor !== null && surfaceHeight > 0
      ? placeSurface(Dimensions.get('window').height - anchor.bottom, anchor.top, surfaceHeight)
      : 'below';

  // Tell the enclosing Field the picker is up, so it can elevate itself. This
  // component's own `rootOpen` zIndex only orders it against ITS siblings; it
  // cannot reach past the Field wrapping it, because React Native gives every
  // View its own stacking context. field.props.ts's `controlOpen` owns the
  // reasoning, and 0.7.1 is what happens without it. Cleanup resets the flag so
  // an unmount mid-open cannot strand the Field elevated.
  // Load-bearing only for the INLINE surface — a portaled surface has no
  // ancestor to be shadowed by — but signalled unconditionally: it is harmless
  // where it is unnecessary, and one mechanism is easier to trust than a branch.
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

  // Built once, placed by one of two routes below: portaled to document.body
  // (browser) or inline in the root (real native). Same ids, same role, same
  // pickers — the portal changes WHERE the surface paints, never what it is.
  const surface = open ? (
    <View
      nativeID={surfaceId}
      // `role="dialog"` WITHOUT `aria-modal`, which would claim the rest of
      // the page is inert while it demonstrably is not. RN's own Role union
      // carries neither, and react-native-web forwards the strings.
      {...({ role: 'dialog', 'aria-label': OPEN_LABEL[mode] } as object)}
      onLayout={measure}
      style={
        anchor !== null
          ? overlayPortalPosition({
              top:
                portalPlacement === 'below'
                  ? anchor.bottom + spacing.xs
                  : anchor.top - surfaceHeight - spacing.xs,
              left: anchor.left,
            })
          : [styles.surface, placement === 'below' ? styles.below : styles.above]
      }
    >
      {pickerFor(mode, picker) === 'calendar' ? (
        <Calendar
          value={pickerValue}
          onValueChange={pick}
          {...(min === undefined ? {} : { min })}
          {...(max === undefined ? {} : { max })}
          {...(today === undefined ? {} : { today })}
        />
      ) : (
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
      )}
    </View>
  ) : null;

  return (
    <View ref={rootRef} style={[styles.root, open && !portalEnabled ? styles.rootOpen : null]}>
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
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focus.blur();
          onBlur?.(event);
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
          { borderRadius: r.md },
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

      {/* In a browser the surface waits for the first measurement (a layout
          effect, so the wait is never painted) and portals; on a real native
          device it renders inline, exactly as before the portal existed. */}
      {portalEnabled ? anchor !== null && <OverlayPortal>{surface}</OverlayPortal> : surface}
    </View>
  );
};

const CONTROL_HEIGHT = 44;

const styles = StyleSheet.create({
  root: { width: '100%', position: 'relative' },
  // INLINE (real native) only: above the form controls that follow it. Not a
  // large number on purpose — it has to beat sibling content, never a Dialog,
  // which renders through RN's Modal and sits above the whole tree regardless.
  // Select uses the same 30. In a browser the surface portals out and the
  // root never elevates.
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
    left: 0,
    zIndex: 10,
  },
  below: { top: CONTROL_HEIGHT + spacing.xs },
  // The root is only as tall as the control, so anchoring the surface's BOTTOM
  // that far from the root's bottom puts it just above the field.
  above: { bottom: CONTROL_HEIGHT + spacing.xs },
});
