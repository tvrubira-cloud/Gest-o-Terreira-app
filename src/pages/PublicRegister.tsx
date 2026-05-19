import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { defaultSpiritualData } from '../store/useStore';

type Step = 'form' | 'success';

export default function PublicRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plano = searchParams.get('plano') || 'trial'; // trial | basico | profissional | rede

  const registerTerreiro = useStore((s) => s.registerTerreiro);
  const isLoading = useStore((s) => s.isLoading);

  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');

  // Campos do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeTerreiro, setNomeTerreiro] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  // Tradição
  const [segmentoUmbanda, setSegmentoUmbanda] = useState(true);
  const [segmentoKimbanda, setSegmentoKimbanda] = useState(false);
  const [segmentoNacao, setSegmentoNacao] = useState(false);
  const [segmentoCandomble, setSegmentoCandomble] = useState(false);
  const [segmentoOutras, setSegmentoOutras] = useState(false);
  const [outrasTradicoesTexto, setOutrasTradicoesTexto] = useState('');

  const planoLabel: Record<string, string> = {
    trial: '21 dias grátis',
    basico: 'Plano Básico',
    profissional: 'Plano Profissional',
    rede: 'Plano Rede de Ilês',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nomeCompleto.trim() || !nomeTerreiro.trim() || !cpf.trim() || !email.trim() || !senha) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (cpf.trim().length < 3) {
      setError('Informe um CPF ou login válido.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!segmentoUmbanda && !segmentoKimbanda && !segmentoNacao && !segmentoCandomble && !segmentoOutras) {
      setError('Selecione ao menos uma tradição praticada no terreiro.');
      return;
    }

    if (segmentoOutras && !outrasTradicoesTexto.trim()) {
      setError('Informe qual é a outra tradição praticada.');
      return;
    }

    const success = await registerTerreiro(
      {
        name: nomeTerreiro.trim(),
        endereco: '',
        segmentoUmbanda,
        segmentoKimbanda,
        segmentoNacao,
        segmentoCandomble,
        segmentoOutras,
        outrasTradicoesTexto: outrasTradicoesTexto.trim(),
      },
      {
        cpf: cpf.trim().toLowerCase(), // login — CPF ou string livre
        password: senha,
        nomeCompleto: nomeCompleto.trim(),
        nomeDeSanto: '',
        dataNascimento: '',
        rg: '',
        endereco: '',
        telefone: '',
        email: email.trim().toLowerCase(), // e-mail separado, para contato/recuperação
        whatsapp: '',
        profissao: '',
        nomePais: '',
        spiritual: {
          ...defaultSpiritualData,
          situacaoCadastro: 'ativo',
          segmentoUmbanda,
          segmentoKimbanda,
          segmentoNacao,
          segmentoCandomble,
          segmentoOutras,
          outrasTradicoesTexto: outrasTradicoesTexto.trim(),
          tipoMedium: 'Sacerdote',
        },
      }
    );

    if (success) {
      setStep('success');
    } else {
      setError('Este CPF/login já está em uso. Tente outro ou faça login.');
    }
  };

  /* ── Estilos inline (mesma linguagem visual do app) ── */
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: '#C9A84C',
    marginBottom: 6,
    display: 'block',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = '#0A4A4D');
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    (e.target.style.borderColor = 'rgba(255,255,255,0.12)');

  /* ── Tela de sucesso ── */
  if (step === 'success') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(10,74,77,0.4), rgba(201,168,76,0.2))',
              border: '2px solid rgba(10,74,77,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>✦</div>
            <h1 style={{ ...titleStyle, fontSize: '1.6rem', marginBottom: 8 }}>
              Axé! Seu terreiro foi criado.
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Acesse o app com o seu <strong style={{ color: '#C9A84C' }}>CPF/login</strong> e a senha que você definiu.
              Complete o restante do cadastro do seu terreiro dentro do sistema.
            </p>
          </div>

          <div style={{
            background: 'rgba(10,74,77,0.15)',
            border: '1px solid rgba(10,74,77,0.4)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.8,
          }}>
            <strong style={{ color: '#00C8C8', display: 'block', marginBottom: 6 }}>
              {nomeTerreiro}
            </strong>
            Login: <span style={{ color: '#fff' }}>{cpf}</span><br />
            E-mail: <span style={{ color: '#fff' }}>{email}</span>
          </div>

          <button
            onClick={() => navigate('/login')}
            style={btnPrimaryStyle}
          >
            Acessar o App →
          </button>
        </div>
        <style>{globalStyle}</style>
      </div>
    );
  }

  /* ── Formulário ── */
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#C9A84C',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '5px 14px',
            borderRadius: 40,
            marginBottom: 16,
          }}>
            ✦ {planoLabel[plano] ?? '21 dias grátis'}
          </div>
          <h1 style={titleStyle}>Criar seu terreiro</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Preencha os dados abaixo. Em seguida, acesse o app e finalize o cadastro do seu ilê.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Nome do responsável */}
          <div>
            <label style={labelStyle}>Nome completo *</label>
            <input
              type="text"
              placeholder="Pai/Mãe de Santo..."
              value={nomeCompleto}
              onChange={(e) => { setNomeCompleto(e.target.value); setError(''); }}
              onFocus={onFocus} onBlur={onBlur}
              style={inputStyle}
              autoComplete="name"
              required
            />
          </div>

          {/* Nome do terreiro */}
          <div>
            <label style={labelStyle}>Nome do terreiro *</label>
            <input
              type="text"
              placeholder="Ilê de..."
              value={nomeTerreiro}
              onChange={(e) => { setNomeTerreiro(e.target.value); setError(''); }}
              onFocus={onFocus} onBlur={onBlur}
              style={inputStyle}
              required
            />
          </div>

          {/* CPF / Login */}
          <div>
            <label style={labelStyle}>CPF ou login *</label>
            <input
              type="text"
              placeholder="000.000.000-00 ou nome de usuário"
              value={cpf}
              onChange={(e) => { setCpf(e.target.value); setError(''); }}
              onFocus={onFocus} onBlur={onBlur}
              style={inputStyle}
              autoComplete="username"
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4, display: 'block' }}>
              Será usado para entrar no app. Pode ser CPF ou qualquer login de sua escolha.
            </span>
          </div>

          {/* E-mail */}
          <div>
            <label style={labelStyle}>E-mail *</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onFocus={onFocus} onBlur={onBlur}
              style={inputStyle}
              autoComplete="email"
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4, display: 'block' }}>
              Para contato e recuperação de acesso. Não é usado para login.
            </span>
          </div>

          {/* Senha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Senha *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setError(''); }}
                  onFocus={onFocus} onBlur={onBlur}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 14,
                  }}
                >{showSenha ? '🙈' : '👁'}</button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirmar senha *</label>
              <input
                type={showSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => { setConfirmarSenha(e.target.value); setError(''); }}
                onFocus={onFocus} onBlur={onBlur}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Tradição */}
          <div>
            <label style={labelStyle}>Tradição praticada *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                { key: 'umbanda',  label: 'Umbanda',        cor: '#00C8C8', rgb: '0,200,200', state: segmentoUmbanda,  set: setSegmentoUmbanda },
                { key: 'kimbanda', label: 'Quimbanda',      cor: '#9D4EDD', rgb: '157,78,221', state: segmentoKimbanda, set: setSegmentoKimbanda },
                { key: 'nacao',    label: 'Nação de Orixás', cor: '#C9A84C', rgb: '201,168,76', state: segmentoNacao,    set: setSegmentoNacao },
                { key: 'candomble', label: 'Candomblé',      cor: '#FF6B6B', rgb: '255,107,107', state: segmentoCandomble, set: setSegmentoCandomble },
                { key: 'outras',   label: 'Outras Tradições',cor: '#4EA8DE', rgb: '78,168,222', state: segmentoOutras,   set: setSegmentoOutras },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { item.set(!item.state); setError(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    background: item.state ? `rgba(${item.rgb}, 0.1)` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${item.state ? item.cor : 'rgba(255,255,255,0.1)'}`,
                    color: item.state ? item.cor : '#6b7280',
                    fontWeight: item.state ? 700 : 400,
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${item.state ? item.cor : 'rgba(255,255,255,0.2)'}`,
                    background: item.state ? item.cor : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {item.state && <span style={{ color: '#000', fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  {item.label}
                </button>
              ))}
              
              {segmentoOutras && (
                <input
                  type="text"
                  placeholder="Qual a sua tradição?"
                  value={outrasTradicoesTexto}
                  onChange={(e) => { setOutrasTradicoesTexto(e.target.value); setError(''); }}
                  onFocus={onFocus} onBlur={onBlur}
                  style={{ ...inputStyle, marginTop: 4 }}
                  required={segmentoOutras}
                />
              )}
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div style={{
              background: 'rgba(255,76,76,0.08)',
              border: '1px solid rgba(255,76,76,0.25)',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#ff6b6b',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...btnPrimaryStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: 4,
            }}
          >
            {isLoading ? 'Criando terreiro...' : '✦ Criar Terreiro — Começar Grátis'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginTop: -4 }}>
            Sem cartão de crédito · Cancela quando quiser
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: '#0A4A4D', textDecoration: 'underline' }}>
              Entrar
            </a>
          </p>
        </form>
      </div>

      <style>{globalStyle}</style>
    </div>
  );
}

/* ── Estilos constantes ── */

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0D1117',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 16px',
  fontFamily: "'Inter', sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: '#131920',
  border: '0.5px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: '40px 36px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
};

const titleStyle: React.CSSProperties = {
  fontFamily: "'Sora', 'Inter', sans-serif",
  fontWeight: 800,
  fontSize: '1.75rem',
  color: '#fff',
  letterSpacing: '-0.02em',
  marginBottom: 12,
};

const btnPrimaryStyle: React.CSSProperties = {
  width: '100%',
  background: '#0A4A4D',
  color: '#fff',
  border: 'none',
  borderRadius: 14,
  padding: '16px',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.5px',
  fontFamily: "'Sora', 'Inter', sans-serif",
  transition: 'background 0.2s',
};

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Inter:wght@400;500;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input::placeholder { color: rgba(255,255,255,0.2); }
  button:hover { filter: brightness(1.1); }
`;
