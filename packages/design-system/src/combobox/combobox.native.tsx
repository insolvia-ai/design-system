// NATIVE LEAF — a React Native TextInput trigger over the same shared filter
// and keyboard grammar (combobox.props).
//
// The list renders INLINE and absolutely positioned rather than in a Modal,
// exactly as Select's native leaf does and for the same reason: a Modal owns
// focus, and this pattern requires focus to stay in the text box while the
// options move underneath it.
//
// The ROOT carries the elevation while open, and the enclosing Field is told
// about it — that pair is the 0.7.1 fix, and field.props.ts's `controlOpen`
// owns the full reasoning. Getting it wrong here would reproduce the exact bug
// a real browser found and every test in this package missed.
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { getListboxId, getOptionId } from '../select/select.props';
import {
  comboboxKeyIntent,
  DEFAULT_EMPTY_MESSAGE,
  useComboboxState,
  type ComboboxOwnProps,
} from './combobox.props';

export interface ComboboxProps extends ViewProps, ComboboxOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
}

export const Combobox = ({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled = false,
  invalid = false,
  name: _name,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  'aria-label': ariaLabel,
  style,
  ...props
}: ComboboxProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const state = useComboboxState({ options, value, defaultValue, onValueChange });
  const { query, setQuery, visible, open, setOpen, active, setActive, commit, revert, rootId } =
    state;

  const isInvalid = invalid || (field?.invalid ?? false);
  const listboxId = getListboxId(rootId);
  const listOpen = open && visible.length > 0;
  const showEmpty = open && visible.length === 0;

  // Tell the enclosing Field the list is up so it can elevate itself; this
  // component's own zIndex only orders it against ITS siblings. Cleanup resets
  // the flag, so unmounting mid-open cannot strand the Field elevated.
  const setFieldControlOpen = field?.setControlOpen;
  React.useEffect(() => {
    if (!setFieldControlOpen) return undefined;
    setFieldControlOpen(open);
    return () => setFieldControlOpen(false);
  }, [open, setFieldControlOpen]);

  const handleKeyDown = (event: { key: string; altKey?: boolean; preventDefault?: () => void }) => {
    const intent = comboboxKeyIntent(event.key, event.altKey ?? false, { open, visible, active });
    if (intent.kind === 'none') return;
    if (event.key !== 'Tab') event.preventDefault?.();

    switch (intent.kind) {
      case 'open':
        setOpen(true);
        setActive(intent.active);
        break;
      case 'revert':
        revert();
        break;
      case 'active':
        setActive(intent.active);
        break;
      case 'commit':
        commit(intent.value);
        break;
    }
  };

  // react-native-web forwards these to the DOM but RN's own types carry none
  // of them: `onKeyDown` is web-only, and the aria-* below sit outside RN's
  // AccessibilityProps. Contained here and documented — the same shape Select's
  // and Dialog's native leaves use.
  const webOnly = {
    onKeyDown: handleKeyDown,
    role: 'combobox',
    'aria-autocomplete': 'list',
    'aria-expanded': listOpen,
    'aria-controls': listboxId,
    ...(listOpen && active !== null
      ? { 'aria-activedescendant': getOptionId(rootId, active) }
      : {}),
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
    ...(isInvalid ? { 'aria-invalid': true } : {}),
  } as TextInputProps;

  return (
    <View style={[styles.root, open && styles.rootOpen, style]} {...props}>
      <TextInput
        nativeID={field?.controlId}
        aria-labelledby={field?.labelId}
        aria-label={ariaLabel}
        {...webOnly}
        accessibilityState={{ disabled }}
        editable={!disabled}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        autoCapitalize="none"
        autoCorrect={false}
        // Focus leaving discards uncommitted text, the same rule Escape and
        // Tab follow on both leaves.
        onBlur={() => revert()}
        style={[
          styles.control,
          {
            borderColor: isInvalid ? c.danger : c.line,
            backgroundColor: disabled ? c.surfaceAlt : c.card,
            color: disabled ? c.muted : c.ink,
          },
        ]}
      />

      {listOpen && (
        <View
          nativeID={listboxId}
          // React Native's `Role` union has `combobox` and `option` but not
          // `listbox` — an omission in RN's types, not in the platform:
          // react-native-web passes the string straight to the DOM, and the
          // control's `aria-controls` above is pointing at this element.
          //
          // `onMouseDown` is the load-bearing part, not the role. Under
          // react-native-web the input's blur fires BEFORE an option's
          // onPressIn, so `revert()` would unmount the list between pointerdown
          // and pointerup and the press would never complete — the same trap
          // select.native.tsx documents from measuring it. Cancelling the
          // default on mousedown stops focus leaving the input at all, which is
          // the same fix both web leaves use.
          aria-label={ariaLabel}
          {...({
            role: 'listbox',
            onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault(),
          } as unknown as Partial<ViewProps>)}
          style={[styles.list, { borderColor: c.line, backgroundColor: c.card }]}
        >
          <ScrollView keyboardShouldPersistTaps="always">
            {visible.map((option) => {
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
                  style={[
                    styles.option,
                    option.value === active ? { backgroundColor: c.surfaceAlt } : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: option.disabled ? c.muted : c.ink },
                      isSelected ? styles.optionSelected : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {showEmpty && (
        // A polite live region rather than an empty listbox — see the web
        // leaf for why an option-less listbox is not the right shape.
        <View
          role="status"
          style={[styles.empty, { borderColor: c.line, backgroundColor: c.card }]}
        >
          <Text style={[styles.emptyLabel, { color: c.muted }]}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'relative', width: '100%' },
  // Only while open, so a closed combobox creates no stacking context and
  // cannot shadow anything of its own accord.
  rootOpen: { zIndex: 30 },
  control: {
    // 44dp, the WCAG 2.5.5 target-size floor the web leaf's `h-11` matches.
    height: 44,
    width: '100%',
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    fontSize: 14,
  },
  list: {
    position: 'absolute',
    top: 44 + spacing.xs,
    left: 0,
    right: 0,
    zIndex: 10,
    maxHeight: 240,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  option: {
    // Matches the web leaf's `min-h-[44px]` + centring exactly.
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionLabel: { ...textScale.sm },
  optionSelected: { fontWeight: '500' },
  empty: {
    position: 'absolute',
    top: 44 + spacing.xs,
    left: 0,
    right: 0,
    zIndex: 10,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  emptyLabel: { ...textScale.sm },
});
