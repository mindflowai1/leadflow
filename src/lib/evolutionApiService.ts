/**
 * Serviço para comunicação com o backend da Evolution API
 * Gerencia a criação de instâncias, QR Codes e verificação de status
 */

// Configuração do backend
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://leadflow-dtev.onrender.com' // Backend deployado no Render
  : 'http://localhost:3001';

export interface EvolutionInstance {
  instanceName: string;
  qrCodeBase64: string;
  pairingCode?: string;
  message: string;
}

export interface ConnectionState {
  instanceName: string;
  state: 'open' | 'connecting' | 'close' | 'disconnected' | 'qrcode';
  message: string;
}

export class EvolutionApiService {
  /**
   * Dispara campanha para o backend encaminhar ao N8N
   */
  static async dispatchCampaignToWebhook(payload: any[]): Promise<{ success: boolean; data?: any; error?: string }>{
    try {
      const response = await fetch(`${BACKEND_URL}/api/dispatch-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Resposta do backend:', data)
      return data
    } catch (error: any) {
      console.error('❌ Erro ao enviar campanha ao backend:', error)
      return { success: false, error: error.message || 'Erro desconhecido' }
    }
  }
  /**
   * Cria uma nova instância e retorna o QR Code
   * @param instanceName Nome único para a instância
   * @param userName Nome do usuário (opcional)
   * @returns Dados da instância criada
   */
  static async createInstanceAndQRCode(instanceName: string, userName?: string): Promise<EvolutionInstance> {
    try {
      console.log('🔄 Criando instância:', instanceName);
      
      const response = await fetch(`${BACKEND_URL}/api/create-instance-and-qrcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceName, userName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar instância');
      }

      const data = await response.json();
      console.log('✅ Instância criada com sucesso:', data);
      
      return {
        instanceName: data.instanceName,
        qrCodeBase64: data.qrCodeBase64,
        pairingCode: data.pairingCode,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Erro ao criar instância:', error);
      throw error;
    }
  }

  /**
   * Busca o QR Code de uma instância específica
   * @param instanceName Nome da instância
   * @returns Dados do QR Code
   */
  static async getQRCode(instanceName: string): Promise<{
    success: boolean;
    instanceName: string;
    qrCodeBase64: string | null;
    pairingCode: string | null;
    hasQRCode: boolean;
    message: string;
  }> {
    try {
      console.log('🔍 Buscando QR Code para instância:', instanceName);
      
      const response = await fetch(`${BACKEND_URL}/api/qrcode/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar QR Code');
      }

      const data = await response.json();
      console.log('📱 Resposta do QR Code:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar QR Code:', error);
      throw error;
    }
  }

  /**
   * Verifica o estado da conexão de uma instância
   * @param instanceName Nome da instância
   * @returns Estado atual da conexão
   */
  static async getConnectionState(instanceName: string): Promise<ConnectionState> {
    try {
      console.log('🔄 Verificando estado da instância:', instanceName);
      
      const response = await fetch(`${BACKEND_URL}/api/connection-state/${instanceName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar estado da conexão');
      }

      const data = await response.json();
      console.log('✅ Estado da conexão:', data);
      
      return {
        instanceName: data.instanceName,
        state: data.state,
        message: data.message
      };
    } catch (error) {
      console.error('❌ Erro ao verificar estado da conexão:', error);
      throw error;
    }
  }

  /**
   * Deleta uma instância (opcional - para limpeza)
   * @param instanceName Nome da instância
   */
  static async deleteInstance(instanceName: string): Promise<void> {
    try {
      console.log('🔄 Deletando instância:', instanceName);
      
      const response = await fetch(`${BACKEND_URL}/api/delete-instance/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar instância');
      }

      console.log('✅ Instância deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar instância:', error);
      throw error;
    }
  }

  /**
   * Verifica se o backend está funcionando
   * @returns Status de saúde do backend
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      console.log('✅ Backend saudável:', data);
      return data.success;
    } catch (error) {
      console.error('❌ Backend não está respondendo:', error);
      return false;
    }
  }

  /**
   * Gera um nome único para a instância
   * @param userId ID do usuário (opcional)
   * @param userName Nome do usuário (opcional)
   * @returns Nome único da instância
   */
  static generateInstanceName(userId?: string, userName?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    // Usar o nome do usuário se disponível, senão usar o ID
    let userPrefix = 'user';
    if (userName) {
      // Limpar o nome do usuário para usar apenas caracteres válidos
      userPrefix = userName
        .replace(/[^a-zA-Z0-9]/g, '') // Remove caracteres especiais
        .toLowerCase() // Converte para minúsculas
        .substring(0, 20); // Limita a 20 caracteres
    } else if (userId) {
      userPrefix = userId.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    return `${userPrefix}_${timestamp}_${random}`;
  }

  /**
   * Inicia polling para verificar o estado da conexão
   * @param instanceName Nome da instância
   * @param onStateChange Callback chamado quando o estado muda
   * @param interval Intervalo em milissegundos (padrão: 5000ms)
   * @returns Função para parar o polling
   */
  static startConnectionPolling(
    instanceName: string,
    onStateChange: (state: ConnectionState) => void,
    interval: number = 5000
  ): () => void {
    let isPolling = true;
    let currentState: string | null = null;

    const poll = async () => {
      if (!isPolling) return;

      try {
        const state = await this.getConnectionState(instanceName);
        
        // Só chama o callback se o estado mudou
        if (state.state !== currentState) {
          currentState = state.state;
          onStateChange(state);
        }

        // Para o polling se a conexão foi estabelecida
        if (state.state === 'open') {
          isPolling = false;
          return;
        }

        // Continua o polling
        if (isPolling) {
          setTimeout(poll, interval);
        }
      } catch (error) {
        console.error('❌ Erro no polling:', error);
        
        // Continua o polling mesmo com erro
        if (isPolling) {
          setTimeout(poll, interval);
        }
      }
    };

    // Inicia o polling
    poll();

    // Retorna função para parar o polling
    return () => {
      isPolling = false;
    };
  }
}

export default EvolutionApiService; 