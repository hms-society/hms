# Evaluation — Implementação

Estado: completed; blockers preexistentes mantidos.

Spec avaliada: revisão 24 (`spec.md`).

Plan: `plan.md`.

PRD: https://plataformahms.atlassian.net/wiki/pages/viewpage.action?pageId=2588673

Jira: SCRUM-138.

## Preflight Pencil

- Editor ativo e respondendo: confirmado em 2026-08-13.
- Arquivo ativo: `design/hms.pen`.
- Schema carregado: confirmado via Pencil MCP.
- Nodes visuais confirmados: `F9JxU`, `hq7Ty`, `Y5vBQ`.
- Implementação liberada após esse hard gate.

## F9 — Revisão alinhada ao Y5vBQ

Checkpoint inicial: o Pencil MCP confirmou o editor ativo em
`/home/petros/projects/hms/design/hms.pen`, com schema disponível e o frame `Y5vBQ`
renderizado. A estrutura visual observada separa navegação/título, card de decisão e
editor em revisão; a implementação deve preservar os contratos e mutations já
existentes. Sensores e screenshot final serão registrados após o patch.

Checkpoint de teste: a primeira execução encontrou asserções ambíguas porque o status
é exibido no cabeçalho e no card de decisão. O teste foi ajustado para verificar as
duas ocorrências intencionais e as regiões acessíveis `Decisão da versão` e
`Documento em revisão`; a validação final ainda está pendente.

Checkpoint de formatação: `pnpm --filter web exec biome format --write` corrigiu
somente a formatação dos três componentes alterados, sem mudança comportamental.

## F10 — Tipografia compartilhada dos dialogs

Checkpoint de implementação: `DialogContent` e `AlertDialogContent` passaram a
usar corpo `text-base` e elevar descendentes `text-xs`/`text-sm`; títulos usam
`text-2xl` e descrições `text-base`. No modal de seleção, três valores arbitrários
de 11 px foram substituídos por `text-xs`, garantindo mínimo visual de `text-sm`
dentro da superfície. Validação de código e screenshots browser estão pendentes.

Checkpoint de sensores: `pnpm --filter web check:code` e `git diff --check`
passaram. Os testes focados de lista e revisão passaram em 2 arquivos / 11 testes.
A evidência visual browser ainda está pendente.

Checkpoint corretivo: a inspeção browser revelou que o botão `Localizar` ainda
usava 12,8 px pela variante `size='sm'`. A primitiva compartilhada passou a elevar
descendentes `[data-size=sm]` para `text-sm`; a validação de código e os testes
focados serão repetidos antes do fechamento.

## F10 — Verificada

Quality Gate focado: `pnpm --filter web check:code`, testes de lista/revisão em
2 arquivos / 11 testes e `git diff --check` passaram.

Browser Use/CDP autenticado validou os dialogs server-backed reais. A seleção de
documentos, em viewport 390×844, apresentou título 24 px, descrição 16 px,
auxiliares 14 px e ações compactas 14 px, com `scrollWidth === clientWidth`.
Histórico e pendências confirmaram título 24 px, descrição 16 px, conteúdo 14–16
px e ações compactas 14 px, sem overflow. O AlertDialog de aprovação confirmou
título 24 px e descrição 16 px. Screenshots capturados:
`consultation-dialog-font-size-mobile.png`,
`consultation-version-history-font-size.png`,
`consultation-pending-markers-font-size.png` e
`consultation-alert-dialog-font-size.png`.

O Playwright MCP estava bloqueado por uma sessão compartilhada anterior; a
validação foi executada em uma instância Chrome temporária via CDP com Browser Use.

Revalidação posterior: o teste da lista permaneceu verde (8 testes), enquanto o
Biome encontrou formatação em três arquivos alterados pela F13 e o teste da review
falhou em 5 casos por `Icon` sem export correspondente. Esses findings são
concorrentes e não foram introduzidos pelos dialogs; não foram corrigidos nesta
fase para preservar o escopo da F13.

## F11 — Dialog de rejeição alinhado ao RGqCe

Checkpoint inicial: o Pencil MCP confirmou o editor ativo em
`/home/petros/projects/hms/design/hms.pen`, com `RGqCe` selecionado e renderizado.
O frame define largura aproximada de 440 px, cabeçalho/corpo/rodapé com divisórias,
descrição contextual, textarea de 80 px, hint de persistência e ações à direita.
O hint será adaptado para não declarar um mínimo de caracteres diferente do contrato
canônico atual; a validação permanece motivo não vazio.

Checkpoint de implementação: o dialog foi dividido visualmente em header/body/footer,
com `sm:max-w-[440px]`, textarea `min-h-20`, descrição contextual, label com
asterisco, hint persistente e ação destrutiva com ícone. O teste de composição agora
verifica descrição, hint, label e botão inicialmente desabilitado.

Checkpoint corretivo: o teste que preenchia o campo foi alinhado ao label obrigatório
com asterisco; não houve alteração no comportamento da mutation.

Checkpoint de formatação: o Biome corrigiu somente a quebra de linhas do dialog e do
teste, sem mudança comportamental.

## F11-T1 — verificado

O teste focado `consultation-document-review-page.test.tsx` passou 4/4; o Biome
`check:code` passou. O Browser Use/CDP validou a página autenticada e o dialog
`RGqCe`: largura computada de 440 px, textarea com 80 px, descrição contextual,
asterisco no label, hint de histórico e **Rejeitar versão** desabilitado enquanto o
campo está vazio. O foco inicial foi aplicado ao textarea; depois de inserir um
motivo válido o botão ficou habilitado. O dialog foi cancelado sem request de
mutation. Screenshots: `consultation-reject-dialog-rgqce.png` e
`consultation-reject-dialog-rgqce-mobile.png`.

O Playwright MCP não pôde assumir a sessão compartilhada porque o perfil Chrome
estava bloqueado por outra instância; a interação e as capturas foram realizadas
pelo Browser Use/CDP no mesmo navegador autenticado.

## F12 — Folha editável mais ampla

Checkpoint inicial: o limite visual da folha compartilhada era `max-w-3xl`, fazendo
com que a área branca ocupasse pouco espaço horizontal em telas grandes. A alteração
foi limitada ao `DocumentEditor`, usando `w-full max-w-5xl`; não há mudança de
contrato, conteúdo, toolbar ou comportamento de edição. A validação final está
pendente.

## F12-T1 — verificado

Os testes focados do `DocumentEditor` e da página de revisão passaram 9/9; o
`pnpm --filter web check:code` passou. No browser autenticado, a folha editável
mediu 1022 px em viewport de 1440 px e 322 px em viewport de 390 px. Nos 390 px,
`documentWidth` e `bodyWidth` permaneceram 390 px, sem overflow horizontal. A rota
real retornou GET 200 para documentos, versão, clientes e colaborador; não houve
erro de console. O único warning foi o aviso preexistente do TanStack Router sobre
`notFoundComponent` no `__root__`.

Screenshots:

- `consultation-document-review-wide-editor.png`
- `consultation-document-review-wide-editor-mobile.png`

## F9-T1 — verificado

O teste focado da review page passou 4/4; `pnpm --filter web check:code` e
`git diff --check` passaram. O `pnpm --filter web check:types` segue bloqueado
somente por `react-pdf` ausente e `totalPages` implícito no document viewer
preexistente.

No browser autenticado, a rota real
`/consultas/00000000-0000-4000-8000-000000000101/documentos/15aa4fde-da7e-4980-9cf0-6003b7e33f95/versoes/5300c587-fa90-4846-9dd0-011ca3beebb7`
retornou 200 para a listagem e para a versão. O snapshot confirmou a hierarquia
**Revisar documento** → **Decisão da versão** → **Documento em revisão**, com as
ações existentes disponíveis. Em 1200×1050 e 390×844 não houve overflow horizontal;
o caminho de teclado alcançou o searchbox; console final teve 0 errors e 0 warnings;
network da API teve somente GET 200. Screenshots registrados:
`consultation-document-review-y5vbq.png` e
`consultation-document-review-y5vbq-mobile.png`.

## F13 — Matriz da DocumentVersionDecisionBar

Checkpoint inicial: os nodes Pencil `zBZ6j`, `Op56U`, `JH360`, `sJhUE`, `uupRa`,
`ca1dH` e `WpfrA` foram inspecionados no arquivo ativo correto
`/home/petros/projects/hms/design/hms.pen`. A implementação deve derivar geração
ativa/falha do `generationStatus` retornado pela listagem e manter ações reais de
cancelamento/retry, sem criar uma fonte fictícia para detalhes de erro. Sensores e
screenshots da matriz serão registrados após o patch.

Checkpoint corretivo: os testes focados inicialmente falharam ao renderizar a barra
porque quatro nomes de ícones não existiam no registry compartilhado. A barra foi
ajustada para usar somente `refresh-cw`, `triangle-alert`, `x` e `shield-check`; a
validação será repetida junto com F14.

O teste subsequente revelou o quinto nome inválido `sparkles` no CTA de regeneração;
ele também foi mapeado para `refresh-cw` antes da nova execução dos sensores.

Checkpoint de implementação: a `DocumentVersionDecisionBar` passou a mapear o
`generationStatus` real para geração/falha, mostrar cancelar/retry com as actions
existentes e adaptar título, ícone, chip, mensagem e ações aos estados de versão e
edição manual. Os testes da composição foram ampliados; a validação ainda está
pendente.

Checkpoint corretivo: a primeira execução revelou que quatro nomes de ícone do Pencil
não estavam disponíveis no wrapper HMS. Eles foram substituídos por equivalentes
existentes (`refresh-cw`, `triangle-alert`, `check`, `shield-check` e `x`); a suíte
será reexecutada.

Checkpoint de formatação: o Biome formatou os três arquivos alterados da matriz sem
alterar o comportamento.

Checkpoint de asserção: a verificação de data foi tornada compatível com a pontuação
produzida pelo `Intl.DateTimeFormat('pt-BR')`, preservando a intenção visual do teste.

Checkpoint de cobertura: foram adicionados casos da matriz para rejeitado, vigente e
edição manual, incluindo a ausência de aprovar/rejeitar ou tornar vigente quando as
ações não se aplicam.

Checkpoint de formatação: o Biome formatou os dois arquivos alterados neste
checkpoint.

Checkpoint de teste: a asserção do estado rejeitado passou a aceitar a duplicação
intencional do status entre cabeçalho e card de decisão.

Checkpoint de formatação final: o Biome foi aplicado aos quatro arquivos da
composição da review; somente a formatação pendente do page index foi alterada,
sem mudança de comportamento.

## F13-T1 — verificado

O teste focado da página de revisão passou 8/8 e o `biome check` focado passou nos
quatro arquivos da matriz. A barra deriva `pending`/`running`/`failed` da API,
reutiliza cancelamento e retry existentes e mantém ações incompatíveis ausentes
em revisão, rejeição, aprovação vigente e edição manual. O check global continua
afetado por findings preexistentes em Identity e `react-pdf`. Browser Use não
estabeleceu conexão com o daemon e a sessão Playwright compartilhada estava
ocupada; por isso não foi registrado screenshot de browser como evidência desta
última alteração. A inspeção Pencil foi feita no arquivo correto
`design/hms.pen` para os sete nodes solicitados.

`pnpm --filter web check:types` permanece bloqueado por erros preexistentes em
Identity/shared (props dos dialogs e variáveis não usadas) e pela dependência ou
tipagem ausente de `react-pdf`; nenhum diagnóstico aponta para os arquivos da F13.

## F15 — Chip de status compartilhado no histórico de versões

Checkpoint de implementação: criado `DocumentVersionStatusChip` como fonte única
para os chips de `Em revisão`, `Rejeitado`, `Aprovado`, `Gerando` e `Falha na
geração`. O histórico deixou de usar variantes próprias de `Badge`, e a decision
bar passou a consumir o mesmo renderer. Sensores pendentes.

Checkpoint corretivo: o tipo do ícone foi alinhado ao `IconName` compartilhado e a
composição voltou a usar `cn`; a correção foi apenas estrutural.

Checkpoint de formatação: o Biome formatou o chip compartilhado e o histórico;
nenhuma mudança comportamental foi introduzida.

Checkpoint corretivo: restaurado o import de `Badge` usado somente pelo marcador
independente `Vigente`; o chip de status continua sendo o renderer compartilhado.

## F15-T1 — verificado

O teste focado da review page passou 9/9 e o `biome check` passou nos três widgets
alterados. A implementação garante que o histórico e a decision bar renderizam o
mesmo chip para revisão, rejeição, aprovação, geração e falha; `Vigente` permanece
como marcador independente.

## F16 — Dialog de rejeição alinhado ao RGqCe

Checkpoint de implementação: o dialog foi aproximado do node `RGqCe` com largura
compacta, header/footer distintos, textarea fixa, tipografia reduzida, close em
círculo, botões pill e ação destrutiva preenchida. A regra funcional continua sendo
motivo não vazio, conforme a Spec; o mock não alterou o contrato para exigir 10
caracteres. Sensores pendentes.

Checkpoint de formatação: o Biome formatou o dialog de rejeição sem alterar seu
comportamento.

## F16-T1 — verificado

O teste focado da review page passou 10/10 e o `biome check` passou no dialog. A
composição visual foi alinhada ao `RGqCe` sem alterar a regra funcional de motivo
não vazio nem o payload da decisão.

## F17 — Escala tipográfica do dialog de rejeição

Checkpoint de implementação: aumentados os tamanhos do título, descrição, label,
textarea, helper e botões para melhorar legibilidade no dialog, preservando a
composição do `RGqCe` e o contrato da decisão. Sensores pendentes.

## F17-T1 — verificado

O teste focado da review page passou 10/10 e o `biome check` passou no dialog de
rejeição após o ajuste tipográfico.

## F18 — Cobertura unitária do review page hook

Checkpoint de implementação: adicionada suíte dedicada para
`useConsultationDocumentReviewPage`, cobrindo derivação de view model e histórico,
sincronização de draft, navegação dirty, decisões, conflito, geração/cancelamento,
retry e localização de marcadores. Sensores pendentes.

Checkpoint corretivo: corrigida a sincronização dos mocks com `rerender` e a ordem
das atualizações dirty antes da navegação; nenhuma alteração foi feita no hook.

Checkpoint corretivo: o `rerender` foi limitado ao caso que troca a versão mockada,
mantendo o cenário de navegação dirty independente.

Checkpoint corretivo: declarado o `rerender` no teste de sincronização de versão;
nenhuma alteração foi feita no hook.

## F18-T1 — verificado

O teste dedicado do hook passou 8/8, a suíte combinada do hook e da review page
passou 21/21, e o `biome check` passou no novo arquivo de teste.

## F14 — Data e hora nos metadados da versão

Checkpoint inicial: o review view model formatava `createdAt` somente como data
curta. A alteração inclui `timeStyle: 'short'` no formatter `pt-BR`, sem alterar o
contrato ISO nem criar formatos divergentes entre cabeçalho e histórico. A
validação final está pendente.

Checkpoint corretivo: a asserção que validava somente a data foi reforçada para
exigir também `HH:mm`, mantendo tolerância ao ano curto/longo do runtime Intl.

## F14-T1 — verificado

O teste focado da página de revisão passou 6/6 e `pnpm --filter web check:code`
passou. No browser autenticado, o cabeçalho exibiu data e hora no formato
`14/08/2026, 08:18`; os endpoints de documentos, versão, clientes e colaborador
retornaram 200. Console final: 0 erros e 0 warnings. Screenshot:
`consultation-document-review-date-time.png`.

## F15 — Dialog linear de histórico alinhado ao Q5lD9

Checkpoint de preflight: o Pencil MCP confirmou o editor ativo em
`/home/petros/projects/hms/design/hms.pen`, com schema disponível, e renderizou o
node `Q5lD9` (`Modal/Histórico de versões`). O frame define superfície de 680 px,
header contextual, divisor, linhas lineares com status/vigência, metadados e ação
**Visualizar** alinhada à direita. A implementação em código foi limitada ao
widget do dialog e ao teste de composição, sem alterar o arquivo Pencil.

Checkpoint de implementação: o dialog deixou de usar cards independentes e footer
genérico. Agora usa uma lista linear com divisores, chips semânticos com ícones,
metadados de origem/data, vigência explícita e ação de visualização; no mobile as
linhas refluem em coluna. O teste fixa a versão corrente no fixture para validar o
chip **Vigente** sem alterar a autoridade do servidor.

## F15-T1 — verificado

Quality Gate focado: o teste da review page passou 9/9, o Biome passou nos dois
arquivos alterados e `git diff --check` passou. No browser autenticado, a rota real
abriu o dialog com largura de 680 px em 1440 px e 358 px em 390 px. O snapshot
confirmou cabeçalho contextual, lista linear, divisores, status, metadados de
origem/data, motivo de rejeição e três ações **Visualizar**. O Tab alcançou a
primeira ação do dialog; `documentWidth` e `bodyWidth` permaneceram em 390 px.
As requisições de documentos, versão, clientes e colaborador retornaram 200.
Após o reload que eliminou mensagens transitórias de HMR, o console não registrou
erros ou warnings novos; o warning histórico do `__root__` permanece preexistente.

Screenshots:
`consultation-document-version-history-q5ld9.png` e
`consultation-document-version-history-q5ld9-mobile.png`.

## F16 — Cabeçalho sem duplicação de status

Checkpoint de implementação: o chip de status foi removido somente da faixa de
metadados do cabeçalho. Origem e data/hora continuam visíveis, enquanto o status
permanece no card **Decisão da versão**, evitando duas apresentações concorrentes
do mesmo estado.

## F16-T1 — verificado

O teste focado passou 9/9 e o Biome passou nos dois arquivos alterados. A validação
browser autenticada confirmou o cabeçalho sem chip em 1440 px e 390 px; a decisão
da versão manteve status e ações, e a página não apresentou overflow horizontal.
As APIs de documentos, versão, clientes e colaborador retornaram 200. Console:
0 erros e 0 warnings novos após reload. Screenshots:
`consultation-document-review-header-no-status.png` e
`consultation-document-review-header-no-status-mobile.png`.

## F17 — Dialog de nova versão alinhado ao CcIqS

Checkpoint de preflight: o Pencil MCP confirmou o editor ativo em
`/home/petros/projects/hms/design/hms.pen`, com schema disponível, e renderizou o
node `CcIqS` (`Adjust Dialog`). O frame define superfície de 480 px, cabeçalho com
divisor, corpo, rodapé separado e ações pill. A implementação preserva o contrato
atual, que não aceita instruções no body da geração.

Checkpoint de implementação: o dialog agora usa título sem interrogação, fechamento
no cabeçalho, corpo contextual, rodapé separado, botões pill e ícone de geração.
Checkpoint corretivo: a primitiva `AlertDialog` aplicava `max-w-lg` com maior
especificidade; o limite foi elevado em precedência para que o dialog tenha os
480 px definidos no node `CcIqS`.
O teste da composição cobre abertura, conteúdo, fechamento e ações.

## F17-T1 — verificado

O teste focado da review passou 10/10 e o Biome passou nos dois arquivos alterados.
No browser autenticado, o dialog mediu 480 px em viewport desktop e 390 px em
viewport mobile, mantendo `documentWidth` e `bodyWidth` iguais ao viewport. O Tab
alcançou **Gerar nova versão**, **Cancelar** fechou o dialog e as APIs reais
retornaram 200. Console: 0 erros e 0 warnings novos após reload.

Screenshots: `consultation-regenerate-dialog-cciqs.png` e
`consultation-regenerate-dialog-cciqs-mobile.png`.

## F19 — Instruções da nova versão

Checkpoint de implementação: o dialog `CcIqS` recebeu o campo obrigatório
**Instruções para a nova versão**, com limite de 4.000 caracteres, confirmação
bloqueada para texto vazio e hint de revisão antes da liberação. O valor é trimado
no submit e enviado pelo adapter REST.

Checkpoint de contrato: `POST .../generations` passou a aceitar body opcional
`{ instructions }`, mantendo a geração inicial compatível. O use case valida a
entrada, o evento individual carrega o texto, e `GenerateDocumentJob` encaminha o
campo pelo workflow até os prompts do redator e do revisor. A rota em lote não foi
alterada.

Quality Gate: Core 2/2, validation 19/19, controller REST 2/2 e web 13/13;
checks de tipos passaram em Core, validation, server e web; Biome passou nos
arquivos alterados e `git diff --check` passou. A validação browser autenticada
da interação confirmou o modal em desktop e viewport estreito.

Checkpoint corretivo: a inspeção visual encontrou **Cancelar** desabilitado junto
com a confirmação no estado vazio. A regra foi ajustada para bloquear somente
**Gerar nova versão**; o cancelamento permanece sempre disponível fora de uma
requisição em andamento.
O Biome foi executado novamente após a correção e `git diff --check` permaneceu verde.
O teste de composição também fixa que **Cancelar** permanece habilitado no estado vazio.
Browser autenticado: o dialog mediu 480 px em 1440 px e 390 px no viewport estreito,
sem overflow horizontal. O snapshot confirmou o campo, **Cancelar** ativo sem
instruções e **Gerar nova versão** desabilitado até o preenchimento; depois do
preenchimento, a ação ficou ativa. As APIs reais retornaram GET 200, com zero erros
e zero warnings novos no console. Screenshots: `consultation-regenerate-dialog-instructions.png`
e `consultation-regenerate-dialog-instructions-mobile.png`.

## F20 — Estado otimista imediato após regeneração

O sensor encontrou uma lacuna: a review page usava apenas `isPending` da mutation.
Após o `202`, essa flag podia voltar a `false` antes de a query receber o status
persistido, ocultando **Gerando** durante o primeiro ciclo de polling.

Correção aplicada: a view model agora também usa `pendingDocumentIds` do action hook,
que é preenchido em `onMutate` e permanece até a conclusão observada. O teste de
composição cobre a combinação `isGeneratingDocument: false` + documento pendente.
O mesmo estado otimista é suprimido após cancelamento confirmado, evitando que o
`204 No Content` deixe a barra presa em **Gerando**.
A derivação também ignora temporariamente `pending/running` de uma query atrasada,
até que a listagem autoritativa seja atualizada.

Quality Gate: teste focado da review page passou 13/13; Biome e `git diff --check`
passaram. A evidência browser deve confirmar a transição sem retornar ao estado
anterior após a resposta `202`.

Evidência browser autenticada: a geração real retornou `202 Accepted` e a barra
mostrou **Gerando** no snapshot imediatamente seguinte. O cancelamento real retornou
`204 No Content`; após reload, a tela não permaneceu em **Gerando**. Console final:
0 erros e 0 warnings novos; GETs de documentos e versão retornaram 200.

## F18 — Motivo de rejeição consultável

Checkpoint de preflight: o Pencil MCP confirmou o editor ativo em
`/home/petros/projects/hms/design/hms.pen` e renderizou o node `RGqCe`, que define
o padrão visual de dialog usado para esta interação.

Checkpoint de implementação: **Ver motivo** passou de texto estático para botão
acessível na decision bar. O novo `ViewRejectionReasonDialog` exibe o
`rejectionReason` persistido sem edição e permite fechar pelo botão **Fechar** ou
pelo controle de fechamento; o page hook controla o estado e o limpa ao trocar de
versão. O teste de composição foi ampliado para abrir, verificar o texto e fechar
o dialog.

Checkpoint de formatação: o Biome formatou os cinco arquivos da interação; somente
o teste recebeu ajuste automático de layout, sem alteração comportamental.

## F18-T1 — verificado

O teste focado da review page passou 10/10 e o `biome check` passou nos cinco
arquivos da interação. O texto persistido é exibido sem edição e o dialog fecha por
**Fechar** ou pelo controle de fechamento, sem mutation. O node `RGqCe` foi
renderizado no Pencil ativo `design/hms.pen`. Browser Use falhou no diagnóstico
porque o daemon não ficou ativo; não foi registrado screenshot manual desta
alteração.

## Sensores e findings

F1-T1 — verificado. `pnpm --filter @hms/core check-types`, `pnpm --filter
@hms/core lint`, `pnpm --filter @hms/core test` (49 arquivos / 182 testes) e
`git diff --check` passaram.

F2-T2 — verificado em código. `pnpm --filter web check:code` e `git diff --check`
passaram. `pnpm --filter web check:types` encontrou o finding preexistente em
`apps/web/src/ui/document-production/widgets/pages/document-viewer/index.tsx`:
dependência `react-pdf` ausente. O finding não foi introduzido por esta tarefa e
permanece pendente de classificação no Quality Gate.

F1-T2 — verificado. O teste focado do adapter (3 testes), Biome focado e
`git diff --check` passaram. Os checks web completos continuam afetados somente
por findings preexistentes em `document-editor`/`react-pdf`; nenhum erro foi
atribuído aos arquivos de F1-T2.

F1-T3 — verificado. Teste focado do RestContext (2 testes), `check:code` e
`git diff --check` passaram. O `check:types` anterior apontou apenas o finding
preexistente em `document-viewer`.

F2-T1 — verificado. `check:code`, `check:types`, teste do editor (5/5), testes
administrativos (21/21) e `git diff --check` passaram; a promoção do editor
removeu o finding transitório de `document-editor`. Pencil confirmou o arquivo
correto e os frames visuais da Spec.

F2-T2 — verificado. `check:code`, `check:types` e `git diff --check` passaram.

F3-T1 — verificado. Biome, `check:types` e 3 testes focados de query/actions
passaram. O polling otimista usa baseline, attempt ID, 202/409, refetch em 3s,
timeout neutro de 2 minutos e não mantém callbacks de tentativa obsoleta.

F3-T2 — verificado. Biome, `check:types` e 20 testes focados da página/hooks
passaram após corrigir asserções ambíguas de estados repetidos.

F3-T3 — verificado. `generate-routes`, `check:code`, teste focado (6/6) e
`git diff --check` passaram. O gerador emitiu apenas aviso preexistente; o
`check:types` amplo ainda acusa testes F3-T2 e `document-viewer`/`react-pdf`.

F4-T1 — verificado. Testes focados (10/10), Biome e `git diff --check` passaram;
as actions mantêm bodies estritos, invalidam list/detail e tratam 409 sem falso
sucesso. O `check:types` amplo continua com o finding preexistente de `react-pdf`.

F4-T2 — verificado. Teste de composição real (4/4), Biome e `git diff --check`
passaram, cobrindo queries paralelas, dirty state, decisões e estados de erro.

F4-T3 — verificado. `generate-routes`, `check:code`, teste focado (4/4) e
`git diff --check` passaram. `check:types` amplo segue afetado fora do escopo.

F5-T1 — verificado. O fixture autenticado foi corrigido para executar o login pela
UI no cenário isolado, com transporte Supabase e `complete-sign-in` mockados antes
da navegação protegida. Os dois testes de rota passaram com 4/4: listagem e
navegação, geração em lote em viewport estreito com teclado, abertura de versão,
aprovação via PATCH e conflito 409 com refetch autoritativo e aviso recuperável.
O título da review é um parágrafo conforme a composição visual; a mensagem de
conflito não declara sucesso. O aviso do gerador sobre `index.test.ts` é
preexistente.

F5-T2 — verificado com blockers preexistentes. `generate-routes`, `check:code` e
os 4 testes de integração focados passaram. `check:types` e `build` falharam
somente ao resolver `react-pdf` no `document-viewer` preexistente; a suíte web
passou 201/202, com timeout isolado no teste preexistente de
`collaborator-register-dialog`. O aviso do gerador sobre `index.test.ts` também
é preexistente.

F5-T3 — verificado com blockers preexistentes. DB/Auth/Nest
estavam saudáveis; o login real da seed lawyer, a rota protegida, listagem,
gerações individual/lote `202`, polling, snapshots, viewport 390px, teclado,
network e console atual sem erros foram observados via Playwright MCP/CDP. O
workflow não materializou versão durante a janela, então review/manual/vigência
não puderam ser exercitados server-backed. O Pencil confirmou agora
`/home/petros/projects/hms/design/hms.pen` ativo; os nodes `F9JxU`, `hq7Ty` e
`Y5vBQ` foram renderizados com sucesso e sem layout quebrado.

F5-T4 — verificado com blockers preexistentes. O único Judge Implementation Final
foi reutilizado em modo read-only após as correções e retornou
`passed_with_preexisting_blockers`. Os achados JI-01, JI-02 e JI-04 foram
resolvidos: a conclusão exige aumento estrito de `versionNumber`; o polling
carrega o `consultationId`, invalida tentativas antigas e limpa timers em troca de
consulta/unmount; e o login mockado foi isolado no fixture específico da feature,
com o fixture global restaurado. JI-03 foi classificado como autorizado porque a
alteração do prompt de create-plan foi solicitada explicitamente pelo usuário.

F6-T5 — verificado. Corrigido o tratamento de erro das ações de geração individual
e em lote: `409 Conflict` não inicia polling e remove imediatamente o documento
do estado otimista `pending`; erros de transporte continuam usando `onError` para
limpar o estado. O teste focado dos hooks passou 12/12 e o Biome focado passou.
No browser autenticado, o POST real retornou 409 para a geração ativa órfã e o
snapshot seguinte mostrou `Não gerado` e o botão `Gerar documento`, sem
`Aguardando resultado`. O console registrou somente o erro de rede esperado do
HTTP 409. O typecheck amplo segue bloqueado pelo finding preexistente de
`react-pdf` ausente em `document-viewer`.

F6-T6 — verificado. A listagem server-backed passou a expor o status da última
geração por documento, e o page hook trata `pending/running` persistidos como
`Gerando`. A ação `Gerar documento` deixa de aparecer mesmo após reload enquanto
há uma geração ativa. Core 2/2, Web 17/17, controller REST 1/1, server
`check:types` e Biome focado passaram. No browser, o GET real retornou
`generationStatus: "running"` e o snapshot confirmou `Gerando` sem o botão de
geração.

F6-T7 — verificado. As ações individual e em lote agora refazem a listagem após
`409`, permitindo que o estado local convirja para `generationStatus: "running"`
ou `"pending"` quando a geração ativa não estava no cache anterior. Web 17/17,
Biome focado e `git diff --check` passaram.

Blockers restantes, não causais à feature: `react-pdf` ausente bloqueia
`check:types`/build; timeout isolado no teste preexistente de
`collaborator-register-dialog`; e o workflow backend não materializou uma versão
durante a janela do browser, impedindo a validação server-backed completa de
review/edição manual/vigência. Não foi criado um segundo Judge.

## Seleção persistente e modal

A revisão 6 incorporou a solicitação explícita de manter o status de geração ativo
autoritativo após reload, além de implementar o modal do Node `AjCXk` e os
endpoints server-backed. O fluxo foi validado com o arquivo Pencil
`/home/petros/projects/hms/design/hms.pen`: o modal usa busca, filtros de área/tema,
checkboxes, contagem, cancelar e salvar, sem overflow no viewport estreito.

Os endpoints `GET` e `PUT /consultations/:consultationId/documents/selection` foram
implementados com autorização, validação Zod, materialização de documentos e
substituição transacional das associações do pacote. Os testes focados dos dois
controllers passaram; Core passou 182/182; server `check:types` passou; o teste da
composição web passou 6/6.

No fluxo real autenticado, o modal foi aberto, um modelo foi desmarcado e a seleção
foi persistida. Network: GET selection 200, PUT selection 200 e GET documents 200.
Console final: zero erros e zero warnings.

## Regra administrativa pós-validação

Após a validação final, foi solicitado que administradores tenham acesso total a
qualquer consulta. A regra foi implementada nos sete use cases de documentos da
consulta e propagada pelos controllers REST via `collaborator.profile`. Os testes
do Core cobrem o acesso administrativo em listagem, leitura, geração individual e
em lote, edição manual, revisão e seleção de vigência; os sete testes de
controllers REST também passaram. O PRD externo não foi alterado porque a
solicitação não autorizou mutação no Atlassian; a divergência está registrada na
Spec revisão 8.

## Cancelamento de geração — checkpoint F7-T1

Implementação iniciada. O Core ganhou um use case de contexto que valida a
consulta, a associação do documento ao pacote e o acesso de administrador ou
advogado associado antes de delegar ao cancelamento persistido da geração. O
controller expõe `POST /consultations/:consultationId/documents/:documentId/generations/cancel`
com resposta `204`; a action web invalida a listagem após sucesso e a linha em
estado **Gerando** passou a renderizar o botão **Cancelar geração**.

O cancelamento reutiliza `DocumentGenerationCancelledEvent`, já consumido pelo
job Inngest por `cancelOn`, portanto a execução assíncrona não recebe uma nova
regra de transporte. Testes focados e fluxo browser ainda estão pendentes; este
checkpoint não é evidência de aceite final.

O primeiro sensor `pnpm --filter web check:code` encontrou somente formatação nos
dois hooks novos; a correção foi aplicada no mesmo checkpoint. Core e server
`check:types` passaram.

O fixture de controller foi ampliado com o repositório de gerações e seed de uma
geração `running`; isso habilita a asserção de persistência e evento no teste REST.
O teste Core do contexto de Consulta cobre o caminho administrativo e a proteção do
advogado não associado; o teste focado passou 2/2.
O teste REST do controller foi adicionado com seed de geração `running` e verifica
resposta 204, persistência `cancelled` e publicação do evento; passou 1/1.
O teste do adapter foi ampliado para dez operações e agora verifica o path do POST
de cancelamento; passou 3/3. O `check:code` web também passou. O teste do hook foi
adicionado para validar POST 204 e invalidação da lista; passou 13/13. Os testes do
page hook e da composição real foram ampliados para o botão de cancelamento; ainda
passaram 13/13. O comportamento do botão, do estado persistido `running` e do
bloqueio durante mutation está coberto; os testes focados passaram 13/13 e o
`check:code` web passou novamente; o caso de composição foi nomeado para refletir
explicitamente o bloqueio durante o cancelamento.

A solicitação direta do usuário amplia a revisão 6, que antes declarava
cancelamento fora de escopo. O PRD externo não foi alterado; a divergência fica
registrada para sincronização posterior.

## F7-T1 — verificado

Sensores focados: Core 2/2, controller REST 1/1, adapter 3/3, hooks 13/13,
page hook/composição 13/13 e `pnpm --filter web check:code` passaram.

No fluxo autenticado server-backed, o botão **Cancelar geração** foi acionado para
o documento `15aa4fde-da7e-4980-9cf0-6003b7e33f95`. O request
`POST /consultations/00000000-0000-4000-8000-000000000101/documents/15aa4fde-da7e-4980-9cf0-6003b7e33f95/generations/cancel`
retornou `204 No Content`. O GET autoritativo posterior retornou
`generationStatus: "cancelled"`; o snapshot mostrou **Não gerado** e **Gerar
documento**. Console final: 0 erros e 0 warnings. Screenshot capturado como
`consultation-generation-cancelled.png`.

O Inngest job existente já observa `DocumentGenerationCancelledEvent` por
`cancelOn`; o teste Core e o controller também confirmaram a publicação do evento.

Quality Gate F7: `pnpm --filter @hms/core check-types`, `pnpm --filter server
check:types`, `pnpm --filter web check:code`, 30 testes web focados e
`git diff --check` passaram. `pnpm --filter web check:types` permanece bloqueado
somente pelo finding preexistente de módulo `react-pdf` ausente e `totalPages`
implícito em `document-viewer/index.tsx`; nenhum erro foi atribuído ao
cancelamento.

Correção pós-gate: o page hook passou a limpar a precedência do estado otimista
somente depois do sucesso do cancelamento. O teste adicional cobre geração iniciada
na mesma sessão e evita regressão para **Gerando**. Os testes de página passaram
14/14 e `check:code` web passou novamente. O conjunto web focado completo
(adapter, hooks e página) passou 30/30 após a correção.

Revalidação browser same-session: geração real retornou `202 Accepted`, cancelamento
imediato retornou `204 No Content` e o snapshot seguinte exibiu **Não gerado** com
**Gerar documento**. Não houve regressão para **Gerando**; console final permaneceu
sem erros/warnings. Screenshot: `consultation-generation-cancelled-same-session.png`.

## F8-T1 — checkpoint

A lista documental foi simplificada para não renderizar versão, quantidade de
versões ou o controle **Ver histórico**. O histórico continua pertencendo à página
de revisão. O teste de página passou 14/14. O primeiro `check:code` encontrou
duas quebras de formatação; a correção do fechamento do estado de timeout foi
aplicada no mesmo checkpoint. `check:code` passou e os testes de página passaram
14/14.

## F8-T1 — verificado

`git diff --check` passou. Na rota autenticada, o GET real retornou `200`; o
snapshot confirmou que cada linha mostra somente título, status e ação, sem versão,
contador ou **Ver histórico**. Console: 0 erros e 0 warnings. Screenshot:
`consultation-documents-without-inline-history.png`.

## F21 — Chip de status como widget compartilhado

`DocumentStatusChip` foi extraído para
`apps/web/src/ui/document-production/widgets/components/document-status-chip/index.tsx`.
O histórico de versões e a barra de decisão passaram a consumi-lo diretamente, e a
lista de documentos da consulta substituiu os `Badge` específicos por esse mesmo
widget. O componente cobre `Não gerado`, `Em revisão`, `Rejeitado`, `Aprovado`,
`Gerando`, `Falha na geração` e `Vigente`, mantendo os ícones e tokens visuais
semânticos em um único contrato.

Sensores: testes focados da lista, page hook e review page passaram 27/27; o
Biome focado encontrou duas quebras de formatação nos arquivos alterados, corrigidas
no mesmo checkpoint. O `pnpm --filter web check:code` passou em 344 arquivos e
`git diff --check` passou. A alteração foi validada por testes de composição; não
foi alegada validação browser nesta etapa.

## F22 — Seleção aditiva e bloqueio de remoção

O modal de seleção foi alinhado ao `design/hms.pen#AjCXk`: superfície ampla,
subtítulo contextual, busca com placeholder do design, filtros com labels e ícones,
lista linear com divisores e rodapé de ação. Modelos que já possuem associação no
pacote são visualmente desabilitados, mostram **Já adicionado** e não respondem a
tentativas de desmarcação. O contador e o CTA contam apenas novos modelos, enquanto
o payload preserva todos os IDs existentes.

O `ReplaceConsultationDocumentSelectionUseCase` agora lê as associações atuais
antes de criar/substituir o pacote e rejeita com `400` qualquer request que omita
um modelo já adicionado. O teste REST confirma que a tentativa não remove os dois
documentos persistidos; o teste de composição confirma bloqueio, contador e payload
completo. Sensores e Browser Use final ainda serão executados após a formatação.

Checkpoint de formatação: o Biome formatou o dialog, o teste de composição e o
caso de uso; o controller não precisou de ajuste. Nenhuma mudança comportamental
foi introduzida pela formatação.

Checkpoint corretivo: a asserção inicial esperava a quantidade total do pacote;
ela foi corrigida para verificar apenas novas adições, conforme o contador e o CTA
do node `AjCXk`. Não houve mudança na implementação funcional.

Quality Gate focado: composição web 8/8, controller REST 3/3, `@hms/core
check-types`, Biome nos arquivos alterados e `git diff --check` passaram. A
validação browser autenticada do modal e a inspeção final de console/rede ainda
serão registradas.

Checkpoint corretivo de responsividade: a inspeção inicial em 390 px encontrou
overflow interno causado pelo layout rígido do rodapé e pela combinação de badge e
descrição. O dialog foi ajustado para `min-w-0`, footer refluível e linhas com quebra
segura; a validação narrow será repetida após o Biome.

Checkpoint corretivo visual: a segunda inspeção identificou compressão excessiva do
texto quando o badge permanecia na mesma linha. O badge agora reflowa para uma linha
própria no narrow, preservando a leitura do título e da descrição.

Checkpoint corretivo de flexbox: a primeira versão do reflow colapsou o bloco textual
em largura zero; a regra foi ajustada para largura integral no narrow e `flex-1` só
no desktop. A inspeção final será repetida.

Checkpoint corretivo estrutural: o reflow passou a ocorrer no agrupamento interno de
ícone, texto e marcador; o título/descrição permanecem juntos e o badge ocupa a
linha seguinte somente no narrow.

Revalidação de código: Biome, composição web 8/8 e `git diff --check` passaram após
o ajuste final; `@hms/core check-types` e controller REST 3/3 também permanecem
verdes.

Validação browser autenticada: a rota real abriu o modal `AjCXk` com 768 px em
1440 px, exibindo os três documentos atuais como checkboxes desabilitados e
**Já adicionado**; o contador ficou em `0 selecionados` e o CTA de adição ficou
desabilitado, sem permitir remoção. Em 390 px, a superfície mediu 358 px e não
houve overflow (`documentWidth=390`, `bodyWidth=390`, `dialogScrollWidth=358`).
O caminho de teclado avançou da busca para **Área jurídica**. Network atual:
GET `/consultations/.../documents` 200 e GET `/consultations/.../documents/selection`
200. Console desde a navegação: 0 erros e 0 warnings. Screenshots:
`consultation-select-documents-ajcxk-final.png` e
`consultation-select-documents-ajcxk-mobile-final.png`.

O log acumulado do perfil continha erros antigos de uma rota de revisão com 404 e
uma advertência de hooks durante HMR; `all:false` após a navegação desta validação
retornou zero erros, e nenhum desses registros foi causado pelo modal F22.

Checkpoint final de contrato/cabamento: criada a exceção Core
`ConsultationDocumentSelectionRemovalError`, com mensagem explícita para requests
que tentam remover associações existentes; o close do dialog recebeu o tratamento
circular do AjCXk. Sensores focados serão repetidos após este patch.

Quality Gate pós-patch: Core `check-types`, controller REST 3/3, composição web 8/8,
Biome nos arquivos alterados e `git diff --check` passaram. O `web check:types`
continua bloqueado somente pelos erros preexistentes de `react-pdf` em
`identity/widgets/pages/document-viewer`.

Revalidação browser pós-patch: a superfície final mediu 768 px em 1440 px, com
`documentWidth=1440`, `bodyWidth=1440` e `dialogScrollWidth=768`; GET de documentos
e seleção retornaram 200 e o console desde a última navegação permaneceu em zero
erros. As screenshots desktop/mobile foram atualizadas após o close circular.

F22-T2 — ajuste visual: corrigida a diferença de altura entre os botões do rodapé;
o CTA agora usa o mesmo `size='sm'` do **Cancelar** e mantém largura própria pelo
padding horizontal.

Browser confirmou `height=36px` para **Cancelar** e **Adicionar 0 documentos**;
ambos permanecem alinhados, com o CTA desabilitado sem novas adições. A screenshot
foi registrada como `consultation-select-documents-equal-buttons.png`. Composição
web 8/8, Biome e `git diff --check` passaram.

F22-T3 — ajuste óptico: aplicado `mt-2.5` ao checkbox para que o check fique
centralizado verticalmente com o ícone do documento, em vez de permanecer acima
dele nas linhas altas.

Browser confirmou os centros alinhados nas três linhas (`delta=0px` em todos os
itens). A evidência visual foi registrada em
`consultation-select-documents-aligned-check.png`; composição web 8/8, Biome e
`git diff --check` passaram.

F22-T4 — dependência dos filtros: o `Select` de **Tema jurídico** agora recebe
`disabled` quando a área está em “Todas as áreas”, e o teste de composição confirma
esse estado inicial. A troca de área existente continua resetando o tema.

Checkpoint corretivo: o matcher `toBeDisabled` não faz parte da configuração atual;
o teste foi ajustado para verificar o atributo `disabled` diretamente.

Validação F22-T4: composição web 8/8, Biome e `git diff --check` passaram. No
browser autenticado, **Tema jurídico** apareceu desabilitado com **Área jurídica**
em “Todas as áreas”; as requisições reais de documentos e seleção retornaram 200 e
o console da navegação ficou sem erros ou warnings.

Checkpoint documental: referências antigas que descreviam o `AjCXk` como
design-only ou a seleção como client-only foram corrigidas na Spec; o registro
histórico da implementação anterior permanece preservado e é superseded pela F22.

## F24 — Rodapé do modal de seleção com ações pill

O botão **Cancelar** do modal de seleção foi alinhado ao padrão do Node Pencil
`SQoVa`/`yR4IE`: agora usa `rounded-full`, assim como o CTA **Adicionar N documentos**.
O estado desabilitado do CTA foi preservado.

Sensores: teste de composição da lista, `pnpm --filter web check:code` e
`git diff --check` passaram. Não foi alegada validação browser nesta etapa.

## F25 — Ocultar CTA durante geração em lote

O cabeçalho da página de documentos agora remove o botão **Gerar documentos**
enquanto `isBatchGenerating` estiver ativo, em vez de mantê-lo visível com o texto
**Gerando documentos...**. **Selecionar documentos** permanece disponível.

Sensores: testes da lista e page hook passaram 16/16; `pnpm --filter web
check:code` passou em 344 arquivos e `git diff --check` passou. Não foi alegada
validação browser nesta etapa.

## F23 — Radius pill na barra de decisão

A `DocumentVersionDecisionBar` passou a aplicar `rounded-full` às ações de ação,
seguindo o componente de referência Pencil `design/hms.pen#SQoVa`
(`Button/Primary/Default`). O link **Ver motivo** permaneceu textual, sem receber
uma caixa ou radius artificial.

Sensores: teste focado da review page passou 13/13; `pnpm --filter web check:code`
passou em 344 arquivos e `git diff --check` passou. Não foi alegada validação
browser nesta etapa.

## F25-T1 — reparação do seed documental verificada

O diagnóstico do seed confirmou que o banco local tinha aplicado a migração
`0014_noisy_true_believers`, mas não a `0014_flippant_the_initiative`, apesar de
o journal atual apontar para a segunda. Como o timestamp da migração aplicada era
posterior, o Drizzle pulou a criação de `document_batches`; o erro original era
schema drift, não uma falha no `RealDocumentsSeeder.clear()`.

Foi gerada a migração customizada
`apps/server/src/shared/database/drizzle/migrations/0025_repair_document_batch_tables.sql`,
com criação idempotente dos tipos e tabelas documentais, `daily_counters`, chaves
estrangeiras e índices. Também foi gerada
`0026_create_documents_storage_bucket.sql`, que cria o bucket privado `documents`
quando ausente. `SUPABASE_STORAGE_BUCKET` passou a exigir valor não vazio e usar
`documents` como default; os dois `.env.example` foram alinhados.

Evidências locais:

- `pnpm db:migration:apply`: 0025 e 0026 aplicadas com sucesso;
- schema PostgreSQL: `daily_counters`, `document_batches` e
  `document_batch_files` presentes; tipos `document_batch_status`,
  `document_channel` e `document_status` presentes;
- Storage: bucket `documents` presente e privado;
- `pnpm --filter server build`: passou;
- `pnpm --filter server check:types`: passou;
- Biome focado no provider e `git diff --check`: passaram;
- `pnpm db:seed`: passou, com `consultationId`
  `00000000-0000-4000-8000-000000000101` e três `documentIds` registrados;
- contagens após o seed: 40 `document_batches`, 140
  `document_batch_files` e 1 `daily_counters`.

O `pnpm --filter server check:code` global continua com 10 findings de formatação
em snapshots Drizzle históricos (`0017`–`0025`) que já não seguem o formatter
atual; esses arquivos não foram reformatados para evitar alteração não relacionada.

### F25-T2 — compatibilidade de migração verificada

Após revisar a matriz de fixtures, a criação do bucket foi encapsulada em um bloco
condicional que só executa contra `storage.buckets` quando essa relação existe.
Isso preserva o provisionamento no Supabase local e evita que os bancos PostgreSQL
puros dos testes falhem ao aplicar a migração 0026. O provider continua com
`documents` como default explícito, e o schema local validado permanece com o bucket
privado criado.

O `.env` local do web foi alinhado com `VITE_SUPABASE_STORAGE_BUCKET=documents`,
fechando a configuração compartilhada entre seed, backend e viewer.

## F26-T1 — limpeza completa do Auth verificada

O contrato `AuthAdministrationProvider` recebeu `removeAllUsers()`. A implementação
Supabase pagina `auth.admin.listUsers` com `perPage=1000`, armazena todos os IDs e só
então chama `auth.admin.deleteUser` para cada usuário. Isso substitui a limpeza
anterior limitada aos cinco e-mails fixos do seed.

`IdentitySeeder.clear()` executa essa operação antes de remover e recriar as
identidades persistidas. O fixture de identidade foi atualizado para o novo contrato.

Evidências:

- `pnpm --filter @hms/core check-types`: passou;
- `pnpm --filter server check:types`: passou;
- Biome focado nos quatro arquivos do provider/seeder/fixture: passou;
- teste `supabase-auth-providers.test.ts`: 13/13 passou, incluindo usuários em
  duas páginas e duas exclusões;
- nenhum acesso SQL direto ao schema `auth` foi adicionado.

## F27-T1 — regra de remoção condicionada a versões

Implementação inicial registrada: o contrato de seleção agora expõe `hasVersion`;
os dois use cases consultam `DocumentVersionsRepository.findByDocumentIds`; o
backend rejeita somente a remoção de documentos com versões; e o modal bloqueia
somente essas opções. Documentos do pacote sem versão permanecem desmarcáveis e o
rodapé permite salvar uma remoção sem nova adição.

A Spec foi atualizada para a revisão 21 para refletir a regra de negócio. Os
testes e sensores desta fase ainda serão executados; o estado permanece
`in_progress` até a conclusão do Quality Gate.

Checkpoint corretivo: a primeira formatação encontrou um fechamento excedente no
CTA condicional do modal. A sintaxe foi corrigida antes da execução dos sensores;
nenhuma decisão funcional mudou.

Checkpoint de cobertura: adicionados testes Core isolados para os dois use cases,
incluindo a projeção de `hasVersion`, a remoção permitida sem versão e a exceção
para remoção de documento versionado. A execução desses novos testes ainda está
pendente neste checkpoint.

## F27-T1 — verificação final

Sensores automatizados:

- testes Core dos dois use cases: 3/3;
- controllers REST de seleção: 6/6;
- `pnpm --filter @hms/core check-types`: passou;
- `pnpm --filter server check:types`: passou;
- `pnpm --filter web check:code`: passou em 344 arquivos;
- `git diff --check`: passou.

Browser autenticado, rota real `/consultas/00000000-0000-4000-8000-000000000101/documentos`:

- GET de documentos e GET de seleção: 200;
- payload de seleção confirmou `hasVersion=true` em dois documentos e
  `hasVersion=false` em um;
- o modal bloqueou os dois versionados e exibiu **Já adicionado**;
- o documento sem versão permaneceu editável; ao desmarcá-lo, o CTA exibiu
  **Salvar seleção**;
- viewport 390×844 sem overflow: `documentWidth=390`, `bodyWidth=390`,
  `dialogScrollWidth=358`;
- teclado: foco avançou da busca para **Área jurídica**;
- console após a navegação: zero erros e zero warnings.

O modal foi cancelado após a interação, portanto a consulta seed não foi alterada
pela validação manual. O servidor foi recompilado (`pnpm --filter server build`) e
executado com o bundle atual; os containers Docker compartilhados permaneceram
intactos. A sessão temporária do servidor foi encerrada ao fim da validação.

Veredito F27-T1: verified.

Limitação preexistente mantida: `pnpm --filter web check:types` falhou somente em
`document-viewer/index.tsx` porque `react-pdf` não está instalado e porque o tipo
`totalPages` fica implícito nesse mesmo arquivo. A falha não toca o modal nem os
contratos de seleção alterados nesta fase.

Checkpoint corretivo de teste: corrigido o import runtime de `PaginationResponse` na
factory do teste de leitura; a falha era exclusiva da infraestrutura do teste.

## F28-T1 — body opcional da geração inicial corrigido

Diagnóstico: o botão individual chama o endpoint sem body quando não há instruções,
mas `generateConsultationDocumentSchema` aceitava somente um objeto presente. O
`ZodValidationPipe` interrompia a requisição com `400` antes do use case publicar o
evento, deixando a linha em **Não gerado** e sem execução no Inngest.

Correção: o schema agora usa `.default({})`; o controller continua encaminhando
`instructions` somente quando presente, e os logs de debug temporários foram
removidos. O hook também omite o terceiro argumento do adapter quando não há
instruções, mantendo a chamada sem body. Foi adicionada regressão REST para POST
autenticado sem `.send()`, que
retorna `202` e verifica a publicação de `document-production/document.generation-requested`.

Evidências:

- controller REST: 3/3 testes passaram;
- `pnpm --filter @hms/validation check-types`: passou;
- `pnpm --filter @hms/core check-types`: passou;
- browser autenticado: rota `/consultas/00000000-0000-4000-8000-000000000101/documentos`
  abriu sem erros/warnings e a linha exibiu **Gerando** após a interação de geração;
- Inngest dev server: endpoint `/api/inngest` respondeu `200`, com 10 funções
  registradas; evento individual foi publicado e recebido pelo job
  `Generate Document` durante a validação REST.

Limitação: o Browser Use/CDP local não pôde anexar ao Chrome já ocupado; a
validação visual foi executada com Playwright headless autenticado, sem mocks de
transporte. A confirmação do disparo do Inngest foi feita no dev server e no
endpoint real.

## F29-T1 — motivo de rejeição em textarea

Alteração: `ViewRejectionReasonDialog` passou a usar o wrapper HMS `Textarea`, com
`readOnly`, `rows=2`, valor persistido e `resize-none`. O texto continua sem edição
ou mutation, mas agora mantém a semântica e a apresentação de campo multilinha para
motivos extensos.

Sensor atualizado: o teste da review page verifica o role `textbox`, o valor
persistido e o atributo `readonly`; o teste focado passou 13/13. Biome e
`git diff --check` também passaram. A rota real autenticada carregou sem erros ou
warnings; como a versão seeded estava **Em revisão**, o botão **Ver motivo** não
estava disponível nessa passagem visual.

Após o ajuste do hook, os sensores web de geração e da página foram repetidos e
passaram; a primeira execução havia encontrado somente a diferença esperada de
assinatura (`undefined` como terceiro argumento), sem falha funcional adicional.

Quality Gate parcial: testes dos dois use cases passaram 3/3 e
`pnpm --filter @hms/core check-types` passou.

Quality Gate de camadas: os controllers REST focados passaram 6/6; `server
check:types`, `web check:code` e `git diff --check` passaram.

## F29-T1 — remoção do CTA global de geração

O botão **Gerar documentos** foi removido permanentemente do cabeçalho da página
de documentos da consulta. **Selecionar documentos** continua sendo a única ação
global; **Gerar documento** permanece nas linhas individuais.

Sensores: teste da composição da página passou 10/10; `pnpm --filter web
check:code` passou em 344 arquivos; `git diff --check` passou. O teste confirma
que a geração individual continua sendo delegada e que o CTA global não aparece.

A execução foi feita após a formatação final, sem alterações funcionais
pendentes no arquivo da página.

A Spec foi alinhada para registrar que o endpoint batch permanece disponível para
fluxos futuros, mas não é chamado nem exposto visualmente nesta página.

Veredito F29-T1: verified.

Browser autenticado confirmou a composição final: apenas **Selecionar documentos**
no cabeçalho, com **Visualizar/Revisar** preservados nas linhas. A captura
`consultation-documents-no-global-generation.png` foi registrada; console terminou
com zero erros e zero warnings.

## Quality Gate final — encerramento

Execução integrada concluída em 2026-08-14:

- `pnpm lint`: passou;
- `pnpm check-types`: passou para `@hms/core` e `@hms/validation`;
- `pnpm test`: passou com 52 arquivos/188 testes no Core, 7 arquivos/19 testes
  em Validation, 46 arquivos/229 testes na Web e 43 arquivos/113 testes no
  servidor;
- `pnpm --filter server build`: passou;
- `pnpm --filter web check:code`: passou em 344 arquivos;
- `git diff --check`: passou;
- browser autenticado real: a rota de documentos exibiu somente **Selecionar
  documentos** como CTA global, manteve as ações individuais, terminou com zero
  erros/warnings de console e gerou `consultation-documents-no-global-generation.png`.

O comando `pnpm build` falhou exclusivamente porque o Vite não resolve o import
`react-pdf` em `apps/web/src/ui/identity/widgets/pages/document-viewer/index.tsx`.
O mesmo arquivo já era o blocker conhecido do `web check:types`; a falha é
preexistente, não foi introduzida pela Spec e não toca os arquivos alterados da
feature. O build isolado do servidor passou.

## Judge Implementation Final — re-audit

Veredito: **passed_with_preexisting_blockers**.

Escopo auditado: implementação completa da Spec, incluindo a seleção persistente
com regra `hasVersion`, geração individual sem body, cancelamento, revisão,
textarea de motivo, validação browser autenticada e remoção do CTA global de
geração em lote.

Não há blocker novo. Os contratos Core/REST permanecem alinhados à UI, os testes
integrados passam e a validação visual confirmou a composição final. O único
finding ativo é a dependência/import `react-pdf` ausente no `document-viewer`,
fora do escopo da feature e já registrado nas avaliações anteriores.

Status final: Spec e Plan concluídos. A entrega foi publicada em cinco PRs,
todos contra `develop`, com o limite do workflow respeitado: #71 Core/Validation
(4.433 linhas relevantes), #72 backend (4.739), #73 Web/listagem (3.778), #74
Web/revisão (3.680) e #75 documentação (0). O PR #72 recebeu ainda o
`pnpm-lock.yaml` para manter o frozen install do CI alinhado ao
`apps/server/package.json`.

Os checks `check-size` passaram nos cinco PRs. Os checks de app que falham ou
ficam pendentes refletem a dependência funcional entre PRs publicados contra
`develop`; o blocker de Web relacionado a `react-pdf` permanece preexistente e
fora do escopo desta Spec. A integração deve seguir Core/Validation, backend,
Web/listagem, Web/revisão e documentação.

## Revalidação dos checks de CI

Após a falha inicial dos PRs, a causa foi classificada em três grupos: checks de
camadas downstream executados antes da integração dos contratos dependentes,
11 artefatos JSON de migration fora da formatação Biome e o uso do ícone
inexistente `shield`.

Correções aplicadas: os workflows `core-package-ci.yaml`, `server-app-ci.yaml`
e `web-app-ci.yaml` agora detectam os caminhos alterados e pulam somente a
camada não aplicável, mantendo o check concluído; os 11 snapshots/journal foram
formatados; e o componente de erro passou a usar `shield-check`.

Sensores locais: o PR #76 contém o YAML dos três workflows, validado localmente;
`git diff --check` passou nos
heads corrigidos e o ícone foi conferido contra o `IconName`/mapa Lucide
compartilhado. Os checks remotos devem ser reavaliados nos PRs #71–#75 após os
novos pushes.
