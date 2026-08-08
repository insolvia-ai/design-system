// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// One landmark, on `Sidebar.Nav`, exactly as the web leaf: RN's `Role` union
// does carry `navigation`, and nesting a second landmark would give a screen
// reader the same links twice.
//
// Navigation is `onPress`, not `href` — an RN consumer routes through their own
// navigator, the same split Breadcrumbs and NavBar already make.
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { headingFamily, textScale } from '../lib/native-typography';
import {
  DEFAULT_NAV_LABEL,
  SidebarContext,
  sidebarWidth,
  toggleLabel,
  useSidebarContext,
  useSidebarState,
  type SidebarItemOwnProps,
  type SidebarRootOwnProps,
} from './sidebar.props';

export interface SidebarRootProps extends ViewProps, SidebarRootOwnProps {
  children?: React.ReactNode;
}

const SidebarRoot = ({
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  style,
  children,
  ...props
}: SidebarRootProps) => {
  const ctx = useSidebarState(collapsed, defaultCollapsed, onCollapsedChange);
  const c = useNativeColors();
  return (
    <SidebarContext.Provider value={ctx}>
      <View
        style={[
          styles.root,
          {
            width: ctx.collapsed ? sidebarWidth.collapsed : sidebarWidth.expanded,
            borderRightColor: c.line,
            backgroundColor: c.card,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </SidebarContext.Provider>
  );
};

const SidebarHead = ({ style, children, ...props }: ViewProps & { children?: React.ReactNode }) => (
  <View style={[styles.head, style]} {...props}>
    {children}
  </View>
);

const SidebarLogo = ({ children }: { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return (
    <View accessible={false} style={styles.logo}>
      {typeof children === 'string' ? (
        <Text style={[styles.logoText, { color: c.brand }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

const SidebarTitle = ({ children }: { children?: React.ReactNode }) => {
  const { collapsed } = useSidebarContext('Title');
  const c = useNativeColors();
  // Removed rather than hidden while collapsed, matching the web leaf.
  if (collapsed) return null;
  return (
    <Text numberOfLines={1} style={[styles.title, { color: c.ink }]}>
      {children}
    </Text>
  );
};

const SidebarToggle = ({ children }: { children?: React.ReactNode }) => {
  const { collapsed, toggle, navId } = useSidebarContext('Toggle');
  const c = useNativeColors();

  const webAria = { 'aria-controls': navId } as object;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={toggleLabel(collapsed)}
      accessibilityState={{ expanded: !collapsed }}
      {...webAria}
      onPress={toggle}
      style={styles.toggle}
    >
      <Text style={[styles.toggleGlyph, { color: c.muted }]}>
        {children ?? (collapsed ? '»' : '«')}
      </Text>
    </Pressable>
  );
};

export interface SidebarNavProps extends ViewProps {
  label?: string | undefined;
  children?: React.ReactNode;
}

const SidebarNav = ({ label = DEFAULT_NAV_LABEL, style, children, ...props }: SidebarNavProps) => {
  const { navId } = useSidebarContext('Nav');
  return (
    <View
      nativeID={navId}
      role="navigation"
      accessibilityLabel={label}
      style={[styles.nav, style]}
      {...props}
    >
      <ScrollView>{children}</ScrollView>
    </View>
  );
};

export interface SidebarSectionProps extends ViewProps {
  title?: string | undefined;
  children?: React.ReactNode;
}

const SidebarSection = ({ title, style, children, ...props }: SidebarSectionProps) => {
  const { collapsed } = useSidebarContext('Section');
  const c = useNativeColors();
  return (
    <View
      // A labelled group, not a second landmark — same as the web leaf. RN's
      // Role union has no `group`; react-native-web forwards it regardless.
      {...({ role: 'group' } as unknown as Partial<ViewProps>)}
      accessibilityLabel={title}
      style={[styles.section, style]}
      {...props}
    >
      {title !== undefined && !collapsed ? (
        <Text style={[styles.sectionTitle, { color: c.muted }]}>{title.toUpperCase()}</Text>
      ) : null}
      {children}
    </View>
  );
};

export interface SidebarItemProps extends SidebarItemOwnProps {
  icon?: React.ReactNode;
  onPress?: (() => void) | undefined;
}

const SidebarItem = ({ label, active = false, icon, onPress }: SidebarItemProps) => {
  const { collapsed } = useSidebarContext('Item');
  const c = useNativeColors();

  // `aria-current` is web-only and outside RN's types; omitted rather than set
  // to undefined when this is not the current page.
  const webAria = (active ? { 'aria-current': 'page' } : {}) as object;

  return (
    <Pressable
      accessibilityRole="link"
      // The label survives the collapse as the accessible name; without it a
      // collapsed rail is a column of unnamed links.
      accessibilityLabel={label}
      {...webAria}
      onPress={onPress}
      style={[
        styles.item,
        collapsed && styles.itemCollapsed,
        active ? { backgroundColor: c.surfaceAlt } : null,
      ]}
    >
      {icon === undefined ? null : (
        <View accessible={false} style={styles.itemIcon}>
          {typeof icon === 'string' ? (
            <Text style={{ color: active ? c.ink : c.muted }}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}
      {collapsed ? null : (
        <Text
          numberOfLines={1}
          style={[
            styles.itemLabel,
            { color: active ? c.ink : c.muted },
            active && styles.itemActive,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const SidebarSeparator = () => {
  const c = useNativeColors();
  return <View role="separator" style={[styles.separator, { backgroundColor: c.line }]} />;
};

const SidebarFooter = ({
  style,
  children,
  ...props
}: ViewProps & { children?: React.ReactNode }) => (
  <View style={[styles.footer, style]} {...props}>
    {children}
  </View>
);

export const Sidebar = {
  Root: SidebarRoot,
  Head: SidebarHead,
  Logo: SidebarLogo,
  Title: SidebarTitle,
  Toggle: SidebarToggle,
  Nav: SidebarNav,
  Section: SidebarSection,
  Item: SidebarItem,
  Separator: SidebarSeparator,
  Footer: SidebarFooter,
};

const styles = StyleSheet.create({
  root: {
    height: '100%',
    flexDirection: 'column',
    gap: spacing.sm,
    borderRightWidth: 1,
    paddingVertical: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  logo: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: headingFamily, ...textScale.lg, fontWeight: '600' },
  title: { fontFamily: headingFamily, ...textScale.base, fontWeight: '600', flexShrink: 1 },
  toggle: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  toggleGlyph: { ...textScale.sm },
  nav: { flex: 1 },
  section: { paddingVertical: spacing.xs },
  sectionTitle: {
    ...textScale.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  item: {
    // 44dp, the WCAG 2.5.5 target-size floor, matching the web leaf.
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  itemCollapsed: { justifyContent: 'center' },
  itemIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { ...textScale.sm, flexShrink: 1 },
  itemActive: { fontWeight: '500' },
  separator: { height: 1, marginHorizontal: spacing.md, marginVertical: spacing.xs },
  footer: {
    marginTop: 'auto',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
