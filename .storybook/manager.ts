// Themes the manager — the sidebar, toolbar and addon panels AROUND the
// stories. theme.ts owns the palette and the reasoning (near-black neutrals,
// a violet accent no token uses, and why it is deliberately NOT built from
// this repo's design tokens); manager-head.html carries the cosmetic CSS the
// theme API cannot express. The stories themselves are scheme-switched by
// the Scheme toolbar item (see preview.tsx and workbench/scheme.ts); this
// file never touches them.
import { addons } from 'storybook/manager-api';

import { workbenchTheme } from './theme';

addons.setConfig({ theme: workbenchTheme });
