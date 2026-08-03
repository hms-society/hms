---
title: Plan de implementação — gestão e cadastro de colaboradores
spec: ../spec.md
evaluation: ../evaluation.md
spec_revision: 6
status: completed
prd: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2228232
jira_tickets:
  - SCRUM-132
---

# Objetivo

Implementar a gestão administrativa de colaboradores de ponta a ponta, permitindo
que um administrador ativo consulte a equipe e conclua um cadastro com convite,
perfil e especialidades jurídicas válidas, mantendo autorização server-side,
 retomada segura do efeito externo, consistência transacional local e a experiência
aprovada nos frames `vuNXP`, `xtvMv` e `R1af6`.

Este Plan é o ledger operacional da revisão 2 da Spec. Somente o Orchestrator o
atualiza. Builders registram evidências no handoff; Judges trabalham read-only e o
Orchestrator incorpora seus vereditos.

# Escopo

## Incluído

- contratos, entidades, erros, interfaces, use cases e testes de Identity;
- porta de integração do Catálogo Jurídico e resolução histórica em lote;
- schemas compartilhados de listagem e cadastro;
- modelos Drizzle, migration gerada, repositórios, mappers, seed e fixtures;
- separação entre autenticação comum e administração server-only do Supabase Auth;
- tentativa persistida e retomável para convite + commit local;
- autorização de administrador ativo, colaborador atual e conclusão do primeiro sign-in;
- controllers, DTOs Swagger, exemplos REST e integrações HTTP reais;
- adapters, hooks, middleware/loader, rota, navegação, página, tabela e modal no web app;
- estados de carregamento, vazio, erro, validação, envio e sucesso;
- avatar de colaborador com iniciais e cor estável na tabela;
- hook de orquestração da página e estado de filtros/paginação com `nuqs`;
- menu `…` com disponibilidade condicional, reenvio de convite pendente e
  inativação idempotente com dialogs de confirmação;
- change de edição de nome profissional, cargo, perfil e especialidades, com
  e-mail imutável;
- change de ciclo de acesso, detalhes, cancelamento de convite e remoção segura;
- validação automatizada, REST, Auth local quando disponível, navegador, acessibilidade,
  comparação visual, Quality Gate e build.

## Fora de escopo

- detalhar, reativar ou excluir colaboradores;
- cancelar convites;
- criar ou editar áreas e temas jurídicos;
- publicar ações de linha sem Contract;
- criar uma jornada visual própria para recuperação de senha; convites usam a
  mudança dedicada `changes/collaborator-invitation-page/`;
- atualizar o status de `SCRUM-132`;
- alterar o PRD canônico ou tratar este Plan como fonte de verdade de produto;
- alterar `design/hms.pen`; os frames são referência read-only nesta entrega e as
  divergências de copy são resolvidas pela Spec.

# Estado inicial

- **Plan:** `in_progress`.
- **Spec:** `open`, revisão 1, aceita pelo Judge Spec na rodada 3.
- **Bloqueadores funcionais:** nenhum; a Spec declara todas as decisões materiais
  resolvidas.
- **Worktree:** já contém mudanças do usuário, inclusive em `design/hms.pen` e na
  documentação da feature; a implementação deve preservar alterações não relacionadas.
- **Próxima ação:** executar F1 e estabilizar os contratos compartilhados antes das
  implementações de infraestrutura e UI.

# Dependências entre fases

| Fase | Objetivo | Estado | Depende de | Parallelizable | Motivo |
|---|---|---|---|---|---|
| F1 | Estabilizar domínio, contratos e validação compartilhada | `accepted` | — | `no` | É o gate de tipos e invariantes consumido pelas demais fases. |
| F2 | Implementar persistência, migration e providers server-side | `accepted` | F1 | `yes` com F3 | Adapters podem implementar contratos enquanto os use cases são testados com mocks. |
| F3 | Implementar autorização, listagem, saga e conclusão de sign-in | `accepted` | F1 | `yes` com F2 | Use cases são infrastructure-free e dependem apenas dos contratos de F1. |
| F4 | Expor e validar REST e composição de módulos | `accepted` | F2, F3 | `no` | Requer use cases e adapters concretos aceitos. |
| F5 | Integrar REST, autenticação e hooks semânticos no web app | `accepted` | F4 | `no` | Consolida o contrato HTTP real antes da composição visual. |
| F6 | Entregar rota, navegação, página e modal | `accepted` | F5 | `yes` internamente | Listagem e modal podem avançar em paralelo após os hooks estáveis. |
| F7 | Executar validação integrada, Quality Gate, build e julgamento final | `in_progress` | F4, F6 | `yes` parcialmente | Sensores focados podem rodar em paralelo; gates finais aguardam todos. |

# Rastreabilidade de execução

| Requisito | Critérios de aceite | Tarefas principais |
|---|---|---|
| RF-01 | CA-01, CA-02 | T1.2, T3.1, T4.1, T4.2 |
| RF-02 | CA-03, CA-04, CA-05 | T1.1, T2.2, T3.2, T4.1, T5.1, T5.3, T6.1, T6.2 |
| RF-03 | CA-06, CA-07, CA-08, CA-21, CA-22, CA-24, CA-25, CA-26 | T1.2, T2.1, T2.2, T2.3, T3.3, T3.4, T4.1, T4.2, T5.1, T5.2, T6.3 |
| RF-04 | CA-09, CA-10, CA-11 | T1.1, T1.4, T2.4, T3.3, T4.2, T5.3, T6.3, T6.4 |
| RF-05 | CA-12, CA-13 | T1.1, T1.4, T3.3, T4.2, T6.3, T6.4 |
| RF-06 | CA-14 | T1.1, T1.2, T2.2, T2.4, T3.2, T4.2 |
| RF-07 | CA-15, CA-16, CA-17 | T1.4, T5.3, T6.1, T6.2, T6.3, T6.4 |
| RF-08 | CA-18, CA-19, CA-20, CA-23 | T3.1, T4.1, T4.2, T5.2, T6.1, T6.5, T7.3 |

# F1 — Domínio, contratos e validação compartilhada

- **Estado da fase:** `accepted`.
- **Dependências:** nenhuma.
- **Sensor de entrada:** revisão 1 da Spec e exports atuais de `@hms/core` e
  `@hms/validation` confirmados.
- **Evidência de saída esperada:** tipos públicos compilam, schemas focados passam e
  todos os consumidores possuem contratos suficientes para avançar sem duplicar shapes.
- **Gate:** mover para `awaiting_judgment` somente após os sensores focados; aceitar
  apenas com veredito do Judge Implementation.

## T1.1 — Evoluir entidades e projeções de colaboradores

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/domain/entities/**`,
  `packages/core/src/identity/domain/structures/**` e respectivos barrels/fakers.
- **RF/CA:** RF-02, RF-03, RF-04, RF-05, RF-06; CA-03, CA-06, CA-09, CA-12, CA-14.
- **Depende de:** —.
- **Parallelizable:** `yes` com T1.2 após acordo sobre os nomes dos tipos; os arquivos
  são distintos, mas os exports devem ser integrados uma única vez.
- **Resultado observável:** `Collaborator` usa nome profissional e cargo opcional,
  mantém exatamente um perfil, diferencia especialidades administrativas/jurídicas e
  possui contratos separados de criação, resumo paginado e projeção histórica com
  `active` para área/temas.
- **Sensores/evidências:** `pnpm --filter @hms/core lint` e
  `pnpm --filter @hms/core check-types`; revisão de um `export type` por arquivo e de
  estruturas sem identidade local indevida.

## T1.2 — Definir interfaces de repositório, transação, catálogo, Auth e REST

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/interfaces/**`,
  `packages/core/src/legal-catalog/interfaces/**`, barrels e exports públicos de
  `packages/core/package.json` somente se um novo subpath for realmente necessário.
- **RF/CA:** RF-01, RF-02, RF-03, RF-06; CA-01, CA-02, CA-04, CA-06, CA-07, CA-08,
  CA-14, CA-21, CA-22, CA-24, CA-25, CA-26.
- **Depende de:** T1.1 para shapes de leitura/criação.
- **Parallelizable:** `no`; é o contrato de integração consumido por F2, F3, F4 e F5.
- **Resultado observável:** existem contratos explícitos para colaboradores, usuários,
  tentativas de cadastro, transação atômica local, catálogo de especialidades,
  administração Auth server-only e operações REST `listCollaborators`,
  `getCurrentCollaborator`, `registerCollaborator` e `completeSignIn`; `AuthProvider`
  comum não recebe poderes de service role.
- **Sensores/evidências:** typecheck de Core; revisão de que contratos ficam em
  `interfaces`, não expõem Drizzle/Supabase e oferecem paginação, normalização,
  retomada e atualização de acesso exigidas pela Spec.

## T1.3 — Criar erros, estados e dados de teste do fluxo

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/domain/errors/**`,
  `packages/core/src/identity/domain/entities/fakers/**`,
  `packages/core/src/identity/domain/structures/fakers/**` e barrels relacionados.
- **RF/CA:** RF-01, RF-03, RF-04, RF-05; CA-02, CA-07, CA-08, CA-10, CA-12,
  CA-21, CA-22, CA-25, CA-26.
- **Depende de:** T1.1, T1.2.
- **Parallelizable:** `yes` com T1.4; não toca schemas de validação.
- **Resultado observável:** conflitos de e-mail/vínculo/payload, autorização, catálogo
  inválido, estado desabilitado e reconciliação possuem erros de domínio estáveis;
  tentativas usam os estados mínimos da Spec e fakers produzem agregados válidos com
  overrides focados.
- **Sensores/evidências:** Core lint/typecheck e uso dos erros nos testes de F3 sem
  objetos ad hoc ou dependências de infraestrutura.

## T1.4 — Criar schemas compartilhados e testes focados

- **Estado:** `verified`.
- **Paths:** `packages/validation/src/identity/schemas/**`,
  `packages/validation/src/identity/index.ts` e testes colocados em
  `packages/validation/src/identity/schemas/tests/**`.
- **RF/CA:** RF-02, RF-03, RF-04, RF-05, RF-07; CA-04, CA-06, CA-10, CA-12, CA-15.
- **Depende de:** T1.1, T1.2.
- **Parallelizable:** `yes` com T1.3.
- **Resultado observável:** query aplica defaults/limites e enums do Contract; cadastro
  normaliza e-mail/textos, exige exatamente um perfil, valida grupos jurídicos únicos e
  completos e rejeita especialidades administrativas ou campos extras.
- **Sensores/evidências:** `pnpm --filter @hms/validation lint`,
  `pnpm --filter @hms/validation check-types` e
  `pnpm --filter @hms/validation test` com casos válidos, limites e combinações
  inválidas de CA-10/CA-12.

# F2 — Persistência, migration e providers server-side

- **Estado da fase:** `accepted`.
- **Dependências:** F1 aceita.
- **Sensor de entrada:** contratos de repositório/provider congelados pelo gate de F1.
- **Evidência de saída esperada:** migration gerada/aplicável, repositórios transacionais,
  providers sem dependência circular e seed/fixtures de administrador disponíveis.
- **Gate:** migration e adapters revisados por Judge Implementation antes de F4.

## T2.1 — Modelar e gerar a migration de Identity

- **Estado:** `verified`.
- **Paths:** `apps/server/drizzle.config.ts`,
  `apps/server/src/shared/database/fixtures/database-fixture.ts`,
  `apps/server/src/identity/database/drizzle/models/**`,
  `apps/server/src/identity/database/drizzle/types/**`,
  `apps/server/src/identity/database/drizzle/mappers/**`,
  `apps/server/src/shared/database/drizzle/schema.ts` e
  `apps/server/src/shared/database/drizzle/migrations/**`.
- **RF/CA:** RF-03, RF-04, RF-05, RF-06; CA-06, CA-07, CA-08, CA-09, CA-10,
  CA-12, CA-14, CA-21, CA-22.
- **Depende de:** T1.1, T1.2, T1.3.
- **Parallelizable:** `no`; fixa schema e constraints usados pelos repositórios.
- **Resultado observável:** `users` recebe `last_access_at` e unicidade funcional de
  `lower(btrim(email))`; tabelas de colaboradores, grupos/temas e tentativas possuem
  chaves/índices/uniqueness do Contract; IDs de Catálogo não têm FK física; a migration
  não inventa perfis para usuários existentes.
- **Sensores/evidências:** migration produzida por
  `pnpm --filter server db:migration:generate`, diff de SQL e snapshots revisado,
  aplicação limpa via fixture/Testcontainers e inspeção de constraints/índices.

## T2.2 — Implementar repositórios e atomicidade local

- **Estado:** `verified`.
- **Paths:** `apps/server/src/identity/database/drizzle/repositories/**`,
  `apps/server/src/identity/database/identity-database.module.ts`,
  `apps/server/src/identity/constants/identity-repositories.ts` e suporte transacional
  module-owned estritamente necessário.
- **RF/CA:** RF-01, RF-02, RF-03, RF-06; CA-01, CA-04, CA-06, CA-07, CA-08,
  CA-14, CA-21, CA-24, CA-25.
- **Depende de:** T2.1.
- **Parallelizable:** `yes` com T2.3 e T2.4 após a migration estabilizar; os adapters
  usam fronteiras distintas.
- **Resultado observável:** repositórios resolvem usuário/colaborador, listam com
  filtros/ordenação/paginação no banco, retornam cargos disponíveis, persistem o agregado
  e a tentativa de forma idempotente, leem referências históricas em lote e oferecem a
  transação única necessária ao commit final e ao `lastAccessAt`.
- **Sensores/evidências:** server lint/typecheck; integração real em F4 prova total,
  página além do total, ordenação estável, corrida de unicidade e rollback sem registros
  parciais.

## T2.3 — Separar Auth comum de administração Auth server-only

- **Estado:** `verified`.
- **Paths:** `apps/server/src/identity/providers/**`,
  `apps/server/src/identity/guards/**`, `apps/server/src/identity/constants/**`, novo
  módulo de composição Auth sob `apps/server/src/identity/**` e env wiring existente.
- **RF/CA:** RF-01, RF-03; CA-01, CA-02, CA-06, CA-08, CA-21, CA-22, CA-24,
  CA-25, CA-26.
- **Depende de:** T1.2, T1.3.
- **Parallelizable:** `yes` com T2.2 e T2.4.
- **Resultado observável:** o provider comum verifica sessões sem expor operações
  administrativas; `AuthAdministrationProvider` convida, localiza por e-mail, grava/lê
  `app_metadata` confiável e revoga sessão; nenhum secret ou service role chega ao web;
  a composição Auth pode ser importada por Identity e Catálogo sem ciclo.
- **Sensores/evidências:** server lint/typecheck, testes de adapter para mapeamentos e
  falhas controláveis, inspeção de imports e ausência de `user_metadata` como prova.

## T2.4 — Publicar a porta do Catálogo Jurídico

- **Estado:** `verified`.
- **Paths:** `apps/server/src/legal-catalog/database/drizzle/repositories/**`,
  `apps/server/src/legal-catalog/database/legal-catalog-database.module.ts`,
  `apps/server/src/legal-catalog/legal-catalog.module.ts` e provider/token module-owned.
- **RF/CA:** RF-04, RF-06; CA-09, CA-10, CA-14.
- **Depende de:** T1.2 e contratos atuais do Catálogo Jurídico.
- **Parallelizable:** `yes` com T2.2 e T2.3.
- **Resultado observável:** Catálogo valida em lote áreas/temas ativos e pertencimento
  para novos cadastros, resolve em lote IDs ativos/inativos com nome/estado e exporta
  apenas a porta consumida por Identity, sem Identity importar tabelas ou repositórios do
  Catálogo.
- **Sensores/evidências:** server lint/typecheck, testes de integração em F4 com itens
  ativos/inativos e inspeção de dependências entre módulos.

## T2.5 — Atualizar seed e fixtures administrativas de desenvolvimento

- **Estado:** `verified`.
- **Paths:** `apps/server/src/identity/database/identity-seeder.ts`,
  `apps/server/src/identity/fixtures/identity-module-fixture.ts`,
  `apps/server/src/shared/database/seed.ts` quando necessário para o novo token,
  fixtures do Catálogo estritamente necessárias e
  documentação de implantação externa, quando necessária.
- **RF/CA:** RF-01, RF-03; CA-01, CA-02, CA-06, CA-23, CA-24.
- **Depende de:** T2.1, T2.2, T2.3.
- **Parallelizable:** `no`; consome o wiring final de persistência e Auth.
- **Resultado observável:** desenvolvimento/testes criam usuário + colaborador admin
  vinculados sem misturar dados dos módulos; qualquer provisionamento de produção fica
  fora deste repositório e segue o processo operacional aprovado pela infraestrutura.
- **Sensores/evidências:** `db:seed` em modo dev/stg e fixture reutilizável nos testes
  REST; não há runbook operacional ou credencial de produção neste repositório.

# F3 — Use cases de Identity

- **Estado da fase:** `accepted`.
- **Dependências:** F1 aceita.
- **Sensor de entrada:** interfaces, erros e estruturas aceitos.
- **Evidência de saída esperada:** testes unitários infrastructure-free cobrem todas as
  invariantes, interações, retries, concorrência e tempo determinístico.
- **Gate:** cada use case possui teste próprio e o Judge não encontra decisão de negócio
  fora de `execute`.

## T3.1 — Resolver colaborador atual e autorização administrativa

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/use-cases/get-current-collaborator-use-case.ts`,
  use case/autorizador administrativo necessário, barrels e testes correspondentes.
- **RF/CA:** RF-01, RF-08; CA-01, CA-02, CA-18, CA-23.
- **Depende de:** T1.2, T1.3.
- **Parallelizable:** `yes` com T3.2, T3.3 e T3.4; usa testes e arquivos próprios.
- **Resultado observável:** identidade externa resolve somente conta local ativa e
  colaborador vinculado; operações administrativas aceitam apenas `admin`; ausência,
  convite, desabilitação e demais perfis falham sem projetar dados da equipe.
- **Sensores/evidências:** teste próprio com `vitest-mock-extended` cobre todos os
  estados de CA-02/CA-23 e as chamadas mínimas aos repositórios.

## T3.2 — Listar colaboradores com consulta reproduzível

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/use-cases/list-collaborators-use-case.ts`,
  barrel e teste correspondente.
- **RF/CA:** RF-01, RF-02, RF-06; CA-01, CA-03, CA-04, CA-05, CA-14.
- **Depende de:** T1.1, T1.2, T1.3 e T3.1 para a política administrativa.
- **Parallelizable:** `yes` com T3.3 e T3.4 após a política de T3.1 estabilizar.
- **Resultado observável:** o use case autoriza, normaliza busca/cargo, aplica defaults e
  limites, delega filtros combinados, preserva página solicitada, total real, ordenação e
  cargos disponíveis e projeta especialidades históricas sem N+1.
- **Sensores/evidências:** teste unitário cobre matriz de filtros, `AND`/`OR`, página
  vazia válida, desempate por `collaboratorId` e projeções administrativa/jurídica.

## T3.3 — Registrar colaborador com saga retomável

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/use-cases/register-collaborator-use-case.ts`,
  helpers privados no mesmo arquivo quando necessários, barrel e teste correspondente.
- **RF/CA:** RF-01, RF-03, RF-04, RF-05; CA-01, CA-06, CA-07, CA-08, CA-09,
  CA-10, CA-12, CA-21, CA-22, CA-26.
- **Depende de:** T1.1, T1.2, T1.3.
- **Parallelizable:** `yes` com T3.1, T3.2 e T3.4.
- **Resultado observável:** o use case autoriza e valida antes do efeito externo, cria ou
  retoma tentativa por e-mail/hash, convida uma vez, confia somente em marcador
  `app_metadata` + ID coerente, persiste agregado uma vez, responde apenas após
  `completed` e encaminha identidades ambíguas a `reconciliation_required` sem adotá-las
  ou removê-las.
- **Sensores/evidências:** teste determinístico cobre sucesso, payload divergente,
  duplicidades, falha antes/depois do convite, retry idempotente, marcador ausente ou
  inseguro, ID divergente, corrida de unicidade, catálogo inválido e nenhum sucesso
  parcial.

## T3.4 — Concluir primeiro sign-in e registrar último acesso

- **Estado:** `verified`.
- **Paths:** `packages/core/src/identity/use-cases/complete-sign-in-use-case.ts`, barrel
  e teste correspondente; substituir o uso server-side de `SignInUseCase` somente onde
  a nova fronteira exigir.
- **RF/CA:** RF-03; CA-24, CA-25.
- **Depende de:** T1.2, T1.3.
- **Parallelizable:** `yes` com T3.1, T3.2 e T3.3.
- **Resultado observável:** conta convidada vinculada muda atomicamente para `active` e
  recebe o instante exato de `DatetimeProvider`; ativa atualiza o acesso; desabilitada,
  ausente ou sem vínculo falha; erro de commit deixa a conta convidada e sinaliza a
  necessidade de revogar a sessão externa.
- **Sensores/evidências:** teste próprio com clock fixo cobre todos os estados, rollback,
  retry e interações com repositórios/transação.

# F4 — REST, guards e composição de módulos

- **Estado da fase:** `accepted`.
- **Dependências:** F2 e F3 aceitas.
- **Sensor de entrada:** use cases, providers e repositórios aceitos isoladamente.
- **Evidência de saída esperada:** endpoints reais documentados e exercitados por HTTP
  com wiring/migrations reais e mocks apenas nas falhas externas impraticáveis.
- **Gate:** controllers e integrações passam; Judge confirma autorização server-side,
  fronteiras de módulo e respostas sem vazamento.

## T4.1 — Compor guards e contexto autorizado

- **Estado:** `verified`.
- **Paths:** `apps/server/src/identity/guards/**`, decorators/contexto de request sob
  `apps/server/src/identity/**`, módulo Auth extraído e `apps/server/src/identity/identity.module.ts`.
- **RF/CA:** RF-01, RF-08; CA-01, CA-02, CA-23.
- **Depende de:** T2.2, T2.3, T3.1.
- **Parallelizable:** `no`; estabelece a fronteira usada pelos controllers.
- **Resultado observável:** `AuthGuard` comprova identidade externa; `ActiveAdminGuard`
  resolve conta/colaborador e anexa contexto tipado; módulos Identity e Catálogo usam a
  composição Auth sem ciclo; endpoints continuam negando acesso mesmo se o web for
  contornado.
- **Sensores/evidências:** integração HTTP cobre ausência/token inválido (`401`) e cada
  caso autenticado não autorizado (`403`), sem body de dados administrativos.

## T4.2 — Criar controllers, DTOs e testes de integração

- **Estado:** `verified`.
- **Paths:** `apps/server/src/identity/decorators/**`,
  `apps/server/src/identity/rest/controllers/**`,
  `apps/server/src/identity/rest/dtos/**`,
  `apps/server/src/identity/fixtures/**` e módulos de teste compartilhados apenas quando
  necessário.
- **RF/CA:** RF-01 a RF-08; CA-01 a CA-26, exceto evidências exclusivamente visuais.
- **Depende de:** T4.1, T1.4, T2.4, T3.2, T3.3, T3.4.
- **Parallelizable:** `yes` por controller depois que a fixture comum estiver estável;
  cada controller mantém um arquivo de teste próprio.
- **Resultado observável:** `GET /collaborators`, `GET /collaborators/me`,
  `POST /collaborators` e `POST /auth/complete-sign-in` validam input, instanciam um use
  case por controller, documentam sucessos/erros e exercitam banco/mappers/migration
  reais; falhas Auth não determinísticas usam doubles locais e justificados.
- **Sensores/evidências:** `pnpm --filter server test` com Supertest/Testcontainers,
  persistência observada após writes, filtros/ordenação/projeção histórica e matriz de
  retomada/ativação cobertas.

## T4.3 — Sincronizar módulos, Swagger e exemplos REST

- **Estado:** `verified`.
- **Paths:** `apps/server/src/identity/identity.module.ts`,
  `apps/server/src/legal-catalog/legal-catalog.module.ts`, barrels REST/DTO e
  `apps/server/rest-client/identity/collaborators.rest`.
- **RF/CA:** RF-01, RF-02, RF-03, RF-06; CA-01, CA-02, CA-03, CA-04, CA-06,
  CA-14, CA-21, CA-24.
- **Depende de:** T4.2.
- **Parallelizable:** `no`; documenta o conjunto final de rotas.
- **Resultado observável:** aplicação resolve todos os tokens; Swagger e `.rest` cobrem
  methods, paths, query/body, Bearer e respostas reais com dados representativos e sem
  secrets/PII.
- **Sensores/evidências:** server check:code/check:types/test e smoke HTTP sanitizado dos
  quatro endpoints.

# F5 — Integração de aplicação no web app

- **Estado da fase:** `accepted`.
- **Dependências:** F4 aceita.
- **Sensor de entrada:** contrato HTTP e erros estabilizados.
- **Evidência de saída esperada:** adapters e hooks semânticos testados sem lógica de
  domínio duplicada e sign-in local concluído antes de navegar.
- **Gate:** Judge confirma boundary REST/Auth, query keys e preservação de sessão.

## T5.1 — Ampliar o adapter REST de Identity

- **Estado:** `verified`.
- **Paths:** `apps/web/src/rest/services/identity-service.ts`,
  `apps/web/src/rest/services/tests/identity-service.test.ts` e composição existente do
  `rest-context` somente se necessária.
- **RF/CA:** RF-02, RF-03, RF-06; CA-03, CA-04, CA-06, CA-14, CA-21, CA-24.
- **Depende de:** T1.2, T4.3.
- **Parallelizable:** `yes` com T5.2 após os métodos REST estarem tipados.
- **Resultado observável:** service factory mapeia exatamente listagem, colaborador
  atual, cadastro e conclusão de sign-in ao `RestClient`; transporte continua dono do
  Bearer e o adapter não contém cache, Auth ou regras de negócio.
- **Sensores/evidências:** teste com `RestClient` tipado prova method/path/query/body e
  preservação de `RestResponse`; web check:code/check:types/test.

## T5.2 — Completar sign-in antes da navegação

- **Estado:** `verified`.
- **Paths:** `apps/web/src/ui/identity/widgets/pages/sign-in-page/use-sign-in-action.ts`,
  testes da sign-in page/action e auth/rest contexts apenas onde o contrato exigir.
- **RF/CA:** RF-03, RF-08; CA-18, CA-23, CA-24, CA-25.
- **Depende de:** T5.1.
- **Parallelizable:** `yes` com T5.3.
- **Resultado observável:** autenticação do browser obtém sessão, chama
  `completeSignIn` com o Bearer atual e só então navega; qualquer falha revoga a sessão,
  preserva conta convidada quando aplicável e mostra erro sem montar área interna.
- **Sensores/evidências:** testes cobrem ordem das chamadas, sucesso convidado/ativo,
  falha REST, `signOut`, ausência de navegação prematura e mensagem acessível.

## T5.3 — Criar hooks semânticos da feature

- **Estado:** `verified`.
- **Paths:** `apps/web/src/ui/identity/hooks/**` ou subdiretório feature-owned equivalente
  sob `apps/web/src/ui/identity/**`, com testes colocados em `tests/**`.
- **RF/CA:** RF-02, RF-03, RF-04, RF-06, RF-07; CA-03, CA-04, CA-05, CA-06,
  CA-09, CA-10, CA-14, CA-16, CA-17, CA-18.
- **Depende de:** T5.1.
- **Parallelizable:** `yes` por query/action; compartilhar chaves canônicas antes de
  dividir Builders.
- **Resultado observável:** hooks de colaborador atual, listagem, cadastro, áreas e
  temas expõem nomes semânticos; query key inclui busca/filtros/página; temas dependem
  da área e ficam disabled sem ID; sucesso invalida a lista; erros não descartam draft.
- **Sensores/evidências:** testes com abstrações HMS mockadas provam query keys,
  enablement, erro, invalidação e retorno sem nomes genéricos de TanStack Query.

# F6 — Rota, navegação e interface

- **Estado da fase:** `accepted`.
- **Dependências:** F5 aceita.
- **Sensor de entrada:** hooks semânticos e contratos de autorização disponíveis.
- **Evidência de saída esperada:** rota administrativa reproduzível, perfil real no
  layout, página/modal completos, testes de widgets e route tree gerada.
- **Gate:** Judge confirma CA visuais/funcionais antes da validação em navegador de F7.

## T6.1 — Compor rota protegida, URL, sidebar e perfil real

- **Estado:** `verified`.
- **Paths:** `apps/web/src/constants/routes.ts`,
  `apps/web/src/constants/sidebar-items.ts`, `apps/web/src/middlewares/**`,
  `apps/web/src/routes/colaboradores/index.tsx`,
  `apps/web/src/routeTree.gen.ts` via gerador e
  `apps/web/src/ui/shared/widgets/layouts/app-layout/**` com testes do layout/rota.
- **RF/CA:** RF-01, RF-02, RF-08; CA-03, CA-04, CA-18, CA-23.
- **Depende de:** T5.2, T5.3.
- **Parallelizable:** `no`; é o shell canônico consumido pela página.
- **Resultado observável:** `/colaboradores` valida search params, exige sessão e
  colaborador admin ativo antes de renderizar, redireciona os demais com segurança,
  preserva URL e mostra navegação apenas no perfil admin; `useAppLayout` deixa de usar
  `Attendant` fixo.
- **Sensores/evidências:** `pnpm --filter web generate-routes`, route tests, layout tests
  para os cinco perfis e inspeção do diff gerado sem edição manual.

## T6.2 — Implementar página, tabela, filtros e paginação

- **Estado:** `verified`.
- **Paths:** `apps/web/src/ui/identity/widgets/pages/collaborators-page/**` e widgets
  internos colocados em diretórios próprios com hooks/testes quando possuem comportamento.
- **RF/CA:** RF-02, RF-06, RF-07, RF-08; CA-03, CA-04, CA-05, CA-14, CA-17,
  CA-19, CA-20.
- **Depende de:** T6.1, T5.3.
- **Parallelizable:** `yes` com T6.3 e T6.4; integração final ocorre no widget dono.
- **Resultado observável:** tabela mostra os campos do Contract e total; busca, perfil,
  cargo, estado, limpeza e paginação escrevem a URL; loading, vazio filtrado/geral e erro
  têm ações claras; nenhum menu inerte é publicado.
- **Sensores/evidências:** testes de widget por role/name, estados e navegação canônica;
  nenhuma asserção de classe como substituto de comportamento.

## T6.3 — Implementar modal e formulário base

- **Estado:** `verified`.
- **Paths:** `apps/web/src/ui/identity/widgets/components/collaborator-register-dialog/**`
  ou diretório feature-owned equivalente, incluindo hook, schema adapter e testes.
- **RF/CA:** RF-03, RF-05, RF-07, RF-08; CA-06, CA-07, CA-08, CA-12,
  CA-13, CA-15, CA-16, CA-17, CA-19, CA-20.
- **Depende de:** T5.3 e integração do trigger em T6.2.
- **Parallelizable:** `yes` com T6.2; T6.4 estende o mesmo contrato e exige coordenação
  de arquivos para evitar edição concorrente do hook raiz.
- **Resultado observável:** React Hook Form + Zod controla e-mail, nome profissional,
  cargo e perfil; especialidades administrativas não são renderizadas/enviadas; mudança
  de jurídico para administrativo explica e confirma o descarte; envio inválido fica
  indisponível; sucesso fecha/invalida/notifica convite pendente; erro preserva draft e
  foco útil.
- **Sensores/evidências:** testes de widget/hook cobrem validação, descarte confirmado,
  pending, sucesso, erro e foco/descrições acessíveis.

## T6.4 — Implementar grupos de especialidade jurídica

- **Estado:** `verified`.
- **Paths:** widgets internos sob
  `apps/web/src/ui/identity/widgets/components/collaborator-register-dialog/**` e hooks
  de Catálogo de T5.3.
- **RF/CA:** RF-04, RF-05, RF-07, RF-08; CA-09, CA-10, CA-11, CA-12, CA-13,
  CA-15, CA-19, CA-20.
- **Depende de:** T6.3 e T5.3.
- **Parallelizable:** `yes` para widgets internos depois que props/callbacks do modal
  forem congelados; não editar o hook raiz em paralelo sem handoff.
- **Resultado observável:** perfil jurídico inicia com um grupo, permite adicionar/remover
  áreas únicas, carrega temas pela área, pesquisa e seleciona múltiplos chips com `+N`,
  limpa apenas temas do grupo alterado e bloqueia conclusão incompleta.
- **Sensores/evidências:** testes de hook/widget cobrem dois grupos, repetição, troca,
  remoção, área sem temas, loading/erro de catálogo, teclado e associação de mensagens.

## T6.5 — Consolidar design system e acessibilidade automatizada

- **Estado:** `verified`.
- **Paths:** arquivos de T6.1–T6.4 e wrappers HMS de `Anchor`/`Icon` somente se um ícone
  novo precisar ser registrado.
- **RF/CA:** RF-07, RF-08; CA-15, CA-16, CA-17, CA-18, CA-19, CA-20.
- **Depende de:** T6.1, T6.2, T6.3, T6.4.
- **Parallelizable:** `no`; é revisão integrada da composição.
- **Resultado observável:** headings serif, controles sans, tokens HMS, tema escuro,
  foco visível, labels persistentes, estados por texto/ícone e reflow são preservados;
  copy segue a Spec (`Nome profissional`, `Desabilitado`, `Criar colaborador`) apesar da
  divergência dos frames.
- **Sensores/evidências:** web check:code/check:types/test, auditoria semântica pelo
  accessibility tree e checklist visual preparado para F7; `design/hms.pen` permanece
  intocado por esta feature.

# F7 — Validação integrada e conclusão

- **Estado da fase:** `accepted`.
- **Dependências:** F4 e F6 aceitas.
- **Sensor de entrada:** todos os artefatos implementados e evidências focadas anexadas.
- **Evidência de saída esperada:** CA-01 a CA-26 mapeados para evidência real, Quality
  Gate e build verdes, riscos remanescentes explicitados e Judge final `accepted`.
- **Gate:** somente o veredito final aceito permite marcar a fase e o Plan como concluídos.

## T7.1 — Rodar sensores focados por workspace

- **Estado:** `verified`.
- **Paths:** todos os paths alterados nas fases anteriores.
- **RF/CA:** RF-01 a RF-08; CA-01 a CA-26.
- **Depende de:** F4, F6.
- **Parallelizable:** `yes`; Core, Validation, Server e Web podem validar em processos
  separados respeitando a geração de migration/rotas.
- **Resultado observável:** lint/typecheck/test focados passam em `@hms/core`,
  `@hms/validation`, `server` e `web`; route tree e migration estão sincronizadas.
- **Sensores/evidências:** comandos e resultados reais registrados no ledger de
  tentativas, incluindo qualquer falha preexistente distinguível.

## T7.2 — Validar REST, banco e Auth local

- **Estado:** `verified`.
- **Paths:** runtime local; nenhuma alteração fora do escopo sem nova descoberta.
- **RF/CA:** RF-01, RF-02, RF-03, RF-04, RF-05, RF-06; CA-01, CA-02, CA-04,
  CA-06 a CA-10, CA-12, CA-14, CA-21 a CA-26.
- **Depende de:** T7.1 para os testes focados relevantes.
- **Parallelizable:** `yes` com preparação dos cenários de navegador, desde que usem
  dados isolados.
- **Resultado observável:** chamadas sanitizadas comprovam autorização, filtros,
  cadastro, retry sem segundo convite, conflito seguro e conclusão/revogação do sign-in;
  banco confirma uma conta, um colaborador e associações corretas.
- **Sensores/evidências:** Docker Compose, server local, Mailpit/Supabase Auth local
  quando disponível, respostas HTTP e consultas via repositories/fixtures; falhas
  externas impraticáveis permanecem provadas por adapter/use-case tests justificados.

## T7.3 — Validar fluxos e frames no navegador

- **Estado:** `verified`.
- **Paths:** aplicação web em execução; frames Pencil `vuNXP`, `xtvMv`, `R1af6`, `DlEfU`
  consultados read-only pelo MCP apropriado.
- **RF/CA:** RF-02, RF-03, RF-04, RF-05, RF-07, RF-08; CA-03 a CA-05, CA-09 a
  CA-13, CA-15 a CA-20, CA-23.
- **Depende de:** T7.2 para cenários integrados de dados/Auth.
- **Parallelizable:** `no` para o roteiro final; reutiliza um estado controlado da
  aplicação.
- **Resultado observável:** Playwright comprova admin/outros perfis, URL reproduzível,
  filtros/paginação, estados, ambos os modais, grupos jurídicos, sucesso/erro, teclado,
  foco, viewport estreita, zoom/reflow e tema escuro; composição corresponde aos frames
  com as ressalvas de copy da Spec.
- **Sensores/evidências:** snapshots de acessibilidade, console e network sem erros
  bloqueantes, screenshots somente onde a comparação visual agregar evidência e matriz
  CA atualizada. A rota protegida foi validada com o administrador seed em
  `/colaboradores`; refresh token antigo e warning preexistente de estado antes da
  montagem foram classificados como não bloqueantes.

## T7.4 — Executar Quality Gate e build

- **Estado:** `verified`.
- **Paths:** monorepo completo, preservando alterações não relacionadas.
- **RF/CA:** todos.
- **Depende de:** T7.1, T7.2, T7.3.
- **Parallelizable:** `no`; é o gate integrado final.
- **Resultado observável:** `pnpm format`, `pnpm lint`, `pnpm check-types`, `pnpm test`
  e `pnpm build` passam; `pnpm --filter server test:e2e` é executado quando o script e o
  ambiente estiverem disponíveis, ou a indisponibilidade é registrada com evidência.
- **Sensores/evidências:** logs dos comandos, diff pós-format preservando mudanças do
  usuário, Quality Gate CI e builds de Core/Server/Web.

## T7.5 — Consolidar evidências e solicitar Judge Implementation final

- **Estado:** `verified`.
- **Paths:** este Plan e `evaluation.md` somente após implementação
  real; PRD/documentação de módulos apenas se a implementação revelar mudança de regra.
- **RF/CA:** todos.
- **Depende de:** T7.4.
- **Parallelizable:** `no`; depende de todas as evidências e é responsabilidade do
  Orchestrator.
- **Resultado observável:** cada CA aponta para teste, REST, navegador, sensor, CI ou
  build real; findings possuem estado/próxima ação; o Judge final aceitou a
  implementação e o Orchestrator incorporou o veredito sem apagar histórico.
- **Sensores/evidências:** matriz CA completa, tabela de vereditos atualizada e nenhum
  item `pending`, `implementing` ou `validating` quando o Plan for concluído.

# Sensores por fase

| Fase | Sensores obrigatórios | Evidência mínima esperada |
|---|---|---|
| F1 | Core/Validation lint, typecheck e schema tests | Contratos públicos compiláveis e matriz de schema válida/inválida. |
| F2 | Server lint/typecheck, migration generate/apply, inspeção de imports | SQL/snapshot gerados, constraints e providers sem ciclo/secret no web. |
| F3 | Core unit tests por use case | Interações, erros, retry, concorrência e clock determinístico. |
| F4 | Server integration tests + smoke REST | HTTP real, migrations/repositories reais, Swagger e `.rest` sincronizados. |
| F5 | Web adapter/hook/action tests | Mapeamento HTTP, query keys, invalidação e ordem sign-in → complete → navigate. |
| F6 | Route generation + widget/layout/route tests | URL, perfil real, estados, formulário, acessibilidade e tokens. |
| F7 | REST/Auth local, Playwright, Quality Gate, CI e build | CA-01–CA-31 com evidência real e veredito final aceito. |

# Mudança vinculada — collaborator-access-actions

A alteração posterior da feature é especificada em
[`changes/collaborator-access-actions/spec.md`](./changes/collaborator-access-actions/spec.md)
e avaliada em seu `evaluation.md`. Por ser uma mudança coesa, sem migration ou
nova fase de dados, não foi criado um Plan filho. O ledger desta revisão registra
somente a compatibilidade com as fases F4–F6 e mantém a conclusão da Spec base
dependente do Quality Gate/CI.

# Riscos

| ID | Risco | Impacto | Mitigação | Estado | Próxima ação |
|---|---|---|---|---|---|
| R-01 | Convite Auth ocorre fora da transação PostgreSQL. | Conta externa sem agregado local ou convite duplicado. | Tentativa persistida antes do efeito, marcador em `app_metadata`, hash/ID e retry idempotente. | `open` | Provar CA-08/CA-21/CA-22/CA-26 em F3/F4/F7. |
| R-02 | Ambiente local pode não reproduzir todas as falhas administrativas do Supabase. | Lacuna de evidência em compensação/reconciliação. | Auth local para caminhos reais; doubles somente no adapter para falhas não controláveis, com integração local do restante. | `open` | Auditar capacidades do stack local antes de T4.2 e registrar exceções. |
| R-03 | Usuário administrativo existente não possui vínculo de colaborador. | Perda de acesso ao habilitar a rota/guard. | Seed somente em dev; provisionamento de produção deve seguir processo operacional externo aprovado. | `acknowledged` | Confirmar o procedimento externo antes de habilitar a rota em produção. |
| R-04 | Identity e Catálogo podem formar dependência circular. | Falha de composição Nest e violação de módulos. | Extrair composição Auth; Catálogo implementa porta e Identity depende somente do token/interface. | `open` | Validar grafo de imports em T2.3/T2.4 e bootstrap em F4. |
| R-05 | Normalização de e-mail diverge entre use case, tentativa e índice. | Duplicidade ou conflito inconsistente. | Uma semântica canônica `trim` + comparação case-insensitive e índice funcional equivalente. | `open` | Cobrir valores equivalentes e corrida em T3.3/T4.2. |
| R-06 | Listagem histórica pode gerar N+1 ao resolver Catálogo. | Degradação com paginação cheia. | Coletar IDs da página e resolver áreas/temas em lote. | `open` | Inspecionar chamadas/queries em T2.2/T4.2. |
| R-07 | Mudanças existentes do usuário se sobrepõem à documentação/design. | Perda ou mistura de trabalho alheio. | Preservar worktree, não editar `design/hms.pen`, revisar diff por path. | `mitigating` | Revalidar `git status` antes de cada handoff e do format final. |

# Findings ativos

| ID | Finding | Origem | Estado | Próxima ação |
|---|---|---|---|---|
| FND-01 | O provisionamento do primeiro administrador de produção não pertence à migration nem à seed de desenvolvimento. | Spec, Persistência | `acknowledged` | Tratar no processo externo de implantação; não manter instruções ou credenciais operacionais neste repositório. |
| FND-02 | `LegalCatalogModule` atualmente importa `IdentityModule`; importar o Catálogo de volta em Identity criaria ciclo. | Inspeção do código | `open` | Extrair/importar somente a composição Auth em T2.3 e validar bootstrap em F4. |
| FND-03 | O web app autentica direto no browser e navega sem concluir o estado local. | Inspeção do código | `open` | Implementar e testar a ordem transacional de T3.4, T4.2 e T5.2. |
| FND-04 | Os frames possuem copy antiga e o arquivo Pencil já está modificado no worktree. | Spec e `git status` | `acknowledged` | Tratar frames como read-only; usar a copy canônica da Spec em T6.5/T7.3. |
| FND-05 | A Spec e `documentation/tooling.md` citam `pnpm --filter server test:e2e`, mas `apps/server/package.json` não declara esse script. | Inspeção de documentação/configuração | `acknowledged` | Sensor indisponível; suites REST/Testcontainers e build cobrem o comportamento sem criar tooling fora do escopo. |
| FND-06 | A evidência HTTP de F4 não cobre diretamente todos os critérios de conflito, validação de catálogo, retry e revogação; esses casos estão cobertos nos use cases/providers. | Judge Implementation F4 | `acknowledged` | Reforçar ou justificar a matriz CA no Quality Gate final, sem duplicar testes desnecessariamente. |
| FND-07 | Judge F6 encontrou gaps de produto na UI: lastAccessAt ausente, submit permissivo, descarte silencioso de especialidades, grupos sem busca/chips/estados, sucesso sem fechamento, search params frouxos, erros sem associação/foco e retry inexistente. | Judge Implementation F6 | `resolved` | Corrigido pelos Builders Fix F6; Judge F6 final aceitou a fase. |

# Tentativas e evidências operacionais

| ID | Data | Fase/tarefa | Ação | Resultado | Estado | Próxima ação |
|---|---|---|---|---|---|---|
| A-001 | 2026-07-29 | Planejamento | Revisar Spec r1, regras dinâmicas, arquitetura, design, tooling, infraestrutura e topologia atual. | Necessidade de Plan confirmada; sete fases e dependências definidas. | `verified` | Iniciar F1. |
| A-002 | 2026-07-29 | F1 — T1.1–T1.4 | Builders implementaram domínio, contratos, erros/fakers e schemas; o Orchestrator repetiu lint, typecheck, testes focados e `git diff --check`. | Core: lint/typecheck/test verdes (11 arquivos, 39 testes); Validation: lint/typecheck/test verdes (2 arquivos, 7 testes); Judge Implementation F1 aceitou sem bloqueantes. | `verified` | Iniciar F2; carregar o finding não bloqueante sobre `AuthProvider.createUser` nos providers concretos. |
| A-003 | 2026-07-29 | F2 — T2.1–T2.5 | Builders implementaram migration, modelos, repositórios transacionais, providers server-only, Catálogo Jurídico, seed e fixture; o Orchestrator repetiu os sensores de Server, migration e REST/Auth focados. | Server check:code/check:types/test verdes (12 arquivos, 36 testes); migration generate/apply verdes; lookup REST 5/5; Auth provider 7/7; Judge Implementation F2 aceitou após correções de wiring, filtro case-insensitive e cleanup de fixture/seeder. | `verified` | Manter F2 aceita e seguir com F3/F4. |
| A-004 | 2026-07-29 | F3 — T3.1–T3.4 | Builders implementaram autorização, listagem, saga de convite/commit local e complete sign-in; o Orchestrator repetiu testes de Core, Server, use cases e providers. | Core lint/check:types/test verdes (16 arquivos, 79 testes); Server check:code/check:types/build/test verdes; register 17/17; complete sign-in 8/8; Auth provider 7/7; Judge Implementation F3 aceitou após correções de lock/lastError e revogação compensatória. | `verified` | Seguir com F4. |
| A-005 | 2026-07-29 | F4 — T4.1–T4.2 | Builders compuseram AuthGuard/ActiveAdminGuard, contexto/decorators, quatro controllers, DTOs, fixture e testes HTTP; o Orchestrator rodou check:code, check:types e os quatro arquivos de controller. | Server check:code/check:types verdes; testes focados: 4 arquivos, 9 testes verdes; Supertest/Testcontainers exercitaram listagem, `me`, cadastro e conclusão de sign-in. | `verified` | Concluir T4.3, rodar suite Server e solicitar Judge F4. |
| A-006 | 2026-07-29 | F4 — T4.3 | Builder sincronizou barrels/Swagger, confirmou wiring de Identity/Auth/Legal Catalog e atualizou o exemplo `.rest` com os quatro endpoints, Bearer e placeholders sanitizados; o Orchestrator rodou a suite completa. | Server check:code/check:types verdes; suite Server: 17 arquivos, 48 testes verdes; `git diff --check` verde; Judge Implementation F4 aceitou com finding P2 de cobertura HTTP a carregar para F7. | `verified` | Iniciar F5. |
| A-007 | 2026-07-29 | F5 — T5.1–T5.3 | Builders implementaram os quatro métodos do adapter REST, a ação sign-in → completeSignIn → navegação com signOut compensatório, e hooks semânticos de colaboradores/Catálogo; Builder Fix removeu `createUser` obsoleto e formatou novos testes/hooks. | Web check:code/check:types verdes; suite Web: 17 arquivos, 55 testes verdes; testes focados de adapter/ação/hooks verdes (4+7+6) e diff-check verde. | `verified` | Solicitar Judge F5. |
| A-008 | 2026-07-29 | F5 — julgamento | Judge Implementation F5 revisou adapter, ação de autenticação e hooks read-only. | Veredito `accepted`, sem findings; paths/query/body, ordem sign-in → complete → navegação, signOut compensatório, query keys, enablement e invalidação confirmados. | `verified` | Iniciar F6. |
| A-009 | 2026-07-29 | F6 — T6.1–T6.5 | Orchestrator integrou rota protegida, sidebar por perfil, tabela/filtros/paginação, modal RHF/Zod e grupos jurídicos; gerou route tree e executou sensores Web, layout, página e modal. | Web check:types verde; check:code verde com 6 warnings preexistentes; suite Web: 19 arquivos, 59 testes; route generation verde; layout 9/9; página 1/1; modal 2/2; diff-check verde. | `verified` | Solicitar Judge F6. |
| A-010 | 2026-07-29 | F6 — julgamento inicial | Judge Implementation F6 revisou a interface read-only e rejeitou a fase por oito findings P1/P2 de comportamento e completude visual/funcional. | Findings: lastAccessAt, submit/validação, confirmação ao trocar perfil, busca/chips/estados de especialidade, fechamento de sucesso, search params, associação/foco de erros e retry. | `failed` | Executar Builder Fix F6 e repetir sensores/Judge. |
| A-011 | 2026-07-29 | F6 — Builder Fix | Builders corrigiram validação/normalização de search params, coluna de último acesso, retry efetivo, submit inválido, confirmação de descarte, busca/chips/`+N`, estados do Catálogo, fechamento automático e acessibilidade do modal. | Web check:code (6 warnings preexistentes), check:types, suite Web: 19 arquivos/60 testes, focused route/table/modal checks e diff-check verdes. | `verified` | Solicitar novo Judge F6. |
| A-012 | 2026-07-29 | F6 — Builder Fix C | Builder corrigiu o último finding P1, comunicando loading/erro de áreas jurídicas e bloqueando seleção/envio nesses estados; o Orchestrator corrigiu asserções de teste incompatíveis e repetiu sensores focados. | Web check:types verde; testes focados modal/página: 2 arquivos, 6 testes; diff-check verde. | `verified` | Solicitar julgamento final de F6. |
| A-013 | 2026-07-29 | F6 — julgamento final | Judge Implementation F6 reavaliou todos os findings e aceitou a fase. | Loading/erro de áreas corrigidos; findings anteriores resolvidos; Web check:code/check:types, suite 19 arquivos/62 testes, focused 2/6 e diff-check verdes. | `verified` | Iniciar F7. |
| A-014 | 2026-07-29 | F7 — T7.1–T7.4 | Orchestrator executou sensores por workspace, suites integradas, migration/build e Quality Gate; validou a rota protegida com Playwright. | Core 16/79, Validation 2/7, Server 17/48 e Web 19/62 testes verdes; root lint/check-types/test/build e diff-check verdes; `pnpm format` passou após retirar artefatos ignorados; `test:e2e` indisponível por ausência do script; navegador redirecionou sem sessão e registrou hydration error no login. | `verified` | Solicitar Judge Implementation final, mantendo as limitações de Auth/browser e FND-05 explícitas. |
| A-015 | 2026-07-29 | F7 — Builder Fix/Judge final | Corrigidos mensagem de convite pendente, bloqueio/reindexação de temas, chips removíveis, associação de erros e estrutura de widgets; `.env.staging` foi removido do worktree e preservado em backup externo; o hydration fix global foi revertido por escopo. | Web types, dialog 5/5 e diff-check verdes. Judge final manteve `failed`: sem sessão autenticada/frames, falta cenário REST de catálogo inativado, falta extração completa de hooks/props e o redirect ainda reproduz hydration sem o fix global. | `failed` | Disponibilizar sessão/Auth local, decidir correção de hydration no boundary apropriado, adicionar evidências CA-14/CA-19/CA-20 e concluir a extração de UI. |
| A-016 | 2026-07-31 | F7 — Quality Gate atual | `pnpm format`, lint, tipos, testes integrados e build foram executados; o wiring ausente de `DrizzleUsersRepository` foi corrigido. | Lint, tipos e build passaram; Server passou 18 suítes, mas o convite REST falhou porque o Supabase Auth local reinicia por não resolver `supabase-db`; o formatter também falhou em artefatos gerados. | `in_progress` | Restaurar o Auth local/CI, repetir o Quality Gate e então solicitar o Judge Implementation final. |
| A-017 | 2026-07-31 | F7 — Quality Gate após restauração | Recriado `supabase-db` após erro de mount OCI, subidos os serviços dependentes, excluídos `dist`/`.output` do Biome e repetidos os sensores integrados. | `pnpm format`, lint, check-types, test e build passaram; Server: 19 arquivos/56 testes; convite REST: 3/3. | `verified` | Executar Playwright autenticado, solicitar Judge final e seguir para commit/PR e CI. |
| A-016 | 2026-07-30 | Mudança `collaborator-access-actions` | Implementados os contratos de reenvio/inativação, use cases, endpoints protegidos, provider administrativo, serviço REST, mutações web, menu `…` e dialogs de confirmação; sincronizada a documentação SDD. | Core check-types + 3 testes focados verdes; Server check:types/check:code verdes; Web check:types e serviço REST 6/6 verdes; nenhum build executado por decisão da task. | `verified` | Executar integração HTTP/Auth e Quality Gate/CI antes de concluir a mudança. |
| A-017 | 2026-07-30 | Change `collaborator-profile-edit` | Edição de dados profissionais solicitada para substituir o item `Editar` desabilitado, preservando o e-mail como identidade imutável. | Implementação em andamento; evidências serão anexadas após os sensores e o Judge da change. | `in_progress` | Concluir core/server/web, validar transação e atualizar `evaluation.md`. |
| A-018 | 2026-07-30 | Change `collaborator-invitation-page` | Criada a tela pública dedicada do frame `DlEfU`, com definição/confirmação de senha, tratamento de convite expirado e redirects de cadastro/reenvio para `/convite`. | Web route generation e typecheck de Core/Server/Web verdes; Playwright confirmou a tela em 1440×900 e o estado sem sessão; nenhum build local executado. | `verified` | Validar um link real emitido pelo Supabase local e executar Quality Gate/build no CI. |
| A-019 | 2026-07-30 | Change `collaborator-access-lifecycle` | Adicionadas as decisões de detalhes, reativação, cancelamento de convite e remoção de convite cancelado. | Contract registrado; implementação e sensores em andamento. | `in_progress` | Concluir Core/Server/Web e anexar evidências focadas. |

Novas tentativas devem ser anexadas, nunca reescritas. Uma falha registra comando ou
ação, evidência observada, hipótese, mudança aplicada e próxima tentativa. Tokens,
secrets, links de convite e payloads pessoais não entram neste ledger.

# Vereditos do Judge Implementation

| Fase | Estado no envio | Veredito | Findings | Evidências consideradas | Próxima ação |
|---|---|---|---|---|---|
| F1 | `awaiting_judgment` | `accepted` | Não há bloqueantes. F2 deve remover `createUser` dos providers comuns e implementar a administração Auth server-only; F5 atualizará o adapter REST web. | Core/Validation lint, typecheck, testes, diff-check e revisão read-only do Judge F1. | Iniciar F2. |
| F2 | `awaiting_judgment` | `accepted` | Não há bloqueantes após as correções de wiring, filtro normalizado e cleanup de fixtures. | Server lint/typecheck/test, migration generate/apply, REST/Auth focados e revisão read-only do Judge F2. | Seguir com F3/F4. |
| F3 | `awaiting_judgment` | `accepted` | Não há bloqueantes após lock de concorrência, persistência de `lastError` e revogação compensatória de sessão. | Core/Server lint, typecheck, build, testes unitários/integrados focados e revisão read-only do Judge F3. | Seguir com F4. |
| F4 | `awaiting_judgment` | `accepted` | Não há bloqueantes. O Judge registrou apenas lacuna P2 de evidência HTTP para alguns critérios, já cobertos por use cases/providers e a validar no Quality Gate final. | Server check:code/check:types/test (17 arquivos, 48 testes), testes focados (4 arquivos, 9 testes), migration aplicada, diff-check e revisão read-only do Judge F4. | Iniciar F5 e carregar a matriz HTTP para F7. |
| F5 | `awaiting_judgment` | `accepted` | Não há findings. | Web check:code/check:types, suite Web (17 arquivos, 55 testes), focados (3 arquivos, 12 testes) e revisão read-only do Judge F5. | Iniciar F6. |
| F6 | `awaiting_judgment` | `failed` | Tentativa inicial falhou; retry implementado e aguardando novo julgamento. | Web check:code/check:types, suite Web (19 arquivos, 60 testes), focused route/table/modal checks, route generation e diff-check. | Julgar novamente F6. |
| F6 (retry) | `awaiting_judgment` | `pending` | Finding P1 de loading/erro das áreas corrigido; novo Judge pendente. | Web check:types, focused modal/página 2 arquivos/6 testes e diff-check; suite completa será repetida antes de F7. | Aguardar Judge F6 retry. |
| F6 (final) | `awaiting_judgment` | `accepted` | Nenhum finding remanescente. | Web check:code/check:types, suite Web 19 arquivos/62 testes, focused 2/6, diff-check e revisão read-only final. | Iniciar F7. |
| F7 | `accepted` | `accepted` | Nenhum bloqueante | Quality Gate local, Auth/browser autenticado, Judge final e CI do HEAD publicados em `16c2a3b`; Core, Server e Web CI verdes; PR mergeable. | Concluir a Spec. |

Vereditos permitidos no ledger: `accepted` ou `failed`. Um `failed` mantém os
findings, novas tentativas e o próximo julgamento como linhas adicionais; não substitui
o histórico anterior.

# Handoff de implementação

1. Orchestrator move uma fase para `in_progress` e cada tarefa iniciada para
   `implementing` antes de delegar.
2. Builder recebe apenas a tarefa, paths, RF/CA, dependências e sensores pertinentes;
   não altera este Plan.
3. Ao terminar código, Builder entrega diff, decisões, testes executados, falhas e riscos;
   Orchestrator move a tarefa para `validating`.
4. Sensores aprovados movem tarefas para `verified` e a fase para
   `awaiting_judgment`.
5. Judge Implementation avalia read-only contra Spec, regras e evidências. O
   Orchestrator registra `accepted`/`failed`, findings e próxima ação.
6. Somente uma fase aceita libera suas dependentes. Paralelismo nunca antecipa um gate
   não aceito nem permite edições concorrentes no mesmo arquivo.
7. F7 aceita permite concluir a Spec com `conclude-spec`; até lá, este Plan permanece
   aberto como ledger e não altera Jira/PRD automaticamente.
