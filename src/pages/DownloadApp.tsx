import { motion } from 'framer-motion';
import { Download, Smartphone, Apple, Share2, PlusSquare, ShieldCheck, ArrowRight } from 'lucide-react';

const APK_URL = '/downloads/OrunApp.apk';
const SITE_URL = 'https://www.orunapp.com.br';

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function DownloadApp() {
  const android = isAndroid();
  const ios = isIOS();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#05050A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.2rem',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 520, width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <h1
            className="text-gradient"
            style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Smartphone size={26} /> Acessar o OrunApp
          </h1>
          <p style={{ color: 'var(--text-muted, #8a8a9a)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Baixe o aplicativo no seu Android, ou acesse direto pelo navegador no iPhone.
          </p>
        </div>

        {/* ANDROID */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: 16,
            border: android ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
            background: android ? 'rgba(0,240,255,0.06)' : 'rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(0,240,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Smartphone size={22} color="#00f0ff" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#00f0ff', fontSize: '1.1rem' }}>Android</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #8a8a9a)' }}>
                Baixe e instale o aplicativo direto no seu celular
              </p>
            </div>
          </div>

          <a
            href={APK_URL}
            download
            style={{
              padding: '1rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #00f0ff, #00f0ff88)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Download size={18} /> Baixar OrunApp (.apk)
          </a>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted, #8a8a9a)' }}>
            <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 2 }} color="#00ff88" />
            <span>
              Ao instalar, o Android pode pedir permissão para "fontes desconhecidas".
              Isso é normal — toque em <strong>Configurações</strong> e ative a opção para instalar este app.
            </span>
          </div>
        </motion.div>

        {/* iPHONE */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-panel"
          style={{
            padding: '1.5rem',
            borderRadius: 16,
            border: ios ? '2px solid #9D4EDD' : '1px solid rgba(255,255,255,0.1)',
            background: ios ? 'rgba(157,78,221,0.06)' : 'rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(157,78,221,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Apple size={22} color="#9D4EDD" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#9D4EDD', fontSize: '1.1rem' }}>iPhone</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #8a8a9a)' }}>
                Acesse pelo Safari e adicione à tela de início
              </p>
            </div>
          </div>

          <a
            href={SITE_URL}
            style={{
              padding: '1rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #9D4EDD, #9D4EDD88)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <ArrowRight size={18} /> Acessar pelo Safari
          </a>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted, #8a8a9a)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(157,78,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: '#9D4EDD' }}>1</span>
              Abra <strong style={{ color: '#fff' }}>orunapp.com.br</strong> pelo navegador Safari
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(157,78,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: '#9D4EDD' }}>2</span>
              Toque no ícone <Share2 size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> de Compartilhar
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(157,78,221,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 700, color: '#9D4EDD' }}>3</span>
              Selecione <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> <strong style={{ color: '#fff' }}>"Adicionar à Tela de Início"</strong>
            </div>
          </div>
        </motion.div>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted, #666)', marginTop: '0.5rem' }}>
          Em caso de dúvidas, fale com o administrador da sua casa.
        </p>
      </motion.div>
    </div>
  );
}
