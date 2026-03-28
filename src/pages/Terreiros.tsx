import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Terreiro } from '../store/useStore';
import { Building2, Search, Edit2, Plus, ArrowLeft, Upload, X, Trash2, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { compressImage } from '../utils/image';

export default function Terreiros() {
  const { currentUser, getUserTerreiros, switchTerreiro, currentTerreiroId, addTerreiro, updateTerreiro, deleteTerreiro, toggleBlockTerreiro } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isMaster = currentUser?.isMaster || currentUser?.isPanelAdmin;
  const terreiros = getUserTerreiros();
  const navigate = useNavigate();

  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingTerreiro, setEditingTerreiro] = useState<Partial<Terreiro> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
        adminId: currentUser.id
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
            <Building2 size={28} /> {isAdmin ? 'Minhas Casas / Terreiros' : 'Minha Casa'}
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
                <th style={{ padding: '1rem' }}>Endereço</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerreiros.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: t.isBlocked ? 'rgba(255, 76, 76, 0.05)' : 'transparent', opacity: t.isBlocked ? 0.8 : 1 }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Building2 size={20} color="var(--neon-cyan)" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                          {t.name}
                          {t.isBlocked && <span style={{ marginLeft: '0.5rem', background: '#ff4c4c', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 4, verticalAlign: 'middle' }}>BLOQUEADO</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {t.id}</div>
                      </div>
                    </div>
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

                      {isMaster && (
                        <button 
                          onClick={async () => {
                            if (window.confirm(`ATENÇÃO: Deseja realmente excluir o terreiro "${t.name}"? Todos os membros e cobranças vinculadas a esta casa serão apagados permanentemente!`)) {
                              await deleteTerreiro(t.id);
                            }
                          }}
                          className="icon-btn" 
                          style={{ background: 'transparent', color: '#ff4c4c' }}
                          title="Excluir Terreiro"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTerreiros.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
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
                  
                  <label className="glass-panel glow-fx" style={{ padding: '0.8rem 1.2rem', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <Upload size={16} /> 
                    {editingTerreiro.logoUrl ? 'Trocar Foto' : 'Selecionar Foto'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const compressed = await compressImage(reader.result as string, 400, 400);
                            setEditingTerreiro({ ...editingTerreiro, logoUrl: compressed });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="glass-panel glow-fx" style={{ padding: '1rem 3rem', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}>
              Salvar Alterações
            </button>
          </div>
        </form>
      )}
    </motion.div>
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
