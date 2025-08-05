# 🚀 LeadFlow - Gerador de Leads Profissional

<div align="center">
  <img src="/public/lflogo1.png" alt="LeadFlow Logo" width="200"/>
  
  [![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0.0-purple.svg)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0.0-38B2AC.svg)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
  
  **Extraia leads qualificados do Google Maps e gerencie suas campanhas de marketing**
</div>

## 📋 Índice

- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias](#️-tecnologias)
- [🚀 Instalação](#-instalação)
- [⚙️ Configuração](#️-configuração)
- [📱 Como Usar](#-como-usar)
- [🏗️ Estrutura do Projeto](#️-estrutura-do-projeto)
- [🔧 Configuração do Banco de Dados](#-configuração-do-banco-de-dados)
- [📦 Deploy](#-deploy)
- [🤝 Contribuição](#-contribuição)
- [📄 Licença](#-licença)

## ✨ Funcionalidades

### 🎯 **Gerador de Leads**
- ✅ Extração automática de dados do Google Maps
- ✅ Filtros inteligentes para leads qualificados
- ✅ Interface intuitiva e responsiva
- ✅ Salvamento em listas organizadas
- ✅ Teste de conectividade em tempo real

### 📊 **Dashboard**
- ✅ Visão geral das listas de leads
- ✅ Estatísticas e métricas
- ✅ Navegação rápida entre funcionalidades
- ✅ Interface moderna e profissional

### 📨 **Disparador em Massa**
- ✅ Seleção de múltiplas listas
- ✅ Composição de mensagens personalizadas
- ✅ Integração com Evolution API (WhatsApp)
- ✅ Configuração de campanhas

### 🔐 **Sistema de Autenticação**
- ✅ Login e cadastro seguro
- ✅ Perfis de usuário personalizados
- ✅ Proteção de rotas
- ✅ Sessões persistentes

## 🛠️ Tecnologias

### **Frontend**
- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Framer Motion** - Animações
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas

### **Backend & Infraestrutura**
- **Supabase** - Backend as a Service
- **PostgreSQL** - Banco de dados
- **N8N** - Automação de workflows
- **Evolution API** - Integração WhatsApp

### **UI/UX**
- **Magic UI** - Componentes modernos
- **Lucide React** - Ícones
- **Shadcn/ui** - Componentes base

## 🚀 Instalação

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- N8N (opcional para desenvolvimento local)

### **1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/leadflow.git
cd leadflow
```

### **2. Instale as dependências**
```bash
npm install
```

### **3. Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local`:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_N8N_WEBHOOK_URL=sua_url_do_webhook_n8n
```

### **4. Execute o projeto**
```bash
npm run dev
```

Acesse: `http://localhost:5173`

## ⚙️ Configuração

### **Supabase Setup**

1. **Crie um projeto no Supabase**
2. **Execute o script SQL** (`supabase-setup.sql`)
3. **Configure as políticas de segurança**
4. **Atualize as variáveis de ambiente**

### **N8N Workflow**

1. **Importe o workflow** do arquivo `n8n-workflow.json`
2. **Configure as credenciais** do Supabase
3. **Atualize a URL do webhook** nas variáveis de ambiente

### **Evolution API (WhatsApp)**

1. **Configure uma instância** da Evolution API
2. **Obtenha as credenciais** (URL, API Key, Instance Name)
3. **Configure no painel** do LeadFlow

## 📱 Como Usar

### **1. Cadastro e Login**
- Acesse `/login`
- Crie sua conta com nome e e-mail
- Faça login para acessar o dashboard

### **2. Gerar Leads**
- Vá para `/gerador`
- Cole a URL de uma busca do Google Maps
- Selecione a quantidade de leads
- Aguarde a extração automática
- Selecione os leads desejados
- Salve em uma nova lista ou existente

### **3. Gerenciar Listas**
- Acesse o dashboard
- Visualize todas as suas listas
- Clique em uma lista para ver os detalhes
- Exporte ou edite conforme necessário

### **4. Disparar Campanhas**
- Vá para `/disparador`
- Configure sua conta WhatsApp
- Selecione as listas de destino
- Componha sua mensagem
- Envie a campanha

## 🏗️ Estrutura do Projeto

```
leadflow/
├── public/                 # Arquivos estáticos
│   ├── lflogo1.png        # Logo principal
│   └── faviconlf.png      # Favicon
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes base (Shadcn/ui)
│   │   ├── magicui/      # Componentes Magic UI
│   │   ├── Navbar.tsx    # Navegação
│   │   ├── Footer.tsx    # Rodapé
│   │   └── ...
│   ├── pages/            # Páginas da aplicação
│   │   ├── Dashboard.tsx
│   │   ├── GeradorLeads.tsx
│   │   ├── DisparadorMassa.tsx
│   │   └── LoginPage.tsx
│   ├── lib/              # Utilitários e configurações
│   │   ├── supabaseClient.ts
│   │   └── leadService.ts
│   ├── types/            # Definições TypeScript
│   │   └── index.ts
│   ├── hooks/            # Custom hooks
│   └── App.tsx           # Componente principal
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔧 Configuração do Banco de Dados

### **Tabelas Principais**

```sql
-- Tabela de listas de leads
CREATE TABLE lead_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  leads JSONB DEFAULT '[]',
  total_leads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Políticas de segurança
ALTER TABLE lead_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lists" ON lead_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists" ON lead_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists" ON lead_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists" ON lead_lists
  FOR DELETE USING (auth.uid() = user_id);
```

## 📦 Deploy

### **Vercel (Recomendado)**

1. **Conecte seu repositório** ao Vercel
2. **Configure as variáveis de ambiente**
3. **Deploy automático** a cada push

### **Netlify**

1. **Conecte o repositório** ao Netlify
2. **Configure o build command**: `npm run build`
3. **Configure o publish directory**: `dist`

### **GitHub Pages**

⚠️ **IMPORTANTE**: O LeadFlow **NÃO funciona** no GitHub Pages porque é uma aplicação React dinâmica que requer:
- Servidor para roteamento SPA
- Variáveis de ambiente (Supabase, N8N)
- Funcionalidades de backend

**Use Vercel ou Netlify** para deploy.

### **Outros**

- **Firebase Hosting**
- **AWS S3 + CloudFront**
- **Railway** (plataforma completa)

## 🤝 Contribuição

1. **Fork o projeto**
2. **Crie uma branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit suas mudanças** (`git commit -m 'Add some AmazingFeature'`)
4. **Push para a branch** (`git push origin feature/AmazingFeature`)
5. **Abra um Pull Request**

### **Padrões de Código**

- Use **TypeScript** para todos os arquivos
- Siga o **ESLint** configurado
- Use **Prettier** para formatação
- Escreva **testes** para novas funcionalidades
- Documente **componentes** complexos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: contato@mindflowdigital.com.br
- **Telefone**: 31 97266-1278
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/leadflow/issues)

---

<div align="center">
  <p>Desenvolvido com ❤️ pela <strong>MindFlow Digital</strong></p>
  <p>© 2025 LeadFlow. Todos os direitos reservados.</p>
</div>