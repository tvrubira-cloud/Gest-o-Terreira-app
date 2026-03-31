import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Building2, UserPlus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterTerreiro() {
  const navigate = useNavigate();
  const registerTerreiro = useStore(state => state.registerTerreiro);
  const isLoading = useStore(state => state.isLoading);

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [terreiroName, setTerreiroName] = useState('');
  const [terreiroEndereco, setTerreiroEndereco] = useState('');
  const [terreiroCep, setTerreiroCep] = useState('');
  const [terreiroCidade, setTerreiroCidade] = useState('');
  const [terreiroEstado, setTerreiroEstado] = useState('');
  
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeDeSanto, setNomeDeSanto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setTerreiroCep(data.cep);
        setTerreiroEndereco(`${data.logradouro}${data.bairro ? `, ${data.bairro}` : ''}`);
        setTerreiroCidade(data.localidade);
        setTerreiroEstado(data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!terreiroName || !cpf || !password || !nomeCompleto) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    const success = await registerTerreiro(
      { 
        name: terreiroName, 
        endereco: terreiroEndereco,
        cep: terreiroCep,
        cidade: terreiroCidade,
        estado: terreiroEstado
      },
      {
        cpf,
        password,
        nomeCompleto,
        nomeDeSanto,
        dataNascimento: '',
        rg: '',
        endereco: terreiroEndereco,
        cep: terreiroCep,
        cidade: terreiroCidade,
        estado: terreiroEstado,
        telefone,
        email,
        whatsapp: telefone,
        profissao: '',
        nomePais: '',
        spiritual: {
          situacaoCadastro: 'ativo',
          segmentoUmbanda: true,
          segmentoKimbanda: false,
          segmentoNacao: false,
          cidadeEstadoOrigem: '',
          umbandaOrigem: '',
          umbandaObrigaCabeca: '',
          umbandaObrigaCorpo: '',
          umbandaObs: '',
          umbandaAnteriorMata: '',
          umbandaAnteriorMar: '',
          umbandaAnteriorEntidades: '',
          umbandaAnteriorCaboclo: '',
          umbandaAnteriorPretoVelho: '',
          quimbandaOrigem: '',
          quimbandaObrigaFrente: '',
          quimbandaObrigaCompanheiro: '',
          quimbandaObs: '',
          quimbandaCruzamentos: '',
          quimbandaAssentamentos: '',
          quimbandaKaballah: '',
          nacaoOrigem: '',
          nacaoObrigaCabeca: '',
          nacaoObrigaCorpo: '',
          nacaoObrigaPes: '',
          nacaoPassagem: '',
          nacaoObs: '',
          obrigacoes: [
            { data: '', descricao: '' },
            { data: '', descricao: '' },
            { data: '', descricao: '' }
          ],
          tipoMedium: 'Sacerdote'
        }
      }
    );

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Este CPF/Login já está em uso. Tente outro.');
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#000',
    border: '1px solid #3c1661',
    borderRadius: '12px',
    padding: '1rem',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.3s',
    width: '100%',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    color: '#9D4EDD',
    fontSize: '0.8rem',
    fontWeight: 800,
    letterSpacing: '1.5px',
    textTransform: 'uppercase'
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = '#9D4EDD');
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = '#3c1661');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div className="glass-panel glow-fx" style={{
        padding: '2.5rem 2.5rem',
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.8rem',
        borderRadius: 'var(--panel-radius)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(157,78,221,0.15))',
              border: '2px solid rgba(0,240,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={28} color="#00f0ff" />
            </div>
          </div>
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.8rem',
            background: 'linear-gradient(90deg, #b388ff, #00f0ff)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontWeight: 800
          }}>
            Novo Terreiro
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Cadastre sua casa e seja o administrador
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 20,
            background: step === 1 ? 'rgba(0,240,255,0.1)' : 'transparent',
            border: `1px solid ${step === 1 ? 'rgba(0,240,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: step === 1 ? '#00f0ff' : '#6b7280',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.3s'
          }} onClick={() => setStep(1)}>
            <Building2 size={14} /> Dados da Casa
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 20,
            background: step === 2 ? 'rgba(157,78,221,0.1)' : 'transparent',
            border: `1px solid ${step === 2 ? 'rgba(157,78,221,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: step === 2 ? '#9D4EDD' : '#6b7280',
            fontSize: '0.8rem', fontWeight: 600, cursor: step === 1 && !terreiroName ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s'
          }} onClick={() => terreiroName && setStep(2)}>
            <UserPlus size={14} /> Administrador
          </div>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Step 1 */}
          {step === 1 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '1.2rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>
                  Nome do Terreiro <span style={{ color: '#ff4c4c' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Centro Espírita Luz Divina"
                  value={terreiroName}
                  onChange={e => { setTerreiroName(e.target.value); setError(''); }}
                  onFocus={handleFocus} onBlur={handleBlur}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                <label style={labelStyle}>CEP da Casa</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={terreiroCep}
                    onChange={e => setTerreiroCep(e.target.value)}
                    onBlur={e => handleCepLookup(e.target.value)}
                    onFocus={handleFocus}
                    style={inputStyle}
                  />
                  {isSearchingCep && <div className="spin" style={{ position: 'absolute', right: 10, top: 12, border: '2px solid #00f0ff', borderTopColor: 'transparent', borderRadius: '50%', width: 18, height: 18, animation: 'spin 1s linear infinite' }} />}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Endereço da Casa</label>
                <input
                  type="text"
                  placeholder="Rua, número - Bairro, Cidade"
                  value={terreiroEndereco}
                  onChange={e => setTerreiroEndereco(e.target.value)}
                  onFocus={handleFocus} onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!terreiroName) {
                    setError('Informe o nome do terreiro.');
                    return;
                  }
                  setStep(2);
                }}
                style={{
                  background: 'linear-gradient(90deg, rgba(0,240,255,0.15), rgba(157,78,221,0.15))',
                  color: '#fff', border: '1px solid rgba(0,240,255,0.3)',
                  borderRadius: '14px', padding: '1rem',
                  fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  transition: 'all 0.3s', marginTop: '0.5rem'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#00f0ff';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.15)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Próximo → Dados do Administrador
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '1.2rem',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{
                padding: '0.8rem 1rem', borderRadius: 10,
                background: 'rgba(0,240,255,0.05)',
                border: '1px solid rgba(0,240,255,0.15)',
                fontSize: '0.85rem', color: '#00f0ff',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <Building2 size={14} /> {terreiroName}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>
                    CPF / Login <span style={{ color: '#ff4c4c' }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="CPF ou nome de usuário"
                    value={cpf} onChange={e => { setCpf(e.target.value); setError(''); }}
                    onFocus={handleFocus} onBlur={handleBlur}
                    style={inputStyle} required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>
                    Senha <span style={{ color: '#ff4c4c' }}>*</span>
                  </label>
                  <input
                    type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onFocus={handleFocus} onBlur={handleBlur}
                    style={{ ...inputStyle, letterSpacing: '3px' }} required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>
                  Nome Completo <span style={{ color: '#ff4c4c' }}>*</span>
                </label>
                <input
                  type="text" placeholder="Seu nome completo"
                  value={nomeCompleto} onChange={e => setNomeCompleto(e.target.value)}
                  onFocus={handleFocus} onBlur={handleBlur}
                  style={inputStyle} required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>Nome de Santo</label>
                  <input
                    type="text" placeholder="Ex: Pai/Mãe ..."
                    value={nomeDeSanto} onChange={e => setNomeDeSanto(e.target.value)}
                    onFocus={handleFocus} onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>Telefone</label>
                  <input
                    type="text" placeholder="(00) 00000-0000"
                    value={telefone} onChange={e => setTelefone(e.target.value)}
                    onFocus={handleFocus} onBlur={handleBlur}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" placeholder="admin@seuterreiro.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={handleFocus} onBlur={handleBlur}
                  style={inputStyle}
                />
              </div>

              {error && (
                <span style={{
                  color: '#ff4c4c', fontSize: '0.9rem', textAlign: 'center',
                  padding: '0.6rem', background: 'rgba(255,76,76,0.08)',
                  borderRadius: 8, border: '1px solid rgba(255,76,76,0.2)'
                }}>
                  {error}
                </span>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: '#9D4EDD',
                  color: '#fff', border: 'none', borderRadius: '14px',
                  padding: '1.1rem', fontSize: '1.05rem', fontWeight: 800,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  letterSpacing: '2px', textTransform: 'uppercase',
                  transition: 'transform 0.2s, background 0.2s',
                  opacity: isLoading ? 0.7 : 1
                }}
                onMouseOver={e => e.currentTarget.style.background = '#8a3bc7'}
                onMouseOut={e => e.currentTarget.style.background = '#9D4EDD'}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isLoading ? 'Registrando...' : '✦ Criar Terreiro e Entrar'}
              </button>
            </div>
          )}
        </form>

        {/* Removido o botão de Voltar ao Login centralizado, Dashboard tem navegação lateral */}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </motion.div>
  );
}
