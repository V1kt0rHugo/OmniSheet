# Wizard de Criação de Ficha — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o EditorScreen por um wizard passo a passo para criação de fichas novas, começando pelo Passo 1 (Identificação) e Passo 2 (Raça), mantendo o editor atual para edição de fichas existentes.

**Architecture:** Um novo componente `WizardScreen` gerencia o estado multi-passo em memória (não salva até o final). Os passos são componentes independentes (`PassoIdentificacao`, `PassoRaca`) que recebem `draft` e `setDraft`. O `EditorScreen` existente continua funcionando para edição de fichas já salvas.

**Tech Stack:** React 18, TypeScript, CSS existente do projeto (sem novas dependências)

**Spec:** `C:\Users\victo\Documents\Projetos\OminiSheet\Mouneteria Sistema` + imagem da tela de referência (Passo 1 — Identificação)

## Global Constraints

- Sem novas dependências npm
- Manter compatibilidade com o `EditorScreen` existente (edição de fichas salvas não muda)
- Seguir padrões de nomenclatura do projeto (PT-BR para labels, camelCase para código)
- O wizard só é usado para criação (`isNew === true`); edição continua no EditorScreen atual
- Salvar somente no último passo (ou a qualquer momento via "Salvo na mesa" auto-save do draft local)
- CSS inline ou classes existentes — não criar novos arquivos `.css` por enquanto

## Review Focus

- Navegar Próximo → sem nome preenchido não deve avançar (validar no Passo 1)
- Voltar do Passo 2 ao Passo 1 deve preservar tudo que foi preenchido
- Selecionar raça deve mostrar os modificadores de atributo antes de confirmar
- Cancelar no meio do wizard deve confirmar descarte (igual ao EditorScreen atual)
- Dados do wizard nunca vazam para o EditorScreen ao editar fichas existentes

---

## Task 1: WizardScreen — shell e roteamento de passos

**Files:**
- Create: `apps/web/src/screens/WizardScreen.tsx`
- Modify: `apps/web/src/App.tsx` (adicionar `ScreenId = 'wizard'`)
- Modify: `apps/web/src/app/AppContext.tsx` (adicionar `openWizard` na interface `AppApi`)

**Interfaces:**
- Produces:
  - `WizardScreen({ session }: { session: WizardSession | null })` — componente raiz do wizard
  - `WizardSession = { sistemaId: string; from: 'hall' | 'menu'; key: number }`
  - `openWizard(sistemaId: string, opts?: { from?: Origem })` adicionado ao `AppApi`
  - `ScreenId` inclui `'wizard'`

- [ ] **Step 1: Adicionar `'wizard'` ao `ScreenId`** em `AppContext.tsx`

  Alterar linha: `export type ScreenId = 'title' | 'menu' | 'hall' | 'systems' | 'editor' | 'sheet';`
  Para: `export type ScreenId = 'title' | 'menu' | 'hall' | 'systems' | 'editor' | 'sheet' | 'wizard';`

- [ ] **Step 2: Adicionar `openWizard` à interface `AppApi`** em `AppContext.tsx`

  ```ts
  openWizard: (sistemaId: string, opts?: { from?: Origem }) => void;
  ```

- [ ] **Step 3: Implementar `openWizard` em `App.tsx`**

  Localizar onde `openEditor` e `openSystemPicker` são implementados e adicionar:
  ```ts
  openWizard: (sistemaId, opts) => {
    setWizardSession({ sistemaId, from: opts?.from ?? 'hall', key: Date.now() });
    show('wizard');
  },
  ```
  Adicionar estado `wizardSession` e `<WizardScreen session={wizardSession} />` ao JSX.

- [ ] **Step 4: Criar `WizardScreen.tsx`** com shell básico

  O componente renderiza um `<section id="scr-wizard">` com `screenCls`. Internamente mantém:
  - `draft: FichaDraft` (inicializado com `newDraft(sistema)`)
  - `passo: number` (começa em 0)
  - Barra de passos no topo: `PASSO {passo+1}` + título do passo atual
  - Botões `← Voltar` e `Próximo →` na base (igual à referência visual)
  - Renderiza `<PassoIdentificacao>` quando `passo === 0`, `<PassoRaca>` quando `passo === 1`

- [ ] **Step 5: Redirecionar `SystemPickerScreen` para `openWizard`** em vez de `openEditor`

  Localizar onde o picker chama `openEditor(null, { sistemaId })` e trocar por `openWizard(sistemaId, { from })`.

- [ ] **Step 6: Testar manualmente**

  - Abrir "Nova ficha" → deve entrar no wizard (tela em branco com "PASSO 1")
  - Clicar "Editar ficha" numa ficha existente → deve continuar abrindo o EditorScreen

---

## Task 2: Passo 1 — Identificação

**Files:**
- Create: `apps/web/src/screens/wizard/PassoIdentificacao.tsx`

**Interfaces:**
- Consumes: `WizardScreen` fornece `draft: FichaDraft`, `setDraft`, `onNext: () => void`, `onCancel: () => void`
- Produces: `PassoIdentificacao({ draft, setDraft, onNext, onCancel }: PassoIdentificacaoProps)`

Layout fiel à referência visual (screenshot):
```
PASSO 1
IDENTIFICAÇÃO
"Os campos da ficha base. Só o nome é obrigatório agora."

[NOME*]  [SOBRENOME]  [JOGADOR]  [IDADE]  [PESO]
[ALTURA] [DIA DE NASC.] [ESPECIALISTA] [APELIDO]

[Retrato — área clicável com ?]   [botão Enviar imagem]
                                   Sem imagem, a ficha usa a arte da raça.
                                   ENQUADRAMENTO: [Preencher] [Inteira]
                                   Zoom [slider]
                                   Horizontal [slider]
                                   Vertical [slider]
                                   [Centralizar]

← Voltar    ● Salvo na mesa    Próximo →
```

Campos mapeados para `FichaDraft` e `dados`:
- Nome → `draft.nome`
- Sobrenome, Jogador, Idade, Peso, Altura, Dia de Nascimento, Especialista, Apelido → `draft.dados['sobrenome']`, `draft.dados['jogador']`, etc. (campos de texto livre, não precisam existir na `DefinicaoSistema`)
- Retrato → `draft.imagem` (base64, igual ao EditorScreen)
- Enquadramento → `draft.foco` (0–100, slider Vertical já existente; os sliders Zoom e Horizontal são visuais extras — podem usar `draft.cor` para horizontal inicialmente ou novos campos em `dados`)

- [ ] **Step 1: Criar `PassoIdentificacao.tsx`** com o formulário

  Reutilizar a lógica de upload de imagem do `EditorScreen` (função `pickImage` + `dropHandlers`).
  Campos de texto extras (sobrenome, jogador, etc.) salvam em `draft.dados` via `setDado`.

- [ ] **Step 2: Validação de `onNext`**

  `onNext` só avança se `draft.nome.trim()` não estiver vazio; caso contrário foca o campo e mostra erro inline.

- [ ] **Step 3: Testar manualmente**

  - Preencher nome e clicar "Próximo →" → deve avançar para o Passo 2
  - Deixar nome vazio e clicar "Próximo →" → deve mostrar erro e não avançar
  - Clicar "← Voltar" → deve confirmar descarte e voltar ao Hall/Menu

---

## Task 3: Passo 2 — Raça

**Files:**
- Create: `apps/web/src/screens/wizard/PassoRaca.tsx`

**Interfaces:**
- Consumes: `draft`, `setDraft`, `sistema`, `onNext`, `onBack`
- Produces: `PassoRaca({ draft, setDraft, sistema, onNext, onBack }: PassoRacaProps)`

Layout:
```
PASSO 2
RAÇA
"Escolha a origem do seu personagem."

[Cards de raça — um por opção na secao 'raca']
  Card selecionado: borda destacada
  Cada card mostra: imagem (se houver), nome da raça, lista de modificadores

← Voltar    ● Salvo na mesa    Próximo →  (ou "Concluir →" se for o último passo)
```

A seção de raça na `DefinicaoSistema` é identificada pelo `id === 'raca'`. O campo `selecao` dentro dela tem as `opcoes` e `efeitos`.

- [ ] **Step 1: Criar `PassoRaca.tsx`**

  Extrair da `sistema.secoes` a seção com `id === 'raca'` e o campo `selecao` dentro dela.
  Renderizar um card clicável por opção (usar `c.opcoes`).
  Ao selecionar, chamar `setDado('raca', opcao)` no draft.
  Mostrar os `efeitos` da opção selecionada como lista de modificadores (reutilizar `descreverEfeito` do `calculo.ts`).

- [ ] **Step 2: Imagem da raça**

  Se a opção tiver uma URL de imagem registrada (por convenção: campo `dados['imagem_'+opcao_normalizada]` ou hardcoded no sistema — a definir), mostrar no card.
  Por enquanto: mostrar placeholder com a inicial da raça.

- [ ] **Step 3: Botão "Concluir →" no último passo**

  Se `passo` for o último, o botão muda de "Próximo →" para "Concluir →" e ao clicar chama `save()` que persiste a ficha e navega para o Hall (igual ao EditorScreen).

- [ ] **Step 4: Testar manualmente**

  - Selecionar "Meio Dragão" → card fica destacado, lista de bônus aparece (Força +2, Destreza -1, etc.)
  - Clicar "← Voltar" → volta ao Passo 1 com dados preservados
  - Clicar "Concluir →" → ficha criada e navega para o Hall

---

## Task 4: Indicador de progresso e auto-save de rascunho

**Files:**
- Modify: `apps/web/src/screens/WizardScreen.tsx`

**Interfaces:**
- Consumes: `passo`, total de passos
- Produces: barra de progresso visual no topo + indicador "● Salvo na mesa" (localStorage)

- [ ] **Step 1: Barra de passos**

  No topo do wizard, renderizar `PASSO {passo+1} DE {total}` + barra de progresso simples (linha colorida proporcional).

- [ ] **Step 2: Auto-save no localStorage**

  A cada mudança em `draft`, serializar e salvar em `localStorage['wizard_draft']`.
  Ao iniciar um wizard novo, verificar se existe rascunho salvo para o mesmo `sistemaId` e oferecer retomar.
  Ao concluir ou cancelar, limpar o rascunho.

- [ ] **Step 3: Testar manualmente**

  - Preencher dados, fechar o browser, reabrir → wizard deve oferecer retomar
  - Concluir ficha → rascunho some do localStorage

