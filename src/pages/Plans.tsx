import { useState, useEffect, useRef } from 'react';
import { useStore, PLAN_LABELS, PLAN_FEATURES, type PlanType, type Feature } from '../store/useStore';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, Loader2, Sparkles, CreditCard, ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type BillingPeriod = 'month' | 'year';

const FEATURE_LABELS: Record<Feature, string> = {
  members: 'Gestão de Membros',
  crm_spiritual: 'CRM Espiritual',
  events: 'Agenda e Eventos',
  broadcast_push: 'Comunicados e Push',
  knowledge_hub: 'Centro de Conhecimento',
  financial: 'Financeiro Completo',
  cash_flow: 'Fluxo de Caixa',
  pix_integration: 'Integração PIX',
  charges: 'Cobranças',
  whatsapp: 'Integração WhatsApp',
  inventory: 'Inventário',
  shopping_list: 'Lista de Compras',
  multi_casas: 'Múltiplas Casas',
  access_control: 'Controle de Acesso',
  central_panel: 'Painel Central',
};

const PLAN_COLORS: Record<PlanType, string> = {
  trial: '#C9A84C',
  ile: '#00f0ff',
  axe: '#9D4EDD',
  orun: '#ff6b35',
};

const PLAN_ORDER: PlanType[] = ['trial', 'ile', 'axe', 'orun'];

export default function Plans() {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const currentTerreiroId = useStore(s => s.currentTerreiroId);
  const getCurrentTerreiro = useStore(s => s.getCurrentTerreiro);
  const initializeData = useStore(s => s.initializeData);
  const currentTerreiro = getCurrentTerreiro();

  const [loading, setLoading] = useState<PlanType | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billing, setBilling] = useState<BillingPeriod>('month');

  const handleSubscribe = async (plan: PlanType) => {
    if (plan === 'trial' || !currentUser || !currentTerreiro) return;
    if (plan === currentTerreiro.plan) {
      setError('Você já está neste plano.');
      return;
    }

    setLoading(plan);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing,
          terreiroId: currentTerreiroId,
          email: currentUser.email,
          userId: currentUser.id,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/planos?payment=cancelled`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const searchParams = new URLSearchParams(window.location.search);
  const paymentStatus = searchParams.get('payment');
  const preselectedPlan = searchParams.get('plan') as PlanType | null;

  useEffect(() => {
    if (paymentStatus === 'success') {
      initializeData(currentTerreiroId || undefined);
      navigate('/dashboard', { replace: true });
    }
  }, []);

  const planRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (preselectedPlan && planRefs.current[preselectedPlan]) {
      planRefs.current[preselectedPlan]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [preselectedPlan]);

  const currentPlan = currentTerreiro?.plan || 'trial';

  const monthlyTotal = {
    ile: 57,
    axe: 79,
    orun: 97,
  };

  const annualPrices = {
    ile: 564,
    axe: 804,
    orun: 1008,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div>
          <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={24} /> Planos e Assinatura
          </h2>
          {currentTerreiro && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
              {currentTerreiro.name} — Plano atual: <strong style={{ color: '#00f0ff' }}>{PLAN_LABELS[currentPlan]}</strong>
            </p>
          )}
        </div>
      </div>

      {paymentStatus === 'cancelled' && (
        <div style={{ padding: '1rem', background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 10, color: '#ffcc00', fontSize: '0.9rem' }}>
          Pagamento cancelado. Seu plano não foi alterado.
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(255,76,76,0.08)', border: '1px solid rgba(255,76,76,0.3)', borderRadius: 10, color: '#ff4c4c', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '1rem', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 10, color: '#00ff88', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {/* ── Toggle Mensal / Anual ── */}
      {currentPlan === 'trial' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '0.3rem', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setBilling('month')}
              style={{
                padding: '0.6rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: billing === 'month' ? 'rgba(0,240,255,0.15)' : 'transparent',
                color: billing === 'month' ? '#00f0ff' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('year')}
              style={{
                padding: '0.6rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: billing === 'year' ? 'rgba(157,78,221,0.15)' : 'transparent',
                color: billing === 'year' ? '#9D4EDD' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              Anual <Zap size={14} />
              <span style={{ fontSize: '0.65rem', background: '#9D4EDD', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 10, fontWeight: 800 }}>ECONOMIZE</span>
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {PLAN_ORDER.filter(plan => currentPlan === 'trial' || plan !== 'trial').map((plan) => {
          const isCurrent = plan === currentPlan && plan !== 'trial';
          const isTrial = plan === 'trial';
          const color = PLAN_COLORS[plan];
          const features = PLAN_FEATURES[plan] || [];

          const monthlyPrice = monthlyTotal[plan as keyof typeof monthlyTotal] || 0;
          const annualPrice = annualPrices[plan as keyof typeof annualPrices] || 0;
          const displayPrice = billing === 'month' ? monthlyPrice : annualPrice;
          const economy = monthlyPrice > 0 ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100) : 0;

          return (
            <motion.div
              key={plan}
              ref={(el) => { planRefs.current[plan] = el; }}
              whileHover={{ y: -4 }}
              className={`glass-panel ${isCurrent || plan === preselectedPlan ? 'glow-fx' : ''}`}
              style={{
                padding: '2rem',
                borderRadius: 'var(--panel-radius)',
                border: isCurrent ? `2px solid ${color}` : plan === preselectedPlan ? `2px solid ${color}` : '1px solid var(--glass-border)',
                background: isCurrent ? `rgba(${plan === 'ile' ? '0,240,255' : plan === 'axe' ? '157,78,221' : plan === 'orun' ? '255,107,53' : '201,168,76'},0.06)` : undefined,
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                position: 'relative',
              }}
            >
              {isCurrent && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: color, color: '#000', padding: '0.2rem 0.8rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  Plano Atual
                </div>
              )}

              {billing === 'year' && economy > 0 && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: '#9D4EDD', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: 8, fontSize: '0.65rem', fontWeight: 800 }}>
                  -{economy}%
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isTrial ? <Sparkles size={22} color={color} /> : <Crown size={22} color={color} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color }}>{PLAN_LABELS[plan]}</h3>
                  {isTrial ? (
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>21 dias grátis</div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                        R$ {displayPrice.toFixed(2).replace('.', ',')}
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          {billing === 'month' ? '/mês' : '/ano'}
                        </span>
                      </div>
                      {billing === 'year' && monthlyPrice > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          R$ {monthlyPrice.toFixed(2).replace('.', ',')}/mês • economia de {economy}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {features.map((feature) => (
                  <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={16} color={color} />
                    {FEATURE_LABELS[feature] || feature}
                  </div>
                ))}
              </div>

              {!isTrial && (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading !== null || isCurrent}
                  style={{
                    padding: '1rem',
                    borderRadius: 10,
                    border: 'none',
                    background: isCurrent ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${color}, ${color}88)`,
                    color: isCurrent ? 'var(--text-muted)' : '#000',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: isCurrent || loading !== null ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isCurrent ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading === plan ? (
                    <><Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Redirecionando...</>
                  ) : isCurrent ? (
                    <>Plano Atual</>
                  ) : (
                    <><CreditCard size={18} /> Assinar Agora</>
                  )}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
