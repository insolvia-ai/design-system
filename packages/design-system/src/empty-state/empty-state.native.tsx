// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colours resolve at
// render time via `useNativeColors()`; `StyleSheet.create` holds only
// scheme-independent layout. Block-level like the web leaf: Root declares no
// width or `alignSelf`, so it stretches to fill its parent — the same call
// `card.native.tsx` makes, and the reason `workbench/leaf-pair.tsx` stages the
// native pane with `alignItems: 'stretch'`.
//
// No id/`aria-labelledby` concept exists here — RN links a heading to its
// container purely through `accessibilityRole="header"` on the Text itself,
// so `Title` never reads `titleId` back off the shared context (the same gap
// `tabs.native.tsx` leaves for `rootId`). `accessibilityRole="summary"` on
// Root would be wrong too: that role is for a collapsed preview of content
// that expands elsewhere, which is not what an empty state is — Root is a
// plain `View`.
import * as React from 'react';
import { StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeBodyFamily, useNativeHeadingFamily } from '../lib/native-typography';
import {
  EmptyStateRootContext,
  useEmptyStateRootContext,
  useEmptyStateRootState,
  type EmptyStateSize,
} from './empty-state.props';

export interface EmptyStateRootProps extends ViewProps {
  /** Scales padding and the title's text size. @default 'md' */
  size?: EmptyStateSize | undefined;
}

const paddingBySize: Record<EmptyStateSize, number> = { sm: spacing.lg, md: spacing.xl };
const titleScaleBySize: Record<EmptyStateSize, keyof typeof textScale> = { sm: 'base', md: 'lg' };

const EmptyStateRoot = ({ size = 'md', style, children, ...props }: EmptyStateRootProps) => {
  const ctx = useEmptyStateRootState(size);
  return (
    <EmptyStateRootContext.Provider value={ctx}>
      <View style={[styles.root, { padding: paddingBySize[size] }, style]} {...props}>
        {children}
      </View>
    </EmptyStateRootContext.Provider>
  );
};

export interface EmptyStateIconProps extends ViewProps {
  children?: React.ReactNode;
}

const EmptyStateIcon = ({ style, children, ...props }: EmptyStateIconProps) => (
  // Decorative, exactly as the web leaf's `aria-hidden` — nothing here for a
  // screen reader to stop on; `Title`/`Description` carry the meaning.
  <View accessible={false} style={[styles.icon, style]} {...props}>
    {children}
  </View>
);

export interface EmptyStateTitleProps extends TextProps {
  children?: React.ReactNode;
}

const EmptyStateTitle = ({ style, children, ...props }: EmptyStateTitleProps) => {
  const { size } = useEmptyStateRootContext('Title');
  const c = useNativeColors();
  const heading = useNativeHeadingFamily();
  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.title,
        textScale[titleScaleBySize[size]],
        { fontFamily: heading, color: c.ink },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export interface EmptyStateDescriptionProps extends TextProps {
  children?: React.ReactNode;
}

const EmptyStateDescription = ({ style, children, ...props }: EmptyStateDescriptionProps) => {
  const c = useNativeColors();
  const body = useNativeBodyFamily();
  return (
    <Text
      style={[styles.description, textScale.sm, { fontFamily: body, color: c.muted }, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

const EmptyStateActions = ({ style, children, ...props }: ViewProps) => (
  <View style={[styles.actions, style]} {...props}>
    {children}
  </View>
);

export const EmptyState = {
  Root: EmptyStateRoot,
  Icon: EmptyStateIcon,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Actions: EmptyStateActions,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'column', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', fontWeight: '600' },
  // `max-w-md` on the web leaf is Tailwind's 28rem; 448px is that value at the
  // default root font size — same conversion `dialog.native.tsx` and
  // `alert-dialog.native.tsx` already use for the same Tailwind class.
  description: { textAlign: 'center', maxWidth: 448 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
