# SDD ledger — plan: docs/superpowers/plans/2026-11-02-wizard-criacao-ficha.md

MERGE_BASE: f891af86e73c750954c2dd29fa09a3e1ff34744b

## Pre-flight scan

| Par | Produz | Consome | Resultado |
|-----|--------|---------|-----------|
| Task 1 → Task 2 | `WizardSession`, `openWizard`, `WizardScreen` | `PassoIdentificacao` consome `draft, setDraft, onNext, onCancel` | ✅ implementado |
| Task 1 → Task 3 | mesmas props + `passo` total | `PassoRaca` consome `draft, setDado, sistema` | ✅ implementado |
| Task 2 → Task 3 | campos em `draft.dados` | Passo 2 não lê esses campos | ✅ isolado |
| Task 3 → Task 4 | `passo`, total de passos, `draft` | barra de progresso e status de salvamento | ✅ implementado |

## Tarefas

- [x] Task 1: WizardScreen — shell e roteamento de passos (commit `ceaa476`)
- [x] Task 2: Passo 1 — Identificação fiel à imagem (commit `ceaa476`)
- [x] Task 3: Passo 2 — Raça com cards, modificadores e habilidades (commit `ceaa476`)
- [x] Task 4: Barra de status e controles de navegação (commit `ceaa476`)
