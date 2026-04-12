import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Charge, ChargeType, BankAccount } from '../store/useStore';
import { DollarSign, Plus, ArrowLeft, CheckCircle, Clock, Users, Building2, AlertCircle, Landmark, Trash2, Copy, Calendar, History, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../utils/pix';

export default function Financial() {
  const { currentUser, getFilteredCharges, getMyCharges, getFilteredUsers, addCharge, deleteCharge, markChargeAsPaid, notifyPayment, terreiros, getSystemChargesForCurrentTerreiro, getSystemChargesIssuedByMaster, getCurrentTerreiro, masterPixKey, getBankAccountsForCurrentTerreiro, addBankAccount, deleteBankAccount, bankAccounts: _storeBankAccounts } = useStore();
  const currentTerreiro = getCurrentTerreiro();
  const role = currentUser?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isFinanceiro = role === 'FINANCEIRO';
  const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
  const canManageFinancial = isAdmin || isFinanceiro || isMaster;
  
  const [activeTab, setActiveTab] = useState<'HOUSE' | 'SYSTEM' | 'BANKS' | 'HISTORY'>('HOUSE');
  const [view, setView] = useState<'LIST' | 'FORM' | 'FORM_BANK'>('LIST');

  // History state
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [historyPeriod, setHistoryPeriod] = useState<'ALL' | '30' | '90' | '365'>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const houseCharges = canManageFinancial ? getFilteredCharges() : getMyCharges();
  const systemInvoices = isMaster ? getSystemChargesIssuedByMaster() : getSystemChargesForCurrentTerreiro();
  
  const charges = activeTab === 'HOUSE' ? houseCharges : systemInvoices;
  const users = getFilteredUsers();
  const targetUsers = users.filter(u => !u.isMaster && !u.isPanelAdmin);
  const otherTerreiros = terreiros.filter(t => t.id !== currentUser?.terreiroId);
  const bankAccounts = getBankAccountsForCurrentTerreiro();

  const [newCharge, setNewCharge] = useState<Partial<Charge>>({
    title: '',
    description: '',
    type: 'Mensalidade',
    amount: 0,
    dueDate: '',
    assignedTo: [],
    targetType: 'USER'
  });
  
  const [newBank, setNewBank] = useState<Partial<BankAccount>>({
    bankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'Corrente',
    ownerName: '',
    ownerDocument: '',
    pixKey: ''
  });

  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
      
    if (!newCharge.assignedTo || newCharge.assignedTo.length === 0) {
      alert("Selecione pelo menos um membro para esta cobrança.");
      return;
    }
  
    await addCharge({
      title: newCharge.title || '',
      description: newCharge.description || '',
      type: (newCharge.type as ChargeType) || 'Mensalidade',
      amount: Number(newCharge.amount) || 0,
      dueDate: newCharge.dueDate || '',
      assignedTo: newCharge.assignedTo || [],
      paidBy: [],
      notifiedBy: [],
      targetType: activeTab === 'SYSTEM' ? 'SYSTEM' : 'USER'
    });
    
    setView('LIST');
    setNewCharge({ title: '', description: '', type: 'Mensalidade', amount: 0, dueDate: '', assignedTo: [], targetType: 'USER' });
  };
  
  const toggleUserAssignment = (userId: string) => {
    const current = newCharge.assignedTo || [];
    if (current.includes(userId)) {
      setNewCharge({ ...newCharge, assignedTo: current.filter(id => id !== userId) });
    } else {
      setNewCharge({ ...newCharge, assignedTo: [...current, userId] });
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBankAccount(newBank as any);
    setView('LIST');
    setNewBank({ bankName: '', agency: '', accountNumber: '', accountType: 'Corrente', ownerName: '', ownerDocument: '', pixKey: '' });
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
            <DollarSign size={28} /> {isMaster && activeTab === 'SYSTEM' ? 'Mensalidades do Sistema (SaaS)' : (canManageFinancial ? 'Gestão Financeira da Casa' : 'Meus Compromissos')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {activeTab === 'SYSTEM' ? 'Gestão de faturamento dos terreiros cadastrados.' : 'Acompanhamento de mensalidades, eventos e colaborações.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {canManageFinancial && view === 'LIST' && (
            <div className="glass-panel" style={{ display: 'flex', padding: '0.3rem', borderRadius: 12, background: 'var(--hover-bg)', flexWrap: 'wrap', gap: '0.2rem' }}>
              <button
                onClick={() => setActiveTab('HOUSE')}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'HOUSE' ? 'var(--neon-cyan)' : 'transparent', color: activeTab === 'HOUSE' ? '#000' : 'var(--text-main)', fontWeight: 'bold' }}>
                Interno
              </button>
              {isMaster && (
                <button
                  onClick={() => setActiveTab('SYSTEM')}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'SYSTEM' ? 'var(--neon-purple)' : 'transparent', color: activeTab === 'SYSTEM' ? '#fff' : 'var(--text-main)', fontWeight: 'bold' }}>
                  Sistema
                </button>
              )}
              <button
                onClick={() => setActiveTab('BANKS')}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'BANKS' ? '#e2b714' : 'transparent', color: activeTab === 'BANKS' ? '#000' : 'var(--text-main)', fontWeight: 'bold' }}>
                Bancos
              </button>
              <button
                onClick={() => { setActiveTab('HISTORY'); setSelectedMemberId(null); }}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'HISTORY' ? '#00ff88' : 'transparent', color: activeTab === 'HISTORY' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <History size={14} /> Histórico
              </button>
            </div>
          )}

          {canManageFinancial && view === 'LIST' && activeTab !== 'HISTORY' && (
            <button
              onClick={() => {
                if (activeTab === 'BANKS') {
                  setView('FORM_BANK');
                } else {
                  setNewCharge({...newCharge, targetType: activeTab === 'SYSTEM' ? 'SYSTEM' : 'USER'});
                  setView('FORM');
                }
              }}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}
            >
              <Plus size={18} /> {activeTab === 'BANKS' ? 'Nova Conta' : (activeTab === 'SYSTEM' ? 'Cobrar Terreiros' : 'Nova Cobrança')}
            </button>
          )}
          {(view === 'FORM' || view === 'FORM_BANK') && (
            <button 
              onClick={() => setView('LIST')}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} /> Voltar
            </button>
          )}
        </div>
      </div>

      {/* SaaS Alert for normal Admins */}
      {canManageFinancial && !isMaster && getSystemChargesForCurrentTerreiro().length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel" 
          style={{ padding: '1rem', border: '1px solid #ff4c4c', background: 'rgba(255, 76, 76, 0.1)', color: '#ff4c4c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertCircle />
            <div>
              <strong style={{ display: 'block' }}>Atenção: Faturas do Sistema Pendentes</strong>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Você possui cobranças de manutenção da plataforma.</span>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab(activeTab === 'SYSTEM' ? 'HOUSE' : 'SYSTEM')}
            style={{ padding: '0.5rem 1rem', background: '#ff4c4c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>
            {activeTab === 'SYSTEM' ? 'Ver Financeiro Interno' : 'Acessar Faturas'}
          </button>
        </motion.div>
      )}

      {view === 'LIST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Dashboard Stats */}
          {canManageFinancial && activeTab !== 'BANKS' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
               <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)', borderLeft: `3px solid ${activeTab === 'SYSTEM' ? 'var(--neon-purple)' : 'var(--neon-cyan)'}` }}>
                 <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{activeTab === 'SYSTEM' ? 'SaaS Previsto' : 'Receita Prevista'}</h4>
                 <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                   {formatCurrency(charges.reduce((acc, c) => acc + (c.amount * c.assignedTo.length), 0))}
                 </div>
               </div>
               <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)', borderLeft: '3px solid #00ff88' }}>
                 <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{activeTab === 'SYSTEM' ? 'Total Recebido' : 'Valor Arrecadado'}</h4>
                 <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#00ff88' }}>
                   {formatCurrency(charges.reduce((acc, c) => acc + (c.amount * c.paidBy.length), 0))}
                 </div>
               </div>
               <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)', borderLeft: '3px solid #ff4c4c' }}>
                 <h4 style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{activeTab === 'SYSTEM' ? 'Terreiros Atrasados' : 'Inadimplência (Pendente)'}</h4>
                 <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem', color: '#ff4c4c' }}>
                   {formatCurrency(charges.reduce((acc, c) => acc + (c.amount * (c.assignedTo.length - c.paidBy.length)), 0))}
                 </div>
               </div>
            </div>
          )}

          {/* List Content */}
          <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeTab === 'BANKS' ? <><Landmark size={20} /> Contas Bancárias</> : (canManageFinancial ? 'Histórico de Cobranças' : 'Minhas Mensalidades e Eventos')}
            </h3>
            
            {activeTab === 'BANKS' ? (
              bankAccounts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhuma conta bancária cadastrada.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {bankAccounts.map(bank => (
                    <div key={bank.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, borderTop: '3px solid #e2b714', position: 'relative' }}>
                      {canManageFinancial && (
                        <button 
                          onClick={() => { if(confirm('Excluir conta bancária?')) deleteBankAccount(bank.id); }}
                          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#ff4c4c', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(226, 183, 20, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
                          <Landmark size={24} color="#e2b714" />
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{bank.bankName}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conta {bank.accountType}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Agência:</span> <strong>{bank.agency}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Conta:</span> <strong>{bank.accountNumber}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Titular:</span> <strong>{bank.ownerName}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>CPF/CNPJ:</span> <strong>{bank.ownerDocument}</strong></div>
                        {bank.pixKey && (
                          <div style={{ marginTop: '0.8rem', paddingTop: '1rem', borderTop: '1px dashed var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '8px', display: 'inline-block' }}>
                              <QRCodeSVG value={generatePixPayload(bank.pixKey, bank.ownerName || currentTerreiro?.name || 'Pix')} size={120} level="M" />
                            </div>
                            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                              <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{bank.pixKey}</span>
                              <button onClick={() => { navigator.clipboard.writeText(generatePixPayload(bank.pixKey || '', bank.ownerName || currentTerreiro?.name || 'Pix')); alert('BR Code PIX Copiado!'); }} style={{ background: 'var(--neon-cyan)', border: 'none', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', fontSize: '0.75rem' }}>
                                <Copy size={14} /> Copia e Cola
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : charges.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum registro financeiro encontrado.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {charges.map(charge => {
                  const isPaidByUser = currentUser ? charge.paidBy.includes(currentUser.id) : false;
                  const isNotifiedByUser = currentUser ? (charge.notifiedBy || []).includes(currentUser.id) : false;
                  const isExpanded = expandedChargeId === charge.id;
                  
                  return (
                    <div key={charge.id} style={{ border: '1px solid var(--glass-border)', borderRadius: 10, background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                      <div 
                        style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setExpandedChargeId(isExpanded ? null : charge.id)}
                      >
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <div style={{ padding: '0.5rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: 8, textAlign: 'center', minWidth: '60px', border: charge.targetType === 'SYSTEM' ? '1px solid var(--neon-purple)' : 'none' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{new Date(charge.dueDate).toLocaleString('pt-BR', { month: 'short' })}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: charge.targetType === 'SYSTEM' ? 'var(--neon-purple)' : 'var(--neon-cyan)' }}>{new Date(charge.dueDate).getDate()}</div>
                          </div>
                          <div>
                            <strong style={{ fontSize: '1.1rem', display: 'block' }}>{charge.title} {charge.targetType === 'SYSTEM' && <span style={{ fontSize: '0.65rem', background: 'var(--neon-purple)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: 4, marginLeft: '0.5rem', verticalAlign: 'middle' }}>SISTEMA</span>}</strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{charge.type} • {formatCurrency(charge.amount)}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                          {canManageFinancial && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm(`Excluir a cobrança "${charge.title}"?`)) {
                                  await deleteCharge(charge.id);
                                }
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4c4c', padding: '0.3rem', display: 'flex', alignItems: 'center' }}
                              title="Excluir cobrança"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          {!isPaidByUser && !isNotifiedByUser && (charge.targetType === 'SYSTEM' ? masterPixKey : currentTerreiro?.pixKey) && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedChargeId(isExpanded ? null : charge.id);
                              }}
                              className="glass-panel" 
                              style={{ padding: '0.4rem 0.8rem', background: 'rgba(0, 240, 255, 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--neon-cyan)', borderRadius: 20 }}
                            >
                              <span style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)', fontWeight: 'bold' }}>Pagar via PIX</span>
                            </div>
                          )}
                          {!isAdmin && !isPaidByUser && !isNotifiedByUser && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (currentUser) await notifyPayment(charge.id, currentUser.id);
                                alert('Pagamento notificado ao administrador!');
                              }}
                              style={{ padding: '0.5rem 1rem', background: 'var(--neon-purple)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                            >
                              Notificar Pagamento
                            </button>
                          )}
                          {canManageFinancial ? (
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status Adesão</div>
                              <div style={{ fontWeight: 'bold', color: charge.paidBy.length === charge.assignedTo.length ? '#00ff88' : 'var(--text-main)' }}>
                                {charge.paidBy.length} / {charge.assignedTo.length} Pagos
                                {(charge.notifiedBy || []).length > 0 && <span style={{ color: '#ffcc00', marginLeft: '0.5rem' }}>({charge.notifiedBy.length} pnd.)</span>}
                              </div>
                            </div>
                          ) : (
                            <div style={{ 
                              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 20,
                              background: isPaidByUser ? 'rgba(0, 255, 136, 0.1)' : (isNotifiedByUser ? 'rgba(255, 204, 0, 0.1)' : 'rgba(255, 76, 76, 0.1)'),
                              color: isPaidByUser ? '#00ff88' : (isNotifiedByUser ? '#ffcc00' : '#ff4c4c'), fontWeight: 'bold'
                            }}>
                              {isPaidByUser ? <CheckCircle size={16} /> : <Clock size={16} />}
                              {isPaidByUser ? 'Pago / Confirmado' : (isNotifiedByUser ? 'Aguardando Confirmação' : 'Pendente')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expandable details */}
                      {isExpanded && (
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {canManageFinancial ? (
                            <>
                              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.8rem', textTransform: 'uppercase' }}>{activeTab === 'SYSTEM' ? 'Terreiros Faturados' : 'Controle de Membros'} ({charge.assignedTo.length})</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {charge.assignedTo.map(id => {
                                  const entity = activeTab === 'SYSTEM' ? terreiros.find(t => t.id === id) : users.find(u => u.id === id);
                                  const hasPaid = charge.paidBy.includes(id);
                                  const hasNotified = (charge.notifiedBy || []).includes(id);
                                  if (!entity) return null;

                                  return (
                                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: `1px solid ${hasPaid ? 'rgba(0,255,136,0.3)' : (hasNotified ? 'rgba(255, 204, 0, 0.3)' : 'transparent')}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasPaid ? '#00ff88' : (hasNotified ? '#ffcc00' : '#ff4c4c') }}></div>
                                        <span style={{ fontSize: '0.9rem', color: hasNotified && !hasPaid ? '#ffcc00' : '#fff' }}>{'name' in entity ? entity.name : entity.nomeCompleto}</span>
                                        {hasNotified && !hasPaid && <span style={{ fontSize: '0.6rem', background: '#ffcc00', color: '#000', padding: '0.1rem 0.3rem', borderRadius: 4 }}>NOTIFICOU</span>}
                                      </div>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); markChargeAsPaid(charge.id, id, !hasPaid); }}
                                        style={{
                                          padding: '0.3rem 0.6rem', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold',
                                          background: hasPaid ? 'transparent' : (hasNotified ? '#ffcc00' : 'rgba(0, 240, 255, 0.15)'),
                                          color: hasPaid ? 'var(--text-muted)' : (hasNotified ? '#000' : 'var(--neon-cyan)')
                                        }}
                                      >
                                        {hasPaid ? 'Desfazer' : (hasNotified ? 'CONFIRMAR' : 'Marcar Pago')}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0.5rem' }}>

                              {/* Detalhes da cobrança */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.8rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 8 }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Tipo</div>
                                  <div style={{ fontWeight: 'bold' }}>{charge.type}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 8 }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Valor</div>
                                  <div style={{ fontWeight: 'bold', color: 'var(--neon-cyan)' }}>{formatCurrency(charge.amount)}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 8 }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Vencimento</div>
                                  <div style={{ fontWeight: 'bold', color: new Date(charge.dueDate) < new Date() && !isPaidByUser ? '#ff4c4c' : 'var(--text-main)' }}>
                                    {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 8 }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Situação</div>
                                  <div style={{ fontWeight: 'bold', color: isPaidByUser ? '#00ff88' : isNotifiedByUser ? '#ffcc00' : '#ff4c4c' }}>
                                    {isPaidByUser ? 'Pago / Confirmado' : isNotifiedByUser ? 'Aguardando Confirmação' : 'Pendente'}
                                  </div>
                                </div>
                                {charge.description && (
                                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: 8, gridColumn: '1 / -1' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Descrição</div>
                                    <div style={{ fontSize: '0.9rem' }}>{charge.description}</div>
                                  </div>
                                )}
                              </div>

                              {/* Status visual */}
                              {isPaidByUser && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 10 }}>
                                  <CheckCircle size={24} color="#00ff88" />
                                  <div>
                                    <div style={{ fontWeight: 'bold', color: '#00ff88' }}>Pagamento Confirmado</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Seu pagamento foi registrado pelo administrador.</div>
                                  </div>
                                </div>
                              )}

                              {isNotifiedByUser && !isPaidByUser && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem', background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 10 }}>
                                  <Clock size={24} color="#ffcc00" />
                                  <div>
                                    <div style={{ fontWeight: 'bold', color: '#ffcc00' }}>Pagamento Notificado</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aguardando confirmação do administrador.</div>
                                  </div>
                                </div>
                              )}

                              {/* Opções de pagamento — somente se pendente */}
                              {!isPaidByUser && !isNotifiedByUser && (() => {
                                // Cobrança SYSTEM: usa masterPixKey
                                if (charge.targetType === 'SYSTEM') {
                                  if (!masterPixKey) return (
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                      Pagamento presencial ou via transferência. Consulte o administrador.
                                    </div>
                                  );
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.2rem', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 10 }}>
                                      <h4 style={{ color: 'var(--neon-cyan)', margin: 0 }}>Pagar via PIX</h4>
                                      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Valor: <strong>{formatCurrency(charge.amount)}</strong></p>
                                      <div style={{ background: '#fff', padding: '1rem', borderRadius: 12 }}>
                                        <QRCodeSVG value={generatePixPayload(masterPixKey, 'ORUM Sistema', 'BRASIL', charge.id, charge.amount)} size={180} level="M" />
                                      </div>
                                      <button onClick={() => { navigator.clipboard.writeText(generatePixPayload(masterPixKey, 'ORUM Sistema', 'BRASIL', charge.id, charge.amount)); alert('Código PIX copiado!'); }}
                                        style={{ background: 'var(--neon-cyan)', border: 'none', color: '#000', padding: '0.8rem 1.5rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                        <Copy size={18} /> PIX Copia e Cola
                                      </button>
                                    </div>
                                  );
                                }

                                // Cobrança USER: usa contas bancárias do terreiro
                                const terreiroAccounts = bankAccounts.filter(b => b.terreiroId === currentTerreiro?.id || b.terreiroId === currentUser?.terreiroId);
                                const accountsWithPix = terreiroAccounts.filter(b => b.pixKey);

                                // fallback: chave PIX direto no terreiro
                                const fallbackPix = currentTerreiro?.pixKey;

                                if (accountsWithPix.length === 0 && !fallbackPix) return (
                                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: 10, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    Nenhuma conta bancária com PIX cadastrada. Pagamento presencial ou via transferência — consulte o administrador.
                                  </div>
                                );

                                // Monta lista de contas para exibir
                                const pixSources: { label: string; pixKey: string; ownerName: string; bank?: string }[] = [];
                                accountsWithPix.forEach(b => pixSources.push({ label: `${b.bankName} — Conta ${b.accountType}`, pixKey: b.pixKey!, ownerName: b.ownerName, bank: b.bankName }));
                                if (fallbackPix && pixSources.length === 0) pixSources.push({ label: currentTerreiro?.name || 'Terreiro', pixKey: fallbackPix, ownerName: currentTerreiro?.name || '' });

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <h4 style={{ color: 'var(--neon-cyan)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <Landmark size={18} /> Pagar via PIX — {formatCurrency(charge.amount)}
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                                      {pixSources.map((src, i) => (
                                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.2rem', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 10 }}>
                                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                            <strong style={{ color: '#fff', display: 'block', marginBottom: '0.2rem' }}>{src.label}</strong>
                                            Titular: {src.ownerName}
                                          </div>
                                          <div style={{ background: '#fff', padding: '0.8rem', borderRadius: 10 }}>
                                            <QRCodeSVG value={generatePixPayload(src.pixKey, src.ownerName, 'BRASIL', charge.id, charge.amount)} size={160} level="M" />
                                          </div>
                                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all', textAlign: 'center' }}>
                                            Chave: <strong style={{ color: '#00ff88' }}>{src.pixKey}</strong>
                                          </div>
                                          <button onClick={() => { navigator.clipboard.writeText(generatePixPayload(src.pixKey, src.ownerName, 'BRASIL', charge.id, charge.amount)); alert('Código PIX copiado!'); }}
                                            style={{ background: 'var(--neon-cyan)', border: 'none', color: '#000', padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}>
                                            <Copy size={16} /> PIX Copia e Cola
                                          </button>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Dados bancários completos para TED/DOC */}
                                    {terreiroAccounts.length > 0 && (
                                      <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados Bancários</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                          {terreiroAccounts.map((b, i) => (
                                            <div key={i} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--glass-border)', fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 1rem' }}>
                                              <div><span style={{ color: 'var(--text-muted)' }}>Banco:</span> <strong>{b.bankName}</strong></div>
                                              <div><span style={{ color: 'var(--text-muted)' }}>Tipo:</span> <strong>{b.accountType}</strong></div>
                                              <div><span style={{ color: 'var(--text-muted)' }}>Agência:</span> <strong>{b.agency}</strong></div>
                                              <div><span style={{ color: 'var(--text-muted)' }}>Conta:</span> <strong>{b.accountNumber}</strong></div>
                                              <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Titular:</span> <strong>{b.ownerName}</strong></div>
                                              {b.pixKey && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Chave PIX:</span> <strong style={{ color: '#00ff88' }}>{b.pixKey}</strong></div>}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        {/* ── HISTÓRICO ─────────────────────────────────── */}
        {activeTab === 'HISTORY' && canManageFinancial && (() => {
          const allHouseCharges = getFilteredCharges();
          const today = new Date();

          // Filtro de período
          const periodFiltered = allHouseCharges.filter(c => {
            if (historyPeriod === 'ALL') return true;
            const days = parseInt(historyPeriod);
            const diff = (today.getTime() - new Date(c.dueDate).getTime()) / (1000 * 60 * 60 * 24);
            return diff <= days;
          });

          // Se tem membro selecionado — visão individual
          if (selectedMemberId) {
            const member = users.find(u => u.id === selectedMemberId);
            const memberCharges = periodFiltered.filter(c => c.assignedTo.includes(selectedMemberId));
            const paid = memberCharges.filter(c => c.paidBy.includes(selectedMemberId));
            const notified = memberCharges.filter(c => !c.paidBy.includes(selectedMemberId) && (c.notifiedBy || []).includes(selectedMemberId));
            const overdue = memberCharges.filter(c => !c.paidBy.includes(selectedMemberId) && new Date(c.dueDate) < today);
            const pending = memberCharges.filter(c => !c.paidBy.includes(selectedMemberId));

            const filtered = (() => {
              if (historyFilter === 'PAID') return paid;
              if (historyFilter === 'OVERDUE') return overdue;
              if (historyFilter === 'PENDING') return pending;
              return memberCharges;
            })();

            const totalPaid = paid.reduce((a, c) => a + c.amount, 0);
            const totalPending = pending.reduce((a, c) => a + c.amount, 0);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Header membro */}
                <div className="glass-panel" style={{ padding: '1.2rem 1.5rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '3px solid var(--neon-cyan)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setSelectedMemberId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ArrowLeft size={18} />
                    </button>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{member?.nomeCompleto}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member?.nomeDeSanto || 'Sem nome de santo'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                    <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Pago</div><div style={{ color: '#00ff88', fontWeight: 'bold' }}>{formatCurrency(totalPaid)}</div></div>
                    <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendente</div><div style={{ color: '#ff4c4c', fontWeight: 'bold' }}>{formatCurrency(totalPending)}</div></div>
                    <div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cobranças</div><div style={{ fontWeight: 'bold' }}>{memberCharges.length}</div></div>
                  </div>
                </div>

                {/* Filtros */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)}
                      style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${historyFilter === f ? 'var(--neon-cyan)' : 'var(--glass-border)'}`, background: historyFilter === f ? 'rgba(0,240,255,0.1)' : 'transparent', color: historyFilter === f ? 'var(--neon-cyan)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                      {f === 'ALL' ? 'Todas' : f === 'PAID' ? 'Pagas' : f === 'PENDING' ? 'Pendentes' : 'Atrasadas'}
                    </button>
                  ))}
                </div>

                {/* Lista de cobranças do membro */}
                <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
                  {filtered.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhuma cobrança neste filtro.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {filtered.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(c => {
                        const isPaid = c.paidBy.includes(selectedMemberId);
                        const isNotif = (c.notifiedBy || []).includes(selectedMemberId);
                        const isOver = !isPaid && new Date(c.dueDate) < today;
                        const statusColor = isPaid ? '#00ff88' : isOver ? '#ff4c4c' : isNotif ? '#ffcc00' : 'var(--text-muted)';
                        const statusLabel = isPaid ? 'Pago' : isNotif ? 'Notificado' : isOver ? 'Atrasado' : 'Pendente';
                        return (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${isPaid ? 'rgba(0,255,136,0.2)' : isOver ? 'rgba(255,76,76,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{c.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.type} • Venc. {new Date(c.dueDate).toLocaleDateString('pt-BR')}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold', color: statusColor }}>{statusLabel}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatCurrency(c.amount)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Visão global — resumo por membro
          const memberSummaries = targetUsers.map(u => {
            const assigned = periodFiltered.filter(c => c.assignedTo.includes(u.id));
            const paid = assigned.filter(c => c.paidBy.includes(u.id));
            const overdue = assigned.filter(c => !c.paidBy.includes(u.id) && new Date(c.dueDate) < today);
            const pending = assigned.filter(c => !c.paidBy.includes(u.id));
            const notified = assigned.filter(c => !c.paidBy.includes(u.id) && (c.notifiedBy || []).includes(u.id));
            return {
              user: u,
              total: assigned.length,
              paid: paid.length,
              overdue: overdue.length,
              pending: pending.length,
              notified: notified.length,
              totalPaid: paid.reduce((a, c) => a + c.amount, 0),
              totalPending: pending.reduce((a, c) => a + c.amount, 0),
              totalOverdue: overdue.reduce((a, c) => a + c.amount, 0),
            };
          }).filter(s => s.total > 0);

          const filteredSummaries = (() => {
            if (historyFilter === 'PAID') return memberSummaries.filter(s => s.paid > 0);
            if (historyFilter === 'PENDING') return memberSummaries.filter(s => s.pending > 0);
            if (historyFilter === 'OVERDUE') return memberSummaries.filter(s => s.overdue > 0);
            return memberSummaries;
          })();

          // Totais globais
          const globalPaid = memberSummaries.reduce((a, s) => a + s.totalPaid, 0);
          const globalPending = memberSummaries.reduce((a, s) => a + s.totalPending, 0);
          const globalOverdue = memberSummaries.reduce((a, s) => a + s.totalOverdue, 0);
          const membersOk = memberSummaries.filter(s => s.pending === 0 && s.total > 0).length;
          const membersOverdue = memberSummaries.filter(s => s.overdue > 0).length;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Cards resumo global */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid #00ff88' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TrendingUp size={14} /> Total Arrecadado</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#00ff88', marginTop: '0.3rem' }}>{formatCurrency(globalPaid)}</div>
                </div>
                <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid #ff4c4c' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TrendingDown size={14} /> Total Pendente</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ff4c4c', marginTop: '0.3rem' }}>{formatCurrency(globalPending)}</div>
                </div>
                <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid #ffcc00' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Em Atraso</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffcc00', marginTop: '0.3rem' }}>{formatCurrency(globalOverdue)}</div>
                </div>
                <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid var(--neon-cyan)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Em Dia / Inadimplentes</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', marginTop: '0.3rem' }}>
                    <span style={{ color: '#00ff88' }}>{membersOk}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}> / </span>
                    <span style={{ color: '#ff4c4c' }}>{membersOverdue}</span>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                {(['ALL', 'PAID', 'PENDING', 'OVERDUE'] as const).map(f => (
                  <button key={f} onClick={() => setHistoryFilter(f)}
                    style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${historyFilter === f ? 'var(--neon-cyan)' : 'var(--glass-border)'}`, background: historyFilter === f ? 'rgba(0,240,255,0.1)' : 'transparent', color: historyFilter === f ? 'var(--neon-cyan)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {f === 'ALL' ? 'Todos' : f === 'PAID' ? 'Em Dia' : f === 'PENDING' ? 'Com Pendência' : 'Atrasados'}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <select value={historyPeriod} onChange={e => setHistoryPeriod(e.target.value as typeof historyPeriod)}
                    className="search-input glass-panel"
                    style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontSize: '0.85rem', borderRadius: 8 }}>
                    <option value="ALL">Todo período</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="365">Último ano</option>
                  </select>
                </div>
              </div>

              {/* Tabela de membros */}
              <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
                <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={18} /> Histórico por Membro
                </h3>
                {filteredSummaries.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum dado encontrado para este filtro.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filteredSummaries.sort((a, b) => b.totalOverdue - a.totalOverdue || b.totalPending - a.totalPending).map(s => {
                      const pctPaid = s.total > 0 ? Math.round((s.paid / s.total) * 100) : 0;
                      const statusColor = s.overdue > 0 ? '#ff4c4c' : s.pending > 0 ? '#ffcc00' : '#00ff88';
                      return (
                        <div key={s.user.id}
                          onClick={() => setSelectedMemberId(s.user.id)}
                          style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.overdue > 0 ? 'rgba(255,76,76,0.25)' : s.pending === 0 ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>

                          {/* Nome */}
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{s.user.nomeCompleto}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.user.nomeDeSanto || '—'} • {s.total} cobrança(s)</div>
                            {/* Barra de progresso */}
                            <div style={{ marginTop: '0.4rem', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', width: '100%', maxWidth: 200 }}>
                              <div style={{ height: '100%', width: `${pctPaid}%`, background: statusColor, borderRadius: 2, transition: 'width 0.4s' }} />
                            </div>
                          </div>

                          {/* Pago */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pago</div>
                            <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.9rem' }}>{formatCurrency(s.totalPaid)}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.paid}/{s.total}</div>
                          </div>

                          {/* Pendente */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendente</div>
                            <div style={{ color: s.pending > 0 ? '#ffcc00' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>{formatCurrency(s.totalPending)}</div>
                            {s.notified > 0 && <div style={{ fontSize: '0.7rem', color: '#ffcc00' }}>{s.notified} notif.</div>}
                          </div>

                          {/* Atrasado */}
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atrasado</div>
                            <div style={{ color: s.overdue > 0 ? '#ff4c4c' : 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.9rem' }}>{s.overdue > 0 ? formatCurrency(s.totalOverdue) : '—'}</div>
                          </div>

                          {/* Seta */}
                          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        </div>
      )}

      {view === 'FORM' && canManageFinancial && (
        <form onSubmit={handleSave} className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: 'var(--neon-cyan)' }}>Dados da Mensalidade / Evento</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Título da Cobrança" placeholder="Ex: Mensalidade Janeiro 2026" value={newCharge.title} onChange={v => setNewCharge({...newCharge, title: v})} required />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Tipo <span style={{ color: 'var(--neon-purple)' }}>*</span></label>
                <select className="search-input glass-panel" style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }}
                  value={newCharge.type} onChange={e => setNewCharge({...newCharge, type: e.target.value as ChargeType})} required>
                  <option value="Mensalidade" style={{ color: '#000' }}>Mensalidade</option>
                  <option value="Colaboração" style={{ color: '#000' }}>Colaboração Especial</option>
                  <option value="Evento" style={{ color: '#000' }}>Evento / Festa</option>
                  <option value="Outros" style={{ color: '#000' }}>Outros / Taxas</option>
                </select>
              </div>

              <Input label="Valor (R$)" type="number" placeholder="50.00" value={newCharge.amount?.toString()} onChange={v => setNewCharge({...newCharge, amount: Number(v)})} required />
              <Input label="Data de Vencimento" type="date" value={newCharge.dueDate} onChange={v => setNewCharge({...newCharge, dueDate: v})} required />
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Descrição Curta" placeholder="Mês referente ou detalhes do evento" value={newCharge.description} onChange={v => setNewCharge({...newCharge, description: v})} />
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--neon-purple)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeTab === 'SYSTEM' ? <><Building2 size={20} /> Terreiros para Cobrança</> : <><Users size={20} /> Membros Selecionados</>}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setNewCharge({...newCharge, assignedTo: (activeTab === 'SYSTEM' ? otherTerreiros : targetUsers).map(u => u.id)})} className="glass-panel" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4 }}>
                  Selecionar Todos
                </button>
                <button type="button" onClick={() => setNewCharge({...newCharge, assignedTo: []})} className="glass-panel" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4 }}>
                  Limpar
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 8 }}>
              {(activeTab === 'SYSTEM' ? otherTerreiros : targetUsers).map(entity => {
                const isSelected = newCharge.assignedTo?.includes(entity.id);
                const name = 'name' in entity ? entity.name : entity.nomeCompleto;
                return (
                  <div key={entity.id} onClick={() => toggleUserAssignment(entity.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem', border: `1px solid ${isSelected ? (activeTab === 'SYSTEM' ? 'var(--neon-purple)' : 'var(--neon-cyan)') : 'transparent'}`, background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? (activeTab === 'SYSTEM' ? 'var(--neon-purple)' : 'var(--neon-cyan)') : 'var(--text-muted)'}`, background: isSelected ? (activeTab === 'SYSTEM' ? 'var(--neon-purple)' : 'var(--neon-cyan)') : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {isSelected && <CheckCircle size={14} color="#000" />}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text-muted)' }}>{name}</span>
                  </div>
                );
              })}
              {(activeTab === 'SYSTEM' ? otherTerreiros : targetUsers).length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Nenhum alvo cadastrado plataforma.</div>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: activeTab === 'SYSTEM' ? 'var(--neon-purple)' : 'var(--neon-cyan)', marginTop: '0.8rem', textAlign: 'right' }}>
              {newCharge.assignedTo?.length || 0} {activeTab === 'SYSTEM' ? 'terreiro(s)' : 'membro(s)'} incluído(s) na cobrança.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="glass-panel glow-fx" style={{ padding: '1rem 3rem', background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.2), rgba(176, 0, 255, 0.2))', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}>
              Gerar Relatório de Cobrança
            </button>
          </div>
        </form>
      )}

      {view === 'FORM_BANK' && canManageFinancial && (
        <form onSubmit={handleSaveBank} className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', marginBottom: '1.5rem', color: '#e2b714', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={20} /> Cadastrar Conta Bancária
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
              <Input label="Banco" placeholder="Ex: Nubank, Itaú, Banco do Brasil" value={newBank.bankName} onChange={v => setNewBank({...newBank, bankName: v})} required />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Tipo de Conta <span style={{ color: 'var(--neon-purple)' }}>*</span></label>
                <select className="search-input glass-panel" style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', outline: 'none' }}
                  value={newBank.accountType} onChange={e => setNewBank({...newBank, accountType: e.target.value as 'Corrente' | 'Poupança'})} required>
                  <option value="Corrente" style={{ color: '#000' }}>Corrente</option>
                  <option value="Poupança" style={{ color: '#000' }}>Poupança</option>
                </select>
              </div>

              <Input label="Agência" placeholder="Ex: 0001" value={newBank.agency} onChange={v => setNewBank({...newBank, agency: v})} required />
              <Input label="Número da Conta (com dígito)" placeholder="Ex: 12345-6" value={newBank.accountNumber} onChange={v => setNewBank({...newBank, accountNumber: v})} required />
              
              <Input label="Nome do Titular" placeholder="Nome Completo / Razão Social" value={newBank.ownerName} onChange={v => setNewBank({...newBank, ownerName: v})} required />
              <Input label="CPF ou CNPJ do Titular" placeholder="Apenas números" value={newBank.ownerDocument} onChange={v => setNewBank({...newBank, ownerDocument: v})} required />

              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Chave PIX (Opcional)" placeholder="E-mail, CPF, Telefone ou Chave Aleatória" value={newBank.pixKey} onChange={v => setNewBank({...newBank, pixKey: v})} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="glass-panel glow-fx" style={{ padding: '1rem 3rem', background: '#e2b714', color: '#000', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
              Salvar Conta Bancária
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

function DateInputField({ label, value, onChange, required = false }: { label: string; value?: string | null; onChange: (v: string) => void; required?: boolean }) {
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
      <label style={{ color: 'var(--text-muted)' }}>{label}{required && <span style={{ color: 'var(--neon-purple)' }}> *</span>}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="DD/MM/AAAA"
          required={required}
          className="search-input glass-panel"
          style={{ padding: '0.8rem', paddingRight: '2.8rem', border: '1px solid var(--glass-border)', color: 'var(--text-main)', fontFamily: 'inherit', width: '100%' }}
          value={text}
          onChange={handleChange}
        />
        <button type="button" onClick={openPicker}
          style={{ position: 'absolute', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem', display: 'flex', alignItems: 'center' }}>
          <Calendar size={16} />
        </button>
        <input ref={dateRef} type="date"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          value={value || ''} onChange={handlePickerChange}
        />
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required = false, placeholder }: InputProps) {
  if (type === 'date') return <DateInputField label={label} value={value} onChange={onChange} required={required} />;
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
