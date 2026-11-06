// utils/alert.js
import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirm dialog.
 * Returns a Promise<boolean> — true if user confirmed, false otherwise.
 */
export function confirm(title, message, confirmLabel = 'OK', destructive = false) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

/**
 * Cross-platform single-button alert (error/info messages).
 */
export function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}