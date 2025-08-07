const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = 3001;

// Middleware básico
app.use(express.json());
app.use(cors());

// Rota de teste simples
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor OK',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log(`📱 Teste: http://localhost:${PORT}/test`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não tratado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada:', reason);
}); 