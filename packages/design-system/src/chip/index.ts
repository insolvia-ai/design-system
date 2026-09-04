// The bundler resolves `./chip` to chip.web.tsx (Vite) or chip.native.tsx
// (Metro) by extension — never add one here. Types come from the
// platform-agnostic props module.
export { Chip } from './chip';
export type { ChipProps } from './chip';
export { chipClass } from './chip.props';
export type { ChipSize, ChipClassOptions } from './chip.props';
