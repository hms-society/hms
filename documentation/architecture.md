# Arquitetura

### **Front-end**

### 🚀 Base e Estilização

- **TypeScript (TS):** Garante tipagem estática, reduz erros em tempo de desenvolvimento e melhora o auto-complete do editor.
- **TanStack Start:** Framework full-stack baseado em React, ideal para SSR, rotas tipadas, loaders e integração moderna com TanStack Router.
- **Tailwind CSS:** Framework utilitário para estilização rápida, responsiva e baseada em classes direto no JSX.
- **shadcn/ui:** Componentes de interface acessíveis, customizáveis e modificáveis, integrados ao Tailwind CSS.
- **React Email:** Usado para construir templates de e-mail em React/TSX, compartilhados no monorepo.

### 🔄 Estado, Dados e Navegação

- **TanStack Query:** Gerencia requisições, cache, sincronização e estado assíncrono entre o front-end e o server NestJS.
- **TanStack Router:** Gerencia navegação, rotas tipadas, loaders, proteção de páginas e integração natural com TanStack Start.
- **Supabase Auth Client:** Usado no front-end para sessão, login, logout, refresh token e leitura autenticada do Supabase Storage.

### 📋 Formulários e Validação

- **React Hook Form:** Controla formulários complexos de forma performática, evitando renderizações desnecessárias.
- **Zod:** Valida dados de formulários, payloads do server e contratos compartilhados entre front-end e back-end.

### 🛡️ Qualidade de Código e Automação

- **BiomeJs:** Analisa o código para encontrar erros, inconsistências, padroniza a formatação do código em todo o monorepo e garantir boas práticas com React, TypeScript e Node.
- **Turborepo:** Organiza o monorepo, compartilhando pacotes entre front-end, back-end, banco, e-mails, UI e testes.

### 🧪 Testes e Confiabilidade

- **Vitest:** Executor de testes rápido para funções, componentes, schemas e regras de negócio.
- **Testing Library:** Testes de componentes React focados em comportamento e acessibilidade.
- **Testes de integração de rotas:** Validam fluxos principais das páginas, navegação, estados de carregamento, erros e integração com dados.

---

### **Back-end**

### 🚀 Base do Server

- **NestJS:** Framework principal do server, responsável por módulos, controllers, services, autenticação, autorização e integração entre serviços.
- **TypeScript:** Tipagem forte no back-end, reduzindo erros e melhorando manutenção.
- **Drizzle ORM:** ORM SQL-first para modelar tabelas, gerar migrations e consultar PostgreSQL com tipagem forte.
- **Zod:** Validação de DTOs, contratos compartilhados, entradas do server, webhooks e payloads internos.

### 🗄️ Banco de Dados

- **Supabase PostgreSQL:** Banco principal da aplicação, usado para usuários da aplicação, tenants, permissões, arquivos, metadados e dados do produto.
- **Drizzle Migrations:** Controle versionado das alterações no banco.

### 🔐 Autenticação e Autorização

- **Supabase Auth:** Responsável por cadastro, login, sessões, refresh token, reset de senha, magic link e confirmação de e-mail.
- **RLS no Supabase Storage:** Controla leitura/download de arquivos privados por usuário, tenant e papel administrativo.

### 📦 Storage

- **Supabase Storage:** Armazenamento principal de arquivos, na região de São Paulo.
- **Signed Upload URL:** Usado para escrita/upload direto do front-end para o Storage, sem passar bytes pela VPS.
- **RLS para Leitura:** Usuários baixam arquivos privados com JWT e políticas RLS.
- **Artefatos documentais duráveis:** DOCX e PDFs internos são objetos imutáveis em
  bucket privado, com metadados persistidos no PostgreSQL. Uma versão documental não
  troca silenciosamente a referência do seu artefato; bytes históricos ausentes exigem
  uma nova versão e nova confirmação do pacote.

### ✉️ E-mails

- **Resend:** Serviço de envio de e-mails em staging e produção.
- **React Email:** Templates de e-mails transacionais usando React/TSX.
- **Mailpit:** Captura e visualização de e-mails localmente.
- **SMTP local:** Usado pelo Supabase Auth local e pelo NestJS local para enviar e-mails ao Mailpit.
- **Supabase Auth Email Templates:** Templates específicos para confirmação, recuperação, magic link e convite.
- **Templates de e-mail do Signing Gateway:** Assets HTML estáticos em `volumes/communication/templates`, seguindo o estilo dos templates do Supabase Auth; o corpo em texto puro permanece como fallback de compatibilidade.

### ⚙️ Jobs e Workflows

- **Inngest:** Orquestração de jobs, retries, workflows assíncronos e automações.
- **Inngest Dev Server:** Ambiente local para testar workflows.
- **Inngest Cloud:** Usado em staging e produção.
- **Ledger de trabalho limitado:** Fluxos assíncronos com estado visível ao usuário
  podem persistir seu próprio lifecycle e usar reconciliação periódica limitada para
  republicar trabalho pendente ou com lease expirada. Isso não cria um outbox genérico;
  a publicação principal continua direta e o fan-out continua sendo responsabilidade
  do Inngest.

### 📄 Conversão de documentos

- **Gotenberg:** Serviço privado e sem estado permanente para conversão de DOCX
  durável em PDF de configuração. O NestJS envia apenas os bytes necessários,
  valida e armazena o resultado no Supabase Storage; o Gotenberg não recebe
  credenciais de Storage nem fica exposto publicamente.
- **Execução assíncrona:** A confirmação do pacote registra atomicamente um lote
  durável. Depois do commit, um evento de lote faz fan-out para um job independente
  por documento, com token de tentativa, lease, retry e finalização idempotente.

Fluxo típico:

Webhook da Meta Cloud API

→ NestJS valida e registra evento

→ NestJS envia evento para Inngest

→ Inngest executa workflow

→ Inngest / Resend / Meta Cloud API / PostgreSQL

### 🤖 IA

- **Mastra AI:** Camada de orquestração de IA, agentes, tools e fluxos inteligentes.
- **DeepSeek V4:** Modelo de linguagem principal para os agentes de IA. Duas variantes disponíveis:
    - **DeepSeek V4-Pro:** 1.6T parâmetros totais (49B ativos por token). Usado para tarefas que exigem raciocínio complexo, produção jurídica assistida e análise documental.
    - **DeepSeek V4-Flash:** 284B parâmetros totais (13B ativos por token). Usado para tarefas rápidas e econômicas como classificação, extração de dados e triagem.
- **Contexto de 1M tokens:** Ambas as variantes suportam janela de contexto de 1 milhão de tokens, ideal para análise de documentos jurídicos extensos.
- **Modos de operação:** Suporte a modo Thinking (raciocínio passo a passo) e Non-Thinking (resposta direta), configurável por agente/tarefa.
- **Compatibilidade de API:** Suporta formatos OpenAI ChatCompletions e Anthropic API, integrável diretamente com o Mastra AI.
- **Licença MIT:** Pesos open source, com possibilidade futura de self-hosting se o volume justificar.
- **Tools controladas:** A IA não acessa banco, storage ou service role diretamente; ela usa ferramentas específicas expostas pelo back-end.
- **NestJS AiService:** Camada intermediária entre o produto e o Mastra.

### 📲 WhatsApp

- **Meta Cloud API:** Integração oficial usada somente para mensagens automáticas e recebimento de documentos.
- **Meta Webhooks:** Entregam mensagens recebidas, documentos e estados de entrega ao NestJS.

### 🧪 Testes do Back-end

- **Vitest:** Testes unitários de services, regras de negócio, schemas e helpers.
- **Supertest:** Testes de integração HTTP do server NestJS.
- **Testcontainers:** Sobe bancos/serviços reais em testes quando necessário.
- **FakeWhatsAppProvider:** Provider em memória usado nos testes automatizados principais.
- **Testes de integração de rotas:** Validam controllers, middlewares, autenticação, permissões, contratos e respostas HTTP.

---

### **Infraestrutura**

### 🧱 Monorepo

- **Turborepo:** Organização do projeto em apps e packages compartilhados.

Estrutura sugerida:

apps/

├── web

└── server

packages/

├── email

├── validation

├── core

### 🐳 Ambiente Local

- **Docker Compose único:** Sobe toda a infraestrutura local sem depender de `supabase start`.
- **Supabase local via Docker:** Auth, PostgreSQL, Storage, PostgREST, Kong e Mailpit.
- **templates-server:** Container interno que serve HTML dos templates do Supabase Auth local.
- **NestJS e TanStack Start fora do Docker:** Rodam via `pnpm dev`.

Serviços locais:

docker-compose.yml

├── supabase-db

├── supabase-auth / GoTrue

├── supabase-storage

├── supabase-rest

├── supabase-kong

├── mailpit

└── templates-server

### ☁️ Staging e Produção

- **Supabase gerenciado em São Paulo:** Auth, PostgreSQL e Storage.
- **Coolify:** Deploy do server e web app. O WhatsApp é consumido como serviço gerenciado da Meta.
- **Hostinger VPS:** Servidor principal para Coolify.
- **Cloudflare:** DNS, proxy, TLS, WAF básico e proteção de domínios.
- **Traefik integrado do Coolify:** Proxy reverso interno para os containers.

### 🔐 Segurança de Rede

Portas públicas:

22 — SSH, preferencialmente restrito ao seu IP

80 — HTTP

443 — HTTPS

Portas que não devem ficar públicas:

5432 — PostgreSQL

3000 — front-end direto

3001 — server direto

8000 — Coolify direto após configurar domínio

### 🌐 Domínios

Sugestão:

app.seudominio.com

→ TanStack Start

api.seudominio.com

→ NestJS server


### 🧪 Testes e CI

- **Docker Compose local/test:** Base para rodar Supabase Auth, Storage, DB e Mailpit. Os testes do WhatsApp usam o número de teste da Meta e um túnel HTTPS para o webhook.
- **Vitest:** Testes unitários e de integração.
- **Supertest:** Testes HTTP do server.
- **Testing Library:** Testes de componentes e rotas do front-end.
- **Mailpit:** Permite testar confirmação de e-mail, magic link e reset de senha.
- **Fake providers:** Usados para WhatsApp e serviços externos nos testes principais.

---

### **Resumo Final da Stack**

### Front-end

- **TanStack Start**
- **TanStack Router**
- **TanStack Query**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Hook Form**
- **Zod**
- **Vitest**
- **Testing Library**

### Back-end

- **NestJS**
- **Drizzle ORM**
- **Zod**
- **Supabase Auth**
- **Supabase PostgreSQL**
- **Supabase Storage**
- **Inngest**
- **Resend**
- **React Email**
- **Mastra AI**
- **DeepSeek V4 (Pro + Flash)**
- **Vitest**
- **Supertest**
- **Testcontainers**

### WhatsApp

- **Meta Cloud API**
- **Meta Webhooks**

### Assinatura Eletrônica

- **Documenso self-hosted (pinned runtime):** provider privado acessado somente pelo
  adaptador Server; o Signing Gateway não expõe a URL do provedor ao navegador.

### Infra

- **Turborepo**
- **Docker Compose local único**
- **Coolify**
- **Traefik integrado**
- **Hostinger VPS**
- **Cloudflare DNS/Proxy/WAF**
- **Mailpit local**

---

### ✍️ Gateway de Assinatura Eletrônica

- **Documenso self-hosted:** runtime privado e fixado, integrado por um provider
  Server-side. A aplicação cria um envelope por solicitação, com os PDFs prontos
  e as atribuições imutáveis dos destinatários.
- **Fronteira de acesso:** o browser acessa apenas as rotas do HMS. O Server
  remove cookies, autorização e URLs arbitrárias antes de fazer proxy para o
  provider, e injeta somente o contexto de idioma permitido.
- **Persistência e artefatos:** o estado da solicitação, destinatários, itens,
  tentativas, recibos e referências de resultado ficam no PostgreSQL/Supabase;
  PDFs privados permanecem no Supabase Storage. O provider não é a fonte de
  verdade do estado do HMS.
- **Eventos e reconciliação:** webhooks normalizados, jobs Inngest e reconciliação
  periódica são idempotentes e preservam evidências de submissão, rejeição,
  cancelamento e resultado.
- **Entrega:** convites e OTP usam os templates HTML estáticos em
  `volumes/communication/templates`, Resend em staging/produção e Mailpit local,
  sempre com corpo em texto puro como fallback.

### Fluxo do Signing Gateway

1. O advogado confirma uma solicitação de formalização no HMS.
2. O Server cria um envelope Documenso compartilhado com os PDFs prontos e os
   destinatários autorizados.
3. O HMS envia o convite pelo canal permitido e autentica clientes por OTP ou
   colaboradores pela sessão HMS, sem expor a credencial do provider.
4. O destinatário lê e reconhece cada documento no Gateway, em abas ordenadas.
5. O HMS inicia uma única cerimônia do provider depois que todo o pacote foi lido.
6. Webhooks e reconciliação atualizam o estado agregado e registram o resultado
   privado no HMS.

O escopo jurídico, a ativação em staging/produção e a validação de requisitos
externos permanecem condicionados às evidências e autorizações registradas no
Spec e na Evaluation; esta arquitetura não declara esses gates como aprovados.

---

### 💾 Estratégia de Backup (Regra 3-2-1)

A estratégia de backup segue a regra 3-2-1: 3 cópias dos dados, em 2 tipos de mídia diferentes, com pelo menos 1 cópia offsite.

### Cópias

| Cópia | Local | Tipo | Função |
| --- | --- | --- | --- |
| 1 — Primária | Supabase (gerenciado) | Cloud gerenciado | Backup automático diário nativo do Supabase |
| 2 — Offsite A | Google Drive | Cloud storage | Backup automático diário |
| 3 — Offsite B | Dropbox | Cloud storage | Backup automático diário (redundância) |

### O que entra no backup

| Dado | Origem | Formato do backup |
| --- | --- | --- |
| Supabase PostgreSQL (banco principal) | Supabase gerenciado | pg_dump compactado (.sql.gz) |
| Documenso e seus dados do provider | Volumes privados do serviço | Backup conforme runbook do ambiente |
| Variáveis de ambiente e configs | Coolify / .env files | Cópia criptografada |

### Ferramenta recomendada: rclone

rclone é a ferramenta padrão para sincronização com provedores de cloud storage. Suporta Google Drive e Dropbox nativamente, com criptografia em trânsito e at-rest.

Configuração:

```
rclone config
# Configura remote "gdrive" → Google Drive
# Configura remote "dropbox" → Dropbox
```

### Política de retenção

| Local | Retenção |
| --- | --- |
| Supabase (gerenciado) | Automático (gerenciado pelo Supabase) |
| Google Drive | 90 dias |
| Dropbox | 90 dias |

### Monitoramento e alertas

- O script deve enviar notificação de sucesso/falha via webhook para o NestJS ou diretamente via Resend/Meta Cloud API
- Teste de restauração trimestral: subir ambiente isolado, restaurar backup, validar integridade dos dados

### Nota sobre o Supabase gerenciado

O Supabase gerenciado (banco principal da aplicação) é a cópia primária da regra
3-2-1, com backups automáticos diários feitos pelo próprio Supabase. O script de
backup adiciona cópias offsite para os dados persistentes do Documenso e as
configurações. Para autonomia total, é recomendado manter também um pg_dump
periódico do Supabase como cópia adicional nos storages remotos, especialmente
para cenários de migração ou desastre.
