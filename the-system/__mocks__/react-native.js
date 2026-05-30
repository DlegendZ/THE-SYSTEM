/**
 * Minimal React Native mock for Jest (node test environment).
 * Avoids native bridge initialization that crashes in non-native environments.
 */
const React = require('react');

const View = ({ children, style, ...props }) =>
  React.createElement('View', { style, ...props }, children);

const Text = ({ children, style, ...props }) =>
  React.createElement('Text', { style, ...props }, children);

const TouchableOpacity = ({ children, style, onPress, ...props }) =>
  React.createElement('TouchableOpacity', { style, onPress, ...props }, children);

const Pressable = ({ children, style, onPress, ...props }) =>
  React.createElement('Pressable', { style, onPress, ...props }, children);

const ScrollView = ({ children, style, ...props }) =>
  React.createElement('ScrollView', { style, ...props }, children);

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  hairlineWidth: 1,
};

const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
  addEventListener: () => ({ remove: () => {} }),
};

const Platform = {
  OS: 'android',
  Version: 33,
  select: (obj) => obj.android ?? obj.default,
};

const Alert = {
  alert: () => {},
};

const mockAnimation = { start: (cb) => cb && cb({ finished: true }), stop: () => {}, reset: () => {} };

const Animated = {
  Value: class {
    constructor(v) { this._value = v; }
    setValue(v) { this._value = v; }
    interpolate(config) { return config; }
  },
  timing: () => mockAnimation,
  spring: () => mockAnimation,
  sequence: () => mockAnimation,
  loop: () => mockAnimation,
  parallel: () => mockAnimation,
  delay: () => mockAnimation,
  View,
  Text,
};

const Image = ({ style, source, ...props }) =>
  React.createElement('Image', { style, source, ...props });

const TextInput = ({ style, value, onChangeText, placeholder, placeholderTextColor, ...props }) =>
  React.createElement('TextInput', { style, value, onChangeText, placeholder, ...props });

const Modal = ({ children, visible, transparent, animationType, onRequestClose, ...props }) =>
  visible ? React.createElement('Modal', { transparent, animationType, onRequestClose, ...props }, children) : null;

module.exports = {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  Animated,
  Image,
  TextInput,
  Modal,
};
