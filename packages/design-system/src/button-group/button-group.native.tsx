// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. A leaf may
// not import another component's leaf, so Item cannot render Button — it
// replicates Button's native intent/size lookup (see button.native.tsx) for
// exactly the three intents `ButtonGroupIntent` allows, rather than importing
// it, and adds the same join-by-radius-and-negative-margin treatment the web
// leaf gets from Tailwind's `rounded-*`/`-ml-px`.
//
// Root carries no interactive semantics of its own — VoiceOver/TalkBack read
// each Item as its own button, and the row exists to visually join them, not
// to add a group landmark the way `ToggleGroup`'s pressed/unpressed state
// benefits from being announced as one. So Root claims no accessibility role
// (`accessibilityRole="none"`) and only optionally carries a name via
// `accessibilityLabel`.
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  ButtonGroupContext,
  ButtonGroupPositionContext,
  buttonGroupPosition,
  useButtonGroupContext,
  type ButtonGroupContextValue,
  type ButtonGroupIntent,
  type ButtonGroupRootOwnProps,
  type ButtonGroupSize,
} from './button-group.props';

export interface ButtonGroupRootProps extends ViewProps, ButtonGroupRootOwnProps {
  children?: React.ReactNode;
}

const ButtonGroupRoot = ({
  orientation = 'horizontal',
  attached = true,
  disabled = false,
  size = 'md',
  intent = 'secondary',
  label,
  style,
  children,
  ...props
}: ButtonGroupRootProps) => {
  const ctx: ButtonGroupContextValue = React.useMemo(
    () => ({ orientation, attached, disabled, size, intent }),
    [orientation, attached, disabled, size, intent],
  );
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const count = items.length;
  const vertical = orientation === 'vertical';

  return (
    <ButtonGroupContext.Provider value={ctx}>
      <View
        accessibilityRole="none"
        accessibilityLabel={label}
        style={[
          styles.root,
          { flexDirection: vertical ? 'column' : 'row' },
          attached ? null : { gap: spacing.sm },
          style,
        ]}
        {...props}
      >
        {items.map((item, index) => (
          <ButtonGroupPositionContext.Provider
            key={item.key ?? index}
            value={buttonGroupPosition(index, count)}
          >
            {item}
          </ButtonGroupPositionContext.Provider>
        ))}
      </View>
    </ButtonGroupContext.Provider>
  );
};
ButtonGroupRoot.displayName = 'ButtonGroup.Root';

export interface ButtonGroupItemProps extends PressableProps {
  children?: React.ReactNode;
}

const sizeHeight: Record<ButtonGroupSize, number> = { sm: 32, md: 44, lg: 48 };
const sizePadX: Record<ButtonGroupSize, number> = {
  sm: spacing.md,
  md: spacing.md,
  lg: spacing.lg,
};
// Size AND line height, so the label matches the web leaf's `text-sm`/`text-base`
// rather than react-native-web's `line-height: normal` — the same reasoning
// button.native.tsx's own `sizeText` carries.
const sizeText = { sm: textScale.sm, md: textScale.sm, lg: textScale.base } satisfies Record<
  ButtonGroupSize,
  { fontSize: number; lineHeight: number }
>;

const ButtonGroupItem = ({
  disabled,
  style,
  // PULLED OUT ON PURPOSE, same reason as button.native.tsx: `props` spreads
  // LAST, so a caller's own onFocus/onBlur left inside it would replace the
  // ring wiring instead of running alongside it.
  onFocus,
  onBlur,
  children,
  ...props
}: ButtonGroupItemProps) => {
  const ctx = useButtonGroupContext();
  const position = React.useContext(ButtonGroupPositionContext);
  const isDisabled = ctx.disabled || Boolean(disabled);
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();

  const intentBg: Record<ButtonGroupIntent, string> = {
    primary: c.primary,
    secondary: c.surfaceAlt,
    ghost: 'transparent',
  };
  const intentText: Record<ButtonGroupIntent, string> = {
    primary: c.primaryText,
    secondary: c.ink,
    ghost: c.ink,
  };

  const vertical = ctx.orientation === 'vertical';

  // Per-corner radii, the native spelling of the web leaf's
  // `rounded-none`/`rounded-l-md` pairing — RN has no single shorthand that
  // can zero three corners and keep one, so every corner is named explicitly.
  const corners = (() => {
    if (!ctx.attached || position === 'only') {
      return {
        borderTopLeftRadius: r.md,
        borderTopRightRadius: r.md,
        borderBottomLeftRadius: r.md,
        borderBottomRightRadius: r.md,
      };
    }
    if (position === 'middle') {
      return {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      };
    }
    const isStart = position === 'first';
    return vertical
      ? {
          borderTopLeftRadius: isStart ? r.md : 0,
          borderTopRightRadius: isStart ? r.md : 0,
          borderBottomLeftRadius: isStart ? 0 : r.md,
          borderBottomRightRadius: isStart ? 0 : r.md,
        }
      : {
          borderTopLeftRadius: isStart ? r.md : 0,
          borderBottomLeftRadius: isStart ? r.md : 0,
          borderTopRightRadius: isStart ? 0 : r.md,
          borderBottomRightRadius: isStart ? 0 : r.md,
        };
  })();

  // The negative-margin overlap so adjoining borders collapse into one line
  // instead of doubling — `-ml-px`/`-mt-px` on the web leaf, one border width
  // here since this package draws every border at 1.
  const overlap =
    ctx.attached && position !== 'first' && position !== 'only'
      ? vertical
        ? { marginTop: -1 }
        : { marginLeft: -1 }
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onFocus={(event) => {
        focus.focus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        onBlur?.(event);
      }}
      style={(state) => [
        styles.item,
        {
          height: sizeHeight[ctx.size],
          paddingHorizontal: sizePadX[ctx.size],
          backgroundColor: intentBg[ctx.intent],
          opacity: isDisabled ? 0.5 : state.pressed ? 0.9 : 1,
        },
        ctx.attached ? { borderWidth: 1, borderColor: c.line, ...corners } : null,
        overlap,
        // The native spelling of `focus-visible:z-10`: a focused Item's ring
        // would otherwise paint UNDER the neighbour it overlaps by a
        // negative margin.
        focus.focused ? styles.focusedZ : null,
        focus.ringStyle,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          sizeText[ctx.size],
          { fontFamily: body },
          { color: intentText[ctx.intent] },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
};
ButtonGroupItem.displayName = 'ButtonGroup.Item';

export const ButtonGroup = { Root: ButtonGroupRoot, Item: ButtonGroupItem };

const styles = StyleSheet.create({
  root: {
    // Shrink-wrap, as the web leaf's `inline-flex` does — see button.native.tsx
    // and toggle-group.native.tsx for the same fix to the same trap: a React
    // Native parent defaults to `alignItems: 'stretch'`, so an undeclared
    // root would run the full width of whatever contains it.
    alignSelf: 'flex-start',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
  },
  focusedZ: {
    zIndex: 1,
  },
});
