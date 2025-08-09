const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Configuração CORS dinâmica
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['https://leadflow-indol.vercel.app', 'http://localhost:5173'];

console.log('🔧 CORS Origins configuradas:', corsOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 Origin da requisição:', origin);
    
    // Permitir requisições sem origin (como mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (corsOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origin permitida:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin bloqueada:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Evolution API Configuration
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
function sanitizeWebhookUrl(raw) {
  if (!raw) return '';
  // remove aspas iniciais/finais e espaços
  const cleaned = String(raw).trim().replace(/^['"]+|['"]+$/g, '');
  return cleaned;
}

const N8N_WEBHOOK_URL = sanitizeWebhookUrl(process.env.N8N_WEBHOOK_URL); // opcional: webhook do fluxo N8N

// Headers padrão para todas as requisições à Evolution API
const evolutionHeaders = {
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_API_KEY
};

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/dispatch-campaign
 * Recebe a campanha do frontend e repassa para o webhook do N8N
 * Body esperado: Array de objetos no formato solicitado
 */
app.post('/api/dispatch-campaign', async (req, res) => {
  try {
    console.log('🔄 Recebendo requisição dispatch-campaign...');
    console.log('📍 N8N_WEBHOOK_URL configurada:', N8N_WEBHOOK_URL);
    
    if (!N8N_WEBHOOK_URL) {
      console.log('❌ N8N_WEBHOOK_URL não configurada');
      return res.status(400).json({ success: false, error: 'N8N_WEBHOOK_URL não configurada no servidor' });
    }

    const payload = req.body;
    console.log('📦 Payload recebido:', JSON.stringify(payload, null, 2));

    if (!Array.isArray(payload) || payload.length === 0) {
      console.log('❌ Payload inválido:', payload);
      return res.status(400).json({ success: false, error: 'Payload inválido. Deve ser um array não-vazio.' });
    }

    // Valida URL
    try { 
      new URL(N8N_WEBHOOK_URL);
      console.log('✅ URL válida:', N8N_WEBHOOK_URL);
    } catch (urlError) {
      console.log('❌ URL inválida:', N8N_WEBHOOK_URL, urlError.message);
      return res.status(400).json({ success: false, error: 'N8N_WEBHOOK_URL inválida', details: N8N_WEBHOOK_URL });
    }

    console.log('📤 Enviando para N8N...', JSON.stringify(payload).slice(0, 500));

    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 120000
    });

    console.log('✅ N8N respondeu com sucesso:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('❌ Erro completo:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    return res.status(500).json({ 
      success: false, 
      error: 'Falha ao enviar campanha para N8N', 
      details: error.response?.data || error.message,
      status: error.response?.status 
    });
  }
});

/**
 * POST /api/create-instance-and-qrcode
 * Cria uma nova instância e retorna o QR Code
 */
app.post('/api/create-instance-and-qrcode', async (req, res) => {
  try {
    const { instanceName, userName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório'
      });
    }

    console.log(`Criando instância: ${instanceName}${userName ? ` para usuário: ${userName}` : ''}`);

    // 1. Criar a instância na Evolution API
    const createInstanceResponse = await axios.post(
      `${EVOLUTION_API_URL}/instance/create`,
      {
        instanceName: instanceName,
        token: uuidv4(), // Token único para a instância
        qrcode: true,
        number: "000000", // Placeholder válido para regex
        webhookByEvents: false,
        events: [],
        waitQrCode: true,
        integration: "WHATSAPP-BAILEYS"
      },
      { headers: evolutionHeaders }
    );

    console.log('Instância criada:', createInstanceResponse.data);

    // 2. INICIAR a instância (ESTE É O PROBLEMA!)
    console.log('🚀 Iniciando instância...');
    
    try {
      const startResponse = await axios.get(
        `${EVOLUTION_API_URL}/instance/start/${instanceName}`,
        { headers: evolutionHeaders }
      );
      console.log('✅ Instância iniciada:', startResponse.data);
    } catch (error) {
      console.log('⚠️ Erro ao iniciar instância (pode ser normal):', error.message);
    }

    // 3. Retornar imediatamente após criar a instância
    // O frontend fará polling para buscar o QR Code
    console.log('✅ Instância criada com sucesso. Frontend deve fazer polling para QR Code.');

    // 3. Retornar dados para o frontend
    res.json({
      success: true,
      instanceName: instanceName,
      qrCodeBase64: null, // QR Code será buscado pelo frontend
      pairingCode: null,
      message: 'Instância criada com sucesso. Aguardando QR Code...'
    });

  } catch (error) {
    console.error('❌ Erro detalhado ao criar instância:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao criar instância',
      details: error.response?.data || error.message
    });
  }
});

/**
 * GET /api/qrcode/:instanceName
 * Busca o QR Code de uma instância específica
 */
app.get('/api/qrcode/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório'
      });
    }

    console.log(`🔍 Buscando QR Code para instância: ${instanceName}`);

    // Tentar diferentes endpoints para obter o QR Code
    let qrCodeBase64 = null;
    let pairingCode = null;
    
    try {
      // Estratégia 1: Endpoint padrão
      const qrCodeResponse = await axios.get(
        `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        { headers: evolutionHeaders }
      );

      console.log('📱 Resposta do QR Code:', JSON.stringify(qrCodeResponse.data, null, 2));
      
      // Verificar diferentes formatos de resposta
      const qrData = qrCodeResponse.data;
      

      
      // Priorizar o campo base64 que já vem formatado para imagem
      if (qrData.base64 && qrData.base64.startsWith('data:image/')) {
        qrCodeBase64 = qrData.base64;
        console.log('✅ QR Code encontrado no campo: base64 (formato imagem)');
      } else if (qrData.qrcode && qrData.qrcode !== '' && qrData.qrcode !== '0' && qrData.qrcode !== 0) {
        qrCodeBase64 = qrData.qrcode;
        console.log('✅ QR Code encontrado no campo: qrcode');
      } else if (qrData.qrcodeBase64 && qrData.qrcodeBase64 !== '' && qrData.qrcodeBase64 !== '0' && qrData.qrcodeBase64 !== 0) {
        qrCodeBase64 = qrData.qrcodeBase64;
        console.log('✅ QR Code encontrado no campo: qrcodeBase64');
      } else if (qrData.code && qrData.code !== '' && qrData.code !== '0' && qrData.code !== 0) {
        // O campo code não é base64, não usar para imagem
        console.log('⚠️ Campo code encontrado, mas não é formato de imagem válido');
      }
      
      // Se não encontrou QR Code válido, retornar null
      if (!qrCodeBase64) {
        console.log('❌ Nenhum QR Code válido encontrado');
      }
      
      // Verificar pairing code
      const possiblePairingFields = ['pairingCode', 'pairing', 'code'];
      for (const field of possiblePairingFields) {
        if (qrData[field] && qrData[field] !== '') {
          pairingCode = qrData[field];
          console.log(`✅ Pairing Code encontrado no campo: ${field}`);
          break;
        }
      }

    } catch (error) {
      console.log('⚠️ Erro ao buscar QR Code:', error.message);
    }

    res.json({
      success: true,
      instanceName: instanceName,
      qrCodeBase64: qrCodeBase64,
      pairingCode: pairingCode,
      hasQRCode: !!qrCodeBase64,
      message: qrCodeBase64 
        ? 'QR Code encontrado!'
        : 'QR Code ainda não disponível. Tente novamente.'
    });

  } catch (error) {
    console.error('Erro ao buscar QR Code:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar QR Code',
      details: error.response?.data || error.message
    });
  }
});

/**
 * GET /api/connection-state/:instanceName
 * Verifica o estado da conexão da instância
 */
app.get('/api/connection-state/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório'
      });
    }

    console.log(`Verificando estado da instância: ${instanceName}`);

    // Consultar estado da conexão
    const connectionStateResponse = await axios.get(
      `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
      { headers: evolutionHeaders }
    );

    console.log('Estado da conexão:', connectionStateResponse.data);

    // Extrair o estado da resposta da Evolution API
    const state = connectionStateResponse.data?.instance?.state || connectionStateResponse.data?.state || 'unknown';

    res.json({
      success: true,
      instanceName: instanceName,
      state: state,
      message: getStateMessage(state)
    });

  } catch (error) {
    console.error('Erro ao verificar estado da conexão:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar estado da conexão',
      details: error.response?.data || error.message
    });
  }
});

/**
 * DELETE /api/delete-instance/:instanceName
 * Deleta uma instância (opcional - para limpeza)
 */
app.delete('/api/delete-instance/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    if (!instanceName) {
      return res.status(400).json({
        success: false,
        error: 'instanceName é obrigatório'
      });
    }

    console.log(`Deletando instância: ${instanceName}`);

    const deleteResponse = await axios.delete(
      `${EVOLUTION_API_URL}/instance/delete/${instanceName}`,
      { headers: evolutionHeaders }
    );

    console.log('Instância deletada:', deleteResponse.data);

    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar instância:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar instância',
      details: error.response?.data || error.message
    });
  }
});

/**
 * POST /webhook/:instanceName
 * Endpoint para receber webhooks da Evolution API
 */
app.post('/webhook/:instanceName', (req, res) => {
  try {
    const { instanceName } = req.params;
    const webhookData = req.body;
    
    console.log(`📡 Webhook recebido para instância ${instanceName}:`, webhookData);
    
    // Verificar se é um evento de QR Code
    if (webhookData.event === 'qrcode' || webhookData.qrcode) {
      console.log('✅ QR Code recebido via webhook!');
      // Aqui você pode implementar lógica para notificar o frontend
    }
    
    res.json({ success: true, message: 'Webhook recebido' });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    res.status(500).json({ success: false, error: 'Erro ao processar webhook' });
  }
});

/**
 * GET /api/health
 * Endpoint de saúde do servidor
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Evolution API Backend está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

/**
 * Função auxiliar para mensagens de estado
 */
function getStateMessage(state) {
  const messages = {
    'open': 'WhatsApp conectado com sucesso!',
    'connecting': 'Conectando ao WhatsApp...',
    'close': 'WhatsApp desconectado',
    'disconnected': 'WhatsApp desconectado',
    'qrcode': 'Escaneie o QR Code para conectar',
    'qrRead': 'QR Code lido, conectando...',
    'ready': 'WhatsApp pronto para uso!',
    'loading': 'Carregando WhatsApp...',
    'start': 'Iniciando conexão...',
    'stop': 'Conexão parada',
    'destroy': 'Instância destruída'
  };
  
  return messages[state] || `Estado: ${state}`;
}

// Tratamento de erros global
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Evolution API Backend rodando na porta ${PORT}`);
  console.log(`📱 URL da Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 N8N Webhook URL configurada: ${N8N_WEBHOOK_URL ? '✅' : '❌'}`);
});

module.exports = app; 