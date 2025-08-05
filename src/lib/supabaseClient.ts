import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lsvwjyhnnzeewuuuykmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdndqeWhubnplZXd1dXV5a21iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzc4NTYsImV4cCI6MjA2OTkxMzg1Nn0.jNw-YTXlnbd51l7RHHQpTYgCqxERz6NqPggqMM41Fck'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface LeadList {
  id: string
  user_id: string
  name: string
  leads: any[] // JSON array de leads
  total_leads: number
  created_at: string
}

export interface Lead {
  id?: string
  name: string
  address: string
  phone?: string
  rating?: number
  website?: string
  business_type?: string
}

// Função para obter o usuário atual
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Função para fazer logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}