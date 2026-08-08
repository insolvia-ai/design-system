// SHARED — no react-native / react-dom import.
export type CardElevation = 'flat' | 'raised';

/**
 * Default height for `Card.Image`, in px/dp.
 *
 * A height is REQUIRED, not optional-with-intrinsic-sizing, because the two
 * platforms disagree about what an unsized image does: a web `<img>` reflows
 * the card when it finally loads, while React Native's `Image` with no
 * dimensions renders at zero and shows nothing at all. Fixing the box makes
 * both behave the same and removes the layout shift.
 */
export const CARD_IMAGE_HEIGHT = 160;

export interface CardImageOwnProps {
  /** Image URL. Both leaves take a plain string. */
  src: string;
  /**
   * Required — it is the image's only accessible name. Pass `''` for a purely
   * decorative image, which is the explicit way to say "nothing to announce".
   */
  alt: string;
  /** Optional caption, rendered under the image inside the card's padding. */
  caption?: string | undefined;
  /** Defaults to `CARD_IMAGE_HEIGHT`. */
  height?: number | undefined;
}

export const elevationStyles: Record<CardElevation, string> = {
  flat: 'shadow-none',
  raised: 'shadow-md',
};
