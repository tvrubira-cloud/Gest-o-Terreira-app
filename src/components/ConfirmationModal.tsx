import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  requiresInput?: boolean;
  expectedInput?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  requiresInput = false,
  expectedInput = ''
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [error, setError] = React.useState(false);

  const handleConfirm = () => {
    if (requiresInput) {
      if (inputValue.trim().toLowerCase() === expectedInput.toLowerCase()) {
        onConfirm();
        onClose();
        setInputValue('');
      } else {
        setError(true);
      }
    } else {
      onConfirm();
      onClose();
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'danger': return 'var(--neon-purple)';
      case 'warning': return 'var(--accent-gold)';
      default: return 'var(--neon-cyan)';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '2rem',
              borderRadius: '20px',
              border: `1px solid ${getVariantColor()}`,
              boxShadow: `0 0 30px ${variant === 'danger' ? 'rgba(157, 78, 221, 0.2)' : 'rgba(0, 240, 255, 0.1)'}`,
              position: 'relative',
              background: 'rgba(13, 13, 13, 0.95)'
            }}
          >
            <button 
              onClick={onClose}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: variant === 'danger' ? 'rgba(157, 78, 221, 0.1)' : 'rgba(0, 240, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                border: `1px solid ${getVariantColor()}`
              }}>
                <AlertTriangle size={30} color={getVariantColor()} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>{title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{message}</p>
            </div>

            {requiresInput && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--neon-purple)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Digite "{expectedInput}" para confirmar:
                </p>
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setError(false); }}
                  placeholder="Confirmar nome..."
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#000',
                    border: `1px solid ${error ? '#ff4c4c' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '12px',
                    color: '#fff',
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
                {error && (
                  <p style={{ color: '#ff4c4c', fontSize: '0.75rem', marginTop: '0.4rem', textAlign: 'center' }}>
                    O nome digitado não corresponde.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={onClose}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                  color: '#fff', cursor: 'pointer', fontWeight: 600
                }}
              >
                {cancelLabel}
              </button>
              <button 
                onClick={handleConfirm}
                style={{
                  flex: 1, padding: '0.8rem', borderRadius: '12px',
                  background: variant === 'danger' ? 'var(--neon-purple)' : 'var(--neon-cyan)',
                  border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600,
                  boxShadow: `0 0 15px ${variant === 'danger' ? 'rgba(157, 78, 221, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
