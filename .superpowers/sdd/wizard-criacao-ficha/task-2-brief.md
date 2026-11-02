# Task 2 Brief — Passo 1: Identificação

## Contexto

Projeto: OminiSheet (`c:\Users\victo\Documents\Projetos\OminiSheet`)
Stack: React 18 + TypeScript. Sem novas dependências npm.

Esta é a Task 2. A Task 1 já criou:
- `apps/web/src/screens/WizardScreen.tsx` — shell do wizard
- `apps/web/src/screens/wizard/PassoIdentificacao.tsx` — stub a ser substituído agora
- `apps/web/src/screens/wizard/PassoRaca.tsx` — stub (não mexa)

Você vai **substituir o stub** de `PassoIdentificacao.tsx` pela implementação real.

## Global Constraints

- Sem novas dependências npm
- CSS inline ou classes existentes — não criar novos arquivos `.css`
- TypeScript estrito — sem `any` não justificado
- Não mexa no WizardScreen.tsx, só no PassoIdentificacao.tsx

## Interface que o WizardScreen fornece (leia o arquivo para confirmar)

```ts
export interface PassoIdentificacaoProps {
  draft: FichaDraft;
  set: <K extends keyof FichaDraft>(k: K, v: FichaDraft[K]) => void;
  setDado: (id: string, v: Dados[string]) => void;
  onNext: () => void;
  onCancel: () => void;
}
```

## Layout de referência (fiel à imagem)

```
PASSO 1
IDENTIFICAÇÃO
"Os campos da ficha base. Só o nome é obrigatório agora."

[NOME*]  [SOBRENOME]  [JOGADOR]  [IDADE]  [PESO]
[ALTURA] [DIA DE NASC.] [ESPECIALISTA] [APELIDO]

[Retrato — área clicável 160×200 com ? quando vazio]
   [botão Enviar imagem]
   Sem imagem, a ficha usa a arte da raça.
   ENQUADRAMENTO: [Preencher | Inteira] (toggle visual)
   Zoom     [slider 0-100]
   Horizontal [slider 0-100]
   Vertical   [slider 0-100]
   [Centralizar]

(rodapé é gerenciado pelo WizardScreen — não renderize aqui)
```

## Mapeamento de campos

| Campo visual | Propriedade do draft |
|---|---|
| Nome | `draft.nome` via `set('nome', v)` |
| Sobrenome | `draft.dados['sobrenome']` via `setDado('sobrenome', v)` |
| Jogador | `draft.dados['jogador']` via `setDado('jogador', v)` |
| Idade | `draft.dados['idade']` via `setDado('idade', v)` |
| Peso | `draft.dados['peso']` via `setDado('peso', v)` |
| Altura | `draft.dados['altura']` via `setDado('altura', v)` |
| Dia de Nascimento | `draft.dados['data_nascimento']` via `setDado('data_nascimento', v)` |
| Especialista | `draft.dados['especialista']` via `setDado('especialista', v)` |
| Apelido | `draft.dados['apelido']` via `setDado('apelido', v)` |
| Retrato | `draft.imagem` via `set('imagem', base64string \| null)` |
| Enquadramento | `draft.dados['enquadramento']` ('preencher' \| 'inteira'), default 'inteira' |
| Zoom | `draft.dados['zoom_retrato']` (string '0'-'100'), default '50' |
| Horizontal | `draft.dados['pos_horizontal']` (string '0'-'100'), default '50' |
| Vertical | `draft.foco` via `set('foco', n)` (0-100, já existe no FichaDraft) |

## Retrato — lógica de upload

Reutilize exatamente a mesma lógica do `EditorScreen.tsx`:
- `shrink(file, 680, 'image/jpeg', .78)` para o retrato (importar de `../../lib/image`)
- Aceitar clique na área e drag-and-drop
- Se não houver imagem: mostrar área escura com `?` centralizado
- Botão "Enviar imagem" abre file input hidden

## Botão Centralizar

Ao clicar: `set('foco', 50)` + `setDado('pos_horizontal', '50')` + `setDado('zoom_retrato', '50')`.

## Validação de `onNext`

`onNext` é chamado pelo WizardScreen quando o usuário clica "Próximo →". O PassoIdentificacao deve expor uma forma de validar internamente — mas como o botão "Próximo →" está no WizardScreen, use este padrão:

No WizardScreen, o `handleNext` no passo 0 deve checar `draft.nome.trim()`. Se vazio, emitir um toast e focar o campo. **Porém, para que o PassoIdentificacao consiga mostrar o erro inline**, adicione ao WizardScreen a lógica:

```ts
// No handleNext do WizardScreen, passo 0:
if (passo === 0 && !draft.nome.trim()) {
  toast('O nome é obrigatório.');
  return;
}
```

Isso já deve estar no WizardScreen da Task 1. Se não estiver, adicione-o lá.

O PassoIdentificacao também deve mostrar `<em className="err">Informe o nome.</em>` abaixo do campo Nome quando o usuário sair do campo com valor vazio (onBlur + dirty state interno).

## CSS a adicionar (inline ou em editor-sheet.css)

```css
/* PassoIdentificacao */
.id-desc { font-size: .9rem; opacity: .6; margin-bottom: 1.5rem; }
.id-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: .75rem; margin-bottom: 1.5rem; }
.id-grid-2 { display: grid; grid-template-columns: repeat(4, 1fr); gap: .75rem; margin-bottom: 1.5rem; }
.id-portrait-row { display: flex; gap: 1.5rem; align-items: flex-start; }
.id-portrait-area { width: 160px; height: 200px; border-radius: 8px; border: 2px dashed rgba(255,255,255,.2); cursor: pointer; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.04); flex-shrink: 0; overflow: hidden; }
.id-portrait-area img { width: 100%; height: 100%; object-fit: cover; }
.id-portrait-area .hint-q { font-size: 3rem; opacity: .3; }
.id-portrait-controls { flex: 1; display: flex; flex-direction: column; gap: .75rem; }
.id-portrait-note { font-size: .8rem; opacity: .5; margin: 0; }
.id-toggle { display: flex; border-radius: 20px; background: rgba(255,255,255,.08); overflow: hidden; }
.id-toggle button { flex: 1; padding: .4rem .8rem; border: none; background: transparent; cursor: pointer; color: inherit; font-size: .85rem; transition: background .15s; }
.id-toggle button.active { background: rgba(255,255,255,.18); }
.id-slider-row { display: flex; flex-direction: column; gap: .25rem; }
.id-slider-row label { font-size: .8rem; opacity: .6; }
```

## Verificação

```
cd c:\Users\victo\Documents\Projetos\OminiSheet\apps\web
npx tsc --noEmit
```

## Commit

```
git add apps/web/src/screens/wizard/PassoIdentificacao.tsx apps/web/src/styles/editor-sheet.css
git commit -m "feat: wizard passo 1 — identificação do personagem"
```

## Report

Escreva o relatório em:
`c:\Users\victo\Documents\Projetos\OminiSheet\.superpowers\sdd\wizard-criacao-ficha\task-2-report.md`

Retorne ao controlador: STATUS, COMMIT, TSC, CONCERNS.

