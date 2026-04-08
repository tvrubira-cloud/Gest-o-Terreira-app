import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, ArrowRight, Loader2, Info, Eye, User as UserIcon, Phone, Zap, Shield } from 'lucide-react';
import { APP_USER_FIELDS, suggestMapping, rowToUserData } from '../utils/importMapper';
import { useStore } from '../store/useStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  data: any[];
  onComplete: (count: number) => void;
}

const SECTION_CONFIG = {
  personal: { label: 'Dados Pessoais', icon: UserIcon, color: 'var(--neon-cyan)' },
  contact:  { label: 'Contato e Endereço', icon: Phone, color: 'var(--neon-purple)' },
  spiritual:{ label: 'Dados Espirituais', icon: Zap, color: '#ffd700' },
};

export default function ImportModal({ isOpen, onClose, headers, data, onComplete }: ImportModalProps) {
  const { addUser, getCurrentTerreiroSeguimento } = useStore();
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewField, setPreviewField] = useState<string | null>(null);

  const seguimento = getCurrentTerreiroSeguimento();
  const seguimentosAtivos = [
    seguimento.segmentoUmbanda && 'Umbanda',
    seguimento.segmentoKimbanda && 'Quimbanda',
    seguimento.segmentoNacao && 'Nação de Orixás',
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (isOpen && headers.length > 0) {
      setMapping(suggestMapping(headers));
      setPreviewField(null);
    }
  }, [isOpen, headers]);

  const mappedCount = Object.values(mapping).filter(Boolean).length;
  const mappedPct = APP_USER_FIELDS.length > 0
    ? Math.round((mappedCount / APP_USER_FIELDS.length) * 100)
    : 0;

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    let count = 0;

    const terreiroSeguimento = getCurrentTerreiroSeguimento();

    for (const row of data) {
      const userData = rowToUserData(row, mapping, terreiroSeguimento);

      // Fallback CPF
      if (!userData.cpf) {
        userData.cpf = `imported-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await addUser(userData as any);
        count++;
      } catch (err) {
        console.error('Erro ao importar linha:', err);
      }

      setProgress(Math.round((count / data.length) * 100));
    }

    setIsImporting(false);
    onComplete(count);
    onClose();
  };

  // Preview: primeiras 3 linhas do campo mapeado
  const getPreviewValues = (fieldKey: string) => {
    const col = mapping[fieldKey];
    if (!col) return [];
    return data
      .slice(0, 3)
      .map(row => row[col]?.toString() || '—')
      .filter(Boolean);
  };

  if (!isOpen) return null;

  const sections = (['personal', 'contact', 'spiritual'] as const);

  return (
    <AnimatePresence>
      <div
        className="modal-overlay"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '1rem' }}
        onClick={(e) => { if (e.target === e.currentTarget && !isImporting) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-panel"
          style={{ width: '100%', maxWidth: '900px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '2rem', borderRadius: 20, border: '1px solid var(--neon-purple)', boxShadow: '0 0 40px rgba(157, 78, 221, 0.25)' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', flexShrink: 0 }}>
            <div>
              <h2 className="text-gradient" style={{ fontSize: '1.4rem', margin: 0 }}>Mapeamento Inteligente de Campos</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                {headers.length} colunas detectadas · {data.length} registros na planilha
              </p>
            </div>
            {!isImporting && (
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22} /></button>
            )}
          </div>

          {!isImporting ? (
            <>
              {/* Banner: Seguimento da casa detectado */}
              <div style={{ background: 'rgba(255, 215, 0, 0.07)', padding: '0.8rem 1rem', borderRadius: 12, marginBottom: '1rem', borderLeft: '4px solid #ffd700', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <Shield size={16} color="#ffd700" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem' }}>
                  <span style={{ color: '#ffd700', fontWeight: 700 }}>Seguimento da casa detectado: </span>
                  {seguimentosAtivos.length > 0 ? (
                    seguimentosAtivos.map((s, i) => (
                      <span key={s} style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>
                        {s}{i < seguimentosAtivos.length - 1 ? ' · ' : ''}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Nenhum seguimento configurado</span>
                  )}
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    — Os campos espirituais serão preenchidos automaticamente conforme o seguimento.
                  </span>
                </div>
              </div>

              {/* Barra de progresso do mapeamento automático */}
              <div style={{ background: 'rgba(157, 78, 221, 0.1)', padding: '1rem', borderRadius: 12, marginBottom: '1.2rem', borderLeft: '4px solid var(--neon-purple)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    <Info size={16} color="var(--neon-purple)" />
                    Autodetecção: <strong style={{ color: mappedPct >= 70 ? 'var(--neon-cyan)' : '#ffd700' }}>{mappedPct}% dos campos mapeados automaticamente</strong>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mappedCount}/{APP_USER_FIELDS.length} campos</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${mappedPct}%` }}
                    transition={{ duration: 0.6 }}
                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))', borderRadius: 4 }}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                  Revise os campos abaixo. <strong>Selecione a coluna correspondente</strong> em cada campo do sistema que deseja importar. 
                  Clique em <Eye size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> para conferir os dados.
                </p>
                {mappedCount === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ marginTop: '0.8rem', padding: '0.6rem', background: 'rgba(255,215,0,0.1)', border: '1px solid #ffd70044', borderRadius: 8, fontSize: '0.75rem', color: '#ffd700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <AlertCircle size={14} />
                    <span>Nenhuma coluna foi mapeada ainda. Selecione ao menos uma coluna abaixo para habilitar o botão de importar.</span>
                  </motion.div>
                )}
              </div>

              {/* Tabela de mapeamento por seção */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {sections.map(section => {
                  const cfg = SECTION_CONFIG[section];
                  const sectionFields = APP_USER_FIELDS.filter(f => f.section === section);
                  const Icon = cfg.icon;
                  return (
                    <div key={section} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: cfg.color, marginBottom: '0.7rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Icon size={15} /> {cfg.label}
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                        <thead>
                          <tr style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '0 0.8rem', textAlign: 'left', width: '30%' }}>Campo do Sistema</th>
                            <th style={{ padding: '0 0.8rem', textAlign: 'left' }}>Coluna da Planilha</th>
                            <th style={{ padding: '0 0.5rem', textAlign: 'center', width: '90px' }}>Status / Pré-view</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sectionFields.map(field => {
                            const isMapped = !!mapping[field.key];
                            const preview = getPreviewValues(field.key);
                            const isShowingPreview = previewField === field.key;
                            return (
                              <Fragment key={field.key}>
                                <tr
                                  style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'default' }}
                                >
                                  <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600, fontSize: '0.85rem' }}>{field.label}</td>
                                  <td style={{ padding: '0.5rem 0.8rem' }}>
                                    <select
                                      value={mapping[field.key] || ''}
                                      onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                                      className="search-input glass-panel"
                                      style={{ width: '100%', padding: '0.45rem 0.6rem', fontSize: '0.82rem', color: '#fff', border: `1px solid ${isMapped ? cfg.color + '66' : 'var(--glass-border)'}`, borderRadius: 8 }}
                                    >
                                      <option value="">-- Ignorar Campo --</option>
                                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                  </td>
                                  <td style={{ padding: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                    {isMapped ? (
                                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                                        <div title="Mapeado" style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', padding: '0.25rem', borderRadius: '50%', display: 'inline-flex' }}><Check size={13} /></div>
                                        <button
                                          title="Ver exemplos"
                                          onClick={() => setPreviewField(isShowingPreview ? null : field.key)}
                                          style={{ background: isShowingPreview ? 'rgba(157,78,221,0.2)' : 'transparent', border: 'none', color: 'var(--neon-purple)', cursor: 'pointer', padding: '0.25rem', borderRadius: '50%', display: 'inline-flex' }}
                                        >
                                          <Eye size={13} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div title="Não mapeado" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '50%', display: 'inline-flex', margin: 'auto' }}><AlertCircle size={13} /></div>
                                    )}
                                  </td>
                                </tr>
                                {isShowingPreview && preview.length > 0 && (
                                  <tr key={field.key + '-preview'}>
                                    <td colSpan={3} style={{ padding: '0 0.8rem 0.8rem' }}>
                                      <div style={{ background: 'rgba(157,78,221,0.07)', border: '1px dashed rgba(157,78,221,0.3)', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        <span style={{ color: 'var(--neon-purple)', fontWeight: 600 }}>Exemplos: </span>
                                        {preview.map((v, i) => (
                                          <span key={i} style={{ marginRight: '1rem', color: '#ddd' }}>"{v}"</span>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Rodapé */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexShrink: 0, borderTop: '1px solid var(--glass-border)', paddingTop: '1.2rem' }}>
                <button
                  onClick={onClose}
                  className="glass-panel"
                  style={{ flex: 1, padding: '0.9rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 10, fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  className="glass-panel glow-fx"
                  disabled={mappedCount === 0}
                  style={{ flex: 2, padding: '0.9rem', background: mappedCount === 0 ? 'rgba(157,78,221,0.3)' : 'var(--neon-purple)', color: '#fff', border: 'none', cursor: mappedCount === 0 ? 'not-allowed' : 'pointer', borderRadius: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: mappedCount === 0 ? 0.6 : 1 }}
                >
                  IMPORTAR {data.length} MEMBROS <ArrowRight size={18} />
                </button>
              </div>
            </>
          ) : (
            /* Tela de progresso */
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
