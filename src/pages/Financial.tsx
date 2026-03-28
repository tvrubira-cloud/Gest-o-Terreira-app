import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Charge, ChargeType, BankAccount } from '../store/useStore';
import { DollarSign, Plus, ArrowLeft, CheckCircle, Clock, Users, Building2, AlertCircle, Landmark, Trash2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../utils/pix';

export default function Financial() {
  const { currentUser, getFilteredCharges, getMyCharges, getFilteredUsers, addCharge, markChargeAsPaid, notifyPayment, terreiros, getSystemChargesForCurrentTerreiro, getSystemChargesIssuedByMaster, getCurrentTerreiro, masterPixKey, getBankAccountsForCurrentTerreiro, addBankAccount, deleteBankAccount, bankAccounts: _storeBankAccounts } = useStore();
  const currentTerreiro = getCurrentTerreiro();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isMaster = currentUser?.isMaster || currentUser?.isPanelAdmin;
  
  const [activeTab, setActiveTab] = useState<'HOUSE' | 'SYSTEM' | 'BANKS'>('HOUSE');
  const [view, setView] = useState<'LIST' | 'FORM' | 'FORM_BANK'>('LIST');

  const houseCharges = isAdmin ? getFilteredCharges() : getMyCharges();
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
            <DollarSign size={28} /> {isMaster && activeTab === 'SYSTEM' ? 'Mensalidades do Sistema (SaaS)' : (isAdmin ? 'Gestão Financeira da Casa' : 'Meus Compromissos')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            {activeTab === 'SYSTEM' ? 'Gestão de faturamento dos terreiros cadastrados.' : 'Acompanhamento de mensalidades, eventos e colaborações.'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin && view === 'LIST' && (
            <div className="glass-panel" style={{ display: 'flex', padding: '0.3rem', borderRadius: 12, background: 'var(--hover-bg)' }}>
              <button 
                onClick={() => setActiveTab('HOUSE')}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'HOUSE' ? 'var(--neon-cyan)' : 'transparent', color: activeTab === 'HOUSE' ? '#fff' : 'var(--text-main)', fontWeight: 'bold' }}>
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
            </div>
          )}

          {isAdmin && view === 'LIST' && (
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
      {isAdmin && !isMaster && getSystemChargesForCurrentTerreiro().length > 0 && (
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
          {isAdmin && activeTab !== 'BANKS' && (
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
              {activeTab === 'BANKS' ? <><Landmark size={20} /> Contas Bancárias</> : (isAdmin ? 'Histórico de Cobranças' : 'Minhas Mensalidades e Eventos')}
            </h3>
            
            {activeTab === 'BANKS' ? (
              bankAccounts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhuma conta bancária cadastrada.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {bankAccounts.map(bank => (
                    <div key={bank.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, borderTop: '3px solid #e2b714', position: 'relative' }}>
                      {isAdmin && (
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
                          {isAdmin ? (
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
                          {isAdmin ? (
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
                            (!isPaidByUser && !isNotifiedByUser && (charge.targetType === 'SYSTEM' ? masterPixKey : currentTerreiro?.pixKey)) && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                                <h4 style={{ color: 'var(--neon-cyan)', margin: 0 }}>Pagamento via PIX</h4>
                                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Escaneie o QR Code abaixo com o app do seu banco para pagar o valor de {formatCurrency(charge.amount)}.</p>
                                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px' }}>
                                  <QRCodeSVG value={generatePixPayload(charge.targetType === 'SYSTEM' ? masterPixKey : (currentTerreiro?.pixKey || ''), currentTerreiro?.name || 'Recebedor', 'BRASIL', charge.id, charge.amount)} size={160} level="M" />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                  <button onClick={() => { navigator.clipboard.writeText(generatePixPayload(charge.targetType === 'SYSTEM' ? masterPixKey : (currentTerreiro?.pixKey || ''), currentTerreiro?.name || 'Recebedor', 'BRASIL', charge.id, charge.amount)); alert('BR Code PIX Copiado!'); }} style={{ background: 'var(--neon-cyan)', border: 'none', color: '#000', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                    <Copy size={18} /> PIX Copia e Cola
                                  </button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'FORM' && isAdmin && (
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

      {view === 'FORM_BANK' && isAdmin && (
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
