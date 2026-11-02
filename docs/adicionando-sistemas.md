# Como adicionar um sistema de RPG

Os sistemas são definidos **no código**, em `apps/api/src/sistemas/definicoes/`. Não existe tela para criar sistemas.

## Passo a passo

1. Crie `apps/api/src/sistemas/definicoes/meusistema.ts` (copie o `livre.ts` ou o exemplo abaixo).
2. Importe-o e coloque-o na lista `SISTEMAS` em `definicoes/index.ts`. A ordem da lista é a ordem na tela de escolha.
3. Reinicie a API (`npm run dev:api`).
   - Ela **confere a definição ao iniciar**. Se houver erro, a API não sobe e a mensagem diz o sistema e o campo, por exemplo: `Sistema "Cinzas de Neon" (neon) inválido: A fórmula de "Vida" cita "vigr", que não é um campo do sistema`.
   - Se estiver tudo certo, o sistema aparece em *Nova ficha*. Não precisa de migration.
4. Para **remover** um sistema, tire-o da lista. Ele some do banco, a não ser que ainda existam fichas dele (nesse caso a API avisa no log e o mantém).

## Estrutura

```ts
import { DefinicaoSistema } from '../sistemas.types';

export const meuSistema: DefinicaoSistema = {
  id: 'meusistema',          // estável! as fichas apontam para ele (a-z, 0-9, - e _)
  nome: 'Meu Sistema',
  descricao: 'Aparece no cartão da tela de escolha.',
  secoes: [                  // cada seção é um bloco da ficha
    { id: 'status', titulo: 'Status', campos: [ /* ... */ ] },
  ],
};
```

Campos `numero`, `calculado` e `recurso` aceitam `prefixo` e `sufixo` só de exibição (`prefixo: 'd'` mostra `d17`; `sufixo: ' m'` mostra `7 m`). `dica` (até 300 caracteres) aparece ao lado do nome do campo.

Cada campo tem `id` (único no sistema, `a-z 0-9 _`, **não mude depois que houver fichas**), `label`, `tipo`, `largura` (`'cheia' | 'meia' | 'terco'`) e `destaque` (mostra como etiqueta na ficha e no painel do Hall).

## Tipos de campo

| `tipo` | Para quê | Extras |
|---|---|---|
| `texto` | Uma linha de texto | `padrao` |
| `textarea` | Texto longo | |
| `numero` | Número que o jogador digita; recebe bônus | `padrao` |
| `booleano` | Caixa Sim/Não | `padrao: 'true'` |
| `selecao` | Escolha de uma lista (raça, classe, clã…) | `opcoes`, `efeitos`, `requisitos` |
| `atributos` | Linhas de nome e valor que o jogador monta | `modelo: [{ n: 'FOR', v: '10' }]` |
| `calculado` | Valor calculado por fórmula; o jogador não digita | `formula` |
| `recurso` | Valor atual e máximo (vida, mana) | `formula` (o máximo), `padrao` (atual inicial; vazio = cheio) |
| `rolagem` | Botão que rola dados | `formula` (aceita dados) |
| `habilidades` | Lista de cards (magias, poderes, técnicas) | `habilidades` (modelo do card) |

## Fórmulas

- Cite outros campos por **id entre colchetes**: `'[vigor] * 5 + [nivel] * 2'`. Na tela aparecem com o **nome** do campo (`[Vigor] * 5 …`).
- Operadores `+ - * / % ^`, parênteses e `min max floor ceil round abs`.
- Só podem ser citados campos `numero`, `calculado`, `booleano` e `recurso` (o valor citado é o **máximo**). Ciclos são recusados.
- **Dados** (`2d6`, `d20`, `4d6kh3` = mantém os 3 maiores, `4d6kl2`): só em `rolagem`, em requisitos e em campos `rolagem` de cards. `calculado` e o máximo de `recurso` não aceitam dados.
- **Dado com tamanho vindo de um campo:** `1d[dado_forca]` (faces) e `[nivel]d6` (quantidade). O campo precisa valer um número inteiro (de 1 a 100 dados, de 2 a 1000 faces); se não valer, a rolagem avisa que não deu para rolar. Exemplo da Mouneteria: `dado_forca` é um `calculado` `15 + 2 * floor([forca] / 5)` e a rolagem é `1d[dado_forca] + [bonus_forca]`.

## Efeitos e dado mínimo em listas (`selecao`)

```ts
{
  id: 'classe', label: 'Classe', tipo: 'selecao', largura: 'meia', destaque: true,
  opcoes: ['Guerreiro', 'Mago'],
  // bônus de quem escolher a opção; alvo: campo numero, calculado ou recurso (altera o máximo)
  // operacao: 'somar' | 'subtrair' | 'multiplicar' | 'definir'
  efeitos: { Guerreiro: [{ campo: 'forca', operacao: 'somar', valor: 2 }] },
  // para escolher "Mago", rolar 1d20 + Inteligência e tirar >= 15; tentativas: 0 = quantas quiser
  requisitos: { Mago: { rolagem: '1d20 + [inteligencia]', minimo: 15, tentativas: 0 } },
}
```

> Atenção: `efeitos`, `requisitos` e o valor salvo nas fichas usam o **texto da opção**. Renomear uma opção depois de existirem fichas as deixa órfãs.

## Habilidades (cards)

```ts
{
  id: 'magias', label: 'Magias', tipo: 'habilidades',
  habilidades: {
    nome: 'Magia', nome_plural: 'Magias',
    campos: [   // tipos do card: texto, textarea, numero, selecao, rolagem, custo
      { id: 'nome', label: 'Nome', tipo: 'texto' },
      { id: 'custo', label: 'Custo', tipo: 'custo', recurso: 'mana', padrao: '3' },   // gasta o campo "mana" ao clicar em Usar
      { id: 'dano', label: 'Dano', tipo: 'rolagem', formula: '2d6 + [inteligencia]' },
    ],
    // opcional: rolar um dado mínimo para ganhar um card novo
    requisito: { rolagem: '1d20', minimo: 8, tentativas: 0 },
  },
}
```

### Custo que depende da ficha (`formula` e `marca`)

Um campo `custo` pode ter `formula`, que diz o que realmente se paga: `[valor]` é o custo digitado no card e o resto são campos da ficha. Com `marca` (id de um campo `booleano`), o campo fica marcado depois de pagar. Exemplo da Mouneteria:

```ts
// o Intelecto reduz o custo de mana em 1 por ponto, no máximo 50% do custo
{ id: 'custo_mana', label: 'Custo de Mana', tipo: 'custo', recurso: 'mana', padrao: '0',
  formula: '[valor] - min([intelecto], floor([valor] / 2))' },
// a 2ª skill no mesmo turno gasta o dobro de Fôlego; a 1ª marca "skill_usada"
{ id: 'custo_folego', label: 'Custo de Fôlego', tipo: 'custo', recurso: 'folego', padrao: '1',
  formula: '[valor] * (1 + [skill_usada])', marca: 'skill_usada' },
```

O jogador desmarca o campo Sim/Não manualmente quando o turno recomeça: o motor não tem eventos de turno.

## Exemplo completo

```ts
import { DefinicaoSistema } from '../sistemas.types';

export const neon: DefinicaoSistema = {
  id: 'neon',
  nome: 'Cinzas de Neon',
  descricao: 'Cyberpunk simples: Vigor e Reflexo, vida calculada e implantes que exigem teste.',
  secoes: [
    {
      id: 'status', titulo: 'Status', campos: [
        { id: 'vigor', label: 'Vigor', tipo: 'numero', largura: 'terco', destaque: false, padrao: '3' },
        { id: 'reflexo', label: 'Reflexo', tipo: 'numero', largura: 'terco', destaque: false, padrao: '3' },
        { id: 'vida', label: 'Vida', tipo: 'recurso', largura: 'meia', destaque: true, formula: '[vigor] * 5 + 10' },
        { id: 'esquiva', label: 'Esquiva', tipo: 'calculado', largura: 'terco', destaque: true, formula: '8 + [reflexo]' },
        { id: 'ciber', label: 'Ciberpsicose', tipo: 'booleano', largura: 'terco', destaque: false },
      ],
    },
    {
      id: 'origem', titulo: 'Origem', campos: [
        {
          id: 'origem', label: 'Origem', tipo: 'selecao', largura: 'meia', destaque: true,
          opcoes: ['Humano', 'Ciborgue'],
          efeitos: { Ciborgue: [{ campo: 'vigor', operacao: 'somar', valor: 2 }] },
          requisitos: { Ciborgue: { rolagem: '1d20 + [vigor]', minimo: 12, tentativas: 1 } },
        },
      ],
    },
    {
      id: 'combate', titulo: 'Combate', campos: [
        { id: 'ataque', label: 'Ataque', tipo: 'rolagem', largura: 'meia', destaque: false, formula: '1d20 + [reflexo]' },
      ],
    },
    {
      id: 'implantes', titulo: 'Implantes', campos: [
        {
          id: 'implantes', label: 'Implantes', tipo: 'habilidades', largura: 'cheia', destaque: false,
          habilidades: {
            nome: 'Implante', nome_plural: 'Implantes',
            campos: [
              { id: 'nome', label: 'Nome', tipo: 'texto' },
              { id: 'custo', label: 'Custo de vida', tipo: 'custo', recurso: 'vida', padrao: '2' },
              { id: 'dano', label: 'Dano', tipo: 'rolagem', formula: '1d6 + [vigor]' },
            ],
          },
        },
      ],
    },
    { id: 'notas', titulo: 'Anotações', campos: [{ id: 'historia', label: 'História', tipo: 'textarea', largura: 'cheia', destaque: false }] },
  ],
};
```

## Erros comuns

| Mensagem | Causa |
|---|---|
| `cita "x", que não é um campo do sistema` | Id errado na fórmula, ou o campo está em outro sistema |
| `cita "X", que não é um número` | A fórmula usa um campo `texto`, `selecao`… |
| `Fórmulas em ciclo: A → B → A` | Dois campos dependem um do outro |
| `não pode ter dados na fórmula` | Dados em `calculado` ou no máximo de `recurso`; use um campo `rolagem` |
| `Código de campo inválido ou repetido` | Id com maiúscula, acento ou espaço, ou usado duas vezes |
| `precisa apontar para um campo de recurso ou número` | `custo.recurso` aponta para um campo que não é `recurso` nem `numero` |

## Limites do que o motor entende hoje

Comparações (`<=`, `>=`), `if`, dados `dF`/explosivos/pools, condições em efeitos, estado entre usos (turnos, "usou consecutivamente"), tabelas por nível e faixas de resultado de teste **ainda não existem**. Se o seu sistema precisar disso, o motor (`apps/web/src/lib/formula.ts` e `calculo.ts`) é que precisa crescer, não a definição.
