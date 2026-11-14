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

// Temps réel de la messagerie (STOMP sur WebSocket) simulé : les tests émettent les
// événements avec `realtime.emit` (src/test-utils/fakeRealtime).
jest.mock('./src/lib/realtime', () =>
  jest.requireActual('./src/test-utils/fakeRealtime'),
);

// Stockage local des préférences (AsyncStorage) simulé en mémoire.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

// FormData de React Native (celui de Node perd le fichier { uri, type, name } d'un envoi).
global.FormData = jest.requireActual(
  'react-native/Libraries/Network/FormData',
).default;

// Sélecteur photo natif : chaque test choisit la réponse de launchCamera / launchImageLibrary.
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({ didCancel: true })),
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));
