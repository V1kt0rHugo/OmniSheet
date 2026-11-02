import type { Ficha, FichaDraft, Sistema } from '../types';
import { camposDe, dadosCompletos } from './sistema';
import { clamp } from './util';

export function newDraft(sistema: Sistema): FichaDraft {
  return {
    id: crypto.randomUUID(),
    sistemaId: sistema.id,
    nome: '', epiteto: '', campanha: '', status: 'Ativo', resumo: '',
    dados: dadosCompletos(sistema),
    item: { nome: '', descricao: '', imagem: null }, imagem: null, foco: 25,
    cor: Math.floor(Math.random() * 360), demo: false,
  };
}

/* ---------- fichas de exemplo ---------- */
const DEMO_NOMES = ['Seraphine Valcourt', 'Tobias Grael', 'Mirela Sombraviva', 'Kaz Orrin', 'Ysolde Marrek', 'Brann Tolhurst', 'Ilya Venn', 'Corvo Ashdane', 'Nerys Quill', 'Dorian Wick', 'Halcyon Roe', 'Maeve Thornfield', 'Osric Vael', 'Lunara Pike', 'Fenwick Dray', 'Isolde Karn', 'Garrick Moss', 'Thessaly Bright', 'Ulric Noon', 'Petra Halloway', 'Zephyr Lund', 'Cassian Orme', 'Odalys Crane', 'Wren Marlowe', 'Rurik Stone', 'Sable Fenn', 'Anselm Gray', 'Vesper Hale', 'Tamsin Ridge', 'Hollis Venmar', 'Elowen Drake', 'Magnus Pell', 'Orla Whitlock', 'Jorun Vex', 'Calla Mourne', 'Peregrine Oak', 'Syrah Lowe', 'Dunstan Rook', 'Ivo Marsh', 'Linnea Ashgrove'];
const DEMO_EPI = ['A lâmina que não se ajoelha', 'O juramento que sobreviveu às cinzas', 'Quem caminha entre velas', 'O sorriso de porcelana', 'A voz que o mar devolveu', 'Herdeiro de uma coroa quebrada', 'Sombra de três cidades', 'O último guarda do farol'];
const DEMO_CAMP = ["Crônicas de Vel'Ardan", 'A Queda de Morrowgate', 'Noites de Halvren', 'Mascarada de Sel'];
const DEMO_ITEM: [string, string][] = [['Espada partida', 'espada'], ['Anel do juramento', 'anel'], ['Lanterna de ossos', 'lanterna'], ['Máscara rachada', 'mascara']];

const DEMO_POOL: Record<string, string[]> = {
  classe: ['Guerreira', 'Ladino', 'Mago', 'Clérigo'],
  ancestralidade: ['Humano', 'Elfo', 'Anão', 'Meio-orc'],
  raca: ['Humano', 'Elfo', 'Anão', 'Meio-orc'],
};

/** Ficha de exemplo preenchida com valores plausíveis para qualquer sistema. */
export function demoDraft(i: number, sistema: Sistema): FichaDraft {
  const f = newDraft(sistema);
  f.demo = true;
  f.nome = DEMO_NOMES[i % DEMO_NOMES.length] + (i >= DEMO_NOMES.length ? ' ' + (Math.floor(i / DEMO_NOMES.length) + 1) : '');
  f.epiteto = DEMO_EPI[i % DEMO_EPI.length];
  f.campanha = DEMO_CAMP[i % DEMO_CAMP.length];
  f.resumo = 'Ficha de exemplo. Aqui entra um resumo curto do personagem e do que levou essa identidade ao Hall.';
  for (const c of camposDe(sistema)) {
    if (c.tipo === 'texto') f.dados[c.id] = DEMO_POOL[c.id]?.[(i * (c.id === 'classe' ? 1 : 3)) % 4] ?? `${c.label} ${i + 1}`;
    else if (c.tipo === 'numero') f.dados[c.id] = String(c.id === 'nivel' ? 1 + (i * 2) % 12 : 8 + (i * 5) % 11);
    else if (c.tipo === 'selecao') f.dados[c.id] = c.opcoes?.[i % (c.opcoes.length || 1)] ?? '';
    else if (c.tipo === 'booleano') f.dados[c.id] = i % 3 === 0 ? 'true' : 'false';
    else if (c.tipo === 'habilidades' && c.habilidades) {
      const m = c.habilidades;
      f.dados[c.id] = {
        cartas: [{
          id: crypto.randomUUID(),
          valores: Object.fromEntries(m.campos.map((cm) => [cm.id, cm.tipo === 'texto' ? `${m.nome} de exemplo` : cm.tipo === 'textarea' ? 'Descrição de exemplo.' : cm.tipo === 'selecao' ? (cm.opcoes?.[0] ?? '') : (cm.padrao ?? '1')])),
        }],
      };
    }
    else if (c.tipo === 'textarea') f.dados[c.id] = `${c.label}: texto de exemplo.`;
    else if (c.tipo === 'atributos') {
      const base = c.modelo?.length ? c.modelo : ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map((n) => ({ n, v: '10' }));
      f.dados[c.id] = base.map((a, k) => ({ n: a.n, v: String(8 + (i * 5 + k * 3) % 11) }));
    }
  }
  f.item = { nome: DEMO_ITEM[i % 4][0], descricao: 'Item de exemplo vinculado a esta ficha.', imagem: null, tipo: DEMO_ITEM[i % 4][1] };
  f.cor = (i * 47 + 205) % 360;
  return f;
}

/* ---------- arte provisória ---------- */
const svgURI = (s: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);

type Visual = Pick<Ficha, 'id' | 'imagem' | 'cor'>;

const phCache = new Map<string, string>();
function placeholderPortrait(f: Visual) {
  const key = f.id + '|' + f.cor;
  const hit = phCache.get(key);
  if (hit) return hit;
  const hue = f.cor ?? 210;
  let h = 0;
  for (const c of f.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const heads = [
    '<path d="M190 330 C190 190 410 190 410 330 L430 420 L170 420 Z" fill="#0a0a10"/>',
    '<path d="M205 250 L300 150 L395 250 Z" fill="#0a0a10"/><circle cx="300" cy="300" r="92" fill="#0a0a10"/>',
    '<circle cx="300" cy="300" r="95" fill="#0a0a10"/><path d="M205 290 C200 200 400 190 398 300 C420 360 410 440 380 470 L220 470 C190 430 185 360 205 290Z" fill="#0a0a10"/>',
    '<rect x="215" y="215" width="170" height="190" rx="70" fill="#0a0a10"/><path d="M240 300 h120" stroke="hsl(' + hue + ',90%,70%)" stroke-width="6"/>',
  ];
  const uri = svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <defs><radialGradient id="b" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="hsl(${hue},55%,52%)"/><stop offset=".55" stop-color="hsl(${hue},45%,22%)"/><stop offset="1" stop-color="hsl(${hue},40%,7%)"/></radialGradient>
  <linearGradient id="r" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect width="600" height="800" fill="url(#b)"/>
  <path d="M80 0 L200 0 L420 800 L300 800Z" fill="url(#r)"/><path d="M380 0 L430 0 L560 800 L510 800Z" fill="url(#r)"/>
  <path d="M110 800 C130 560 215 470 300 470 C385 470 470 560 490 800Z" fill="#0a0a10" stroke="hsl(${hue},90%,72%)" stroke-opacity=".5" stroke-width="3"/>
  <rect x="268" y="380" width="64" height="110" fill="#0a0a10"/>
  ${heads[h % 4]}
  <circle cx="300" cy="300" r="96" fill="none" stroke="hsl(${hue},90%,75%)" stroke-opacity=".35" stroke-width="3"/>
  </svg>`);
  phCache.set(key, uri);
  return uri;
}

function placeholderItem(tipo?: string) {
  const g = '#e8c97e';
  const arts: Record<string, string> = {
    espada: `<path d="M100 20 L112 120 L100 135 L88 120 Z" fill="none" stroke="${g}" stroke-width="5"/><path d="M62 132 H138" stroke="${g}" stroke-width="7" stroke-linecap="round"/><path d="M100 136 V172" stroke="${g}" stroke-width="9" stroke-linecap="round"/><circle cx="100" cy="182" r="7" fill="${g}"/>`,
    anel: `<circle cx="100" cy="115" r="52" fill="none" stroke="${g}" stroke-width="10"/><path d="M78 68 L100 32 L122 68 Z" fill="none" stroke="${g}" stroke-width="5"/>`,
    lanterna: `<path d="M100 18 a14 14 0 0 1 0 28" fill="none" stroke="${g}" stroke-width="5"/><rect x="64" y="50" width="72" height="16" rx="3" fill="${g}"/><path d="M70 66 L62 150 H138 L130 66" fill="none" stroke="${g}" stroke-width="5"/><path d="M100 85 c-14 18 -14 34 0 44 c14 -10 14 -26 0 -44z" fill="${g}"/><rect x="58" y="150" width="84" height="16" rx="3" fill="${g}"/>`,
    mascara: `<path d="M48 70 C48 40 152 40 152 70 C152 130 125 170 100 170 C75 170 48 130 48 70Z" fill="none" stroke="${g}" stroke-width="6"/><path d="M68 92 q14 -12 28 0 M104 92 q14 -12 28 0" fill="none" stroke="${g}" stroke-width="5"/><path d="M80 132 q20 14 40 0" fill="none" stroke="${g}" stroke-width="5"/>`,
  };
  const art = (tipo && arts[tipo]) ||
    `<path d="M100 30 L160 100 L100 170 L40 100 Z" fill="none" stroke="${g}" stroke-width="6"/><path d="M40 100 H160 M100 30 L72 100 L100 170 L128 100 Z" fill="none" stroke="${g}" stroke-width="3"/>`;
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${art}</svg>`);
}

type WithItem = Pick<Ficha, 'item'>;
export const portraitSrc = (f: Visual) => f.imagem || placeholderPortrait(f);
export const hasItem = (f: WithItem) => !!(f.item && (f.item.imagem || (f.item.nome || '').trim()));
export const itemSrc = (f: WithItem) => f.item?.imagem || placeholderItem(f.item?.tipo);

/* ---------- forma única de cada fragmento (sempre a mesma para o mesmo id) ---------- */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Menor distância (em unidades de 0 a 100) do centro até a borda: o ícone "+" e o número cabem com folga. */
const MIN_INRADIUS = 17;

export interface Shape { svg: string; clip: string }
const shapeCache = new Map<string, Shape>();
/** Move o centro de massa do polígono para a origem. */
function center(pts: [number, number][]): [number, number][] {
  let area = 0, gx = 0, gy = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], c = x1 * y2 - x2 * y1;
    area += c; gx += (x1 + x2) * c; gy += (y1 + y2) * c;
  }
  if (area) { gx /= 3 * area; gy /= 3 * area; }
  return pts.map(([x, y]) => [x - gx, y - gy]);
}

export function shapeFor(id: string): Shape {
  const hit = shapeCache.get(id);
  if (hit) return hit;
  const r = rng(id), off = r() * Math.PI * 2, rot = r() * Math.PI;
  const ghost = id === 'ghost'; // o fragmento "+" tem sempre um formato cheio e regular
  const kind = ghost ? .6 : r(), size = ghost ? 1 : .68 + r() * .32;
  // cada tipo muda a contagem de pontas, a variação do raio e o quanto o caco é achatado
  let n: number, jitter: number, sx: number, radius: (k: number) => number;
  if (kind < .22) {            // triângulo
    n = 3; jitter = .5; sx = .9 + r() * .2; radius = () => 38 + r() * 8;
  } else if (kind < .45) {     // lasca comprida
    n = 4 + Math.floor(r() * 2); jitter = .35; sx = .5 + r() * .2; radius = () => 40 + r() * 9;
  } else if (kind < .75) {     // caco pontudo
    n = 5 + Math.floor(r() * 3); jitter = ghost ? .2 : .55; sx = ghost ? 1 : .86 + r() * .26; radius = (k) => (k % 2 ? 34 : 44) + r() * 7;
  } else {                     // pedaço irregular
    n = 5 + Math.floor(r() * 4); jitter = .7; sx = .75 + r() * .4; radius = () => 24 + r() * 24;
  }
  let pts: [number, number][] = [];
  for (let k = 0; k < n; k++) {
    const a = off + (k + (r() - .5) * jitter) * 2 * Math.PI / n;
    const rad = radius(k) * size;
    const x = Math.cos(a) * rad * sx, y = Math.sin(a) * rad;
    pts.push([x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
  }

  // O rótulo (número, nome ou "+") fica no centro da caixa. Para ele ficar centrado de verdade,
  // o centro de massa do caco vai para (50,50); e o caco cresce até caber o rótulo com folga.
  // Se mesmo no limite da caixa ele ficar fino demais, arredonda um pouco a forma e tenta de novo.
  for (let pass = 0; pass < 10; pass++) {
    pts = center(pts);
    const inradius = Math.min(...pts.map(([x1, y1], i) => {
      const [x2, y2] = pts[(i + 1) % pts.length], len = Math.hypot(x2 - x1, y2 - y1) || 1;
      return Math.abs(x1 * y2 - x2 * y1) / len;
    }));
    const extent = Math.max(...pts.flat().map(Math.abs));
    const grow = Math.min(Math.max(1, MIN_INRADIUS / (inradius || 1)), 48 / extent);
    if (inradius * grow >= MIN_INRADIUS - .01 || pass === 9) { pts = pts.map(([x, y]) => [x * grow, y * grow]); break; }
    const mean = pts.reduce((m, [x, y]) => m + Math.hypot(x, y), 0) / pts.length;
    pts = pts.map(([x, y]) => { const d = Math.hypot(x, y) || 1; return [x * .8 + (x / d) * mean * .2, y * .8 + (y / d) * mean * .2]; });
  }

  const str = pts.map(([x, y]) => [clamp(50 + x, 2, 98).toFixed(1), clamp(50 + y, 2, 98).toFixed(1)]);
  const o = {
    svg: str.map((p) => p.join(',')).join(' '),
    clip: 'polygon(' + str.map((p) => p[0] + '% ' + p[1] + '%').join(',') + ')',
  };
  shapeCache.set(id, o);
  return o;
}
