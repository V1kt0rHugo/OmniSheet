export const TIPOS_CAMPO = [
  'texto', 'numero', 'textarea', 'selecao', 'atributos', 'calculado', 'booleano', 'recurso', 'rolagem', 'habilidades',
] as const;
export const TIPOS_CAMPO_MODELO = ['texto', 'textarea', 'numero', 'selecao', 'rolagem', 'custo'] as const;
export const LARGURAS = ['cheia', 'meia', 'terco'] as const;
export const OPERACOES = ['somar', 'subtrair', 'multiplicar', 'definir'] as const;

export type TipoCampo = (typeof TIPOS_CAMPO)[number];
export type TipoCampoModelo = (typeof TIPOS_CAMPO_MODELO)[number];
export type Largura = (typeof LARGURAS)[number];
export type Operacao = (typeof OPERACOES)[number];

/** Efeito de uma opção escolhida (raça, classe, clã...) sobre um campo numérico, calculado ou recurso (máximo). */
export interface Modificador {
  campo: string;
  operacao: Operacao;
  valor: number;
}

/** "Dado mínimo": para ter a opção (ou a habilidade) o jogador rola e precisa alcançar `minimo`. */
export interface Requisito {
  /** Fórmula com dados, ex.: `1d20 + [Sorte]`. */
  rolagem: string;
  minimo: number;
  /** Quantas tentativas; 0 = ilimitadas. */
  tentativas: number;
}

/** Campo de um card de habilidade (magia, poder, técnica...). */
export interface CampoModelo {
  id: string;
  label: string;
  tipo: TipoCampoModelo;
  opcoes?: string[];
  /** `rolagem`: fórmula com dados, ex.: `2d6 + [Força]`. `custo`: fórmula do que realmente se paga, em que `[valor]` é o custo digitado no card. */
  formula?: string;
  /** `custo`: id do campo `recurso` ou `numero` que paga o custo. */
  recurso?: string;
  /** `custo`: id de um campo `booleano` que fica marcado depois de pagar (ex.: "já usou uma skill neste turno"). */
  marca?: string;
  padrao?: string;
}

export interface ModeloHabilidade {
  nome: string;
  nome_plural: string;
  campos: CampoModelo[];
  /** Rolagem exigida para adicionar um card. */
  requisito?: Requisito;
}

export interface CampoDef {
  id: string;
  label: string;
  tipo: TipoCampo;
  largura: Largura;
  /** Aparece como etiqueta no topo da ficha e na linha de resumo do Hall. */
  destaque: boolean;
  dica?: string;
  /** Valor inicial de uma ficha nova (texto, número ou booleano "true"/"false"; no recurso, o valor atual). */
  padrao?: string;
  /** Texto antes e depois do valor mostrado (ex.: `d` → `d17`, ` m` → `3 m`). Só para números, calculados e recursos. */
  prefixo?: string;
  sufixo?: string;
  /** Só para `selecao`. */
  opcoes?: string[];
  /** Só para `selecao`: modificadores aplicados quando a opção está escolhida, por nome de opção. */
  efeitos?: Record<string, Modificador[]>;
  /** Só para `selecao`: opções que exigem uma rolagem para serem escolhidas. */
  requisitos?: Record<string, Requisito>;
  /** Só para `atributos`: valores sugeridos pelo botão "Usar modelo". */
  modelo?: { n: string; v: string }[];
  /** `calculado`: expressão sobre outros campos, ex.: `[Vigor] * 5`. `recurso`: o máximo. `rolagem`: a rolagem (pode ter dados). */
  formula?: string;
  /** Só para `habilidades`. */
  habilidades?: ModeloHabilidade;
}

export interface SecaoDef {
  id: string;
  titulo: string;
  campos: CampoDef[];
}

/** Um sistema de RPG definido no código (`definicoes/`). */
export interface DefinicaoSistema {
  /** Identificador estável: as fichas apontam para ele. Letras minúsculas, números, - e _. */
  id: string;
  nome: string;
  descricao: string;
  secoes: SecaoDef[];
}
