import { create } from 'zustand';
import { supabase, supabaseRead } from '../lib/supabase';

export type Role = 'ADMIN' | 'FINANCEIRO' | 'SECRETARIA' | 'USER';

// ─── Cash Flow ─────────────────────────────────────────────────
export interface CashFlowEntry {
  id: string;
  terreiroId: string;
  type: 'recebimento' | 'pagamento' | 'previsao_recebimento' | 'previsao_pagamento';
  description: string;
  amount: number;
  date: string;
  realized: boolean;
  notes: string;
  createdAt: string;
}

// ─── Inventory ─────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  terreiroId: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitPrice: number;
  notes: string;
  createdAt: string;
}

export interface ShoppingListItem {
  id: string;
  terreiroId: string;
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  purchased: boolean;
  createdAt: string;
}

export interface SpiritualData {
  // Novos campos
  situacaoCadastro: 'ativo' | 'inativo';
  segmentoUmbanda: boolean;
  segmentoKimbanda: boolean;
  segmentoNacao: boolean;
  cidadeEstadoOrigem: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  whatsapp?: string;

  // Umbanda
  umbandaOrigem: string;
  umbandaObrigaCabeca: string;
  umbandaObrigaCorpo: string;
  umbandaObrigaCaboclo: string;
  umbandaObrigaPretoVelho: string;
  umbandaObs: string;
  umbandaAnteriorMata: string[];
  umbandaAnteriorMar: string[];
  umbandaAnteriorEntidades: string[];
  umbandaAnteriorCaboclo: string[];
  umbandaAnteriorPretoVelho: string[];

  // Quimbanda
  quimbandaOrigem: string;
  quimbandaObrigaFrente: string;
  quimbandaObrigaCompanheiro: string;
  quimbandaCompanheiroTipo?: string;
  quimbandaObs: string[];
  quimbandaCruzamentos: string[];
  quimbandaAssentamentos: string;
  quimbandaKaballah: string;

  // Nação
  nacaoOrigem: string;
  nacaoObrigaCabeca: string;
  nacaoObrigaCorpo: string;
  nacaoObrigaPes: string;
  nacaoPassagem: string;
  nacaoObs: string[];

  // Cronograma
  obrigacoes: { data: string; descricao: string }[];

  // Isenção financeira
  isencaoAtiva?: boolean;
  isencaoTipo?: 'meses' | 'permanente';
  isencaoMeses?: number;
  isencaoDataInicio?: string;
  isencaoDataFim?: string;
  isencaoMotivo?: string;
  isencaoConcedidaPor?: string;

  // Retro-compatibility fields
  orixaFrente?: string;
  tempoUmbanda?: string;
  tipoMedium?: string;
  appRole?: Role;
}

export const defaultSpiritualData: SpiritualData = {
  situacaoCadastro: 'ativo',
  segmentoUmbanda: false,
  segmentoKimbanda: false,
  segmentoNacao: false,
  cidadeEstadoOrigem: '',
  cep: '',
  cidade: '',
  estado: '',
  whatsapp: '',
  umbandaOrigem: '',
  umbandaObrigaCabeca: '',
  umbandaObrigaCorpo: '',
  umbandaObrigaCaboclo: '',
  umbandaObrigaPretoVelho: '',
  umbandaObs: '',
  umbandaAnteriorMata: [],
  umbandaAnteriorMar: [],
  umbandaAnteriorEntidades: [],
  umbandaAnteriorCaboclo: [],
  umbandaAnteriorPretoVelho: [],
  quimbandaOrigem: '',
  quimbandaObrigaFrente: '',
  quimbandaObrigaCompanheiro: '',
  quimbandaObs: [],
  quimbandaCruzamentos: [],
  quimbandaAssentamentos: '',
  quimbandaKaballah: '',
  nacaoOrigem: '',
  nacaoObrigaCabeca: '',
  nacaoObrigaCorpo: '',
  nacaoObrigaPes: '',
  nacaoPassagem: '',
  nacaoObs: [],
  obrigacoes: [
    { data: '', descricao: '' },
    { data: '', descricao: '' },
    { data: '', descricao: '' }
  ],
  orixaFrente: '',
  tempoUmbanda: '',
  tipoMedium: ''
};

export interface User {
  id: string;
  role: Role;
  isMaster?: boolean;
  isPanelAdmin?: boolean;
  cpf: string;
  password?: string;
  palavraChave?: string;
  nomeCompleto: string;
  nomeDeSanto: string;
  dataNascimento: string;
  rg: string;
  endereco: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  telefone: string;
  email?: string;
  whatsapp?: string;
  profissao?: string;
  nomePais?: string;
  photoUrl?: string;
  spiritual: SpiritualData;
  createdAt: string;
  terreiroId: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  createdBy: string;
  terreiroId: string;
}

export interface Broadcast {
  id: string;
  terreiroId?: string;
  title: string;
  body: string;
  url?: string;
  createdAt: string;
  createdBy?: string;
  isGlobal: boolean;
}

export type ChargeType = 'Mensalidade' | 'Colaboração' | 'Evento' | 'Outros';

export interface Charge {
  id: string;
  terreiroId: string;
  title: string;
  description: string;
  type: ChargeType;
  amount: number;
  dueDate: string;
  assignedTo: string[];
  paidBy: string[];
  notifiedBy: string[];
  createdAt: string;
  targetType?: 'USER' | 'SYSTEM';
}

export interface BankAccount {
  id: string;
  terreiroId: string;
  bankName: string;
  bankCode?: string;
  agency: string;
  accountNumber: string;
  accountType: 'Corrente' | 'Poupança';
  pixKey?: string;
  ownerName: string;
  ownerDocument: string;
}

export interface Terreiro {
  id: string;
  name: string;
  logoUrl: string;
  endereco: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  adminId: string;
  masterId?: string;
  pixKey?: string;
  isBlocked?: boolean;
  createdAt: string;
  // Seguimento da casa (tradição(ões) praticada(s))
  segmentoUmbanda: boolean;
  segmentoKimbanda: boolean;
  segmentoNacao: boolean;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
}

interface AppState {
  terreiros: Terreiro[];
  users: User[];
  events: Event[];
  broadcasts: Broadcast[];
  charges: Charge[];
  bankAccounts: BankAccount[];
  currentUser: User | null;
  currentTerreiroId: string | null;
  isLoading: boolean;
  masterPixKey: string;
  setMasterPixKey: (key: string) => void;
  theme: 'dark' | 'light';
  initialized: boolean;

  // Computed / Selectors
  getCurrentTerreiro: () => Terreiro | undefined;
  getCurrentTerreiroSeguimento: () => { segmentoUmbanda: boolean; segmentoKimbanda: boolean; segmentoNacao: boolean };
  getFilteredUsers: () => User[];
  getFilteredEvents: () => Event[];
  getFilteredBroadcasts: () => Broadcast[];
  getUserTerreiros: () => Terreiro[];
  getFilteredCharges: () => Charge[];
  getMyCharges: () => Charge[];
  getSystemChargesForCurrentTerreiro: () => Charge[];
  getSystemChargesIssuedByMaster: () => Charge[];
  getBankAccountsForCurrentTerreiro: () => BankAccount[];

  // ─── Cash Flow state ────────────────────────────────────
  cashFlowEntries: CashFlowEntry[];
  fetchCashFlow: () => Promise<void>;
  addCashFlowEntry: (entry: Omit<CashFlowEntry, 'id' | 'terreiroId' | 'createdAt'>) => Promise<void>;
  updateCashFlowEntry: (id: string, data: Partial<CashFlowEntry>) => Promise<void>;
  deleteCashFlowEntry: (id: string) => Promise<void>;

  // ─── Inventory state ────────────────────────────────────
  inventoryItems: InventoryItem[];
  fetchInventory: () => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'terreiroId' | 'createdAt'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;

  // ─── Shopping List state ────────────────────────────────
  shoppingListItems: ShoppingListItem[];
  fetchShoppingList: () => Promise<void>;
  addShoppingListItem: (item: Omit<ShoppingListItem, 'id' | 'terreiroId' | 'createdAt'>) => Promise<void>;
  updateShoppingListItem: (id: string, data: Partial<ShoppingListItem>) => Promise<void>;
  deleteShoppingListItem: (id: string) => Promise<void>;
  toggleShoppingItemPurchased: (id: string) => Promise<void>;

  // Actions
  initializeData: (forcedTerreiroId?: string) => Promise<void>;
  checkCpf: (cpf: string) => Promise<{ exists: boolean; hasPassword: boolean; userName?: string }>;
  setupPassword: (cpf: string, password: string, palavraChave?: string) => Promise<boolean>;
  recoverPassword: (cpf: string, palavraChave: string, novaSenha: string) => Promise<boolean>;
  login: (cpf: string, password?: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  switchTerreiro: (terreiroId: string) => void;
  addTerreiro: (terreiroData: Omit<Terreiro, 'id' | 'createdAt'>) => Promise<void>;
  updateTerreiro: (id: string, terreiroData: Partial<Terreiro>) => Promise<void>;
  deleteTerreiro: (id: string) => Promise<void>;
  toggleBlockTerreiro: (id: string, blocked: boolean) => Promise<void>;
  registerTerreiro: (
    terreiroData: { name: string; endereco: string; cep?: string; cidade?: string; estado?: string; segmentoUmbanda?: boolean; segmentoKimbanda?: boolean; segmentoNacao?: boolean },
    adminData: Omit<User, 'id' | 'createdAt' | 'terreiroId' | 'role'>
  ) => Promise<boolean>;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'terreiroId'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  clearTerreiroMembers: () => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'terreiroId'>) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  fetchBroadcasts: () => Promise<void>;
  subscribeToBroadcasts: () => () => void;
  addBroadcast: (broadcast: Omit<Broadcast, 'id' | 'createdAt'>) => Promise<void>;
  deleteBroadcast: (id: string) => Promise<void>;
  addCharge: (charge: Omit<Charge, 'id' | 'terreiroId' | 'createdAt'>) => Promise<void>;
  updateCharge: (id: string, data: Partial<Charge>) => Promise<void>;
  deleteCharge: (id: string) => Promise<void>;
  markChargeAsPaid: (chargeId: string, userId: string, isPaid: boolean) => Promise<void>;
  notifyPayment: (chargeId: string, userId: string) => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'terreiroId'>) => Promise<void>;
  updateBankAccount: (id: string, data: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  sendPush: (params: { terreiroId?: string; userId?: string; role?: string; title: string; body: string; url?: string }) => Promise<void>;
  sendPushToTerreiro: (terreiroId: string, title: string, body: string, url?: string) => Promise<void>;
  resetStore: () => void;
}

// ─── Helpers: convert DB row ↔ App model ──────────────────────

function dbToTerreiro(row: any): Terreiro {
  const seg = row.seguimento || {};
  return {
    id: row.id,
    name: row.name,
    logoUrl: (row.logo_url && !row.logo_url.startsWith('data:')) ? row.logo_url : '',
    endereco: row.endereco || '',
    cep: row.cep || '',
    cidade: row.cidade || '',
    estado: row.estado || '',
    adminId: row.admin_id || '',
    masterId: row.master_id,
    pixKey: row.pix_key,
    isBlocked: row.is_blocked || false,
    createdAt: row.created_at,
    segmentoUmbanda: seg.umbanda ?? true,
    segmentoKimbanda: seg.kimbanda ?? false,
    segmentoNacao: seg.nacao ?? false,
    evolutionApiUrl: row.evolution_api_url || '',
    evolutionApiKey: row.evolution_api_key || '',
    evolutionInstance: row.evolution_instance || '',
  };
}

export function dbToUser(row: any): User {
  return {
    id: row.id,
    role: (row.spiritual?.appRole || row.role || 'USER').toUpperCase() as Role,
    isMaster: row.is_master || false,
    isPanelAdmin: row.is_panel_admin || false,
    cpf: row.cpf,
    password: row.password,
    palavraChave: row.palavra_chave,
    nomeCompleto: row.nome_completo,
    nomeDeSanto: row.nome_de_santo || '',
    dataNascimento: row.data_nascimento || '',
    rg: row.rg || '',
    endereco: row.endereco || '',
    telefone: row.telefone || '',
    email: row.email || '',
    profissao: row.profissao || '',
    nomePais: row.nome_pais || '',
    photoUrl: (row.photo_url && !row.photo_url.startsWith('data:')) ? row.photo_url : '',
    spiritual: { ...defaultSpiritualData, ...(row.spiritual || {}) },
    createdAt: row.created_at,
    terreiroId: row.terreiro_id,
  };
}

function dbToEvent(row: any): Event {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    description: row.description || '',
    createdBy: row.created_by || '',
    terreiroId: row.terreiro_id,
  };
}

function dbToBroadcast(row: any): Broadcast {
  return {
    id: row.id,
    terreiroId: row.terreiro_id,
    title: row.title,
    body: row.body,
    url: row.url || '',
    createdAt: row.created_at,
    createdBy: row.created_by || '',
    isGlobal: row.is_global || false,
  };
}

function dbToCharge(row: any): Charge {
  return {
    id: row.id,
    terreiroId: row.terreiro_id,
    title: row.title,
    description: row.description || '',
    type: row.type as ChargeType,
    amount: Number(row.amount),
    dueDate: row.due_date || '',
    assignedTo: row.assigned_to || [],
    paidBy: row.paid_by || [],
    notifiedBy: row.notified_by || [],
    createdAt: row.created_at,
    targetType: row.target_type,
  };
}

function dbToBankAccount(row: any): BankAccount {
  return {
    id: row.id,
    terreiroId: row.terreiro_id,
    bankName: row.bank_name,
    bankCode: row.bank_code || '',
    agency: row.agency || '',
    accountNumber: row.account_number || '',
    accountType: row.account_type as 'Corrente' | 'Poupança',
    pixKey: row.pix_key || '',
    ownerName: row.owner_name || '',
    ownerDocument: row.owner_document || '',
  };
}

// ─── Store ─────────────────────────────────────────────────────

// ─── Helpers: Cash Flow / Inventory ───────────────────────────

function dbToCashFlowEntry(row: any): CashFlowEntry {
  return {
    id: row.id,
    terreiroId: row.terreiro_id,
    type: row.type,
    description: row.description || '',
    amount: Number(row.amount),
    date: row.date || '',
    realized: row.realized ?? false,
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function dbToInventoryItem(row: any): InventoryItem {
  return {
    id: row.id,
    terreiroId: row.terreiro_id,
    name: row.name || '',
    category: row.category || '',
    unit: row.unit || 'un',
    currentStock: Number(row.current_stock),
    minimumStock: Number(row.minimum_stock),
    unitPrice: Number(row.unit_price),
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function dbToShoppingListItem(row: any): ShoppingListItem {
  return {
    id: row.id,
    terreiroId: row.terreiro_id,
    inventoryItemId: row.inventory_item_id || undefined,
    name: row.name || '',
    quantity: Number(row.quantity),
    unit: row.unit || 'un',
    estimatedPrice: Number(row.estimated_price),
    purchased: row.purchased ?? false,
    createdAt: row.created_at,
  };
}

export const useStore = create<AppState>()((set, get) => ({
  terreiros: [],
  users: [],
  events: [],
  broadcasts: [],
  charges: [],
  bankAccounts: [],
  cashFlowEntries: [],
  inventoryItems: [],
  shoppingListItems: [],
  currentUser: null,
  currentTerreiroId: null,
  isLoading: false,
  theme: (localStorage.getItem('terreiro-theme') as 'dark' | 'light') || 'dark',
  masterPixKey: 'financeiro@terreiras.app',
  initialized: false,

  setMasterPixKey: (key) => set({ masterPixKey: key }),

  // ─── Initialize: fetch all data from Supabase ──────────
  initializeData: async (forcedTerreiroId?: string) => {
    // Se já estiver inicializado e não houver um ID forçado, não faz nada
    if (get().initialized && !forcedTerreiroId) return;
    
    set({ isLoading: true });
    console.log('🔄 Iniciando carga de dados do Supabase...');
    
    // Obtém o ID do terreiro do estado ou do parâmetro
    const terreiroId = forcedTerreiroId || get().currentTerreiroId;
    const currentUser = get().currentUser;
    const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
    
    // Sanitize terreiroId for the query
    const validTerreiroId = (terreiroId && terreiroId !== 'undefined' && terreiroId !== 'null') ? terreiroId : null;
    
    try {
      // Timeout de 15 segundos para evitar travamento infinito
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados do Supabase')), 15000)
      );

      // Prepara as queries com isolamento de dados
      // Usa supabaseRead (réplica de leitura quando configurada) para reduzir
      // carga no banco primário e melhorar latência em múltiplas regiões.
      const terreiroQuery   = supabaseRead.from('terreiros').select('*');
      const usersQuery      = supabaseRead.from('users').select('*');
      const eventsQuery     = supabaseRead.from('events').select('*');
      const broadcastsQuery = supabaseRead.from('broadcasts').select('*').order('created_at', { ascending: false });
      // Duas queries separadas para cobranças: internas do terreiro + SYSTEM atribuídas a este terreiro
      const chargesUserQuery   = supabaseRead.from('charges').select('*');
      const chargesSystemQuery = supabaseRead.from('charges').select('*');
      const bankQuery          = supabaseRead.from('bank_accounts').select('*');

      // Aplica filtros se não for Master
      if (!isMaster && validTerreiroId) {
        terreiroQuery.eq('id', validTerreiroId);
        usersQuery.eq('terreiro_id', validTerreiroId);
        eventsQuery.eq('terreiro_id', validTerreiroId);
        broadcastsQuery.or(`terreiro_id.eq.${validTerreiroId},is_global.eq.true`);
        // Cobranças internas: mesma terreiro_id
        chargesUserQuery.eq('terreiro_id', validTerreiroId);
        // Cobranças SYSTEM onde este terreiro está em assigned_to
        chargesSystemQuery
          .eq('target_type', 'SYSTEM')
          .contains('assigned_to', [validTerreiroId]);
        bankQuery.eq('terreiro_id', validTerreiroId);
      } else if (!isMaster && !validTerreiroId) {
        usersQuery.limit(0);
        eventsQuery.limit(0);
        broadcastsQuery.eq('is_global', true);
        chargesUserQuery.limit(0);
        chargesSystemQuery.limit(0);
        bankQuery.limit(0);
      } else {
        // Master: carrega tudo, sem necessidade da query SYSTEM separada
        chargesSystemQuery.limit(0);
      }

      const [terreiroRes, userRes, eventRes, broadcastRes, chargeUserRes, chargeSystemRes, bankRes] = await Promise.race([
        Promise.all([
          terreiroQuery,
          usersQuery,
          eventsQuery,
          broadcastsQuery,
          chargesUserQuery,
          chargesSystemQuery,
          bankQuery,
        ]),
        timeoutPromise
      ]) as any[];

      // Mescla cobranças internas + SYSTEM, removendo duplicatas pelo id
      const allChargesRaw = [...(chargeUserRes.data || []), ...(chargeSystemRes.data || [])];
      const uniqueChargesRaw = allChargesRaw.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);

      console.log('✅ Dados carregados com sucesso' + (terreiroId ? ` para o terreiro ${terreiroId}` : ''));

      set({
        terreiros: (terreiroRes.data || []).map(dbToTerreiro),
        users: (userRes.data || []).map(dbToUser),
        events: (eventRes.data || []).map(dbToEvent),
        broadcasts: (broadcastRes.data || []).map(dbToBroadcast),
        charges: uniqueChargesRaw.map(dbToCharge),
        bankAccounts: (bankRes.data || []).map(dbToBankAccount),
        initialized: true,
      });
    } catch (err: any) {
      console.error('❌ Erro ao carregar dados do Supabase:', err.message);
      set({ initialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Selectors ──────────────────────────────────────────
  getCurrentTerreiro: () => {
    const { terreiros, currentTerreiroId } = get();
    return terreiros.find(t => t.id === currentTerreiroId);
  },

  getCurrentTerreiroSeguimento: () => {
    const { terreiros, users, currentTerreiroId } = get();
    const terreiro = terreiros.find(t => t.id === currentTerreiroId);
    if (!terreiro) return { segmentoUmbanda: true, segmentoKimbanda: false, segmentoNacao: false };

    // Lê o seguimento diretamente do terreiro (fonte oficial)
    // Fallback para admin user (terreiros antigos sem coluna seguimento)
    const hasTerreiroSeguimento =
      terreiro.segmentoUmbanda === true ||
      terreiro.segmentoKimbanda === true ||
      terreiro.segmentoNacao === true;

    if (hasTerreiroSeguimento) {
      return {
        segmentoUmbanda: terreiro.segmentoUmbanda,
        segmentoKimbanda: terreiro.segmentoKimbanda,
        segmentoNacao: terreiro.segmentoNacao,
      };
    }

    // Fallback: lê do admin da casa (terreiros cadastrados antes da migração)
    const adminUser = users.find(u => u.id === terreiro.adminId);
    if (adminUser?.spiritual) {
      return {
        segmentoUmbanda: adminUser.spiritual.segmentoUmbanda ?? true,
        segmentoKimbanda: adminUser.spiritual.segmentoKimbanda ?? false,
        segmentoNacao: adminUser.spiritual.segmentoNacao ?? false,
      };
    }

    return { segmentoUmbanda: true, segmentoKimbanda: false, segmentoNacao: false };
  },

  getFilteredUsers: () => {
    const { users, currentTerreiroId } = get();
    if (!currentTerreiroId) return [];
    return users.filter(u => u.terreiroId === currentTerreiroId);
  },

  getFilteredEvents: () => {
    const { events, currentTerreiroId } = get();
    if (!currentTerreiroId) return [];
    return events.filter(e => e.terreiroId === currentTerreiroId);
  },

  getFilteredBroadcasts: () => {
    const { broadcasts, currentTerreiroId } = get();
    // Sempre retorna os globais + os específicos da casa atual
    return broadcasts.filter(b => b.isGlobal || b.terreiroId === currentTerreiroId);
  },

  getUserTerreiros: () => {
    const { currentUser, terreiros } = get();
    if (!currentUser) return [];
    if (currentUser.isMaster || currentUser.isPanelAdmin) return terreiros;
    return terreiros.filter(t => t.id === currentUser.terreiroId);
  },

  getFilteredCharges: () => {
    const { charges, currentTerreiroId } = get();
    if (!currentTerreiroId) return [];
    return charges.filter(c => c.terreiroId === currentTerreiroId && (!c.targetType || c.targetType === 'USER'));
  },

  getMyCharges: () => {
    const { charges, currentUser } = get();
    if (!currentUser) return [];
    return charges.filter(c => c.terreiroId === currentUser.terreiroId && c.assignedTo.includes(currentUser.id) && (!c.targetType || c.targetType === 'USER'));
  },

  getSystemChargesForCurrentTerreiro: () => {
    const { charges, currentTerreiroId } = get();
    if (!currentTerreiroId) return [];
    return charges.filter(c => c.targetType === 'SYSTEM' && c.assignedTo.includes(currentTerreiroId));
  },

  getSystemChargesIssuedByMaster: () => {
    const { charges, currentTerreiroId, currentUser } = get();
    if (!currentUser?.isMaster && !currentUser?.isPanelAdmin) return [];
    return charges.filter(c => c.targetType === 'SYSTEM' && c.terreiroId === currentTerreiroId);
  },

  getBankAccountsForCurrentTerreiro: () => {
    const { bankAccounts, currentTerreiroId } = get();
    if (!currentTerreiroId) return [];
    return bankAccounts.filter(b => b.terreiroId === currentTerreiroId);
  },

  // ─── Auth Actions ───────────────────────────────────────
  checkCpf: async (cpf) => {
    set({ isLoading: true });
    try {
      const normalizedCpf = cpf.trim().toLowerCase();
      const { data } = await supabase
        .from('users')
        .select('id, nome_completo, password')
        .ilike('cpf', normalizedCpf)
        .limit(1);

      const user = data?.[0];
      return {
        exists: !!user,
        hasPassword: !!user?.password,
        userName: user?.nome_completo
      };
    } finally {
      set({ isLoading: false });
    }
  },

  setupPassword: async (cpf, password, palavraChave) => {
    set({ isLoading: true });
    try {
      const normalizedCpf = cpf.trim().toLowerCase();
      const updateData: any = { password };
      if (palavraChave) updateData.palavra_chave = palavraChave.trim().toLowerCase();

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .ilike('cpf', normalizedCpf);

      if (error) return false;

      // Update local state
      const users = get().users.map(u =>
        u.cpf.trim().toLowerCase() === normalizedCpf
          ? { ...u, password, ...(palavraChave && { palavraChave: palavraChave.trim().toLowerCase() }) }
          : u
      );
      set({ users });
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  recoverPassword: async (cpf, palavraChave, novaSenha) => {
    set({ isLoading: true });
    try {
      const normalizedCpf = cpf.trim().toLowerCase();
      const normalizedPalavra = palavraChave.trim().toLowerCase();

      // Check if user exists with matching palavra_chave
      const { data } = await supabase
        .from('users')
        .select('id, palavra_chave')
        .ilike('cpf', normalizedCpf)
        .limit(1);

      const user = data?.[0];
      if (!user || user.palavra_chave !== normalizedPalavra) return false;

      const { error } = await supabase
        .from('users')
        .update({ password: novaSenha })
        .eq('id', user.id);

      if (error) return false;

      const users = get().users.map(u =>
        u.id === user.id ? { ...u, password: novaSenha } : u
      );
      set({ users });
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (cpf, password) => {
    set({ isLoading: true });
    try {
      const normalizedCpf = cpf.trim().toLowerCase();

      // Ensure data is loaded
      if (!get().initialized) {
        await get().initializeData();
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .ilike('cpf', normalizedCpf)
        .limit(1);

      const row = data?.[0];
      if (row && row.password && row.password === password) {
        const user = dbToUser(row);
        set({ currentUser: user, currentTerreiroId: user.terreiroId });
        
        // Reload data with the now-known terreiroId
        await get().initializeData(user.terreiroId);

        // Save session in localStorage for persistence
        localStorage.setItem('terreiro-session', JSON.stringify({ userId: user.id, terreiroId: user.terreiroId }));
        return true;
      }
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ currentUser: null, currentTerreiroId: null });
    localStorage.removeItem('terreiro-session');
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('terreiro-theme', newTheme);
    set({ theme: newTheme });
  },

  switchTerreiro: (terreiroId) => {
    set({ currentTerreiroId: terreiroId });
    const session = localStorage.getItem('terreiro-session');
    if (session) {
      const parsed = JSON.parse(session);
      parsed.terreiroId = terreiroId;
      localStorage.setItem('terreiro-session', JSON.stringify(parsed));
    }
  },

  // ─── Terreiro Actions ───────────────────────────────────
  addTerreiro: async (terreiroData) => {
    set({ isLoading: true });
    try {
      const { currentUser } = get();
      const { data, error } = await supabase
        .from('terreiros')
        .insert({
          name: terreiroData.name,
          logo_url: terreiroData.logoUrl || '',
          endereco: terreiroData.endereco || '',
          admin_id: currentUser?.id || '',
          master_id: currentUser?.isMaster ? currentUser.id : null,
          pix_key: terreiroData.pixKey || null,
        })
        .select()
        .single();

      if (!error && data) {
        set({ terreiros: [...get().terreiros, dbToTerreiro(data)] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateTerreiro: async (id, terreiroData) => {
    set({ isLoading: true });
    try {
      const updateData: any = {};
      if (terreiroData.name !== undefined) updateData.name = terreiroData.name;
      if (terreiroData.logoUrl !== undefined) updateData.logo_url = terreiroData.logoUrl;
      if (terreiroData.endereco !== undefined) updateData.endereco = terreiroData.endereco;
      if (terreiroData.pixKey !== undefined) updateData.pix_key = terreiroData.pixKey;
      if (terreiroData.isBlocked !== undefined) updateData.is_blocked = terreiroData.isBlocked;
      if (terreiroData.evolutionApiUrl !== undefined) updateData.evolution_api_url = terreiroData.evolutionApiUrl;
      if (terreiroData.evolutionApiKey !== undefined) updateData.evolution_api_key = terreiroData.evolutionApiKey;
      if (terreiroData.evolutionInstance !== undefined) updateData.evolution_instance = terreiroData.evolutionInstance;

      // Atualiza seguimento se algum campo foi passado
      if (
        terreiroData.segmentoUmbanda !== undefined ||
        terreiroData.segmentoKimbanda !== undefined ||
        terreiroData.segmentoNacao !== undefined
      ) {
        const current = get().terreiros.find(t => t.id === id);
        updateData.seguimento = {
          umbanda: terreiroData.segmentoUmbanda ?? current?.segmentoUmbanda ?? true,
          kimbanda: terreiroData.segmentoKimbanda ?? current?.segmentoKimbanda ?? false,
          nacao: terreiroData.segmentoNacao ?? current?.segmentoNacao ?? false,
        };
      }

      const { error } = await supabase.from('terreiros').update(updateData).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar terreiro:', error.message);
        throw new Error(error.message);
      }

      set({
        terreiros: get().terreiros.map(t => t.id === id ? { ...t, ...terreiroData } : t),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleBlockTerreiro: async (id, blocked) => {
    set({ isLoading: true });
    try {
      await supabase.from('terreiros').update({ is_blocked: blocked }).eq('id', id);
      set({
        terreiros: get().terreiros.map(t => t.id === id ? { ...t, isBlocked: blocked } : t),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTerreiro: async (id) => {
    set({ isLoading: true });
    try {
      console.log('Tentando excluir terreiro:', id);
      const { error } = await supabase.from('terreiros').delete().eq('id', id);
      if (error) {
        console.error('Erro de deleção do Supabase (terreiro):', error);
        throw error;
      }

      set({
        terreiros: get().terreiros.filter(t => t.id !== id),
        users: get().users.filter(u => u.terreiroId !== id),
        charges: get().charges.filter(c => c.terreiroId !== id),
        events: get().events.filter(e => e.terreiroId !== id),
        bankAccounts: get().bankAccounts.filter(b => b.terreiroId !== id),
      });
      
      if (get().currentTerreiroId === id) {
        const remaining = get().terreiros.filter(t => t.id !== id);
        set({ currentTerreiroId: remaining.length > 0 ? remaining[0].id : null });
      }
    } catch (err) {
      console.error('Error deleting terreiro:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  registerTerreiro: async (terreiroData, adminData) => {
    set({ isLoading: true });
    try {
      const { currentUser } = get();

      // Check CPF
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .ilike('cpf', adminData.cpf.trim().toLowerCase())
        .limit(1);
      if (existing && existing.length > 0) return false;

      // Monta o objeto de seguimento da casa
      const seguimento = {
        umbanda: terreiroData.segmentoUmbanda ?? true,
        kimbanda: terreiroData.segmentoKimbanda ?? false,
        nacao: terreiroData.segmentoNacao ?? false,
      };

      // Create terreiro
      const { data: newTerreiro, error: tError } = await supabase
        .from('terreiros')
        .insert({
          name: terreiroData.name,
          endereco: terreiroData.endereco,
          logo_url: '',
          admin_id: '',
          master_id: currentUser?.isMaster ? currentUser.id : null,
          seguimento,
        })
        .select()
        .single();

      if (tError || !newTerreiro) {
        console.error('Error creating terreiro:', tError);
        set({ isLoading: false });
        return false;
      }

      // Create admin user — spiritual recebe o mesmo seguimento da casa
      const { data: newAdmin, error: uErr } = await supabase
        .from('users')
        .insert({
          role: 'ADMIN',
          cpf: adminData.cpf,
          password: adminData.password || null,
          nome_completo: adminData.nomeCompleto,
          nome_de_santo: adminData.nomeDeSanto || '',
          data_nascimento: adminData.dataNascimento || '',
          rg: adminData.rg || '',
          endereco: adminData.endereco || '',
          telefone: adminData.telefone || '',
          email: adminData.email || '',
          profissao: adminData.profissao || '',
          nome_pais: adminData.nomePais || '',
          spiritual: {
            ...adminData.spiritual,
            segmentoUmbanda: seguimento.umbanda,
            segmentoKimbanda: seguimento.kimbanda,
            segmentoNacao: seguimento.nacao,
            cep: adminData.cep || adminData.spiritual?.cep || '',
            cidade: adminData.cidade || adminData.spiritual?.cidade || '',
            estado: adminData.estado || adminData.spiritual?.estado || '',
            whatsapp: adminData.whatsapp || adminData.spiritual?.whatsapp || adminData.telefone || '',
          },
          terreiro_id: newTerreiro.id,
        })
        .select()
        .single();

      if (uErr || !newAdmin) return false;

      // Update terreiro with admin_id
      await supabase.from('terreiros').update({ admin_id: newAdmin.id }).eq('id', newTerreiro.id);

      set({
        terreiros: [...get().terreiros, dbToTerreiro({ ...newTerreiro, admin_id: newAdmin.id })],
        users: [...get().users, dbToUser(newAdmin)],
      });
      return true;
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── User Actions ───────────────────────────────────────
  addUser: async (userData) => {
    set({ isLoading: true });
    try {
      const { currentTerreiroId } = get();
      if (!currentTerreiroId) return;

      const dbRole = (userData.role === 'FINANCEIRO' || userData.role === 'SECRETARIA') ? 'USER' : userData.role;
      const spiritualWithRole = {
        ...defaultSpiritualData,
        ...(userData.spiritual || {}),
        appRole: userData.role,
        cep: userData.cep || userData.spiritual?.cep || '',
        cidade: userData.cidade || userData.spiritual?.cidade || '',
        estado: userData.estado || userData.spiritual?.estado || '',
        whatsapp: userData.whatsapp || userData.spiritual?.whatsapp || userData.telefone || '',
      };

      const { data, error } = await supabase
        .from('users')
        .insert({
          role: (dbRole || 'USER').toUpperCase(),
          is_master: userData.isMaster || false,
          is_panel_admin: userData.isPanelAdmin || false,
          cpf: userData.cpf,
          password: userData.password || null,
          nome_completo: userData.nomeCompleto,
          nome_de_santo: userData.nomeDeSanto || '',
          data_nascimento: userData.dataNascimento || '',
          rg: userData.rg || '',
          endereco: userData.endereco || '',
          telefone: userData.telefone || '',
          email: userData.email || '',
          profissao: userData.profissao || '',
          nome_pais: userData.nomePais || '',
          photo_url: userData.photoUrl || '',
          spiritual: spiritualWithRole,
          terreiro_id: currentTerreiroId,
        })
        .select()
        .single();

      if (!error && data) {
        set({ users: [...get().users, dbToUser(data)] });
        
        // Notify the new user
        get().sendPush({
          userId: data.id,
          title: 'Bem-vindo(a)!',
          body: `Seu cadastro no ${get().getCurrentTerreiro()?.name || 'Terreiro'} foi concluído.`,
          url: '/'
        }).catch(() => {});
      } else if (error) {
        console.error('❌ Erro ao adicionar usuário no Supabase:', error.message);
        throw error;
      }
    } catch (err: any) {
      console.error('❌ Exceção ao adicionar usuário:', err.message);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true });
    try {
      const { users, currentUser } = get();
      const existingUser = users.find(u => u.id === id);
      if (!existingUser) return;

      console.log('📝 Chamando updateUser para ID:', id, 'com dados:', userData);
      
      const dbUpdate: any = {};
      // Mapping explicitly and filtered undefined to avoid overwriting with null/undefined accidentally
      const dbRole = (userData.role === 'FINANCEIRO' || userData.role === 'SECRETARIA') ? 'USER' : userData.role;

      const fields: Record<string, any> = {
        nome_completo: userData.nomeCompleto,
        nome_de_santo: userData.nomeDeSanto,
        data_nascimento: userData.dataNascimento,
        rg: userData.rg,
        endereco: userData.endereco,
        telefone: userData.telefone,
        email: userData.email,
        profissao: userData.profissao,
        nome_pais: userData.nomePais,
        photo_url: userData.photoUrl,
        cpf: userData.cpf,
        password: userData.password,
        role: dbRole ? dbRole.toUpperCase() : undefined,
        is_master: userData.isMaster,
        is_panel_admin: userData.isPanelAdmin
      };

      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) {
          dbUpdate[key] = value;
        }
      });

      console.log('🔧 Objeto de atualização construído (dbUpdate):', dbUpdate);
      
      // Handle the spiritual JSONB field
      // We merge existing spiritual data with new userData.spiritual, or individual flat fields if provided
      if (userData.role || userData.spiritual || userData.cep !== undefined || userData.cidade !== undefined || userData.estado !== undefined || userData.whatsapp !== undefined) {
        const baseSpiritual = { ...defaultSpiritualData, ...(existingUser.spiritual || {}), ...(userData.spiritual || {}) };
        
        dbUpdate.spiritual = {
          ...baseSpiritual,
          appRole: userData.role || baseSpiritual.appRole,
          cep: userData.cep ?? (userData.spiritual?.cep || existingUser.cep || baseSpiritual.cep || ''),
          cidade: userData.cidade ?? (userData.spiritual?.cidade || existingUser.cidade || baseSpiritual.cidade || ''),
          estado: userData.estado ?? (userData.spiritual?.estado || existingUser.estado || baseSpiritual.estado || ''),
          whatsapp: userData.whatsapp ?? (userData.spiritual?.whatsapp || existingUser.whatsapp || baseSpiritual.whatsapp || ''),
        };
      }

      console.log('📡 Enviando update para o Supabase (dbUpdate):', dbUpdate);
      const { error } = await supabase.from('users').update(dbUpdate).eq('id', id);

      if (error) {
        console.error('❌ Erro ao atualizar usuário no Supabase:', error.message);
        throw new Error(`Erro ao atualizar no banco: ${error.message}`);
      }

      console.log('✅ Usuário atualizado com sucesso no Supabase');

      // Update local state
      const updatedUser = { ...existingUser, ...userData };
      // Ensure local state has the flat fields updated if they were part of the update
      if (dbUpdate.spiritual) {
        updatedUser.cep = dbUpdate.spiritual.cep;
        updatedUser.cidade = dbUpdate.spiritual.cidade;
        updatedUser.estado = dbUpdate.spiritual.estado;
        updatedUser.whatsapp = dbUpdate.spiritual.whatsapp;
      }

      set({
        users: users.map(u => u.id === id ? updatedUser : u),
      });

      if (currentUser && currentUser.id === id) {
        set({ currentUser: updatedUser });
      }

      // Notify user about profile update
      get().sendPush({
        userId: id,
        title: 'Perfil Atualizado',
        body: 'Suas informações de perfil foram atualizadas com sucesso.',
        url: '/profile'
      }).catch(() => {});
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true });
    try {
      console.log('Tentando excluir usuário:', id);
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error('Erro de deleção do Supabase (usuário):', error);
        throw error;
      }

      set({
        users: get().users.filter(u => u.id !== id),
        charges: get().charges.filter(c => !c.assignedTo.includes(id)),
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Apaga somente os membros da casa atual, preservando o terreiro e o admin
  clearTerreiroMembers: async () => {
    set({ isLoading: true });
    try {
      const { currentTerreiroId, currentUser, users } = get();
      if (!currentTerreiroId) return;

      // Mantém o admin/currentUser — apaga todos os outros membros da casa
      const adminId = currentUser?.id;
      const toDelete = users.filter(
        u => u.terreiroId === currentTerreiroId && u.id !== adminId
      );

      if (toDelete.length === 0) return;

      const ids = toDelete.map(u => u.id);

      const { error } = await supabase
        .from('users')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Erro ao limpar membros:', error);
        throw error;
      }

      set({
        users: get().users.filter(u => !ids.includes(u.id)),
        charges: get().charges.filter(c => !c.assignedTo.some(id => ids.includes(id))),
      });
    } catch (err) {
      console.error('Erro ao limpar membros do terreiro:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Event Actions ──────────────────────────────────────
  addEvent: async (eventData) => {
    set({ isLoading: true });
    try {
      const { currentTerreiroId } = get();
      if (!currentTerreiroId) return;

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          date: eventData.date,
          description: eventData.description || '',
          created_by: eventData.createdBy || '',
          terreiro_id: currentTerreiroId,
        })
        .select()
        .single();

      if (!error && data) {
        const newEvent = dbToEvent(data);
        set({ events: [...get().events, newEvent] });
        // Fire push notification to all terreiro members (non-blocking)
        get().sendPushToTerreiro(
          currentTerreiroId,
          `📅 Novo Evento: ${eventData.title}`,
          eventData.description || `Evento agendado para ${eventData.date}`,
          '/events'
        ).catch(() => {/* silent */});
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateEvent: async (id, eventData) => {
    set({ isLoading: true });
    try {
      await supabase.from('events').update({
        title: eventData.title,
        date: eventData.date,
        description: eventData.description,
      }).eq('id', id);

      set({
        events: get().events.map(e => e.id === id ? { ...e, ...eventData } : e),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      set({ events: get().events.filter(e => e.id !== id) });
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBroadcasts: async () => {
    const { currentTerreiroId, currentUser } = get();
    let query = supabaseRead.from('broadcasts').select('*');
    
    // Masters see ALL broadcasts. Others see their terreiro + global
    const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;
    if (!isMaster) {
      if (currentTerreiroId) {
        query = query.or(`terreiro_id.eq.${currentTerreiroId},is_global.eq.true`);
      } else {
        query = query.eq('is_global', true);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ broadcasts: data.map(dbToBroadcast) });
    }
  },

  subscribeToBroadcasts: () => {
    const { currentTerreiroId, currentUser } = get();
    const isMaster = !!currentUser?.isMaster || !!currentUser?.isPanelAdmin;

    const channel = supabase
      .channel('broadcasts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'broadcasts' },
        (payload) => {
          const newBroadcast = dbToBroadcast(payload.new);
          // Filtra: masters veem tudo; outros apenas globais ou do próprio terreiro
          const isVisible =
            isMaster ||
            newBroadcast.isGlobal ||
            newBroadcast.terreiroId === currentTerreiroId;

          if (isVisible) {
            set((state) => ({
              broadcasts: [newBroadcast, ...state.broadcasts.filter(b => b.id !== newBroadcast.id)],
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  addBroadcast: async (broadcastData) => {
    set({ isLoading: true });
    try {
      const { currentTerreiroId, users, terreiros } = get();
      const { data, error } = await supabase
        .from('broadcasts')
        .insert({
          title: broadcastData.title,
          body: broadcastData.body,
          url: broadcastData.url || '',
          is_global: broadcastData.isGlobal || false,
          created_by: broadcastData.createdBy || '',
          terreiro_id: broadcastData.isGlobal ? null : currentTerreiroId,
        })
        .select()
        .single();

      if (!error && data) {
        const newBroadcast = dbToBroadcast(data);
        set({ broadcasts: [newBroadcast, ...get().broadcasts] });

        // Enviar WhatsApp para membros com número cadastrado
        const EVOLUTION_URL = import.meta.env.VITE_EVOLUTION_URL || '';
        const EVOLUTION_KEY = import.meta.env.VITE_EVOLUTION_KEY || '';
        if (EVOLUTION_URL && EVOLUTION_KEY) {
          const { sendWhatsAppMessage } = await import('../utils/evolutionApi');
          const msg = `📢 *${broadcastData.title}*\n\n${broadcastData.body}`;

          if (broadcastData.isGlobal) {
            const terreiroIds = [...new Set(users.map(u => u.terreiroId).filter(Boolean))];
            for (const tid of terreiroIds) {
              const terreiro = terreiros.find(t => t.id === tid);
              if (!terreiro) continue;
              const instanceName = `orum-${tid}`;
              const config = { url: EVOLUTION_URL, apiKey: EVOLUTION_KEY, instance: instanceName };
              const members = users.filter(u => u.terreiroId === tid && (u.whatsapp || u.telefone));
              for (const member of members) {
                const phone = (member.whatsapp || member.telefone || '').replace(/\D/g, '');
                if (phone.length >= 10) {
                  sendWhatsAppMessage(config, phone, msg).catch(() => {});
                }
              }
            }
          } else if (currentTerreiroId) {
            const instanceName = `orum-${currentTerreiroId}`;
            const config = { url: EVOLUTION_URL, apiKey: EVOLUTION_KEY, instance: instanceName };
            const members = users.filter(u => u.terreiroId === currentTerreiroId && (u.whatsapp || u.telefone));
            for (const member of members) {
              const phone = (member.whatsapp || member.telefone || '').replace(/\D/g, '');
              if (phone.length >= 10) {
                sendWhatsAppMessage(config, phone, msg).catch(() => {});
              }
            }
          }
        }

        // Enviar push para todos do terreiro se não for global
        if (!broadcastData.isGlobal && currentTerreiroId) {
          get().sendPushToTerreiro(
            currentTerreiroId,
            `📢 Comunicado: ${broadcastData.title}`,
            broadcastData.body,
            broadcastData.url || '/home'
          ).catch(() => {});
        } else if (broadcastData.isGlobal) {
          // Push global opcional ou logica futura
          console.log('Broadcast Global enviado');
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBroadcast: async (id) => {
    const { error } = await supabase.from('broadcasts').delete().eq('id', id);
    if (error) {
      console.error('[deleteBroadcast] Erro ao excluir:', error);
      throw new Error(error.message);
    }
    set(state => ({ broadcasts: state.broadcasts.filter(b => b.id !== id) }));
  },

  // ─── Push Notification Action ────────────────────────────
  sendPush: async ({ terreiroId, userId, role, title, body, url = '/' }) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) return;

      await fetch(
        `${supabaseUrl}/functions/v1/send-push`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ terreiroId, userId, role, title, body, url }),
        }
      );
    } catch (err) {
      console.warn('[Push] Falha ao enviar notificação push:', err);
    }
  },

  sendPushToTerreiro: async (terreiroId, title, body, url = '/') => {
    return get().sendPush({ terreiroId, title, body, url });
  },

  // ─── Charge Actions ─────────────────────────────────────
  addCharge: async (chargeData) => {
    set({ isLoading: true });
    try {
      const { currentTerreiroId } = get();
      if (!currentTerreiroId) return;

      const { data, error } = await supabase
        .from('charges')
        .insert({
          terreiro_id: currentTerreiroId,
          title: chargeData.title,
          description: chargeData.description || '',
          type: chargeData.type,
          amount: chargeData.amount,
          due_date: chargeData.dueDate || '',
          assigned_to: chargeData.assignedTo || [],
          paid_by: chargeData.paidBy || [],
          notified_by: chargeData.notifiedBy || [],
          target_type: chargeData.targetType || null,
        })
        .select()
        .single();

      if (!error && data) {
        set({ charges: [...get().charges, dbToCharge(data)] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateCharge: async (id, data) => {
    set({ isLoading: true });
    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
      if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
      if (data.paidBy !== undefined) updateData.paid_by = data.paidBy;
      if (data.notifiedBy !== undefined) updateData.notified_by = data.notifiedBy;

      await supabase.from('charges').update(updateData).eq('id', id);

      set({
        charges: get().charges.map(c => c.id === id ? { ...c, ...data } : c),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  markChargeAsPaid: async (chargeId, userId, isPaid) => {
    set({ isLoading: true });
    try {
      const charge = get().charges.find(c => c.id === chargeId);
      if (!charge) return;

      let newPaidBy = [...charge.paidBy];
      let newNotifiedBy = [...(charge.notifiedBy || [])];

      if (isPaid) {
        if (!newPaidBy.includes(userId)) newPaidBy.push(userId);
        newNotifiedBy = newNotifiedBy.filter(id => id !== userId);
      } else {
        newPaidBy = newPaidBy.filter(id => id !== userId);
      }

      await supabase.from('charges').update({
        paid_by: newPaidBy,
        notified_by: newNotifiedBy,
      }).eq('id', chargeId);

      set({
        charges: get().charges.map(c =>
          c.id === chargeId ? { ...c, paidBy: newPaidBy, notifiedBy: newNotifiedBy } : c
        ),
      });

      // Notify the user that payment was confirmed
      if (isPaid) {
        get().sendPush({
          userId: userId,
          title: 'Pagamento Confirmado',
          body: `Seu pagamento para "${charge.title}" foi confirmado pela tesouraria.`,
          url: '/financial'
        }).catch(() => {});
      }
    } finally {
      set({ isLoading: false });
    }
  },

  notifyPayment: async (chargeId, userId) => {
    set({ isLoading: true });
    try {
      const charge = get().charges.find(c => c.id === chargeId);
      if (!charge) return;

      const newNotifiedBy = [...(charge.notifiedBy || [])];
      if (!newNotifiedBy.includes(userId)) newNotifiedBy.push(userId);

      await supabase.from('charges').update({ notified_by: newNotifiedBy }).eq('id', chargeId);

      set({
        charges: get().charges.map(c =>
          c.id === chargeId ? { ...c, notifiedBy: newNotifiedBy } : c
        ),
      });

      // Notify Finance Team (targeted by role)
      get().sendPush({
        terreiroId: charge.terreiroId,
        role: 'FINANCEIRO',
        title: 'Novo Aviso de Pagamento',
        body: `Um membro notificou o pagamento da cobrança: ${charge.title}`,
        url: '/financial'
      }).catch(() => {});
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCharge: async (id) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.from('charges').delete().eq('id', id);
      if (error) throw error;
      set({ charges: get().charges.filter(c => c.id !== id) });
    } catch (err) {
      console.error('Erro ao excluir cobrança:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Bank Account Actions ──────────────────────────────
  addBankAccount: async (accountData) => {
    set({ isLoading: true });
    try {
      const { currentTerreiroId } = get();
      if (!currentTerreiroId) return;

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          terreiro_id: currentTerreiroId,
          bank_name: accountData.bankName,
          bank_code: accountData.bankCode || '',
          agency: accountData.agency || '',
          account_number: accountData.accountNumber || '',
          account_type: accountData.accountType || 'Corrente',
          pix_key: accountData.pixKey || '',
          owner_name: accountData.ownerName || '',
          owner_document: accountData.ownerDocument || '',
        })
        .select()
        .single();

      if (!error && data) {
        set({ bankAccounts: [...get().bankAccounts, dbToBankAccount(data)] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateBankAccount: async (id, data) => {
    set({ isLoading: true });
    try {
      const updateData: any = {};
      if (data.bankName !== undefined) updateData.bank_name = data.bankName;
      if (data.bankCode !== undefined) updateData.bank_code = data.bankCode;
      if (data.agency !== undefined) updateData.agency = data.agency;
      if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
      if (data.accountType !== undefined) updateData.account_type = data.accountType;
      if (data.pixKey !== undefined) updateData.pix_key = data.pixKey;
      if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
      if (data.ownerDocument !== undefined) updateData.owner_document = data.ownerDocument;

      await supabase.from('bank_accounts').update(updateData).eq('id', id);

      set({
        bankAccounts: get().bankAccounts.map(b => b.id === id ? { ...b, ...data } : b),
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBankAccount: async (id) => {
    set({ isLoading: true });
    try {
      console.log('Tentando excluir conta bancária:', id);
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) {
        console.error('Erro de deleção do Supabase (banco):', error);
        throw error;
      }
      set({
        bankAccounts: get().bankAccounts.filter(b => b.id !== id),
      });
    } catch (err) {
      console.error('Error deleting bank account:', err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Cash Flow Actions ─────────────────────────────────
  fetchCashFlow: async () => {
    const { currentTerreiroId } = get();
    if (!currentTerreiroId) return;
    const { data, error } = await supabaseRead
      .from('cash_flow_entries')
      .select('*')
      .eq('terreiro_id', currentTerreiroId)
      .order('date', { ascending: false });
    if (!error && data) {
      set({ cashFlowEntries: data.map(dbToCashFlowEntry) });
    }
  },

  addCashFlowEntry: async (entry) => {
    const { currentTerreiroId } = get();
    if (!currentTerreiroId) return;
    const { data, error } = await supabase
      .from('cash_flow_entries')
      .insert({
        terreiro_id: currentTerreiroId,
        type: entry.type,
        description: entry.description,
        amount: entry.amount,
        date: entry.date,
        realized: entry.realized,
        notes: entry.notes || '',
      })
      .select()
      .single();
    if (error) throw error;
    if (data) set({ cashFlowEntries: [dbToCashFlowEntry(data), ...get().cashFlowEntries] });
  },

  updateCashFlowEntry: async (id, data) => {
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.realized !== undefined) updateData.realized = data.realized;
    if (data.notes !== undefined) updateData.notes = data.notes;
    const { error } = await supabase.from('cash_flow_entries').update(updateData).eq('id', id);
    if (!error) {
      set({ cashFlowEntries: get().cashFlowEntries.map(e => e.id === id ? { ...e, ...data } : e) });
    }
  },

  deleteCashFlowEntry: async (id) => {
    const { error } = await supabase.from('cash_flow_entries').delete().eq('id', id);
    if (error) throw error;
    set({ cashFlowEntries: get().cashFlowEntries.filter(e => e.id !== id) });
  },

  // ─── Inventory Actions ─────────────────────────────────
  fetchInventory: async () => {
    const { currentTerreiroId } = get();
    if (!currentTerreiroId) return;
    const { data, error } = await supabaseRead
      .from('inventory_items')
      .select('*')
      .eq('terreiro_id', currentTerreiroId)
      .order('name', { ascending: true });
    if (!error && data) {
      set({ inventoryItems: data.map(dbToInventoryItem) });
    }
  },

  addInventoryItem: async (item) => {
    const { currentTerreiroId } = get();
    if (!currentTerreiroId) return;
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        terreiro_id: currentTerreiroId,
        name: item.name,
        category: item.category || '',
        unit: item.unit || 'un',
        current_stock: item.currentStock,
        minimum_stock: item.minimumStock,
        unit_price: item.unitPrice,
        notes: item.notes || '',
      })
      .select()
      .single();
    if (error) throw error;
    if (data) set({ inventoryItems: [...get().inventoryItems, dbToInventoryItem(data)].sort((a, b) => a.name.localeCompare(b.name)) });
  },

  updateInventoryItem: async (id, data) => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.currentStock !== undefined) updateData.current_stock = data.currentStock;
    if (data.minimumStock !== undefined) updateData.minimum_stock = data.minimumStock;
    if (data.unitPrice !== undefined) updateData.unit_price = data.unitPrice;
    if (data.notes !== undefined) updateData.notes = data.notes;
    const { error } = await supabase.from('inventory_items').update(updateData).eq('id', id);
    if (!error) {
      set({ inventoryItems: get().inventoryItems.map(i => i.id === id ? { ...i, ...data } : i) });
    }
  },

  deleteInventoryItem: async (id) => {
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
    set({ inventoryItems: get().inventoryItems.filter(i => i.id !== id) });
  },

  // ─── Shopping List Actions ─────────────────────────────
  fetchShoppingList: async () => {
    const { currentTerreiroId } = get();
    if (!currentTerreiroId) return;
    const { data, error } = await supabaseRead
      .from('shopping_list_items')
      .select('*')
      .eq('terreiro_id', currentTerreiroId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({ shoppingListItems: data.map(dbToShoppingListItem) });
    }
  },

  addShoppingListItem: async (item) => {
    const { currentTerreiroId } = get();
    if (!currentTerreiroId) return;
    const { data, error } = await supabase
      .from('shopping_list_items')
      .insert({
        terreiro_id: currentTerreiroId,
        inventory_item_id: item.inventoryItemId || null,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || 'un',
        estimated_price: item.estimatedPrice,
        purchased: item.purchased ?? false,
      })
      .select()
      .single();
    if (!error && data) {
      set({ shoppingListItems: [dbToShoppingListItem(data), ...get().shoppingListItems] });
    }
  },

  updateShoppingListItem: async (id, data) => {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.estimatedPrice !== undefined) updateData.estimated_price = data.estimatedPrice;
    if (data.purchased !== undefined) updateData.purchased = data.purchased;
    const { error } = await supabase.from('shopping_list_items').update(updateData).eq('id', id);
    if (!error) {
      set({ shoppingListItems: get().shoppingListItems.map(i => i.id === id ? { ...i, ...data } : i) });
    }
  },

  deleteShoppingListItem: async (id) => {
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
    if (error) throw error;
    set({ shoppingListItems: get().shoppingListItems.filter(i => i.id !== id) });
  },

  toggleShoppingItemPurchased: async (id) => {
    const item = get().shoppingListItems.find(i => i.id === id);
    if (!item) return;
    const newVal = !item.purchased;
    const { error } = await supabase.from('shopping_list_items').update({ purchased: newVal }).eq('id', id);
    if (!error) {
      set({ shoppingListItems: get().shoppingListItems.map(i => i.id === id ? { ...i, purchased: newVal } : i) });
    }
  },

  resetStore: () => {
    localStorage.removeItem('terreiro-session');
    localStorage.removeItem('terreiro-theme');
    set({
      terreiros: [],
      users: [],
      events: [],
      charges: [],
      bankAccounts: [],
      cashFlowEntries: [],
      inventoryItems: [],
      shoppingListItems: [],
      currentUser: null,
      currentTerreiroId: null,
      isLoading: false,
      theme: 'dark',
      initialized: false,
    });
    window.location.reload();
  },
}));
