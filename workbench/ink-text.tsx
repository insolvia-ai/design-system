import * as React from 'react';
import { Text, type TextProps } from 'react-native';

import { useNativeColors } from '@design-system/lib/native-theme';

/**
 * A story-authored `<Text>` that follows the colour scheme.
 *
 * Colour does not inherit through a React Native View, and react-native-web's
 * Text defaults to BLACK. So every bare `<Text>` a STORY writes — the label
 * beside a Checkbox, the caption under a Meter, the panel copy in Tabs —
 * rendered black, which is invisible on the dark scheme's `#071b31`. Measured
 * at rgb(0,0,0) on that background: about 1.3:1, against the web pane's
 * correct rgb(250,249,246).
 *
 * The COMPONENTS were never wrong here; every native leaf resolves its own
 * colour from `useNativeColors()` at render time. This was the workbench's own
 * chrome failing the rule the package follows, which made the native pane look
 * broken in dark mode and hid whatever the story was actually demonstrating.
 *
 * Nothing caught it because the a11y gate runs stories in the DEFAULT scheme
 * only — `preview.tsx` seeds `scheme: 'light'`, and axe never sees the dark
 * pass. The scheme toolbar is the instrument for that, and it needs a human.
 */
export function InkText({ style, ...props }: TextProps) {
  const c = useNativeColors();
  return <Text style={[{ color: c.ink }, style]} {...props} />;
}

/**
 * The same thing in the MUTED role, for prose whose web counterpart is muted by
 * cascade.
 *
 * Accordion's and Collapsible's web panels carry `text-sm text-muted` on the
 * container, so their prose comes out muted without the caller asking. React
 * Native has no cascade and those panels deliberately style nothing inside
 * themselves, so a story pairing the two leaves has to say `muted` on the
 * native side — otherwise the two panes disagree on colour, which is precisely
 * the class of difference the workbench exists to reveal and therefore the one
 * a story must never introduce by accident.
 */
export function MutedText({ style, ...props }: TextProps) {
  const c = useNativeColors();
  return <Text style={[{ color: c.muted }, style]} {...props} />;
}
