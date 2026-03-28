import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'ADMIN' | 'USER';

export interface SpiritualData {
  tempoUmbanda: string;
  religiaoAnterior: string;
  orixaFrente: string;
  orixaAdjunto: string;
  tipoMedium: string;
  chefeCoroa: string;
  orixas: string[];
  entidades: string[];
  paiDeSantoAnterior: string;
  dataEntrada: string;
  historicoObrigacoes: string;
}

export interface User {
  id: string;
  role: Role;
  isMaster?: boolean; // Flag para identificar o admin geral do sistema
  isPanelAdmin?: boolean; // Administrador de todo o painel (pode ver todos os terreiros)
  cpf: string;
  password?: string;
  palavraChave?: string; // Usada para recuperação de senha
  nomeCompleto: string;
  nomeDeSanto: string;
  dataNascimento: string;
  rg: string;
  endereco: string;
  telefone: string;
  email?: string;
  profissao?: string;
  nomePais?: string;
  photoUrl?: string; // Base64 profile photo
  spiritual: SpiritualData;
  createdAt: string;
  terreiroId: string; // Multi-tenant: vincula usuário a um terreiro
}

export interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  createdBy: string;
  terreiroId: string; // Multi-tenant: vincula evento a um terreiro
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
  assignedTo: string[]; // IDs de usuários ou IDs de terreiros (depende de targetType)
  paidBy: string[]; // IDs de usuários ou IDs de terreiros que pagaram
  notifiedBy: string[]; // IDs de quem avisou que pagou (aguarda confirmação)
  createdAt: string;
  targetType?: 'USER' | 'SYSTEM';
}

export interface BankAccount {
  id: string;
  terreiroId: string;
  bankName: string;
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
  adminId: string; // ID do administrador local
  masterId?: string; // ID do Master que criou/gerencia o SaaS
  pixKey?: string; // Chave PIX para recebimentos dos membros
  isBlocked?: boolean; // Controle SaaS
}

interface AppState {
  // Data
  terreiros: Terreiro[];
  users: User[];
  events: Event[];
  charges: Charge[];
  bankAccounts: BankAccount[];
  currentUser: User | null;
  currentTerreiroId: string | null;
  isLoading: boolean;
  masterPixKey: string;
  setMasterPixKey: (key: string) => void;
  theme: 'dark' | 'light';

  // Computed / Selectors
  getCurrentTerreiro: () => Terreiro | undefined;
  getFilteredUsers: () => User[];
  getFilteredEvents: () => Event[];
  getUserTerreiros: () => Terreiro[];
  getFilteredCharges: () => Charge[];
  getMyCharges: () => Charge[];
  getSystemChargesForCurrentTerreiro: () => Charge[];
  getSystemChargesIssuedByMaster: () => Charge[];
  getBankAccountsForCurrentTerreiro: () => BankAccount[];

  // Actions
  checkCpf: (cpf: string) => Promise<{ exists: boolean; hasPassword: boolean; userName?: string }>;
  setupPassword: (cpf: string, password: string, palavraChave?: string) => Promise<boolean>;
  recoverPassword: (cpf: string, palavraChave: string, novaSenha: string) => Promise<boolean>;
  login: (cpf: string, password?: string) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  switchTerreiro: (terreiroId: string) => void;
  addTerreiro: (terreiroData: Omit<Terreiro, 'id'>) => Promise<void>;
  updateTerreiro: (id: string, terreiroData: Partial<Terreiro>) => Promise<void>;
  deleteTerreiro: (id: string) => Promise<void>;
  toggleBlockTerreiro: (id: string, blocked: boolean) => Promise<void>;
  registerTerreiro: (terreiroData: { name: string; endereco: string }, adminData: Omit<User, 'id' | 'createdAt' | 'terreiroId' | 'role'>) => Promise<boolean>;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'terreiroId'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'terreiroId'>) => Promise<void>;
  addCharge: (charge: Omit<Charge, 'id' | 'terreiroId' | 'createdAt'>) => Promise<void>;
  updateCharge: (id: string, data: Partial<Charge>) => Promise<void>;
  markChargeAsPaid: (chargeId: string, userId: string, isPaid: boolean) => Promise<void>;
  notifyPayment: (chargeId: string, userId: string) => Promise<void>;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'terreiroId'>) => Promise<void>;
  updateBankAccount: (id: string, data: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  resetStore: () => void;
}

// ─── Seed Data: Master Admin ───────────────────────────

const TERREIRO_1: Terreiro = {
  id: 'terreiro-001',
  name: 'Terreiro de Umbanda Luz Divina',
  logoUrl: '',
  endereco: 'Rua da Luz, 100 - Centro',
  adminId: 'user-admin-001'
};

const ADMIN_1: User = {
  id: 'user-admin-001',
  role: 'ADMIN',
  isMaster: true,
  cpf: 'master',
  password: '123',
  nomeCompleto: 'Pai João da Luz',
  nomeDeSanto: 'Pai João',
  dataNascimento: '1980-01-01',
  rg: '0000000',
  endereco: 'Rua da Luz, 100',
  telefone: '(11) 99999-9999',
  email: 'admin@luzdivina.com',
  profissao: 'Sacerdote',
  nomePais: '',
  spiritual: {
    tempoUmbanda: '20 anos',
    religiaoAnterior: '',
    orixaFrente: 'Oxalá',
    orixaAdjunto: 'Iemanjá',
    tipoMedium: 'Sacerdote',
    chefeCoroa: '',
    orixas: ['Oxalá', 'Iemanjá'],
    entidades: ['Caboclo', 'Preto Velho'],
    paiDeSantoAnterior: '',
    dataEntrada: '2000-01-01',
    historicoObrigacoes: 'Feitura completa.'
  },
  createdAt: new Date().toISOString(),
  terreiroId: 'terreiro-001'
};

const simulateDelay = () => new Promise(resolve => setTimeout(resolve, 300));

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      terreiros: [TERREIRO_1],
      users: [ADMIN_1],
      events: [],
      charges: [],
      bankAccounts: [],
      currentUser: null,
      currentTerreiroId: null,
      isLoading: false,
      theme: 'dark',
      masterPixKey: 'financeiro@terreiras.app',
      setMasterPixKey: (key) => set({ masterPixKey: key }),

      // ─── Selectors ──────────────────────────────────────
      getCurrentTerreiro: () => {
        const { terreiros, currentTerreiroId } = get();
        return terreiros.find(t => t.id === currentTerreiroId);
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

      getUserTerreiros: () => {
        const { currentUser, terreiros } = get();
        if (!currentUser) return [];
        if (currentUser.isMaster || currentUser.isPanelAdmin) {
          return terreiros; // Master e Panel Admin veem todos os terreiros
        }
        // Administradores e usuários comuns vêm apenas o terreiro ao qual pertencem
        return terreiros.filter(t => t.id === currentUser.id || t.id === currentUser.terreiroId);
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

      // ─── Actions ─────────────────────────────────────────
      checkCpf: async (cpf) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const normalizedCpf = cpf.trim().toLowerCase();
          const user = get().users.find(u => u.cpf.trim().toLowerCase() === normalizedCpf);
          return { 
            exists: !!user, 
            hasPassword: !!user?.password,
            userName: user?.nomeCompleto
          };
        } finally {
          set({ isLoading: false });
        }
      },

      setupPassword: async (cpf, password, palavraChave) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const users = get().users;
          const normalizedCpf = cpf.trim().toLowerCase();
          const userIndex = users.findIndex(u => u.cpf.trim().toLowerCase() === normalizedCpf);
          
          if (userIndex === -1) return false;

          const updatedUsers = [...users];
          updatedUsers[userIndex] = { 
            ...updatedUsers[userIndex], 
            password,
            ...(palavraChave && { palavraChave: palavraChave.trim().toLowerCase() })
          };
          set({ users: updatedUsers });
          return true;
        } finally {
          set({ isLoading: false });
        }
      },

      recoverPassword: async (cpf, palavraChave, novaSenha) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const users = get().users;
          const normalizedCpf = cpf.trim().toLowerCase();
          const normalizedPalavra = palavraChave.trim().toLowerCase();
          
          const userIndex = users.findIndex(u => u.cpf.trim().toLowerCase() === normalizedCpf);
          if (userIndex === -1) return false;
          
          const user = users[userIndex];
          if (!user.palavraChave || user.palavraChave !== normalizedPalavra) return false;

          const updatedUsers = [...users];
          updatedUsers[userIndex] = { ...user, password: novaSenha };
          set({ users: updatedUsers });
          return true;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (cpf, password) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const normalizedCpf = cpf.trim().toLowerCase();
          const user = get().users.find(u => u.cpf.trim().toLowerCase() === normalizedCpf);
          
          if (user && user.password && user.password === password) {
            set({
              currentUser: user,
              currentTerreiroId: user.terreiroId
            });
            return true;
          }
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        set({ currentUser: null, currentTerreiroId: null });
      },

      toggleTheme: () => {
        set({ theme: get().theme === 'dark' ? 'light' : 'dark' });
      },

      switchTerreiro: (terreiroId) => {
        set({ currentTerreiroId: terreiroId });
      },

      addTerreiro: async (terreiroData) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const { currentUser } = get();
          const newTerreiro: Terreiro = {
            ...terreiroData,
            id: `terr-${Date.now()}`,
            adminId: currentUser?.id || '',
            masterId: currentUser?.isMaster ? currentUser.id : undefined
          };
          set({ terreiros: [...get().terreiros, newTerreiro] });
        } finally {
          set({ isLoading: false });
        }
      },

      updateTerreiro: async (id, terreiroData) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          terreiros: get().terreiros.map(t => t.id === id ? { ...t, ...terreiroData } : t),
          isLoading: false
        });
      },

      toggleBlockTerreiro: async (id, blocked) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          terreiros: get().terreiros.map(t => t.id === id ? { ...t, isBlocked: blocked } : t),
          isLoading: false
        });
      },

      deleteTerreiro: async (id) => {
        set({ isLoading: true });
        await simulateDelay();
        // Remove terreiro, seus membros e suas cobranças
        set({
          terreiros: get().terreiros.filter(t => t.id !== id),
          users: get().users.filter(u => u.terreiroId !== id),
          charges: get().charges.filter(c => c.terreiroId !== id),
          isLoading: false
        });
        // Se deletou o terreiro atual, troca para o primeiro disponível
        const state = get();
        if (state.currentTerreiroId === id) {
          const nextTerreiro = state.terreiros[0];
          if (nextTerreiro) {
            set({ currentTerreiroId: nextTerreiro.id });
          }
        }
      },

      registerTerreiro: async (terreiroData, adminData) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const { currentUser } = get();

          // Verificar se CPF já existe
          const existingUser = get().users.find(u => u.cpf === adminData.cpf);
          if (existingUser) return false;

          const terreiroId = `terreiro-${Date.now()}`;
          const adminId = `user-${Date.now() + 1}`;

          const newTerreiro: Terreiro = {
            id: terreiroId,
            name: terreiroData.name,
            logoUrl: '',
            endereco: terreiroData.endereco,
            adminId: adminId,
            masterId: currentUser?.isMaster ? currentUser.id : undefined
          };

          const newAdmin: User = {
            ...adminData,
            id: adminId,
            role: 'ADMIN',
            createdAt: new Date().toISOString(),
            terreiroId: terreiroId
          };

          set({
            terreiros: [...get().terreiros, newTerreiro],
            users: [...get().users, newAdmin]
          });

          return true;
        } finally {
          set({ isLoading: false });
        }
      },

      addUser: async (userData) => {
        set({ isLoading: true });
        await simulateDelay();
        const { currentTerreiroId } = get();
        if (!currentTerreiroId) {
          set({ isLoading: false });
          return;
        }
        const newUser: User = {
          ...userData,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
          terreiroId: currentTerreiroId // Auto-vincula ao terreiro ativo
        };
        set({ users: [...get().users, newUser], isLoading: false });
      },

      updateUser: async (id, userData) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          users: get().users.map(u => u.id === id ? { ...u, ...userData } : u),
          isLoading: false
        });
      },

      deleteUser: async (id) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          users: get().users.filter(u => u.id !== id),
          // Também remove cobranças vinculadas (opcional, mas limpa o banco)
          charges: get().charges.filter(c => !c.assignedTo.includes(id)),
          isLoading: false
        });
      },

      addEvent: async (eventData) => {
        set({ isLoading: true });
        await simulateDelay();
        const { currentTerreiroId } = get();
        if (!currentTerreiroId) {
          set({ isLoading: false });
          return;
        }
        const newEvent: Event = {
          ...eventData,
          id: `evt-${Date.now()}`,
          terreiroId: currentTerreiroId // Auto-vincula ao terreiro ativo
        };
        set({ events: [...get().events, newEvent], isLoading: false });
      },

      addCharge: async (chargeData) => {
        set({ isLoading: true });
        await simulateDelay();
        const { currentTerreiroId } = get();
        if (!currentTerreiroId) {
          set({ isLoading: false });
          return;
        }
        const newCharge: Charge = {
          ...chargeData,
          id: `charge-${Date.now()}`,
          terreiroId: currentTerreiroId,
          createdAt: new Date().toISOString()
        };
        set({ charges: [...get().charges, newCharge], isLoading: false });
      },

      updateCharge: async (id, data) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          charges: get().charges.map(c => c.id === id ? { ...c, ...data } : c),
          isLoading: false
        });
      },

      markChargeAsPaid: async (chargeId, userId, isPaid) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const charges = get().charges;
          const updatedCharges = charges.map(c => {
            if (c.id === chargeId) {
              let newPaidBy = [...c.paidBy];
              let newNotifiedBy = c.notifiedBy ? [...c.notifiedBy] : [];

              if (isPaid) {
                if (!newPaidBy.includes(userId)) newPaidBy.push(userId);
                newNotifiedBy = newNotifiedBy.filter(id => id !== userId);
              } else {
                newPaidBy = newPaidBy.filter(id => id !== userId);
              }

              return { ...c, paidBy: newPaidBy, notifiedBy: newNotifiedBy };
            }
            return c;
          });

          set({ charges: updatedCharges });
        } finally {
          set({ isLoading: false });
        }
      },

      notifyPayment: async (chargeId, userId) => {
        set({ isLoading: true });
        try {
          await simulateDelay();
          const charges = get().charges;
          const updatedCharges = charges.map(c => {
            if (c.id === chargeId) {
              const newNotifiedBy = c.notifiedBy ? [...c.notifiedBy] : [];
              if (!newNotifiedBy.includes(userId)) {
                newNotifiedBy.push(userId);
              }
              return { ...c, notifiedBy: newNotifiedBy };
            }
            return c;
          });

          set({ charges: updatedCharges });
        } finally {
          set({ isLoading: false });
        }
      },

      addBankAccount: async (accountData) => {
        set({ isLoading: true });
        await simulateDelay();
        const { currentTerreiroId } = get();
        if (!currentTerreiroId) {
          set({ isLoading: false });
          return;
        }
        const newBankAccount: BankAccount = {
          ...accountData,
          id: `bank-${Date.now()}`,
          terreiroId: currentTerreiroId
        };
        set({ bankAccounts: [...get().bankAccounts, newBankAccount], isLoading: false });
      },

      updateBankAccount: async (id, data) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          bankAccounts: get().bankAccounts.map(b => b.id === id ? { ...b, ...data } : b),
          isLoading: false
        });
      },

      deleteBankAccount: async (id) => {
        set({ isLoading: true });
        await simulateDelay();
        set({
          bankAccounts: get().bankAccounts.filter(b => b.id !== id),
          isLoading: false
        });
      },

      resetStore: () => {
        set({
          terreiros: [TERREIRO_1],
          users: [ADMIN_1],
          events: [],
          charges: [],
          bankAccounts: [],
          currentUser: null,
          currentTerreiroId: null,
          isLoading: false,
          theme: 'dark'
        });
        localStorage.removeItem('terreiro-storage');
        window.location.reload();
      },
    }),
    {
      name: 'terreiro-storage',
      version: 9, // Bump: Remove test data, keep only Master
      migrate: (_persistedState: any, version: number) => {
        if (version < 9) {
          // Reset completo — removidos terreiros e membros de teste
          return {
            terreiros: [TERREIRO_1],
            users: [ADMIN_1],
            events: [],
            charges: [],
            bankAccounts: [],
            currentUser: null,
            currentTerreiroId: null,
            isLoading: false,
            theme: 'dark'
          };
        }
        return _persistedState;
      }
    }
  )
);
