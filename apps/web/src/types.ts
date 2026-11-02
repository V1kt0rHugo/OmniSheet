export interface Atributo { n: string; v: string }
export interface ItemFicha { nome: string; descricao: string; imagem: string | null; tipo?: string }

export type TipoCampo =
  | 'texto' | 'numero' | 'textarea' | 'selecao' | 'atributos' | 'calculado' | 'booleano' | 'recurso' | 'rolagem' | 'habilidades';
export type TipoCampoModelo = 'texto' | 'textarea' | 'numero' | 'selecao' | 'rolagem' | 'custo';
export type Operacao = 'somar' | 'subtrair' | 'multiplicar' | 'definir';
export type Largura = 'cheia' | 'meia' | 'terco';

/** Efeito de uma opção escolhida (raça, classe, clã...) sobre um campo numérico, calculado ou recurso (máximo). */
export interface Modificador { campo: string; operacao: Operacao; valor: number }

/** "Dado mínimo": para ter a opção (ou a habilidade) o jogador rola e precisa alcançar `minimo`. */
export interface Requisito {
  /** Fórmula com dados, ex.: `1d20 + [Sorte]` (guardada com ids: `1d20 + [sorte]`). */
  rolagem: string;
  minimo: number;
  /** 0 = ilimitadas. */
  tentativas: number;
}

/** Campo de um card de habilidade (magia, poder, técnica...). */
export interface CampoModelo {
  id: string;
  label: string;
  tipo: TipoCampoModelo;
  opcoes?: string[];
  /** `rolagem`: fórmula com dados. `custo`: fórmula do que realmente se paga, em que `[valor]` é o custo digitado no card. */
  formula?: string;
  /** `custo`: id do campo `recurso` ou `numero` que paga o custo. */
  recurso?: string;
  /** `custo`: id de um campo Sim/Não que fica marcado depois de pagar. */
  marca?: string;
  padrao?: string;
}

export interface ModeloHabilidade {
  nome: string;
  nome_plural: string;
  campos: CampoModelo[];
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
  /** Valor inicial de uma ficha nova (no recurso, o valor atual; vazio = cheio). */
  padrao?: string;
  /** Texto antes e depois do valor mostrado (ex.: `d` → `d17`, ` m` → `3 m`). */
  prefixo?: string;
  sufixo?: string;
  opcoes?: string[];
  /** Só para `selecao`: modificadores por nome de opção. */
  efeitos?: Record<string, Modificador[]>;
  /** Só para `selecao`: opções que exigem uma rolagem para serem escolhidas. */
  requisitos?: Record<string, Requisito>;
  modelo?: Atributo[];
  /** `calculado`: expressão. `recurso`: o máximo. `rolagem`: a rolagem (pode ter dados). Referências por id: `[vigor]`. */
  formula?: string;
  /** Só para `habilidades`. */
  habilidades?: ModeloHabilidade;
}

export interface SecaoDef { id: string; titulo: string; campos: CampoDef[] }

export interface Sistema {
  id: string;
  nome: string;
  descricao: string;
  secoes: SecaoDef[];
  builtin: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/** Um card de habilidade na ficha: valores por id de campo do modelo. */
export interface Carta { id: string; valores: Record<string, string> }
export interface CartasValor { cartas: Carta[] }

export interface TentativaRolagem { total: number; texto: string }
/** Rolagens de requisito já feitas, por chave `campo.opcao`. Guardado em `dados._rolls`. */
export type RegistroRolagens = Record<string, { tentativas: TentativaRolagem[]; aprovado: boolean }>;

/** Valores dos campos do sistema, indexados pelo id do campo. */
export type Dados = Record<string, string | Atributo[] | CartasValor | RegistroRolagens>;

export interface Ficha {
  id: string;
  sistemaId: string;
  nome: string;
  epiteto: string;
  campanha: string;
  status: string;
  resumo: string;
  dados: Dados;
  item: ItemFicha;
  imagem: string | null;
  foco: number;
  cor: number;
  demo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/** Ficha em edição ou ainda não salva: o id já existe para o formato do fragmento ser estável. */
export type FichaDraft = Omit<Ficha, 'criadoEm' | 'atualizadoEm'>;
export type FichaInput = Partial<FichaDraft>;
