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
