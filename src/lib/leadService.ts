import axios from 'axios'
import { supabase, getCurrentUser } from './supabaseClient'
import type { Lead, LeadList, LeadGenerationResponse } from '../types'
import { generateDemoLeads } from './demoLeads'

const N8N_WEBHOOK_URL = 'https://n8n-n8n-start.kof6cn.easypanel.host/webhook/842e7854-35df-4b20-9a6e-994fd934505e'

export class LeadService {
  /**
   * Gera leads a partir de uma URL do Google Maps
   */
  static async generateLeads(searchUrl: string, limit: number = 10): Promise<LeadGenerationResponse> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Validar URL do Google Maps
      if (!this.isValidGoogleMapsUrl(searchUrl)) {
        throw new Error('URL do Google Maps inválida')
      }

      const response = await axios.post(
        N8N_WEBHOOK_URL,
        {
          google_maps_url: searchUrl,
          limit,
          user_id: user.id,
          timestamp: new Date().toISOString()
        },
        {
          timeout: 120000, // 2 minutos timeout
          headers: {
            'Content-Type': 'application/json'
            // User-Agent removido - não é permitido pelo navegador
          }
        }
      )

      // Processar resposta do N8N
      const data = response.data
      
      // Log para debug - ajuda a entender o formato da resposta
      console.log('🔍 Resposta completa do N8N:', data)
      console.log('🔍 Tipo da resposta:', typeof data)
      
      // Parser flexível - tenta extrair leads de diferentes estruturas
      let leads: any[] = []
      
      if (Array.isArray(data)) {
        // Caso 1: Resposta é diretamente um array de leads
        leads = data
        console.log('✅ Parser: Array direto detectado')
      } else if (data && Array.isArray(data.leads)) {
        // Caso 2: Resposta tem propriedade 'leads' com array
        leads = data.leads
        console.log('✅ Parser: data.leads detectado')
      } else if (data && Array.isArray(data.data)) {
        // Caso 3: Resposta tem propriedade 'data' com array
        leads = data.data
        console.log('✅ Parser: data.data detectado')
      } else if (data && Array.isArray(data.results)) {
        // Caso 4: Resposta tem propriedade 'results' com array
        leads = data.results
        console.log('✅ Parser: data.results detectado')
      } else if (data && Array.isArray(data.items)) {
        // Caso 5: Resposta tem propriedade 'items' com array
        leads = data.items
        console.log('✅ Parser: data.items detectado')
      } else if (data && Array.isArray(data.businesses)) {
        // Caso 6: Resposta tem propriedade 'businesses' com array
        leads = data.businesses
        console.log('✅ Parser: data.businesses detectado')
      } else if (data && Array.isArray(data.places)) {
        // Caso 7: Resposta tem propriedade 'places' com array
        leads = data.places
        console.log('✅ Parser: data.places detectado')
      } else if (data && typeof data === 'object') {
        // Caso 8: Busca automática por arrays em propriedades do objeto
        const possibleArrays = ['leads', 'data', 'results', 'items', 'businesses', 'places', 'establishments', 'locations']
        for (const prop of possibleArrays) {
          if (Array.isArray(data[prop])) {
            leads = data[prop]
            console.log(`✅ Parser: data.${prop} detectado automaticamente`)
            break
          }
        }
      }
      
      // Validar se encontrou leads
      if (!Array.isArray(leads) || leads.length === 0) {
        console.error('❌ Nenhum lead encontrado na resposta')
        console.error('📄 Estrutura da resposta:', JSON.stringify(data, null, 2))
        throw new Error(`Nenhum lead encontrado. Formato recebido: ${typeof data}. Verifique se o webhook N8N está retornando dados no formato correto ou tente uma URL diferente.`)
      }

      console.log(`✅ ${leads.length} leads encontrados`)

      // Normalizar dados dos leads vindos do N8N
      const normalizedLeads: Lead[] = leads.map((lead: any, index: number) => ({
        id: lead.id || `temp_${Date.now()}_${index}`,
        name: lead.title || lead.name || 'Nome não disponível',
        address: lead.city || lead.address || 'Cidade não disponível',
        phone: LeadService.formatPhoneFromN8N(lead.phoneUnformatted || lead.phone),
        rating: this.normalizeRating(lead.totalScore || lead.rating),
        totalScore: lead.totalScore || lead.rating || 0,
        website: lead.website || lead.url,
        business_type: lead.business_type || lead.category || 'Estabelecimento',
        google_maps_url: lead.google_maps_url || lead.url,
        place_id: lead.place_id || lead.placeId,
        reviews_count: lead.reviewsCount || lead.reviews_count || lead.review_count,
        price_level: lead.price_level || lead.priceLevel,
        opening_hours: lead.opening_hours || lead.openingHours || lead.hours,
        photos: lead.photos || lead.images || [],
        selected: false
      }))

      console.log(`✅ ${normalizedLeads.length} leads normalizados com sucesso`)

      return {
        success: true,
        leads: normalizedLeads,
        total_found: normalizedLeads.length,
        search_url: searchUrl,
        location: data?.location || 'Localização detectada',
        search_term: data?.search_term || 'Busca realizada',
        processing_time: data?.processing_time || 2.0
      }

    } catch (error: any) {
      console.error('❌ Erro ao conectar com N8N:', error)
      
      // Se houver erro de conectividade, usar dados demo
      if (error.code === 'ERR_NETWORK' || 
          error.message.includes('Network Error') || 
          error.message.includes('CORS') || 
          error.code === 'ERR_CORS' ||
          error.code === 'ECONNABORTED' ||
          error.response?.status === 404) {
        
        console.log('🎭 N8N indisponível, usando dados de demonstração')
        
        // Retornar dados demo em vez de erro
        const demoResult = generateDemoLeads(searchUrl, limit)
        
        // Adicionar uma nota sobre ser dados demo
        return {
          ...demoResult,
          demo_mode: true,
          error: 'Conectado com dados de demonstração. Configure o N8N para dados reais.'
        }
      }
      
      // Para outros erros, retornar erro específico
      let errorMessage = 'Erro interno no serviço de extração'
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Timeout: A extração está demorando mais que o esperado. Tente novamente com menos leads.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro no servidor de extração. Tente novamente em alguns minutos.'
      } else if (error.message.includes('URL do Google Maps inválida')) {
        errorMessage = 'URL inválida. Cole uma URL de busca ou lugar do Google Maps (ex: https://www.google.com/maps/search/restaurantes+sp)'
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        leads: [],
        total_found: 0,
        search_url: searchUrl,
        error: errorMessage
      }
    }
  }

  /**
   * Salva uma lista de leads no Supabase
   */
  static async saveLeadList(
    name: string, 
    leads: Lead[], 
    description?: string,
    tags?: string[]
  ): Promise<LeadList> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Remover propriedades temporárias dos leads
    const cleanLeads = leads.map(lead => {
      const { selected, ...cleanLead } = lead
      return cleanLead
    })

    const listData = {
      user_id: user.id,
      name: name.trim(),
      leads: cleanLeads,
      total_leads: cleanLeads.length,
      description: description?.trim(),
      tags: tags || [],
      status: 'active' as const
    }

    const { data, error } = await supabase
      .from('lead_lists')
      .insert(listData)
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar lista:', error)
      throw new Error('Erro ao salvar lista de leads')
    }

    return data as LeadList
  }

  /**
   * Adiciona leads a uma lista existente
   */
  static async addLeadsToList(listId: string, newLeads: Lead[]): Promise<LeadList> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar lista existente
    const { data: existingList, error: fetchError } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingList) {
      throw new Error('Lista não encontrada')
    }

    // Combinar leads existentes com novos
    const existingLeads = existingList.leads || []
    const cleanNewLeads = newLeads.map(lead => {
      const { selected, ...cleanLead } = lead
      return cleanLead
    })

    // Evitar duplicatas baseadas no nome e endereço
    const combinedLeads = [...existingLeads]
    
    cleanNewLeads.forEach(newLead => {
      const isDuplicate = existingLeads.some((existing: any) => 
        existing.name.toLowerCase() === newLead.name.toLowerCase() &&
        existing.address.toLowerCase() === newLead.address.toLowerCase()
      )
      
      if (!isDuplicate) {
        combinedLeads.push(newLead)
      }
    })

    // Atualizar lista
    const { data, error } = await supabase
      .from('lead_lists')
      .update({
        leads: combinedLeads,
        total_leads: combinedLeads.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar lista:', error)
      throw new Error('Erro ao adicionar leads à lista')
    }

    return data as LeadList
  }

  /**
   * Busca todas as listas do usuário
   */
  static async getUserLeadLists(): Promise<LeadList[]> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar listas:', error)
      throw new Error('Erro ao carregar listas de leads')
    }

    return data as LeadList[]
  }

  /**
   * Busca uma lista específica
   */
  static async getLeadList(listId: string): Promise<LeadList | null> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Lista não encontrada
      }
      console.error('Erro ao buscar lista:', error)
      throw new Error('Erro ao carregar lista de leads')
    }

    return data as LeadList
  }

  /**
   * Deleta uma lista de leads
   */
  static async deleteLeadList(listId: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    const { error } = await supabase
      .from('lead_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao deletar lista:', error)
      throw new Error('Erro ao deletar lista de leads')
    }
  }

  /**
   * Validações e utilitários
   */
  private static isValidGoogleMapsUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      const pathname = urlObj.pathname.toLowerCase()
      
      // Verificar diferentes formatos de URLs do Google Maps
      const validHostnames = [
        'maps.google.com',
        'www.google.com',
        'google.com',
        'maps.app.goo.gl',
        'goo.gl'
      ]
      
      const validPaths = [
        '/maps',
        '/search',
        '/place',
        '/dir'
      ]
      
      // Verificar se é um hostname válido
      const isValidHostname = validHostnames.some(validHost => 
        hostname === validHost || hostname.endsWith('.' + validHost)
      )
      
      if (!isValidHostname) {
        return false
      }
      
      // Para google.com, verificar se o path contém /maps
      if (hostname.includes('google.com')) {
        return pathname.includes('/maps') || validPaths.some(path => pathname.startsWith(path))
      }
      
      // Para goo.gl, assumir que é válido (URLs encurtadas)
      if (hostname.includes('goo.gl')) {
        return true
      }
      
      return true
      
    } catch (error) {
      console.warn('Erro ao validar URL:', error)
      return false
    }
  }

  private static normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined
    
    // Remover caracteres não numéricos exceto + e espaços
    const cleaned = phone.replace(/[^\d+\s()-]/g, '')
    return cleaned.trim() || undefined
  }

  /**
   * Formatar telefone vindo do N8N (formato: 5531993866785)
   */
  private static formatPhoneFromN8N(phoneUnformatted?: string): string | undefined {
    if (!phoneUnformatted) return undefined
    
    // Remove todos os caracteres não numéricos
    const numbers = phoneUnformatted.replace(/\D/g, '')
    
    // Formato esperado: 5531993866785 (55 + 31 + 99386-6785)
    if (numbers.length >= 13) {
      // Remove o código do país (55) e formata
      const withoutCountryCode = numbers.substring(2)
      const ddd = withoutCountryCode.substring(0, 2)
      const number = withoutCountryCode.substring(2)
      
      if (number.length === 9) {
        // Celular: (31) 99386-6785
        return `(${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`
      } else if (number.length === 8) {
        // Fixo: (31) 3386-6785
        return `(${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`
      }
    }
    
    // Fallback: retorna formatado simples
    return LeadService.normalizePhone(phoneUnformatted)
  }

  private static normalizeRating(rating?: any): number | undefined {
    if (!rating) return undefined
    
    const num = parseFloat(rating)
    if (isNaN(num)) return undefined
    
    // Garantir que está entre 0 e 5
    return Math.max(0, Math.min(5, num))
  }
}