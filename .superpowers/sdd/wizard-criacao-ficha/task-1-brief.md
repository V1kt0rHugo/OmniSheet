# Task 1 Brief — WizardScreen: shell e roteamento de passos

## Contexto

Projeto: OminiSheet (`c:\Users\victo\Documents\Projetos\OminiSheet`)
Stack: React 18 + TypeScript, Vite, CSS existente. Sem novas dependências npm.
Idioma PT-BR para labels e comentários de usuário; camelCase para código.

Este é um projeto de fichas de RPG. O objetivo desta task é criar o **shell** de um wizard de múltiplos passos para criação de fichas novas. O EditorScreen existente continua sendo usado para **edição** de fichas já salvas — não modifique seu comportamento.

## Global Constraints

- Sem novas dependências npm
- Wizard só para criação (`isNew === true`); edição continua no EditorScreen
- CSS inline ou classes existentes — não criar novos arquivos `.css` agora
- TypeScript estrito — sem `any` não justificado

## Arquivos relevantes (leia antes de começar)

- `apps/web/src/app/AppContext.tsx` — define `ScreenId`, `AppApi`, `Origem`
- `apps/web/src/App.tsx` — onde `show`, `openEditor`, `openSystemPicker` vivem; aqui você adiciona `openWizard` e `<WizardScreen>`
- `apps/web/src/screens/SystemPickerScreen.tsx` — chama `openEditor(null, { from, sistemaId: s.id })`; troque por `openWizard(s.id, { from })`
- `apps/web/src/screens/EditorScreen.tsx` — referência para padrões de `FichaDraft`, `toDraft`, `newDraft`
- `apps/web/src/lib/ficha.ts` — exporta `newDraft(sistema: Sistema): FichaDraft`
- `apps/web/src/types.ts` — tipos `FichaDraft`, `Sistema`, etc.

## O que implementar

### 1. `AppContext.tsx` — adicionar `'wizard'` ao `ScreenId` e `openWizard` ao `AppApi`

```ts
// ScreenId: adicionar 'wizard'
export type ScreenId = 'title' | 'menu' | 'hall' | 'systems' | 'editor' | 'sheet' | 'wizard';

// AppApi: adicionar
openWizard: (sistemaId: string, opts?: { from?: Origem }) => void;
```

### 2. `App.tsx` — implementar `openWizard` e montar `<WizardScreen>`

Adicionar estado:
```ts
const [wizardSession, setWizardSession] = useState<WizardSession | null>(null);
const wizardKey = useRef(0);
```

Implementar:
```ts
const openWizard = useCallback((sistemaId: string, opts?: { from?: Origem }) => {
  setWizardSession({ sistemaId, from: opts?.from ?? 'hall', key: ++wizardKey.current });
  show('wizard');
}, [show]);
```

Adicionar ao `api` useMemo: `openWizard`.

Adicionar ao JSX (ao lado do `<EditorScreen>`):
```tsx
<WizardScreen session={wizardSession} />
```

### 3. `SystemPickerScreen.tsx` — trocar `openEditor` por `openWizard`

Na linha:
```tsx
onClick={() => { sfx('confirm'); openEditor(null, { from, sistemaId: s.id }); }}
```
Trocar por:
```tsx
onClick={() => { sfx('confirm'); openWizard(s.id, { from }); }}
```

Atualizar o destructuring do `useApp()` para incluir `openWizard` em vez de `openEditor`.

### 4. Criar `apps/web/src/screens/WizardScreen.tsx`

**Tipo WizardSession** (exportar deste arquivo):
```ts
export interface WizardSession { sistemaId: string; from: 'hall' | 'menu'; key: number }
```

**Passos registrados** (array interno, NÃO vindo do sistema):
```ts
const PASSOS = ['Identificação', 'Raça'];
```

**Estado interno do WizardScreen:**
- `draft: FichaDraft` — inicializado com `newDraft(sistema)`
- `passo: number` — começa em 0
- `dirty: boolean` — true quando `draft` foi alterado pelo usuário

**Funções exportadas para os subcomponentes de passo:**
- `setDraft` — substitui o draft inteiro
- `setDado(id, valor)` — atualiza `draft.dados[id]`
- `set<K>(k, v)` — atualiza campo de nível raiz do draft

**JSX do WizardScreen:**
```tsx
<section id="scr-wizard" className={screenCls(screen === 'wizard', instant)}>
  <div className="scroll">
    <header className="wiz-step-label">
      <span>PASSO {passo + 1}</span>
      <h1>{PASSOS[passo].toUpperCase()}</h1>
    </header>

    {/* área do passo atual */}
    <div className="wiz-body">
      {passo === 0 && <PassoIdentificacao draft={draft} set={set} setDado={setDado} onNext={handleNext} onCancel={handleCancel} />}
      {passo === 1 && <PassoRaca draft={draft} setDado={setDado} sistema={sistema} onNext={handleNext} onBack={handleBack} />}
    </div>

    {/* rodapé global */}
    <footer className="wiz-foot">
      <button className="btn subtle" onClick={passo === 0 ? handleCancel : handleBack}>← Voltar</button>
      <span className="wiz-save-status">● Salvo na mesa</span>
      <button className="btn primary" onClick={handleNext}>
        {passo === PASSOS.length - 1 ? 'Concluir →' : 'Próximo →'}
      </button>
    </footer>
  </div>
</section>
```

**handleNext**: no passo 0, apenas avança `passo`; no último passo, chama `save()`.
**handleBack**: decrementa `passo`.
**handleCancel**: se `dirty`, abre confirm "Descartar alterações?" antes de voltar ao Hall/Menu.
**save()**: cria a ficha via `create.mutateAsync(draft)`, navega para o Hall (idêntico ao EditorScreen).

**Imports necessários** do WizardScreen:
- `PassoIdentificacao` de `./wizard/PassoIdentificacao` (stub vazio por enquanto)
- `PassoRaca` de `./wizard/PassoRaca` (stub vazio por enquanto)
- `newDraft` de `../lib/ficha`
- `useFichaMutations` de `../api/useFichas`
- `screenCls, useApp` de `../app/AppContext`
- `sfx` de `../lib/sfx`
- `H` de `./hallState`
- `clamp` de `../lib/util`

### 5. Criar stubs para os passos (serão implementados nas Tasks 2 e 3)

`apps/web/src/screens/wizard/PassoIdentificacao.tsx`:
```tsx
import type { FichaDraft } from '../../types';
import type { Dados } from '../../types';

export interface PassoIdentificacaoProps {
  draft: FichaDraft;
  set: <K extends keyof FichaDraft>(k: K, v: FichaDraft[K]) => void;
  setDado: (id: string, v: Dados[string]) => void;
  onNext: () => void;
  onCancel: () => void;
}

export function PassoIdentificacao({ onNext, onCancel }: PassoIdentificacaoProps) {
  return (
    <div style={{ padding: '2rem' }}>
      <p>Passo 1 — Identificação (em breve)</p>
      <button className="btn" onClick={onCancel}>Cancelar</button>
      <button className="btn primary" onClick={onNext}>Próximo</button>
    </div>
  );
}
```

`apps/web/src/screens/wizard/PassoRaca.tsx`:
```tsx
import type { FichaDraft, Sistema } from '../../types';
import type { Dados } from '../../types';

export interface PassoRacaProps {
  draft: FichaDraft;
  setDado: (id: string, v: Dados[string]) => void;
  sistema: Sistema;
  onNext: () => void;
  onBack: () => void;
}

export function PassoRaca({ onNext, onBack }: PassoRacaProps) {
  return (
    <div style={{ padding: '2rem' }}>
      <p>Passo 2 — Raça (em breve)</p>
      <button className="btn" onClick={onBack}>Voltar</button>
      <button className="btn primary" onClick={onNext}>Concluir</button>
    </div>
  );
}
```

## CSS mínimo necessário

Adicionar ao final de `apps/web/src/styles/editor-sheet.css` (ou ao `base.css` se não existir):

```css
/* Wizard */
#scr-wizard { display: contents; }
.wiz-step-label { padding: 1.5rem 2rem 0; }
.wiz-step-label span { font-size: .75rem; letter-spacing: .12em; opacity: .6; text-transform: uppercase; }
.wiz-step-label h1 { margin: 0; font-size: 2.5rem; }
.wiz-body { padding: 1.5rem 2rem; }
.wiz-foot { display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem 2rem; border-top: 1px solid rgba(255,255,255,.08); }
.wiz-save-status { flex: 1; text-align: center; font-size: .8rem; opacity: .55; }
```

## Verificação

Após implementar, faça o build de TypeScript para checar tipos:
```
cd apps/web && npx tsc --noEmit
```

Se falhar por falta dos passos reais (PassoIdentificacao/PassoRaca), os stubs já os cobrem. Erros em outros arquivos devem ser corrigidos.

## Commit

```
git add apps/web/src/app/AppContext.tsx apps/web/src/App.tsx apps/web/src/screens/SystemPickerScreen.tsx apps/web/src/screens/WizardScreen.tsx apps/web/src/screens/wizard/PassoIdentificacao.tsx apps/web/src/screens/wizard/PassoRaca.tsx apps/web/src/styles/editor-sheet.css
git commit -m "feat: WizardScreen shell — roteamento de passos e stubs"
```

## Report

Escreva o relatório completo em:
`c:\Users\victo\Documents\Projetos\OminiSheet\.superpowers\sdd\wizard-criacao-ficha\task-1-report.md`

Retorne ao controlador apenas: status (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), hash do commit, resultado do tsc, e preocupações se houver.

