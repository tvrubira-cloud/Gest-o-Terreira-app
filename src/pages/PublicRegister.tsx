import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { defaultSpiritualData } from '../store/useStore';
import { supabase } from '../lib/supabase';

interface ExistingUser {
  id: string;
  nomeCompleto: string;
  nomeDeSanto: string;
  terreiroId: string;
  terreiroName: string;
  role: string;
}

export default function PublicRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plano = searchParams.get('plano') || 'trial';

  const registerTerreiro = useStore((s) => s.registerTerreiro);
  const checkExistingCpfWithTerreiros = useStore((s) => s.checkExistingCpfWithTerreiros);
  const migrateUserToTerreiro = useStore((s) => s.migrateUserToTerreiro);
  const login = useStore((s) => s.login);
  const initializeData = useStore((s) => s.initializeData);
  const isLoading = useStore((s) => s.isLoading);

  const [step] = useState<'form' | 'success' | 'migrate'>('form');
  const [error, setError] = useState('');
  const [cpfChecked, setCpfChecked] = useState(false);
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);

  // Campos do formulário
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeTerreiro, setNomeTerreiro] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [palavraChave, setPalavraChave] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showPalavraChave, setShowPalavraChave] = useState(false);

  // Estados para migração
  const [selectedTerreiroId, setSelectedTerreiroId] = useState<string>('');
  const [keepInOldTerreiro, setKeepInOldTerreiro] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  // Tradição
  const [segmentoUmbanda, setSegmentoUmbanda] = useState(true);
  const [segmentoKimbanda, setSegmentoKimbanda] = useState(false);
  const [segmentoNacao, setSegmentoNacao] = useState(false);
  const [segmentoCandomble, setSegmentoCandomble] = useState(false);
  const [segmentoOutras, setSegmentoOutras] = useState(false);
  const [outrasTradicoesTexto, setOutrasTradicoesTexto] = useState('');

  const planoLabel: Record<string, string> = {
    trial: '21 dias grátis',
    ile: 'Plano Ilê',
    axe: 'Plano Axé',
    orun: 'Plano Orun',
  };

  const cpfDigits = cpf.replace(/\D/g, '');

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const sendWelcomeEmail = async (plan: string) => {
    const { error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: email.trim().toLowerCase(),
        nomeCompleto: nomeCompleto.trim(),
        nomeTerreiro: nomeTerreiro.trim(),
        cpf: cpfDigits,
        plan,
        loginUrl: `${window.location.origin}/login`,
      },
    });
    if (error) console.warn('[PublicRegister] Falha ao enviar e-mail de boas-vindas:', error);
  };

  const sendCredentialsEmail = async () => {
    const { error } = await supabase.functions.invoke('send-credentials-email', {
      body: {
        email: email.trim().toLowerCase(),
        nomeCompleto: nomeCompleto.trim(),
        nomeTerreiro: nomeTerreiro.trim(),
        cpf: cpfDigits,
        senha,
        loginUrl: `${window.location.origin}/login`,
      },
    });

    if (error) {
      console.warn('[PublicRegister] Falha ao enviar email de credenciais:', error);
    }
  };

  const handleCpfBlur = async () => {
    if (cpfDigits.length !== 11) {
      setCpfChecked(false);
      setExistingUsers([]);
      return;
    }

    const result = await checkExistingCpfWithTerreiros(cpfDigits);
    if (result.exists && result.users && result.users.length > 0) {
      setExistingUsers(result.users);
      setCpfChecked(true);
    } else {
      setCpfChecked(false);
      setExistingUsers([]);
    }
  };

  const handleMigrate = async () => {
    if (!selectedTerreiroId) {
      setError('Selecione um terreiro para continuar.');
      return;
    }

    setIsMigrating(true);
    setError('');

    try {
      const result = await migrateUserToTerreiro(
        cpfDigits,
        selectedTerreiroId,
        keepInOldTerreiro,
        {
          nomeCompleto: nomeCompleto.trim(),
          nomeDeSanto: '',
          dataNascimento: '',
          rg: '',
          endereco: '',
          telefone: '',
          email: email.trim().toLowerCase(),
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

      if (result.success) {
        localStorage.setItem('orun_saved_cpf', cpfDigits);
        localStorage.setItem('orun_remember_cpf', 'true');
        navigate('/login');
      } else {
        setError(result.error || 'Erro ao migrar usuário.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao migrar usuário.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCreateNewTerreiro = async () => {
    if (!nomeTerreiro.trim()) {
      setError('Informe o nome do novo terreiro.');
      return;
    }

    setIsMigrating(true);
    setError('');

    try {
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
          cpf: cpfDigits,
          password: senha,
          nomeCompleto: nomeCompleto.trim(),
          nomeDeSanto: '',
          dataNascimento: '',
          rg: '',
          endereco: '',
          telefone: '',
          email: email.trim().toLowerCase(),
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
        if (keepInOldTerreiro && existingUsers.length > 0) {
          for (const existingUser of existingUsers) {
            await migrateUserToTerreiro(
              cpfDigits,
              existingUser.terreiroId,
              true,
              {
                nomeCompleto: nomeCompleto.trim(),
              }
            );
          }
        }

        await sendCredentialsEmail();
        localStorage.setItem('orun_saved_cpf', cpfDigits);
        localStorage.setItem('orun_remember_cpf', 'true');
        navigate('/login');
      } else {
        setError('Erro ao criar novo terreiro.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar novo terreiro.');
    } finally {
      setIsMigrating(false);
    }
  };

  const resetToForm = () => {
    setExistingUsers([]);
    setCpfChecked(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nomeCompleto.trim() || !nomeTerreiro.trim() || !cpf.trim() || !email.trim() || !senha) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    if (cpfDigits.length !== 11) {
      setError('Informe um CPF valido com 11 digitos.');
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

    if (!palavraChave.trim() || palavraChave.trim().length < 3) {
      setError('Informe uma palavra-chave com ao menos 3 caracteres. Ela é usada para recuperar sua senha.');
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

    const existingCheck = await checkExistingCpfWithTerreiros(cpfDigits);
    if (existingCheck.exists && existingCheck.users && existingCheck.users.length > 0) {
      setExistingUsers(existingCheck.users);
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
        cpf: cpfDigits,
        password: senha,
        palavraChave: palavraChave.trim().toLowerCase(),
        nomeCompleto: nomeCompleto.trim(),
        nomeDeSanto: '',
        dataNascimento: '',
        rg: '',
        endereco: '',
        telefone: '',
        email: email.trim().toLowerCase(),
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
      // Trial → e-mail imediato. Plano pago → e-mail só após pagamento (webhook Stripe)
      if (plano === 'trial') {
        sendWelcomeEmail(plano).catch(e => console.warn('Email boas-vindas falhou:', e));
      }
      localStorage.setItem('orun_saved_cpf', cpfDigits);
      localStorage.setItem('orun_remember_cpf', 'true');

      // Login para popular o store
      await new Promise(r => setTimeout(r, 800));
      const loggedIn = await login(cpfDigits, senha);
      if (!loggedIn) { navigate('/login'); return; }
      await initializeData();

      // Plano pago → abre Stripe com terreiroId já populado
      if (plano !== 'trial') {
        localStorage.setItem('orun_temp_pwd_' + cpfDigits, senha);
        const terreiroId = useStore.getState().currentTerreiroId;
        const userId = useStore.getState().currentUser?.id || '';
        const emailVal = useStore.getState().currentUser?.email || email.trim().toLowerCase();
        console.log('[Checkout] plano:', plano, 'terreiroId:', terreiroId, 'email:', emailVal);
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
              plan: plano,
              billing: 'month',
              terreiroId,
              email: emailVal,
              userId,
              successUrl: `${window.location.origin}/dashboard?payment=success`,
              cancelUrl: `${window.location.origin}/planos?payment=cancelled`,
            }),
          });
          const data = await res.json();
          console.log('[Checkout] resposta:', res.status, JSON.stringify(data));
          if (data.url) {
            window.location.href = data.url;
            return;
          }
          console.error('[Checkout] URL não recebida:', data);
        } catch (e) {
          console.error('[Checkout] Erro:', e);
        }
      }

      // Trial ou fallback
      navigate('/dashboard');
    } else {
      setError('Este CPF ja esta em uso. Tente outro ou faca login.');
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

  /* ── Tela de migração (CPF já existente) ── */
  if (existingUsers.length > 0) {
    const uniqueTerreiros = existingUsers.filter((v, i, a) => a.findIndex(t => t.terreiroId === v.terreiroId) === i);

    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(201,168,76,0.4), rgba(10,74,77,0.2))',
              border: '2px solid rgba(201,168,76,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
            }}>⚠</div>
            <h1 style={{ ...titleStyle, fontSize: '1.5rem', marginBottom: 8 }}>
              CPF já cadastrado
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Você já possui cadastro no sistema. O que gostaria de fazer?
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>
                Seus terreiros atuais:
              </p>
              {uniqueTerreiros.map((user) => (
                <div key={user.terreiroId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <input
                    type="radio"
                    name="selectedTerreiro"
                    value={user.terreiroId}
                    checked={selectedTerreiroId === user.terreiroId}
                    onChange={(e) => setSelectedTerreiroId(e.target.value)}
                    style={{ accentColor: '#0A4A4D' }}
                  />
                  <div>
                    <span style={{ color: '#fff', fontSize: '0.95rem' }}>{user.terreiroName}</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginLeft: 8 }}>
                      ({user.nomeCompleto || 'Admin'})
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px', background: 'rgba(10,74,77,0.1)', borderRadius: 12, border: '1px solid rgba(10,74,77,0.3)' }}>
              <p style={{ color: '#0A4A4D', fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>
                Ou crie um novo terreiro:
              </p>
              <input
                type="text"
                placeholder="Nome do novo terreiro"
                value={nomeTerreiro}
                onChange={(e) => { setNomeTerreiro(e.target.value); setError(''); }}
                style={inputStyle}
              />
            </div>

            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={keepInOldTerreiro}
                  onChange={(e) => setKeepInOldTerreiro(e.target.checked)}
                  style={{ accentColor: '#0A4A4D', width: 18, height: 18 }}
                />
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                  Manter meus dados também no terreiro antigo
                </span>
              </label>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: 6, marginLeft: 28 }}>
                Útil quando um filho de santo abre seu próprio terreiro
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,76,76,0.08)',
              border: '1px solid rgba(255,76,76,0.25)',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#ff6b6b',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {selectedTerreiroId ? (
              <button
                type="button"
                onClick={handleMigrate}
                disabled={isMigrating}
                style={{
                  ...btnPrimaryStyle,
                  opacity: isMigrating ? 0.7 : 1,
                  cursor: isMigrating ? 'not-allowed' : 'pointer',
                }}
              >
                {isMigrating ? 'Migrando...' : '✦ Entrar no Terreiro Selecionado'}
              </button>
            ) : nomeTerreiro.trim() ? (
              <button
                type="button"
                onClick={handleCreateNewTerreiro}
                disabled={isMigrating || !nomeTerreiro.trim() || !senha || senha.length < 6}
                style={{
                  ...btnPrimaryStyle,
                  opacity: (isMigrating || !nomeTerreiro.trim() || !senha || senha.length < 6) ? 0.7 : 1,
                  cursor: (isMigrating || !nomeTerreiro.trim() || !senha || senha.length < 6) ? 'not-allowed' : 'pointer',
                }}
              >
                {isMigrating ? 'Criando...' : '✦ Criar Novo Terreiro'}
              </button>
            ) : (
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                Selecione um terreiro ou informe o nome de um novo
              </div>
            )}

            <button
              type="button"
              onClick={resetToForm}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '14px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              Voltar ao formulário
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: '#0A4A4D', textDecoration: 'underline' }}>
              Entrar
            </a>
          </p>
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

          {/* CPF para login */}
          <div>
            <label style={labelStyle}>CPF para login *</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => { setCpf(formatCpf(e.target.value)); setError(''); setExistingUsers([]); setCpfChecked(false); }}
              onFocus={onFocus} onBlur={(e) => { onBlur(e); handleCpfBlur(); }}
              style={inputStyle}
              inputMode="numeric"
              autoComplete="username"
              required
            />
            {cpfChecked && existingUsers.length > 0 && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8 }}>
                <span style={{ color: '#C9A84C', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠️ CPF já cadastrado
                </span>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', marginTop: 4 }}>
                  Você já possui cadastro em: {existingUsers.map(u => u.terreiroName).join(', ')}
                </p>
              </div>
            )}
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4, display: 'block' }}>
              Será usado para entrar no app junto com a senha.
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
              As credenciais de acesso serão enviadas para este e-mail.
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

          {/* Palavra-chave para recuperação de senha */}
          <div style={{
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            <label style={{ ...labelStyle, color: '#C9A84C' }}>
              🔑 Palavra-chave (recuperação de senha) *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPalavraChave ? 'text' : 'password'}
                placeholder="Ex: nome da sua cidade natal, animal favorito..."
                value={palavraChave}
                onChange={(e) => { setPalavraChave(e.target.value); setError(''); }}
                onFocus={onFocus} onBlur={onBlur}
                style={{ ...inputStyle, paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPalavraChave((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', fontSize: 14,
                }}
              >{showPalavraChave ? '🙈' : '👁'}</button>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 6, display: 'block', lineHeight: 1.5 }}>
              ⚠️ Guarde esta palavra! Ela é a única forma de recuperar sua senha caso esqueça.
            </span>
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
            {isLoading
              ? 'Criando terreiro...'
              : plano === 'trial'
                ? '✦ Criar Terreiro — Começar Grátis'
                : '✦ Criar Terreiro — Ir para Pagamento'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginTop: -4 }}>
            {plano === 'trial' ? 'Sem cartão de crédito · Cancela quando quiser' : 'Você será redirecionado para o pagamento seguro'}
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
