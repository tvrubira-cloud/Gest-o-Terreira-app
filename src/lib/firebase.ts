import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

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
 * Verdadeiro quando rodando dentro do APK/IPA via Capacitor
 * (não é o navegador comum, é o WebView nativo empacotado).
 */
const isNativePlatform = Capacitor.isNativePlatform();

/**
 * Obtém o token de push do dispositivo atual.
 *
 * - Dentro do APK (Capacitor nativo): usa o plugin nativo @capacitor/push-notifications,
 *   que entrega notificações em segundo plano de verdade, como qualquer app nativo.
 * - No navegador comum (Chrome/Safari acessando o site): usa o FCM Web normal.
 *
 * Retorna null se:
 *  - O browser/plataforma não suporta notifications
 *  - A VAPID key não está configurada (apenas relevante no caminho web)
 *  - A permissão foi negada
 */
export async function getFCMToken(): Promise<string | null> {
  if (isNativePlatform) {
    return getNativePushToken();
  }
  return getWebFCMToken();
}

/**
 * Caminho nativo (Android/iOS dentro do APK/IPA via Capacitor).
 */
async function getNativePushToken(): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;

    const safeResolve = (value: string | null) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    PushNotifications.checkPermissions().then(async (perm) => {
      if (perm.receive !== 'granted') {
        const req = await PushNotifications.requestPermissions();
        if (req.receive !== 'granted') {
          console.warn('[Push] Permissão negada pelo usuário.');
          safeResolve(null);
          return;
        }
      }

      // Listener único — pega o token assim que o registro nativo terminar
      PushNotifications.addListener('registration', (token) => {
        console.log('[Push] Token nativo obtido ✅');
        safeResolve(token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.warn('[Push] Erro ao registrar:', err);
        safeResolve(null);
      });

      await PushNotifications.register();
    }).catch((err) => {
      console.warn('[Push] Falha ao checar permissões nativas:', err);
      safeResolve(null);
    });

    // Timeout de segurança — não trava a UI esperando para sempre
    setTimeout(() => safeResolve(null), 8000);
  });
}

/**
 * Caminho web (navegador comum — Chrome no Android, Safari no iPhone, desktop).
 */
async function getWebFCMToken(): Promise<string | null> {
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

/**
 * Configura os listeners de notificação recebida/clicada quando rodando nativo.
 * Chame isso uma vez, na inicialização do app (ex: dentro do NotificationGate).
 */
export function setupNativePushListeners(onNotificationReceived?: (title: string, body: string) => void) {
  if (!isNativePlatform) return;

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notificação recebida em primeiro plano:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification.title || '', notification.body || '');
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Usuário tocou na notificação:', action.notification);
  });
}

export { isNativePlatform };
