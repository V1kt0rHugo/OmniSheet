import { reduceMotion, rnd } from './util';
import { sfx } from './sfx';

const SVGNS = 'http://www.w3.org/2000/svg';
const mk = (tag: string, attrs: Record<string, string> = {}) => {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
};

type P = [number, number];

/**
 * Quebra a tela do Hall em cacos a partir do ponto (x, y). `after` troca a tela logo depois
 * de o Hall ser clonado em pedaços, então o usuário vê a nova tela por trás do vidro caindo.
 */
export async function shatter(x: number, y: number, stars: HTMLCanvasElement | null, after: () => void) {
  sfx('glass');
  if (reduceMotion) { after(); return; }
  const app = document.getElementById('app')!, R = app.getBoundingClientRect();
  const hall = document.getElementById('scr-hall')!, fx = document.getElementById('fx')!;
  x -= R.left; y -= R.top;
  const W = R.width, Ht = R.height;
  const n = 11, base = rnd(0, Math.PI * 2);
  const angs = Array.from({ length: n }, (_, k) => base + (k + rnd(-.3, .3)) * (Math.PI * 2 / n));
  const rings = [0, rnd(70, 110), rnd(230, 300), Math.hypot(W, Ht) * 1.2];
  const V: P[][] = angs.map((a) => rings.map((r, k): P => {
    if (k === 0) return [x, y];
    const aa = a + (k < 3 ? rnd(-.08, .08) : 0), rr = r * (k < 3 ? rnd(.82, 1.18) : 1);
    return [x + Math.cos(aa) * rr, y + Math.sin(aa) * rr];
  }));

  const ck = mk('svg');
  ck.setAttribute('class', 'cracks');
  let d = '';
  for (let j = 0; j < n; j++) {
    d += `M${V[j][0][0]} ${V[j][0][1]} L${V[j][1][0]} ${V[j][1][1]} L${V[j][2][0]} ${V[j][2][1]} L${V[j][3][0]} ${V[j][3][1]} `;
    const q = (j + 1) % n;
    d += `M${V[j][1][0]} ${V[j][1][1]} L${V[q][1][0]} ${V[q][1][1]} M${V[j][2][0]} ${V[j][2][1]} L${V[q][2][0]} ${V[q][2][1]} `;
  }
  ck.appendChild(mk('path', { d }));

  const pieces: { wrap: HTMLDivElement; k: number; cx: number; cy: number }[] = [];
  const src = hall.cloneNode(true) as HTMLElement;
  for (let j = 0; j < n; j++) {
    const q = (j + 1) % n;
    for (let k = 0; k < 3; k++) {
      const poly = k === 0 ? [V[j][0], V[j][1], V[q][1]] : [V[j][k], V[q][k], V[q][k + 1], V[j][k + 1]];
      const wrap = document.createElement('div');
      wrap.className = 'piece';
      wrap.style.clipPath = `polygon(${poly.map((p) => `${p[0]}px ${p[1]}px`).join(',')})`;
      const c = src.cloneNode(true) as HTMLElement;
      const oc = c.querySelector('canvas');
      if (oc && stars) { oc.width = stars.width; oc.height = stars.height; oc.getContext('2d')!.drawImage(stars, 0, 0); }
      wrap.appendChild(c);
      fx.appendChild(wrap);
      pieces.push({ wrap, k, cx: poly.reduce((s, p) => s + p[0], 0) / poly.length, cy: poly.reduce((s, p) => s + p[1], 0) / poly.length });
    }
  }
  fx.appendChild(ck);
  after();

  document.getElementById('flash')!.animate([{ opacity: .85 }, { opacity: 0 }], { duration: 380, easing: 'ease-out' });
  ck.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: 900, fill: 'forwards' });
  const anims = pieces.map((pc) => {
    const dx = pc.cx - x, dy = pc.cy - y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
    const push = pc.k === 0 ? 4 : pc.k === 1 ? 3 : 2, fly = rnd(120, 420) * (pc.k === 2 ? .6 : 1);
    const rx = rnd(-60, 60), ry = rnd(-60, 60), rz = rnd(-35, 35);
    const delay = 260 + pc.k * rnd(70, 130) + rnd(0, 90), dur = rnd(1000, 1500);
    return pc.wrap.animate([
      { transform: 'translate3d(0,0,0)', opacity: 1, offset: 0 },
      { transform: `translate3d(${ux * push}px,${uy * push}px,0) rotate(${rnd(-.6, .6)}deg)`, opacity: 1, offset: .16 },
      { transform: `translate3d(${ux * fly * .4}px,${uy * fly * .4 + 60}px,${rnd(40, 160)}px) rotateX(${rx * .4}deg) rotateY(${ry * .4}deg) rotate(${rz * .4}deg)`, opacity: 1, offset: .45 },
      { transform: `translate3d(${ux * fly}px,${uy * fly + Ht * .9}px,${rnd(80, 260)}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rz}deg)`, opacity: 0, offset: 1 },
    ], { duration: dur + delay, easing: 'cubic-bezier(.55,0,.85,.55)', fill: 'forwards' }).finished;
  });
  await Promise.all(anims);
  fx.innerHTML = '';
}
