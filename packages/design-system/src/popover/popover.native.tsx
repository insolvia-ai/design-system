// NATIVE LEAF — RN primitives over @insolvia-ai/tokens.
//
// Inline and absolutely positioned, anchored to the trigger — the same choice
// select.native.tsx makes and for the same reason: RN's Modal owns focus and
// covers the screen, which is right for a Dialog and wrong for a surface that
// is supposed to leave the page alone.
//
// ONE CAPABILITY THE WEB LEAF HAS AND THIS DOES NOT: dismissal by pressing
// outside. The web leaf listens for a document-level pointerdown; React Native
// has no document, and the only ways to catch a press anywhere on screen are a
// Modal (which would defeat the non-modal point) or a full-screen sibling the
// component does not own. So on native the popover closes by pressing its
// trigger again, or through `Popover.Close` — which is why `Close` is a part
// rather than an optional flourish. Give a native popover a Close; a web-only
// one can rely on the outside press.
import * as React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeHeadingFamily } from '../lib/native-typography';
import {
  PopoverContext,
  usePopoverContext,
  usePopoverState,
  type PopoverRootOwnProps,
} from './popover.props';

export interface PopoverRootProps extends PopoverRootOwnProps {
  children?: React.ReactNode;
}

const PopoverRoot = ({ open, defaultOpen, onOpenChange, children }: PopoverRootProps) => {
  const ctx = usePopoverState(open, defaultOpen, onOpenChange);
  return (
    <PopoverContext.Provider value={ctx}>
      {/* Elevation only while open, so a closed popover creates no stacking
          context of its own — the rule field.props.ts's `controlOpen` note
          establishes. */}
      <View style={[styles.root, ctx.open && styles.rootOpen]}>{children}</View>
    </PopoverContext.Provider>
  );
};

export interface PopoverTriggerProps {
  children?: React.ReactNode;
}

const PopoverTrigger = ({ children }: PopoverTriggerProps) => {
  const { open, setOpen, contentId } = usePopoverContext('Trigger');
  const c = useNativeColors();

  const webAria = {
    'aria-haspopup': 'dialog',
    ...(open ? { 'aria-controls': contentId } : {}),
  } as object;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      {...webAria}
      onPress={() => setOpen(!open)}
      style={styles.trigger}
    >
      <Text style={[styles.triggerLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

export interface PopoverContentProps extends ViewProps {
  label?: string | undefined;
  children?: React.ReactNode;
}

const PopoverContent = ({ label, style, children, ...props }: PopoverContentProps) => {
  const { open, contentId, titleId } = usePopoverContext('Content');
  const c = useNativeColors();
  const r = useNativeRadii();
  if (!open) return null;

  let hasTitle = false;
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === PopoverTitle) hasTitle = true;
  });

  // `role="dialog"` WITHOUT aria-modal, exactly as the web leaf: the rest of
  // the screen is genuinely still live. RN's Role union does carry 'dialog',
  // but `aria-labelledby` on a View is outside its types and
  // react-native-web forwards it regardless.
  const webAria = {
    ...(hasTitle ? { 'aria-labelledby': titleId } : {}),
  } as object;

  return (
    // TWO VIEWS, and the outer one is the fix. The panel used to be the
    // absolutely positioned box itself, carrying `maxWidth: 320` and no width
    // — and a cap cannot size an absolutely positioned box. Its width fell
    // back to shrink-to-fit against the CONTAINING BLOCK, which is the root,
    // and the root hugs the trigger (`alignSelf: 'flex-start'`, mirroring the
    // web root's `inline-flex`). So the panel came out trigger-wide, the prose
    // wrapped a word or two per line, and `maxWidth: 320` never once applied.
    //
    // The web leaf says `w-max max-w-[20rem]`: size from the CONTENT, cap at
    // 320. React Native has no `max-content`, so the same rule is spelled with
    // a positioning layer that states the cap as a real width, and a panel
    // that hugs inside it — `alignItems: 'flex-start'` is what makes it hug.
    // Same outcome, and short content stays snug rather than being padded out
    // to 320, which a fixed width on the panel would have done.
    <View style={styles.anchor}>
      <View
        nativeID={contentId}
        role="dialog"
        accessibilityLabel={hasTitle ? undefined : label}
        {...webAria}
        style={[
          styles.content,
          { borderRadius: r.lg },
          { borderColor: c.line, backgroundColor: c.card },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </View>
  );
};

const PopoverTitle = ({ children }: { children?: React.ReactNode }) => {
  const { titleId } = usePopoverContext('Title');
  const c = useNativeColors();
  const heading = useNativeHeadingFamily();
  return (
    <Text
      nativeID={titleId}
      accessibilityRole="header"
      style={[styles.title, { fontFamily: heading }, { color: c.ink }]}
    >
      {children}
    </Text>
  );
};

const PopoverClose = ({ children }: { children?: React.ReactNode }) => {
  const { setOpen } = usePopoverContext('Close');
  const c = useNativeColors();
  return (
    <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
      <Text style={[styles.closeLabel, { color: c.ink }]}>{children}</Text>
    </Pressable>
  );
};

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Title: PopoverTitle,
  Close: PopoverClose,
};

const styles = StyleSheet.create({
  root: { position: 'relative', alignSelf: 'flex-start' },
  rootOpen: { zIndex: 20 },
  trigger: { alignSelf: 'flex-start' },
  triggerLabel: { ...textScale.base, fontWeight: '500' },
  // THE POSITIONING LAYER — `max-w-[20rem]` half of the web leaf's rule,
  // stated as a real `width` because that is the only way an absolutely
  // positioned box gets one. `alignItems: 'flex-start'` is the `w-max` half:
  // it lets the panel inside hug its own content instead of filling this.
  anchor: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: spacing.xs,
    zIndex: 20,
    width: 320,
    alignItems: 'flex-start',
  },
  content: {
    // Of the anchor, so the panel wraps at 320 and never exceeds it.
    maxWidth: '100%',
    gap: spacing.sm,
    borderWidth: 1,
    padding: spacing.md,
    // The web leaf's `shadow-lg`, in the shape React Native takes — the same
    // numbers card.native.tsx already uses for its `raised` elevation, so the
    // two floating surfaces in this package lift the same way. Without it the
    // panel read as a bordered block rather than something above the page,
    // which was the other half of the side-by-side mismatch.
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { ...textScale.sm, fontWeight: '600' },
  close: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  closeLabel: { ...textScale.sm, fontWeight: '500' },
});
