module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  // Zod 4 utilise `export * as …`, absent du preset React Native.
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
