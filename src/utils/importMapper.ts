// ─── Normalização de texto ───────────────────────────────────────────────────
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')   // remove pontuação
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Similaridade simples (Bigram Dice Coefficient) ──────────────────────────
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const bigrams = (s: string) => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s[i] + s[i + 1]);
    return set;
  };
  const aSet = bigrams(a);
  const bSet = bigrams(b);
  let intersection = 0;
  aSet.forEach(bg => { if (bSet.has(bg)) intersection++; });
  return (2 * intersection) / (aSet.size + bSet.size);
}

// ─── Normalização de valores da planilha ────────────────────────────────────
export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '').padStart(11, '0');
}

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeDate(value: string): string {
  if (!value) return '';
  const str = value.toString().trim();

  // Excel serial date number
  if (/^\d{4,5}$/.test(str)) {
    const serial = parseInt(str, 10);
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? '19' + y : y;
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // YYYY/MM/DD ou YYYY-MM-DD
  const ymd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return str;
}

// ─── Definição de campos ─────────────────────────────────────────────────────
export interface FieldDef {
  key: string;
  label: string;
  section: 'personal' | 'contact' | 'spiritual';
  synonyms: string[];
  normalize?: (v: string) => string;
}

export const APP_USER_FIELDS: FieldDef[] = [
  // ── Dados Pessoais ──────────────────────────────────────────────────────────
  {
    key: 'nomeCompleto', label: 'Nome Completo', section: 'personal',
    synonyms: [
      'nome', 'nome completo', 'name', 'full name', 'member name', 'member',
      'membro', 'participante', 'filiado', 'associado', 'nome do membro',
      'nome participante', 'usuario', 'pessoa', 'nome usuario', 'aluno',
      'nome aluno', 'trabalhador', 'nome trabalhador', 'filho de santo',
      'filho', 'nomefilho', 'nome filho', 'nome_completo',
    ],
  },
  {
    key: 'nomeDeSanto', label: 'Nome de Santo', section: 'personal',
    synonyms: [
      'santo', 'nome de santo', 'nome santo', 'dijina', 'nome dijina',
      'vulgo', 'vulgo espiritual', 'apelido espiritual', 'nome espiritual',
      'nome_de_santo', 'apelido', 'nome culto', 'dijina de santo',
      'nome religioso', 'spiritual name',
    ],
  },
  {
    key: 'dataNascimento', label: 'Data de Nascimento', section: 'personal',
    normalize: normalizeDate,
    synonyms: [
      'nascimento', 'data nascimento', 'data de nascimento', 'nasc',
      'dt nasc', 'dt nascimento', 'birth', 'birthday', 'birth date',
      'data nasc', 'data_nascimento', 'born', 'dt_nasc',
      'aniversario', 'aniversário', 'data aniversario',
    ],
  },
  {
    key: 'rg', label: 'RG', section: 'personal',
    synonyms: [
      'rg', 'identidade', 'documento rg', 'carteira identidade',
      'rg identidade', 'nr rg', 'num rg', 'numero rg', 'rg_numero',
      'registro geral', 'ci', 'carteira de identidade',
    ],
  },
  {
    key: 'cpf', label: 'CPF', section: 'personal',
    normalize: normalizeCpf,
    synonyms: [
      'cpf', 'documento', 'document', 'cpf documento', 'num cpf',
      'numero cpf', 'nr cpf', 'tax id', 'tax', 'registro cpf',
      'cpf_numero', 'cadastro pessoa fisica', 'id fiscal',
    ],
  },
  {
    key: 'profissao', label: 'Profissão', section: 'personal',
    synonyms: [
      'profissao', 'profissão', 'job', 'occupation', 'trabalho', 'cargo',
      'funcao', 'função', 'trabalhador', 'atividade', 'emprego',
      'area profissional', 'area de atuacao', 'oficio', 'ofício',
    ],
  },
  {
    key: 'nomePais', label: 'Nome dos Pais', section: 'personal',
    synonyms: [
      'pais', 'parents', 'mae', 'pai', 'filiacao', 'filiação', 'familia',
      'nome mae', 'nome pai', 'nome dos pais', 'nome pais',
      'parentesco', 'responsavel', 'responsável',
    ],
  },

  // ── Contato & Endereço ──────────────────────────────────────────────────────
  {
    key: 'telefone', label: 'Telefone/Celular', section: 'contact',
    normalize: normalizePhone,
    synonyms: [
      'telefone', 'celular', 'phone', 'mobile', 'tel', 'contato',
      'numero celular', 'fone', 'telefone celular', 'telefone fixo',
      'numero telefone', 'nr telefone', 'tel celular',
      'mobile phone', 'cell phone', 'numero fone',
    ],
  },
  {
    key: 'whatsapp', label: 'WhatsApp', section: 'contact',
    normalize: normalizePhone,
    synonyms: [
      'whatsapp', 'wpp', 'zap', 'zapzap', 'whats', 'nr whatsapp',
      'numero whatsapp', 'contato whatsapp', 'cell wpp',
    ],
  },
  {
    key: 'email', label: 'E-mail', section: 'contact',
    synonyms: [
      'email', 'e-mail', 'mail', 'correio', 'e mail', 'eletronico',
      'email address', 'endereco email', 'contato email',
    ],
  },
  {
    key: 'endereco', label: 'Endereço', section: 'contact',
    synonyms: [
      'endereco', 'endereço', 'address', 'logradouro', 'rua', 'moradia',
      'residencia', 'residência', 'domicilio', 'domicílio', 'local',
      'endereco completo', 'rua numero', 'rua e numero',
      'localidade', 'location', 'street', 'complemento',
    ],
  },
  {
    key: 'cep', label: 'CEP', section: 'contact',
    synonyms: [
      'cep', 'zip', 'postal', 'codigo postal', 'código postal',
      'zip code', 'codigo postagem', 'cep numero',
    ],
  },
  {
    key: 'cidade', label: 'Cidade', section: 'contact',
    synonyms: [
      'cidade', 'city', 'municipio', 'município', 'localidade',
      'cidade estado', 'city state',
    ],
  },
  {
    key: 'estado', label: 'Estado / UF', section: 'contact',
    synonyms: [
      'estado', 'state', 'uf', 'provincia', 'região', 'regiao', 'sigla estado',
    ],
  },

  // ── Espiritual ──────────────────────────────────────────────────────────────
  {
    key: 'spiritual.orixaFrente', label: 'Orixá de Frente', section: 'spiritual',
    synonyms: [
      'orixa', 'orixá', 'orixa frente', 'orixá de frente', 'frente',
      'santo de cabeca', 'santo de cabeça', 'cabeca', 'cabeça',
      'vodun', 'nkisi', 'inkice', 'entidade frente', 'orixa principal',
      'pai de cabeca', 'mae de cabeca', 'guia principal',
    ],
  },
  {
    key: 'spiritual.tempoUmbanda', label: 'Tempo na Umbanda', section: 'spiritual',
    synonyms: [
      'tempo umbanda', 'tempo na umbanda', 'anos terreiro', 'anos na casa',
      'tempo casa', 'tempo de mesa', 'tempo espiritualidade', 'desenvolvido',
      'anos pratica', 'tempo religiao', 'tempo de santo', 'anos de santo',
      'tempo de umbanda', 'idade de santo',
    ],
  },
  {
    key: 'spiritual.tipoMedium', label: 'Tipo de Médium', section: 'spiritual',
    synonyms: [
      'medium', 'médium', 'tipo medium', 'tipo médium', 'funcao espiritual',
      'função espiritual', 'mediunidade', 'tipo mediunidade', 'cargo espiritual',
      'grau mediumnico', 'funcao', 'função', 'categoria',
    ],
  },
  {
    key: 'spiritual.umbandaOrigem', label: 'Umbanda - Casa de Origem', section: 'spiritual',
    synonyms: [
      'casa origem', 'terreiro origem', 'casa anterior', 'umbanda origem',
      'origem umbanda', 'terreiro anterior', 'casa de origem',
    ],
  },
  {
    key: 'spiritual.umbandaObrigaCabeca', label: 'Umbanda - Obrigação Cabeça', section: 'spiritual',
    synonyms: [
      'obriga cabeca', 'obrigação cabeça', 'obrigacao cabeca',
      'obrig cabeca', 'umbanda cabeca', 'obrigacao de cabeca',
      'feitura', 'batismo', 'coroacao', 'coroação',
    ],
  },
  {
    key: 'spiritual.nacaoOrigem', label: 'Nação - Casa de Origem', section: 'spiritual',
    synonyms: [
      'nacao origem', 'nação origem', 'candomble origem', 'candomblé origem',
      'origem nacao', 'terreiro nacao',
    ],
  },
  {
    key: 'spiritual.cidadeEstadoOrigem', label: 'Cidade/Estado de Origem', section: 'spiritual',
    synonyms: [
      'cidade origem', 'estado origem', 'naturalidade', 'local origem',
      'cidade estado origem', 'procedencia', 'procedência',
    ],
  },
  {
    key: 'spiritual.situacaoCadastro', label: 'Situação Cadastral', section: 'spiritual',
    synonyms: [
      'situacao', 'situação', 'status', 'ativo', 'inativo', 'situacao cadastro',
      'situação cadastro', 'status membro', 'condicao', 'condição',
    ],
  },
];

// ─── Auto-mapeamento inteligente ─────────────────────────────────────────────
export function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  APP_USER_FIELDS.forEach(field => {
    let bestHeader = '';
    let highestScore = 0;

    headers.forEach(header => {
      if (usedHeaders.has(header)) return;
      const normalizedHeader = normalize(header);

      // 1. Exact match with field key
      if (normalizedHeader === normalize(field.key.replace('spiritual.', ''))) {
        if (100 > highestScore) { highestScore = 100; bestHeader = header; }
      }

      // 2. Exact synonym match
      for (const synonym of field.synonyms) {
        const normSyn = normalize(synonym);

        if (normalizedHeader === normSyn) {
          if (95 > highestScore) { highestScore = 95; bestHeader = header; }
          break;
        }
        if (normalizedHeader.includes(normSyn) || normSyn.includes(normalizedHeader)) {
          if (80 > highestScore) { highestScore = 80; bestHeader = header; }
        }
        // 3. Fuzzy similarity for typos
        const sim = similarity(normalizedHeader, normSyn);
        const score = sim * 75;
        if (score > highestScore) { highestScore = score; bestHeader = header; }
      }
    });

    if (bestHeader && highestScore >= 70) {
      mapping[field.key] = bestHeader;
      usedHeaders.add(bestHeader);
    }
  });

  return mapping;
}

export interface TerreiroSeguimento {
  segmentoUmbanda: boolean;
  segmentoKimbanda: boolean;
  segmentoNacao: boolean;
}

// ─── Converte uma linha da planilha para o objeto de usuário ─────────────────
export function rowToUserData(
  row: Record<string, any>,
  mapping: Record<string, string>,
  terreiroSeguimento?: TerreiroSeguimento
): Record<string, any> {
  const userData: Record<string, any> = {
    role: 'USER',
    spiritual: {
      situacaoCadastro: 'ativo',
      // Aplica o seguimento da casa automaticamente
      ...(terreiroSeguimento && {
        segmentoUmbanda: terreiroSeguimento.segmentoUmbanda,
        segmentoKimbanda: terreiroSeguimento.segmentoKimbanda,
        segmentoNacao: terreiroSeguimento.segmentoNacao,
      }),
    },
  };

  APP_USER_FIELDS.forEach(field => {
    const column = mapping[field.key];
    if (!column || row[column] === undefined || row[column] === null) return;

    let value = row[column]?.toString().trim() || '';
    if (field.normalize) value = field.normalize(value);

    // Handle nested spiritual fields
    if (field.key.startsWith('spiritual.')) {
      const subKey = field.key.replace('spiritual.', '');
      userData.spiritual = { ...userData.spiritual, [subKey]: value };
    } else {
      userData[field.key] = value;
    }
  });

  // Coerce situacaoCadastro
  const sit = userData.spiritual?.situacaoCadastro?.toLowerCase();
  if (sit && (sit === 'ativo' || sit === '1' || sit === 'yes' || sit === 'sim' || sit === 'true' || sit === 'active')) {
    userData.spiritual.situacaoCadastro = 'ativo';
  } else if (sit) {
    userData.spiritual.situacaoCadastro = 'inativo';
  }

  return userData;
}
