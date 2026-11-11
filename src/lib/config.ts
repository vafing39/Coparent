import { Platform } from 'react-native';
import Config from 'react-native-config';

/**
 * En développement sans .env : le backend local. L'émulateur Android joint la
 * machine hôte via 10.0.2.2, le simulateur iOS via localhost.
 */
const DEV_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_URL = Config.API_URL || DEV_API_URL;
