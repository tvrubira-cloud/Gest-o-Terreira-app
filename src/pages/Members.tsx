import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { User, SpiritualData } from '../store/useStore';
import { Users, Search, Edit2, Plus, ArrowLeft, Upload, X, User as UserIcon, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { compressImage } from '../utils/image';

export default function Members() {
  const { currentUser, addUser, updateUser, deleteUser, getFilteredUsers, getCurrentTerreiro } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const users = getFilteredUsers();
  const currentTerreiro = getCurrentTerreiro();

  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isAdmin && view === 'LIST') {
    setView('FORM');
    setEditingUser(currentUser);
  }

  const handleOpenNew = () => {
    setEditingUser({
      role: 'USER',
      nomeCompleto: '',
      cpf: '',
      nomeDeSanto: '',
      dataNascimento: '',
      rg: '',
      endereco: '',
      telefone: '',
      email: '',
      profissao: '',
      nomePais: '',
      spiritual: {
        tempoUmbanda: '',
        religiaoAnterior: '',
        orixaFrente: '',
        orixaAdjunto: '',
        tipoMedium: '',
        chefeCoroa: '',
        orixas: [],
        entidades: [],
        paiDeSantoAnterior: '',
        dataEntrada: '',
        historicoObrigacoes: ''
      }
    });
    setView('FORM');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.id) {
      await updateUser(editingUser.id, editingUser);
    } else {
      // terreiroId is auto-set by the store
      await addUser(editingUser as Omit<User, 'id' | 'createdAt' | 'terreiroId'>);
    }
    
    if (isAdmin) {
      setView('LIST');
    } else {
      alert("Dados salvos com sucesso.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.nomeDeSanto && u.nomeDeSanto.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Users size={28} /> {isAdmin ? 'Membros da Casa' : 'Meu Perfil Espiritual'}
          </h2>
          {isAdmin && currentTerreiro && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {currentTerreiro.name} — {users.length} membro{users.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {isAdmin && view === 'LIST' && (
          <button 
            onClick={handleOpenNew}
            className="glass-panel glow-fx"
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}
          >
            <Plus size={18} /> Cadastrar Membro
          </button>
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
              placeholder="Buscar por nome civil ou de santo..." 
              className="search-input" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '1rem' }}>Foto</th>
                <th style={{ padding: '1rem' }}>CPF / Login</th>
                <th style={{ padding: '1rem' }}>Nome Completo</th>
                <th style={{ padding: '1rem' }}>Nome de Santo</th>
                <th style={{ padding: '1rem' }}>Função / Cargo</th>
                <th style={{ padding: '1rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--glass-border)' }}>
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UserIcon size={16} color="var(--text-muted)" />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>{u.cpf}</td>
                  <td style={{ padding: '1rem' }}>{u.nomeCompleto}</td>
                  <td style={{ padding: '1rem', color: 'var(--neon-cyan)' }}>{u.nomeDeSanto || '-'}</td>
                  <td style={{ padding: '1rem' }}>{u.role === 'ADMIN' ? 'Mestre / Sacerdote' : u.spiritual.tipoMedium || 'Assistente'}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      {(!u.isMaster || currentUser?.isMaster) && (
                        <>
                          <button 
                            onClick={() => { setEditingUser(u); setView('FORM'); }}
                            className="icon-btn glow-fx" 
                            style={{ background: 'transparent' }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button 
                              onClick={async () => {
                                if (window.confirm(`Deseja realmente excluir o membro ${u.nomeCompleto}? Esta ação não pode ser desfeita.`)) {
                                  await deleteUser(u.id);
                                }
                              }}
                              className="icon-btn" 
                              style={{ background: 'transparent', color: '#ff4c4c' }}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
                      )}
                      {u.isMaster && !currentUser?.isMaster && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin Global</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'FORM' && editingUser && (
        <form onSubmit={handleSave} className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-cyan)' }}>Dados Pessoais (Identificação)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {isAdmin && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                  <label style={{ color: 'var(--text-muted)' }}>Papel no Sistema <span style={{ color: 'var(--neon-purple)' }}>*</span></label>
                  <select 
                    className="search-input glass-panel" 
                    style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }}
                    value={editingUser.isPanelAdmin ? 'PANEL_ADMIN' : editingUser.role}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'PANEL_ADMIN') {
                        setEditingUser({...editingUser, role: 'ADMIN', isPanelAdmin: true});
                      } else {
                        setEditingUser({...editingUser, role: val as 'ADMIN' | 'USER', isPanelAdmin: false});
                      }
                    }}
                  >
                    <option value="USER" style={{ color: '#000' }}>Filho de Santo / Assistente</option>
                    <option value="ADMIN" style={{ color: '#000' }}>Administrador (Dirigente / Pai de Santo)</option>
                    {currentUser?.isMaster && (
                      <option value="PANEL_ADMIN" style={{ color: '#000' }}>Administrador do Painel</option>
                    )}
                  </select>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1', marginBottom: '1rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Foto do Membro</label>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', 
                      background: 'rgba(255,255,255,0.05)', border: '2px solid var(--neon-cyan)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
                      boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)'
                    }}
                  >
                    {editingUser.photoUrl ? (
                      <>
                        <img src={editingUser.photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                          type="button" 
                          onClick={() => setEditingUser({...editingUser, photoUrl: ''})}
                          style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(255,0,0,0.8)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: '#fff' }}>
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <UserIcon size={40} color="var(--glass-border)" />
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="glass-panel glow-fx" style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', borderRadius: 8 }}>
                      <Upload size={18} /> 
                      {editingUser.photoUrl ? 'Trocar Foto' : 'Fazer Upload da Foto'}
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
                              setEditingUser({ ...editingUser, photoUrl: compressed });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formatos aceitos: JPG, PNG. Máx 2MB.</span>
                  </div>
                </div>
              </div>

              {editingUser.id === currentUser?.id && currentUser?.isMaster && (
                <div style={{ gridColumn: '1 / -1', marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: 12 }}>
                  <h4 style={{ color: 'var(--accent-gold)', marginBottom: '0.8rem' }}>Segurança da Conta Master</h4>
                  <Input label="Nova Senha (deixe em branco para não alterar)" type="password" value={editingUser.password} onChange={(v: string) => setEditingUser({...editingUser, password: v})} />
                </div>
              )}

              <Input label="CPF (Login)" value={editingUser.cpf} onChange={(v: string) => setEditingUser({...editingUser, cpf: v})} required readOnly={!isAdmin && !!editingUser.id} />
              <Input label="Nome Completo" value={editingUser.nomeCompleto} onChange={(v: string) => setEditingUser({...editingUser, nomeCompleto: v})} required />
              <Input label="Data de Nascimento" type="date" value={editingUser.dataNascimento} onChange={(v: string) => setEditingUser({...editingUser, dataNascimento: v})} />
              <Input label="RG" value={editingUser.rg} onChange={(v: string) => setEditingUser({...editingUser, rg: v})} />
              <Input label="Profissão" value={editingUser.profissao} onChange={(v: string) => setEditingUser({...editingUser, profissao: v})} />
              <Input label="Telefone / WhatsApp" value={editingUser.telefone} onChange={(v: string) => setEditingUser({...editingUser, telefone: v})} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Endereço Completo" value={editingUser.endereco} onChange={(v: string) => setEditingUser({...editingUser, endereco: v})} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Nome dos Pais/Responsáveis" value={editingUser.nomePais} onChange={(v: string) => setEditingUser({...editingUser, nomePais: v})} />
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-purple)' }}>Dados Espirituais e Religiosos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Nome de Santo / Terreiro" value={editingUser.nomeDeSanto} onChange={(v: string) => setEditingUser({...editingUser, nomeDeSanto: v})} />
              <Input label="Tempo de Umbanda" value={editingUser.spiritual?.tempoUmbanda} onChange={(v: string) => updateSpiritual('tempoUmbanda', v)} />
              <Input label="Religião Anterior" value={editingUser.spiritual?.religiaoAnterior} onChange={(v: string) => updateSpiritual('religiaoAnterior', v)} />
              <Input label="Orixá de Cabeça/Frente" value={editingUser.spiritual?.orixaFrente} onChange={(v: string) => updateSpiritual('orixaFrente', v)} />
              <Input label="Orixá Adjuntó" value={editingUser.spiritual?.orixaAdjunto} onChange={(v: string) => updateSpiritual('orixaAdjunto', v)} />
              <Input label="Tipo de Médium (ex: Cambono, Ogã)" value={editingUser.spiritual?.tipoMedium} onChange={(v: string) => updateSpiritual('tipoMedium', v)} />
              <Input label="Chefe da Coroa" value={editingUser.spiritual?.chefeCoroa} onChange={(v: string) => updateSpiritual('chefeCoroa', v)} />
              <Input label="Pai/Mãe de Santo Anterior" value={editingUser.spiritual?.paiDeSantoAnterior} onChange={(v: string) => updateSpiritual('paiDeSantoAnterior', v)} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Orixás (Separados por vírgula)</label>
                <input type="text" className="search-input glass-panel" style={{ padding: '0.8rem', border: '1px solid var(--glass-border)' }} 
                  value={editingUser.spiritual?.orixas?.join(', ') || ''} 
                  onChange={e => updateSpiritual('orixas', e.target.value.split(',').map(s=>s.trim()))} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Entidades (Separadas por vírgula)</label>
                <input type="text" className="search-input glass-panel" style={{ padding: '0.8rem', border: '1px solid var(--glass-border)' }} 
                  value={editingUser.spiritual?.entidades?.join(', ') || ''} 
                  onChange={e => updateSpiritual('entidades', e.target.value.split(',').map(s=>s.trim()))} 
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div>
              <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>Organização Interna (Restrito Admin)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <Input label="Data de Entrada no Terreiro" type="date" value={editingUser.spiritual?.dataEntrada} onChange={(v: string) => updateSpiritual('dataEntrada', v)} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-muted)' }}>Histórico de Obrigações</label>
                  <textarea className="search-input glass-panel" rows={4} style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', resize: 'vertical' }} 
                    value={editingUser.spiritual?.historicoObrigacoes} onChange={e => updateSpiritual('historicoObrigacoes', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="glass-panel glow-fx" style={{ padding: '1rem 3rem', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}>
              Salvar Ficha Completa
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );

  function updateSpiritual(field: keyof SpiritualData, value: string | string[]) {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      spiritual: {
        ...(editingUser.spiritual as SpiritualData),
        [field]: value
      }
    });
  }
}

interface InputProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
}

function Input({ label, value, onChange, type = "text", required = false, readOnly = false }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ color: 'var(--text-muted)' }}>{label} {required && <span style={{ color: 'var(--neon-purple)' }}>*</span>}</label>
      <input 
        type={type} 
        required={required}
        readOnly={readOnly}
        className="search-input glass-panel" 
        style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: readOnly ? 'var(--text-muted)' : 'var(--text-main)', opacity: readOnly ? 0.7 : 1, fontFamily: 'inherit' }} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
