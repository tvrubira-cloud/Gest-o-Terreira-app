export const APP_USER_FIELDS = [
  { key: 'nomeCompleto', label: 'Nome Completo', synonyms: ['nome', 'name', 'completo', 'full name', 'member', 'membro', 'usuario'] },
  { key: 'nomeDeSanto', label: 'Nome de Santo', synonyms: ['santo', 'dijina', 'nome de santo', 'vulgo', 'apelido espiritual'] },
  { key: 'dataNascimento', label: 'Data de Nascimento', synonyms: ['nascimento', 'data', 'birth', 'birthday', 'nasc', 'dt nasc'] },
  { key: 'rg', label: 'RG', synonyms: ['rg', 'identidade', 'documento rg'] },
  { key: 'cpf', label: 'CPF', synonyms: ['cpf', 'documento', 'id', 'tax id'] },
  { key: 'telefone', label: 'Telefone/Celular', synonyms: ['telefone', 'celular', 'phone', 'mobile', 'whatsapp', 'contato', 'tel'] },
  { key: 'email', label: 'E-mail', synonyms: ['email', 'e-mail', 'mail', 'correio'] },
  { key: 'profissao', label: 'Profissão', synonyms: ['profissao', 'job', 'occupation', 'trabalho', 'cargo'] },
  { key: 'nomePais', label: 'Nome dos Pais', synonyms: ['pais', 'parents', 'mae', 'pai', 'filiacao', 'familia'] },
  { key: 'endereco', label: 'Endereço', synonyms: ['endereco', 'address', 'logradouro', 'rua', 'moradia'] },
  { key: 'cep', label: 'CEP', synonyms: ['cep', 'zip', 'postal', 'codigo postal'] },
  { key: 'cidade', label: 'Cidade', synonyms: ['cidade', 'city', 'municipio'] },
  { key: 'estado', label: 'Estado', synonyms: ['estado', 'state', 'uf', 'provincia'] },
];

export function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  APP_USER_FIELDS.forEach(field => {
    let bestHeader = '';
    let highestScore = 0;

    headers.forEach(header => {
      if (usedHeaders.has(header)) return;

      const normalizedHeader = header.toLowerCase().trim();
      
      // Exact match
      if (normalizedHeader === field.key.toLowerCase()) {
        bestHeader = header;
        highestScore = 100;
      }
      
      // Synonym match
      field.synonyms.forEach(synonym => {
        if (normalizedHeader === synonym || normalizedHeader.includes(synonym)) {
          const score = normalizedHeader === synonym ? 90 : 70;
          if (score > highestScore) {
            highestScore = score;
            bestHeader = header;
          }
        }
      });
    });

    if (bestHeader && highestScore >= 70) {
      mapping[field.key] = bestHeader;
      usedHeaders.add(bestHeader);
    }
  });

  return mapping;
}
