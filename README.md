# Hall da Fama (OminiSheet)

Hall para guardar os personagens de RPG. Cada fragmento de vidro é uma identidade (ficha) diferente do mesmo personagem.

## Stack
- `apps/web`: React 18 + TypeScript + Vite + TanStack Query
- `apps/api`: NestJS 11 + Prisma + PostgreSQL
- `docker-compose.yml`: PostgreSQL 16 (porta do host 5434)

## Como rodar
```bash
npm install
cp .env.example .env                       # opcional, há defaults
cp apps/api/.env.example apps/api/.env
npm run db:up                              # sobe o Postgres
npm run prisma:migrate -w apps/api         # aplica as migrations
npm run dev:api                            # http://localhost:3000/api
npm run dev:web                            # http://localhost:5173 (proxy /api -> :3000)
```

## Sistemas de RPG
Cada ficha pertence a um **sistema**, que define os campos específicos dela (o que há de comum, como nome, retrato e item, vale para todos). Ao criar uma ficha, a primeira etapa é escolher o sistema.

**Os sistemas são definidos no código**, em `apps/api/src/sistemas/definicoes/` (já vêm *Livre*, *D&D 5e* e *Mouneteria*). Para adicionar um, crie um arquivo lá, coloque-o na lista de `definicoes/index.ts` e reinicie a API: ela confere a definição ao iniciar e diz o que corrigir se algo estiver errado. Passo a passo, tipos de campo, fórmulas, dados e um exemplo completo em [docs/adicionando-sistemas.md](docs/adicionando-sistemas.md).

O que um sistema pode usar:
- **Tipos de campo:** texto, texto longo, número, Sim/Não, lista de opções, atributos (nome e valor), **calculado** (fórmula), **recurso** (atual / máximo), **rolagem** e **habilidades** (cards de magias, poderes...).
- **Fórmulas:** citam outros campos por id entre colchetes (`[vigor] * 5 + [nivel] * 2`, exibidas com o nome do campo). Aceitam `+ - * / % ^`, parênteses e `min max floor ceil round abs`.
- **Efeitos:** cada opção de uma lista pode somar, subtrair, multiplicar ou definir um campo numérico, calculado ou o máximo de um recurso. Eles entram antes das fórmulas, então um bônus de Vigor também sobe a Vida calculada a partir dele.
- **Dados:** `2d6`, `d20`, `4d6kh3` (mantém os 3 maiores), `4d6kl2`, sorteados com `crypto` (o tamanho do dado pode vir de um campo: `1d[dado_forca]`), em campos de rolagem, em requisitos e nos cards. A conta aparece passo a passo.
- **Dado mínimo:** uma opção de lista, ou a aquisição de um card, pode exigir uma rolagem com valor mínimo e um número de tentativas. Aprovação e tentativas ficam guardadas na ficha. A regra é aplicada pelo navegador, sem verificação no servidor.

## API
`GET/POST /api/fichas`, `GET/PATCH/DELETE /api/fichas/:id`
`GET /api/sistemas`, `GET /api/sistemas/:id` (somente leitura: os sistemas vêm do código)
`POST /api/fichas/bulk` (cria várias), `DELETE /api/fichas` (apaga tudo) e `DELETE /api/fichas?demo=true` (só as de exemplo)

## Frontend (`apps/web/src`)
- `App.tsx`: estado de navegação entre telas, modal, toast; expõe tudo via `app/AppContext`
- `screens/`: Title, Menu, Hall (espiral de fragmentos), escolha de sistema, Editor, Sheet
- `components/`: Frag (fragmento de vidro), HallPanel, HallSearch, OptionsModal, Shell
- `lib/`: arte provisória e formas dos fragmentos, sons, vidro quebrando, redução de imagens
- `api/`: cliente HTTP e hooks do TanStack Query

