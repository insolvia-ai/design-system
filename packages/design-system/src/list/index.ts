// The bundler resolves `./list` to list.web.tsx (Vite) or list.native.tsx
// (Metro) by extension. Types come from whichever leaf the consumer's bundler
// picked, plus the platform-agnostic props module.
export { List } from './list';
export type { ListDividerProps, ListItemProps, ListRootProps, ListTextProps } from './list';
export type { ListItemOwnProps, ListRootContextValue } from './list.props';
