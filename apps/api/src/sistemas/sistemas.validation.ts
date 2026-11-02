import { BadRequestException } from '@nestjs/common';
import {
  CampoDef, CampoModelo, LARGURAS, Largura, Modificador, ModeloHabilidade, OPERACOES, Operacao, Requisito, SecaoDef,
  TIPOS_CAMPO, TIPOS_CAMPO_MODELO, TipoCampo, TipoCampoModelo,
} from './sistemas.types';

const ID = /^[a-z0-9_]{1,40}$/;
const FUNCOES = new Set(['min', 'max', 'floor', 'ceil', 'round', 'abs']);
/** Fórmulas guardam referências como [id]; só esses caracteres são permitidos. */
const FORMULA_OK = /^[a-z0-9_+\-*/%^().,\s[\]]*$/i;
/** Dado: `2d6`, `d20`, `4d6kh3`, e com tamanho vindo de um campo: `1d[campo]`, `[campo]d6`. Grupos: quantidade, faces, kh/kl, quantos manter. */
const DADO = /(?<![a-z0-9_.])(\d+|\[[^\]]*\])?d(\d+|\[[^\]]*\])(?:k([hl])(\d+))?(?![a-z0-9_])/gi;

const fail = (msg: string): never => { throw new BadRequestException(msg); };
const str = (v: unknown, max: number, what: string, required = false): string => {
  if (v === undefined || v === null || v === '') { if (required) fail(`${what} é obrigatório`); return ''; }
  if (typeof v !== 'string') fail(`${what} deve ser texto`);
  const t = (v as string).trim();
  if (required && !t) fail(`${what} é obrigatório`);
  if (t.length > max) fail(`${what} passa de ${max} caracteres`);
  return t;
};

/** Ids de campos citados na fórmula: `[id]` (inclusive dentro de dados, como `1d[id]`) e, em sistemas antigos, ids soltos. */
export function variaveisDaFormula(formula: string): string[] {
  const out = new Set<string>();
  for (const m of formula.matchAll(/\[([^\]]*)\]/g)) out.add(m[1].trim().toLowerCase());
  const resto = formula.replace(new RegExp(DADO.source, 'gi'), ' ').replace(/\[[^\]]*\]/g, ' ');
  const re = /[a-z_][a-z0-9_.]*/gi;
  for (let m = re.exec(resto); m; m = re.exec(resto)) {
    if (resto.slice(m.index + m[0].length).trimStart().startsWith('(')) continue; // função
    out.add(m[0].toLowerCase().replace(/^atributos\./, ''));
  }
  return [...out];
}

export const temDados = (formula: string) => new RegExp(DADO.source, 'i').test(formula);

/** Confere caracteres, colchetes, parênteses, funções e o tamanho dos dados. Os ids citados são conferidos à parte. */
function validarFormula(formula: string, label: string, aceitaDados: boolean) {
  if (formula.length > 200) fail(`A fórmula de "${label}" passa de 200 caracteres`);
  if (!FORMULA_OK.test(formula)) fail(`A fórmula de "${label}" usa caracteres inválidos`);
  if ((formula.match(/\[/g) ?? []).length !== (formula.match(/\]/g) ?? []).length) fail(`A fórmula de "${label}" tem colchetes desbalanceados`);
  let nivel = 0;
  for (const ch of formula) {
    if (ch === '(') nivel++;
    if (ch === ')' && --nivel < 0) break;
  }
  if (nivel !== 0) fail(`A fórmula de "${label}" tem parênteses desbalanceados`);
  const semRefs = formula.replace(/\[[^\]]*\]/g, ' ');
  const re = /([a-z_][a-z0-9_]*)\s*\(/gi;
  for (let m = re.exec(semRefs); m; m = re.exec(semRefs)) {
    if (!FUNCOES.has(m[1].toLowerCase())) fail(`Função desconhecida na fórmula de "${label}": ${m[1]}`);
  }
  if (temDados(formula)) {
    if (!aceitaDados) fail(`"${label}" não pode ter dados na fórmula (o resultado mudaria a cada cálculo). Use um campo do tipo Rolagem.`);
    // quantidade e faces fixas são conferidas aqui; as que vêm de um campo, na hora de rolar
    for (const m of formula.matchAll(new RegExp(DADO.source, 'gi'))) {
      const fixo = (g: string | undefined) => (g === undefined || g.startsWith('[') ? null : Number(g));
      const n = m[1] === undefined ? 1 : fixo(m[1]), faces = fixo(m[2]);
      if (n !== null && (n < 1 || n > 100)) fail(`Quantidade de dados inválida em "${label}": ${m[0]} (use de 1 a 100)`);
      if (faces !== null && (faces < 2 || faces > 1000)) fail(`Faces inválidas em "${label}": ${m[0]} (use de 2 a 1000)`);
      if (m[4] !== undefined && (Number(m[4]) < 1 || (n !== null && Number(m[4]) > n))) fail(`Dados mantidos inválidos em "${label}": ${m[0]}`);
    }
  }
}

function validarRequisito(raw: unknown, onde: string): Requisito {
  const r = (raw ?? {}) as Record<string, unknown>;
  const rolagem = str(r.rolagem, 200, `Rolagem do requisito de ${onde}`, true);
  validarFormula(rolagem, `requisito de ${onde}`, true);
  if (!temDados(rolagem)) fail(`O requisito de ${onde} precisa de pelo menos um dado (ex.: 1d20)`);
  if (typeof r.minimo !== 'number' || !Number.isFinite(r.minimo)) fail(`O requisito de ${onde} precisa de um valor mínimo numérico`);
  const t = r.tentativas === undefined ? 1 : r.tentativas;
  if (typeof t !== 'number' || !Number.isInteger(t) || t < 0 || t > 20) fail(`As tentativas do requisito de ${onde} devem ser de 0 (ilimitadas) a 20`);
  return { rolagem, minimo: r.minimo as number, tentativas: t as number };
}

function validarModelo(raw: unknown, label: string): ModeloHabilidade {
  const m = (raw ?? {}) as Record<string, unknown>;
  const nome = str(m.nome, 40, `Nome do modelo de "${label}"`, true);
  const nomePlural = str(m.nome_plural, 40, `Nome no plural do modelo de "${label}"`) || `${nome}s`;
  if (!Array.isArray(m.campos) || !m.campos.length) fail(`O modelo "${nome}" precisa de pelo menos um campo`);
  if ((m.campos as unknown[]).length > 20) fail(`O modelo "${nome}" passa de 20 campos`);
  const ids = new Set<string>();
  const campos = (m.campos as unknown[]).map((rc): CampoModelo => {
    const c = (rc ?? {}) as Record<string, unknown>;
    const id = str(c.id, 40, 'Código do campo do modelo', true);
    if (!ID.test(id) || ids.has(id)) fail(`Código inválido ou repetido no modelo "${nome}": "${id}"`);
    ids.add(id);
    const lbl = str(c.label, 60, `Nome de campo do modelo "${nome}"`, true);
    if (!TIPOS_CAMPO_MODELO.includes(c.tipo as TipoCampoModelo)) fail(`Tipo inválido em "${lbl}" (modelo "${nome}")`);
    const tipo = c.tipo as TipoCampoModelo;
    const out: CampoModelo = { id, label: lbl, tipo };
    if (tipo === 'selecao') {
      const ops = Array.isArray(c.opcoes) ? c.opcoes.map((o) => str(o, 60, 'Opção')).filter(Boolean) : [];
      if (!ops.length) fail(`"${lbl}" (modelo "${nome}") precisa de pelo menos uma opção`);
      out.opcoes = ops.slice(0, 40);
    }
    if (tipo === 'rolagem') {
      out.formula = str(c.formula, 200, `Rolagem de "${lbl}"`, true);
      validarFormula(out.formula, lbl, true);
    }
    if (tipo === 'custo') {
      out.recurso = str(c.recurso, 40, `Recurso de "${lbl}"`, true);
      const formula = str(c.formula, 200, `Fórmula do custo "${lbl}"`);
      if (formula) { validarFormula(formula, lbl, false); out.formula = formula; }
      const marca = str(c.marca, 40, `Marca do custo "${lbl}"`);
      if (marca) out.marca = marca;
    }
    const padrao = typeof c.padrao === 'number' ? String(c.padrao) : str(c.padrao, 120, 'Valor padrão');
    if (padrao && ['texto', 'numero', 'custo'].includes(tipo)) out.padrao = padrao;
    return out;
  });
  const out: ModeloHabilidade = { nome, nome_plural: nomePlural, campos };
  if (m.requisito) out.requisito = validarRequisito(m.requisito, `"${nome}"`);
  return out;
}

/** Valida e normaliza as seções de um sistema. Qualquer problema vira 400 com uma mensagem legível. */
export function validateSecoes(input: unknown): SecaoDef[] {
  if (!Array.isArray(input) || !input.length) fail('O sistema precisa de pelo menos uma seção');
  const secoes = input as unknown[];
  if (secoes.length > 20) fail('Máximo de 20 seções');
  const secaoIds = new Set<string>(), campoIds = new Set<string>();

  const out = secoes.map((raw, si): SecaoDef => {
    const s = (raw ?? {}) as Record<string, unknown>;
    const id = str(s.id, 40, 'Id da seção', true);
    if (!ID.test(id) || secaoIds.has(id)) fail(`Id de seção inválido ou repetido: ${id}`);
    secaoIds.add(id);
    const titulo = str(s.titulo, 60, `Título da seção ${si + 1}`, true);
    if (!Array.isArray(s.campos) || !s.campos.length) fail(`A seção "${titulo}" precisa de pelo menos um campo`);
    if ((s.campos as unknown[]).length > 30) fail(`A seção "${titulo}" passa de 30 campos`);

    const campos = (s.campos as unknown[]).map((rc): CampoDef => {
      const c = (rc ?? {}) as Record<string, unknown>;
      const cid = str(c.id, 40, 'Código do campo', true);
      if (!ID.test(cid) || campoIds.has(cid)) fail(`Código de campo inválido ou repetido: "${cid}" (use letras minúsculas, números e _)`);
      campoIds.add(cid);
      const label = str(c.label, 60, 'Nome do campo', true);
      if (!TIPOS_CAMPO.includes(c.tipo as TipoCampo)) fail(`Tipo inválido no campo "${label}"`);
      const tipo = c.tipo as TipoCampo;
      const largura = LARGURAS.includes(c.largura as Largura) ? (c.largura as Largura) : 'cheia';
      const out: CampoDef = { id: cid, label, tipo, largura, destaque: c.destaque === true };
      const dica = str(c.dica, 300, 'Dica');
      if (dica) out.dica = dica;
      if (['numero', 'calculado', 'recurso'].includes(tipo)) {
        const prefixo = typeof c.prefixo === 'string' ? c.prefixo.slice(0, 12) : '', sufixo = typeof c.sufixo === 'string' ? c.sufixo.slice(0, 12) : '';
        if (prefixo) out.prefixo = prefixo;
        if (sufixo) out.sufixo = sufixo;
      }
      if (['texto', 'numero', 'booleano', 'recurso'].includes(tipo)) {
        const padrao = typeof c.padrao === 'number' || typeof c.padrao === 'boolean' ? String(c.padrao) : str(c.padrao, 120, 'Valor padrão');
        if (padrao) out.padrao = padrao;
      }
      if (tipo === 'selecao') {
        const ops = Array.isArray(c.opcoes) ? c.opcoes.map((o) => str(o, 60, 'Opção')).filter(Boolean) : [];
        if (!ops.length) fail(`O campo "${label}" precisa de pelo menos uma opção`);
        if (ops.length > 40) fail(`O campo "${label}" passa de 40 opções`);
        out.opcoes = ops;
        if (c.efeitos && typeof c.efeitos === 'object') {
          const efeitos: Record<string, Modificador[]> = {};
          for (const [opcao, lista] of Object.entries(c.efeitos as Record<string, unknown>)) {
            if (!ops.includes(opcao)) continue; // efeito de uma opção que já não existe
            if (!Array.isArray(lista)) fail(`Os efeitos de "${opcao}" em "${label}" devem ser uma lista`);
            const mods = (lista as unknown[]).slice(0, 30).map((rm): Modificador => {
              const m = (rm ?? {}) as Record<string, unknown>;
              if (!OPERACOES.includes(m.operacao as Operacao)) fail(`Operação inválida em "${opcao}" (${label})`);
              if (typeof m.valor !== 'number' || !Number.isFinite(m.valor)) fail(`Valor inválido em "${opcao}" (${label})`);
              return { campo: str(m.campo, 40, 'Campo do efeito', true), operacao: m.operacao as Operacao, valor: m.valor as number };
            });
            if (mods.length) efeitos[opcao] = mods;
          }
          if (Object.keys(efeitos).length) out.efeitos = efeitos;
        }
        if (c.requisitos && typeof c.requisitos === 'object') {
          const requisitos: Record<string, Requisito> = {};
          for (const [opcao, rq] of Object.entries(c.requisitos as Record<string, unknown>)) {
            if (ops.includes(opcao) && rq) requisitos[opcao] = validarRequisito(rq, `"${opcao}" (${label})`);
          }
          if (Object.keys(requisitos).length) out.requisitos = requisitos;
        }
      }
      if (tipo === 'atributos' && Array.isArray(c.modelo)) {
        out.modelo = c.modelo.slice(0, 40).map((m) => {
          const r = (m ?? {}) as Record<string, unknown>;
          return { n: str(r.n, 40, 'Nome do atributo'), v: str(r.v, 12, 'Valor do atributo') };
        }).filter((m) => m.n);
      }
      if (tipo === 'calculado' || tipo === 'recurso' || tipo === 'rolagem') {
        const formula = str(c.formula, 200, tipo === 'recurso' ? `Máximo de "${label}"` : `Fórmula de "${label}"`, true);
        validarFormula(formula, label, tipo === 'rolagem');
        out.formula = formula;
      }
      if (tipo === 'habilidades') out.habilidades = validarModelo(c.habilidades, label);
      return out;
    });
    return { id, titulo, campos };
  });

  // Conferências que precisam do sistema inteiro: ids citados, destinos de efeitos e ciclos entre fórmulas.
  const todos = out.flatMap((s) => s.campos);
  const porId = new Map(todos.map((c) => [c.id, c]));
  const numericos = new Set(todos.filter((c) => ['numero', 'calculado', 'recurso'].includes(c.tipo)).map((c) => c.id));
  const citaveis = new Set(todos.filter((c) => ['numero', 'calculado', 'booleano', 'recurso'].includes(c.tipo)).map((c) => c.id));
  const dependencias = new Map<string, string[]>();

  const conferirReferencias = (formula: string, label: string, proprio?: string, extras?: string[]) => {
    const deps = variaveisDaFormula(formula);
    for (const v of deps) {
      if (extras?.includes(v)) continue;
      if (!porId.has(v)) fail(`A fórmula de "${label}" cita "${v}", que não é um campo do sistema`);
      if (!citaveis.has(v)) fail(`A fórmula de "${label}" cita "${porId.get(v)!.label}", que não é um número`);
      if (v === proprio) fail(`A fórmula de "${label}" cita o próprio campo`);
    }
    return deps;
  };

  for (const c of todos) {
    if (c.tipo === 'calculado' || c.tipo === 'recurso') dependencias.set(c.id, conferirReferencias(c.formula!, c.label, c.id));
    if (c.tipo === 'rolagem') conferirReferencias(c.formula!, c.label);
    for (const [opcao, mods] of Object.entries(c.efeitos ?? {})) {
      for (const m of mods) if (!numericos.has(m.campo)) fail(`O efeito de "${opcao}" em "${c.label}" não aponta para um campo numérico, calculado ou de recurso`);
    }
    for (const [opcao, rq] of Object.entries(c.requisitos ?? {})) conferirReferencias(rq.rolagem, `requisito de "${opcao}" (${c.label})`);
    if (c.habilidades) {
      const mod = c.habilidades;
      if (mod.requisito) conferirReferencias(mod.requisito.rolagem, `requisito de "${mod.nome}"`);
      for (const cm of mod.campos) {
        if (cm.tipo === 'rolagem') conferirReferencias(cm.formula!, `${cm.label} (${mod.nome})`);
        if (cm.tipo === 'custo' && cm.formula) conferirReferencias(cm.formula, `${cm.label} (${mod.nome})`, undefined, ['valor']);
        if (cm.tipo === 'custo' && cm.marca && porId.get(cm.marca)?.tipo !== 'booleano') {
          fail(`A marca do custo "${cm.label}" do modelo "${mod.nome}" precisa apontar para um campo Sim/Não`);
        }
        if (cm.tipo === 'custo' && !(porId.get(cm.recurso!)?.tipo === 'recurso' || porId.get(cm.recurso!)?.tipo === 'numero')) {
          fail(`O custo "${cm.label}" do modelo "${mod.nome}" precisa apontar para um campo de recurso ou número`);
        }
      }
    }
  }
  const estado = new Map<string, 1 | 2>();
  const visita = (id: string, trilha: string[]) => {
    if (estado.get(id) === 2) return;
    if (estado.get(id) === 1) fail(`Fórmulas em ciclo: ${[...trilha, id].map((x) => porId.get(x)?.label ?? x).join(' → ')}`);
    estado.set(id, 1);
    for (const d of dependencias.get(id) ?? []) visita(d, [...trilha, id]);
    estado.set(id, 2);
  };
  for (const id of dependencias.keys()) visita(id, []);

  return out;
}
