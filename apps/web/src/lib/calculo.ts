import type { CampoDef, Dados, Modificador, Operacao, Sistema } from '../types';
import { avaliar, formatarNumero } from './formula';

export interface Bonus { origem: string; operacao: Operacao; valor: number }

export interface Calculo {
  /** Valor final de cada campo numérico, calculado, booleano ou recurso (máximo), já com modificadores. null = indisponível. */
  valores: Record<string, number | null>;
  /** Valor que o campo teria sem nenhum modificador. */
  base: Record<string, number | null>;
  /** Modificadores que estão agindo sobre cada campo, com a opção que os causa. */
  bonus: Record<string, Bonus[]>;
  /** Valor atual de cada recurso (limitado entre 0 e o máximo). */
  atuais: Record<string, number>;
}

const numero = (v: unknown): number => {
  if (typeof v !== 'string') return 0;
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

function aplicar(valor: number, m: { operacao: Operacao; valor: number }): number {
  switch (m.operacao) {
    case 'somar': return valor + m.valor;
    case 'subtrair': return valor - m.valor;
    case 'multiplicar': return valor * m.valor;
    default: return m.valor;
  }
}

/**
 * Resolve os campos numéricos de uma ficha: valor digitado → fórmulas dos campos calculados e dos máximos de recurso →
 * modificadores das opções escolhidas (raça, classe...). Os modificadores entram antes das fórmulas
 * que dependem do campo, então um bônus de Vigor também sobe a Vida calculada a partir dele.
 */
export function calcular(sistema: Sistema, dados: Dados | undefined): Calculo {
  const campos = new Map<string, CampoDef>();
  for (const s of sistema.secoes) for (const c of s.campos) campos.set(c.id, c);

  // modificadores ativos, na ordem em que as listas de opções aparecem no sistema
  const bonus: Record<string, Bonus[]> = {};
  for (const c of campos.values()) {
    if (c.tipo !== 'selecao') continue;
    const escolhida = dados?.[c.id];
    if (typeof escolhida !== 'string') continue;
    for (const m of (c.efeitos?.[escolhida] ?? []) as Modificador[]) {
      (bonus[m.campo] ??= []).push({ origem: escolhida, operacao: m.operacao, valor: m.valor });
    }
  }

  const base: Record<string, number | null> = {};
  const valores: Record<string, number | null> = {};
  const emCalculo = new Set<string>();

  const calcularBase = (c: CampoDef): number | null => {
    if (c.tipo === 'numero') return numero(dados?.[c.id]);
    if (c.tipo === 'booleano') return dados?.[c.id] === 'true' ? 1 : 0;
    if ((c.tipo === 'calculado' || c.tipo === 'recurso') && c.formula) return avaliar(c.formula, final);
    return null;
  };

  function final(id: string): number | null {
    if (id in valores) return valores[id];
    const c = campos.get(id);
    if (!c || !['numero', 'calculado', 'booleano', 'recurso'].includes(c.tipo)) return null;
    if (emCalculo.has(id)) return null; // fórmulas em ciclo
    emCalculo.add(id);
    // a base de um calculado já usa os valores finais dos campos que ele cita
    let v = calcularBase(c);
    base[id] = v;
    if (v !== null) for (const b of bonus[id] ?? []) v = aplicar(v, b);
    emCalculo.delete(id);
    valores[id] = v;
    return v;
  }

  for (const id of campos.keys()) final(id);

  const atuais: Record<string, number> = {};
  for (const c of campos.values()) {
    if (c.tipo !== 'recurso') continue;
    const max = Math.max(0, valores[c.id] ?? 0);
    const bruto = dados?.[c.id];
    // vazio = cheio; fora dos limites é corrigido
    atuais[c.id] = typeof bruto === 'string' && bruto.trim() !== '' ? Math.min(max, Math.max(0, numero(bruto))) : max;
  }
  return { valores, base, bonus, atuais };
}

/** Número para mostrar: inteiros sem casas, o resto com até 2 casas. */
export function formatar(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return formatarNumero(v);
}

const ROTULO: Record<Operacao, (v: number) => string> = {
  somar: (v) => (v >= 0 ? `+${formatar(v)}` : formatar(v)),
  subtrair: (v) => `−${formatar(v)}`,
  multiplicar: (v) => `×${formatar(v)}`,
  definir: (v) => `=${formatar(v)}`,
};

/** Resumo dos modificadores de um campo, ex.: "+2 de Ciborgue". */
export const descreverBonus = (lista: Bonus[]) => lista.map((b) => `${ROTULO[b.operacao](b.valor)} de ${b.origem}`).join(', ');

/** Efeito de uma opção, ex.: "+2 Vigor". */
export const descreverEfeito = (m: Modificador, nomeDoCampo: string) => `${ROTULO[m.operacao](m.valor)} ${nomeDoCampo}`;

/** Aplica prefixo e sufixo do campo ao valor já formatado (`d` + `17` → `d17`). */
export const comFormato = (c: Pick<CampoDef, 'prefixo' | 'sufixo'>, texto: string) => `${c.prefixo ?? ''}${texto}${c.sufixo ?? ''}`;
