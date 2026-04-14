import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import bgImage from '../assets/bg.png';
import logo from '../assets/logo.png';
import '../App.css';

export default function Login() {
  const [step, setStep] = useState<'CPF' | 'PASSWORD' | 'SET_PASSWORD' | 'RECOVER_PASSWORD'>('CPF');
  const [cpf, setCpf] = useState(() => localStorage.getItem('orum_saved_cpf') || '');
  const [rememberCpf, setRememberCpf] = useState(() => localStorage.getItem('orum_remember_cpf') === 'true');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [palavraChave, setPalavraChave] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const { login, checkCpf, setupPassword, recoverPassword, isLoading, currentUser } = useStore();
  const navigate = useNavigate();

  // Redirecionamento automático se já estiver logado
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleCpfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf) return setError('Por favor, informe seu CPF.');

    if (rememberCpf) {
      localStorage.setItem('orum_saved_cpf', cpf);
      localStorage.setItem('orum_remember_cpf', 'true');
    } else {
      localStorage.removeItem('orum_saved_cpf');
      localStorage.removeItem('orum_remember_cpf');
    }

    const result = await checkCpf(cpf);
    if (result.exists) {
      setUserName(result.userName || '');
      if (result.hasPassword) {
        setStep('PASSWORD');
      } else {
        setStep('SET_PASSWORD');
      }
    } else {
      setError('CPF não encontrado no sistema. Procure a secretaria.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(cpf, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Senha incorreta.');
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) return setError('A senha deve ter pelo menos 4 caracteres.');
    if (password !== confirmPassword) return setError('As senhas não conferem.');
    if (!palavraChave || palavraChave.trim().length < 3) return setError('A palavra-chave deve ter pelo menos 3 caracteres.');
    
    const success = await setupPassword(cpf, password, palavraChave);
    if (success) {
      const loginSuccess = await login(cpf, password);
      if (loginSuccess) navigate('/dashboard');
    } else {
      setError('Erro ao cadastrar senha.');
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!palavraChave) return setError('Por favor, informe a Palavra-Chave.');
    if (password.length < 4) return setError('A nova senha deve ter pelo menos 4 caracteres.');
    if (password !== confirmPassword) return setError('As senhas não conferem.');
    
    const success = await recoverPassword(cpf, palavraChave, password);
    if (success) {
      alert('Senha recuperada com sucesso!');
      setStep('PASSWORD');
      setPassword('');
      setConfirmPassword('');
      setPalavraChave('');
      setError('');
    } else {
      setError('Palavra-chave incorreta ou usuário não encontrado.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="bg-container">
        <img src={bgImage} alt="Background" className="bg-image" />
        <div className="bg-overlay" style={{ background: 'rgba(5, 5, 10, 0.92)' }}></div>
      </div>

      <div className="glass-panel" style={{ 
        padding: '3rem 2.5rem', 
        width: '100%', 
        maxWidth: '460px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(157, 78, 221, 0.1)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img 
            src={logo} 
            alt="ORUM.app Logo" 
            style={{ 
              width: '240px', 
              height: 'auto', 
              marginBottom: '1rem',
              filter: 'url(#remove-black-bg) drop-shadow(0 0 20px rgba(0, 240, 255, 0.4))'
            }} 
          />
          <h1 className="text-gradient" style={{ 
            fontSize: '2rem', 
            marginBottom: '0.5rem', 
            letterSpacing: '2px', 
            textTransform: 'uppercase',
            fontWeight: 800
          }}>
            {step === 'SET_PASSWORD' ? 'Primeiro Acesso' : step === 'RECOVER_PASSWORD' ? 'Recuperação' : 'Acesso ao Templo'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            {step === 'CPF' && 'Olá! Identifique-se para continuar.'}
            {step === 'PASSWORD' && `Olá, ${userName}! Digite sua senha.`}
            {step === 'SET_PASSWORD' && `Bem-vindo, ${userName}! Vamos criar sua senha.`}
            {step === 'RECOVER_PASSWORD' && `Olá, ${userName}! Redefina sua senha abaixo.`}
          </p>
        </div>

        {step === 'CPF' && (
          <form onSubmit={handleCpfSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Seu CPF</label>
              <input 
                type="text" 
                placeholder="Ex: 123.456.789-00"
                value={cpf} 
                onChange={e => { setCpf(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', padding: '1rem', color: '#fff', borderRadius: 12 }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={rememberCpf}
                onChange={e => setRememberCpf(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--neon-cyan)', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Lembrar meu CPF neste dispositivo</span>
            </label>
            {error && <span style={{ color: '#ff4c4c', fontSize: '0.85rem' }}>{error}</span>}
            <button type="submit" disabled={isLoading} className="glass-panel glow-fx" style={{ background: 'var(--neon-cyan)', color: '#000', padding: '1rem', fontWeight: 800, borderRadius: 12, cursor: 'pointer' }}>
              {isLoading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {step === 'PASSWORD' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Sua Senha</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', padding: '1rem', color: '#fff', borderRadius: 12 }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setStep('RECOVER_PASSWORD'); setError(''); setPassword(''); setConfirmPassword(''); setPalavraChave(''); }} style={{ background: 'none', border: 'none', color: 'var(--neon-purple)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>Esqueci minha senha</button>
            </div>
            {error && <span style={{ color: '#ff4c4c', fontSize: '0.85rem' }}>{error}</span>}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setStep('CPF')} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1rem', borderRadius: 12, cursor: 'pointer' }}>Voltar</button>
              <button type="submit" disabled={isLoading} className="glass-panel glow-fx" style={{ flex: 2, background: 'var(--neon-cyan)', color: '#000', padding: '1rem', fontWeight: 800, borderRadius: 12, cursor: 'pointer' }}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        )}

        {step === 'RECOVER_PASSWORD' && (
          <form onSubmit={handleRecoverPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Sua Palavra-Chave</label>
              <input 
                type="text" 
                placeholder="A palavra secreta do 1º acesso"
                value={palavraChave} 
                onChange={e => { setPalavraChave(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--neon-purple)', padding: '1rem', color: '#fff', borderRadius: 12 }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Nova Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', padding: '1rem', color: '#fff', borderRadius: 12 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Confirme Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', padding: '1rem', color: '#fff', borderRadius: 12 }}
              />
            </div>
            {error && <span style={{ color: '#ff4c4c', fontSize: '0.85rem' }}>{error}</span>}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setStep('PASSWORD')} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '1rem', borderRadius: 12, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={isLoading} className="glass-panel glow-fx" style={{ flex: 2, background: 'var(--neon-purple)', color: '#fff', padding: '1rem', fontWeight: 800, borderRadius: 12, cursor: 'pointer' }}>
                {isLoading ? 'Recuperando...' : 'Redefinir Senha'}
              </button>
            </div>
          </form>
        )}

        {step === 'SET_PASSWORD' && (
          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Crie sua Senha</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => { setPassword(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', padding: '1rem', color: '#fff', borderRadius: 12 }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Confirme a Senha</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', padding: '1rem', color: '#fff', borderRadius: 12 }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label style={{ color: 'var(--neon-purple)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>Palavra-Chave de Recuperação</label>
              <input 
                type="text" 
                placeholder="Ex: Nome do primeiro animal / Cidade natal"
                value={palavraChave} 
                onChange={e => { setPalavraChave(e.target.value); setError(''); }} 
                className="glass-panel"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--neon-purple)', padding: '1rem', color: '#fff', borderRadius: 12 }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Guarde bem! Ela será necessária se esquecer a senha.</span>
            </div>
            {error && <span style={{ color: '#ff4c4c', fontSize: '0.85rem' }}>{error}</span>}
            <button type="submit" disabled={isLoading} className="glass-panel glow-fx" style={{ background: 'var(--secondary-purple)', color: '#fff', padding: '1rem', fontWeight: 800, borderRadius: 12, cursor: 'pointer' }}>
              {isLoading ? 'Salvando...' : 'Cadastrar Senha e Acessar'}
            </button>
          </form>
        )}


      </div>
    </div>
  );
}
