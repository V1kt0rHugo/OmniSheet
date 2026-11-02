export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const norm = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isUuid = (s: unknown) =>
  typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
