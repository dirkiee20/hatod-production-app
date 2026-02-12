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
  'dashboard': 'dashboard',
  'orders': 'receipt',
  'menu': 'restaurant-menu',
  'person': 'person',
  'filter': 'tune',
  'add': 'add',
  'creditcard': 'credit-card',
  'arrow.up': 'arrow-upward',
  'star.fill': 'star',
  'clock.fill': 'schedule',
  'xmark.circle.fill': 'cancel',
  'bell.fill': 'notifications',
  'envelope.fill': 'email',
  'speaker.wave.2.fill': 'volume-up',
  'printer.fill': 'print',
  'globe': 'public',
  'dollarsign.circle': 'attach-money',
  'faceid': 'fingerprint',
  'lock.fill': 'lock',
  'questionmark.circle': 'help',
  'doc.text': 'description',
  'shield.fill': 'security',
  'questionmark.circle.fill': 'help-center',
  'phone.fill': 'phone',
  'message.fill': 'chat',
  'doc.text.fill': 'article',
  'play.rectangle.fill': 'smart-display',
  'trash.fill': 'delete',
  'phone': 'phone',
  'checkmark': 'check',
  'person.fill': 'person',
  'location.fill': 'location-on',
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
