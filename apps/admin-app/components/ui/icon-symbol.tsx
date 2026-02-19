// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';


/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'dashboard': 'dashboard',
  'orders': 'receipt',
  'users': 'people',
  'restaurants': 'restaurant',
  'fees': 'attach-money',
  'map': 'map',
  'manage': 'manage-accounts',
  'person': 'person',
  'person.fill': 'person',
  'person.2.fill': 'group',
  'location.fill': 'location-on',
  'trash.fill': 'delete',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'message.fill': 'chat',
  'doc.text': 'description',
  'questionmark.circle': 'help',
  'typhoon.fill': 'storm',
  'checkmark': 'check',
  'chart.bar.fill': 'bar-chart',
  'storefront': 'storefront',
  'bicycle': 'directions-bike',
  'bag.fill': 'shopping-bag',
} as const;

type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
