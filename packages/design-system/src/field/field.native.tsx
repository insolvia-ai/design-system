// NATIVE LEAF — React Native primitives, faithful field wiring. Shares the id
// scheme and the describedby rule with the web leaf (field.props), but the
// association INVERTS: the web leaf points the label at the control with
// <label htmlFor>; here the label Text carries nativeID={labelId} and the
// control points back at it with aria-labelledby — the pair react-native-web
// emits as a correctly associated label/input on web. aria-describedby is
// composed from ONLY the description/error ids actually rendered (each part
// carries its nativeID), aria-invalid mirrors the web leaf, and the
// render-as-select/textarea hatch has no RN analogue so it is dropped.
// Colors come from useNativeColors() at render time (scheme-aware); only
// scheme-independent layout is static in StyleSheet.create.
import * as React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  FieldContext,
  composeDescribedBy,
  useFieldContext,
  useFieldControlOpen,
  useFieldIds,
  type FieldContextValue,
  type FieldRootOwnProps,
} from './field.props';

export interface FieldRootProps extends Omit<ViewProps, 'children'>, FieldRootOwnProps {
  children?: React.ReactNode;
}

const FieldRoot = ({ name, invalid = false, children, style, ...props }: FieldRootProps) => {
  const ids = useFieldIds();
  const { controlOpen, setControlOpen } = useFieldControlOpen();

  let hasDescription = false;
  let hasError = false;
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === FieldDescription) hasDescription = true;
    if (child.type === FieldError) hasError = true;
  });

  const ctx: FieldContextValue = {
    labelId: ids.labelId,
    controlId: ids.controlId,
    describedBy: composeDescribedBy(ids, hasDescription, hasError),
    invalid,
    name,
    descriptionId: ids.descriptionId,
    errorId: ids.errorId,
    controlOpen,
    setControlOpen,
  };

  return (
    <FieldContext.Provider value={ctx}>
      {/* THE WRAPPER carries the elevation while its control is open, and it
          has to be the wrapper — see `controlOpen` in field.props.ts. A Select
          inside this Field sets its own root to zIndex 30, but React Native
          scopes that to its siblings, so it cannot reach past THIS View to the
          paragraph and submit button that follow the Field. Both elevations are
          load-bearing and neither is redundant: iOS needs the one here, and
          Android needs the control's own (its `collapsable` optimisation often
          flattens wrappers, so the parent's zIndex is not dependable there).

          This closes it for a Select wrapped in a Field, which is how this
          package expects inputs to be composed. It does NOT close it for an
          extra wrapper View of a consumer's own — that View starts another
          stacking context and has to be elevated the same way. That is React
          Native's layering model rather than a defect here, and the widely used
          RN dropdowns document exactly the same requirement. */}
      <View style={[styles.root, controlOpen && styles.rootControlOpen, style]} {...props}>
        {children}
      </View>
    </FieldContext.Provider>
  );
};

const FieldLabel = ({ children }: { children?: React.ReactNode }) => {
  const { labelId } = useFieldContext('Label');
  const c = useNativeColors();
  return (
    <Text nativeID={labelId} style={[styles.label, { color: c.ink }]}>
      {children}
    </Text>
  );
};

const FieldControl = ({ style, onFocus, onBlur, ...props }: TextInputProps) => {
  const { labelId, controlId, describedBy, invalid } = useFieldContext('Control');
  const c = useNativeColors();

  // React Native has no `:focus` selector, so the focused state is held in a
  // hook and the ring applied as a style — the web leaf gets the same thing
  // for free from `focus-visible:` in lib/styles.ts's `focusRing`. A
  // consumer's own handlers still fire: they are pulled out of `props` and
  // called through.
  const focus = useNativeFocusRing();

  // `aria-labelledby` is in react-native's types; `aria-describedby` and
  // `aria-invalid` are not — they are web-only, and react-native-web forwards
  // them to the DOM regardless. Both are OMITTED, not set to undefined, when
  // inapplicable, so the control never points at an element that does not
  // exist and never claims a validity state the root did not set. The cast is
  // contained and documented where the semantics live — the same shape the
  // app used before adopting this leaf.
  const webAria = {
    ...(describedBy === undefined ? {} : { 'aria-describedby': describedBy }),
    ...(invalid ? { 'aria-invalid': true } : {}),
  } as TextInputProps;

  return (
    <TextInput
      nativeID={controlId}
      aria-labelledby={labelId}
      {...webAria}
      accessibilityState={{ disabled: props.editable === false }}
      placeholderTextColor={c.muted}
      onFocus={(event) => {
        focus.focus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        onBlur?.(event);
      }}
      style={[
        styles.control,
        { borderColor: invalid ? c.danger : c.line, backgroundColor: c.card, color: c.ink },
        focus.ringStyle,
        style,
      ]}
      {...props}
    />
  );
};

const FieldDescription = ({ children }: { children?: React.ReactNode }) => {
  const { descriptionId } = useFieldContext('Description');
  const c = useNativeColors();
  return (
    <Text nativeID={descriptionId} style={[styles.description, { color: c.muted }]}>
      {children}
    </Text>
  );
};

const FieldError = ({ children }: { children?: React.ReactNode; match?: boolean }) => {
  const { errorId } = useFieldContext('Error');
  const c = useNativeColors();
  return (
    <Text nativeID={errorId} style={[styles.error, { color: c.danger }]}>
      {children}
    </Text>
  );
};

export const Field = {
  Root: FieldRoot,
  Label: FieldLabel,
  Control: FieldControl,
  Description: FieldDescription,
  Error: FieldError,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column', gap: spacing.xs },
  // Any value above 0 clears a sibling View's default context; 30 matches the
  // Select root's own elevation so the two read as one decision.
  rootControlOpen: { zIndex: 30 },
  label: { ...textScale.sm, fontWeight: '500' },
  control: {
    height: 40,
    width: '100%',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
  },
  // The focus ring moved to lib/native-focus.native.ts, so every native
  // control draws the same one — it lived here alone for too long.
  description: { ...textScale.sm },
  error: { ...textScale.sm },
});
