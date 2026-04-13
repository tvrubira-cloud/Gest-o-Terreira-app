import { useState, useEffect, useRef } from 'react';
import { useStore, defaultSpiritualData } from '../store/useStore';
import type { User, SpiritualData } from '../store/useStore';
import { Users, Search, Edit2, Plus, ArrowLeft, Upload, User as UserIcon, Trash2, Loader2, UserCheck, UserX, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadImage } from '../utils/uploadImage';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Members() {
  const { currentUser, addUser, updateUser, deleteUser, getFilteredUsers, getCurrentTerreiro, terreiros } = useStore();
  const role = currentUser?.role?.toUpperCase();
  const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
  const isAdmin = role === 'ADMIN' || isMaster;
  const isStaff = isAdmin || role === 'FINANCEIRO' || role === 'SECRETARIA';
  const users = getFilteredUsers();
  const currentTerreiro = getCurrentTerreiro();

  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [activeTab, setActiveTab] = useState<'pessoal' | 'umbanda' | 'quimbanda' | 'nacao' | 'obrigacoes' | 'financeiro'>('pessoal');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSegPanel, setBulkSegPanel] = useState(false);
  const [bulkSegTipo, setBulkSegTipo] = useState<'umbanda' | 'quimbanda' | 'nacao' | ''>('');
  const [bulkSegOrigem, setBulkSegOrigem] = useState('');
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Membro pode editar o próprio cadastro livremente; staff edita qualquer um
  const isOwnProfile = editingUser?.id === currentUser?.id;
  const canEdit = isStaff || isOwnProfile;

  // filteredUsers precisa estar antes dos helpers de seleção
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    if (term && !u.nomeCompleto.toLowerCase().includes(term) && !(u.nomeDeSanto?.toLowerCase().includes(term))) return false;
    if (activeFilters.size === 0) return true;
    const statusFilters = ['ativo', 'inativo'].filter(f => activeFilters.has(f));
    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(u.spiritual?.situacaoCadastro ?? 'ativo');
    const tradFilters = ['umbanda', 'kimbanda', 'nacao'].filter(f => activeFilters.has(f));
    const matchesTrad = tradFilters.length === 0 || (
      (tradFilters.includes('umbanda')  && u.spiritual?.segmentoUmbanda) ||
      (tradFilters.includes('kimbanda') && u.spiritual?.segmentoKimbanda) ||
      (tradFilters.includes('nacao')    && u.spiritual?.segmentoNacao)
    );
    return matchesStatus && matchesTrad;
  });

  // ── Seleção em massa ──────────────────────────────────────
  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allVisibleSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u.id));
  const toggleSelectAll = () =>
    setSelectedIds(allVisibleSelected ? new Set() : new Set(filteredUsers.map(u => u.id)));

  const clearSelection = () => { setSelectedIds(new Set()); setBulkSegPanel(false); setBulkSegTipo(''); setBulkSegOrigem(''); setBulkDeleteConfirm(false); };

  const handleBulkStatus = async (status: 'ativo' | 'inativo') => {
    const targets = users.filter(u => selectedIds.has(u.id));
    await Promise.all(targets.map(u => updateUser(u.id, { ...u, spiritual: { ...u.spiritual!, situacaoCadastro: status } })));
    clearSelection();
  };

  const handleBulkSegmento = async () => {
    if (!bulkSegTipo) return;
    const fieldMap = { umbanda: 'segmentoUmbanda', quimbanda: 'segmentoKimbanda', nacao: 'segmentoNacao' } as const;
    const origemMap = { umbanda: 'umbandaOrigem', quimbanda: 'quimbandaOrigem', nacao: 'nacaoOrigem' } as const;
    const segField = fieldMap[bulkSegTipo];
    const origemField = origemMap[bulkSegTipo];
    const targets = users.filter(u => selectedIds.has(u.id));
    await Promise.all(targets.map(u => {
      const spiritual: any = { ...u.spiritual!, [segField]: true };
      if (bulkSegOrigem) spiritual[origemField] = bulkSegOrigem;
      return updateUser(u.id, { ...u, spiritual });
    }));
    clearSelection();
  };

  const handleBulkDelete = async () => {
    const targets = users.filter(u => selectedIds.has(u.id) && u.id !== currentUser?.id && !u.isMaster);
    await Promise.all(targets.map(u => deleteUser(u.id)));
    clearSelection();
  };

  const getAvailableTabs = () => {
    const tabs: { id: 'pessoal' | 'umbanda' | 'quimbanda' | 'nacao' | 'obrigacoes' | 'financeiro'; label: string }[] = [
      { id: 'pessoal', label: 'Dados Pessoais' }
    ];

    // Staff vê abas espirituais de qualquer membro; membro comum vê somente as próprias
    const canSeeSpiritualTabs = isStaff || (editingUser?.id === currentUser?.id);
    if (canSeeSpiritualTabs) {
      if (editingUser?.spiritual?.segmentoUmbanda) tabs.push({ id: 'umbanda', label: 'Umbanda' });
      if (editingUser?.spiritual?.segmentoKimbanda) tabs.push({ id: 'quimbanda', label: 'Quimbanda' });
      if (editingUser?.spiritual?.segmentoNacao) tabs.push({ id: 'nacao', label: 'Nação de Orixás' });
      tabs.push({ id: 'obrigacoes', label: 'Calendário de Obrigações' });
    }

    // Apenas Admin e Financeiro veem a aba financeira do membro
    if (isAdmin || role === 'FINANCEIRO') {
      tabs.push({ id: 'financeiro', label: 'Financeiro' });
    }

    return tabs;
  };

  useEffect(() => {
    if (!isStaff && view === 'LIST' && currentUser) {
      setEditingUser(currentUser);
      setView('FORM');
    }
  }, [isStaff, view, currentUser]);

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
    if (!editingUser || isSaving) return;

    setIsSaving(true);
    try {
      if (editingUser.id) {
        await updateUser(editingUser.id, editingUser);
      } else {
        await addUser(editingUser as Omit<User, 'id' | 'createdAt' | 'terreiroId'>);
      }

      alert("Dados salvos com sucesso!");

      if (isAdmin) {
        setView('LIST');
      }
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      alert(`Erro ao salvar os dados: ${err.message || 'Verifique sua conexão e tente novamente.'}`);
    } finally {
      setIsSaving(false);
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

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };


  const updateSpiritual = (field: keyof SpiritualData, value: any) => {
    if (!editingUser) return;
    
    // Auto-correction for tabs: if a segment is unchecked, move to personal data if we are in that tab
    if (field === 'segmentoUmbanda' && !value && activeTab === 'umbanda') setActiveTab('pessoal');
    if (field === 'segmentoKimbanda' && !value && activeTab === 'quimbanda') setActiveTab('pessoal');
    if (field === 'segmentoNacao' && !value && activeTab === 'nacao') setActiveTab('pessoal');

    setEditingUser(prev => prev ? ({
      ...prev,
      spiritual: {
        ...(prev.spiritual as SpiritualData),
        [field]: value
      }
    }) : null);
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
            <Users size={28} /> {isStaff ? 'Membros da Casa' : 'Meu Perfil Espiritual'}
          </h2>
          {isStaff && currentTerreiro && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {currentTerreiro.name} — {users.length} membro{users.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {isStaff && view === 'LIST' && (
          <button 
            onClick={handleOpenNew}
            className="glass-panel glow-fx"
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}
          >
            <Plus size={18} /> Cadastrar Membro
          </button>
        )}
        {isStaff && view === 'FORM' && (
          <button 
            onClick={() => setView('LIST')}
            className="glass-panel glow-fx"
            style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} /> Voltar para Lista
          </button>
        )}
      </div>

      {view === 'LIST' && isStaff && (
        <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
          {/* Barra de busca */}
          <div className="search-bar" style={{ width: '100%' }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nome civil ou de santo..."
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Chips de filtro */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Filtrar:</span>

            {([
              { key: 'ativo',    label: 'Ativo',     color: '#00ff80' },
              { key: 'inativo',  label: 'Inativo',   color: '#ff4c4c' },
              { key: 'umbanda',  label: 'Umbanda',   color: '#00f0ff' },
              { key: 'kimbanda', label: 'Quimbanda', color: '#9D4EDD' },
              { key: 'nacao',    label: 'Nação',     color: '#ffd700' },
            ] as const).map(({ key, label, color }) => {
              const on = activeFilters.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  style={{
                    padding: '0.3rem 0.9rem',
                    borderRadius: 20,
                    fontSize: '0.78rem',
                    fontWeight: on ? 700 : 400,
                    cursor: 'pointer',
                    border: `1.5px solid ${on ? color : 'rgba(255,255,255,0.12)'}`,
                    background: on ? `${color}22` : 'transparent',
                    color: on ? color : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              );
            })}

            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: '0.2rem 0.4rem' }}
              >
                Limpar filtros
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {filteredUsers.length} de {users.length} membros
            </span>
          </div>
          
          {/* ── Barra de ações em massa ── */}
          {selectedIds.size > 0 && (
            <div style={{ marginBottom: '0.8rem', padding: '0.8rem 1.2rem', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 10, display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 700, fontSize: '0.85rem', alignSelf: 'center' }}>
                {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
              </span>

              {/* Ativar */}
              <button onClick={() => handleBulkStatus('ativo')} style={{ padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(0,255,128,0.1)', border: '1px solid rgba(0,255,128,0.3)', color: '#00ff80' }}>
                ✓ Ativar
              </button>

              {/* Inativar */}
              <button onClick={() => handleBulkStatus('inativo')} style={{ padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,76,76,0.1)', border: '1px solid rgba(255,76,76,0.3)', color: '#ff4c4c' }}>
                ✗ Inativar
              </button>

              {/* Segmento */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => { setBulkSegPanel(p => !p); setBulkSegTipo(''); setBulkSegOrigem(''); }}
                  style={{ padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: bulkSegPanel ? 'rgba(157,78,221,0.25)' : 'rgba(157,78,221,0.1)', border: '1px solid rgba(157,78,221,0.4)', color: '#b388ff' }}
                >
                  ⬡ Segmento{bulkSegPanel ? ' ▲' : ' ▼'}
                </button>

                {bulkSegPanel && (
                  <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(157,78,221,0.3)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: '0.8rem', minWidth: 280 }}>
                    {/* Tipo de segmento */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {([
                        { v: 'umbanda',   label: 'Umbanda',   color: '#00f0ff' },
                        { v: 'quimbanda', label: 'Quimbanda', color: '#9D4EDD' },
                        { v: 'nacao',     label: 'Nação',     color: '#ffd700' },
                      ] as const).map(({ v, label, color }) => (
                        <button key={v} onClick={() => { setBulkSegTipo(v); setBulkSegOrigem(''); }}
                          style={{ padding: '0.35rem 0.8rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${bulkSegTipo === v ? color : 'var(--glass-border)'}`, background: bulkSegTipo === v ? `${color}22` : 'transparent', color: bulkSegTipo === v ? color : 'var(--text-muted)', transition: 'all 0.2s' }}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Origem do segmento */}
                    {bulkSegTipo && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Tradição de origem (opcional)</label>
                        <select
                          value={bulkSegOrigem}
                          onChange={e => setBulkSegOrigem(e.target.value)}
                          className="search-input glass-panel"
                          style={{ padding: '0.5rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', background: 'var(--glass-bg)', fontSize: '0.82rem' }}
                        >
                          <option value="">— Não especificar —</option>
                          {bulkSegTipo === 'umbanda' && ['Umbanda', 'Umbanda Almas e Angola', 'Omoloco', 'Umbanda Sagrada', 'Jurema'].map(o => <option key={o} value={o}>{o}</option>)}
                          {bulkSegTipo === 'quimbanda' && ['Ganga Nagô (Kaballah)', 'Congo', 'Luciferiana', 'Malei'].map(o => <option key={o} value={o}>{o}</option>)}
                          {bulkSegTipo === 'nacao' && ['Candomblé', 'Oyó e Jeje', 'Cabinda', 'Jeje e Ijexá', 'Oyó', 'Jeje', 'Nagô'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    )}

                    <button
                      onClick={handleBulkSegmento}
                      disabled={!bulkSegTipo}
                      style={{ padding: '0.5rem 1.2rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: bulkSegTipo ? 'pointer' : 'not-allowed', background: bulkSegTipo ? 'linear-gradient(90deg,#00f0ff,#9D4EDD)' : 'rgba(255,255,255,0.05)', color: bulkSegTipo ? '#000' : 'var(--text-muted)', border: 'none' }}
                    >
                      Aplicar segmento aos selecionados
                    </button>
                  </div>
                )}
              </div>

              {/* Excluir em massa */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!bulkDeleteConfirm ? (
                  <button onClick={() => setBulkDeleteConfirm(true)} style={{ padding: '0.4rem 1rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,76,76,0.1)', border: '1px solid rgba(255,76,76,0.3)', color: '#ff4c4c' }}>
                    🗑 Excluir selecionados
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#ff4c4c' }}>Confirmar exclusão?</span>
                    <button onClick={handleBulkDelete} style={{ padding: '0.35rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,76,76,0.2)', border: '1px solid #ff4c4c', color: '#ff4c4c' }}>Sim</button>
                    <button onClick={() => setBulkDeleteConfirm(false)} style={{ padding: '0.35rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>Não</button>
                  </div>
                )}
              </div>

              {/* Cancelar seleção */}
              <button onClick={clearSelection} style={{ marginLeft: 'auto', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', cursor: 'pointer', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', alignSelf: 'flex-start' }}>
                × Cancelar
              </button>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1.2rem', width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      title="Marcar todos"
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                    />
                  </th>
                  <th style={{ padding: '1.2rem' }}>Foto</th>
                  <th style={{ padding: '1.2rem' }}>CPF / Login</th>
                  <th style={{ padding: '1.2rem' }}>Nome Completo</th>
                  <th style={{ padding: '1.2rem' }}>Nome de Santo</th>
                  <th style={{ padding: '1.2rem' }}>Cargo</th>
                  {isMaster && <th style={{ padding: '1.2rem' }}>Terreiro</th>}
                  <th style={{ padding: '1.2rem' }}>Seguimento</th>
                  <th style={{ padding: '1.2rem' }}>Status</th>
                  <th style={{ padding: '1.2rem' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', background: selectedIds.has(u.id) ? 'rgba(0,240,255,0.04)' : undefined }} className="hover-row">
                    <td style={{ padding: '1rem', width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                      />
                    </td>
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
                        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 6,
                        background: u.isMaster || u.isPanelAdmin ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                        color: u.isMaster || u.isPanelAdmin ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        border: u.isMaster || u.isPanelAdmin ? '1px solid var(--neon-cyan)' : '1px solid var(--glass-border)'
                      }}>
                        {u.isMaster || u.isPanelAdmin ? 'MASTER' : (u.role === 'ADMIN' ? 'ADM' : (u.role === 'FINANCEIRO' ? 'FINAN' : (u.role === 'SECRETARIA' ? 'SEC' : 'MBR')))}
                      </span>
                    </td>
                    {isMaster && (
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        {terreiros.find(t => t.id === u.terreiroId)?.name || 'N/A'}
                      </td>
                    )}
                    {/* Seguimento — badges clicáveis */}
                    <td style={{ padding: '1rem' }}>
                      {isStaff ? (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {([
                            { field: 'segmentoUmbanda'  as const, label: 'U', title: 'Umbanda',   color: '#00f0ff' },
                            { field: 'segmentoKimbanda' as const, label: 'Q', title: 'Quimbanda', color: '#9D4EDD' },
                            { field: 'segmentoNacao'    as const, label: 'N', title: 'Nação',     color: '#ffd700' },
                          ]).map(({ field, label, title, color }) => {
                            const on = !!u.spiritual?.[field];
                            return (
                              <button
                                key={field}
                                title={`${on ? 'Remover' : 'Adicionar'} ${title}`}
                                onClick={async () => {
                                  await updateUser(u.id, {
                                    ...u,
                                    spiritual: { ...u.spiritual!, [field]: !on }
                                  });
                                }}
                                style={{
                                  width: 26, height: 26, borderRadius: 6,
                                  border: `1.5px solid ${on ? color : 'var(--glass-border)'}`,
                                  background: on ? `${color}22` : 'transparent',
                                  color: on ? color : 'var(--text-muted)',
                                  fontSize: '0.7rem', fontWeight: 800,
                                  cursor: 'pointer', transition: 'all 0.2s',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                    </td>

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
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        {/* Editar */}
                        <button
                          onClick={() => { setEditingUser({ ...u, spiritual: { ...defaultSpiritualData, ...(u.spiritual || {}) } }); setView('FORM'); setActiveTab('pessoal'); }}
                          className="icon-btn glow-fx"
                          style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '6px', borderRadius: '8px' }}
                          title="Editar"
                        >
                          <Edit2 size={16} color="var(--neon-cyan)" />
                        </button>

                        {/* Toggle ativo / inativo */}
                        {isStaff && u.id !== currentUser?.id && !u.isMaster && (() => {
                          const isAtivo = (u.spiritual?.situacaoCadastro ?? 'ativo') === 'ativo';
                          return (
                            <button
                              onClick={async () => {
                                const novoStatus = isAtivo ? 'inativo' : 'ativo';
                                await updateUser(u.id, {
                                  ...u,
                                  spiritual: { ...u.spiritual!, situacaoCadastro: novoStatus }
                                });
                              }}
                              className="icon-btn"
                              title={isAtivo ? 'Desativar membro' : 'Ativar membro'}
                              style={{
                                background: isAtivo ? 'rgba(0,255,128,0.08)' : 'rgba(255,76,76,0.08)',
                                border: `1px solid ${isAtivo ? 'rgba(0,255,128,0.25)' : 'rgba(255,76,76,0.25)'}`,
                                padding: '6px', borderRadius: '8px',
                                color: isAtivo ? '#00ff80' : '#ff4c4c',
                              }}
                            >
                              {isAtivo ? <UserCheck size={16} /> : <UserX size={16} />}
                            </button>
                          );
                        })()}

                        {/* Excluir */}
                        {isStaff && u.id !== currentUser?.id && !u.isMaster && (
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
            {getAvailableTabs().map(tab => (
              <TabButton 
                key={tab.id}
                active={activeTab === tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                label={tab.label} 
              />
            ))}
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
                        <label className="glass-panel glow-fx" style={{ padding: '0.6rem 1.2rem', cursor: isUploadingPhoto ? 'wait' : 'pointer', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', color: '#fff', borderRadius: 8, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isUploadingPhoto ? 0.7 : 1 }}>
                          <Upload size={16} /> {isUploadingPhoto ? 'Enviando...' : 'Carregar Foto'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsUploadingPhoto(true);
                            try {
                              const path = `fotos/${editingUser.id || `new_${Date.now()}`}.jpg`;
                              const url = await uploadImage(file, path);
                              setEditingUser({ ...editingUser, photoUrl: url });
                            } catch (err: any) {
                              alert(`Erro ao enviar foto: ${err.message}`);
                            } finally {
                              setIsUploadingPhoto(false);
                            }
                          }} />
                        </label>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Membro desde: {editingUser.createdAt ? new Date(editingUser.createdAt).toLocaleDateString() : 'Novo'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Situação do Cadastro</label>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <StatusChip active={editingUser.spiritual?.situacaoCadastro === 'ativo'} onClick={() => updateSpiritual('situacaoCadastro', 'ativo')} label="Ativo" color="#00ff80" disabled={!isStaff} />
                        <StatusChip active={editingUser.spiritual?.situacaoCadastro === 'inativo'} onClick={() => updateSpiritual('situacaoCadastro', 'inativo')} label="Inativo" color="#ff4c4c" disabled={!isStaff} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargo / Permissão</label>
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <StatusChip active={editingUser.role === 'ADMIN'} onClick={() => setEditingUser(prev => prev ? ({...prev, role: 'ADMIN'}) : null)} label="Administrador" color="var(--neon-cyan)" disabled={!isAdmin} />
                        <StatusChip active={editingUser.role === 'FINANCEIRO'} onClick={() => setEditingUser(prev => prev ? ({...prev, role: 'FINANCEIRO'}) : null)} label="Financeiro" color="var(--accent-gold)" disabled={!isAdmin} />
                        <StatusChip active={editingUser.role === 'SECRETARIA'} onClick={() => setEditingUser(prev => prev ? ({...prev, role: 'SECRETARIA'}) : null)} label="Secretaria" color="var(--neon-purple)" disabled={!isAdmin} />
                        <StatusChip active={editingUser.role === 'USER'} onClick={() => setEditingUser(prev => prev ? ({...prev, role: 'USER'}) : null)} label="Membro" color="var(--text-muted)" disabled={!isAdmin} />
                      </div>
                    </div>

                    {currentUser?.isMaster && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Acesso Master</label>
                        <SegmentCheck 
                          active={!!editingUser.isPanelAdmin} 
                          onClick={() => setEditingUser(prev => prev ? ({...prev, isPanelAdmin: !prev.isPanelAdmin}) : null)} 
                          label="Administrador do Painel Master" 
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Segmentos</label>
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <SegmentCheck active={!!editingUser.spiritual?.segmentoUmbanda} onClick={() => updateSpiritual('segmentoUmbanda', !editingUser.spiritual?.segmentoUmbanda)} label="Umbanda" disabled={!canEdit} />
                        <SegmentCheck active={!!editingUser.spiritual?.segmentoKimbanda} onClick={() => updateSpiritual('segmentoKimbanda', !editingUser.spiritual?.segmentoKimbanda)} label="Quimbanda" disabled={!canEdit} />
                        <SegmentCheck active={!!editingUser.spiritual?.segmentoNacao} onClick={() => updateSpiritual('segmentoNacao', !editingUser.spiritual?.segmentoNacao)} label="Nação" disabled={!canEdit} />
                      </div>
                    </div>

                    <Input label="CPF (Login)" value={editingUser.cpf} onChange={(v) => setEditingUser(prev => prev ? ({...prev, cpf: v}) : null)} required readOnly={!isStaff && !!editingUser.id} />
                    <Input label="Nome Completo" value={editingUser.nomeCompleto} onChange={(v) => setEditingUser(prev => prev ? ({...prev, nomeCompleto: v}) : null)} required />
                    <Input label="Data de Nascimento" type="date" value={editingUser.dataNascimento} onChange={(v) => setEditingUser(prev => prev ? ({...prev, dataNascimento: v}) : null)} />
                    <Input label="E-mail" type="email" value={editingUser.email} onChange={(v) => setEditingUser(prev => prev ? ({...prev, email: v}) : null)} />
                    <Input label="WhatsApp / Telefone" value={editingUser.telefone} onChange={(v) => setEditingUser(prev => prev ? ({...prev, telefone: v}) : null)} />
                    
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select 
                          className="search-input glass-panel" 
                          style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%', color: 'var(--text-main)', background: 'var(--glass-bg)' }}
                          value={['', 'Umbanda', 'Umbanda Almas e Angola', 'Omoloco', 'Umbanda Sagrada', 'Jurema'].includes(editingUser.spiritual?.umbandaOrigem || '') ? (editingUser.spiritual?.umbandaOrigem || '') : 'Outra'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Outra') {
                              updateSpiritual('umbandaOrigem', ' '); // Espaço para disparar o campo de texto
                            } else {
                              updateSpiritual('umbandaOrigem', val);
                            }
                          }}
                        >
                          <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Selecione...</option>
                          <option value="Umbanda" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Umbanda</option>
                          <option value="Umbanda Almas e Angola" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Umbanda Almas e Angola</option>
                          <option value="Omoloco" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Omoloco</option>
                          <option value="Umbanda Sagrada" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Umbanda Sagrada</option>
                          <option value="Jurema" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Jurema</option>
                          <option value="Outra" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Outra...</option>
                        </select>
                        
                        {(!['', 'Umbanda', 'Umbanda Almas e Angola', 'Omoloco', 'Umbanda Sagrada', 'Jurema'].includes(editingUser.spiritual?.umbandaOrigem || '')) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <Input 
                              label="Especifique sua Tradição de Umbanda" 
                              value={editingUser.spiritual?.umbandaOrigem?.trim()} 
                              onChange={(v) => updateSpiritual('umbandaOrigem', v)} 
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <Input label="Entidade de Cabeça / Pai / Mãe" value={editingUser.spiritual?.umbandaObrigaCabeca} onChange={(v) => updateSpiritual('umbandaObrigaCabeca', v)} />
                    <Input label="Entidade de Corpo / Pai / Mãe" value={editingUser.spiritual?.umbandaObrigaCorpo} onChange={(v) => updateSpiritual('umbandaObrigaCorpo', v)} />
                    
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select 
                          className="search-input glass-panel" 
                          style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%', color: 'var(--text-main)', background: 'var(--glass-bg)' }}
                          value={['', 'Ganga Nagô (Kaballah)', 'Congo', 'Luciferiana', 'Malei'].includes(editingUser.spiritual?.quimbandaOrigem || '') ? (editingUser.spiritual?.quimbandaOrigem || '') : 'Outra'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Outra') {
                              updateSpiritual('quimbandaOrigem', ' ');
                            } else {
                              updateSpiritual('quimbandaOrigem', val);
                            }
                          }}
                        >
                          <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Selecione...</option>
                          <option value="Ganga Nagô (Kaballah)" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Ganga Nagô (Kaballah)</option>
                          <option value="Congo" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Congo</option>
                          <option value="Luciferiana" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Luciferiana</option>
                          <option value="Malei" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Malei</option>
                          <option value="Outra" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Outra...</option>
                        </select>

                        {(!['', 'Ganga Nagô (Kaballah)', 'Congo', 'Luciferiana', 'Malei'].includes(editingUser.spiritual?.quimbandaOrigem || '')) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <Input 
                              label="Especifique sua Tradição de Quimbanda" 
                              value={editingUser.spiritual?.quimbandaOrigem?.trim()} 
                              onChange={(v) => updateSpiritual('quimbandaOrigem', v)} 
                            />
                          </motion.div>
                        )}
                      </div>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select 
                          className="search-input glass-panel" 
                          style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%', color: 'var(--text-main)', background: 'var(--glass-bg)' }}
                          value={['', 'Candomblé', 'Oyó e Jeje', 'Cabinda', 'Jeje e Ijexá', 'Oyó', 'Jeje', 'Nagô'].includes(editingUser.spiritual?.nacaoOrigem || '') ? (editingUser.spiritual?.nacaoOrigem || '') : 'Outra'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Outra') {
                              updateSpiritual('nacaoOrigem', ' ');
                            } else {
                              updateSpiritual('nacaoOrigem', val);
                            }
                          }}
                        >
                          <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Selecione...</option>
                          <option value="Candomblé" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Candomblé</option>
                          <option value="Oyó e Jeje" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Oyó e Jeje</option>
                          <option value="Cabinda" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Cabinda</option>
                          <option value="Jeje e Ijexá" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Jeje e Ijexá</option>
                          <option value="Oyó" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Oyó</option>
                          <option value="Jeje" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Jeje</option>
                          <option value="Nagô" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Nagô</option>
                          <option value="Outra" style={{ background: 'var(--bg-primary)', color: 'var(--text-main)' }}>Outra...</option>
                        </select>

                        {(!['', 'Candomblé', 'Oyó e Jeje', 'Cabinda', 'Jeje e Ijexá', 'Oyó', 'Jeje', 'Nagô'].includes(editingUser.spiritual?.nacaoOrigem || '')) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                            <Input 
                              label="Especifique sua Tradição de Nação" 
                              value={editingUser.spiritual?.nacaoOrigem?.trim()} 
                              onChange={(v) => updateSpiritual('nacaoOrigem', v)} 
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <Input label="Entidade de Cabeça / Pai / Mãe" value={editingUser.spiritual?.nacaoObrigaCabeca} onChange={(v) => updateSpiritual('nacaoObrigaCabeca', v)} />
                    <Input label="Entidade de Corpo / Pai / Mãe" value={editingUser.spiritual?.nacaoObrigaCorpo} onChange={(v) => updateSpiritual('nacaoObrigaCorpo', v)} />
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

              {activeTab === 'financeiro' && (isAdmin || role === 'FINANCEIRO') && (
                <motion.div key="financeiro" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: '#00ff88' }}>Controle Financeiro Individual</h3>

                  {/* ── Isenção Financeira ── */}
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem' }}>
                    Isenção de Pagamento
                  </h4>
                  {editingUser.spiritual ? (
                    <IsencaoPanel
                      spiritual={editingUser.spiritual}
                      membroNome={editingUser.nomeCompleto || ''}
                      concedidoPor={currentUser?.nomeCompleto || currentUser?.cpf || ''}
                      onChange={(updatedSpiritual) => setEditingUser(prev => prev ? { ...prev, spiritual: updatedSpiritual } : null)}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Carregando dados espirituais...</p>
                  )}

                  <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid rgba(0, 255, 136, 0.2)', marginTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Histórico de pagamentos e pendências vinculado ao Financeiro Global.</p>
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Módulo de histórico detalhado em desenvolvimento.</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {activeTab !== 'pessoal' && <button type="button" onClick={() => {
                  const tabs = getAvailableTabs();
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1].id);
                }} style={{ background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', padding: '0.8rem 1.5rem', borderRadius: 8, cursor: 'pointer' }}>Anterior</button>}
                
                {activeTab !== 'obrigacoes' && <button type="button" onClick={() => {
                  const tabs = getAvailableTabs();
                  const currentIndex = tabs.findIndex(t => t.id === activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1].id);
                }} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--neon-cyan)', padding: '0.8rem 1.5rem', borderRadius: 8, cursor: 'pointer' }}>Próximo</button>}
              </div>

              <button
                type="submit"
                disabled={isSaving || !canEdit}
                className="glass-panel glow-fx"
                style={{
                  padding: '0.8rem 2.5rem',
                  background: (isSaving || !canEdit) ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #00f0ff, #9D4EDD)',
                  color: (isSaving || !canEdit) ? 'var(--text-muted)' : '#000',
                  fontSize: '1rem',
                  fontWeight: 900,
                  border: 'none',
                  borderRadius: 10,
                  cursor: (isSaving || !canEdit) ? 'not-allowed' : 'pointer',
                  boxShadow: (isSaving || !canEdit) ? 'none' : '0 0 20px rgba(0, 240, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={18} className="spin" /> SALVANDO...
                  </>
                ) : (
                  'SALVAR FICHA'
                )}
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

function StatusChip({ active, onClick, label, color, disabled = false }: { active: boolean, onClick: () => void, label: string, color: string, disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ 
      padding: '0.5rem 1.2rem', borderRadius: '20px', border: `1px solid ${active ? color : 'var(--glass-border)'}`, cursor: disabled ? 'default' : 'pointer', fontSize: '0.85rem', transition: 'all 0.2s',
      background: active ? `${color}20` : 'transparent',
      color: active ? color : 'var(--text-muted)',
      opacity: disabled ? 0.6 : 1
    }}>
      {label}
    </button>
  );
}

function SegmentCheck({ active, onClick, label, disabled = false }: { active: boolean, onClick: () => void, label: string, disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ 
      padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${active ? '#9D4EDD' : 'var(--glass-border)'}`, cursor: disabled ? 'default' : 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s',
      background: active ? 'rgba(157, 78, 221, 0.15)' : 'transparent',
      color: active ? '#b388ff' : 'var(--text-muted)',
      opacity: disabled ? 0.6 : 1
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

function DateInputField({ label, value, onChange, required = false, readOnly = false }: { label: string; value?: string | null; onChange: (v: string) => void; required?: boolean; readOnly?: boolean }) {
  const dateRef = useRef<HTMLInputElement>(null);
  const lastExternal = useRef(value);

  const toDisplay = (v: string) => {
    if (!v) return '';
    const parts = v.split('-');
    if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return '';
  };

  const [text, setText] = useState(() => toDisplay(value || ''));

  useEffect(() => {
    if (value !== lastExternal.current) {
      lastExternal.current = value;
      setText(toDisplay(value || ''));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
    let fmt = digits;
    if (digits.length > 4) fmt = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) fmt = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setText(fmt);
    if (digits.length === 8) {
      const storage = `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
      lastExternal.current = storage;
      onChange(storage);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    lastExternal.current = v;
    onChange(v);
    setText(toDisplay(v));
  };

  const openPicker = () => {
    if (dateRef.current) {
      try { dateRef.current.showPicker(); } catch { dateRef.current.click(); }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}{required && <span style={{ color: '#ff4c4c' }}> *</span>}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="DD/MM/AAAA"
          readOnly={readOnly}
          required={required}
          className="search-input glass-panel"
          style={{ padding: '0.8rem', paddingRight: '2.8rem', border: '1px solid var(--glass-border)', color: readOnly ? 'var(--text-muted)' : 'var(--text-main)', opacity: readOnly ? 0.7 : 1, fontFamily: 'inherit', width: '100%' }}
          value={text}
          onChange={handleChange}
        />
        {!readOnly && (
          <>
            <button type="button" onClick={openPicker}
              style={{ position: 'absolute', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
              <Calendar size={16} />
            </button>
            <input ref={dateRef} type="date"
              style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
              value={value || ''} onChange={handlePickerChange}
            />
          </>
        )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false, readOnly = false }: InputProps) {
  if (type === 'date') return <DateInputField label={label} value={value} onChange={onChange} required={required} readOnly={readOnly} />;
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

// ── Painel de Isenção Financeira ─────────────────────────────

interface IsencaoPanelProps {
  spiritual: SpiritualData;
  membroNome: string;
  concedidoPor: string;
  onChange: (s: SpiritualData) => void;
}

function IsencaoPanel({ spiritual, membroNome, concedidoPor, onChange }: IsencaoPanelProps) {
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState<'meses' | 'permanente'>(spiritual.isencaoTipo || 'meses');
  const [meses, setMeses] = useState<number>(spiritual.isencaoMeses || 1);
  const [motivo, setMotivo] = useState(spiritual.isencaoMotivo || '');

  const isenta = !!spiritual.isencaoAtiva;

  // Calcula se isenção por meses ainda é válida
  const isencaoVencida = (() => {
    if (!isenta || spiritual.isencaoTipo !== 'meses' || !spiritual.isencaoDataFim) return false;
    return new Date(spiritual.isencaoDataFim) < new Date();
  })();

  const conceder = () => {
    const dataInicio = new Date().toISOString().split('T')[0];
    const dataFim = tipo === 'meses'
      ? new Date(new Date().setMonth(new Date().getMonth() + meses)).toISOString().split('T')[0]
      : undefined;
    onChange({
      ...spiritual,
      isencaoAtiva: true,
      isencaoTipo: tipo,
      isencaoMeses: tipo === 'meses' ? meses : undefined,
      isencaoDataInicio: dataInicio,
      isencaoDataFim: dataFim,
      isencaoMotivo: motivo || undefined,
      isencaoConcedidaPor: concedidoPor,
    });
    setEditando(false);
  };

  const revogar = () => {
    onChange({
      ...spiritual,
      isencaoAtiva: false,
      isencaoTipo: undefined,
      isencaoMeses: undefined,
      isencaoDataInicio: undefined,
      isencaoDataFim: undefined,
      isencaoMotivo: undefined,
      isencaoConcedidaPor: undefined,
    });
    setEditando(false);
    setMotivo('');
    setTipo('meses');
    setMeses(1);
  };

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${isenta && !isencaoVencida ? 'rgba(0,255,128,0.3)' : 'rgba(255,255,255,0.1)'}`, overflow: 'hidden' }}>
      {/* Cabeçalho do status */}
      <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isenta && !isencaoVencida ? 'rgba(0,255,128,0.06)' : 'rgba(255,255,255,0.02)', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.4rem' }}>{isenta && !isencaoVencida ? '🟢' : '🔴'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: isenta && !isencaoVencida ? '#00ff80' : 'var(--text-muted)' }}>
              {isenta && !isencaoVencida ? 'Membro Isento' : isencaoVencida ? 'Isenção Vencida' : 'Sem Isenção'}
            </div>
            {isenta && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {spiritual.isencaoTipo === 'permanente'
                  ? 'Isenção permanente'
                  : `${spiritual.isencaoMeses} mes${spiritual.isencaoMeses !== 1 ? 'es' : ''} — válida até ${spiritual.isencaoDataFim ? new Date(spiritual.isencaoDataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}`}
                {spiritual.isencaoConcedidaPor && ` · concedida por ${spiritual.isencaoConcedidaPor}`}
              </div>
            )}
            {isenta && spiritual.isencaoMotivo && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                Motivo: {spiritual.isencaoMotivo}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {!isenta || isencaoVencida ? (
            <button
              type="button"
              onClick={() => setEditando(e => !e)}
              style={{ padding: '0.5rem 1.1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(0,255,128,0.1)', border: '1px solid rgba(0,255,128,0.35)', color: '#00ff80' }}
            >
              {editando ? '▲ Fechar' : '+ Conceder Isenção'}
            </button>
          ) : (
            <button
              type="button"
              onClick={revogar}
              style={{ padding: '0.5rem 1.1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,76,76,0.1)', border: '1px solid rgba(255,76,76,0.35)', color: '#ff4c4c' }}
            >
              Revogar Isenção
            </button>
          )}
        </div>
      </div>

      {/* Formulário de concessão */}
      {editando && (
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'rgba(0,0,0,0.15)' }}>
          {/* Tipo */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'block' }}>Tipo de isenção</label>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              {(['meses', 'permanente'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  style={{ padding: '0.5rem 1.2rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    border: `1.5px solid ${tipo === t ? '#00ff80' : 'var(--glass-border)'}`,
                    background: tipo === t ? 'rgba(0,255,128,0.12)' : 'transparent',
                    color: tipo === t ? '#00ff80' : 'var(--text-muted)'
                  }}
                >
                  {t === 'meses' ? 'Temporária (meses)' : 'Permanente'}
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade de meses */}
          {tipo === 'meses' && (
            <div>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'block' }}>Quantidade de meses</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[1, 2, 3, 6, 12, 24].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMeses(m)}
                    style={{ width: 48, height: 40, borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      border: `1.5px solid ${meses === m ? '#00f0ff' : 'var(--glass-border)'}`,
                      background: meses === m ? 'rgba(0,240,255,0.12)' : 'transparent',
                      color: meses === m ? 'var(--neon-cyan)' : 'var(--text-muted)'
                    }}
                  >
                    {m}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={meses}
                  onChange={e => setMeses(Math.max(1, Number(e.target.value)))}
                  className="search-input glass-panel"
                  style={{ width: 72, padding: '0.4rem 0.6rem', border: '1px solid var(--glass-border)', fontSize: '0.85rem', textAlign: 'center' }}
                  placeholder="Outro"
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Válida até: {new Date(new Date().setMonth(new Date().getMonth() + meses)).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem', display: 'block' }}>Motivo (opcional)</label>
            <textarea
              className="search-input glass-panel"
              rows={2}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder={`Ex: Dificuldade financeira temporária de ${membroNome}...`}
              style={{ width: '100%', padding: '0.7rem', border: '1px solid var(--glass-border)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button
              type="button"
              onClick={conceder}
              style={{ padding: '0.6rem 1.5rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(90deg,#00f0ff,#00ff80)', color: '#000', border: 'none' }}
            >
              Confirmar Isenção
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              style={{ padding: '0.6rem 1.2rem', borderRadius: 8, fontSize: '0.85rem', cursor: 'pointer', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
