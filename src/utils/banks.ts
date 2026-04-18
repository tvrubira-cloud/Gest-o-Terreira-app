export interface Bank {
  code: string;
  name: string;
  color: string;
  url: string;
}

export const BANKS: Bank[] = [
  { code: '001', name: 'Banco do Brasil',            color: '#FFCC00', url: 'https://bb.com.br' },
  { code: '003', name: 'Banco da Amazônia',           color: '#008B5C', url: 'https://bancoamazonia.com.br' },
  { code: '004', name: 'Banco do Nordeste',           color: '#1E5FAD', url: 'https://bnb.gov.br' },
  { code: '033', name: 'Santander',                   color: '#EC0000', url: 'https://santander.com.br' },
  { code: '041', name: 'Banrisul',                    color: '#003F87', url: 'https://banrisul.com.br' },
  { code: '047', name: 'Banese',                      color: '#0060A9', url: 'https://banese.com.br' },
  { code: '070', name: 'BRB',                         color: '#00843D', url: 'https://brb.com.br' },
  { code: '077', name: 'Banco Inter',                 color: '#FF7A00', url: 'https://bancointer.com.br' },
  { code: '084', name: 'Uniprime',                    color: '#006633', url: 'https://uniprime.com.br' },
  { code: '097', name: 'Credisis',                    color: '#007A3D', url: 'https://credisis.com.br' },
  { code: '099', name: 'Uniprime Norte',              color: '#006633', url: 'https://uniprimenoroeste.com.br' },
  { code: '104', name: 'Caixa Econômica Federal',     color: '#006BB4', url: 'https://caixa.gov.br' },
  { code: '136', name: 'Unicred',                     color: '#007A3D', url: 'https://unicred.com.br' },
  { code: '197', name: 'Stone',                       color: '#00A868', url: 'https://stone.com.br' },
  { code: '208', name: 'BTG Pactual',                 color: '#071D49', url: 'https://btgpactual.com' },
  { code: '212', name: 'Banco Original',              color: '#003300', url: 'https://original.com.br' },
  { code: '218', name: 'BS2',                         color: '#FF6200', url: 'https://bs2.com' },
  { code: '237', name: 'Bradesco',                    color: '#CC092F', url: 'https://bradesco.com.br' },
  { code: '260', name: 'Nubank',                      color: '#8A05BE', url: 'https://nubank.com.br' },
  { code: '290', name: 'PagBank',                     color: '#00CF8B', url: 'https://pagbank.com.br' },
  { code: '318', name: 'Banco BMG',                   color: '#F5A200', url: 'https://bmg.com.br' },
  { code: '336', name: 'C6 Bank',                     color: '#242424', url: 'https://c6bank.com.br' },
  { code: '341', name: 'Itaú',                        color: '#003399', url: 'https://itau.com.br' },
  { code: '348', name: 'Banco XP',                    color: '#1A1A2E', url: 'https://xpi.com.br' },
  { code: '364', name: 'Gerencianet / EFÍ',           color: '#00B14F', url: 'https://efipay.com.br' },
  { code: '380', name: 'PicPay',                      color: '#21C25E', url: 'https://picpay.com' },
  { code: '389', name: 'Banco Mercantil Brasil',      color: '#0047AB', url: 'https://mercantildobrasil.com.br' },
  { code: '403', name: 'Cora',                        color: '#FF6B35', url: 'https://cora.com.br' },
  { code: '422', name: 'Banco Safra',                 color: '#C8102E', url: 'https://safra.com.br' },
  { code: '461', name: 'Asaas',                       color: '#008B5C', url: 'https://asaas.com' },
  { code: '505', name: 'Credit Suisse',               color: '#1A1A2E', url: 'https://credit-suisse.com/br' },
  { code: '600', name: 'Banco Luso Brasileiro',       color: '#003F87', url: 'https://lusobrasileiro.com.br' },
  { code: '611', name: 'Banco Paulista',              color: '#0047AB', url: 'https://bancopaulista.com.br' },
  { code: '623', name: 'Banco PAN',                   color: '#F5A200', url: 'https://bancopan.com.br' },
  { code: '633', name: 'Banco Rendimento',            color: '#003F87', url: 'https://rendimento.com.br' },
  { code: '637', name: 'Sofisa Direto',               color: '#0047AB', url: 'https://sofisadireto.com.br' },
  { code: '655', name: 'Neon / Votorantim',           color: '#8C52FF', url: 'https://neon.com.br' },
  { code: '707', name: 'Banco Daycoval',              color: '#F5A200', url: 'https://daycoval.com.br' },
  { code: '735', name: 'Banco Neon',                  color: '#8C52FF', url: 'https://neon.com.br' },
  { code: '739', name: 'Banco Cetelem',               color: '#0047AB', url: 'https://cetelem.com.br' },
  { code: '745', name: 'Citibank',                    color: '#003F87', url: 'https://citibank.com.br' },
  { code: '746', name: 'Banco Modal',                 color: '#0047AB', url: 'https://modal.com.br' },
  { code: '747', name: 'Banco Rabobank',              color: '#FF6200', url: 'https://rabobank.com.br' },
  { code: '748', name: 'Sicredi',                     color: '#007A3D', url: 'https://sicredi.com.br' },
  { code: '752', name: 'BNP Paribas',                 color: '#00915A', url: 'https://bnpparibas.com.br' },
  { code: '755', name: 'Bank of America',             color: '#012169', url: 'https://bankofamerica.com.br' },
  { code: '756', name: 'Sicoob',                      color: '#006633', url: 'https://sicoob.com.br' },
  { code: '077', name: 'Agibank',                     color: '#FF4F00', url: 'https://agibank.com.br' },
  { code: '323', name: 'Mercado Pago',                color: '#009EE3', url: 'https://mercadopago.com.br' },
  { code: '301', name: 'Dock / BPP',                  color: '#5C2D91', url: 'https://dock.tech' },
  { code: '274', name: 'Money Plus',                  color: '#00B14F', url: 'https://moneyplusbank.com.br' },
  { code: '383', name: 'Ebanx',                       color: '#4B0082', url: 'https://ebanx.com.br' },
  { code: '121', name: 'Banco Agiplan',               color: '#FF4F00', url: 'https://agiplan.com.br' },
  { code: '654', name: 'Banco A.J. Renner',           color: '#CC0000', url: 'https://ajrenner.com.br' },
  { code: '243', name: 'Banco Máxima',                color: '#003F87', url: 'https://bancomaxima.com.br' },
  { code: '613', name: 'Omni Banco',                  color: '#E63027', url: 'https://omni.com.br' },
  { code: '630', name: 'Smartbank',                   color: '#0047AB', url: 'https://bcosmart.com.br' },
  { code: '751', name: 'Scotiabank',                  color: '#EC1C24', url: 'https://scotiabank.com.br' },
];

export function findBankByCode(code: string): Bank | undefined {
  return BANKS.find(b => b.code === code);
}

export function findBankByName(name: string): Bank | undefined {
  const lower = name.toLowerCase();
  return BANKS.find(b => b.name.toLowerCase().includes(lower) || lower.includes(b.name.toLowerCase().split(' ')[0].toLowerCase()));
}

export function getBankInitials(name: string): string {
  return name
    .split(' ')
    .filter(w => !['banco', 'do', 'da', 'de', 'dos', 'das'].includes(w.toLowerCase()))
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
