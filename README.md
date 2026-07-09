# FocusMind

**Organize sua mente. Alcance seus objetivos.**

FocusMind e um aplicativo de produtividade pessoal completo que ajuda usuarios a organizar tarefas, criar habitos, acompanhar metas e melhorar sua disciplina atraves de um mentor pessoal de IA chamado "Nova".

## Fase 1 - Autenticacao Completa

### Sistema de Autenticacao
- Cadastro com nome, email e senha
- Login com email/senha
- **Login com Google (OAuth 2.0)**
- Recuperacao de senha com email
- Sessao persistente com refresh automatico
- Rotas protegidas

### Perfil do Usuario
- Edicao de nome
- **Upload de foto de perfil**
- Foto carregada no Supabase Storage
- Suporte a fotos do Google OAuth

### Banco de Dados
- Tabela `profiles` com dados do usuario
- Row Level Security (RLS) em todas as tabelas
- Storage bucket para fotos de perfil

## Funcionalidades Completas

### Gerenciador de Tarefas
- Criar, editar, excluir tarefas
- Prioridades: baixa, media, alta
- Status: pendente, em progresso, concluida
- Filtros e ordenacao

### Sistema de Habitos
- Cadastro de habitos diarios/semanais
- Registro de progresso
- Contagem de sequencia (streak)
- Calendario de evolucao

### Metas
- Criar objetivos com prazo
- Barra de progresso interativa
- Historico de metas conquistadas

### Notas
- Anotacoes pessoais
- Busca por conteudo
- Edicao e exclusao

### Nova - Mentor de IA
- Mensagens motivacionais
- Sugestoes de produtividade
- Chat interativo

### Sistema Premium
- Plano Gratuito: ate 10 tarefas, 3 habitos
- Plano Premium: recursos ilimitados

## Tecnologias

- **Frontend**: React 18 + TypeScript
- **Estilizacao**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Autenticacao**: Supabase Auth (Email/Senha + Google OAuth)
- **Storage**: Supabase Storage (fotos de perfil)
- **Seguranca**: Row Level Security (RLS)
- **PWA**: Service Worker, Manifest

## Configuracao

### Pre-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

### Instalacao

1. Clone o repositorio:
```bash
git clone <seu-repo>
cd focusmind
npm install
```

2. Configure as variaveis de ambiente:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

3. Configure Google OAuth no Supabase:
   - Va para Authentication > Providers > Google
   - Ative o provedor Google
   - Adicione seu Client ID e Client Secret do Google Cloud Console
   - Configure a URL de redirect: `https://seu-projeto.supabase.co/auth/v1/callback`

4. Configure Storage no Supabase:
   - Um bucket `profiles` foi criado automaticamente
   - Policies permitem que usuarios gerenciem apenas suas proprias fotos

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Rotas de Autenticacao

| Rota | Descricao |
|------|-----------|
| `/` | Landing page (Onboarding) |
| `/login` | Login com email/senha ou Google |
| `/signup` | Criar nova conta |
| `/auth/callback` | Callback do OAuth (Google) |
| `/reset-password` | Redefinir senha apos email |
| `/dashboard` | Dashboard principal (protegido) |
| `/tasks` | Gerenciador de tarefas (protegido) |
| `/habits` | Sistema de habitos (protegido) |
| `/goals` | Metas e objetivos (protegido) |
| `/notes` | Anotacoes pessoais (protegido) |
| `/profile` | Perfil do usuario (protegido) |
| `/premium` | Planos premium (protegido) |

## Deploy

### Vercel/Netlify

1. Configure as variaveis de ambiente no painel
2. Build: `npm run build`
3. Deploy da pasta `dist/`

### Supabase

O Supabase gerencia:
- Autenticacao (Email/Senha + Google OAuth)
- Banco de dados PostgreSQL
- Storage para fotos de perfil
- RLS (Row Level Security)
- APIs RESTful automaticas

## Converter para Android

### Usando Capacitor

1. Instale o Capacitor:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init FocusMind com.focusmind.app
npm install @capacitor/android
npx cap add android
```

2. Build e sincronize:
```bash
npm run build
npx cap sync
```

3. Abra no Android Studio:
```bash
npx cap open android
```

### Publicar na Google Play

1. Crie uma conta de desenvolvedor (US$ 25 unico)
2. Prepare o app bundle assinado
3. Crie uma aplicacao no Play Console
4. Upload do AAB
5. Preencha a ficha da loja
6. Envie para revisao

## Estrutura do Projeto

```
focusmind/
├── public/
│   ├── icon.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Logo.tsx
│   │   ├── Loading.tsx
│   │   ├── EmptyState.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── PremiumContext.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── Onboarding.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── AuthCallback.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Tasks.tsx
│   │   ├── Habits.tsx
│   │   ├── Goals.tsx
│   │   ├── Notes.tsx
│   │   ├── Profile.tsx
│   │   └── Premium.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   └── migrations/
│       └── 20260708124032_001_initial_schema.sql
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Seguranca

- Senhas criptografadas pelo Supabase
- OAuth 2.0 para Google SignIn
- RLS garante que cada usuario acessa apenas seus dados
- Storage policies para fotos de perfil
- Sessao persistente com refresh token
- Validacao de formularios no frontend
- Sanitizacao de dados

## Monetizacao Futura

O sistema premium esta preparado para integracao com:
- **Stripe** - Pagamentos internacionais
- **Google Play Billing** - Assinaturas Android
- **Apple In-App Purchase** - Assinaturas iOS

## Licenca

MIT License

---

Desenvolvido com React, TypeScript, Tailwind CSS e Supabase.
