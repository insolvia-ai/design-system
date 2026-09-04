// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// `overflow: 'hidden'` on the Root does the same job as the web leaf's: it
// clips the square-cornered addons to the row's radius, so no addon needs to
// know which end it sits on.
//
// What has NO counterpart here is `focus-within`. React Native has no focus
// pseudo-class and no ring; a TextInput shows focus through the platform's own
// caret and (on Android) its own underline. Rather than fake a ring with state
// that would only ever be right on web, the row simply does not draw one — and
// the web leaf keeps its ring, because a keyboard user on web genuinely needs
// it. This is a deliberate divergence, visible in the workbench.
import * as React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { CONTROL_HEIGHT_PX } from '../input/input.props';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { InputGroupContext, type InputGroupRootOwnProps } from './input-group.props';

export interface InputGroupRootProps extends ViewProps, InputGroupRootOwnProps {
  children?: React.ReactNode;
}

const InputGroupRoot = ({
  invalid = false,
  disabled = false,
  style,
  children,
  ...props
}: InputGroupRootProps) => {
  const c = useNativeColors();
  const r = useNativeRadii();
  const ctx = React.useMemo(() => ({ bare: true as const }), []);

  return (
    <InputGroupContext.Provider value={ctx}>
      <View
        style={[
          styles.root,
          { borderRadius: r.md },
          {
            height: CONTROL_HEIGHT_PX,
            borderColor: invalid ? c.danger : c.line,
            backgroundColor: disabled ? c.surfaceAlt : c.card,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </InputGroupContext.Provider>
  );
};

export interface InputGroupTextProps extends ViewProps {
  children?: React.ReactNode;
}

const InputGroupText = ({ style, children, ...props }: InputGroupTextProps) => {
  const c = useNativeColors();
  return (
    <View style={[styles.addon, { backgroundColor: c.surfaceAlt }, style]} {...props}>
      <Text style={[styles.addonLabel, { color: c.muted }]}>{children}</Text>
    </View>
  );
};

export const InputGroup = {
  Root: InputGroupRoot,
  Text: InputGroupText,
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
  },
  addon: {
    flexShrink: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  addonLabel: { ...textScale.sm },
});
