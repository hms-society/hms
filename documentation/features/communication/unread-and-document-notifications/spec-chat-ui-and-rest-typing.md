---
title: Especificação Técnica - Aprimoramentos da UI de Chat e Alinhamento de Tipos REST
status: open
revision: 1
source:
  type: code_review_remediation
scope:
  - apps/web/src/ui/identity/widgets/pages/lawyer-page
  - apps/web/src/rest/services
last_updated_at: 2026-09-14
---

# Contexto e Objetivo

## Contexto
Durante o Code Review do PR #147, os seguintes pontos da interface do usuário e do serviço REST foram sinalizados:
1. O componente de comunicação enviava `templateName: 'inicio_atendimento_ola'` fixo via código, ignorando a capacidade de fallback da variável de ambiente no servidor.
2. O painel de conversas `ChatViewPanel` possuía um efeito de rolagem de tela que rodava apenas na montagem inicial (`[]`), fazendo com que trocas de conversa ativa e novas mensagens não rolassem o chat automaticamente para o fim.
3. A identificação de mensagens contendo documentos recebia tratamento por busca ingênua de string prefixada (`msg.content.startsWith('[Documento Recebido]')`), permitindo que um usuário comum forjasse mensagens de documento no chat enviando texto simples.
4. O tipo exposto pelo SDK cliente de comunicação em `communication-service.ts` aceitava `audio` (`type?: 'text' | 'template' | 'audio'`), enquanto a API do servidor não dá suporte a este tipo de payload no DTO de envio.

## Objetivo
1. Omitir o `templateName` no disparo do frontend, permitindo resolução automática no backend via env.
2. Atualizar o `useEffect` de auto-scroll do `ChatViewPanel` para reagir ao cliente selecionado e ao volume de mensagens.
3. Utilizar metadados ou propriedades estruturadas de mensagem para identificação de documentos no chat.
4. Alinhar a tipagem do SDK `communication-service.ts` aos DTOs do backend.

---

# Escopo

## Incluído
- **`apps/web/src/ui/identity/widgets/pages/lawyer-page/communication.tsx`**:
  - Remover a propriedade engessada `templateName: 'inicio_atendimento_ola'` da invocação de abertura de janela.
- **`apps/web/src/ui/identity/widgets/pages/lawyer-page/chat-view-panel.tsx`**:
  - Atualizar a lista de dependências do `useEffect` de rolagem de tela incluindo `activeChat.id` e `activeChat.messages.length`.
  - Substituir a verificação de prefixo de string por checagem baseada em tipo/metadados da mensagem.
- **`apps/web/src/rest/services/communication-service.ts`**:
  - Ajustar o tipo `type` para `'text' | 'template'`, removendo a opção não suportada `'audio'`.

---

# Requisitos Funcionais e Critérios de Aceitação

## Requisitos Funcionais

### RF-01 — Disparo Limpo de Template no Frontend
A função `handleStartWindowTemplate` no `communication.tsx` deve enviar apenas `channel: 'whatsapp'` e `type: 'template'`, omitindo `templateName` para garantir que o ambiente do servidor defina a versão ativa.

### RF-02 — Rolagem Automática em Atualizações do Chat
O painel de chat (`ChatViewPanel`) deve rolar a conversa até a mensagem mais recente sempre que:
- O advogado selecionar um novo cliente na lista lateral.
- Uma nova mensagem for enviada ou recebida na conversa ativa.

### RF-03 — Renderização Estruturada de Documentos
O chat deve renderizar o card especial de documento apenas quando a mensagem possuir a propriedade/metadado indicativo de documento recebido, evitando falsos positivos por entradas de texto simples do usuário.

### RF-04 — Alinhamento de Contrato no Serviço REST Web
O tipo `type` na interface `SendCommunicationParams` em `communication-service.ts` deve corresponder exatamente aos valores aceitos pelo DTO `SendCommunicationDto` do servidor (`'text' | 'template'`).

---

## Critérios de Aceitação

| CA | RF | Dado | Quando | Então |
|---|---|---|---|---|
| CA-01 | RF-01 | O advogado clica em "Iniciar janela de conversa" | A requisição de envio é disparada | O payload não inclui `templateName` fixo, delegando ao backend |
| CA-02 | RF-02 | O advogado seleciona outro cliente ou entra uma mensagem nova | O estado `activeChat` atualiza | A viewport do chat rola suavemente até o final da conversa |
| CA-03 | RF-03 | Um cliente envia uma mensagem de texto simples contendo "[Documento Recebido]" | A mensagem é exibida no chat | É renderizada como mensagem de texto comum, e não como um card de arquivo recebido |
| CA-04 | RF-04 | Chamadas ao serviço REST de comunicação são compiladas | O projeto passa pelo `check-types` | Tipos TypeScript correspondem exatamente aos DTOs da API REST do backend |
