// SHARED — no react-native / react-dom / base-ui import. Pure data.
export type SpinnerSize = 'sm' | 'md' | 'lg';

export const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-[3px]',
};

export const sizePx: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 32 };

/**
 * The default accessible name.
 *
 * A spinner with no name is an `aria-progressbar-name` failure on web and an
 * unlabelled busy indicator on native, and the name is the ONLY thing a screen
 * reader can convey about it — so it defaults rather than being required, and
 * the default is shared so the two leaves cannot announce different words for
 * the same state.
 */
export const DEFAULT_SPINNER_LABEL = 'Loading';
