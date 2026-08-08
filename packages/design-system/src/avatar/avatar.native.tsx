// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Shares the
// image-load status model with the web leaf (avatar.props); the elements
// reimplement onto Image + View/Text, both absolutely filling the Root box so
// Fallback stacks over a still-loading/broken Image the same way the web leaf
// does. Colors come from useNativeColors() at render time (scheme-aware);
// only scheme-independent layout sits in StyleSheet.create.
import * as React from 'react';
import { Image, StyleSheet, Text, View, type ImageProps, type ViewProps } from 'react-native';

import { radii } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import {
  AVATAR_GROUP_OVERLAP_PX,
  AvatarGroupContext,
  AvatarRootContext,
  avatarSizePx,
  splitGroup,
  useAvatarGroup,
  useAvatarImageStatus,
  useAvatarRootContext,
  type AvatarGroupOwnProps,
  type AvatarRootOwnProps,
} from './avatar.props';

export interface AvatarRootProps extends Omit<ViewProps, 'children'>, AvatarRootOwnProps {
  children?: React.ReactNode;
}

const AvatarRoot = ({ size, children, style, ...props }: AvatarRootProps) => {
  const [imageStatus, setImageStatus] = useAvatarImageStatus();
  const group = useAvatarGroup();
  // An explicit `size` wins over the group's; the group's beats the default.
  const px = avatarSizePx[size ?? group?.size ?? 'md'];

  return (
    <View
      style={[styles.root, { width: px, height: px, borderRadius: radii.pill }, style]}
      {...props}
    >
      <AvatarRootContext.Provider value={{ imageStatus, setImageStatus }}>
        {children}
      </AvatarRootContext.Provider>
    </View>
  );
};

// `alt` is optional on RN's own ImageProps; it's required here (same as the
// web leaf) because it's the only accessible name this element can carry.
export interface AvatarImageProps extends Omit<ImageProps, 'alt'> {
  alt: string;
}

const AvatarImage = ({ style, onLoad, onError, alt, ...props }: AvatarImageProps) => {
  const { setImageStatus } = useAvatarRootContext('Image');

  return (
    <Image
      alt={alt}
      // `alt` ALONE is not enough, and the gap is invisible on real React
      // Native. RN's own Image maps `alt` to the accessibility label, so a
      // native consumer reads the right name — but react-native-web builds its
      // hidden `<img>` as `alt={ariaLabel || ''}` (dist/exports/Image), keyed
      // off accessibilityLabel and never off `alt`. So the SAME leaf that names
      // the image on a phone rendered it accessibly decorative in a browser,
      // while the web leaf's own `<img>` carried the real name — one design,
      // two different accessible names, which is exactly the divergence this
      // package exists to prevent. Found by workbench/avatar.stories.tsx —
      // reachable from the native tests all along (they render through
      // react-native-web too), but nothing asserted the image's NAME, only
      // that the fallback showed. avatar.native.test.tsx now does.
      // Fixed in 0.8.3.
      accessibilityLabel={alt}
      style={[styles.image, style]}
      onLoad={(event) => {
        onLoad?.(event);
        setImageStatus('loaded');
      }}
      onError={(event) => {
        onError?.(event);
        setImageStatus('error');
      }}
      {...props}
    />
  );
};

export interface AvatarFallbackProps {
  children?: React.ReactNode;
  style?: ViewProps['style'];
}

const AvatarFallback = ({ children, style }: AvatarFallbackProps) => {
  const { imageStatus } = useAvatarRootContext('Fallback');
  const c = useNativeColors();
  if (imageStatus === 'loaded') return null;

  return (
    <View
      style={[styles.fallback, { backgroundColor: c.surfaceAlt, borderRadius: radii.pill }, style]}
    >
      <Text style={[styles.fallbackText, { color: c.muted }]}>{children}</Text>
    </View>
  );
};

export interface AvatarGroupProps extends Omit<ViewProps, 'children'>, AvatarGroupOwnProps {
  children?: React.ReactNode;
}

const AvatarGroup = ({ size = 'md', max, label, style, children, ...props }: AvatarGroupProps) => {
  const c = useNativeColors();
  const items = React.Children.toArray(children).filter(React.isValidElement);
  const { visible, overflow } = splitGroup(items, max);
  const px = avatarSizePx[size];
  const ctx = React.useMemo(() => ({ size }), [size]);

  return (
    <View
      // A labelled group, matching the web leaf: a row of avatars is a set,
      // and RN's Role union has no `group`, so the string is forwarded by
      // react-native-web the same way `listbox` is in select.native.tsx.
      {...({ role: 'group' } as unknown as Partial<ViewProps>)}
      accessibilityLabel={label}
      style={[styles.group, style]}
      {...props}
    >
      <AvatarGroupContext.Provider value={ctx}>
        {visible.map((child, index) => (
          <View
            key={child.key ?? index}
            // The overlap, plus a ring in the page background so each avatar
            // reads as separate rather than as one smeared shape. RN has no
            // `ring`, so it is a border of the same width the web leaf uses.
            style={[
              styles.groupItem,
              { borderColor: c.bg, borderRadius: radii.pill },
              index === 0 ? null : { marginLeft: -AVATAR_GROUP_OVERLAP_PX },
            ]}
          >
            {child}
          </View>
        ))}
        {overflow > 0 ? (
          <View
            style={[
              styles.groupItem,
              styles.overflow,
              {
                width: px,
                height: px,
                borderColor: c.bg,
                backgroundColor: c.surfaceAlt,
                borderRadius: radii.pill,
                marginLeft: -AVATAR_GROUP_OVERLAP_PX,
              },
            ]}
          >
            <Text style={[styles.overflowText, { color: c.muted }]}>{`+${overflow}`}</Text>
          </View>
        ) : null}
      </AvatarGroupContext.Provider>
    </View>
  );
};

export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Group: AvatarGroup,
};

const styles = StyleSheet.create({
  root: { overflow: 'hidden' },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { fontSize: 12, fontWeight: '500' },
  group: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  // 2px, matching the web leaf's `ring-2`.
  groupItem: { borderWidth: 2 },
  overflow: { alignItems: 'center', justifyContent: 'center' },
  overflowText: { fontSize: 12, fontWeight: '500' },
});
