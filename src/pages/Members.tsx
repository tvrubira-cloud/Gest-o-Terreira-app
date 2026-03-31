import { useState } from 'react';
import { useStore, defaultSpiritualData } from '../store/useStore';
import type { User, SpiritualData } from '../store/useStore';
import { Users, Search, Edit2, Plus, ArrowLeft, Upload, User as UserIcon, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '../utils/image';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Members() {
  const { currentUser, addUser, updateUser, deleteUser, getFilteredUsers, getCurrentTerreiro } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const users = getFilteredUsers();
  const currentTerreiro = getCurrentTerreiro();

  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [activeTab, setActiveTab] = useState<'pessoal' | 'umbanda' | 'quimbanda' | 'nacao' | 'obrigacoes'>('pessoal');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });

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
      cep: '',
      cidade: '',
      estado: '',
      telefone: '',
      email: '',
      whatsapp: '',
      profissao: '',
      nomePais: '',
      spiritual: defaultSpiritualData
    });
    setActiveTab('pessoal');
    setView('FORM');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editingUser.id) {
      await updateUser(editingUser.id, editingUser);
    } else {
      await addUser(editingUser as Omit<User, 'id' | 'createdAt' | 'terreiroId'>);
    }
    
    if (isAdmin) {
      setView('LIST');
    } else {
      alert("Dados salvos com sucesso.");
    }
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro && editingUser) {
        setEditingUser({
          ...editingUser,
          cep: data.cep,
          endereco: `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ''}`,
          cidade: data.localidade,
          estado: data.uf
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.nomeDeSanto && u.nomeDeSanto.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const updateSpiritual = (field: keyof SpiritualData, value: any) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      spiritual: {
        ...(editingUser.spiritual as SpiritualData),
        [field]: value
      }
    });
  };

  const updateObrigacao = (index: number, field: 'data' | 'descricao', value: string) => {
    if (!editingUser?.spiritual) return;
    const newObrigs = [...editingUser.spiritual.obrigacoes];
    newObrigs[index] = { ...newObrigs[index], [field]: value };
    updateSpiritual('obrigacoes', newObrigs);
  };

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
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1.2rem' }}>Foto</th>
                  <th style={{ padding: '1.2rem' }}>CPF / Login</th>
                  <th style={{ padding: '1.2rem' }}>Nome Completo</th>
                  <th style={{ padding: '1.2rem' }}>Nome de Santo</th>
                  <th style={{ padding: '1.2rem' }}>Status</th>
                  <th style={{ padding: '1.2rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                    <td style={{ padding: '1rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--neon-cyan)', boxShadow: '0 0 10px rgba(0, 240, 255, 0.1)' }}>
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <UserIcon size={20} color="var(--text-muted)" />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{u.cpf}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{u.nomeCompleto}</td>
                    <td style={{ padding: '1rem', color: 'var(--neon-cyan)', fontWeight: 500 }}>{u.nomeDeSanto || '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase',
                        background: u.spiritual?.situacaoCadastro === 'ativo' ? 'rgba(0, 255, 128, 0.1)' : 'rgba(255, 76, 76, 0.1)',
                        color: u.spiritual?.situacaoCadastro === 'ativo' ? '#00eeff' : '#ff4c4c',
                        border: `1px solid ${u.spiritual?.situacaoCadastro === 'ativo' ? 'rgba(0, 255, 128, 0.2)' : 'rgba(255, 76, 76, 0.2)'}`
                      }}>
                        {u.spiritual?.situacaoCadastro || 'ativo'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button 
                          onClick={() => { setEditingUser(u); setView('FORM'); setActiveTab('pessoal'); }}
                          className="icon-btn glow-fx" 
                          style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '6px', borderRadius: '8px' }}
                          title="Editar"
                        >
                          <Edit2 size={16} color="var(--neon-cyan)" />
                        </button>
                        {u.id !== currentUser?.id && !u.isMaster && (
                          <button 
                            onClick={() => setDeleteModal({ isOpen: true, userId: u.id, userName: u.nomeCompleto })}
                            className="icon-btn" 
                            style={{ background: 'rgba(255, 76, 76, 0.1)', border: '1px solid rgba(255, 76, 76, 0.2)', padding: '6px', borderRadius: '8px', color: '#ff4c4c' }}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'FORM' && editingUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tabs Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <TabButton active={activeTab === 'pessoal'} onClick={() => setActiveTab('pessoal')} label="Dados Pessoais" />
            <TabButton active={activeTab === 'umbanda'} onClick={() => setActiveTab('umbanda')} label="Umbanda" />
            <TabButton active={activeTab === 'quimbanda'} onClick={() => setActiveTab('quimbanda')} label="Quimbanda" />
            <TabButton active={activeTab === 'nacao'} onClick={() => setActiveTab('nacao')} label="Nação de Orixás" />
            <TabButton active={activeTab === 'obrigacoes'} onClick={() => setActiveTab('obrigacoes')} label="Calendário de Obrigações" />
          </div>

          <form onSubmit={handleSave} className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'pessoal' && (
                <motion.div key="pessoal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserIcon size={20} /> Identificação e Localização
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--neon-cyan)', boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)', flexShrink: 0 }}>
                        {editingUser.photoUrl ? (
                          <img src={editingUser.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <UserIcon size={48} color="var(--glass-border)" />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <label className="glass-panel glow-fx" style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', color: '#fff', borderRadius: 8, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Upload size={16} /> Carregar Foto
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = async () => {
                                const compressed = await compressImage(reader.result as string, 400, 400);
                                setEditingUser({ ...editingUser, photoUrl: compressed });
                              }
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membro desde: {editingUser.createdAt ? new Date(editingUser.createdAt).toLocaleDateString() : 'Novo'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Situação do Cadastro</label>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <StatusChip active={editingUser.spiritual?.situacaoCadastro === 'ativo'} onClick={() => updateSpiritual('situacaoCadastro', 'ativo')} label="Ativo" color="#00ff80" />
                        <StatusChip active={editingUser.spiritual?.situacaoCadastro === 'inativo'} onClick={() => updateSpiritual('situacaoCadastro', 'inativo')} label="Inativo" color="#ff4c4c" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Segmentos</label>
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <SegmentCheck active={!!editingUser.spiritual?.segmentoUmbanda} onClick={() => updateSpiritual('segmentoUmbanda', !editingUser.spiritual?.segmentoUmbanda)} label="Umbanda" />
                        <SegmentCheck active={!!editingUser.spiritual?.segmentoKimbanda} onClick={() => updateSpiritual('segmentoKimbanda', !editingUser.spiritual?.segmentoKimbanda)} label="Quimbanda" />
                        <SegmentCheck active={!!editingUser.spiritual?.segmentoNacao} onClick={() => updateSpiritual('segmentoNacao', !editingUser.spiritual?.segmentoNacao)} label="Nação" />
                      </div>
                    </div>

                    <Input label="CPF (Login)" value={editingUser.cpf} onChange={(v) => setEditingUser({...editingUser, cpf: v})} required readOnly={!isAdmin && !!editingUser.id} />
                    <Input label="Nome Completo" value={editingUser.nomeCompleto} onChange={(v) => setEditingUser({...editingUser, nomeCompleto: v})} required />
                    <Input label="Data de Nascimento" type="date" value={editingUser.dataNascimento} onChange={(v) => setEditingUser({...editingUser, dataNascimento: v})} />
                    <Input label="E-mail" type="email" value={editingUser.email} onChange={(v) => setEditingUser({...editingUser, email: v})} />
                    <Input label="WhatsApp / Telefone" value={editingUser.telefone} onChange={(v) => setEditingUser({...editingUser, telefone: v})} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>CEP</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="text" 
                          className="search-input glass-panel" 
                          style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%' }} 
                          value={editingUser.cep || ''} 
                          onChange={(e) => setEditingUser({...editingUser, cep: e.target.value})}
                          onBlur={(e) => handleCepLookup(e.target.value)}
                        />
                        {isSearchingCep && <Loader2 size={18} className="spin" style={{ position: 'absolute', right: 10, top: 12, color: 'var(--neon-cyan)' }} />}
                      </div>
                    </div>

                    <Input label="Cidade" value={editingUser.cidade} onChange={(v) => setEditingUser({...editingUser, cidade: v})} />
                    <Input label="Estado" value={editingUser.estado} onChange={(v) => setEditingUser({...editingUser, estado: v})} />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Input label="Endereço Completo" value={editingUser.endereco} onChange={(v) => setEditingUser({...editingUser, endereco: v})} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <Input label="Cidade/Estado de Origem" value={editingUser.spiritual?.cidadeEstadoOrigem} onChange={(v) => updateSpiritual('cidadeEstadoOrigem', v)} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'umbanda' && (
                <motion.div key="umbanda" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: '#00f0ff' }}>Tradição de Umbanda</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Umbanda de Origem</label>
                      <select 
                        className="search-input glass-panel" 
                        style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%', color: 'var(--text-main)', background: 'var(--glass-bg)' }}
                        value={editingUser.spiritual?.umbandaOrigem || ''}
                        onChange={(e) => updateSpiritual('umbandaOrigem', e.target.value)}
                      >
                        <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Selecione...</option>
                        <option value="Umbanda" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Umbanda</option>
                        <option value="Umbanda Almas e Angola" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Umbanda Almas e Angola</option>
                        <option value="Omoloco" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Omoloco</option>
                        <option value="Umbanda Sagrada" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Umbanda Sagrada</option>
                        <option value="Jurema" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Jurema</option>
                        <option value="Outra (especifique nas observações)" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Outra</option>
                      </select>
                    </div>
                    <Input label="Obrigação de Cabeça" value={editingUser.spiritual?.umbandaObrigaCabeca} onChange={(v) => updateSpiritual('umbandaObrigaCabeca', v)} />
                    <Input label="Obrigação de Corpo" value={editingUser.spiritual?.umbandaObrigaCorpo} onChange={(v) => updateSpiritual('umbandaObrigaCorpo', v)} />
                    
                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                      <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase' }}>Obrigações Anteriores</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <Input label="Mata" value={editingUser.spiritual?.umbandaAnteriorMata} onChange={(v) => updateSpiritual('umbandaAnteriorMata', v)} />
                        <Input label="Mar" value={editingUser.spiritual?.umbandaAnteriorMar} onChange={(v) => updateSpiritual('umbandaAnteriorMar', v)} />
                        <Input label="Entidades" value={editingUser.spiritual?.umbandaAnteriorEntidades} onChange={(v) => updateSpiritual('umbandaAnteriorEntidades', v)} />
                        <Input label="Caboclo" value={editingUser.spiritual?.umbandaAnteriorCaboclo} onChange={(v) => updateSpiritual('umbandaAnteriorCaboclo', v)} />
                        <Input label="Preto Velho" value={editingUser.spiritual?.umbandaAnteriorPretoVelho} onChange={(v) => updateSpiritual('umbandaAnteriorPretoVelho', v)} />
                      </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Observações</label>
                      <textarea className="search-input glass-panel" rows={3} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }} value={editingUser.spiritual?.umbandaObs} onChange={(e) => updateSpiritual('umbandaObs', e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'quimbanda' && (
                <motion.div key="quimbanda" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: '#ff4c4c' }}>Tradição de Quimbanda</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Quimbanda de Origem</label>
                      <select 
                        className="search-input glass-panel" 
                        style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%', color: 'var(--text-main)', background: 'var(--glass-bg)' }}
                        value={editingUser.spiritual?.quimbandaOrigem || ''}
                        onChange={(e) => updateSpiritual('quimbandaOrigem', e.target.value)}
                      >
                        <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Selecione...</option>
                        <option value="Ganga Nagô (Kaballah)" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Ganga Nagô (Kaballah)</option>
                        <option value="Congo" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Congo</option>
                        <option value="Luciferiana" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Luciferiana</option>
                        <option value="Malei" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Malei</option>
                        <option value="Outra (especifique nas observações)" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Outra</option>
                      </select>
                    </div>
                    <Input label="Obrigação de Frente" value={editingUser.spiritual?.quimbandaObrigaFrente} onChange={(v) => updateSpiritual('quimbandaObrigaFrente', v)} />
                    <Input label="Companheiro(a)" value={editingUser.spiritual?.quimbandaObrigaCompanheiro} onChange={(v) => updateSpiritual('quimbandaObrigaCompanheiro', v)} />
                    <Input label="Cruzamentos" value={editingUser.spiritual?.quimbandaCruzamentos} onChange={(v) => updateSpiritual('quimbandaCruzamentos', v)} />
                    <Input label="Assentamentos" value={editingUser.spiritual?.quimbandaAssentamentos} onChange={(v) => updateSpiritual('quimbandaAssentamentos', v)} />
                    <Input label="Kaballah ou Aprontamento" value={editingUser.spiritual?.quimbandaKaballah} onChange={(v) => updateSpiritual('quimbandaKaballah', v)} />
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Observações</label>
                      <textarea className="search-input glass-panel" rows={3} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }} value={editingUser.spiritual?.quimbandaObs} onChange={(e) => updateSpiritual('quimbandaObs', e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'nacao' && (
                <motion.div key="nacao" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--accent-gold)' }}>Tradição de Nação (Orixás)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Nação de Origem</label>
                      <select 
                        className="search-input glass-panel" 
                        style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%', color: 'var(--text-main)', background: 'var(--glass-bg)' }}
                        value={editingUser.spiritual?.nacaoOrigem || ''}
                        onChange={(e) => updateSpiritual('nacaoOrigem', e.target.value)}
                      >
                        <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Selecione...</option>
                        <option value="Candomblé" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Candomblé</option>
                        <option value="Oyó e Jeje" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Oyó e Jeje</option>
                        <option value="Cabinda" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Cabinda</option>
                        <option value="Jeje e Ijexá" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Jeje e Ijexá</option>
                        <option value="Oyó" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Oyó</option>
                        <option value="Jeje" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Jeje</option>
                        <option value="Nagô" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Nagô</option>
                        <option value="Outra (especifique nas observações)" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Outra</option>
                      </select>
                    </div>
                    <Input label="Obrigação de Cabeça" value={editingUser.spiritual?.nacaoObrigaCabeca} onChange={(v) => updateSpiritual('nacaoObrigaCabeca', v)} />
                    <Input label="Obrigação de Corpo" value={editingUser.spiritual?.nacaoObrigaCorpo} onChange={(v) => updateSpiritual('nacaoObrigaCorpo', v)} />
                    <Input label="Obrigação de Pés" value={editingUser.spiritual?.nacaoObrigaPes} onChange={(v) => updateSpiritual('nacaoObrigaPes', v)} />
                    <Input label="Passagem" value={editingUser.spiritual?.nacaoPassagem} onChange={(v) => updateSpiritual('nacaoPassagem', v)} />
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Observações</label>
                      <textarea className="search-input glass-panel" rows={3} style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }} value={editingUser.spiritual?.nacaoObs} onChange={(e) => updateSpiritual('nacaoObs', e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'obrigacoes' && (
                <motion.div key="obrigacoes" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-purple)' }}>Cronograma de Obrigações</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[0, 1, 2].map(idx => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 200px) 1fr', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
                        <Input label={`Data ${idx + 1}`} type="date" value={editingUser.spiritual?.obrigacoes[idx]?.data} onChange={(v) => updateObrigacao(idx, 'data', v)} />
                        <Input label={`Obrigação ${idx + 1}`} value={editingUser.spiritual?.obrigacoes[idx]?.descricao} onChange={(v) => updateObrigacao(idx, 'descricao', v)} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {activeTab !== 'pessoal' && <button type="button" onClick={() => {
                  const tabs: any[] = ['pessoal', 'umbanda', 'quimbanda', 'nacao', 'obrigacoes'];
                  setActiveTab(tabs[tabs.indexOf(activeTab) - 1]);
                }} style={{ background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', padding: '0.8rem 1.5rem', borderRadius: 8, cursor: 'pointer' }}>Anterior</button>}
                
                {activeTab !== 'obrigacoes' && <button type="button" onClick={() => {
                  const tabs: any[] = ['pessoal', 'umbanda', 'quimbanda', 'nacao', 'obrigacoes'];
                  setActiveTab(tabs[tabs.indexOf(activeTab) + 1]);
                }} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--neon-cyan)', padding: '0.8rem 1.5rem', borderRadius: 8, cursor: 'pointer' }}>Próximo</button>}
              </div>

              <button type="submit" className="glass-panel glow-fx" style={{ padding: '0.8rem 2.5rem', background: 'linear-gradient(90deg, #00f0ff, #9D4EDD)', color: '#000', fontSize: '1rem', fontWeight: 900, border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}>
                SALVAR FICHA
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={async () => {
          try {
            await deleteUser(deleteModal.userId);
          } catch (err) {
            alert("Erro ao excluir membro. Verifique se existem vínculos ativos ou se você tem permissão.");
          }
        }}
        title="Excluir Membro"
        message={`Deseja realmente excluir o membro "${deleteModal.userName}"? Esta ação removerá todos os dados vinculados a este usuário e não poderá ser desfeita.`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
      />
    </motion.div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      style={{ 
        padding: '0.7rem 1.2rem', borderRadius: '10px 10px 0 0', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.3s',
        background: active ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)',
        color: active ? '#000' : 'var(--text-muted)',
        boxShadow: active ? '0 -4px 15px rgba(0, 240, 255, 0.2)' : 'none'
      }}
    >
      {label}
    </button>
  );
}

function StatusChip({ active, onClick, label, color }: { active: boolean, onClick: () => void, label: string, color: string }) {
  return (
    <button type="button" onClick={onClick} style={{ 
      padding: '0.5rem 1.2rem', borderRadius: '20px', border: `1px solid ${active ? color : 'var(--glass-border)'}`, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s',
      background: active ? `${color}20` : 'transparent',
      color: active ? color : 'var(--text-muted)'
    }}>
      {label}
    </button>
  );
}

function SegmentCheck({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button type="button" onClick={onClick} style={{ 
      padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${active ? '#9D4EDD' : 'var(--glass-border)'}`, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s',
      background: active ? 'rgba(157, 78, 221, 0.15)' : 'transparent',
      color: active ? '#b388ff' : 'var(--text-muted)'
    }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ width: 8, height: 8, background: 'currentColor', borderRadius: 1 }} />}
      </div>
      {label}
    </button>
  );
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
      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label} {required && <span style={{ color: '#ff4c4c' }}>*</span>}</label>
      <input 
        type={type} 
        required={required}
        readOnly={readOnly}
        className="search-input glass-panel" 
        style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: readOnly ? 'var(--text-muted)' : 'var(--text-main)', opacity: readOnly ? 0.7 : 1, fontFamily: 'inherit', width: '100%' }} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
      />
    </div>
  );
}
