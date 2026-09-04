// The bundler resolves `./icon-button` to icon-button.web.tsx (Vite) or
// icon-button.native.tsx (Metro) by extension — never add one here. Types come
// from the platform-agnostic props module.
export { IconButton } from './icon-button';
export type { IconButtonProps } from './icon-button';
export { iconButtonClass } from './icon-button.props';
export type {
  IconButtonIntent,
  IconButtonSize,
  IconButtonOwnProps,
  IconButtonClassOptions,
} from './icon-button.props';
