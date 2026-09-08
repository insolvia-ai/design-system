// The bundler resolves `./button-group` to button-group.web.tsx (Vite) or
// button-group.native.tsx (Metro) by extension. Types come from the
// platform-agnostic props module, plus each leaf's own Root/Item prop types
// (structurally aligned across leaves, exactly like Button's `ButtonProps`).
export { ButtonGroup } from './button-group';
export type { ButtonGroupRootProps, ButtonGroupItemProps } from './button-group';
export type {
  ButtonGroupOrientation,
  ButtonGroupSize,
  ButtonGroupIntent,
  ButtonGroupRootOwnProps,
} from './button-group.props';
