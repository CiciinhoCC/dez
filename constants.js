// constants.js
import { Platform } from 'react-native';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Platform.select({
    web:     'http://localhost:3000',
    android: 'http://10.0.2.2:3000',
    ios:     'http://localhost:3000',
    default: 'http://localhost:3000',
  });