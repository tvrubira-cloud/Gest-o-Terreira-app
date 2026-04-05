import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { Bell, BellOff, CheckCircle, RefreshCw, Settings } from 'lucide-react';
import { getFCMToken } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';


interface NotificationGateProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'terreiras-notifications-granted';

type Status = 'checking' | 'gate' | 'denied' | 'granted';

function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export default function NotificationGate({ children }: NotificationGateProps) {
  const [status, setStatus] = useState<Status>('checking');
  const [visible, setVisible] = useState(false);
  
  const currentUser = useStore(state => state.currentUser);
  const currentTerreiroId = useStore(state => state.currentTerreiroId);

  const registerFCMToken = useCallback(async () => {
    if (!currentUser || !currentTerreiroId) return;

    try {
      const token = await getFCMToken();
      if (!token) return;

      // Stable device id so we can upsert without duplicates
      let deviceId = localStorage.getItem('terreiras-device-id');
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('terreiras-device-id', deviceId);
      }

      await supabase.from('push_tokens').upsert(
        { 
          user_id: currentUser.id, 
          terreiro_id: currentTerreiroId, 
          token, 
          device_id: deviceId, 
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'device_id,user_id,terreiro_id' }
      );
      console.log('[FCM] Token registrado no Supabase ✅');
    } catch (err) {
      console.warn('[FCM] Falha ao salvar token:', err);
    }
  }, [currentUser, currentTerreiroId]);

  useEffect(() => {
    // Registra o Service Worker do Firebase se suportado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(reg => console.log('[SW] FCM Service Worker registrado:', reg.scope))
        .catch(err => console.error('[SW] Erro ao registrar FCM SW:', err));
    }

    const perm = getPermissionState();

    if (perm === 'unsupported') {
      setStatus('granted');
      return;
    }

    if (perm === 'granted') {
      setStatus('granted');
      registerFCMToken();
      return;
    }

    if (perm === 'denied') {
      setStatus('denied');
      setTimeout(() => setVisible(true), 50);
      return;
    }

    // default — show gate
    setStatus('gate');
    setTimeout(() => setVisible(true), 50);
  }, [registerFCMToken]);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true');
        // Register FCM token in Supabase
        await registerFCMToken();
        setVisible(false);
        setTimeout(() => setStatus('granted'), 350);
      } else {
        setStatus('denied');
      }
    } catch {
      setStatus('denied');
    }
  };

  if (!currentUser || status === 'granted' || status === 'checking') {
    return <>{children}</>;
  }

  const isDenied = status === 'denied';
  const accentColor = isDenied ? '#ff4c4c' : '#00f0ff';

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(5, 5, 10, 0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '1.5rem',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.35s ease',
  };

  const cardStyle: CSSProperties = {
    maxWidth: 480,
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${isDenied ? 'rgba(255,76,76,0.35)' : 'rgba(0,240,255,0.3)'}`,
    borderRadius: 20,
    padding: '2.5rem 2rem',
    textAlign: 'center',
    boxShadow: isDenied
      ? '0 0 80px rgba(255,76,76,0.08), inset 0 1px 0 rgba(255,76,76,0.08)'
      : '0 0 80px rgba(0,240,255,0.08), inset 0 1px 0 rgba(0,240,255,0.08)',
    transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
    opacity: visible ? 1 : 0,
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease',
    position: 'relative',
  };

  const iconWrapStyle: CSSProperties = {
    width: 80,
    height: 80,
    margin: '0 auto 1.5rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDenied
      ? 'linear-gradient(135deg, rgba(255,76,76,0.18), rgba(255,76,76,0.05))'
      : 'linear-gradient(135deg, rgba(0,240,255,0.18), rgba(176,0,255,0.08))',
    border: `1px solid ${isDenied ? 'rgba(255,76,76,0.3)' : 'rgba(0,240,255,0.3)'}`,
    animation: isDenied ? 'none' : 'gateIconPulse 2.5s ease-in-out infinite',
  };

  const primaryBtnStyle: CSSProperties = {
    width: '100%',
    padding: '1rem',
    background: 'linear-gradient(135deg, #00f0ff, #b000ff)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    boxShadow: '0 4px 24px rgba(0,240,255,0.22)',
    letterSpacing: '0.02em',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  };

  const steps = [
    'Clique no ícone de cadeado 🔒 na barra de endereço',
    'Selecione "Configurações do site"',
    'Em "Notificações", escolha "Permitir"',
    'Recarregue a página',
  ];

  return (
    <>
      <style>{`
        @keyframes gateIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .gate-primary-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 6px 32px rgba(0,240,255,0.35) !important;
        }
        .gate-primary-btn:active { transform: scale(0.97); }
        .gate-reload-btn:hover { background: rgba(255,76,76,0.25) !important; }
      `}</style>

      <div style={overlayStyle} aria-modal="true" role="dialog" aria-label="Permissão de notificações necessária">

        {/* Ambient glow */}
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: isDenied
            ? 'radial-gradient(circle, rgba(255,76,76,0.06) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={cardStyle}>
          {/* Icon */}
          <div style={iconWrapStyle}>
            {isDenied
              ? <BellOff size={36} color={accentColor} />
              : <Bell size={36} color={accentColor} />
            }
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            color: isDenied ? accentColor : 'var(--text-main, #fff)',
            letterSpacing: '-0.02em',
          }}>
            {isDenied ? 'Notificações Bloqueadas' : 'Ativar Notificações'}
          </h2>

          {/* Description */}
          <p style={{
            color: 'var(--text-muted, rgba(255,255,255,0.55))',
            lineHeight: 1.65,
            marginBottom: '2rem',
            fontSize: '0.95rem',
          }}>
            {isDenied ? (
              <>Você bloqueou as notificações para este site. Siga os passos abaixo para reativar e acessar o painel.</>
            ) : (
              <>Para acessar o painel, é preciso <strong style={{ color: 'var(--text-main, #fff)' }}>permitir notificações</strong>. Assim você receberá alertas de eventos, avisos e atualizações da sua casa espiritual em tempo real.</>
            )}
          </p>

          {/* CTA */}
          {isDenied ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Steps */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                textAlign: 'left',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginBottom: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Como reativar:
                </p>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: i < steps.length - 1 ? '0.6rem' : 0 }}>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(255,76,76,0.12)',
                      border: '1px solid rgba(255,76,76,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 700, color: '#ff4c4c',
                      flexShrink: 0, marginTop: 2,
                    }}>{i + 1}</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  className="gate-reload-btn"
                  onClick={() => window.location.reload()}
                  style={{
                    flex: 1, padding: '0.85rem',
                    background: 'rgba(255,76,76,0.12)',
                    border: '1px solid rgba(255,76,76,0.35)',
                    borderRadius: 10, color: '#ff4c4c',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', transition: 'background 0.2s',
                  }}
                >
                  <RefreshCw size={16} /> Já ativei — Recarregar
                </button>
                <button
                  onClick={() => window.open('about:preferences#privacy', '_blank')}
                  title="Abrir configurações do navegador"
                  style={{
                    padding: '0.85rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          ) : (
            <button
              className="gate-primary-btn"
              onClick={requestPermission}
              style={primaryBtnStyle}
            >
              <Bell size={20} />
              Permitir Notificações e Acessar
            </button>
          )}

          {/* Footer note */}
          {!isDenied && (
            <p style={{
              marginTop: '1.25rem',
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.28)',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem',
            }}>
              <CheckCircle size={11} />
              Somente notificações desta casa espiritual. Sem spam.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
