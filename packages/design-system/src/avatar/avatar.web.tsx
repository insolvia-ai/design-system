// WEB LEAF — plain React DOM + Tailwind. Root is a fixed-size, clipped box;
// Image and Fallback both fill it absolutely and stack in DOM order, so
// Fallback (rendered after Image whenever it's showing) paints over a
// still-loading or broken `<img>` rather than the browser's broken-image icon
// — no conditional unmount of Image is needed for that, which keeps its
// onLoad/onError listeners attached for the image's whole lifetime.
import * as React from 'react';

import { cn } from '../lib/cn';
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

export interface AvatarRootProps
  extends React.ComponentPropsWithoutRef<'span'>, AvatarRootOwnProps {}

const AvatarRoot = React.forwardRef<HTMLSpanElement, AvatarRootProps>(
  ({ size, className, style, children, ...props }, ref) => {
    const [imageStatus, setImageStatus] = useAvatarImageStatus();
    const group = useAvatarGroup();
    // An explicit `size` wins over the group's; the group's beats the default.
    const px = avatarSizePx[size ?? group?.size ?? 'md'];

    return (
      <span
        ref={ref}
        className={cn('relative inline-flex shrink-0 overflow-hidden rounded-pill', className)}
        style={{ width: px, height: px, ...style }}
        {...props}
      >
        <AvatarRootContext.Provider value={{ imageStatus, setImageStatus }}>
          {children}
        </AvatarRootContext.Provider>
      </span>
    );
  },
);
AvatarRoot.displayName = 'Avatar.Root';

export interface AvatarImageProps extends React.ComponentPropsWithoutRef<'img'> {
  alt: string;
}

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onLoad, onError, ...props }, ref) => {
    const { setImageStatus } = useAvatarRootContext('Image');

    return (
      <img
        ref={ref}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
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
  },
);
AvatarImage.displayName = 'Avatar.Image';

export type AvatarFallbackProps = React.ComponentPropsWithoutRef<'span'>;

const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => {
    const { imageStatus } = useAvatarRootContext('Fallback');
    if (imageStatus === 'loaded') return null;

    return (
      <span
        ref={ref}
        className={cn(
          'absolute inset-0 flex items-center justify-center rounded-pill bg-surface-alt font-body text-xs font-medium text-muted',
          className,
        )}
        {...props}
      />
    );
  },
);
AvatarFallback.displayName = 'Avatar.Fallback';

export interface AvatarGroupProps
  extends React.ComponentPropsWithoutRef<'span'>, AvatarGroupOwnProps {}

const AvatarGroup = React.forwardRef<HTMLSpanElement, AvatarGroupProps>(
  ({ className, size = 'md', max, label, children, ...props }, ref) => {
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const { visible, overflow } = splitGroup(items, max);
    const px = avatarSizePx[size];
    const ctx = React.useMemo(() => ({ size }), [size]);

    return (
      <span
        ref={ref}
        // A labelled group, not a bare row: a screen reader reading five names
        // with no word for what they are is announcing a list of strangers.
        role="group"
        aria-label={label}
        className={cn('inline-flex items-center', className)}
        {...props}
      >
        <AvatarGroupContext.Provider value={ctx}>
          {visible.map((child, index) => (
            <span
              key={child.key ?? index}
              // The overlap, plus a 2px band of page background so each avatar
              // reads as separate from the one beneath it rather than as one
              // smeared shape.
              //
              // `border-2`, NOT `ring-2`. A ring paints OUTSIDE the box and
              // costs no layout, which is usually the point of reaching for
              // one — but React Native has no ring, so the native leaf draws a
              // border, and a border grows the box by 4px. The two rows then
              // space differently for the same list: measured in the
              // workbench, at ~4px per avatar. A real border on both leaves
              // costs the web pane 4px it did not spend before and buys the
              // two panes agreeing, which is the trade this package exists to
              // make.
              className="inline-flex rounded-pill border-2 border-bg"
              style={index === 0 ? undefined : { marginLeft: -AVATAR_GROUP_OVERLAP_PX }}
            >
              {child}
            </span>
          ))}
          {overflow > 0 ? (
            <span
              // The counter is a normal, announced part of the group — it is
              // information ("and 3 more"), not decoration.
              className="inline-flex items-center justify-center rounded-pill border-2 border-bg bg-surface-alt font-body text-xs font-medium text-muted"
              style={{ width: px, height: px, marginLeft: -AVATAR_GROUP_OVERLAP_PX }}
            >
              +{overflow}
            </span>
          ) : null}
        </AvatarGroupContext.Provider>
      </span>
    );
  },
);
AvatarGroup.displayName = 'Avatar.Group';

export const Avatar = {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
  Group: AvatarGroup,
};
