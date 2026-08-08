// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// The web leaf's `<nav><ol><li>` has no React Native counterpart: RN has no
// list semantics to borrow, so the landmark is a View with `role="navigation"`
// and each crumb is a Pressable or a Text. What survives verbatim is the
// SHAPE — one labelled landmark, decorative separators, the last crumb marked
// current rather than linked — which is what breadcrumbs.props.ts holds.
//
// Navigation is `onPress`, not `href`: an RN consumer routes through their own
// navigator, exactly as Button takes `onPress` where the web leaf takes
// `onClick`.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  DEFAULT_BREADCRUMBS_LABEL,
  DEFAULT_SEPARATOR,
  type BreadcrumbsItemOwnProps,
} from './breadcrumbs.props';

export interface BreadcrumbsRootProps extends ViewProps {
  label?: string | undefined;
  separator?: React.ReactNode;
  children?: React.ReactNode;
}

const BreadcrumbsRoot = ({
  label = DEFAULT_BREADCRUMBS_LABEL,
  separator = DEFAULT_SEPARATOR,
  style,
  children,
  ...props
}: BreadcrumbsRootProps) => {
  const c = useNativeColors();
  const items = React.Children.toArray(children).filter(React.isValidElement);

  return (
    <View role="navigation" accessibilityLabel={label} style={[styles.root, style]} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={item.key ?? index}>
          {index > 0 ? (
            <Text accessible={false} style={[styles.separator, { color: c.muted }]}>
              {separator}
            </Text>
          ) : null}
          {item}
        </React.Fragment>
      ))}
    </View>
  );
};

export interface BreadcrumbsItemProps extends BreadcrumbsItemOwnProps {
  onPress?: (() => void) | undefined;
  children?: React.ReactNode;
}

const BreadcrumbsItem = ({ current = false, onPress, children }: BreadcrumbsItemProps) => {
  const c = useNativeColors();

  if (current || !onPress) {
    // `aria-current` is web-only and outside RN's types; react-native-web
    // forwards it to the DOM regardless. OMITTED rather than set to undefined
    // when this is not the current crumb — the same shape Field's native leaf
    // uses for its web-only ARIA.
    const webAria = (current ? { 'aria-current': 'page' } : {}) as object;
    return (
      <Text {...webAria} style={[styles.current, { color: c.ink }]}>
        {children}
      </Text>
    );
  }

  return (
    <Pressable accessibilityRole="link" onPress={onPress}>
      <Text style={[styles.link, { color: c.muted }]}>{children}</Text>
    </Pressable>
  );
};

export const Breadcrumbs = {
  Root: BreadcrumbsRoot,
  Item: BreadcrumbsItem,
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  separator: { ...textScale.sm },
  link: { ...textScale.sm },
  current: { ...textScale.sm, fontWeight: '500' },
});
