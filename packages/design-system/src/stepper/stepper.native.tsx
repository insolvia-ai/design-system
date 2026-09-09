// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Colors
// resolve at render time; StyleSheet.create holds scheme-independent layout
// only. The web leaf's `<ol>`/`<li>` has no RN counterpart, so the list
// landmark is a `View` with `accessibilityRole="list"` and each step is a
// `View` or `Pressable`, matching the SHAPE from stepper.props.ts: a circle
// joined by a hairline, and the circle+label together are the pressable
// target while the connector stays outside it either way.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  DEFAULT_STEPPER_LABEL,
  StepperItemContext,
  StepperRootContext,
  deriveStatus,
  isStepClickable,
  stepAccessibilityLabel,
  useStepperItemContext,
  useStepperRootContext,
  useStepperState,
  type StepOwnProps,
  type StepperRootOwnProps,
  type StepStatus,
} from './stepper.props';

export interface StepperRootProps extends Omit<ViewProps, 'children'>, StepperRootOwnProps {
  children?: React.ReactNode;
}

const StepperRoot = ({
  activeStep,
  defaultActiveStep = 0,
  onActiveStepChange,
  orientation = 'horizontal',
  linear = true,
  interactive = false,
  label = DEFAULT_STEPPER_LABEL,
  style,
  children,
  ...props
}: StepperRootProps) => {
  const [current, setCurrent] = useStepperState(activeStep, defaultActiveStep, onActiveStepChange);
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;

  return (
    <StepperRootContext.Provider
      value={{ activeStep: current, setActiveStep: setCurrent, orientation, linear, interactive }}
    >
      <View
        accessibilityRole="list"
        accessibilityLabel={label}
        style={[orientation === 'horizontal' ? styles.rootRow : styles.rootColumn, style]}
        {...props}
      >
        {items.map((item, index) => (
          <StepperItemContext.Provider
            key={item.key ?? index}
            value={{ index, last: index === count - 1 }}
          >
            {item}
          </StepperItemContext.Provider>
        ))}
      </View>
    </StepperRootContext.Provider>
  );
};

/** What the circle draws — the same choice the web leaf makes: `completed`/
 * `error` always win over a caller's `icon`. */
function IndicatorGlyph({
  status,
  index,
  icon,
  color,
}: {
  status: StepStatus;
  index: number;
  icon: React.ReactNode | undefined;
  color: string;
}) {
  // Called before the early returns — a hook, so its order cannot vary.
  const body = useNativeBodyFamily();
  // No body family on ✓ and !: glyphs in a fixed box, not body copy, so they
  // keep the platform face when a ThemeProvider names one. The step NUMBER is
  // a numeral, and follows the family the way Avatar's overflow count does.
  if (status === 'completed') return <Text style={[styles.glyph, { color }]}>{'✓'}</Text>;
  if (status === 'error') return <Text style={[styles.glyph, { color }]}>{'!'}</Text>;
  if (icon !== undefined) return <>{icon}</>;
  return <Text style={[styles.glyph, { fontFamily: body, color }]}>{index + 1}</Text>;
}

export interface StepProps extends Omit<ViewProps, 'children'>, StepOwnProps {}

const Step = ({
  label,
  description,
  status: statusProp,
  optional = false,
  icon,
  style,
  ...props
}: StepProps) => {
  const { activeStep, setActiveStep, orientation, linear, interactive } =
    useStepperRootContext('Step');
  const { index, last } = useStepperItemContext();
  const status = statusProp ?? deriveStatus(index, activeStep);
  const allowed = isStepClickable(status, interactive, linear);
  const active = status === 'active';
  const horizontal = orientation === 'horizontal';
  const c = useNativeColors();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();
  const a11yLabel = stepAccessibilityLabel(index, label, status);

  // Ring vs. fill, the same four states the web leaf's `stepIndicatorClass`
  // draws — kept here rather than in stepper.props.ts because this leaf
  // needs actual colour VALUES at render time, not class names.
  const indicatorStyle =
    status === 'completed'
      ? { backgroundColor: c.primary, borderColor: c.primary }
      : status === 'active'
        ? { backgroundColor: 'transparent', borderColor: c.primary }
        : status === 'error'
          ? { backgroundColor: 'transparent', borderColor: c.danger }
          : { backgroundColor: 'transparent', borderColor: c.line };

  const indicatorGlyphColor =
    status === 'completed'
      ? c.primaryText
      : status === 'error'
        ? c.danger
        : status === 'active'
          ? c.primary
          : c.muted;

  const labelColor = status === 'error' ? c.danger : status === 'upcoming' ? c.muted : c.ink;

  const indicator = (
    <View
      accessible={false}
      style={[styles.indicator, { borderRadius: radii.pill }, indicatorStyle]}
    >
      <IndicatorGlyph status={status} index={index} icon={icon} color={indicatorGlyphColor} />
    </View>
  );

  const labelBlock = (
    <View style={horizontal ? styles.labelBlockHorizontal : styles.labelBlockVertical}>
      <Text
        style={[
          textScale.sm,
          { fontFamily: body, color: labelColor, fontWeight: active ? '500' : '400' },
        ]}
      >
        {label}
        {/* Nested in the label's Text, so it inherits the family. */}
        {optional ? <Text style={[textScale.xs, { color: c.muted }]}> (Optional)</Text> : null}
      </Text>
      {description ? (
        <Text style={[textScale.xs, { fontFamily: body, color: c.muted }]}>{description}</Text>
      ) : null}
    </View>
  );

  const contentStyle = horizontal ? styles.contentColumn : styles.contentRow;

  const content = allowed ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: active, disabled: false }}
      // `accessibilityState.selected` is what real iOS/Android accessibility
      // reads; react-native-web does NOT unpack `accessibilityState` into
      // `aria-*` attributes for `selected` — the same gap `tabs.native.tsx`
      // and `radio-group.native.tsx` document. It is mirrored here with
      // `aria-current="step"` (only on the ACTIVE step) rather than
      // `aria-selected`, matching the token the web leaf's `<li
      // aria-current="step">` uses — `aria-selected` is not allowed on the
      // `listitem`/`button` roles axe checks this leaf against.
      aria-current={active ? 'step' : undefined}
      onPress={() => setActiveStep(index)}
      onFocus={focus.focus}
      onBlur={focus.blur}
      style={[contentStyle, styles.gap, focus.ringStyle]}
    >
      {indicator}
      {labelBlock}
    </Pressable>
  ) : (
    <View
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected: active, disabled: !allowed }}
      aria-current={active ? 'step' : undefined}
      style={[contentStyle, styles.gap]}
    >
      {indicator}
      {labelBlock}
    </View>
  );

  const connector = last ? null : (
    <View
      accessible={false}
      style={[
        horizontal ? styles.connectorHorizontal : styles.connectorVertical,
        { backgroundColor: status === 'completed' ? c.primary : c.line },
      ]}
    />
  );

  return (
    // `role="listitem"` — axe's `list` rule requires every child of the
    // Root's `role="list"` to be a listitem; without it, this Step's `View`/
    // `Pressable` children failed that rule on every story. Costs nothing on
    // a device (RN's `Role` union carries 'listitem'; react-native-web
    // forwards it to the DOM unchanged, same as `alert.native.tsx`'s `role`).
    <View
      role="listitem"
      style={[horizontal ? styles.stepRow : styles.stepColumn, style]}
      {...props}
    >
      {content}
      {connector}
    </View>
  );
};

export const Stepper = {
  Root: StepperRoot,
  Step,
};

StepperRoot.displayName = 'Stepper.Root';
Step.displayName = 'Stepper.Step';

const styles = StyleSheet.create({
  rootRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rootColumn: { flexDirection: 'column' },
  stepRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  stepColumn: { flexDirection: 'column' },
  contentColumn: { flexDirection: 'column', alignItems: 'center' },
  contentRow: { flexDirection: 'row', alignItems: 'center' },
  gap: { gap: spacing.xs },
  indicator: {
    width: spacing.xl,
    height: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  glyph: { ...textScale.sm, fontWeight: '600' },
  labelBlockHorizontal: { alignItems: 'center' },
  labelBlockVertical: { alignItems: 'flex-start' },
  connectorHorizontal: { flex: 1, height: 1, marginTop: spacing.md, flexShrink: 0 },
  connectorVertical: { width: 1, minHeight: spacing.xl, marginLeft: spacing.md },
});
