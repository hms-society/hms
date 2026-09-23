# Contexto da Feature: Meta Embedded Signup para Cadastro de Números WABA

## Visão Geral
Esta funcionalidade visa permitir que Administradores da plataforma HMS realizem a integração direta de novas contas e números do WhatsApp Business API (WABA) para advogados e setores do escritório por meio do fluxo oficial da Meta (**Meta Embedded Signup**).

## Fonte e Especificação Técnica
A especificação canônica completa para o desenho e implementação desta funcionalidade foi construída seguindo a metodologia **Spec-Driven Development (SDD)** da HMS e encontra-se descrita em:

- [`spec.md`](spec.md) — Contratos do Produto, Requisitos Funcionais (`RF-*`), Critérios de Aceitação (`CA-*`), Arquitetura por Camadas (`packages/core`, `apps/server`, `apps/web`) e Plano de Validação.

## Pontos Principais da Arquitetura
1. **Frontend (`apps/web`)**: Carregamento do Facebook JS SDK na página de configurações `/configuracoes/comunicacao`, permitindo o disparo da popup de onboarding da Meta e captura do código de autorização (`code`), `waba_id` e `phone_number_id`.
2. **Servidor (`apps/server`)**: Endpoint `POST /api/v1/communication/waba/embedded-signup/exchange` protegido pelo guard de autorização do perfil `Administrador`.
3. **Integração Meta Graph API**: Troca do `code` por token de acesso (System User Token) via Meta Graph API v25.0, consulta de metadados do número e salvamento nas tabelas `waba_accounts` e `whatsapp_channels`.
4. **Vínculo com Colaboradores**: Possibilidade de associar cada canal de WhatsApp WABA cadastrado a um advogado/atendente específico ou mantê-lo como canal geral do escritório.
