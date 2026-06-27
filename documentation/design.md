---
description: "Warm off-white canvas with deep teal brand identity — primary actions, sidebar accents, focus rings. Shadows carry a subtle brand tint via color-mix in light mode, switching to neutral black opacity in dark. Typography pairs Plus Jakarta Sans (body) with Fraunces (headings) for a professional-yet-approachable tone. All color values use OKLCH for perceptual uniformity."

colors:
  # Superfície e texto
  background: "oklch(0.978 0.005 75)"
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
Light mode usa um canvas off-white quente (`oklch(0.978 0.005 75)`) — nao branco puro, para reduzir fadiga visual. Cards e popovers sao brancos puros para criar hierarquia sutil via elevacao.

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
