// Firebase configuration for HemoConnect
// Fill in your Firebase project credentials from the Firebase Console
// https://console.firebase.google.com/ → Project Settings → General → Your apps → Web app

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase configuration — populate from environment variables or replace directly
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase app (singleton)
let app = null;

if (firebaseConfig.apiKey) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  } catch (error) {
    console.error('Failed to initialize Firebase App:', error);
  }
} else {
  console.warn('⚠️ Firebase API key is missing. Notification permissions and push registrations will be skipped.');
}

/**
 * Request notification permission and retrieve the FCM token.
 * Returns null if notifications are not supported or permission is denied.
 *
 * @param {string} vapidKey - Your VAPID public key from Firebase Console → Cloud Messaging
 * @returns {Promise<string | null>} The FCM token or null
 */
export async function requestNotificationPermission(vapidKey?: string): Promise<string | null> {
  try {
    // Check if messaging is supported in this browser
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported in this browser');
      return null;
    }

    // Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied by user');
      return null;
    }

    if (!app) {
      console.warn('Firebase Messaging is disabled: Firebase App not initialized.');
      return null;
    }

    const messaging = getMessaging(app);

    // Get registration token
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    });

    if (currentToken) {
      console.log('FCM Token obtained:', currentToken.substring(0, 20) + '...');
      return currentToken;
    } else {
      console.warn('No FCM registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

/**
 * Listen for foreground push messages.
 * When the app is in the foreground, the service worker won't show a notification
 * automatically — this callback lets us handle it in the UI (e.g., toast).
 *
 * @param {(payload: any) => void} callback - Handler for incoming messages
 * @returns {() => void} Unsubscribe function
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | undefined {
  try {
    if (!app) {
      return undefined;
    }
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return undefined;
  }
}

export { app };
