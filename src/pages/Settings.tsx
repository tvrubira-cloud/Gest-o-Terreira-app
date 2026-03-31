import { useState } from 'react';
import { useStore, defaultSpiritualData } from '../store/useStore';
import { Upload, Save, Building, Trash2, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { compressImage } from '../utils/image';
import { motion } from 'framer-motion';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Settings() {
  const { getCurrentTerreiro, updateTerreiro, deleteTerreiro, addUser, logout } = useStore();
  const currentTerreiro = getCurrentTerreiro();

  const [terreiroName, setTerreiroName] = useState(currentTerreiro?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentTerreiro?.logoUrl || '');
  const [endereco, setEndereco] = useState(currentTerreiro?.endereco || '');
  const [importStatus, setImportStatus] = useState('');
  const [pixKey, setPixKey] = useState(currentTerreiro?.pixKey || '');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
      await deleteTerreiro(currentTerreiro.id);
      logout();
      window.location.href = '/login';
    } catch (err) {
      console.error("Erro ao deletar banco:", err);
      alert("Erro ao deletar o banco de dados. Verifique sua conexão ou permissões.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Lendo arquivo do banco de dados...');
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        let count = 0;
        for (const row of data as any[]) {
          await addUser({
            role: 'USER',
            cpf: row.cpf?.toString() || row.CPF?.toString() || `imported-${Math.floor(Math.random() * 999999)}`,
            nomeCompleto: row.nomeCompleto || row.Nome || row.nome || 'Usuário Sem Nome',
            nomeDeSanto: row.nomeDeSanto || row['Nome de Santo'] || row.nome_de_santo || '',
            dataNascimento: row.dataNascimento || row['Data Nascimento'] || row['Data de Nascimento'] || '',
            rg: row.rg?.toString() || row.RG?.toString() || '',
            endereco: row.endereco || row.Endereco || row['Endereço'] || row.endereco_completo || '',
            telefone: row.telefone || row.Telefone || row.celular || '',
            email: row.email || row.Email || '',
            profissao: row.profissao || row.Profissao || row['Profissão'] || '',
            nomePais: row.nomePais || row['Nome dos Pais'] || row.nome_pais || '',
            spiritual: defaultSpiritualData
          });
          count++;
        }
        
        setImportStatus(`Importação concluída com sucesso! ${count} membro(s) adicionado(s) à casa.`);
        setTimeout(() => setImportStatus(''), 5000);
      } catch (err) {
        console.error("Erro na importação:", err);
        setImportStatus('Erro ao importar arquivo. Verifique o formato.');
        setTimeout(() => setImportStatus(''), 5000);
      }
    };
    reader.readAsBinaryString(file);
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
              <label className="glass-panel glow-fx" style={{ padding: '0.6rem 1.2rem', cursor: 'pointer', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)', color: '#fff', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Upload size={16} /> Alterar Logo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const compressed = await compressImage(reader.result as string, 400, 400);
                      setLogoUrl(compressed);
                    }
                    reader.readAsDataURL(file);
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

            {importStatus && (
              <div style={{ padding: '0.8rem', background: 'rgba(0, 240, 255, 0.1)', borderLeft: '3px solid var(--neon-cyan)', borderRadius: 4, fontSize: '0.85rem' }}>
                {importStatus}
              </div>
            )}
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
        title="EXCLUSÃO TOTAL"
        message={`AVISO CRÍTICO: Esta ação irá APAGAR TODOS os dados do terreiro "${currentTerreiro?.name}" (membros, eventos, financeiro e sua própria conta de administrador). Esta ação é IRREVERSÍVEL.`}
        confirmLabel="APAGAR TUDO PERMANENTEMENTE"
        cancelLabel="Cancelar"
        variant="danger"
        requiresInput={true}
        expectedInput={currentTerreiro?.name || ''}
      />
    </motion.div>
  );
}
