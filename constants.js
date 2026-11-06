// constants.js
import { Platform } from 'react-native';

export const API_URL = Platform.select({
  web:     'http://localhost:3000',
  android: 'http://10.0.2.2:3000',   // Android emulator
  ios:     'http://localhost:3000',  // iOS simulator
  default: 'http://localhost:3000',
});