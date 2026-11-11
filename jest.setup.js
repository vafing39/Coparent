/* eslint-env jest */
// Les insets de zone sûre n'existent pas hors appareil.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
