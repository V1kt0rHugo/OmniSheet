import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { screenCls, useApp } from '../app/AppContext';
import { HallPanel } from '../components/HallPanel';
import { HallSearch } from '../components/HallSearch';
import { hasItem, itemSrc, portraitSrc, shapeFor } from '../lib/ficha';
import { shatter } from '../lib/shatter';
import { sfx } from '../lib/sfx';
import { clamp, pad2, reduceMotion } from '../lib/util';
import { H } from './hallState';

const DELTA = 52;
type Win = [number, number];

export function HallScreen() {
  const { fichas, screen, instant, assembleToken, show, openSystemPicker, openSheet, isModalOpen, setMenuPhase } = useApp();
  const active = screen === 'hall';
  const N = fichas.length;

  const fichasRef = useRef(fichas);
  fichasRef.current = fichas;
  const activeRef = useRef(active);
  activeRef.current = active;

  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const nodes = useRef(new Map<number, HTMLDivElement>());
  const itemLayers = useRef<(HTMLDivElement | null)[]>([null, null]);
  const itemFlip = useRef(0);
  const stars = useRef<{ x: number; y: number; r: number; t: number; s: number }[]>([]);

  const [win, setWin] = useState<Win>([0, 0]);
  const lastWin = useRef<Win | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  const [bar, setBar] = useState({ idx: 0, prev: false, next: false });
  const lastStep = useRef(0);
  const snapT = useRef<number>();
  const busy = useRef(false);
  const lastPointer = useRef('mouse');
  const lastAssemble = useRef(assembleToken);

  /* ---------- geometria ---------- */
  const metrics = useCallback(() => {
    const st = stageRef.current;
    if (!st) return;
    const w = st.clientWidth, h = st.clientHeight;
    if (!w || !h) return;
    H.w = w; H.h = h; H.cx = w / 2; H.cy = h / 2;
    H.asp = clamp((w / h) * .88, .9, 1.6);
    H.R0 = Math.min(h * .26, w * .28 / H.asp);
    H.S = Math.min(h * .31, w * .23);
    H.a = H.R0 * .17;
    layerRef.current?.style.setProperty('--S', H.S + 'px');
    itemRef.current?.style.setProperty('--IS', Math.round(H.R0 * .95) + 'px');
    H.dirty = true;
  }, []);

  const place = (n: HTMLElement, s: number) => {
    let r: number, k: number, op: number;
    if (s >= 0) { r = H.R0 + H.a * s; k = Math.max(.5, 1 - .04 * s); op = s < 7 ? 1 : Math.max(0, 1 - (s - 7) / 3); }
    else { const q = -s; r = H.R0 + H.a * q * 4; k = 1 + q * .4; op = Math.max(0, 1 - q / 1.1); }
    const th = (-90 + s * DELTA) * Math.PI / 180;
    const x = H.cx + Math.cos(th) * r * H.asp, y = H.cy + Math.sin(th) * r;
    n.style.transform = `translate(${(x - H.S / 2).toFixed(1)}px,${(y - H.S / 2).toFixed(1)}px) scale(${k.toFixed(3)})`;
    n.style.opacity = op.toFixed(3);
    n.style.zIndex = String(s >= 0 ? Math.round(500 - s * 10) : Math.round(100 + s * 10));
    if (op < .3) n.dataset.dim = '1'; else delete n.dataset.dim;
    n.tabIndex = op < .3 ? -1 : 0;
  };
  const placeAll = () => { for (const [i, n] of nodes.current) place(n, i - H.t); };

  const syncWin = () => {
    const total = fichasRef.current.length;
    const next: Win = [Math.max(0, Math.floor(H.t) - 2), Math.min(total, Math.ceil(H.t) + 11)];
    const prev = lastWin.current;
    if (prev && prev[0] === next[0] && prev[1] === next[1]) return;
    lastWin.current = next;
    setWin(next);
    if (hoverRef.current !== null && (hoverRef.current < next[0] || hoverRef.current > next[1])) clearHover();
  };

  useLayoutEffect(() => { placeAll(); }, [win, fichas, active]);

  /* ---------- navegação ---------- */
  const setTarget = (v: number) => { H.target = clamp(v, 0, fichasRef.current.length); H.dirty = true; };
  const goTo = (i: number) => { setTarget(i); clearTimeout(snapT.current); };
  const snapSoon = () => {
    clearTimeout(snapT.current);
    snapT.current = window.setTimeout(() => { H.target = Math.round(H.target); H.dirty = true; }, 150);
  };

  /* ---------- foco / painel / item central ---------- */
  const showItem = (src: string | null) => {
    const ls = itemLayers.current;
    ls.forEach((l) => l?.classList.remove('show'));
    if (!src) return;
    const L = ls[itemFlip.current];
    itemFlip.current ^= 1;
    if (!L) return;
    L.querySelector('img')!.src = src;
    void L.offsetWidth;
    L.classList.add('show');
  };
  function clearHover() { hoverRef.current = null; setHover(null); }
  const focusShard = (i: number) => {
    if (hoverRef.current !== i) sfx('shardHover');
    hoverRef.current = i;
    setHover(i);
  };
  const blurShard = (i: number) => { if (hoverRef.current === i) clearHover(); };

  useEffect(() => {
    const f = hover !== null ? fichas[hover] : undefined;
    showItem(f && hasItem(f) ? itemSrc(f) : null);
  }, [hover, fichas]);

  /* ---------- estrelas ---------- */
  const sizeStars = useCallback(() => {
    const c = starsRef.current;
    if (!c) return;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    c.width = w * d; c.height = h * d;
    c.getContext('2d')!.setTransform(d, 0, 0, d, 0, 0);
    stars.current = Array.from({ length: Math.round(w * h / 5200) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .2, t: Math.random() * 6.28, s: .4 + Math.random() * 1.6 }));
  }, []);

  useEffect(() => {
    if (!active) return;
    let on = true, raf = 0;
    sizeStars();
    const draw = (ts: number) => {
      const c = starsRef.current;
      if (!on || !c) return;
      const cx = c.getContext('2d')!;
      cx.clearRect(0, 0, c.clientWidth, c.clientHeight);
      for (const s of stars.current) {
        cx.globalAlpha = .35 + .65 * Math.abs(Math.sin(s.t + ts / 1000 * s.s * .6));
        cx.fillStyle = '#dfe6ff';
        cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill();
      }
      cx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    // mantém desenhando durante a transição de saída, para o vidro quebrado copiar estrelas
    return () => { setTimeout(() => { on = false; cancelAnimationFrame(raf); }, 900); };
  }, [active, sizeStars]);

  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    const ro = new ResizeObserver(() => { metrics(); sizeStars(); });
    ro.observe(st);
    return () => ro.disconnect();
  }, [metrics, sizeStars]);

  /* ---------- laço de animação ---------- */
  useEffect(() => {
    if (!active) return;
    metrics();
    lastWin.current = null;
    clearHover();
    H.dirty = true;
    let raf = 0;
    const loop = () => {
      const d = H.target - H.t;
      if (Math.abs(d) > .0008) {
        H.t += d * .14;
        if (Math.abs(H.target - H.t) < .0008) H.t = H.target;
        H.dirty = true;
      }
      if (H.dirty) {
        H.dirty = false;
        syncWin();
        placeAll();
        const total = fichasRef.current.length;
        const idx = clamp(Math.round(H.t), 0, total);
        if (idx !== lastStep.current) { lastStep.current = idx; if (Math.abs(d) > .02) sfx('hover'); }
        const r = rangeRef.current;
        if (r && document.activeElement !== r) r.value = String(H.t);
        const prev = H.target > 0, next = H.target < total;
        setBar((b) => (b.idx === idx && b.prev === prev && b.next === next ? b : { idx, prev, next }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // a lista mudou (criar, apagar, importar): reposiciona dentro dos limites novos
  useEffect(() => {
    H.target = clamp(H.target, 0, N);
    H.t = clamp(H.t, 0, N);
    H.dirty = true;
    clearHover();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fichas]);

  /* ---------- fragmentos chegando ---------- */
  useEffect(() => {
    if (!active || assembleToken === lastAssemble.current) return;
    lastAssemble.current = assembleToken;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => {
      [...nodes.current.entries()].forEach(([i, g], k) => {
        if (reduceMotion) return;
        const s = i - H.t, a = (-90 + s * DELTA) * Math.PI / 180;
        g.animate([{ translate: `${Math.cos(a) * 300}px ${Math.sin(a) * 240}px`, rotate: `${(k % 2 ? 1 : -1) * (18 + k * 4)}deg`, scale: .7, opacity: 0 }],
          { duration: 1050, delay: 120 + k * 80, easing: 'cubic-bezier(.16,.84,.3,1)', fill: 'backwards' });
      });
      document.getElementById('flash')?.animate([{ opacity: 0 }, { opacity: .35, offset: .15 }, { opacity: 0 }], { duration: 900, delay: 80 });
    }); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [active, assembleToken]);

  /* ---------- entradas: roda, arrasto, teclas, barra ---------- */
  useEffect(() => {
    const st = stageRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      setTarget(H.target + dy * (e.deltaMode === 1 ? 33 : 1) * .009);
      snapSoon();
    };
    let drag: { x: number; y: number; t: number; moved: boolean } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, t: H.target, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; st.classList.add('drag'); }
      if (drag.moved) { const d = Math.abs(dy) >= Math.abs(dx) ? dy : dx; setTarget(drag.t - d / 95); }
    };
    const onUp = () => {
      if (!drag) return;
      if (drag.moved) { H.justDragged = true; setTimeout(() => { H.justDragged = false; }, 80); snapSoon(); }
      st.classList.remove('drag');
      drag = null;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!activeRef.current || isModalOpen()) return;
      if ((e.target as Element).matches?.('input,textarea,select')) return;
      const k = e.key, cur = Math.round(H.target);
      if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); goTo(cur + 1); }
      else if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1); }
      else if (k === 'PageDown') { e.preventDefault(); goTo(cur + 5); }
      else if (k === 'PageUp') { e.preventDefault(); goTo(cur - 5); }
      else if (k === 'Home') { e.preventDefault(); goTo(0); }
      else if (k === 'End') { e.preventDefault(); goTo(fichasRef.current.length); }
    };
    const rg = rangeRef.current!;
    const onRangeInput = () => setTarget(parseFloat(rg.value));
    const onRangeChange = () => { H.target = Math.round(H.target); H.dirty = true; };

    st.addEventListener('wheel', onWheel, { passive: false });
    st.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('keydown', onKey);
    rg.addEventListener('input', onRangeInput);
    rg.addEventListener('change', onRangeChange);
    return () => {
      st.removeEventListener('wheel', onWheel);
      st.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('keydown', onKey);
      rg.removeEventListener('input', onRangeInput);
      rg.removeEventListener('change', onRangeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- abrir fragmento ---------- */
  const openShard = (i: number, ev: { clientX: number; clientY: number }) => {
    if (busy.current || H.justDragged) return;
    const f = fichasRef.current[i];
    if (lastPointer.current === 'touch' && hoverRef.current !== i) { focusShard(i); return; }
    busy.current = true;
    shatter(ev.clientX, ev.clientY, starsRef.current, () => {
      if (f) openSheet(f.id, { instant: true });
      else openSystemPicker({ from: 'hall', instant: true });
    }).finally(() => { busy.current = false; });
  };

  const indices: number[] = [];
  for (let i = win[0]; i <= win[1]; i++) indices.push(i);
  const countTxt = N === 1 ? '1 ficha' : `${N} fichas`;

  return (
    <section id="scr-hall" className={screenCls(active, instant)} aria-label="Hall das identidades">
      <canvas id="stars" ref={starsRef} />
      <div className="h-top">
        <div className="badge" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 L14.5 9 L22 9.5 L16 14 L18 21.5 L12 17 L6 21.5 L8 14 L2 9.5 L9.5 9 Z" /></svg>
        </div>
        <div><p className="k">Hall da Fama</p><p className="v">{countTxt}</p></div>
      </div>

      <HallSearch fichas={fichas} onPick={(i) => { goTo(i); sfx('confirm'); }} />

      <div className="h-tools">
        <button className="btn primary" onClick={() => { sfx('confirm'); openSystemPicker({ from: 'hall' }); }}>Nova ficha</button>
        <button className="icon-btn" aria-label="Voltar ao menu" onClick={() => { sfx('cancel'); setMenuPhase('risen'); show('menu'); }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7 L4 11 L9 15" /><path d="M4 11 H15 a5 5 0 0 1 0 10 H11" /></svg>
        </button>
      </div>

      <div className="h-wrap">
        <div className={'h-stage' + (hover !== null ? ' focus' : '')} ref={stageRef}>
          <div className="h-layer" ref={layerRef} role="list">
            {indices.map((i) => {
              const f = fichas[i];
              const sh = shapeFor(f ? f.id : 'ghost');
              const cls = 'sh' + (f ? '' : ' ghost') + (hover === i ? ' on' : '') + (f && H.born === f.id ? ' born' : '');
              return (
                <div key={f ? f.id : 'ghost'} className={cls} data-i={i} tabIndex={0} role="listitem"
                  aria-label={f ? `${i + 1}. ${f.nome}` : 'Criar nova ficha'}
                  style={{ '--hue': f ? (f.cor ?? 210) : 210 } as CSSProperties}
                  ref={(el) => { if (el) nodes.current.set(i, el); else nodes.current.delete(i); }}
                  onFocus={() => { focusShard(i); if (Math.abs(H.target - i) > .5) { H.target = i; H.dirty = true; } }}
                  onBlur={() => blurShard(i)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      const r = ev.currentTarget.getBoundingClientRect();
                      openShard(i, { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
                    }
                  }}>
                  <svg className="g" viewBox="0 0 100 100"><polygon points={sh.svg} /></svg>
                  <div className="img" style={f ? { clipPath: sh.clip, backgroundImage: `url("${portraitSrc(f)}")`, backgroundPosition: `50% ${f.foco ?? 25}%` } : { clipPath: sh.clip }} />
                  <svg className="e" viewBox="0 0 100 100">
                    <polygon className="edge" points={sh.svg} />
                    <polygon className="hit" points={sh.svg}
                      onPointerEnter={() => focusShard(i)}
                      onPointerLeave={() => blurShard(i)}
                      onPointerDown={(ev) => { lastPointer.current = ev.pointerType; }}
                      onClick={(ev) => openShard(i, ev)} />
                  </svg>
                  <div className="lbl"><span className="ring">{f ? pad2(i + 1) : '+'}</span><span className="nm">{f ? f.nome : 'Nova ficha'}</span></div>
                </div>
              );
            })}
          </div>
          <div className="h-item" ref={itemRef}>
            <div className="layer" ref={(el) => { itemLayers.current[0] = el; }}><img alt="" /></div>
            <div className="layer" ref={(el) => { itemLayers.current[1] = el; }}><img alt="" /></div>
          </div>
        </div>
        <HallPanel fichas={fichas} hover={hover} />
      </div>

      <div className="h-bar">
        <button aria-label="Ficha anterior" disabled={!bar.prev} onClick={() => goTo(Math.round(H.target) - 1)}>‹</button>
        <input type="range" ref={rangeRef} min={0} max={N} step="any" defaultValue={0} aria-label="Posição no Hall" />
        <output>{bar.idx >= N ? 'Nova' : `${bar.idx + 1} / ${N}`}</output>
        <button aria-label="Próxima ficha" disabled={!bar.next} onClick={() => goTo(Math.round(H.target) + 1)}>›</button>
      </div>
      <div className="h-tip">Role, arraste ou use as setas para percorrer</div>
    </section>
  );
}
