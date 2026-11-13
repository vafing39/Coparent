module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-async-storage)?|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|react-native-screens|react-native-safe-area-context)/)',
  ],
};
