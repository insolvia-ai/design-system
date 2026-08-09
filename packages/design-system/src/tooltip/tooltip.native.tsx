// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// The gesture is the divergence, and tooltip.props.ts argues it at length:
// there is no hover and no focus ring on a touch screen, so this leaf summons
// the bubble with a LONG PRESS — the platform's own "tell me more" — and hides
// it when the press ends. `onHoverIn`/`onHoverOut` are wired too, because
// react-native-web gives a React Native consumer a real pointer when their app
// runs in a browser, and there the web gesture is the right one.
//
// Everything after the gesture is shared: the same state hook, the same id,
// and `aria-describedby` pointing the trigger at the bubble.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  TooltipContext,
  useTooltipContext,
  useTooltipState,
  type TooltipRootOwnProps,
} from './tooltip.props';

export interface TooltipRootProps extends TooltipRootOwnProps {
  children?: React.ReactNode;
}

const TooltipRoot = ({ open, defaultOpen, onOpenChange, children }: TooltipRootProps) => {
  const ctx = useTooltipState(open, defaultOpen, onOpenChange);
  return (
    <TooltipContext.Provider value={ctx}>
      <View style={[styles.root, ctx.open && styles.rootOpen]}>{children}</View>
    </TooltipContext.Provider>
  );
};

export interface TooltipTriggerProps {
  children?: React.ReactNode;
  /** Named for assistive tech, since the bubble only DESCRIBES this control. */
  'aria-label'?: string | undefined;
}

const TooltipTrigger = ({ children, 'aria-label': ariaLabel }: TooltipTriggerProps) => {
  const { open, setOpen, tooltipId } = useTooltipContext('Trigger');
  const c = useNativeColors();

  // `aria-describedby` is web-only and outside RN's AccessibilityProps;
  // react-native-web forwards it to the DOM. OMITTED while closed so it never
  // points at an element that does not exist — the same shape Field's and
  // Dialog's native leaves use.
  const webAria = (open ? { 'aria-describedby': tooltipId } : {}) as object;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      {...webAria}
      // Long press on touch; hover when react-native-web has a real pointer.
      onLongPress={() => setOpen(true)}
      onPressOut={() => setOpen(false)}
      onHoverIn={() => setOpen(true)}
      onHoverOut={() => setOpen(false)}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

export interface TooltipContentProps extends ViewProps {
  children?: React.ReactNode;
}

const TooltipContent = ({ children, style, ...props }: TooltipContentProps) => {
  const { open, tooltipId } = useTooltipContext('Content');
  const c = useNativeColors();
  if (!open) return null;
  return (
    // TWO VIEWS, and the outer one is the fix — the same shape, and the same
    // defect, as popover.native.tsx; see the longer note there. The bubble
    // used to be the absolutely positioned box itself with `maxWidth: 256` and
    // no width, so it shrink-to-fit against the trigger-hugging root and came
    // out one short word per line, while the cap never applied.
    //
    // A fixed width would be especially wrong HERE: the web leaf's
    // `w-max max-w-[16rem]` means a short tooltip is a small bubble, and it
    // measures 251 rather than 256 even on this story's fairly long label. The
    // anchor states the cap; `alignItems: 'flex-start'` lets the bubble hug.
    <View style={styles.anchor}>
      <View
        nativeID={tooltipId}
        // RN's `Role` union has no `tooltip`; react-native-web passes the string
        // to the DOM regardless, and the trigger's `aria-describedby` above is
        // pointing at this element. Same omission select.native.tsx documents
        // for `listbox`.
        {...({ role: 'tooltip' } as unknown as Partial<ViewProps>)}
        style={[styles.bubble, { backgroundColor: c.ink }, style]}
        {...props}
      >
        <Text style={[styles.bubbleLabel, { color: c.bg }]}>{children}</Text>
      </View>
    </View>
  );
};

export const Tooltip = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};

const styles = StyleSheet.create({
  root: { position: 'relative', alignSelf: 'flex-start' },
  // Only while open, so a closed tooltip creates no stacking context — the
  // same rule Select's root follows, for the reason field.props.ts records.
  rootOpen: { zIndex: 20 },
  trigger: { alignSelf: 'flex-start' },
  triggerLabel: { ...textScale.sm, fontWeight: '500' },
  // The positioning layer — `max-w-[16rem]` as a real width, because a cap
  // alone cannot size an absolutely positioned box. `alignItems: 'flex-start'`
  // is the `w-max` half: the bubble hugs its label inside this.
  anchor: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: spacing.xs,
    zIndex: 20,
    width: 256,
    alignItems: 'flex-start',
  },
  bubble: {
    // Of the anchor, so the label wraps at 256 and never exceeds it.
    maxWidth: '100%',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bubbleLabel: { ...textScale.xs },
});
