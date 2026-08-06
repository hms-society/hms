---
title: Amendment — fidelidade visual e ações da tabela
status: accepted
revision: 1
sources:
  - type: design
    ref: design/hms.pen#K2Fvp
    role: visual_reference
  - type: direct-request
    ref: codex-task
    role: delivery_scope
scope:
  - apps/web/src/ui/document-production/widgets/pages/document-specifications-page
  - documentation/features/document-production/document-specifications-page/spec.md
last_updated_at: 2026-08-05
---

# Motivo

A Spec original citava o frame `K2Fvp` como referência visual, mas excluía
explicitamente a coluna **Ação** e seus controles. Essa exceção permitiu que a
implementação divergisse do design aprovado.

# Alterações normativas

- O frame `K2Fvp` é a referência visual canônica da página, não apenas uma
  inspiração.
- A implementação deve preservar a hierarquia, densidade, proporções,
  espaçamentos, agrupamento em duas linhas da coluna **Aplicação** e estados
  visuais observados no Node.
- A tabela deve renderizar a coluna **Ação** com os controles **Editar** e
  **Duplicar**, mantendo nomes acessíveis por linha.
- Qualquer divergência entre o design e o contrato funcional deve ser registrada
  na Spec antes da implementação; não deve ser resolvida silenciosamente pelo
  Builder.

# Evidência exigida

- inspeção estrutural do Node `K2Fvp` via Pencil;
- comparação visual no navegador em desktop e viewport estreito;
- testes do widget para colunas, ações e nomes acessíveis;
- registro explícito de qualquer fluxo de edição ou duplicação ainda não
  conectado.
