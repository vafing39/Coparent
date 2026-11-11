/* eslint-env jest */
// Les insets de zone sûre n'existent pas hors appareil.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Trousseau sécurisé simulé en mémoire (réinitialisé par __reset entre les tests).
jest.mock('react-native-keychain', () => {
  let store = {};
  return {
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY:
        'AccessibleAfterFirstUnlockThisDeviceOnly',
    },
    setGenericPassword: jest.fn(async (username, password, options = {}) => {
      store[options.service] = { username, password };
      return { service: options.service, storage: 'mock' };
    }),
    getGenericPassword: jest.fn(
      async (options = {}) => store[options.service] ?? false,
    ),
    resetGenericPassword: jest.fn(async (options = {}) => {
      delete store[options.service];
      return true;
    }),
    __reset: () => {
      store = {};
    },
  };
});

jest.mock('react-native-config', () => ({ __esModule: true, default: {} }));

// Langue du téléphone simulée (français), puis textes de l'app chargés pour tous les tests.
jest.mock('react-native-localize', () => require('react-native-localize/mock'));
require('./src/i18n');

// Sélecteur d'heure natif : un simple View ; le test appelle onChange lui-même.
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: require('react-native').View,
  DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
}));

// Presse-papiers natif simulé.
jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock'),
);
