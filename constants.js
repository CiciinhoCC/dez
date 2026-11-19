import { Platform } from 'react-native';

const lanIP = process.env.EXPO_PUBLIC_API_URL;   // e.g. http://172.20.135.57:3000

export const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:3000'
    : (lanIP || 'http://10.0.2.2:3000');

if (Platform.OS !== 'web' && !lanIP) {
  console.warn(
    '[DezNotas] EXPO_PUBLIC_API_URL is not set — mobile will not reach the API.',
  );
}