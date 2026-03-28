import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Upload, Save, Building } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Settings() {
  const { getCurrentTerreiro, updateTerreiro, addUser } = useStore();
  const currentTerreiro = getCurrentTerreiro();

  const [terreiroName, setTerreiroName] = useState(currentTerreiro?.name || '');
  const [logoUrl, setLogoUrl] = useState(currentTerreiro?.logoUrl || '');
  const [endereco, setEndereco] = useState(currentTerreiro?.endereco || '');
  const [importStatus, setImportStatus] = useState('');
  const [pixKey, setPixKey] = useState(currentTerreiro?.pixKey || '');

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
            spiritual: {
              tempoUmbanda: row.tempoUmbanda || row['Tempo de Umbanda'] || '',
              religiaoAnterior: row.religiaoAnterior || row['Religião Anterior'] || '',
              orixaFrente: row.orixaFrente || row['Orixá de Frente'] || row.orixa_frente || '',
              orixaAdjunto: row.orixaAdjunto || row['Orixá Adjuntó'] || row.orixa_adjunto || '',
              tipoMedium: row.tipoMedium || row['Tipo de Médium'] || row.tipo_medium || '',
              chefeCoroa: row.chefeCoroa || row['Chefe da Coroa'] || row.chefe_coroa || '',
              orixas: row.orixas ? row.orixas.split(',').map((s: string) => s.trim()) : [],
              entidades: row.entidades ? row.entidades.split(',').map((s: string) => s.trim()) : [],
              paiDeSantoAnterior: row.paiDeSantoAnterior || row['Pai de Santo Anterior'] || '',
              dataEntrada: row.dataEntrada || row['Data de Entrada'] || '',
              historicoObrigacoes: row.historicoObrigacoes || row['Histórico de Obrigações'] || row.historico_obrigacoes || ''
            }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 className="text-gradient">Configurações do Terreiro</h2>
        {currentTerreiro && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Editando: {currentTerreiro.name}
          </p>
        )}
      </div>
      
      <div className="grid-panels" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Personalização */}
        <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={20} /> Personalização Visual
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>Nome do Terreiro</label>
            <input 
              type="text" 
              value={terreiroName}
              onChange={e => setTerreiroName(e.target.value)}
              className="search-input glass-panel"
              style={{ padding: '0.8rem', border: '1px solid var(--glass-border)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>Endereço do Terreiro</label>
            <input 
              type="text" 
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, número - Bairro"
              className="search-input glass-panel"
              style={{ padding: '0.8rem', border: '1px solid var(--glass-border)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>URL da Logo do Terreiro (Opcional)</label>
            <input 
              type="text" 
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
              className="search-input glass-panel"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--text-muted)' }}>Chave PIX para Recebimentos</label>
            <input 
              type="text" 
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder="Ex: CPF, E-mail ou Telefone"
              className="search-input glass-panel"
              style={{ padding: '0.8rem', border: '1px solid var(--glass-border)' }}
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Esta chave aparecerá para os membros ao consultarem suas mensalidades.</span>
          </div>

          <button 
            onClick={handleSaveSettings}
            className="glass-panel glow-fx" 
            style={{ padding: '0.8rem', marginTop: '1rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--neon-cyan)', border: '1px solid var(--neon-cyan)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            <Save size={18} /> Salvar Alterações
          </button>
        </div>

        {/* Importação */}
        <div className="panel glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--panel-radius)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} /> Importar Banco de Dados Existente
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Selecione uma planilha (CSV / Excel) ou JSON contendo a lista atual de membros da casa. O sistema fará o cadastro automático vinculado a esta casa.
          </p>
          
          <div style={{ marginTop: '1rem' }}>
            <label 
              htmlFor="upload-db"
              className="glass-panel glow-fx"
              style={{ 
                padding: '2rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1rem', 
                border: '1px dashed var(--neon-purple)', 
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Upload size={32} color="var(--neon-purple)" />
              <span>Clique para selecionar o arquivo do banco de dados</span>
            </label>
            <input 
              id="upload-db"
              type="file" 
              accept=".csv,.json,.xlsx" 
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          {importStatus && (
            <div style={{ padding: '1rem', background: 'rgba(0, 240, 255, 0.1)', borderLeft: '3px solid var(--neon-cyan)', borderRadius: 4, fontSize: '0.9rem' }}>
              {importStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
