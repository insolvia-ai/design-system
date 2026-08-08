// SHARED — no react-native / react-dom / base-ui import.
//
// A breadcrumb trail's cross-platform substance is small and entirely
// conventional: what the landmark is called, what sits between the crumbs, and
// the rule that the last crumb is the current page. Everything that renders
// diverges — `<nav><ol><li>` against a row of Views, an `<a href>` against a
// `Pressable onPress` — so it stays in the leaves.

/**
 * The navigation landmark's accessible name.
 *
 * Singular "Breadcrumb", which is what screen-reader users are used to hearing
 * and what the WAI-ARIA authoring practices example uses. Shared so the two
 * leaves cannot announce the landmark differently.
 */
export const DEFAULT_BREADCRUMBS_LABEL = 'Breadcrumb';

/**
 * The glyph between crumbs. Decorative in both leaves (`aria-hidden` on web,
 * `accessible={false}` on native): a screen reader reading "slash" between
 * every crumb is noise, and the list structure already conveys the sequence.
 */
export const DEFAULT_SEPARATOR = '/';

export interface BreadcrumbsItemOwnProps {
  /**
   * Marks this crumb as the page you are on: it stops being a link and gets
   * `aria-current="page"`. Set it on the LAST crumb — the trail is not
   * self-marking, because a component cannot know whether the page it is on is
   * the deepest one shown.
   */
  current?: boolean | undefined;
}
