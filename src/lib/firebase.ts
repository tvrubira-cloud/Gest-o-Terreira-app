import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Singleton — evita reinicialização em HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

/**
 * Obtém o FCM token do dispositivo atual.
 * Retorna null se:
 *  - O browser não suporta notifications
 *  - A VAPID key não está configurada
 *  - A permissão foi negada
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    if (!vapidKey || vapidKey === 'COLE_AQUI_SUA_CHAVE_VAPID_PUBLICA') {
      console.warn('[FCM] VAPID key não configurada. Adicione VITE_FIREBASE_VAPID_KEY no .env');
      return null;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });
    return token || null;
  } catch (err) {
    console.warn('[FCM] Falha ao obter token:', err);
    return null;
  }
}
