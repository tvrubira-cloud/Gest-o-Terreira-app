/**
 * PIX EMV BR Code Payload Generator
 * Gera o código 'Copia e Cola' e os dados para o QR Code.
 */

function formatAmount(amount?: number): string {
  if (!amount) return '';
  return amount.toFixed(2);
}

function crc16(payload: string): string {
  let polinomio = 0x1021;
  let resultado = 0xFFFF;
  
  for (let i = 0; i < payload.length; i++) {
    resultado ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((resultado & 0x8000) > 0) {
        resultado = (resultado << 1) ^ polinomio;
      } else {
        resultado = resultado << 1;
      }
    }
  }
  return (resultado & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixPayload(
  pixKey: string,
  merchantName: string = 'Recebedor',
  merchantCity: string = 'BRASIL',
  txId: string = '***',
  amount?: number
): string {
  if (!pixKey) return '';
  
  const payloadFormatIndicator = '000201';
  const pointMethod = '010211'; // Estático ou dinâmico
  
  // Merchant Account Information
  const gui = '0014br.gov.bcb.pix';
  const cleanKey = pixKey.trim();
  const keyLength = cleanKey.length.toString().padStart(2, '0');
  const keyString = `01${keyLength}${cleanKey}`;
  
  const merchantAccountLength = (gui.length + keyString.length).toString().padStart(2, '0');
  const merchantAccountInfo = `26${merchantAccountLength}${gui}${keyString}`;
  
  const merchantCategoryCode = '52040000';
  const transactionCurrency = '5303986'; // BRL
  
  let transactionAmount = '';
  if (amount && amount > 0) {
    const amtStr = formatAmount(amount);
    transactionAmount = `54${amtStr.length.toString().padStart(2, '0')}${amtStr}`;
  }
  
  const countryCode = '5802BR';
  
  // Limpa caracteres especiais e limita tamanho
  const mName = merchantName.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const mNameContent = `59${mName.length.toString().padStart(2, '0')}${mName}`;
  
  const mCity = merchantCity.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const mCityContent = `60${mCity.length.toString().padStart(2, '0')}${mCity}`;
  
  const txIdString = txId.substring(0, 25).replace(/[^a-zA-Z0-9]/g, '') || '***';
  const txIdContent = `05${txIdString.length.toString().padStart(2, '0')}${txIdString}`;
  const additionalDataField = `62${txIdContent.length.toString().padStart(2, '0')}${txIdContent}`;
  
  const payload = `${payloadFormatIndicator}${pointMethod}${merchantAccountInfo}${merchantCategoryCode}${transactionCurrency}${transactionAmount}${countryCode}${mNameContent}${mCityContent}${additionalDataField}6304`;
  
  return `${payload}${crc16(payload)}`;
}
