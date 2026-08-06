// Themes the manager — the sidebar, toolbar and addon panels AROUND the
// stories. Storybook's STOCK dark theme, deliberately not a theme built from
// this repo's tokens: a shell wearing the design system's own navy blended
// into the dark-scheme components and made the frame indistinguishable from
// the thing being framed. Generic chrome is the point — the components are
// the exhibit, the shell is the wall. Only the brand title is ours.
//
// The stories themselves are scheme-switched by the Scheme toolbar item (see
// preview.tsx and workbench/scheme.ts); this file never touches them.
import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

export const workbenchTheme = {
  ...themes.dark,
  brandTitle: '@insolvia-ai / design-system',
  brandUrl: 'https://github.com/insolvia-ai/design-system',
};

addons.setConfig({ theme: workbenchTheme });
