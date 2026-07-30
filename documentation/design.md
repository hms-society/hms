---
description: "Warm off-white canvas with deep teal brand identity — primary actions, sidebar accents, focus rings. Shadows carry a subtle brand tint via color-mix in light mode, switching to neutral black opacity in dark. Typography pairs Plus Jakarta Sans (body) with Fraunces (headings) for a professional-yet-approachable tone. All color values use OKLCH for perceptual uniformity."

colors:
  # Superfície e texto
  background: "oklch(0.962 0.007 80.8)"
  foreground: "oklch(0.260 0.020 190)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.260 0.020 190)"
  popover: "oklch(1 0 0)"
  popover-foreground: "oklch(0.260 0.020 190)"

  # Ação
  primary: "oklch(0.495 0.045 196)"
  primary-foreground: "oklch(1 0 0)"
  secondary: "oklch(0.969 0.005 194)"
  secondary-foreground: "oklch(0.262 0.029 198)"
  muted: "oklch(0.946 0.008 80)"
  muted-foreground: "oklch(0.408 0.005 80)"
  accent: "oklch(0.969 0.018 75)"
  accent-foreground: "oklch(0.367 0.074 52)"
  destructive: "oklch(0.439 0.176 26)"
  destructive-foreground: "oklch(1 0 0)"

  # Estrutura
  border: "oklch(0.886 0.013 85)"
  input: "oklch(0.768 0.022 85)"
  ring: "oklch(0.495 0.045 196)"

  # Marca
  brand: "oklch(0.385 0.040 196)"
  brand-foreground: "oklch(1 0 0)"
  brand-accent: "oklch(0.567 0.107 54)"
  brand-accent-foreground: "oklch(1 0 0)"
  brand-highlight: "oklch(0.625 0.110 200)"
  brand-highlight-foreground: "oklch(1 0 0)"

  # Highlight
  highlight: "oklch(0.948 0.018 198)"
  highlight-foreground: "oklch(0.395 0.068 198)"
  highlight-vivid: "oklch(0.625 0.110 200)"

  # Charts
  chart-1: "oklch(0.495 0.045 196)"
  chart-2: "oklch(0.567 0.107 54)"
  chart-3: "oklch(0.617 0.029 200)"
  chart-4: "oklch(0.706 0.110 62)"
  chart-5: "oklch(0.512 0.008 80)"

  # Sidebar
  sidebar: "oklch(0.969 0.005 194)"
  sidebar-foreground: "oklch(0.318 0.008 80)"
  sidebar-primary: "oklch(0.385 0.040 196)"
  sidebar-primary-foreground: "oklch(1 0 0)"
  sidebar-accent: "oklch(0.917 0.010 196)"
  sidebar-accent-foreground: "oklch(0.262 0.029 198)"
  sidebar-border: "oklch(0.917 0.010 196)"
  sidebar-ring: "oklch(0.385 0.040 196)"

typography:
  sans:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    usage: "Body text, UI labels, navigation"
  serif:
    fontFamily: "Fraunces, serif"
    usage: "Headings (h1-h6), display text"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    usage: "Code blocks, technical data"
  source: "Google Fonts"

spacing:
  base: "0.25rem (--spacing)"
  tracking-normal: "0em"

radius:
  sm: "calc(0.75rem - 4px)"
  md: "calc(0.75rem - 2px)"
  lg: "0.75rem (--radius)"
  xl: "calc(0.75rem + 4px)"
  2xl: "calc(0.75rem * 1.8)"
  3xl: "calc(0.75rem * 2.2)"
  4xl: "calc(0.75rem * 2.6)"
  pill: "9999px"

shadows:
  light:
    strategy: "Brand-tinted via color-mix(in oklab, var(--brand) N%, transparent)"
    shadow-2xs: "0px 2px 12px -6px @ 8%"
    shadow-xs: "0px 2px 16px -8px @ 10%"
    shadow-sm: "0px 2px 20px -8px @ 12%"
    shadow: "0px 2px 24px -8px @ 12%"
    shadow-md: "0px 4px 28px -10px @ 14%"
    shadow-lg: "0px 8px 32px -10px @ 16%"
    shadow-xl: "0px 10px 40px -12px @ 18%"
    shadow-2xl: "0px 16px 48px -12px @ 24%"
  dark:
    strategy: "Neutral black with higher opacity"
    shadow-2xs: "0px 4px 16px -8px @ 30%"
    shadow-xs: "0px 6px 20px -10px @ 35%"
    shadow-sm: "0px 8px 24px -10px @ 40%"
    shadow: "0px 8px 28px -10px @ 40%"
    shadow-md: "0px 10px 32px -12px @ 45%"
    shadow-lg: "0px 12px 36px -12px @ 50%"
    shadow-xl: "0px 16px 40px -14px @ 55%"
    shadow-2xl: "0px 20px 48px -14px @ 65%"
---

## Direcao Estrategica

Este documento e a fonte canonica tanto para as decisoes estrategicas de produto
que orientam a interface quanto para o sistema visual da HMS. Decisoes de design
devem partir deste contexto antes de aplicar os tokens e regras detalhados abaixo.

### Register

product

### Usuarios e contexto de uso

A HMS e um produto interno usado por administradores, atendentes, advogados,
paralegais e supervisores. A interface apoia trabalho operacional recorrente,
com informacoes pessoais e juridicas sensiveis e tarefas que exigem clareza,
rastreabilidade e poucos erros.

Os fluxos centrais do MVP sao:

- cadastrar e autenticar usuarios;
- cadastrar clientes e registrar seus consentimentos LGPD;
- cadastrar colaboradores e associar profissionais a areas e temas juridicos;
- configurar disponibilidade e bloqueios de agenda;
- marcar e conduzir consultas juridicas.

### Proposito do produto

Centralizar o atendimento inicial da HMS para que o cliente saia do primeiro
contato com os dados essenciais cadastrados e uma consulta marcada. Para a equipe,
o produto deve reduzir retrabalho, explicitar responsabilidades e tornar o estado
de cada atendimento facil de compreender.

### Personalidade e tom

A experiencia deve ser **profissional e sobria**, sem parecer fria ou hostil, e
**profissional e acolhedora**, sem parecer informal. A personalidade da HMS e:

- confiavel;
- clara;
- serena;
- humana;
- criteriosa.

Textos devem ser diretos, respeitosos e orientados a acao. Em etapas sensiveis,
como consentimentos, dados pessoais e agendamento, a interface deve explicar o
efeito da acao antes da confirmacao.

### Anti-referencias

A interface nao deve:

- usar linguagem visual chamativa, ludica ou juvenil;
- reproduzir o aspecto generico de SaaS com gradientes decorativos,
  glassmorphism ou brilho excessivo;
- transformar toda informacao em cards ou empilhar cards dentro de cards;
- parecer um sistema juridico burocratico, denso e intimidador;
- usar ornamentos que disputem atencao com a tarefa principal;
- depender apenas de cor para comunicar estado, prioridade ou erro.

### Principios de design

1. **Clareza antes de decoracao.** A hierarquia deve tornar a proxima acao e o
   estado atual evidentes sem depender de efeitos visuais.
2. **Sobriedade sem frieza.** Tipografia, espaco e linguagem devem transmitir
   rigor profissional com acolhimento humano.
3. **Confianca nas decisoes criticas.** Acoes com impacto juridico, operacional
   ou sobre dados pessoais devem mostrar contexto, consequencias e confirmacao.
4. **Densidade progressiva.** Mostrar primeiro o necessario para concluir a
   tarefa; detalhes complementares devem permanecer acessiveis sem dominar a tela.
5. **Consistencia operacional.** Padroes equivalentes devem manter os mesmos
   nomes, comportamentos, estados e posicoes ao longo dos modulos.

### Identificacao de cliente na triagem documental

A identificacao do cliente usa exibicao progressiva: busca manual e correspondencia
sugerida nao devem disputar atencao no mesmo estado da interface.

Quando houver uma correspondencia segura, o modal exibe somente **Correspondencia
sugerida**, as evidencias que sustentam a sugestao e as acoes `Confirmar cliente`,
`Buscar outro cliente` e `Nao foi possivel identificar`. O campo de busca permanece
oculto enquanto a sugestao estiver sendo avaliada.

Ao acionar `Buscar outro cliente`, a sugestao e substituida pelo estado **Identificar
cliente**, composto pelo campo de busca e pelos resultados encontrados. A acao `Voltar
a sugestao` restaura a correspondencia anterior enquanto ela continuar pendente.
`Confirmar vinculo` permanece desabilitado ate que um resultado seja selecionado. A
selecao deve ser indicada por realce da linha e icone de confirmacao; depois disso, a
acao e habilitada no rodape do modal.

Quando nao houver correspondencia segura, o modal inicia diretamente no estado
**Identificar cliente**, sem exibir uma secao vazia de sugestao. `Nao foi possivel
identificar` mantem o lote pendente e sem cliente associado.

A interface exibe no maximo uma sugestao principal. Candidatos ambiguos ou com baixa
confianca nao sao apresentados como sugestao; nesses casos, o atendente realiza a
busca manual.

Na tabela da caixa de triagem, a coluna **Recebido de** combina o canal de origem com
o telefone ou e-mail do remetente. Remetente e cliente sao conceitos distintos: quem
envia os arquivos pode nao ser a pessoa a quem eles pertencem.

A coluna **Cliente** exibe o nome e o documento mascarado do candidato quando houver
uma correspondencia segura. Enquanto o vinculo depender de confirmacao humana, o nome
deve ser acompanhado pelo chip `Sugerido`. Quando nao houver candidato seguro, a
coluna exibe `Sem sugestao segura` e orienta que a busca manual e necessaria, sem usar
cor destrutiva. `Remetente nao identificado` e reservado exclusivamente para a
ausencia dos dados de origem e nunca deve significar que o cliente nao foi localizado.

### Sugestoes na ficha de atendimento

As secoes **Fatos relevantes e cronologia**, **Possiveis pedidos juridicos** e
**Riscos identificados**, alem do campo **Questao juridica principal**, usam a
mesma regra para conteudo sugerido:

- `Sugerido` identifica um item que ainda depende de decisao humana;
- toda sugestao oferece acoes explicitas para aceitar ou rejeitar;
- ao aceitar, o chip e removido e o item passa a ser uma linha comum da lista;
- itens criados manualmente entram como linhas comuns, sem chip de estado;
- ao rejeitar, o item sai da lista operacional e a interface oferece uma acao
  temporaria de `Desfazer`;
- a decisao de aceitar ou rejeitar permanece registrada internamente para auditoria
  e para evitar que uma sugestao rejeitada seja apresentada novamente;
- itens rejeitados nao formam um grupo visivel na tela operacional;
- `Aceito`, `Comprovado` e `A comprovar` nao devem ser usados como chips nesses
  contextos. Evidencias exigem um fluxo proprio e associacao explicita ao fato.

O campo **Questao juridica principal** admite apenas uma sugestao pendente. O
advogado pode editar o texto antes de aceitar. Ao aceitar, o chip e as acoes de
revisao desaparecem; ao rejeitar, o campo volta a aceitar preenchimento manual.

`Sugerido` e o unico chip visivel nesses contextos. Aceitar, rejeitar, editar e
desfazer sao acoes e devem ser representadas por controles interativos separados,
com nome acessivel e foco visivel.

### Configuracao do pacote de documentos da consulta

A configuracao do pacote exibe os campos **Area juridica** e **Tema juridico**
antes da lista de documentos sugeridos. Os valores iniciais sao os mesmos da
consulta, sem selo, texto auxiliar ou outra indicacao visual sobre essa origem.

Os campos permanecem editaveis e funcionam apenas como criterios para consultar
os templates aplicaveis ao pacote. Alterar a area ou o tema atualiza as sugestoes
de documentos, mas nao modifica a classificacao juridica da consulta. A geracao
continua dependendo de confirmacao explicita em `Gerar documentos`.

A aba nao exibe um contador isolado de documentos, pois ele seria ambiguo entre
sugeridos, selecionados, gerados e aceitos. Depois da primeira geracao, o painel
de documentos oferece a acao secundaria `Reconfigurar pacote`, que retorna aos
criterios de area e tema para sugerir e gerar documentos adicionais. Documentos
ja gerados nao devem ser removidos silenciosamente por essa reconfiguracao.

O painel de documentos exibe a acao primaria `Confirmar pacote`. Enquanto o
pacote estiver vazio ou existir documento gerando, aguardando informacoes, em
revisao, em preenchimento manual ou com falha, a acao permanece desabilitada e
explica: `Aprove todos os documentos para confirmar o pacote.`

A acao e habilitada somente quando todos os documentos incluidos estiverem
aprovados. A confirmacao registra o colaborador e a data, libera a proxima etapa
do fluxo e nao pode ser repetida. Essa elegibilidade deve ser validada tambem no
servidor, e nao apenas representada visualmente.

### Configuracao padrao dos pacotes de documentos

A tela administrativa deve ser nomeada **Configuracao dos Pacotes de Documentos**.
Ela configura quais templates serao sugeridos em novos pacotes, sem alterar pacotes ja
criados.

Cada configuracao seleciona uma **Area juridica** e um ou mais **Temas juridicos**. A
lista resultante permite definir, para cada documento, a ordem, o momento de geracao e
se ele e obrigatorio. O controle principal deve ser nomeado `Salvar configuracao`.

**Temas juridicos** e um multisseletor pesquisavel. Cada tema selecionado aparece como
um chip removivel dentro do campo, permitindo reconhecer e retirar valores sem reabrir
a lista. Quando nao houver espaco para exibir todos os chips, o campo preserva os
primeiros valores e resume os demais como `+N`, sem concatenar temas em um unico texto.

O cadastro do arquivo-base de um template e uma responsabilidade distinta dessa
configuracao. A interface nao deve chamar a lista configuravel de cadastro de templates,
pois ela representa a composicao padrao de um pacote.

### Cadastro e edicao de templates de documentos

O modal de adicao e edicao de template concentra os campos **Nome do template**,
**Descricao**, **Area juridica**, **Temas juridicos** e **Arquivo-base**. Area e temas
definem onde o template pode ser utilizado e nao devem ser editados no modal que apenas
adiciona um template existente a configuracao de um pacote.

**Temas juridicos** e um multisseletor pesquisavel, limitado aos temas da area
selecionada. Cada tema aparece como um chip removivel; quando faltar espaco, os valores
excedentes sao resumidos como `+N`. A troca de area limpa os temas atuais depois de
confirmacao e exige uma nova selecao.

O mesmo formulario atende criacao e edicao. Na criacao, o titulo e
`Adicionar template de documento` e a acao principal e `Adicionar template`. Na
edicao, o titulo e `Editar template de documento` e a acao principal e
`Salvar alteracoes`.

O modal **Adicionar documento ao pacote** seleciona um template ativo ja cadastrado e
exibe sua descricao apenas como contexto. Ele nao cria nem edita nome, descricao ou
arquivo-base. No modal, o administrador define somente o momento de geracao e se o
documento e obrigatorio. A acao final deve ser nomeada `Adicionar ao pacote`, e o
cabecalho deve manter visiveis a area e a quantidade de temas da configuracao atual.

### Rejeicao de documentos gerados por IA

Na revisao de um documento, a interface deve nomear a acao como `Rejeitar
geracao`, deixando claro que a rejeicao se aplica ao conteudo produzido pela IA,
nao ao documento nem a sua inclusao no pacote.

Antes da confirmacao, o dialogo informa que a versao gerada sera descartada, que
o documento continuara no pacote e que passara para preenchimento manual. A acao
final deve explicitar esse resultado com `Rejeitar e preencher manualmente`. A
versao rejeitada nao pode ser enviada ao cliente.

`Ajustar` permanece uma acao separada: solicita uma nova geracao pela IA em vez
de iniciar o preenchimento manual.

Enquanto o documento estiver em preenchimento manual, a interface oferece a acao
secundaria `Voltar para geracao por IA`. A acao abandona o rascunho manual corrente
como versao ativa, preserva seu historico e inicia uma nova geracao. Documentos ja
aprovados nao podem retornar para escrita manual nem para geracao por IA.

### Acessibilidade e inclusao

WCAG 2.2 nivel AA e o requisito minimo para toda interface da HMS. Isso inclui:

- navegacao completa por teclado e ordem de foco coerente;
- foco visivel em todos os controles interativos;
- contraste AA para texto, controles e estados;
- labels persistentes e mensagens de erro associadas aos respectivos campos;
- estado, prioridade e validacao comunicados por texto ou icone, alem da cor;
- suporte a zoom, reflow e tamanhos de texto maiores sem perda de funcionalidade;
- alternativas com movimento reduzido para animacoes e transicoes.

## Visao Geral

HMS usa um tema claro com identidade teal/verde-escuro como cor de marca, acentos quentes (dourado/ambar no hue ~54), e uma paleta neutra em tons quentes (hue ~75-85). O dark mode inverte superficies mantendo a mesma linguagem de cor.

Todas as cores sao definidas em OKLCH para uniformidade perceptual. O tema e implementado via CSS custom properties com Tailwind v4 (`@theme inline`), shadcn/ui como biblioteca de componentes, e dark mode via classe `.dark`.

## 1. Sistema de Cores

### Paleta Principal
- **Primary** (teal, hue ~196): acoes principais, botoes, focus rings, links
- **Brand** (teal escuro, hue ~196): identidade da marca, elementos institucionais — mais escuro que primary para contraste em superficies claras
- **Brand-accent** (dourado/ambar, hue ~54): acento quente para destaque visual, badges, indicadores
- **Brand-highlight** (teal vibrante, hue ~200): estados ativos, elementos ao vivo
- **Destructive** (vermelho, hue ~26): acoes destrutivas, erros

### Superficies
Light mode usa um canvas off-white quente (`oklch(0.962 0.007 80.8)` ou `#F5F2ED`) — nao branco puro, para reduzir fadiga visual. Cards e popovers sao brancos puros para criar hierarquia sutil via elevacao.

Dark mode usa um preto quente (`oklch(0.150 0.005 80)`) com cards levemente elevados (`oklch(0.195 0.008 80)`).

### Sidebar
A sidebar tem sua propria sub-paleta (tinted com o hue da marca ~194-198), visualmente distinta do conteudo principal para criar separacao espacial clara.

## 2. Tipografia

Tres familias via Google Fonts:

- **Plus Jakarta Sans** (sans-serif): corpo de texto, labels de UI, navegacao. Geometrica com formas arredondadas — legivel em tamanhos pequenos, amigavel sem ser informal.
- **Fraunces** (serif): headings h1-h6, display text. Serif variavel com eixo optico — traz personalidade e peso visual aos titulos sem comprometer modernidade.
- **JetBrains Mono** (monospace): blocos de codigo, dados tecnicos.

Headings usam `font-serif` (Fraunces) por padrao via `@layer base`. Body usa `font-sans` (Plus Jakarta Sans).

### Tracking
Escala de letter-spacing relativa a `--tracking-normal` (0em):
- `tighter`: -0.05em
- `tight`: -0.025em
- `normal`: 0em
- `wide`: +0.025em
- `wider`: +0.05em
- `widest`: +0.1em

## 3. Sombras

A decisao mais distintiva do sistema: sombras no light mode carregam um tinge da cor de marca via `color-mix(in oklab, var(--brand) N%, transparent)`. Isso faz com que elevacoes tenham um tom sutil de teal em vez de cinza neutro — reforçando a identidade visual mesmo em elementos estruturais.

No dark mode, sombras usam preto puro com opacidade mais alta (30-65%), pois o tinge de cor nao e perceptivel em fundos escuros.

A escala vai de `2xs` (sutil, 8% brand) a `2xl` (dramatica, 24% brand), com blur e spread crescentes.

## 4. Forma (Radius)

Base radius de `0.75rem` com escala derivada:
- `sm` a `xl`: subtracao/adicao linear para componentes menores/maiores
- `2xl` a `4xl`: multiplicacao para cards grandes, modais, containers
- `pill` (9999px): botoes pill, badges, tags

## 5. Stack Tecnico (Frontend)

- **Tailwind CSS v4** com `@theme inline` (CSS-first config, sem tailwind.config.js)
- **shadcn/ui** para componentes (new-york style, output em `src/ui/shadcn/`)
- **Dark mode** via classe `.dark` com `@custom-variant dark (&:is(.dark *))`
- **tw-animate-css** para animacoes
- **@tailwindcss/typography** para prosa formatada

## 6. Acessibilidade

### Contraste
- Foreground (`oklch(0.260)`) sobre background (`oklch(0.978)`): alto contraste, passa AAA
- Muted-foreground (`oklch(0.408)`) sobre background: contraste moderado, verificar AA para texto pequeno
- Primary (`oklch(0.495)`) sobre white foreground: verificar AA — usado primariamente como fill de botoes, nao como texto sobre fundo claro
- Destructive (`oklch(0.439)`) com foreground branco: contraste adequado para sinalizacao de erro

### Recomendacoes
- Nao usar `primary` como cor de texto sobre fundo claro — usar como background de botoes com texto branco
- `muted-foreground` e adequado para labels secundarios mas nao para texto critico
- No dark mode, `primary` clareia para `oklch(0.617)` para manter destaque contra fundos escuros
