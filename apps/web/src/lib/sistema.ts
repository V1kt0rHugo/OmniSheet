import type { Atributo, CampoDef, CartasValor, Dados, Ficha, RegistroRolagens, Sistema } from '../types';
import { calcular, comFormato, formatar } from './calculo';

export const camposDe = (s: Sistema) => s.secoes.flatMap((x) => x.campos);

/** Campos que uma fórmula pode citar por nome: números, calculados, Sim/Não e recursos (o máximo). */
export const refsCitaveis = (s: Sistema) =>
  camposDe(s).filter((c) => ['numero', 'calculado', 'booleano', 'recurso'].includes(c.tipo) && c.label.trim()).map((c) => ({ id: c.id, label: c.label }));

/** Chave reservada em `dados` para as rolagens de requisito já feitas. */
export const CHAVE_ROLAGENS = '_rolls';

export const ehTexto = (v: unknown): v is string => typeof v === 'string';
export const ehAtributos = (v: unknown): v is Atributo[] => Array.isArray(v);
export const ehCartas = (v: unknown): v is CartasValor => !!v && typeof v === 'object' && !Array.isArray(v) && 'cartas' in v;

export const textoDe = (dados: Dados | undefined, id: string) => { const v = dados?.[id]; return ehTexto(v) ? v : ''; };
export const atributosDe = (dados: Dados | undefined, id: string): Atributo[] => { const v = dados?.[id]; return ehAtributos(v) ? v : []; };
export const cartasDe = (dados: Dados | undefined, id: string) => { const v = dados?.[id]; return ehCartas(v) ? v.cartas : []; };
export const rolagensDe = (dados: Dados | undefined): RegistroRolagens => {
  const v = dados?.[CHAVE_ROLAGENS];
  return v && typeof v === 'object' && !Array.isArray(v) && !('cartas' in v) ? (v as RegistroRolagens) : {};
};

/** Valor de um campo numa ficha nova: o padrão do sistema, ou vazio ('false' nos Sim/Não, sem cards nas habilidades). */
export const valorVazio = (c: CampoDef): Dados[string] => {
  if (c.tipo === 'atributos') return [];
  if (c.tipo === 'habilidades') return { cartas: [] };
  if (c.tipo === 'booleano') return c.padrao === 'true' ? 'true' : 'false';
  return c.padrao ?? '';
};

/** Dados completos do sistema: o que a ficha já tem, mais o vazio dos campos novos (e as rolagens de requisito). */
export function dadosCompletos(s: Sistema, dados: Dados = {}): Dados {
  const out: Dados = {};
  for (const c of camposDe(s)) out[c.id] = dados[c.id] ?? valorVazio(c);
  if (dados[CHAVE_ROLAGENS]) out[CHAVE_ROLAGENS] = dados[CHAVE_ROLAGENS];
  return out;
}

/** Valores dos campos marcados como destaque: viram etiquetas na ficha e a linha de resumo no Hall. */
export function destaques(f: Pick<Ficha, 'dados'>, s?: Sistema): string[] {
  if (!s) return [];
  const calc = calcular(s, f.dados);
  const out: string[] = [];
  for (const c of camposDe(s)) {
    if (!c.destaque) continue;
    if (c.tipo === 'numero' || c.tipo === 'calculado') {
      const v = calc.valores[c.id];
      if (c.tipo === 'calculado' || textoDe(f.dados, c.id).trim() || (calc.bonus[c.id]?.length ?? 0) > 0) out.push(`${c.label} ${comFormato(c, formatar(v))}`);
    } else if (c.tipo === 'recurso') {
      out.push(`${c.label} ${formatar(calc.atuais[c.id])}/${formatar(calc.valores[c.id])}`);
    } else if (c.tipo === 'booleano') {
      if (f.dados?.[c.id] === 'true') out.push(c.label);
    } else if (['texto', 'selecao'].includes(c.tipo)) {
      const v = textoDe(f.dados, c.id).trim();
      if (v) out.push(v);
    }
  }
  return out;
}

export function textoDeBusca(f: Ficha, s?: Sistema): string {
  return [f.nome, f.epiteto, f.campanha, s?.nome, ...destaques(f, s)].join(' ');
}
