<<<<<<< HEAD
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

### ✉️ E-mails

- **Resend:** Serviço de envio de e-mails em staging e produção.
- **React Email:** Templates de e-mails transacionais usando React/TSX.
- **Mailpit:** Captura e visualização de e-mails localmente.
- **SMTP local:** Usado pelo Supabase Auth local e pelo NestJS local para enviar e-mails ao Mailpit.
- **Supabase Auth Email Templates:** Templates específicos para confirmação, recuperação, magic link e convite.

### ⚙️ Jobs e Workflows

- **Inngest:** Orquestração de jobs, retries, workflows assíncronos e automações.
- **Inngest Dev Server:** Ambiente local para testar workflows.
- **Inngest Cloud:** Usado em staging e produção.

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

=======
# Architecture

## **Front-end**

### Base and Styling

* **TypeScript (TS):** Provides static typing, reduces development-time errors, and improves editor autocomplete.
* **TanStack Start:** React-based full-stack framework, ideal for SSR, typed routes, loaders, and modern integration with TanStack Router.
* **Tailwind CSS:** Utility-first framework for fast, responsive styling based on classes directly in JSX.
* **shadcn/ui:** Accessible, customizable, and editable UI components integrated with Tailwind CSS.
* **React Email:** Used to build email templates in React/TSX, shared within the monorepo.

### State, Data, and Navigation

* **TanStack Query:** Manages requests, cache, synchronization, and asynchronous state between the front-end and the NestJS server.
* **TanStack Router:** Manages navigation, typed routes, loaders, page protection, and natural integration with TanStack Start.
* **Supabase Auth Client:** Used on the front-end for session management, login, logout, refresh tokens, and authenticated reads from Supabase Storage.

### Forms and Validation

* **React Hook Form:** Controls complex forms efficiently, avoiding unnecessary re-renders.
* **Zod:** Validates form data, server payloads, and shared contracts between front-end and back-end.

### Code Quality and Automation

* **BiomeJS:** Analyzes code to find errors and inconsistencies, standardizes code formatting across the monorepo, and enforces good practices with React, TypeScript, and Node.
* **Turborepo:** Organizes the monorepo, sharing packages between front-end, back-end, database, emails, UI, and tests.

### Testing and Reliability

* **Vitest:** Fast test runner for functions, components, schemas, and business rules.
* **Testing Library:** React component tests focused on behavior and accessibility.
* **Route integration tests:** Validate main page flows, navigation, loading states, errors, and data integration.

---

## **Back-end**

### Server Base

* **NestJS:** Main server framework, responsible for modules, controllers, services, authentication, authorization, and integration between services.
* **TypeScript:** Strong typing on the back-end, reducing errors and improving maintainability.
* **Drizzle ORM:** SQL-first ORM for modeling tables, generating migrations, and querying PostgreSQL with strong typing.
* **Zod:** Validation of DTOs, shared contracts, server inputs, webhooks, and internal payloads.

### Database

* **Supabase PostgreSQL:** Main application database, used for application users, tenants, permissions, files, metadata, and product data.
* **Drizzle Migrations:** Version-controlled management of database changes.
* **Separate PostgreSQL for Evolution API:** Dedicated database for Evolution’s internal data, separate from the main application database.

### Authentication and Authorization

* **Supabase Auth:** Responsible for signup, login, sessions, refresh tokens, password reset, magic links, and email confirmation.
* **RLS in Supabase Storage:** Controls reading/downloading of private files by user, tenant, and administrative role.

### Storage

* **Supabase Storage:** Main file storage, located in the São Paulo region.
* **Signed Upload URL:** Used for direct front-end uploads to Storage without passing file bytes through the VPS.
* **RLS for Reading:** Users download private files using JWT and RLS policies.

### Emails

* **Resend:** Email delivery service for staging and production.
* **React Email:** Transactional email templates using React/TSX.
* **Mailpit:** Captures and displays emails locally.
* **Local SMTP:** Used by local Supabase Auth and local NestJS to send emails to Mailpit.
* **Supabase Auth Email Templates:** Specific templates for confirmation, recovery, magic link, and invitation emails.

### Jobs and Workflows

* **Inngest:** Orchestrates jobs, retries, asynchronous workflows, and automations.
* **Inngest Dev Server:** Local environment for testing workflows.
* **Inngest Cloud:** Used in staging and production.

Typical flow:

```text
Evolution webhook

→ NestJS validates and records the event

→ NestJS sends the event to Inngest

→ Inngest executes the workflow

→ Mastra AI / Resend / Evolution / PostgreSQL
```

### AI

* **Mastra AI:** AI orchestration layer for agents, tools, and intelligent flows.
* **DeepSeek V4:** Main language model for AI agents. Two variants are available:

  * **DeepSeek V4-Pro:** 1.6T total parameters, 49B active per token. Used for tasks requiring complex reasoning, assisted legal drafting, and document analysis.
  * **DeepSeek V4-Flash:** 284B total parameters, 13B active per token. Used for fast and cost-efficient tasks such as classification, data extraction, and triage.
* **1M-token context:** Both variants support a 1-million-token context window, ideal for analyzing long legal documents.
* **Operation modes:** Supports Thinking mode, meaning step-by-step reasoning, and Non-Thinking mode, meaning direct response, configurable by agent/task.
* **API compatibility:** Supports OpenAI ChatCompletions and Anthropic API formats, directly integrable with Mastra AI.
* **MIT License:** Open-source weights, with possible future self-hosting if volume justifies it.
* **Controlled tools:** The AI does not access the database, storage, or service role directly; it uses specific tools exposed by the back-end.
* **NestJS AiService:** Intermediate layer between the product and Mastra.

### WhatsApp

* **Evolution API v2:** Main integration with WhatsApp.
* **Redis:** Cache and state for Evolution API.
* **Evolution PostgreSQL:** Dedicated database for sessions, instances, and Evolution’s internal data.
* **Evolution Manager on Coolify:** Administrative interface used in staging/production, protected by Cloudflare Access, Basic Auth, or IP allowlist.
* **No local Evolution Manager:** Locally, only the API runs.

### Back-end Tests

* **Vitest:** Unit tests for services, business rules, schemas, and helpers.
* **Supertest:** HTTP integration tests for the NestJS server.
* **Testcontainers:** Spins up real databases/services in tests when needed.
* **FakeWhatsAppProvider:** Mock of Evolution API in the main automated tests.
* **Route integration tests:** Validate controllers, middlewares, authentication, permissions, contracts, and HTTP responses.

---

## **Infrastructure**

### Monorepo

* **Turborepo:** Organizes the project into apps and shared packages.

Suggested structure:

```text
>>>>>>> origin/develop
apps/

├── web

└── server

packages/

├── email

├── validation

├── core
<<<<<<< HEAD

### 🐳 Ambiente Local

- **Docker Compose único:** Sobe toda a infraestrutura local sem depender de `supabase start`.
- **Supabase local via Docker:** Auth, PostgreSQL, Storage, PostgREST, Kong e Mailpit.
- **templates-server:** Container interno que serve HTML dos templates do Supabase Auth local.
- **NestJS e TanStack Start fora do Docker:** Rodam via `pnpm dev`.

Serviços locais:

=======
```

### Local Environment

* **Single Docker Compose:** Starts the entire local infrastructure without depending on `supabase start`.
* **Local Supabase via Docker:** Auth, PostgreSQL, Storage, PostgREST, Kong, and Mailpit.
* **templates-server:** Internal container that serves the HTML templates for local Supabase Auth.
* **Local Evolution API:** Runs with its own PostgreSQL and Redis.
* **NestJS and TanStack Start outside Docker:** Run via `pnpm dev`.

Local services:

```text
>>>>>>> origin/develop
docker-compose.yml

├── supabase-db

├── supabase-auth / GoTrue

├── supabase-storage

├── supabase-rest

├── supabase-kong

├── mailpit

<<<<<<< HEAD
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
=======
├── templates-server

├── evolution-api

├── evolution-db

└── redis
```

### Staging and Production

* **Managed Supabase in São Paulo:** Auth, PostgreSQL, and Storage.
* **Coolify:** Deploys the server, web app, Evolution API, Evolution Manager, Redis, and Evolution PostgreSQL.
* **Hostinger VPS:** Main server for Coolify.
* **Cloudflare:** DNS, proxy, TLS, basic WAF, and domain protection.
* **Coolify integrated Traefik:** Internal reverse proxy for containers.

### Network Security

Public ports:

```text
22 — SSH, preferably restricted to your IP
>>>>>>> origin/develop

80 — HTTP

443 — HTTPS
<<<<<<< HEAD

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

- **DocuSeal (Self-Hosted)**

### Infra

- **Turborepo**
- **Docker Compose local único**
- **Coolify**
- **Traefik integrado**
- **Hostinger VPS**
- **Cloudflare DNS/Proxy/WAF**
- **Mailpit local**

---

### ✍️ Assinatura Eletrônica

- **DocuSeal (Self-Hosted):** Plataforma open source de assinatura eletrônica de documentos, hospedada na própria VPS. Substitui plataformas pagas como DocuSign, Clicksign e D4Sign com custo zero por documento.
- **API REST:** DocuSeal expõe uma API REST completa para criação de templates, envio de documentos para assinatura, pré-preenchimento de campos e consulta de status. SDKs disponíveis para JavaScript, TypeScript, Python, PHP, Ruby, Java, C# e Go.
- **Webhooks:** Notificações em tempo real quando documentos são assinados, permitindo que o NestJS atualize automaticamente o status do cliente no banco.
- **Embedding:** Componentes embarcáveis (React, HTML) para incorporar o formulário de assinatura diretamente na interface do sistema HMS.
- **Banco de dados:** SQLite interno (dentro do volume /data do container). Sem dependência de banco externo.
- **Armazenamento:** Templates, PDFs preenchidos, PDFs assinados e certificados de auditoria ficam no volume /data do DocuSeal. Após assinatura, o NestJS copia o PDF assinado para o Supabase Storage (pasta do cliente) via webhook.
- **Trilha de auditoria:** Gerada automaticamente com e-mail do signatário, IP, timestamps e hash do documento. Embutida como última página do PDF assinado e armazenada no banco.
- **Validade jurídica:** Assinatura eletrônica simples com validade jurídica no Brasil conforme MP 2.200-2/2001, Lei 14.063/2020 e artigos 104/107 do Código Civil. Cobre procuração, contrato de honorários, declaração de pobreza e ficha de atendimento. Não substitui assinatura ICP-Brasil (certificado digital do advogado) para petições e atos judiciais.
- **SMTP:** Reutiliza o Resend já configurado na stack para envio dos links de assinatura por e-mail.
- **Deploy:** Container Docker no Coolify, atrás do Traefik, com subdomínio dedicado (ex: assinatura.seudominio.com.br).
- **Backup:** Volume /data (SQLite + PDFs) incluso na rotina de backup existente da VPS. Backup e restauração devem ser testados periodicamente.

### Fluxo de Integração DocuSeal ↔ Sistema HMS

1. Advogado decide formalizar contratação no sistema HMS
2. NestJS chama API do DocuSeal: cria submission com template_id + dados do cliente (pré-preenchidos, readonly)
3. DocuSeal gera PDF preenchido e envia link de assinatura por e-mail (Resend) ou o sistema envia via Meta Cloud API
4. Cliente abre o link no celular, assina com dedo/digitação
5. DocuSeal embute assinatura no PDF, gera certificado de auditoria
6. DocuSeal dispara webhook para o NestJS
7. NestJS recebe o evento, baixa o PDF assinado via API do DocuSeal
8. NestJS salva cópia no Supabase Storage (pasta do cliente)
9. NestJS atualiza status do cliente no banco para "contratado"

### Escopo da Assinatura Eletrônica

| Documento | Quem assina | Método | Solução |
| --- | --- | --- | --- |
| Procuração | Cliente | Assinatura eletrônica simples | DocuSeal |
| Contrato de honorários | Cliente | Assinatura eletrônica simples | DocuSeal |
| Declaração de pobreza | Cliente | Assinatura eletrônica simples | DocuSeal |
| Ficha de atendimento | Cliente | Assinatura eletrônica simples | DocuSeal |
| Petições e peças processuais | Advogado | Certificado ICP-Brasil (A1/A3) | Sistema do tribunal (PJe, e-SAJ) |

### Domínio sugerido

`assinatura.seudominio.com.br` → DocuSeal (via Traefik no Coolify)

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
| DocuSeal (SQLite + PDFs assinados) | Volume /data do container | tar.gz do volume completo |
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

O Supabase gerenciado (banco principal da aplicação) é a cópia primária da regra 3-2-1, com backups automáticos diários feitos pelo próprio Supabase. O script de backup adiciona as cópias offsite (Google Drive e Dropbox) para o DocuSeal e as configurações. Para autonomia total, é recomendado manter também um pg_dump periódico do Supabase como cópia adicional nos storages remotos, especialmente para cenários de migração ou desastre.
=======
```

Ports that should not be public:

```text
5432 — PostgreSQL

6379 — Redis

8080 — Direct Evolution access

3000 — Direct front-end access

3001 — Direct server access

8000 — Direct Coolify access after configuring a domain
```

### Domains

Suggestion:

```text
app.yourdomain.com

→ TanStack Start

api.yourdomain.com

→ NestJS server

evolution-api.yourdomain.com

→ Protected Evolution API

evolution-manager.yourdomain.com

→ Protected Evolution Manager
```

### Tests and CI

* **Local/test Docker Compose:** Base for running Supabase Auth, Storage, DB, Mailpit, Redis, and Evolution API when needed.
* **Vitest:** Unit and integration tests.
* **Supertest:** HTTP server tests.
* **Testing Library:** Front-end component and route tests.
* **Mailpit:** Allows testing email confirmation, magic links, and password reset.
* **Fake providers:** Used for WhatsApp and external services in the main tests.

---

## **Final Stack Summary**

### Front-end

* **TanStack Start**
* **TanStack Router**
* **TanStack Query**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui**
* **React Hook Form**
* **Zod**
* **Vitest**
* **Testing Library**

### Back-end

* **NestJS**
* **Drizzle ORM**
* **Zod**
* **Supabase Auth**
* **Supabase PostgreSQL**
* **Supabase Storage**
* **Inngest**
* **Resend**
* **React Email**
* **Mastra AI**
* **DeepSeek V4 — Pro + Flash**
* **Vitest**
* **Supertest**
* **Testcontainers**

### WhatsApp

* **Evolution API v2**
* **Dedicated PostgreSQL**
* **Redis**
* **Evolution Manager on Coolify**

### Electronic Signature

* **DocuSeal — Self-Hosted**

### Infra

* **Turborepo**
* **Single local Docker Compose**
* **Coolify**
* **Integrated Traefik**
* **Hostinger VPS**
* **Cloudflare DNS/Proxy/WAF**
* **Local Mailpit**

---

## ✍️ Electronic Signature

* **DocuSeal — Self-Hosted:** Open-source electronic document signature platform, hosted on the VPS itself. Replaces paid platforms like DocuSign, Clicksign, and D4Sign with zero cost per document.
* **REST API:** DocuSeal exposes a complete REST API for creating templates, sending documents for signature, pre-filling fields, and checking status. SDKs are available for JavaScript, TypeScript, Python, PHP, Ruby, Java, C#, and Go.
* **Webhooks:** Real-time notifications when documents are signed, allowing NestJS to automatically update the client status in the database.
* **Embedding:** Embeddable components, React and HTML, to include the signature form directly inside the HMS system interface.
* **Database:** Internal SQLite database inside the container’s `/data` volume. No external database dependency. Migration to Evolution PostgreSQL is possible in the future if needed.
* **Storage:** Templates, filled PDFs, signed PDFs, and audit certificates remain in DocuSeal’s `/data` volume. After signing, NestJS copies the signed PDF to Supabase Storage, inside the client folder, via webhook.
* **Audit trail:** Automatically generated with signer email, IP, timestamps, and document hash. Embedded as the final page of the signed PDF and stored in the database.
* **Legal validity:** Simple electronic signature with legal validity in Brazil under MP 2.200-2/2001, Law 14.063/2020, and articles 104/107 of the Civil Code. Covers power of attorney, legal fee agreement, poverty declaration, and intake form. Does not replace ICP-Brasil signature, meaning the lawyer’s digital certificate, for petitions and judicial acts.
* **SMTP:** Reuses Resend already configured in the stack to send signature links by email.
* **Deploy:** Docker container on Coolify, behind Traefik, with a dedicated subdomain, for example `signature.yourdomain.com.br`.
* **Backup:** `/data` volume, including SQLite and PDFs, included in the existing VPS backup routine. Backup and restoration should be tested periodically.

### DocuSeal ↔ HMS System Integration Flow

1. The lawyer decides to formalize the engagement in the HMS system.
2. NestJS calls the DocuSeal API and creates a submission with `template_id` plus pre-filled, read-only client data.
3. DocuSeal generates the filled PDF and sends the signature link by email through Resend, or the system sends it via WhatsApp through Evolution API.
4. The client opens the link on their phone and signs with a finger or typed signature.
5. DocuSeal embeds the signature in the PDF and generates an audit certificate.
6. DocuSeal triggers a webhook to NestJS.
7. NestJS receives the event and downloads the signed PDF through the DocuSeal API.
8. NestJS saves a copy in Supabase Storage, inside the client folder.
9. NestJS updates the client status in the database to `"hired"`.

### Electronic Signature Scope

| Document                           | Who signs | Method                        | Solution                |
| ---------------------------------- | --------- | ----------------------------- | ----------------------- |
| Power of attorney                  | Client    | Simple electronic signature   | DocuSeal                |
| Legal fee agreement                | Client    | Simple electronic signature   | DocuSeal                |
| Poverty declaration                | Client    | Simple electronic signature   | DocuSeal                |
| Intake form                        | Client    | Simple electronic signature   | DocuSeal                |
| Petitions and procedural documents | Lawyer    | ICP-Brasil certificate, A1/A3 | Court system, PJe/e-SAJ |

### Suggested Domain

```text
signature.yourdomain.com.br → DocuSeal via Traefik on Coolify
```

---

## 💾 Backup Strategy — 3-2-1 Rule

The backup strategy follows the 3-2-1 rule: 3 copies of the data, on 2 different types of media, with at least 1 offsite copy.

### Copies

| Copy          | Location         | Type          | Purpose                                |
| ------------- | ---------------- | ------------- | -------------------------------------- |
| 1 — Primary   | Supabase managed | Managed cloud | Supabase native automatic daily backup |
| 2 — Offsite A | Google Drive     | Cloud storage | Automatic daily backup                 |
| 3 — Offsite B | Dropbox          | Cloud storage | Automatic daily backup, redundancy     |

### What is included in the backup

| Data                               | Source                   | Backup format                 |
| ---------------------------------- | ------------------------ | ----------------------------- |
| Supabase PostgreSQL, main database | Managed Supabase         | Compressed pg_dump, `.sql.gz` |
| Evolution API PostgreSQL           | Container on the VPS     | Compressed pg_dump, `.sql.gz` |
| DocuSeal, SQLite + signed PDFs     | Container `/data` volume | Full volume `tar.gz`          |
| Redis, Evolution API               | Container on the VPS     | RDB snapshot, `dump.rdb`      |
| Environment variables and configs  | Coolify / `.env` files   | Encrypted copy                |

### Recommended Tool: rclone

rclone is the default tool for synchronization with cloud storage providers. It supports Google Drive and Dropbox natively, with encryption in transit and at rest.

Configuration:

```bash
rclone config
# Configure remote "gdrive" → Google Drive
# Configure remote "dropbox" → Dropbox
```

### Retention Policy

| Location         | Retention                      |
| ---------------- | ------------------------------ |
| Supabase managed | Automatic, managed by Supabase |
| Google Drive     | 90 days                        |
| Dropbox          | 90 days                        |

### Monitoring and Alerts

* The script should send success/failure notifications through a webhook to NestJS or directly through Resend/WhatsApp via Evolution API.
* Quarterly restoration test: start an isolated environment, restore the backup, and validate data integrity.

### Note on Managed Supabase

Managed Supabase, the main application database, is the primary copy in the 3-2-1 rule, with automatic daily backups handled by Supabase itself. The backup script adds offsite copies, Google Drive and Dropbox, for the other VPS services: Evolution, DocuSeal, Redis, and configs.

For full autonomy, it is also recommended to keep a periodic `pg_dump` of Supabase as an additional copy in the remote storage providers, especially for migration or disaster-recovery scenarios.
>>>>>>> origin/develop
