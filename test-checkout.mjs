// Script de teste da API create-checkout
// Rode com: node test-checkout.mjs

import http from 'http';

const payload = JSON.stringify({
  plan: 'ile',
  billing: 'month',
  terreiroId: 'teste123',
  email: 'teste@email.com',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/create-checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Resposta:', JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (err) => {
  console.error('Erro na requisição:', err.message);
});

req.write(payload);
req.end();
