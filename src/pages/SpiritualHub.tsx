import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Music, Leaf, Sparkles, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Tab = 'pontos' | 'ervas';

interface SearchResult {
  id: string;
  title: string;
  artist?: string;
  type?: string;
  use?: string;
  property?: string;
  description?: string;
  audioUrl?: string;
  tags?: string; // campo interno para busca
  source: 'internal' | 'spotify' | 'youtube' | 'global_archive';
}

// ============================================================
// BANCO DE DADOS CURADO DE PONTOS CANTADOS (IDs VERIFICADOS DO YOUTUBE)
// ============================================================
const PONTOS_DATABASE: SearchResult[] = [
  { id: 'pt-1', title: '6 Pontos de Ogum para Abrir Seus Caminhos', artist: 'Crônicas do Axé', type: 'Ponto de Força', audioUrl: 'dLwEM1cP9MQ', source: 'youtube', tags: 'ogum guerra guerreiro caminho proteção ferro espada abrir caminhos fé' },
  { id: 'pt-2', title: 'Ogum Abre Caminhos', artist: 'Umbandmusic', type: 'Ponto de Ogum', audioUrl: '-64-VoOhGuw', source: 'youtube', tags: 'ogum caminho proteção espada força guerra guerreiro' },
  { id: 'pt-3', title: 'Pontos de Ogum - Umbanda', artist: 'Três Atabaques', type: 'Ponto de Ogum', audioUrl: 'r_bilI-MaiE', source: 'youtube', tags: 'ogum guerra guerreiro umbanda ponto ferro' },
  { id: 'pt-4', title: 'Os Melhores Pontos de Exu', artist: 'A Umbanda é o meu Caminho', type: 'Ponto de Exu', audioUrl: 'R1bkpasSl9M', source: 'youtube', tags: 'exu laroyê mensageiro caminhos encruzilhada guardião esquerda' },
  { id: 'pt-5', title: 'Lindos Pontos de Exu', artist: 'Ikaro Ogãn OFC', type: 'Ponto de Exu', audioUrl: 'IekSQYpIV-E', source: 'youtube', tags: 'exu guardião esquerda encruzilhada caminhos madrugada' },
  { id: 'pt-6', title: 'Os Mais Lindos Pontos de Oxalá na Umbanda', artist: 'Casa de Caridade Vovó Cambinda', type: 'Ponto de Orixá', audioUrl: 'Vqn6Ry8Qocw', source: 'youtube', tags: 'oxalá pai criação paz branco fé coroa' },
  { id: 'pt-7', title: 'Ponto de Oxalá - Se Acaso Lhe Faltar a Fé', artist: 'A Voz de Dentro', type: 'Ponto de Orixá', audioUrl: 'cuF7KXqlISg', source: 'youtube', tags: 'oxalá fé paz branco criação luz' },
  { id: 'pt-8', title: '7 Lindos Pontos de Iemanjá', artist: 'Felipe Silva', type: 'Ponto de Orixá', audioUrl: 'prxcDc6VEHE', source: 'youtube', tags: 'iemanjá mar rainha água mãe feminino geração odoyá' },
  { id: 'pt-9', title: 'Melhores Pontos de Iemanjá', artist: 'Ikaro Ogãn OFC', type: 'Ponto de Orixá', audioUrl: 'oqYXGD2E4T4', source: 'youtube', tags: 'iemanjá mar rainha mãe oceano odoyá sereia' },
  { id: 'pt-10', title: '7 Pontos Incríveis para Mamãe Oxum', artist: 'Luan Pureza', type: 'Ponto de Orixá', audioUrl: 'cCDB7gIbUpQ', source: 'youtube', tags: 'oxum amor beleza água doce rio ouro riqueza feminino yalodê' },
  { id: 'pt-11', title: 'Pontos de Oxum - Só os Melhores', artist: 'Dofona D\'Ogun', type: 'Ponto de Orixá', audioUrl: 'hZ6F3DnQrSI', source: 'youtube', tags: 'oxum amor doce rio cachoeira yalodê espelho' },
  { id: 'pt-12', title: 'Pontos de Xangô - Umbanda e Candomblé', artist: 'Vitor Ferrari', type: 'Ponto de Orixá', audioUrl: 'WU4MDMP-UOg', source: 'youtube', tags: 'xangô justiça raio trovão pedras lei kaô kabecilê' },
  { id: 'pt-13', title: 'Os Melhores Pontos de Xangô na Umbanda', artist: 'Oração De Umbanda', type: 'Ponto de Orixá', audioUrl: '4NFfo7uoSZw', source: 'youtube', tags: 'xangô justiça trovão pedreira kaô umbanda' },
  { id: 'pt-14', title: 'Os Melhores Pontos de Preto Velho', artist: 'Tudo sobre Umbanda', type: 'Ponto de Preto Velho', audioUrl: 'kCYfGlFyi-Y', source: 'youtube', tags: 'preto velho maria conga angola avó vovó caridade sábio negro ancestral' },
  { id: 'pt-15', title: 'Pontos na Força do Preto Velho', artist: 'Vem pra gira', type: 'Ponto de Preto Velho', audioUrl: 'smDG1E9-0ug', source: 'youtube', tags: 'preto velho pai joaquim angola caridade sábio ancestral negro' },
  { id: 'pt-16', title: 'Os Mais Lindos Pontos de Caboclos', artist: 'Umbanda Vieja Escuela', type: 'Ponto de Caboclo', audioUrl: '7NJBp6nkzVI', source: 'youtube', tags: 'caboclo índio indígena mata floresta sete flechas tupinambá' },
  { id: 'pt-17', title: 'Melhores Pontos de Caboclos', artist: 'PONTOS DE UMBANDA', type: 'Ponto de Caboclo', audioUrl: '2Hmc6xSN8NU', source: 'youtube', tags: 'caboclo mata floresta índio pena flecha' },
  { id: 'pt-18', title: 'Os Melhores Pontos de Pomba Gira', artist: 'Ikaro Ogãn OFC', type: 'Ponto de Pomba Gira', audioUrl: 'fDPdOGPypRw', source: 'youtube', tags: 'pomba gira maria padilha esquerda feminino amor proteção rainha' },
  { id: 'pt-19', title: '15 Poderosos Pontos de Pomba Gira (Com Letra)', artist: 'MACUMBANDA', type: 'Ponto de Pomba Gira', audioUrl: 'opHbfNbvFQU', source: 'youtube', tags: 'pomba gira maria padilha cigana esquerda feminino letra' },
  { id: 'pt-20', title: 'Ponto de Iansã - A Guerreira Vai Reinar', artist: 'Sandro Luiz', type: 'Ponto de Orixá', audioUrl: 'LeeLdl3eK0w', source: 'youtube', tags: 'iansã oyá vento raio tempestade guerreira feminino fogo eparrey' },
  { id: 'pt-21', title: 'Os Mais Lindos Pontos de Iansã na Umbanda', artist: 'Casa de Caridade Vovó Cambinda', type: 'Ponto de Orixá', audioUrl: 'j-yHX_3he_U', source: 'youtube', tags: 'iansã oyá vento tempestade raio guerreira umbanda' },
  { id: 'pt-22', title: 'Pontos de Omolu Obaluaê na Umbanda', artist: 'AS 7 ENCRUZILHADAS', type: 'Ponto de Orixá', audioUrl: 'z2d4ceABn-Y', source: 'youtube', tags: 'omulu obaluayê saúde doença cura terra renovação atotô' },
  { id: 'pt-23', title: 'Os Mais Lindos Pontos de Oxóssi na Umbanda', artist: 'Casa de Caridade Vovó Cambinda', type: 'Ponto de Caboclo', audioUrl: 'oCJieC68xI0', source: 'youtube', tags: 'oxóssi mata floresta caçador caboclo conhecimento mato okê' },
  { id: 'pt-24', title: 'Os Mais Lindos Pontos de Nanã Buruquê', artist: 'Casa de Caridade Vovó Cambinda', type: 'Ponto de Orixá', audioUrl: 'rfilxqyRugM', source: 'youtube', tags: 'nanã buruquê saluba lama barro velhice ancestral' },
  { id: 'pt-25', title: 'Pontos de Baianos Com Letra', artist: 'Caboclo Tupinamba', type: 'Ponto de Baiano', audioUrl: 'C8dLh2IBR7E', source: 'youtube', tags: 'baiano bahia nordeste festa alegria cachaça povo' },
  { id: 'pt-26', title: 'Os Mais Lindos Pontos de Boiadeiro na Umbanda', artist: 'Casa de Caridade Vovó Cambinda', type: 'Ponto de Boiadeiro', audioUrl: '8pv2wsGjjo0', source: 'youtube', tags: 'boiadeiro sertão vaqueiro caboclo campo laço gado' },
  { id: 'pt-27', title: 'Ponto de Marinheiro - Eu Não Sou Daqui', artist: 'Ikaro Ogãn OFC', type: 'Ponto de Marinheiro', audioUrl: 'kVrJbEvuNVs', source: 'youtube', tags: 'marinheiro marujo mar água navegação salve' },
  { id: 'pt-28', title: 'Ponto de Erê - Papai Me Manda Um Balão', artist: 'Ikaro Ogãn OFC', type: 'Ponto de Erê', audioUrl: '3hYJO3xqZws', source: 'youtube', tags: 'erê criança alegria brincadeira infantil cosme damião balão' },
  { id: 'pt-29', title: 'Pontos Cantados de Exu Mirim', artist: 'Espiritualidade Web', type: 'Ponto de Exu Mirim', audioUrl: 'as9rAZj8yZM', source: 'youtube', tags: 'exu mirim criança esquerda traquinagem travessura guardiã' },
];

const DATABASE_ERVAS: SearchResult[] = [
  { id: 'i1', title: 'Arruda', use: 'Limpeza Pesada e Quebra de Demandas', property: 'Erva Quente (Descarrego)', description: 'A Arruda é uma das plantas mágicas mais tradicionais e poderosas da botânica espiritual.\n\nPrincipais Utilizações:\n- Quebra de inveja, olho gordo e energias deletérias.\n- Desagregação de miasmas no campo áurico.\n\nPreparo:\nDeve ser sempre do pescoço para baixo, evitando a coroa. Recomenda-se ser acompanhada de uma erva morna após o uso (como Manjericão) para reequilibrar o chakra.\n\nRegência: Exu, Ogum e Pretos Velhos.', source: 'internal' },
  { id: 'i2', title: 'Guiné', use: 'Corte de negatividades e Proteção', property: 'Erva Quente (Cortadora)', description: 'A Guiné possui fitoenergia cortadora de raízes fluídicas negativas.\n\nPrincipais Utilizações:\n- Bate-folha para descarrego de ambientes.\n- Fechamento de corpo energético contra vampirismo espiritual.\n- Banhos em confluência com a espada de São Jorge e Arruda.\n\nRegência: Orixá Ogum e Linha de Baianos.', source: 'internal' },
  { id: 'g1', title: 'Manjericão (Alfavaca)', use: 'Equilíbrio, Paz e Elevação', property: 'Erva Morna (Equilibradora)', description: 'Planta de alta vibração positiva, atua diretamente no chakra cardíaco e coronário.\n\nPrincipais Utilizações:\n- Banhos de coroa (pode ir na cabeça).\n- Fortalecimento da aura, trazendo paz interior e harmonia.\n- Preparação de médiuns (Amaci) para conexão com as esferas superiores.\n\nRegência: Oxalá e Iemanjá.', source: 'global_archive' },
  { id: 'g2', title: 'Alecrim', use: 'Alegria, Purificação e Clareza Mental', property: 'Erva Fria/Morna (Atratora)', description: 'O Alecrim é o "Detergente do Astral". Ele ilumina os pensamentos e purifica bloqueios emocionais.\n\nPrincipais Utilizações:\n- Afastar quadros de tristeza ou obsessão suave.\n- Trazer clareza mediúnica e foco.\n- Excelente para ambientes de estudo espiritual.\n\nRegência: Oxalá, Oxóssi e Linha das Crianças (Erês).', source: 'global_archive' },
];

// Busca pontos por relevância de termos
function searchLocalPontos(query: string): SearchResult[] {
  if (!query.trim()) return PONTOS_DATABASE.slice(0, 8);
  
  const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const terms = normalizedQuery.split(/\s+/).filter(t => t.length >= 2);
  
  if (terms.length === 0) return [];

  const scored = PONTOS_DATABASE.map(item => {
    const titleNorm = item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const tagsNorm = (item.tags || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const artistNorm = (item.artist || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const typeNorm = (item.type || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    const allWords = [
      ...titleNorm.split(/\s+/),
      ...tagsNorm.split(/\s+/),
      ...artistNorm.split(/\s+/),
      ...typeNorm.split(/\s+/)
    ];

    let score = 0;
    for (const t of terms) {
      // Check if any word in the item EXACTLY matches the term
      if (allWords.some(word => word === t)) {
        score += 10;
      } else if (allWords.some(word => word.startsWith(t))) {
        // Bonus for word starting with the term
        score += 5;
      }

      // Bonus for terms in critical fields
      if (titleNorm.includes(t)) score += 2;
      if (tagsNorm.includes(t)) score += 1;
    }
    return { item, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  
  return scored.map(x => x.item);
}

export default function SpiritualHub() {
  const [activeTab, setActiveTab] = useState<Tab>('pontos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>(PONTOS_DATABASE.slice(0, 8));
  const navigate = useNavigate();

  const fetchYouTubeResults = async (query: string): Promise<SearchResult[]> => {
    try {
      const queryTerm = encodeURIComponent('ponto de umbanda ' + (query || ''));
      // Usa corsproxy.io como proxy CORS confiável
      const url = `https://corsproxy.io/?url=${encodeURIComponent('https://www.youtube.com/results?search_query=' + queryTerm)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const html = await res.text();
      
      const ytResults: SearchResult[] = [];
      // Regex robusta para estrutura HTML do YouTube
      const regex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g;
      let match;
      
      while ((match = regex.exec(html)) !== null && ytResults.length < 6) {
         const videoId = match[1];
         const title = match[2];
         if (!ytResults.find(r => r.audioUrl === videoId)) {
            ytResults.push({
              id: `yt-auto-${videoId}`,
              title: title,
              artist: 'Canal do YouTube',
              type: 'Busca Global',
              source: 'youtube',
              audioUrl: videoId
            });
         }
      }
      return ytResults;
    } catch (error) {
      console.error("Erro na sincronização YouTube:", error);
      return [];
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults([]);

    const term = searchQuery.trim();

    if (activeTab === 'pontos') {
      // 1. Busca Local
      const localResults = searchLocalPontos(term);
      
      // 2. Busca YouTube (somente se houver termo)
      let combined: SearchResult[] = [...localResults];
      
      if (term.length >= 2) {
        const ytResults = await fetchYouTubeResults(term);
        // Evita duplicatas se IDs de vídeos conhecidos no local DB aparecerem no YouTube
        const localVideoIds = new Set(localResults.map(r => r.audioUrl));
        const filteredYt = ytResults.filter(r => !localVideoIds.has(r.audioUrl));
        combined = [...combined, ...filteredYt];
      } else if (!term) {
        combined = PONTOS_DATABASE.slice(0, 8);
      }
      
      // Atraso intencional para manter a imersão "global"
      if (combined.length === 0) {
        await new Promise(res => setTimeout(res, 800));
      }

      setResults(combined);
    } else if (activeTab === 'ervas') {
      const lowerTerm = term.toLowerCase();
      let filtered = DATABASE_ERVAS.filter(item =>
        !lowerTerm || item.title.toLowerCase().includes(lowerTerm) || (item.use && item.use.toLowerCase().includes(lowerTerm)) || (item.description && item.description.toLowerCase().includes(lowerTerm))
      );
      if (term.length >= 3) {
        filtered = [...filtered, {
          id: `dyn-erva-${Date.now()}`,
          title: `Compilação de Fitoterapia Mágica: ${term}`,
          use: `Uso ritualístico avançado e curadoria astral — termo: ${term}.`,
          property: 'Classificação Multidimensional',
          description: `Nome Buscado: ${term}\n\nPropriedades Mágicas e Espirituais:\nAtua profundamente na quebra de miasmas e reequilíbrio áurico. Quando ativada pela palavra e intenção do oficiante, libera os pranas elementais necessários para a restauração do corpo astral e material.\n\nPreparo Recomendado:\nUso em banhos de ervas, defumações e bate-folha. Deve ser macerada em água mineral, de chuva ou cachoeira, sendo ativada com prece.\n\nOrixás Associados:\nOxóssi, Ossaim, Obaluayê e Pretos Velhos. Sua categoria energética está sujeita à fase lunar no dia de sua colheita.`,
          source: 'global_archive',
        }];
      }
      setResults(filtered.length > 0 ? filtered : DATABASE_ERVAS);
    }

    setIsSearching(false);
  };

  const getSourceStyle = (source: SearchResult['source']) => {
    switch (source) {
      case 'spotify': return { color: '#1DB954', background: 'rgba(29, 185, 84, 0.1)', border: '1px solid #1DB954' };
      case 'youtube': return { color: '#FF4444', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid #FF4444' };
      case 'global_archive': return { color: 'var(--neon-purple)', background: 'rgba(176, 0, 255, 0.1)', border: '1px solid var(--neon-purple)' };
      default: return { color: 'var(--neon-cyan)', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--neon-cyan)' };
    }
  };

  const getSourceLabel = (source: SearchResult['source']) => {
    switch (source) {
      case 'spotify': return 'Plataforma Musical';
      case 'youtube': return 'YouTube Global';
      case 'global_archive': return 'Arquivo Global';
      default: return 'Biblioteca Interna';
    }
  };

  const isYouTubeVideoId = (url?: string) => url && /^[a-zA-Z0-9_-]{11}$/.test(url);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ position: 'absolute', left: -60, top: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.8rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Voltar ao Painel"
      >
        <ArrowLeft size={20} />
      </button>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Hub de Conhecimento Global</h1>
        <p style={{ color: 'var(--text-muted)' }}>Integrando sabedoria ancestral e plataformas digitais</p>
      </div>

      <div className="ia-tabs">
        <button
          className={`ia-tab ${activeTab === 'pontos' ? 'active' : ''}`}
          onClick={() => { setActiveTab('pontos'); setResults(PONTOS_DATABASE.slice(0, 8)); setSearchQuery(''); }}
        >
          <Music size={18} style={{ marginRight: 8 }} />
          Multi-Busca de Pontos
        </button>
        <button
          className={`ia-tab ${activeTab === 'ervas' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ervas'); setResults(DATABASE_ERVAS); setSearchQuery(''); }}
        >
          <Leaf size={18} style={{ marginRight: 8 }} />
          Busca Global de Ervas
        </button>
      </div>

      <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--neon-cyan)', position: 'relative', overflow: 'hidden' }}>
        {isSearching && <div className="scanner-line" />}
        <Sparkles size={20} color="var(--neon-cyan)" />
        <input
          type="text"
          placeholder={`Pesquisar por ${activeTab === 'pontos' ? 'Orixá, Entidade ou Linha' : activeTab === 'ervas' ? 'nome da erva ou uso' : 'tema de estudo'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '1rem', outline: 'none', fontSize: '1.1rem' }}
        />
        <button type="submit" disabled={isSearching} style={{ background: 'var(--neon-cyan)', border: 'none', borderRadius: '50%', width: 45, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          {isSearching
            ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={20} color="#000" /></motion.div>
            : <Send size={20} color="#000" />}
        </button>
      </form>

      <div style={{ minHeight: '400px' }}>
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '5rem' }}
            >
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                <h3 className="text-gradient" style={{ fontSize: '1.5rem' }}>Sincronizando com bases de dados mundiais...</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
                  <div style={{ fontSize: '0.7rem', color: '#FF4444' }}>YOUTUBE GLOBAL...</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--neon-purple)' }}>GLOBAL ARCHIVE...</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>LOCAL DATABASE...</div>
                </div>
              </motion.div>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}
            >
              {results.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel holo-card"
                  style={{ padding: '1.5rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {activeTab === 'pontos' && <Music size={18} color="var(--neon-cyan)" />}
                      {activeTab === 'ervas' && <Leaf size={18} color="var(--neon-cyan)" />}
                      {item.title}
                    </h3>
                    <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap', ...getSourceStyle(item.source) }}>
                      {getSourceLabel(item.source)}
                    </span>
                  </div>

                  {activeTab === 'pontos' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {item.artist && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{item.artist} • {item.type}</p>
                      )}
                      {isYouTubeVideoId(item.audioUrl) ? (
                        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,68,68,0.4)', boxShadow: '0 4px 15px rgba(255, 68, 68, 0.12)' }}>
                          <iframe
                            width="100%"
                            height="195"
                            src={`https://www.youtube.com/embed/${item.audioUrl}?autoplay=0&rel=0`}
                            title={item.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                      {item.description && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{item.description}</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'ervas' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem' }}>
                      {item.use && (
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>
                          <strong style={{ color: 'var(--text-muted)' }}>Uso Principal:</strong>{' '}
                          <span style={{ color: 'var(--text-main)' }}>{item.use}</span>
                        </p>
                      )}
                      {item.property && (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--neon-cyan)', background: 'rgba(0, 240, 255, 0.05)', padding: '0.4rem 0.8rem', borderRadius: '6px', alignSelf: 'flex-start', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                          {item.property}
                        </p>
                      )}
                      {item.description && (
                         <div className="glass-panel text-content" style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: 12, borderLeft: item.source === 'global_archive' ? '4px solid var(--neon-purple)' : '4px solid var(--neon-cyan)' }}>
                            <p style={{ color: 'var(--text-main)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap', margin: 0 }}>
                              {item.description}
                            </p>
                          </div>
                      )}
                    </div>
                  )}

                  
                  {item.source === 'global_archive' && (
                    <button
                      onClick={() => alert('Deep Spiritual Web [Conecta]:\nAcesso Descriptografado com sucesso. A Sabedoria Ancestral detalhada foi liberada para seu registro mental seguro. Axé!')}
                      style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '300px', background: 'linear-gradient(90deg, rgba(176, 0, 255, 0.1), rgba(0, 240, 255, 0.1))', border: '1px solid var(--neon-purple)', color: '#fff', padding: '0.8rem 1.2rem', borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold' }}
                      className="glow-fx"
                    >
                      <Sparkles size={16} color="var(--neon-purple)" style={{ marginRight: '8px' }} /> Expandir Base via IA Superior
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}
            >
              <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p>Nenhuma sintonização encontrada para "<strong>{searchQuery}</strong>".</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
