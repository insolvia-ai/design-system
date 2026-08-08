import '@testing-library/jest-dom/vitest';

// jsdom implements no layout and therefore no scrolling: depending on the
// version, `Element.prototype.scrollTo` is either absent or throws
// "Not implemented". Either way a component that keeps a scroller in step with
// its own state — Wheel — crashes on mount instead of failing an assertion.
//
// A STUB, not a simulation. Nothing here can move a scroll position, and that
// is exactly why every wheel test drives the thing by keyboard and clicks: the
// scrolling is an enhancement over an interaction that works without it, and
// whether it LOOKS right is a question for the workbench, not for jsdom.
Element.prototype.scrollTo = () => undefined;
