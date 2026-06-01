import { useState, useEffect } from 'react';
import { useStore, PLAN_LABELS, PLAN_PRICES } from '../store/useStore';
import type { Terreiro, PlanType, PlanStatus } from '../store/useStore';
import { Building2, Search, Edit2, Plus, ArrowLeft, Upload, X, Trash2, Lock, Unlock, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../utils/uploadImage';
import ConfirmationModal from '../components/ConfirmationModal';

const PLAN_COLORS: Record<PlanType, string> = {
  trial: '#C9A84C',
  ile: '#00f0ff',
  axe: '#9D4EDD',
  orun: '#ff6b35',
};

function getDaysRemaining(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const end = new Date(expiresAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getTrialStartDate(expiresAt?: string): string {
  if (!expiresAt) return '';
  const end = new Date(expiresAt);
  const start = new Date(end.getTime() - 21 * 24 * 60 * 60 * 1000);
  return start.toLocaleDateString('pt-BR');
}

export default function Terreiros() {
  const { currentUser, getUserTerreiros, switchTerreiro, currentTerreiroId, addTerreiro, updateTerreiro, deleteTerreiro, toggleBlockTerreiro, users } = useStore();
  const role = currentUser?.role?.toUpperCase();
  const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
  const isTrueMaster = !!currentUser?.isMaster;
  const trueMaster = users.find(u => u.isMaster);
  const isAdmin = role === 'ADMIN' || isMaster;
  const isStaff = isAdmin || role === 'FINANCEIRO' || role === 'SECRETARIA';
  const terreiros = getUserTerreiros();
  const navigate = useNavigate();

  // Redirect if not staff
  useEffect(() => {
    if (!isStaff) navigate('/dashboard');
  }, [isStaff, navigate]);

  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingTerreiro, setEditingTerreiro] = useState<Partial<Terreiro> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: '',
    name: ''
  });

  // Hook para transição automática caso usuário não seja admin
  useEffect(() => {
    if (!isAdmin && view === 'LIST') {
      setView('FORM');
      const myTerreiro = terreiros.find(t => t.id === currentUser?.terreiroId);
      if (myTerreiro) setEditingTerreiro(myTerreiro);
    }
  }, [isAdmin, view, terreiros, currentUser?.terreiroId]);
  const handleOpenNew = () => {
    setEditingTerreiro({
      name: '',
      endereco: '',
      logoUrl: '',
    });
    setView('FORM');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerreiro || !currentUser) return;

    if (editingTerreiro.id) {
      updateTerreiro(editingTerreiro.id, editingTerreiro);
    } else {
      addTerreiro({
        name: editingTerreiro.name || '',
        endereco: editingTerreiro.endereco || '',
        logoUrl: editingTerreiro.logoUrl || '',
        adminId: currentUser.id,
        plan: 'trial',
        planStatus: 'trialing',
        segmentoUmbanda: editingTerreiro.segmentoUmbanda ?? true,
        segmentoKimbanda: editingTerreiro.segmentoKimbanda ?? false,
        segmentoNacao: editingTerreiro.segmentoNacao ?? false,
        segmentoCandomble: editingTerreiro.segmentoCandomble ?? false,
        segmentoOutras: editingTerreiro.segmentoOutras ?? false,
        outrasTradicoesTexto: editingTerreiro.outrasTradicoesTexto ?? '',
      });
    }
    
    if (isAdmin) {
      setView('LIST');
    } else {
      alert("Dados salvos com sucesso.");
    }
  };

  const filteredTerreiros = terreiros.filter(t => 
    (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.endereco || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Building2 size={28} /> {isMaster ? 'Gerenciar Casas' : (isAdmin ? 'Minhas Casas' : 'Minha Casa')}
          </h2>
          {isAdmin && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Você administra {terreiros.length} casa{terreiros.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {isAdmin && isMaster && view === 'LIST' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => navigate('/admin/new-terreiro')}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(90deg, rgba(157, 78, 221, 0.2), rgba(0, 240, 255, 0.2))', color: '#fff', border: '1px solid var(--neon-purple)', cursor: 'pointer' }}
            >
              <Plus size={18} /> Cadastrar Novo Terreiro
            </button>
            <button 
              onClick={handleOpenNew}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}
            >
              <Plus size={18} /> Adicionar Filial
            </button>
          </div>
        )}
        {isAdmin && view === 'FORM' && (
          <button 
            onClick={() => setView('LIST')}
            className="glass-panel glow-fx"
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} /> Voltar para Lista
          </button>
        )}
      </div>

      {view === 'LIST' && isAdmin && (
        <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
          <div className="search-bar" style={{ width: '100%', marginBottom: '1.5rem' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou endereço..." 
              className="search-input" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Logo</th>
                <th style={{ padding: '1rem' }}>Nome do Terreiro</th>
                <th style={{ padding: '1rem' }}>Plano</th>
                <th style={{ padding: '1rem' }}>Endereço</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerreiros.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: t.isBlocked ? 'rgba(255, 76, 76, 0.05)' : 'transparent', opacity: t.isBlocked ? 0.8 : 1 }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Building2 size={20} color="var(--neon-cyan)" />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>
                      {t.name}
                      {t.isBlocked && <span style={{ marginLeft: '0.5rem', background: '#ff4c4c', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 4, verticalAlign: 'middle' }}>BLOQUEADO</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {t.id.slice(0, 18)}...</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <PlanBadge terreiro={t} />
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {t.endereco || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {t.id === currentTerreiroId ? (
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.2)', color: 'var(--neon-cyan)', fontSize: '0.8rem' }}>Ativo</span>
                    ) : (
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inativo</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {t.id !== currentTerreiroId && (
                        <button 
                          onClick={() => switchTerreiro(t.id)}
                          className="glass-panel glow-fx"
                          style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          Acessar
                        </button>
                      )}
                      <button 
                        onClick={() => { setEditingTerreiro(t); setView('FORM'); }}
                        className="icon-btn glow-fx" 
                        style={{ background: 'transparent' }}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>

                      {isMaster && (
                        <button 
                          onClick={async () => {
                            if (window.confirm(`Deseja realmente ${t.isBlocked ? 'DESBLOQUEAR' : 'BLOQUEAR'} o terreiro "${t.name}"?`)) {
                              await toggleBlockTerreiro(t.id, !t.isBlocked);
                            }
                          }}
                          className="icon-btn" 
                          style={{ background: 'transparent', color: t.isBlocked ? '#00ff88' : '#ffaa00' }}
                          title={t.isBlocked ? "Desbloquear Terreiro" : "Bloquear Acesso"}
                        >
                          {t.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                      )}

                      {(() => {
                        const isThisMasterTerreiro = t.adminId === trueMaster?.id || t.id === trueMaster?.terreiroId;
                        const canDelete = isTrueMaster || (isMaster && !isThisMasterTerreiro);
                        if (!canDelete) return null;
                        
                        return (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, id: t.id, name: t.name })}
                            className="icon-btn" 
                            style={{ background: 'transparent', color: '#ff4c4c' }}
                            title="Excluir Terreiro"
                          >
                            <Trash2 size={16} />
                          </button>
                        );
                      })()}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTerreiros.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum terreiro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === 'FORM' && editingTerreiro && (
        <form onSubmit={handleSave} className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-cyan)' }}>Dados da Casa / Terreiro</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
              <Input 
                label="Nome do Terreiro" 
                value={editingTerreiro.name} 
                onChange={(v: string) => setEditingTerreiro({...editingTerreiro, name: v})} 
                required 
              />
              <Input 
                label="Endereço Completo" 
                value={editingTerreiro.endereco} 
                onChange={(v: string) => setEditingTerreiro({...editingTerreiro, endereco: v})} 
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Logo do Terreiro</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 80, height: 80, borderRadius: 12, overflow: 'hidden', 
                      background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--glass-border)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'
                    }}
                  >
                    {editingTerreiro.logoUrl ? (
                      <>
                        <img src={editingTerreiro.logoUrl} alt="Logo Prev" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => setEditingTerreiro({...editingTerreiro, logoUrl: ''})}
                          style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer', color: '#fff' }}>
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <Building2 size={30} color="var(--glass-border)" />
                    )}
                  </div>
                  
                  <label className="glass-panel glow-fx" style={{ padding: '0.8rem 1.2rem', cursor: isUploadingLogo ? 'wait' : 'pointer', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: isUploadingLogo ? 0.7 : 1 }}>
                    <Upload size={16} />
                    {isUploadingLogo ? 'Enviando...' : editingTerreiro.logoUrl ? 'Trocar Foto' : 'Selecionar Foto'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        e.target.value = '';
                        setIsUploadingLogo(true);
                        try {
                          const path = editingTerreiro.id
                            ? `logos/terreiro-${editingTerreiro.id}.jpg`
                            : `logos/terreiro-new-${Date.now()}.jpg`;
                          const url = await uploadImage(file, path);
                          setEditingTerreiro({ ...editingTerreiro, logoUrl: url });
                        } catch (err: any) {
                          alert(`Erro ao enviar logo: ${err.message}`);
                        } finally {
                          setIsUploadingLogo(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {editingTerreiro.id && isMaster && (
            <div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-purple)' }}>Plano e Assinatura</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-muted)' }}>Plano</label>
                  <select
                    className="search-input glass-panel"
                    value={editingTerreiro.plan || 'trial'}
                    onChange={e => setEditingTerreiro({...editingTerreiro, plan: e.target.value as PlanType})}
                    style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit', background: 'rgba(0,0,0,0.3)', cursor: 'pointer' }}
                  >
                    {PLANOS_DISPONIVEIS.map(p => (
                      <option key={p} value={p} style={{ background: '#1a1a2e', color: '#fff' }}>
                        {PLAN_LABELS[p]} {p !== 'trial' ? `- R$ ${PLAN_PRICES[p]}/mês` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-muted)' }}>Status do Plano</label>
                  <select
                    className="search-input glass-panel"
                    value={editingTerreiro.planStatus || 'trialing'}
                    onChange={e => setEditingTerreiro({...editingTerreiro, planStatus: e.target.value as PlanStatus})}
                    style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit', background: 'rgba(0,0,0,0.3)', cursor: 'pointer' }}
                  >
                    {PLAN_STATUS_OPCOES.map(s => (
                      <option key={s.value} value={s.value} style={{ background: '#1a1a2e', color: '#fff' }}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-muted)' }}>Data de Expiração</label>
                  <input
                    type="date"
                    className="search-input glass-panel"
                    value={editingTerreiro.planExpiresAt ? editingTerreiro.planExpiresAt.slice(0, 10) : ''}
                    onChange={e => {
                      const val = e.target.value;
                      setEditingTerreiro({
                        ...editingTerreiro,
                        planExpiresAt: val ? new Date(val + 'T23:59:59.000Z').toISOString() : undefined,
                      });
                    }}
                    style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit', background: 'rgba(0,0,0,0.3)', cursor: 'pointer', colorScheme: 'dark' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {editingTerreiro.planExpiresAt && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      {getDaysRemaining(editingTerreiro.planExpiresAt) !== null && (
                        <>Restam <strong style={{ color: getDaysRemaining(editingTerreiro.planExpiresAt) === 0 ? '#ff4c4c' : '#00f0ff' }}>{getDaysRemaining(editingTerreiro.planExpiresAt)}</strong> dia{getDaysRemaining(editingTerreiro.planExpiresAt) !== 1 ? 's' : ''}</>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="glass-panel glow-fx" style={{ padding: '1rem 3rem', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}>
              Salvar Alterações
            </button>
          </div>
        </form>
      )}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={async () => {
          try {
            await deleteTerreiro(deleteModal.id);
          } catch (err) {
            alert("Erro ao excluir terreiro. Verifique se você tem permissão ou se restam dependências.");
          }
        }}
        title="Excluir Terreiro"
        message={`ATENÇÃO: Deseja realmente excluir o terreiro "${deleteModal.name}"? Todos os membros, eventos e cobranças vinculadas a esta casa serão apagados permanentemente!`}
        confirmLabel="Sim, Excluir Tudo"
        cancelLabel="Cancelar"
      />
    </motion.div>
  );
}

const PLANOS_DISPONIVEIS: PlanType[] = ['trial', 'ile', 'axe', 'orun'];
const PLAN_STATUS_OPCOES: { value: PlanStatus; label: string }[] = [
  { value: 'trialing', label: 'Teste' },
  { value: 'active', label: 'Ativo' },
  { value: 'past_due', label: 'Vencido' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'expired', label: 'Expirado' },
];

function PlanBadge({ terreiro }: { terreiro: Terreiro }) {
  const cor = PLAN_COLORS[terreiro.plan];
  const dias = getDaysRemaining(terreiro.planExpiresAt);
  const isTrial = terreiro.plan === 'trial';
  const isExpired = dias === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          padding: '0.2rem 0.6rem',
          borderRadius: 8,
          background: `${cor}18`,
          color: cor,
          fontSize: '0.8rem',
          fontWeight: 700,
          border: `1px solid ${cor}40`,
        }}>
          {PLAN_LABELS[terreiro.plan]}
        </span>
        <span style={{
          fontSize: '0.7rem',
          color: isExpired ? '#ff4c4c' : terreiro.planStatus === 'active' ? '#00ff88' : 'var(--text-muted)',
          fontWeight: 600,
        }}>
          {isTrial ? 'Teste' : terreiro.planStatus === 'active' ? 'Pago' : terreiro.planStatus}
        </span>
      </div>
      {dias !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: isExpired ? '#ff4c4c' : 'var(--text-muted)' }}>
          <Clock size={12} />
          {isExpired ? 'Expirado' : `${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`}
          {isTrial && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              (desde {getTrialStartDate(terreiro.planExpiresAt)})
            </span>
          )}
        </div>
      )}
      {isTrial && !terreiro.planExpiresAt && (
        <div style={{ fontSize: '0.75rem', color: '#C9A84C' }}>21 dias grátis (sem data definida)</div>
      )}
    </div>
  );
}

interface InputProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

function Input({ label, value, onChange, type = "text", required = false, placeholder }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ color: 'var(--text-muted)' }}>{label} {required && <span style={{ color: 'var(--neon-purple)' }}>*</span>}</label>
      <input 
        type={type} 
        required={required}
        placeholder={placeholder}
        className="search-input glass-panel" 
        style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit' }} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
