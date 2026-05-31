const React = require('react');

// Lightweight mock so screens importing safe-area-context can render under
// react-test-renderer without the native NativeSafeAreaProvider module.

const insets = { top: 0, right: 0, bottom: 0, left: 0 };
const frame = { x: 0, y: 0, width: 0, height: 0 };

function SafeAreaProvider({ children }) {
  return React.createElement('safe-area-provider-mock', null, children);
}
function SafeAreaView({ children }) {
  return React.createElement('safe-area-view-mock', null, children);
}

module.exports = {
  __esModule: true,
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets: () => insets,
  useSafeAreaFrame: () => frame,
  SafeAreaInsetsContext: React.createContext(insets),
  initialWindowMetrics: { insets, frame },
};
