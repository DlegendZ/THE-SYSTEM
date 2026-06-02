// Manual mock for @react-navigation/native (auto-applied in tests).
// Screens/components are rendered standalone in unit tests without a real
// navigation container, so provide the hooks they touch.
module.exports = {
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useIsFocused: () => true,
  useRoute: () => ({ params: {} }),
};
