import { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Upload, Save, Building, Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadImage } from '../utils/uploadImage';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';
import ImportModal from '../components/ImportModal';

export default function Settings() {
  const { getCurrentTerreiro, updateTerreiro, clearTerreiroMembers } = useStore();
  const currentTerreiro = getCurrentTerreiro();

  const [terreiroName, setTerreiroName] = useState(currentTerreiro?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentTerreiro?.logoUrl || '');
  const [endereco, setEndereco] = useState(currentTerreiro?.endereco || '');
  const [importStatus, setImportStatus] = useState('');
  const [pixKey, setPixKey] = useState(currentTerreiro?.pixKey || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Import flow
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [importSuccess, setImportSuccess] = useState<{ count: number } | null>(null);

  const handleSaveSettings = () => {
    if (!currentTerreiro) return;
    updateTerreiro(currentTerreiro.id, {
      name: terreiroName,
      logoUrl: logoUrl,
      endereco: endereco,
      pixKey: pixKey
    });
    setImportStatus('Configurações salvas com sucesso!');
    setTimeout(() => setImportStatus(''), 3000);
  };

  const handleDeleteDatabase = async () => {
    try {
      if (!currentTerreiro) return;
      await clearTerreiroMembers();
      setImportStatus('Membros removidos com sucesso. A casa foi preservada.');
      setTimeout(() => setImportStatus(''), 4000);
    } catch (err) {
      console.error("Erro ao limpar membros:", err);
      alert("Erro ao remover os membros. Verifique sua conexão ou permissões.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImportStatus('Lendo arquivo da planilha...');

    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        let wb: import('xlsx').WorkBook;
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const dataUint8 = new Uint8Array(arrayBuffer);

        if (isCsv) {
          let text = '';
          try {
            text = new TextDecoder('utf-8', { fatal: true }).decode(dataUint8);
          } catch {
            text = new TextDecoder('windows-1252').decode(dataUint8);
          }
          wb = XLSX.read(text, { type: 'string' });
        } else {
          wb = XLSX.read(dataUint8, { type: 'array' });
        }

        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws || !ws['!ref']) {
          setImportStatus('Planilha vazia ou sem dados legíveis.');
          setTimeout(() => setImportStatus(''), 5000);
          return;
        }

        const range = XLSX.utils.decode_range(ws['!ref']);
        const headers: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          const val = cell?.v?.toString().trim();
          if (val) headers.push(val);
        }

        const data = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];

        if (data.length === 0) {
          setImportStatus('Nenhum dado encontrado na planilha.');
          setTimeout(() => setImportStatus(''), 5000);
          return;
        }

        setImportStatus('');
        setImportHeaders(headers);
        setImportData(data);
        setImportModalOpen(true);

      } catch (err) {
        console.error('Erro na leitura do arquivo:', err);
        setImportStatus('Erro ao ler arquivo. Verifique o formato (.xlsx, .xls ou .csv).');
        setTimeout(() => setImportStatus(''), 6000);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportComplete = (count: number) => {
    setImportModalOpen(false);
    setImportSuccess({ count });
    setTimeout(() => setImportSuccess(null), 6000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-gradient">Configurações do Terreiro</h2>
          {currentTerreiro && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              ID: {currentTerreiro.id} — {currentTerreiro.name}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid-panels" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Personalização */}
        <div className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-cyan)' }}>
            <Building size={20} /> Informações Básicas e Logo
          </h3>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px' }}>
            <div style={{ width: 100, height: 100, borderRadius: '12%', overflow: 'hidden', border: '2px solid var(--neon-cyan)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building size={40} color="var(--glass-border)" />
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <label className="glass-panel glow-fx" style={{ padding: '0.6rem 1.2rem', cursor: isUploadingLogo ? 'wait' : 'pointer', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', color: '#fff', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isUploadingLogo ? 0.7 : 1 }}>
                <Upload size={16} /> {isUploadingLogo ? 'Enviando...' : 'Alterar Logo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !currentTerreiro) return;
                  setIsUploadingLogo(true);
                  try {
                    const url = await uploadImage(file, `logos/terreiro-${currentTerreiro.id}.jpg`);
                    setLogoUrl(url);
                  } catch (err: any) {
                    alert(`Erro ao enviar logo: ${err.message}`);
                  } finally {
                    setIsUploadingLogo(false);
                  }
                }} />
              </label>
              {logoUrl && (
                <button 
                  onClick={() => setLogoUrl('')}
                  style={{ background: 'transparent', border: 'none', color: '#ff4c4c', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                >
                  <X size={12} /> Remover Logo
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nome do Terreiro</label>
            <input 
              type="text" 
              value={terreiroName}
              onChange={e => setTerreiroName(e.target.value)}
              className="search-input glass-panel"
              style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Endereço do Terreiro</label>
            <input 
              type="text" 
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, número - Bairro"
              className="search-input glass-panel"
              style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chave PIX para Recebimentos</label>
            <input 
              type="text" 
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder="Ex: CPF, E-mail ou Telefone"
              className="search-input glass-panel"
              style={{ padding: '0.8rem', border: '1px solid var(--glass-border)', width: '100%' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Esta chave aparecerá para os membros ao consultarem suas faturas.</span>
          </div>

          <button 
            onClick={handleSaveSettings}
            className="glass-panel glow-fx" 
            style={{ padding: '1rem', marginTop: '0.5rem', background: 'linear-gradient(90deg, #00f0ff, #9D4EDD)', color: '#000', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', borderRadius: 10 }}
          >
            <Save size={18} /> SALVAR ALTERAÇÕES
          </button>

          {/* Notificações */}
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Notificações Push
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Teste se o seu navegador está recebendo notificações do sistema.
            </p>
            <button
              onClick={async () => {
                setImportStatus('⌛ Enviando notificação de teste...');
                try {
                  const userJson = localStorage.getItem('terreiro-session');
                  if (!userJson) return;
                  const { userId } = JSON.parse(userJson);
                  
                  // Use separate direct fetch to our supabase edge function
                  const { data: { session } } = await supabase.auth.getSession();
                  
                  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session?.access_token || ''}`
                    },
                    body: JSON.stringify({
                      userId: userId,
                      title: 'Teste de Notificação',
                      body: 'Se você está vendo isso, as notificações estão funcionando!',
                      url: '/settings'
                    })
                  });
                  
                  if (response.ok) {
                    setImportStatus('✅ Notificação de teste enviada!');
                  } else {
                    const err = await response.text();
                    setImportStatus(`❌ Erro: ${err}`);
                  }
                } catch (err: any) {
                  setImportStatus(`❌ Erro: ${err.message}`);
                }
                setTimeout(() => setImportStatus(''), 5000);
              }}
              className="glass-panel"
              style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ENVIAR NOTIFICAÇÃO DE TESTE
            </button>
          </div>
        </div>

        {/* Importação e Perigo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-purple)' }}>
              <Upload size={20} /> Importar Dados
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Selecione uma planilha (Excel) para importar membros em massa para o sistema.
            </p>
            
            <label 
              htmlFor="upload-db"
              className="glass-panel glow-fx"
              style={{ 
                padding: '1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '0.8rem', 
                border: '1px dashed var(--neon-purple)', 
                background: 'rgba(157, 78, 221, 0.05)',
                cursor: 'pointer',
                textAlign: 'center',
                borderRadius: 12
              }}
            >
              <Upload size={28} color="var(--neon-purple)" />
              <span style={{ fontSize: '0.85rem' }}>Selecionar Planilha da Casa</span>
            </label>
            <input id="upload-db" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />

            <AnimatePresence>
              {importStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{ padding: '0.8rem', background: 'rgba(0, 240, 255, 0.1)', borderLeft: '3px solid var(--neon-cyan)', borderRadius: 4, fontSize: '0.85rem' }}
                >
                  {importStatus}
                </motion.div>
              )}

              {importSuccess && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', padding: '1.5rem', background: 'rgba(0, 240, 255, 0.07)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: 12, textAlign: 'center' }}
                >
                  <CheckCircle2 size={42} color="var(--neon-cyan)" />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--neon-cyan)', margin: 0 }}>
                      Importação concluída!
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
                      {importSuccess.count} {importSuccess.count === 1 ? 'membro importado' : 'membros importados'} com sucesso.
                    </p>
                  </div>
                  {/* Barra de progresso que esvazia após sucesso */}
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 6, ease: 'linear' }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))', borderRadius: 4 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="panel glass-panel" style={{ padding: '2rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255, 76, 76, 0.3)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4c4c' }}>
              <AlertTriangle size={20} /> Zona de Risco
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Apague todos os dados deste terreiro permanentemente. Esta ação não pode ser desfeita.
            </p>
            
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="glow-fx"
              style={{ 
                padding: '0.8rem', 
                background: 'rgba(255, 76, 76, 0.1)', 
                color: '#ff4c4c', 
                border: '1px solid #ff4c4c', 
                borderRadius: 8, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                width: '100%'
              }}
            >
              <Trash2 size={16} /> DELETAR BANCO DE DADOS
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteDatabase}
        title="LIMPAR BANCO DE MEMBROS"
        message={`ATENÇÃO: Esta ação irá REMOVER TODOS OS MEMBROS do terreiro "${currentTerreiro?.name}". A casa, suas configurações e sua conta de administrador serão preservadas. Esta ação é IRREVERSÍVEL.`}
        confirmLabel="SIM, REMOVER MEMBROS"
        cancelLabel="Cancelar"
        variant="danger"
        requiresInput={true}
        expectedInput={currentTerreiro?.name || ''}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        headers={importHeaders}
        data={importData}
        onComplete={handleImportComplete}
      />

    </motion.div>
  );
}
