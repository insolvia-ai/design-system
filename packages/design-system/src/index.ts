// @insolvia-ai/design-system — owned, platform-split UI primitives. The
// original six component names the outgoing web-only package exported, the
// 0.3.0 wave of owned Base-UI-equivalent primitives, and the 0.11.0 wave that
// closed the gap against a mainstream React component library's catalogue; the
// CONSUMER'S bundler picks each component's .web / .native leaf by extension
// (see README.md). Keep this barrel the source of truth for what the package
// exports.
export { Accordion } from './accordion';
export { Alert } from './alert';
export type { AlertIntent } from './alert';
export { AlertDialog } from './alert-dialog';
export { Avatar } from './avatar';
export type { AvatarGroupOwnProps, AvatarSize } from './avatar';
export { Badge } from './badge';
export type { BadgeIntent, BadgeSize } from './badge';
export { Breadcrumbs } from './breadcrumbs';
export { Button, buttonClass } from './button';
export type { ButtonIntent, ButtonSize, ButtonClassOptions } from './button';
export { Card } from './card';
export type { CardElevation } from './card';
export { Checkbox } from './checkbox';
export { CheckboxGroup } from './checkbox-group';
export { Collapsible } from './collapsible';
export { Combobox } from './combobox';
export type { ComboboxOption, ComboboxValue } from './combobox';
// Dates, as three layers of one thing. `DateInput` is the FIELD — a masked text
// input with a button that opens the wheels — and is what most callers want.
// `DatePicker` is those wheels on their own, for a surface that is already a
// picker. `Wheel` is the scrolling column both are built from, exported because
// it suits any short ordered list. 0.12.0 removed `Calendar` (a month grid) and
// rebuilt `DateInput` around this; see date-input.props.ts for why the typed
// field and the picker are both needed and neither replaces the other.
export { DateInput } from './date-input';
export type { DateInputMode, DateStatus } from './date-input';
export { DatePicker } from './date-picker';
export type { DatePickerMode } from './date-picker';
export { Dialog } from './dialog';
export { Drawer } from './drawer';
export type { DrawerSide } from './drawer';
export { Dropdown } from './dropdown';
export { Field } from './field';
export { Footer } from './footer';
export { Input } from './input';
export type { InputType } from './input';
export { InputGroup } from './input-group';
export { Meter } from './meter';
export { NavBar } from './nav-bar';
export { Popover } from './popover';
export { Progress } from './progress';
export { RadioGroup } from './radio-group';
export { Ribbon } from './ribbon';
export type { RibbonPosition, RibbonTone } from './ribbon';
export { Select } from './select';
export type { SelectOption, SelectValue } from './select';
export { Separator } from './separator';
export { Sidebar, useSidebar } from './sidebar';
export { Spinner } from './spinner';
export type { SpinnerSize } from './spinner';
export { Switch } from './switch';
export { Table } from './table';
export { Tabs } from './tabs';
export { Text } from './text';
export type { TextTone, TextVariant, TextWeight } from './text';
export { Textarea } from './textarea';
// `useToast` is the one imperative handle in the package: a toast is asked for
// from an event handler far from any JSX, so a hook is the only ergonomic API
// for it. See toast.props.ts.
export { Toast, useToast } from './toast';
export type { ToastApi, ToastIntent, ToastOptions } from './toast';
export { Toggle } from './toggle';
export { ToggleGroup } from './toggle-group';
export { Tooltip } from './tooltip';
export { Wheel } from './wheel';
export type { WheelItem } from './wheel';

// Theming. `ThemeProvider` is renderer-free and exported from the shared side
// on purpose, so a cross-platform consumer writes one provider rather than
// branching on platform. On web it is inert — `theme.css`'s custom properties
// are the override seam there — and on native it is the ONLY way to change a
// colour without forking the package. See src/lib/theme.ts.
export { ThemeProvider, useThemeOverrides } from './lib/theme';
export type { ThemeOverrides } from './lib/theme';
