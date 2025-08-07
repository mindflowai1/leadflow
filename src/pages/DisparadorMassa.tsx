import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, MessageSquare, Settings, Users, CheckCircle, AlertTriangle, Loader, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '../hooks/use-toast'
import { getCurrentUser } from '../lib/supabaseClient'
import { LeadService } from '../lib/leadService'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import WhatsAppConnection from '../components/WhatsAppConnection'
import type { LeadList, EvolutionAPIConfig } from '../types'

export default function DisparadorMassa() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<LeadList[]>([])
  const [selectedLists, setSelectedLists] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [whatsappConfig, setWhatsappConfig] = useState<EvolutionAPIConfig | null>(null)
  const [activeTab, setActiveTab] = useState<'campaign' | 'config'>('campaign')
  const [connectedInstance, setConnectedInstance] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        navigate('/login')
        return
      }
      setUser(currentUser)
      await loadData()
      setLoading(false)
    }
    checkAuth()
  }, [navigate])

  const loadData = async () => {
    try {
      const userLists = await LeadService.getUserLeadLists()
      setLists(userLists)
      // TODO: Carregar configuração do WhatsApp do usuário
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar suas listas de leads',
        variant: 'destructive'
      })
    }
  }

  const handleListToggle = (listId: string) => {
    setSelectedLists(prev => 
      prev.includes(listId) 
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    )
  }

  const calculateTotalLeads = () => {
    return lists
      .filter(list => selectedLists.includes(list.id))
      .reduce((total, list) => total + list.total_leads, 0)
  }

  const handleSendCampaign = async () => {
    if (!campaignName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para a campanha',
        variant: 'destructive'
      })
      return
    }

    if (selectedLists.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma lista',
        variant: 'destructive'
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma mensagem para enviar',
        variant: 'destructive'
      })
      return
    }

    if (!whatsappConfig) {
      toast({
        title: 'Erro',
        description: 'Configure sua conta WhatsApp antes de enviar',
        variant: 'destructive'
      })
      return
    }

    // TODO: Implementar o envio da campanha
    toast({
      title: 'Campanha Criada!',
      description: `Campanha "${campaignName}" foi criada e será processada em breve.`,
    })

    // Reset form
    setCampaignName('')
    setMessage('')
    setSelectedLists([])
  }

  const handleSaveWhatsAppConfig = async () => {
    // TODO: Implementar salvamento da configuração do WhatsApp
    toast({
      title: 'Configuração Salva!',
      description: 'Sua configuração do WhatsApp foi salva com sucesso.',
    })
  }

  const handleConnectionSuccess = (instanceName: string) => {
    setConnectedInstance(instanceName)
    setWhatsappConfig({
      id: 'temp',
      user_id: user.id,
      api_url: 'https://SEU_DOMINIO_DA_EVOLUTION_API:8080',
      api_key: '***',
      instance_name: instanceName,
      whatsapp_number: 'Conectado via QR Code',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    
    // Mudar para a aba de campanha após conectar
    setActiveTab('campaign')
  }

  const handleConnectionError = (error: string) => {
    console.error('Erro na conexão WhatsApp:', error)
    setConnectedInstance(null)
    setWhatsappConfig(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-3">
                  <Send className="w-4 h-4" />
                  <span>Disparador em Massa</span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  Envie mensagens para suas listas de Leads
                </h1>
                <p className="text-purple-100 text-base max-w-2xl font-medium">
                  Envie mensagens personalizadas para todos os seus Leads de uma só vez!
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-right">
                  <div className="text-sm text-purple-200">Logado como</div>
                  <div className="font-semibold">{user.user_metadata?.name || user.email}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'campaign'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:text-blue-600 hover:shadow-md border border-gray-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Nova Campanha
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:text-blue-600 hover:shadow-md border border-gray-200'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Configuração WhatsApp
          </button>
        </div>

        {activeTab === 'campaign' && (
          <div className="space-y-6">
            {/* Status da Configuração */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3">
                {whatsappConfig ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">
                      WhatsApp conectado: {whatsappConfig.whatsapp_number}
                    </span>
                    {connectedInstance && (
                      <span className="text-xs text-gray-500">
                        (Instância: {connectedInstance})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-600 font-medium">
                      Conecte sua conta WhatsApp para enviar campanhas
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('config')}
                      className="ml-auto"
                    >
                      Conectar WhatsApp
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seleção de Listas */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Selecionar Listas
                </h2>
                
                {lists.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      Você ainda não possui listas de leads
                    </p>
                    <Button 
                      onClick={() => navigate('/gerador')}
                      className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
                    >
                      Criar primeira lista
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedLists.includes(list.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleListToggle(list.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{list.name}</h3>
                            <p className="text-sm text-gray-500">
                              {list.total_leads} leads
                            </p>
                            {list.description && (
                              <p className="text-xs text-gray-400 mt-1">
                                {list.description}
                              </p>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedLists.includes(list.id)
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedLists.includes(list.id) && (
                              <CheckCircle className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {selectedLists.length > 0 && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 font-medium">
                          Total: {calculateTotalLeads()} leads selecionados
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Criar Campanha */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                  Criar Campanha
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaignName" className="text-gray-700 font-medium">Nome da Campanha</Label>
                    <Input
                      id="campaignName"
                      placeholder="Ex: Promoção de Natal 2024"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-gray-700 font-medium">Mensagem</Label>
                    <textarea
                      id="message"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none mt-1"
                      rows={6}
                      placeholder="Digite sua mensagem aqui..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {message.length}/1000 caracteres
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSendCampaign}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={!campaignName || !message || selectedLists.length === 0 || !whatsappConfig}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Campanha
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Status da Conexão Atual */}
            {connectedInstance && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-800">
                      WhatsApp Conectado
                    </h3>
                    <p className="text-sm text-green-700">
                      Instância: {connectedInstance}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Componente de Conexão WhatsApp */}
            <WhatsAppConnection
              userId={user?.id}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              onConnectionSuccess={handleConnectionSuccess}
              onConnectionError={handleConnectionError}
            />

            {/* Configuração Manual (Opcional) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Configuração Manual (Opcional)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiUrl" className="text-gray-700 font-medium">URL da API</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://api.evolutionapi.com"
                      defaultValue={whatsappConfig?.api_url || ''}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="apiKey" className="text-gray-700 font-medium">Chave da API</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Sua chave da Evolution API"
                      defaultValue={whatsappConfig?.api_key || ''}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="instanceName" className="text-gray-700 font-medium">Nome da Instância</Label>
                    <Input
                      id="instanceName"
                      placeholder="minha-instancia"
                      defaultValue={whatsappConfig?.instance_name || ''}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="whatsappNumber" className="text-gray-700 font-medium">Número do WhatsApp</Label>
                    <Input
                      id="whatsappNumber"
                      placeholder="5531999887766"
                      defaultValue={whatsappConfig?.whatsapp_number || ''}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Digite apenas números (DDI + DDD + Número)
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-medium text-yellow-800 mb-2">
                      Como configurar manualmente:
                    </h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>1. Tenha uma instância ativa da Evolution API</li>
                      <li>2. Obtenha a URL e chave da API</li>
                      <li>3. Configure uma instância no painel</li>
                      <li>4. Conecte seu WhatsApp via QR Code</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={handleSaveWhatsAppConfig} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Salvar Configuração Manual
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="text-center mt-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}