// NATIVE LEAF — React Native primitives over the shared grammar
// (select.props). Same WAI-ARIA select-only combobox as the web leaf: focus
// stays on the trigger and the list is addressed through
// `aria-activedescendant`, so one key handler drives everything.
//
// THIS LEAF CAN BE RENDERED ON WEB, by a React Native consumer running
// react-native-web, which is why it implements keyboard interaction at all —
// every other complex widget in this package puts its arrow keys in the `.web`
// leaf. On a real device these key handlers are simply inert, so carrying them
// costs nothing there.
//
// The list never uses a Modal, as Dialog does: a Modal owns focus, and this
// pattern requires focus to stay on the trigger. Where it renders instead
// depends on the platform:
//
//   - In a browser (react-native-web), the open list PORTALS to
//     `document.body`, positioned from the measured trigger. Inline rendering
//     was the 0.7.1 bug class: every consumer wrapper View is its own
//     stacking context under react-native-web, so no elevation set in here —
//     nor in the enclosing Field — could lift the list past a sibling of
//     whatever wrapper the consumer added. `../lib/overlay-portal` owns the
//     mechanism and the full reasoning.
//   - On a real native device the list renders INLINE and absolutely
//     positioned, elevated through the root and the Field (`controlOpen`).
//     The cost is that a very long list on a small screen is better served by
//     a Modal, which is a change to make when a native client exists.
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  OverlayPortal,
  overlayPortalEnabled,
  overlayPortalPosition,
  useOverlayAnchor,
} from '../lib/overlay-portal';
import {
  getListboxId,
  getOptionId,
  selectKeyIntent,
  useSelectState,
  useTypeahead,
  type SelectOwnProps,
} from './select.props';

export interface SelectProps extends Omit<ViewProps, 'children'>, SelectOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string;
}

export const Select = ({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Select…',
  disabled = false,
  name: _name,
  style,
  // PULLED OUT OF `props` ON PURPOSE, and the omission is the fix. Everything
  // left in `props` is spread onto the ROOT View below, so leaving the label
  // there put the accessible name on TWO nodes: a roleless container and the
  // combobox. React Native Testing Library found two matches for one control;
  // a screen reader gets a name on a wrapper that has no business having one.
  //
  // The web leaf never had this — it spreads `props` straight onto the
  // <button>, so there is only ever one carrier. This makes the native leaf
  // agree, and hands the name to the two nodes that should have it: the
  // combobox, and the listbox it controls (which is what the web leaf does
  // with its <ul>).
  'aria-label': ariaLabel,
  ...props
}: SelectProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const state = useSelectState({ options, value, defaultValue, onValueChange });
  const { open, setOpen, active, setActive, commit, selected, rootId } = state;

  // Where the open list escapes consumer stacking contexts. In a browser the
  // list portals to document.body, positioned from this measured root; on a
  // real native device `anchor` stays null and the list renders inline below.
  const rootRef = React.useRef<View | null>(null);
  const portalEnabled = overlayPortalEnabled();
  const anchor = useOverlayAnchor(open, rootRef);

  // Tell the enclosing Field the list is up, so it can elevate itself. The
  // Select's own `rootOpen` zIndex only orders it against ITS siblings; it
  // cannot reach past the Field wrapping it. field.props.ts's `controlOpen`
  // owns the reasoning. Cleanup resets the flag, so an unmount mid-open (a
  // route change with the list down) cannot strand the Field elevated.
  // Load-bearing only for the INLINE list — a portaled list has no ancestor
  // to be shadowed by — but signalled unconditionally: it is harmless where
  // it is unnecessary, and one mechanism is easier to trust than a branch.
  const setFieldControlOpen = field?.setControlOpen;
  React.useEffect(() => {
    if (!setFieldControlOpen) return undefined;
    setFieldControlOpen(open);
    return () => setFieldControlOpen(false);
  }, [open, setFieldControlOpen]);

  const activeRef = React.useRef(active);
  activeRef.current = active;
  const typeahead = useTypeahead(
    options,
    React.useCallback(() => activeRef.current, []),
  );

  const handleKeyDown = (event: { key: string; altKey?: boolean; preventDefault?: () => void }) => {
    const intent = selectKeyIntent(event.key, event.altKey ?? false, {
      open,
      options,
      value: state.value,
      active,
      typing: typeahead.isTyping(),
    });
    if (intent.kind === 'none') return;
    // Tab has to keep moving focus; everything else would scroll the page or
    // submit the form. Same rule as the web leaf.
    if (event.key !== 'Tab') event.preventDefault?.();

    switch (intent.kind) {
      case 'open':
        setOpen(true);
        setActive(intent.active);
        break;
      case 'close':
        setOpen(false);
        break;
      case 'active':
        setActive(intent.active);
        break;
      case 'commit':
        commit(intent.value);
        break;
      case 'typeahead': {
        const match = typeahead.push(intent.char);
        if (match === null) break;
        if (open) setActive(match);
        else commit(match);
        break;
      }
    }
  };

  const listboxId = getListboxId(rootId);
  const invalid = field?.invalid ?? false;

  // react-native-web forwards these to the DOM but React Native's own types
  // carry none of them: `onKeyDown` is web-only, and `aria-controls` /
  // `aria-activedescendant` / `aria-describedby` are outside RN's
  // AccessibilityProps. Contained here and documented, the same shape Dialog's
  // native leaf uses for `aria-describedby`.
  const webOnly = {
    onKeyDown: handleKeyDown,
    'aria-controls': listboxId,
    ...(open && active !== null ? { 'aria-activedescendant': getOptionId(rootId, active) } : {}),
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
  } as Partial<PressableProps>;

  // Built once, placed by one of two routes below: portaled to document.body
  // (browser) or inline in the root (real native). Everything else — ids,
  // roles, the mousedown that keeps focus on the trigger — is identical, which
  // is the point: the portal changes WHERE the list paints, never what it is.
  const list = open ? (
    <View
      nativeID={listboxId}
      // React Native's `Role` union has `combobox` and `option` but not
      // `listbox` — an omission in RN's types, not in the platform:
      // react-native-web passes the string straight to the DOM, and the
      // combobox's `aria-controls` above is pointing at this element.
      //
      // `onMouseDown` is the load-bearing part, not the role. Under
      // react-native-web the trigger's blur fires BEFORE an option's
      // onPressIn (measured, not assumed), so any "am I pressing an
      // option?" flag is still false when blur runs — the list would
      // unmount between pointerdown and pointerup and the press would never
      // complete. Cancelling the default on mousedown stops focus leaving
      // the trigger at all, which is the same fix the web leaf uses.
      // Named after the control, matching the web leaf's <ul>. A listbox
      // with no accessible name is announced as an unlabelled group.
      aria-label={ariaLabel}
      {...({
        role: 'listbox',
        onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault(),
      } as unknown as Partial<ViewProps>)}
      style={[
        styles.list,
        { borderRadius: r.md },
        anchor
          ? overlayPortalPosition({
              top: anchor.bottom + spacing.xs,
              left: anchor.left,
              width: anchor.width,
            })
          : styles.listInline,
        { backgroundColor: c.card, borderColor: c.line },
      ]}
    >
      <ScrollView keyboardShouldPersistTaps="always">
        {options.map((option) => {
          const isSelected = option.value === state.value;
          return (
            <Pressable
              key={option.value}
              nativeID={getOptionId(rootId, option.value)}
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled ?? false}
              disabled={option.disabled ?? false}
              onPress={() => {
                if (!option.disabled) commit(option.value);
              }}
              // Hover moves the highlight, exactly as the web leaf's
              // `onMouseEnter` does — same `active` state, so the trigger's
              // `aria-activedescendant` follows the pointer on both leaves.
              // Without it this list highlighted only under the ARROW KEYS,
              // so a pointer user got no feedback about which row they were
              // about to commit, and the two panes disagreed under the one
              // interaction anyone uses in a browser.
              //
              // `onHoverIn` is a real React Native Pressable prop, not a
              // react-native-web extension: RN carries it for the platforms
              // that have a pointer, and a touch device simply never fires
              // it. There is deliberately no `onHoverOut` — the web leaf
              // leaves the highlight where the pointer last was rather than
              // clearing it, and an empty highlight between rows would read
              // as a flicker.
              onHoverIn={() => {
                if (!option.disabled) setActive(option.value);
              }}
              style={[styles.option, option.value === active && { backgroundColor: c.surfaceAlt }]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  { color: option.disabled ? c.muted : c.ink },
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  ) : null;

  return (
    // For the INLINE list, the ROOT carries the elevation, not just the popup.
    // react-native-web gives every View `position: relative`, so a form is a
    // run of positioned siblings painting in DOM order — and a z-index on the
    // popup alone cannot lift it past a sibling that comes AFTER this Select.
    // The open list rendered behind the description text, the file button and
    // the submit button below it: legible enough to look like a rendering
    // glitch, and impossible to click through.
    //
    // Applied only while open, so a closed Select creates no stacking context
    // and cannot shadow anything of its own accord — and never in a browser,
    // where the list portals out and the root has nothing to lift.
    <View
      ref={rootRef}
      style={[styles.root, open && !portalEnabled && styles.rootOpen, style]}
      {...props}
    >
      <Pressable
        nativeID={field?.controlId}
        role="combobox"
        aria-expanded={open}
        // The native leaf points the control back at the label, the direction
        // Field's native leaf establishes (the web leaf points label -> control
        // with htmlFor instead).
        aria-labelledby={field?.labelId}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={() => {
          if (open) setOpen(false);
          else {
            setOpen(true);
            setActive(state.value ?? null);
          }
        }}
        onFocus={() => focus.focus()}
        // Focus leaving the trigger closes the list. An option press does NOT
        // reach here — the list cancels the focus change; see its onMouseDown.
        onBlur={() => {
          focus.blur();
          setOpen(false);
        }}
        style={[
          styles.trigger,
          { borderRadius: r.md },
          {
            backgroundColor: disabled ? c.surfaceAlt : c.card,
            borderColor: invalid ? c.danger : c.line,
          },
          focus.ringStyle,
        ]}
        {...webOnly}
      >
        <Text
          numberOfLines={1}
          style={[styles.triggerLabel, { color: selected && !disabled ? c.ink : c.muted }]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Text aria-hidden style={[styles.chevron, { color: c.muted }]}>
          ▾
        </Text>
      </Pressable>

      {/* In a browser the list waits for the first measurement (a layout
          effect, so the wait is never painted) and portals; on a real native
          device it renders inline, exactly as before the portal existed. */}
      {portalEnabled ? anchor !== null && <OverlayPortal>{list}</OverlayPortal> : list}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'relative' },
  // Above the form controls that follow it. Not a large number on purpose —
  // it has to beat sibling content, never a Dialog or an AlertDialog, which
  // render through RN's Modal and sit above the whole tree regardless.
  rootOpen: { zIndex: 30 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    // 44dp, the WCAG 2.5.5 target-size floor — deliberately
    // taller than Field's 40dp control, which is a text input rather than a
    // press target.
    height: 44,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
  },
  triggerLabel: { flexShrink: 1, ...textScale.sm },
  chevron: { fontSize: 12 },
  // The list's box, shared by both placements; where it sits comes from
  // `listInline` or from `overlayPortalPosition` at render time.
  list: {
    maxHeight: 240,
    borderWidth: 1,
    paddingVertical: spacing.xs,
  },
  listInline: {
    position: 'absolute',
    top: 44 + spacing.xs,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  option: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  optionLabel: { ...textScale.sm },
  optionLabelSelected: { fontWeight: '500' },
});
