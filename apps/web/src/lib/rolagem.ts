import type { CampoModelo, Dados, Requisito, Sistema, TentativaRolagem } from '../types';
import type { Calculo } from './calculo';
import { avaliar, rolar, type ResultadoRolagem } from './formula';
import { camposDe, rolagensDe } from './sistema';

/** Rola uma fórmula do sistema usando os valores atuais da ficha; os nomes aparecem na conta. */
export function rolarNoSistema(sistema: Sistema, calc: Calculo, formula: string): ResultadoRolagem | null {
  const nomes = Object.fromEntries(camposDe(sistema).map((c) => [c.id, c.label]));
  return rolar(formula, (id) => calc.valores[id] ?? null, (id) => nomes[id] ?? id);
}

export const chaveRequisito = (campoId: string, opcao: string) => `${campoId}.${opcao}`;

export interface EstadoRequisito {
  aprovado: boolean;
  tentativas: TentativaRolagem[];
  /** Tentativas que ainda restam; null = ilimitadas. */
  restantes: number | null;
  esgotado: boolean;
}

/** Situação de um requisito de rolagem para uma opção, a partir do que já foi rolado na ficha. */
export function estadoRequisito(dados: Dados | undefined, campoId: string, opcao: string, req: Requisito): EstadoRequisito {
  const reg = rolagensDe(dados)[chaveRequisito(campoId, opcao)];
  const tentativas = reg?.tentativas ?? [];
  const aprovado = reg?.aprovado === true;
  const restantes = req.tentativas === 0 ? null : Math.max(0, req.tentativas - tentativas.length);
  return { aprovado, tentativas, restantes, esgotado: !aprovado && restantes === 0 };
}

export const descreverRequisito = (r: Requisito, nomeDeFormula: (f: string) => string) => `${nomeDeFormula(r.rolagem)} ≥ ${r.minimo}`;

/**
 * O que realmente se paga por um custo de card. Sem fórmula é o próprio valor; com fórmula, `[valor]` é o custo
 * digitado e os demais nomes vêm da ficha (ex.: Intelecto reduzindo a mana). Nunca fica negativo.
 */
export function custoEfetivo(m: Pick<CampoModelo, 'formula'>, base: number, calc: Calculo): number {
  if (!m.formula) return base;
  const v = avaliar(m.formula, (id) => (id === 'valor' ? base : calc.valores[id] ?? null));
  return v === null ? base : Math.max(0, v);
}
