/**
 * Motor de fórmulas das fichas. Sem `eval`: uma gramática pequena e fechada
 * (números, referências `[campo]`, dados `2d6`, + - * / % ^, parênteses e algumas funções).
 *
 * - Fórmulas determinísticas (campos calculados, máximos) são avaliadas por `avaliar`; dados não entram nelas.
 * - Rolagens (campo Rolagem, requisitos, habilidades) usam `rolar`, que sorteia os dados com `crypto`.
 */
/** Quantidade ou faces de um dado: um número fixo ou o valor de um campo (`1d[dado_forca]`). */
export type Quant = number | { ref: string };

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'dado'; n: Quant; m: Quant; keep?: { modo: 'h' | 'l'; q: number } };

const FUNCOES: Record<string, (...a: number[]) => number> = {
  min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, round: Math.round, abs: Math.abs,
};

const MAX_DADOS = 100;
const MAX_FACES = 1000;

const quant = (t: string): Quant => (t.startsWith('[') ? { ref: t.slice(1, -1).trim().toLowerCase() } : Number(t));

function tokenizar(src: string): Token[] {
  const out: Token[] = [];
  // dado (`2d6`, `d20`, `1d[campo]`, `[campo]d6`) | colchetes | número | id solto (formato antigo) | operador
  const re = /\s*(?:(\d+|\[[^\]]*\])?d(\d+|\[[^\]]*\])(?:k([hl])(\d+))?(?![a-z0-9_])|\[([^\]]*)\]|(\d+(?:\.\d+)?)|([a-z_][a-z0-9_.]*)|([-+*/%^(),]))/giy;
  let fim = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    fim = re.lastIndex;
    if (m[2] !== undefined) {
      const n = m[1] === undefined ? 1 : quant(m[1]), faces = quant(m[2]);
      if (typeof n === 'number' && (n < 1 || n > MAX_DADOS)) throw new Error(`Use de 1 a ${MAX_DADOS} dados (achei ${n})`);
      if (typeof faces === 'number' && (faces < 2 || faces > MAX_FACES)) throw new Error(`Um dado precisa ter de 2 a ${MAX_FACES} faces (achei d${faces})`);
      const keep = m[3] ? { modo: m[3].toLowerCase() as 'h' | 'l', q: Number(m[4]) } : undefined;
      if (keep && (keep.q < 1 || (typeof n === 'number' && keep.q > n))) throw new Error(`Não dá para manter ${keep.q} de ${n} dados`);
      out.push({ t: 'dado', n, m: faces, keep });
    } else if (m[5] !== undefined) out.push({ t: 'id', v: m[5].trim().toLowerCase() });
    else if (m[6] !== undefined) out.push({ t: 'num', v: parseFloat(m[6]) });
    else if (m[7] !== undefined) out.push({ t: 'id', v: m[7].toLowerCase().replace(/^atributos\./, '') });
    else out.push({ t: 'op', v: m[8] });
  }
  if (src.slice(fim).trim()) throw new Error(`Caractere inesperado perto de "${src.slice(fim).trim()[0]}"`);
  return out;
}

export interface NoDado { k: 'dado'; n: Quant; m: Quant; keep?: { modo: 'h' | 'l'; q: number } }
export type No =
  | { k: 'num'; v: number }
  | { k: 'var'; id: string }
  | { k: 'neg'; a: No }
  | { k: 'par'; a: No }
  | { k: 'bin'; op: string; a: No; b: No }
  | { k: 'fn'; nome: string; args: No[] }
  | NoDado;

function analisar(src: string): No {
  const toks = tokenizar(src);
  if (!toks.length) throw new Error('A fórmula está vazia');
  let i = 0;
  const peek = () => toks[i];
  const op = (v: string) => peek()?.t === 'op' && (peek() as { v: string }).v === v;

  const expr = (): No => {
    let a = termo();
    while (op('+') || op('-')) { const o = (toks[i++] as { v: string }).v; a = { k: 'bin', op: o, a, b: termo() }; }
    return a;
  };
  const termo = (): No => {
    let a = unario();
    while (op('*') || op('/') || op('%')) { const o = (toks[i++] as { v: string }).v; a = { k: 'bin', op: o, a, b: unario() }; }
    return a;
  };
  const unario = (): No => {
    if (op('-')) { i++; return { k: 'neg', a: unario() }; }
    if (op('+')) { i++; return unario(); }
    const base = atomo();
    if (op('^')) { i++; return { k: 'bin', op: '^', a: base, b: unario() }; }
    return base;
  };
  const atomo = (): No => {
    const tk = toks[i++];
    if (!tk) throw new Error('A fórmula termina antes da hora');
    if (tk.t === 'num') return { k: 'num', v: tk.v };
    if (tk.t === 'dado') return { k: 'dado', n: tk.n, m: tk.m, keep: tk.keep };
    if (tk.t === 'id') {
      if (op('(')) {
        if (!FUNCOES[tk.v]) throw new Error(`Função desconhecida: ${tk.v}`);
        i++;
        const args: No[] = [];
        if (!op(')')) { args.push(expr()); while (op(',')) { i++; args.push(expr()); } }
        if (!op(')')) throw new Error('Falta fechar parênteses');
        i++;
        return { k: 'fn', nome: tk.v, args };
      }
      return { k: 'var', id: tk.v };
    }
    if (tk.v === '(') {
      const e = expr();
      if (!op(')')) throw new Error('Falta fechar parênteses');
      i++;
      return { k: 'par', a: e };
    }
    throw new Error(`Símbolo inesperado: ${tk.v}`);
  };

  const raiz = expr();
  if (i < toks.length) throw new Error('Sobrou texto no fim da fórmula');
  return raiz;
}

const cache = new Map<string, No | Error>();
export function arvore(src: string): No {
  let r = cache.get(src);
  if (!r) {
    try { r = analisar(src); } catch (e) { r = e as Error; }
    cache.set(src, r);
  }
  if (r instanceof Error) throw r;
  return r;
}

function percorrer(n: No, f: (n: No) => void) {
  f(n);
  if (n.k === 'neg' || n.k === 'par') percorrer(n.a, f);
  else if (n.k === 'bin') { percorrer(n.a, f); percorrer(n.b, f); }
  else if (n.k === 'fn') n.args.forEach((a) => percorrer(a, f));
}

/** Ids de campos citados na fórmula (sem funções). */
export function variaveis(formula: string): string[] {
  const ids = new Set<string>();
  percorrer(arvore(formula), (n) => {
    if (n.k === 'var') ids.add(n.id);
    if (n.k === 'dado') for (const q of [n.n, n.m]) if (typeof q !== 'number') ids.add(q.ref);
  });
  return [...ids];
}

/** A fórmula sorteia algum dado? */
export function temDados(formula: string): boolean {
  let achou = false;
  try { percorrer(arvore(formula), (n) => { if (n.k === 'dado') achou = true; }); } catch { return false; }
  return achou;
}

/** Erro de sintaxe da fórmula, ou null se estiver correta. */
export function erroDaFormula(formula: string): string | null {
  try { arvore(formula); return null; } catch (e) { return (e as Error).message; }
}

interface Ctx {
  valor: (id: string) => number | null;
  dado: (n: NoDado) => number | null;
}

function calcNo(n: No, c: Ctx): number | null {
  switch (n.k) {
    case 'num': return n.v;
    case 'var': return c.valor(n.id);
    case 'neg': { const a = calcNo(n.a, c); return a === null ? null : -a; }
    case 'par': return calcNo(n.a, c);
    case 'dado': return c.dado(n);
    case 'fn': {
      const args = n.args.map((a) => calcNo(a, c));
      return args.some((a) => a === null) ? null : FUNCOES[n.nome](...(args as number[]));
    }
    case 'bin': {
      const a = calcNo(n.a, c), b = calcNo(n.b, c);
      if (a === null || b === null) return null;
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '%': return a % b;
        default: return a ** b;
      }
    }
  }
}

/**
 * Calcula uma fórmula determinística. `valor` devolve o número de cada campo citado (ou null se indisponível).
 * Fórmula com dados, erro ou resultado não finito vira null.
 */
export function avaliar(formula: string, valor: (id: string) => number | null): number | null {
  let r: No;
  try { r = arvore(formula); } catch { return null; }
  const v = calcNo(r, { valor, dado: () => null });
  return v !== null && Number.isFinite(v) ? v : null;
}

/* ---------- rolagem ---------- */

export interface Face { v: number; mantido: boolean }
export interface ParteRolagem { expr: string; faces: Face[]; soma: number }
export interface ResultadoRolagem {
  total: number;
  /** Conta passo a passo, ex.: `2d6 [3, 5] + Força 4 = 12`. */
  texto: string;
  partes: ParteRolagem[];
}

/** Sorteia de 1 a `faces` sem viés (amostragem com rejeição sobre `crypto`). */
export function sortear(faces: number): number {
  const limite = Math.floor(0x100000000 / faces) * faces;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limite);
  return (buf[0] % faces) + 1;
}

export const formatarNumero = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100));

/**
 * Rola uma fórmula. `valor` e `nome` resolvem as referências; `sorteio` existe para os testes.
 * Devolve null se a fórmula for inválida ou depender de algo indisponível.
 */
export function rolar(
  formula: string,
  valor: (id: string) => number | null,
  nome: (id: string) => string = (id) => id,
  sorteio: (faces: number) => number = sortear,
): ResultadoRolagem | null {
  let raiz: No;
  try { raiz = arvore(formula); } catch { return null; }

  const partes = new Map<NoDado, ParteRolagem>();
  const resolver = (q: Quant) => (typeof q === 'number' ? q : valor(q.ref));
  const dado = (n: NoDado): number | null => {
    const feita = partes.get(n);
    if (feita) return feita.soma;
    const qtd = resolver(n.n), faces = resolver(n.m);
    // quantidade e faces vindas de um campo precisam ser inteiros dentro dos limites
    if (qtd === null || faces === null || !Number.isInteger(qtd) || !Number.isInteger(faces)) return null;
    if (qtd < 1 || qtd > MAX_DADOS || faces < 2 || faces > MAX_FACES || (n.keep && n.keep.q > qtd)) return null;
    const lados: Face[] = Array.from({ length: qtd }, () => ({ v: sorteio(faces), mantido: true }));
    if (n.keep) {
      const ordem = lados.map((_, i) => i).sort((x, y) => (n.keep!.modo === 'h' ? lados[y].v - lados[x].v : lados[x].v - lados[y].v));
      ordem.slice(n.keep.q).forEach((i) => { lados[i].mantido = false; });
    }
    const expr = `${qtd === 1 ? '' : qtd}d${faces}${n.keep ? `k${n.keep.modo}${n.keep.q}` : ''}`;
    const parte = { expr, faces: lados, soma: lados.reduce((acc, f) => acc + (f.mantido ? f.v : 0), 0) };
    partes.set(n, parte);
    return parte.soma;
  };

  const total = calcNo(raiz, { valor, dado });
  if (total === null || !Number.isFinite(total)) return null;

  const mostrar = (n: No): string => {
    switch (n.k) {
      case 'num': return formatarNumero(n.v);
      case 'var': { const v = valor(n.id); return `${nome(n.id)} ${v === null ? '—' : formatarNumero(v)}`; }
      case 'neg': return `-${mostrar(n.a)}`;
      case 'par': return `(${mostrar(n.a)})`;
      case 'bin': return `${mostrar(n.a)} ${n.op} ${mostrar(n.b)}`;
      case 'fn': return `${n.nome}(${n.args.map(mostrar).join(', ')})`;
      case 'dado': { const p = partes.get(n)!; return `${p.expr} [${p.faces.map((f) => (f.mantido ? f.v : `(${f.v})`)).join(', ')}]`; }
    }
  };
  return { total, texto: `${mostrar(raiz)} = ${formatarNumero(total)}`, partes: [...partes.values()] };
}
