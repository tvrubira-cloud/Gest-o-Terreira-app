import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, ArrowRight, Loader2, Info } from 'lucide-react';
import { APP_USER_FIELDS, suggestMapping } from '../utils/importMapper';
import { useStore } from '../store/useStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  data: any[];
  onComplete: (count: number) => void;
}

export default function ImportModal({ isOpen, onClose, headers, data, onComplete }: ImportModalProps) {
  const { addUser } = useStore();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen && headers.length > 0) {
      setMapping(suggestMapping(headers));
    }
  }, [isOpen, headers]);

  const handleImport = async () => {
    setIsImporting(true);
    let count = 0;

    for (const row of data) {
      const userData: any = {
        role: 'USER',
        spiritual: { situacaoCadastro: 'ativo' } // Default state
      };

      APP_USER_FIELDS.forEach(field => {
        const column = mapping[field.key];
        if (column) {
          userData[field.key] = row[column]?.toString() || '';
        }
      });

      // Special handling for CPF if not provided
      if (!userData.cpf) {
        userData.cpf = `imported-${Math.floor(Math.random() * 999999)}`;
      }

      try {
        await addUser(userData);
        count++;
        setProgress(Math.round((count / data.length) * 100));
      } catch (err) {
        console.error("Erro ao importar linha:", err);
      }
    }

    setIsImporting(false);
    onComplete(count);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem' }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel" 
          style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '2rem', borderRadius: 20, border: '1px solid var(--neon-purple)', boxShadow: '0 0 30px rgba(157, 78, 221, 0.2)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <h2 className="text-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>Mapeamento Inteligente</h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
          </div>

          {!isImporting ? (
            <>
              <div style={{ background: 'rgba(157, 78, 221, 0.1)', padding: '1rem', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center', borderLeft: '4px solid var(--neon-purple)' }}>
                <Info size={20} color="var(--neon-purple)" />
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 }}>
                  Encontramos <strong>{headers.length} colunas</strong> e <strong>{data.length} linhas</strong> de dados. 
                  Abaixo, relacione as colunas da sua planilha com os campos do sistema.
                </p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>CAMPO DO SISTEMA</th>
                      <th style={{ padding: '0.5rem' }}>COLUNA DA PLANILHA</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {APP_USER_FIELDS.map(field => (
                      <tr key={field.key} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{field.label}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <select 
                            value={mapping[field.key] || ''} 
                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            className="search-input glass-panel"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', color: '#fff', border: '1px solid var(--glass-border)' }}
                          >
                            <option value="">-- Ignorar Campo --</option>
                            {headers.map(h => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          {mapping[field.key] ? (
                            <div style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', padding: '0.3rem', borderRadius: '50%', display: 'inline-flex' }}><Check size={14} /></div>
                          ) : (
                            <div style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '0.3rem', borderRadius: '50%', display: 'inline-flex' }}><AlertCircle size={14} /></div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={onClose}
                  className="glass-panel"
                  style={{ flex: 1, padding: '1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 10, fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImport}
                  className="glass-panel glow-fx"
                  style={{ flex: 2, padding: '1rem', background: 'var(--neon-purple)', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  IMPORTAR {data.length} MEMBROS <ArrowRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <Loader2 size={80} className="spin" color="var(--neon-purple)" />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                  {progress}%
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Importando Membros...</h3>
                <p style={{ color: 'var(--text-muted)' }}>Por favor, não feche esta janela até a conclusão.</p>
              </div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))' }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
