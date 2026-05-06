import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Charge, ChargeType, BankAccount, CashFlowEntry, InventoryItem, ShoppingListItem } from '../store/useStore';
import { DollarSign, Plus, ArrowLeft, CheckCircle, Clock, AlertCircle, Landmark, Trash2, Copy, Calendar, History, TrendingUp, TrendingDown, ChevronDown, Filter, MessageCircle, Package, ShoppingCart, AlertTriangle, Bell, ArrowUpCircle, ArrowDownCircle, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { generatePixPayload } from '../utils/pix';
import ConfirmationModal from '../components/ConfirmationModal';
import { BANKS, findBankByCode, getBankInitials, type Bank } from '../utils/banks';

export default function Financial() {
  const {
    currentUser, getFilteredCharges, getMyCharges, getFilteredUsers, addCharge, deleteCharge,
    markChargeAsPaid, notifyPayment, terreiros, getSystemChargesForCurrentTerreiro,
    getSystemChargesIssuedByMaster, getCurrentTerreiro, masterPixKey,
    getBankAccountsForCurrentTerreiro, addBankAccount, updateBankAccount, deleteBankAccount,
    bankAccounts: _storeBankAccounts,
    cashFlowEntries, fetchCashFlow, addCashFlowEntry, updateCashFlowEntry, deleteCashFlowEntry,
    inventoryItems, fetchInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    shoppingListItems, fetchShoppingList, addShoppingListItem,
    deleteShoppingListItem, toggleShoppingItemPurchased,
  } = useStore();
  const currentTerreiro = getCurrentTerreiro();
  const role = currentUser?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isFinanceiro = role === 'FINANCEIRO';
  const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
  const canManageFinancial = isAdmin || isFinanceiro || isMaster;

  const [activeTab, setActiveTab] = useState<'HOUSE' | 'SYSTEM' | 'BANKS' | 'HISTORY' | 'CASHFLOW' | 'INVENTORY'>('HOUSE');
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
  const activeTargetUsers = targetUsers.filter(u => (u.spiritual?.situacaoCadastro ?? 'ativo') === 'ativo');
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
    bankCode: '',
    agency: '',
    accountNumber: '',
    accountType: 'Corrente',
    ownerName: '',
    ownerDocument: '',
    pixKey: ''
  });

  const [expandedChargeId, setExpandedChargeId] = useState<string | null>(null);
  const [deleteChargeModal, setDeleteChargeModal] = useState<{ isOpen: boolean; chargeId: string; chargeTitle: string }>({ isOpen: false, chargeId: '', chargeTitle: '' });
  const [deleteBankModal, setDeleteBankModal] = useState<{ isOpen: boolean; bankId: string; bankName: string }>({ isOpen: false, bankId: '', bankName: '' });
  const [bankSelectorModal, setBankSelectorModal] = useState<{ isOpen: boolean; targetId: string }>({ isOpen: false, targetId: '' });
  const [bankSearch, setBankSearch] = useState('');

  // ─── Cash Flow state ───────────────────────────────────
  const [showCashFlowForm, setShowCashFlowForm] = useState(false);
  const [editingCashFlow, setEditingCashFlow] = useState<CashFlowEntry | null>(null);
  const [cashFlowForm, setCashFlowForm] = useState<Omit<CashFlowEntry, 'id' | 'terreiroId' | 'createdAt'>>({
    type: 'recebimento', description: '', amount: 0, date: '', realized: false, notes: '',
  });
  const [deleteCashFlowModal, setDeleteCashFlowModal] = useState<{ isOpen: boolean; id: string; description: string }>({ isOpen: false, id: '', description: '' });

  // ─── Inventory state ───────────────────────────────────
  const [inventorySubTab, setInventorySubTab] = useState<'ITEMS' | 'SHOPPING'>('ITEMS');
  const [inventoryAddTarget, setInventoryAddTarget] = useState<'STOCK' | 'SHOPPING'>('STOCK');
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [inventoryForm, setInventoryForm] = useState<Omit<InventoryItem, 'id' | 'terreiroId' | 'createdAt'>>({
    name: '', category: '', unit: 'un', currentStock: 0, minimumStock: 0, unitPrice: 0, notes: '',
  });
  const [deleteInventoryModal, setDeleteInventoryModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  // ─── Shopping List state ───────────────────────────────
  const [showShoppingForm, setShowShoppingForm] = useState(false);
  const [shoppingForm, setShoppingForm] = useState<Omit<ShoppingListItem, 'id' | 'terreiroId' | 'createdAt'>>({
    name: '', quantity: 1, unit: 'un', estimatedPrice: 0, purchased: false,
  });
  const [deleteShoppingModal, setDeleteShoppingModal] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  // Fetch remote data the first time each tab is opened.
  // Zustand actions are stable references created at store init, so they are
  // safe to omit from deps — including them would risk infinite re-fetches if
  // the store is ever recreated. activeTab is the only meaningful trigger here.
  useEffect(() => {
    if (activeTab === 'CASHFLOW') {
      fetchCashFlow();
    } else if (activeTab === 'INVENTORY') {
      fetchInventory();
      fetchShoppingList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const openWhatsApp = (phone: string, message?: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return;
    const number = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const text = message ? `&text=${encodeURIComponent(message)}` : '';
    const url = isMobile
      ? `whatsapp://send?phone=${number}${text}`
      : `https://web.whatsapp.com/send?phone=${number}${text}`;
    window.open(url, '_blank');
  };

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
    setNewBank({ bankName: '', bankCode: '', agency: '', accountNumber: '', accountType: 'Corrente', ownerName: '', ownerDocument: '', pixKey: '' });
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
              <button
                onClick={() => setActiveTab('CASHFLOW')}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'CASHFLOW' ? 'var(--neon-cyan)' : 'transparent', color: activeTab === 'CASHFLOW' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={14} /> Fluxo de Caixa
              </button>
              <button
                onClick={() => setActiveTab('INVENTORY')}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: activeTab === 'INVENTORY' ? 'var(--accent-gold, #e2b714)' : 'transparent', color: activeTab === 'INVENTORY' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={14} /> Estoque
              </button>
            </div>
          )}

          {canManageFinancial && view === 'LIST' && activeTab !== 'HISTORY' && activeTab !== 'CASHFLOW' && activeTab !== 'INVENTORY' && (
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
          {canManageFinancial && activeTab === 'CASHFLOW' && (
            <button
              onClick={() => { setShowCashFlowForm(v => !v); setEditingCashFlow(null); setCashFlowForm({ type: 'recebimento', description: '', amount: 0, date: '', realized: false, notes: '' }); }}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}
            >
              <Plus size={18} /> Nova Entrada
            </button>
          )}
          {canManageFinancial && activeTab === 'INVENTORY' && inventorySubTab === 'ITEMS' && (
            <button
              onClick={() => { setShowInventoryForm(v => !v); setEditingInventory(null); setInventoryForm({ name: '', category: '', unit: 'un', currentStock: 0, minimumStock: 0, unitPrice: 0, notes: '' }); }}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(226,183,20,0.15)', color: '#fff', border: '1px solid var(--accent-gold, #e2b714)', cursor: 'pointer' }}
            >
              <Plus size={18} /> Novo Item
            </button>
          )}
          {canManageFinancial && activeTab === 'INVENTORY' && inventorySubTab === 'SHOPPING' && (
            <button
              onClick={() => setShowShoppingForm(v => !v)}
              className="glass-panel glow-fx"
              style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 240, 255, 0.15)', color: '#fff', border: '1px solid var(--neon-cyan)', cursor: 'pointer' }}
            >
              <Plus size={18} /> Adicionar Item
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
                  {bankAccounts.map(bank => {
                    const linkedBank = bank.bankCode ? findBankByCode(bank.bankCode) : undefined;
                    const accentColor = linkedBank?.color || '#e2b714';
                    return (
                    <div key={bank.id} className="glass-panel" style={{ padding: '1.5rem', borderRadius: 12, borderTop: `3px solid ${accentColor}`, position: 'relative' }}>
                      {canManageFinancial && (
                        <button
                          onClick={() => setDeleteBankModal({ isOpen: true, bankId: bank.id, bankName: bank.bankName })}
                          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#ff4c4c', cursor: 'pointer' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        {linkedBank ? (
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: linkedBank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                            {getBankInitials(linkedBank.name)}
                          </div>
                        ) : (
                          <div style={{ background: 'rgba(226,183,20,0.1)', padding: '0.7rem', borderRadius: '50%' }}>
                            <Landmark size={24} color="#e2b714" />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{bank.bankName}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conta {bank.accountType}</span>
                        </div>
                      </div>
                      {/* Ações do banco */}
                      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {linkedBank ? (
                          <a href={linkedBank.url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: `1px solid ${linkedBank.color}`, background: `${linkedBank.color}18`, color: linkedBank.color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🌐 Internet Banking
                          </a>
                        ) : null}
                        {canManageFinancial && (
                          <button onClick={() => setBankSelectorModal({ isOpen: true, targetId: bank.id })}
                            style={{ padding: '0.4rem 0.9rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'var(--text-muted)' }}>
                            {linkedBank ? '🔄 Alterar Banco' : '🔗 Vincular Banco'}
                          </button>
                        )}
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
                  );
                  })}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteChargeModal({ isOpen: true, chargeId: charge.id, chargeTitle: charge.title });
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

                                  const memberPhone = !('name' in entity) ? ((entity as any).whatsapp || (entity as any).telefone || '') : '';
                                  const isActiveMember = !('name' in entity) && ((entity as any).spiritual?.situacaoCadastro ?? 'ativo') === 'ativo';
                                  const memberFirstName = !('name' in entity) ? (entity as any).nomeCompleto.split(' ')[0] : '';
                                  const chargeMsg = [
                                    `Olá${memberFirstName ? `, ${memberFirstName}` : ''}! 👋`,
                                    ``,
                                    `Segue o lembrete de cobrança do *${currentTerreiro?.name || 'Terreiro'}*:`,
                                    ``,
                                    `📋 *${charge.title}*`,
                                    `💰 Valor: *${formatCurrency(charge.amount)}*`,
                                    `📅 Vencimento: *${new Date(charge.dueDate).toLocaleDateString('pt-BR')}*`,
                                    charge.description ? `📝 ${charge.description}` : '',
                                    ``,
                                    `Em caso de dúvidas, entre em contato conosco. 🙏`,
                                  ].filter(Boolean).join('\n');
                                  return (
                                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: `1px solid ${hasPaid ? 'rgba(0,255,136,0.3)' : (hasNotified ? 'rgba(255, 204, 0, 0.3)' : 'transparent')}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasPaid ? '#00ff88' : (hasNotified ? '#ffcc00' : '#ff4c4c') }}></div>
                                        <span style={{ fontSize: '0.9rem', color: hasNotified && !hasPaid ? '#ffcc00' : '#fff' }}>{'name' in entity ? entity.name : entity.nomeCompleto}</span>
                                        {hasNotified && !hasPaid && <span style={{ fontSize: '0.6rem', background: '#ffcc00', color: '#000', padding: '0.1rem 0.3rem', borderRadius: 4 }}>NOTIFICOU</span>}
                                      </div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {isActiveMember && memberPhone && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); openWhatsApp(memberPhone, chargeMsg); }}
                                            title="Enviar cobrança via WhatsApp"
                                            style={{ padding: '0.25rem 0.5rem', borderRadius: 4, border: '1px solid rgba(37,211,102,0.4)', background: 'rgba(37,211,102,0.1)', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                          >
                                            <MessageCircle size={13} />
                                          </button>
                                        )}
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
                          style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto auto', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.overdue > 0 ? 'rgba(255,76,76,0.25)' : s.pending === 0 ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)'}`, transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>

                          {/* Nome */}
                          <div onClick={() => setSelectedMemberId(s.user.id)} style={{ cursor: 'pointer' }}>
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

                          {/* WhatsApp — somente ativo com número */}
                          {(() => {
                            const isActive = (s.user.spiritual?.situacaoCadastro ?? 'ativo') === 'ativo';
                            const phone = s.user.whatsapp || s.user.telefone || '';
                            return isActive && phone ? (
                              <button
                                onClick={() => openWhatsApp(phone)}
                                title="Abrir WhatsApp"
                                style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid rgba(37,211,102,0.4)', background: 'rgba(37,211,102,0.1)', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <MessageCircle size={15} />
                              </button>
                            ) : <div style={{ width: 30 }} />;
                          })()}

                          {/* Seta */}
                          <ChevronDown size={16} onClick={() => setSelectedMemberId(s.user.id)} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════
            FLUXO DE CAIXA TAB
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'CASHFLOW' && (() => {
          const totalRecebido = cashFlowEntries.filter(e => e.type === 'recebimento' && e.realized).reduce((s, e) => s + e.amount, 0);
          const totalPago = cashFlowEntries.filter(e => e.type === 'pagamento' && e.realized).reduce((s, e) => s + e.amount, 0);
          const prevReceber = cashFlowEntries.filter(e => e.type === 'previsao_recebimento' && !e.realized).reduce((s, e) => s + e.amount, 0);
          const prevPagar = cashFlowEntries.filter(e => e.type === 'previsao_pagamento' && !e.realized).reduce((s, e) => s + e.amount, 0);
          const saldoReal = totalRecebido - totalPago;
          const saldoProjetado = saldoReal + prevReceber - prevPagar;

          const typeConfig: Record<CashFlowEntry['type'], { label: string; color: string; icon: React.ReactNode }> = {
            recebimento: { label: 'Recebimento', color: '#00ff88', icon: <ArrowUpCircle size={15} /> },
            pagamento: { label: 'Pagamento', color: '#ff4c4c', icon: <ArrowDownCircle size={15} /> },
            previsao_recebimento: { label: 'Prev. Recebimento', color: '#00f0ff', icon: <ArrowUpCircle size={15} /> },
            previsao_pagamento: { label: 'Prev. Pagamento', color: '#ffaa00', icon: <ArrowDownCircle size={15} /> },
          };

          const handleCashFlowSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
              if (editingCashFlow) {
                await updateCashFlowEntry(editingCashFlow.id, cashFlowForm);
              } else {
                await addCashFlowEntry(cashFlowForm);
              }
              setShowCashFlowForm(false);
              setEditingCashFlow(null);
              setCashFlowForm({ type: 'recebimento', description: '', amount: 0, date: '', realized: false, notes: '' });
            } catch {
              alert('Erro ao salvar entrada. Verifique os dados e tente novamente.');
            }
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                  { label: 'Total Recebido', value: totalRecebido, color: '#00ff88', icon: <ArrowUpCircle size={14} /> },
                  { label: 'Total Pago', value: totalPago, color: '#ff4c4c', icon: <ArrowDownCircle size={14} /> },
                  { label: 'Prev. Receber', value: prevReceber, color: '#00f0ff', icon: <TrendingUp size={14} /> },
                  { label: 'Prev. Pagar', value: prevPagar, color: '#ffaa00', icon: <TrendingDown size={14} /> },
                  { label: 'Saldo Real', value: saldoReal, color: saldoReal >= 0 ? '#00ff88' : '#ff4c4c', icon: <CheckCircle size={14} /> },
                  { label: 'Saldo Projetado', value: saldoProjetado, color: saldoProjetado >= 0 ? '#00f0ff' : '#ff4c4c', icon: <TrendingUp size={14} /> },
                ].map(card => (
                  <div key={card.label} className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: `3px solid ${card.color}` }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: card.color }}>{card.icon}</span> {card.label}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: card.color, marginTop: '0.3rem' }}>{formatCurrency(card.value)}</div>
                  </div>
                ))}
              </div>

              {/* Inline form */}
              <AnimatePresence>
                {showCashFlowForm && (
                  <motion.form
                    key="cashflow-form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCashFlowSubmit}
                    className="glass-panel"
                    style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid var(--neon-cyan)', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflow: 'hidden' }}
                  >
                    <h4 style={{ margin: 0, color: 'var(--neon-cyan)' }}>{editingCashFlow ? 'Editar Entrada' : 'Nova Entrada de Fluxo de Caixa'}</h4>

                    {/* Type chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {(Object.entries(typeConfig) as [CashFlowEntry['type'], typeof typeConfig[CashFlowEntry['type']]][]).map(([key, cfg]) => (
                        <button
                          key={key} type="button"
                          onClick={() => setCashFlowForm(f => ({ ...f, type: key }))}
                          style={{ padding: '0.4rem 1rem', borderRadius: 20, border: `1px solid ${cashFlowForm.type === key ? cfg.color : 'var(--glass-border)'}`, background: cashFlowForm.type === key ? `${cfg.color}22` : 'transparent', color: cashFlowForm.type === key ? cfg.color : 'var(--text-muted)', cursor: 'pointer', fontWeight: cashFlowForm.type === key ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}
                        >
                          {cfg.icon} {cfg.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                      <Input label="Descrição *" placeholder="Ex: Doação de membro" value={cashFlowForm.description} onChange={v => setCashFlowForm(f => ({ ...f, description: v }))} required />
                      <Input label="Valor (R$) *" type="number" placeholder="0.00" value={cashFlowForm.amount.toString()} onChange={v => setCashFlowForm(f => ({ ...f, amount: Number(v) }))} required />
                      <Input label="Data *" type="date" value={cashFlowForm.date} onChange={v => setCashFlowForm(f => ({ ...f, date: v }))} required />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                      <Input label="Observações" placeholder="Notas adicionais..." value={cashFlowForm.notes} onChange={v => setCashFlowForm(f => ({ ...f, notes: v }))} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', paddingBottom: '0.8rem', color: cashFlowForm.realized ? '#00ff88' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={cashFlowForm.realized} onChange={e => setCashFlowForm(f => ({ ...f, realized: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#00ff88' }} />
                        Realizado
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => { setShowCashFlowForm(false); setEditingCashFlow(null); }}
                        style={{ padding: '0.7rem 1.5rem', border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                      <button type="submit"
                        style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: 8, background: 'var(--neon-cyan)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                        {editingCashFlow ? 'Salvar Alterações' : 'Adicionar'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Entries list */}
              <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
                {cashFlowEntries.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhuma entrada cadastrada. Clique em "Nova Entrada" para começar.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {cashFlowEntries.map(entry => {
                      const cfg = typeConfig[entry.type];
                      return (
                        <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${entry.realized ? `${cfg.color}44` : 'rgba(255,255,255,0.07)'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.8rem', borderRadius: 20, background: `${cfg.color}18`, color: cfg.color, fontSize: '0.78rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              {cfg.icon} {cfg.label}
                            </span>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{entry.description}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                {entry.notes && ` • ${entry.notes}`}
                                {entry.realized && <span style={{ color: '#00ff88', marginLeft: '0.4rem' }}>• Realizado</span>}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: cfg.color }}>{formatCurrency(entry.amount)}</span>
                            {canManageFinancial && (
                              <>
                                <button onClick={() => { setEditingCashFlow(entry); setCashFlowForm({ type: entry.type, description: entry.description, amount: entry.amount, date: entry.date, realized: entry.realized, notes: entry.notes }); setShowCashFlowForm(true); }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--neon-cyan)', padding: '0.3rem' }} title="Editar">
                                  <Pencil size={15} />
                                </button>
                                <button onClick={() => setDeleteCashFlowModal({ isOpen: true, id: entry.id, description: entry.description })}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4c4c', padding: '0.3rem' }} title="Excluir">
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════════════════
            ESTOQUE TAB
        ═══════════════════════════════════════════════════════ */}
        {activeTab === 'INVENTORY' && (() => {
          const belowMin = inventoryItems.filter(i => i.currentStock < i.minimumStock);
          const pendingShop = shoppingListItems.filter(i => !i.purchased);
          const purchasedShop = shoppingListItems.filter(i => i.purchased);
          const totalEstimated = pendingShop.reduce((s, i) => s + i.quantity * i.estimatedPrice, 0);

          const handleInventorySubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            try {
              if (editingInventory) {
                await updateInventoryItem(editingInventory.id, inventoryForm);
              } else if (inventoryAddTarget === 'SHOPPING') {
                await addShoppingListItem({
                  name: inventoryForm.name,
                  quantity: inventoryForm.minimumStock || 1,
                  unit: inventoryForm.unit,
                  estimatedPrice: inventoryForm.unitPrice,
                  purchased: false,
                });
              } else {
                await addInventoryItem(inventoryForm);
              }
              setShowInventoryForm(false);
              setEditingInventory(null);
              setInventoryForm({ name: '', category: '', unit: 'un', currentStock: 0, minimumStock: 0, unitPrice: 0, notes: '' });
              setInventoryAddTarget('STOCK');
            } catch {
              alert('Erro ao salvar item. Verifique os dados e tente novamente.');
            }
          };

          const handleShoppingSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            await addShoppingListItem(shoppingForm);
            setShowShoppingForm(false);
            setShoppingForm({ name: '', quantity: 1, unit: 'un', estimatedPrice: 0, purchased: false });
          };

          const handleAddToShoppingList = async (item: InventoryItem) => {
            await addShoppingListItem({
              name: item.name,
              quantity: item.minimumStock - item.currentStock,
              unit: item.unit,
              estimatedPrice: item.unitPrice,
              purchased: false,
              inventoryItemId: item.id,
            });
          };

          const handleClearPurchased = async () => {
            await Promise.all(purchasedShop.map(i => deleteShoppingListItem(i.id)));
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0.3rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: 10, width: 'fit-content' }}>
                <button onClick={() => setInventorySubTab('ITEMS')}
                  style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: inventorySubTab === 'ITEMS' ? 'var(--accent-gold, #e2b714)' : 'transparent', color: inventorySubTab === 'ITEMS' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Package size={14} /> Itens
                </button>
                <button onClick={() => setInventorySubTab('SHOPPING')}
                  style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: inventorySubTab === 'SHOPPING' ? 'var(--neon-cyan)' : 'transparent', color: inventorySubTab === 'SHOPPING' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShoppingCart size={14} /> Lista de Compras
                  {pendingShop.length > 0 && <span style={{ background: '#ff4c4c', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>{pendingShop.length}</span>}
                </button>
              </div>

              {/* ── SUB-ABA: ITENS ── */}
              {inventorySubTab === 'ITEMS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {/* Low stock alerts */}
                  {belowMin.length > 0 && (
                    <div className="glass-panel" style={{ padding: '1rem 1.2rem', border: '1px solid #ff4c4c', borderRadius: 12, background: 'rgba(255,76,76,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                        <Bell size={16} color="#ff4c4c" />
                        <strong style={{ color: '#ff4c4c' }}>{belowMin.length} item(ns) abaixo do estoque mínimo</strong>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {belowMin.map(i => (
                          <span key={i.id} style={{ padding: '0.3rem 0.8rem', background: 'rgba(255,76,76,0.15)', border: '1px solid rgba(255,76,76,0.4)', borderRadius: 20, fontSize: '0.8rem', color: '#ff4c4c' }}>
                            <AlertTriangle size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            {i.name} ({i.currentStock}/{i.minimumStock} {i.unit})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline form */}
                  <AnimatePresence>
                    {showInventoryForm && (
                      <motion.form
                        key="inventory-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleInventorySubmit}
                        className="glass-panel"
                        style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid var(--accent-gold, #e2b714)', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}
                      >
                        <h4 style={{ margin: 0, color: inventoryAddTarget === 'SHOPPING' ? 'var(--neon-cyan)' : 'var(--accent-gold, #e2b714)' }}>
                          {editingInventory ? 'Editar Item' : inventoryAddTarget === 'SHOPPING' ? 'Adicionar à Lista de Compras' : 'Novo Item de Estoque'}
                        </h4>

                        {/* Seletor de destino — só aparece quando não está editando */}
                        {!editingInventory && (
                          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.3rem', borderRadius: 10, width: 'fit-content' }}>
                            <button type="button" onClick={() => setInventoryAddTarget('STOCK')}
                              style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: inventoryAddTarget === 'STOCK' ? 'var(--accent-gold, #e2b714)' : 'transparent', color: inventoryAddTarget === 'STOCK' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                              <Package size={14} /> Adicionar ao Estoque
                            </button>
                            <button type="button" onClick={() => setInventoryAddTarget('SHOPPING')}
                              style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: inventoryAddTarget === 'SHOPPING' ? 'var(--neon-cyan)' : 'transparent', color: inventoryAddTarget === 'SHOPPING' ? '#000' : 'var(--text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                              <ShoppingCart size={14} /> Adicionar à Lista de Compras
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                          <Input label="Nome *" placeholder="Ex: Vela branca" value={inventoryForm.name} onChange={v => setInventoryForm(f => ({ ...f, name: v }))} required />
                          <Input label="Categoria" placeholder="Ex: Velas" value={inventoryForm.category} onChange={v => setInventoryForm(f => ({ ...f, category: v }))} />
                          <Input label="Unidade" placeholder="un, kg, L..." value={inventoryForm.unit} onChange={v => setInventoryForm(f => ({ ...f, unit: v }))} />
                        </div>
                        {inventoryAddTarget === 'STOCK' ? (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                              <Input label="Estoque Atual" type="number" value={inventoryForm.currentStock.toString()} onChange={v => setInventoryForm(f => ({ ...f, currentStock: Number(v) }))} />
                              <Input label="Estoque Mínimo" type="number" value={inventoryForm.minimumStock.toString()} onChange={v => setInventoryForm(f => ({ ...f, minimumStock: Number(v) }))} />
                              <Input label="Preço Unitário (R$)" type="number" value={inventoryForm.unitPrice.toString()} onChange={v => setInventoryForm(f => ({ ...f, unitPrice: Number(v) }))} />
                            </div>
                            <Input label="Observações" placeholder="Notas sobre o item..." value={inventoryForm.notes} onChange={v => setInventoryForm(f => ({ ...f, notes: v }))} />
                          </>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input label="Quantidade" type="number" placeholder="1" value={inventoryForm.minimumStock.toString()} onChange={v => setInventoryForm(f => ({ ...f, minimumStock: Number(v) }))} />
                            <Input label="Preço Estimado (R$)" type="number" placeholder="0.00" value={inventoryForm.unitPrice.toString()} onChange={v => setInventoryForm(f => ({ ...f, unitPrice: Number(v) }))} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => { setShowInventoryForm(false); setEditingInventory(null); }}
                            style={{ padding: '0.7rem 1.5rem', border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          <button type="submit"
                            style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: 8, background: inventoryAddTarget === 'SHOPPING' ? 'var(--neon-cyan)' : 'var(--accent-gold, #e2b714)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                            {editingInventory ? 'Salvar' : inventoryAddTarget === 'SHOPPING' ? 'Adicionar à Lista' : 'Adicionar ao Estoque'}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Items table */}
                  <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
                    {inventoryItems.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum item cadastrado. Clique em "Novo Item" para começar.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                              {['Nome', 'Categoria', 'Unidade', 'Estoque Atual', 'Mínimo', 'Valor Unit.', 'Valor Total', ''].map(h => (
                                <th key={h} style={{ padding: '0.6rem 0.8rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryItems.map(item => {
                              const isLow = item.currentStock < item.minimumStock;
                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isLow ? 'rgba(255,76,76,0.06)' : 'transparent' }}>
                                  <td style={{ padding: '0.7rem 0.8rem', fontWeight: 'bold', color: isLow ? '#ff4c4c' : 'var(--text-main)' }}>
                                    {isLow && <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 4, color: '#ff4c4c' }} />}
                                    {item.name}
                                  </td>
                                  <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-muted)' }}>{item.category || '—'}</td>
                                  <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-muted)' }}>{item.unit}</td>
                                  <td style={{ padding: '0.7rem 0.8rem', fontWeight: 'bold', color: isLow ? '#ff4c4c' : '#00ff88' }}>{item.currentStock}</td>
                                  <td style={{ padding: '0.7rem 0.8rem', color: 'var(--text-muted)' }}>{item.minimumStock}</td>
                                  <td style={{ padding: '0.7rem 0.8rem' }}>{formatCurrency(item.unitPrice)}</td>
                                  <td style={{ padding: '0.7rem 0.8rem', fontWeight: 'bold' }}>{formatCurrency(item.currentStock * item.unitPrice)}</td>
                                  <td style={{ padding: '0.7rem 0.8rem' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                      {isLow && (
                                        <button onClick={() => handleAddToShoppingList(item)} title="Adicionar à lista de compras"
                                          style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--neon-cyan)', background: 'rgba(0,240,255,0.1)', color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                          <ShoppingCart size={12} /> Lista
                                        </button>
                                      )}
                                      {canManageFinancial && (
                                        <>
                                          <button onClick={() => { setEditingInventory(item); setInventoryForm({ name: item.name, category: item.category, unit: item.unit, currentStock: item.currentStock, minimumStock: item.minimumStock, unitPrice: item.unitPrice, notes: item.notes }); setShowInventoryForm(true); }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--neon-cyan)', padding: '0.3rem' }} title="Editar">
                                            <Pencil size={14} />
                                          </button>
                                          <button onClick={() => setDeleteInventoryModal({ isOpen: true, id: item.id, name: item.name })}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4c4c', padding: '0.3rem' }} title="Excluir">
                                            <Trash2 size={14} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── SUB-ABA: LISTA DE COMPRAS ── */}
              {inventorySubTab === 'SHOPPING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid var(--neon-cyan)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Previsto</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--neon-cyan)', marginTop: '0.3rem' }}>{formatCurrency(totalEstimated)}</div>
                    </div>
                    <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid #ffaa00' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Itens Pendentes</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ffaa00', marginTop: '0.3rem' }}>{pendingShop.length}</div>
                    </div>
                    <div className="panel glass-panel" style={{ padding: '1.2rem', borderRadius: 12, borderLeft: '3px solid #00ff88' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Itens Comprados</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#00ff88', marginTop: '0.3rem' }}>{purchasedShop.length}</div>
                    </div>
                  </div>

                  {/* Inline form */}
                  <AnimatePresence>
                    {showShoppingForm && (
                      <motion.form
                        key="shopping-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleShoppingSubmit}
                        className="glass-panel"
                        style={{ padding: '1.5rem', borderRadius: 12, border: '1px solid var(--neon-cyan)', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}
                      >
                        <h4 style={{ margin: 0, color: 'var(--neon-cyan)' }}>Adicionar à Lista de Compras</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
                          <Input label="Item *" placeholder="Ex: Vela branca" value={shoppingForm.name} onChange={v => setShoppingForm(f => ({ ...f, name: v }))} required />
                          <Input label="Quantidade" type="number" value={shoppingForm.quantity.toString()} onChange={v => setShoppingForm(f => ({ ...f, quantity: Number(v) }))} />
                          <Input label="Unidade" placeholder="un, kg..." value={shoppingForm.unit} onChange={v => setShoppingForm(f => ({ ...f, unit: v }))} />
                          <Input label="Preço Estimado (R$)" type="number" value={shoppingForm.estimatedPrice.toString()} onChange={v => setShoppingForm(f => ({ ...f, estimatedPrice: Number(v) }))} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setShowShoppingForm(false)}
                            style={{ padding: '0.7rem 1.5rem', border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          <button type="submit"
                            style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: 8, background: 'var(--neon-cyan)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>
                            Adicionar
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Shopping list */}
                  <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={18} /> Lista de Compras</h3>
                      {purchasedShop.length > 0 && (
                        <button onClick={handleClearPurchased}
                          style={{ padding: '0.4rem 1rem', borderRadius: 8, border: '1px solid rgba(255,76,76,0.4)', background: 'rgba(255,76,76,0.1)', color: '#ff4c4c', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <X size={13} /> Limpar Comprados ({purchasedShop.length})
                        </button>
                      )}
                    </div>
                    {shoppingListItems.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Lista vazia. Adicione itens ou gere automaticamente a partir do estoque.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {shoppingListItems.map(item => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1rem', borderRadius: 8, background: item.purchased ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${item.purchased ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`, opacity: item.purchased ? 0.6 : 1 }}>
                            <input
                              type="checkbox"
                              checked={item.purchased}
                              onChange={() => toggleShoppingItemPurchased(item.id)}
                              style={{ width: 18, height: 18, accentColor: '#00ff88', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 'bold', textDecoration: item.purchased ? 'line-through' : 'none', color: item.purchased ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                {item.name}
                              </span>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '80px' }}>
                              {item.estimatedPrice > 0 && (
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: item.purchased ? 'var(--text-muted)' : 'var(--neon-cyan)' }}>
                                  {formatCurrency(item.quantity * item.estimatedPrice)}
                                </div>
                              )}
                            </div>
                            <button onClick={() => setDeleteShoppingModal({ isOpen: true, id: item.id, name: item.name })}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4c4c', padding: '0.3rem', flexShrink: 0 }} title="Remover">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                {activeTab === 'SYSTEM' ? <><Landmark size={20} /> Terreiros para Cobrança</> : <><Filter size={20} /> Membros Selecionados</>}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setNewCharge({...newCharge, assignedTo: (activeTab === 'SYSTEM' ? otherTerreiros : activeTargetUsers).map(u => u.id)})} className="glass-panel" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 4 }}>
                  Selecionar Todos
                </button>
                <button type="button" onClick={() => setNewCharge({...newCharge, assignedTo: []})} className="glass-panel" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4 }}>
                  Limpar
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 8 }}>
              {(activeTab === 'SYSTEM' ? otherTerreiros : activeTargetUsers).map(entity => {
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
              {(activeTab === 'SYSTEM' ? otherTerreiros : activeTargetUsers).length === 0 && (
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--text-muted)' }}>Banco <span style={{ color: 'var(--neon-purple)' }}>*</span></label>
                {newBank.bankCode ? (() => {
                  const b = findBankByCode(newBank.bankCode!);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', border: `1px solid ${b?.color || 'var(--glass-border)'}`, borderRadius: 8, background: `${b?.color || '#fff'}18` }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: b?.color || '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {getBankInitials(newBank.bankName || '')}
                      </div>
                      <span style={{ fontWeight: 600, color: b?.color || 'var(--text-main)', flex: 1 }}>{newBank.bankName}</span>
                      <button type="button" onClick={() => { setNewBank({ ...newBank, bankName: '', bankCode: '' }); setBankSelectorModal({ isOpen: true, targetId: 'form' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', textDecoration: 'underline' }}>Alterar</button>
                    </div>
                  );
                })() : (
                  <button type="button" onClick={() => setBankSelectorModal({ isOpen: true, targetId: 'form' })} style={{ padding: '0.8rem 1rem', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem' }}>
                    🏦 Selecionar banco...
                  </button>
                )}
              </div>
              
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

      {/* Modal seletor de banco */}
      {bankSelectorModal.isOpen && (() => {
        const filtered = BANKS.filter(b =>
          !bankSearch || b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.code.includes(bankSearch)
        );
        const handleSelectBank = async (bank: Bank) => {
          if (bankSelectorModal.targetId === 'form') {
            setNewBank(prev => ({ ...prev, bankName: bank.name, bankCode: bank.code }));
          } else {
            await updateBankAccount(bankSelectorModal.targetId, { bankName: bank.name, bankCode: bank.code });
          }
          setBankSelectorModal({ isOpen: false, targetId: '' });
          setBankSearch('');
        };
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: 560, maxHeight: '85vh', borderRadius: 16, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🏦 Selecionar Banco</h3>
                <button onClick={() => { setBankSelectorModal({ isOpen: false, targetId: '' }); setBankSearch(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>✕</button>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar banco pelo nome ou código BACEN..."
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 8, border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.7rem' }}>
                {filtered.length === 0 ? (
                  <p style={{ gridColumn: '1/-1', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum banco encontrado.</p>
                ) : filtered.map(bank => (
                  <button key={bank.code} onClick={() => handleSelectBank(bank)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 0.5rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${bank.color}22`; (e.currentTarget as HTMLElement).style.borderColor = bank.color; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                      {getBankInitials(bank.name)}
                    </div>
                    <span style={{ fontSize: '0.72rem', textAlign: 'center', color: 'var(--text-main)', lineHeight: 1.3 }}>{bank.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cód. {bank.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <ConfirmationModal
        isOpen={deleteChargeModal.isOpen}
        onClose={() => setDeleteChargeModal({ isOpen: false, chargeId: '', chargeTitle: '' })}
        onConfirm={async () => {
          try {
            await deleteCharge(deleteChargeModal.chargeId);
          } catch {
            alert('Erro ao excluir a cobrança. Verifique sua conexão e tente novamente.');
          }
        }}
        title="Excluir Cobrança"
        message={`Tem certeza que deseja excluir a cobrança "${deleteChargeModal.chargeTitle}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={deleteBankModal.isOpen}
        onClose={() => setDeleteBankModal({ isOpen: false, bankId: '', bankName: '' })}
        onConfirm={async () => {
          try {
            await deleteBankAccount(deleteBankModal.bankId);
          } catch {
            alert('Erro ao excluir a conta bancária. Verifique sua conexão e tente novamente.');
          }
        }}
        title="Excluir Conta Bancária"
        message={`Tem certeza que deseja excluir a conta "${deleteBankModal.bankName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={deleteCashFlowModal.isOpen}
        onClose={() => setDeleteCashFlowModal({ isOpen: false, id: '', description: '' })}
        onConfirm={async () => {
          try {
            await deleteCashFlowEntry(deleteCashFlowModal.id);
          } catch {
            alert('Erro ao excluir a entrada. Verifique sua conexão e tente novamente.');
          } finally {
            setDeleteCashFlowModal({ isOpen: false, id: '', description: '' });
          }
        }}
        title="Excluir Entrada"
        message={`Tem certeza que deseja excluir "${deleteCashFlowModal.description}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={deleteInventoryModal.isOpen}
        onClose={() => setDeleteInventoryModal({ isOpen: false, id: '', name: '' })}
        onConfirm={async () => {
          try {
            await deleteInventoryItem(deleteInventoryModal.id);
          } catch {
            alert('Erro ao excluir o item. Verifique sua conexão e tente novamente.');
          } finally {
            setDeleteInventoryModal({ isOpen: false, id: '', name: '' });
          }
        }}
        title="Excluir Item de Estoque"
        message={`Tem certeza que deseja excluir "${deleteInventoryModal.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={deleteShoppingModal.isOpen}
        onClose={() => setDeleteShoppingModal({ isOpen: false, id: '', name: '' })}
        onConfirm={async () => {
          try {
            await deleteShoppingListItem(deleteShoppingModal.id);
          } catch {
            alert('Erro ao remover item da lista. Verifique sua conexão e tente novamente.');
          } finally {
            setDeleteShoppingModal({ isOpen: false, id: '', name: '' });
          }
        }}
        title="Remover da Lista de Compras"
        message={`Tem certeza que deseja remover "${deleteShoppingModal.name}" da lista?`}
        confirmLabel="Remover"
        variant="danger"
      />
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
