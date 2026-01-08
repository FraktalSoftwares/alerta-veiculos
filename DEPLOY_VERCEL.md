# 🚀 Guia de Deploy na Vercel

Este guia explica como fazer o deploy do projeto Alerta Veículos na Vercel.

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Projeto no GitHub (já configurado)
3. Projeto no Supabase configurado
4. Chave da API do Google Maps

## 🔧 Configuração

### 1. Conectar o Repositório

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório `FraktalSoftwares/alerta-veiculos`
4. A Vercel detectará automaticamente que é um projeto Vite

### 2. Configurar Variáveis de Ambiente

Na página de configuração do projeto, adicione as seguintes variáveis de ambiente:

#### Variáveis Obrigatórias:

```
VITE_SUPABASE_URL
```
- **Valor:** URL do seu projeto Supabase
- **Exemplo:** `https://xxxxxxxxxxxxx.supabase.co`

```
VITE_SUPABASE_PUBLISHABLE_KEY
```
- **Valor:** Chave pública (publishable key) do Supabase
- **Onde encontrar:** Supabase Dashboard → Settings → API → Publishable Key

```
VITE_GOOGLE_MAPS_API_KEY
```
- **Valor:** Chave da API do Google Maps
- **Como obter:** [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

```
VITE_APP_URL
```
- **Valor:** URL base da aplicação (para links de compartilhamento)
- **Exemplo:** `https://alertaveiculos.vercel.app`
- **Opcional:** Se não configurada, será usado `window.location.origin` automaticamente

### 3. Configurações de Build

A Vercel detectará automaticamente as seguintes configurações do `vercel.json`:

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 4. Deploy

1. Clique em **"Deploy"**
2. A Vercel fará o build automaticamente
3. Aguarde o processo de build e deploy
4. Seu projeto estará disponível em uma URL como: `https://alerta-veiculos.vercel.app`

## 🔄 Deploy Automático

Após a configuração inicial, a Vercel fará deploy automático sempre que você:

- Fizer push para a branch `main`
- Criar um Pull Request
- Fizer merge de um Pull Request

## 🌍 Domínio Personalizado (Opcional)

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar os registros DNS

## 📝 Verificações Pós-Deploy

Após o deploy, verifique:

- ✅ A aplicação carrega corretamente
- ✅ O login funciona (teste com credenciais válidas)
- ✅ Os mapas do Google Maps estão funcionando
- ✅ As requisições ao Supabase estão funcionando

## 🐛 Troubleshooting

### Erro: "Environment variable not found"

- Verifique se todas as variáveis de ambiente foram adicionadas na Vercel
- Certifique-se de que os nomes das variáveis estão corretos (com `VITE_` no início)

### Erro: "Build failed"

- Verifique os logs de build na Vercel
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript ou lint

### Mapas não carregam

- Verifique se a variável `VITE_GOOGLE_MAPS_API_KEY` está configurada
- Verifique se a API do Google Maps está habilitada no Google Cloud Console
- Verifique se as restrições de API (HTTP referrers) estão configuradas corretamente

### Erro de CORS no Supabase

- Verifique se a URL da Vercel está adicionada nas configurações de CORS do Supabase
- Supabase Dashboard → Settings → API → CORS

## 📚 Recursos Adicionais

- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do Supabase](https://supabase.com/docs)

## 🔐 Segurança

⚠️ **Importante:** Nunca commite arquivos `.env` ou chaves de API no repositório. Use sempre as variáveis de ambiente da Vercel.

