import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { screenCls, useApp } from '../app/AppContext';
import { portraitSrc } from '../lib/ficha';
import { sfx } from '../lib/sfx';
import { reduceMotion, wait } from '../lib/util';

interface Bg { src: string; pos: string; show: boolean }
const EMPTY_BG: Bg = { src: '', pos: '50% 25%', show: false };

export function TitleScreen() {
  const { fichas, screen, instant, show, enterMenu, setBlackout } = useApp();
  const [go, setGo] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [bg, setBg] = useState<[Bg, Bg]>([EMPTY_BG, EMPTY_BG]);
  const [feature, setFeature] = useState<{ nome: string; epiteto: string } | null>(null);
  const started = useRef(false);
  const order = useRef<string[]>([]);
  const pos = useRef(0);
  const flip = useRef(false);

  const ash = useMemo(() => Array.from({ length: 26 }, () => ({
    left: Math.random() * 100 + '%', top: 40 + Math.random() * 60 + '%',
    animationDuration: 4 + Math.random() * 6 + 's', animationDelay: -Math.random() * 8 + 's',
  } as CSSProperties)), []);

  // fundo: um retrato aleatório por vez, alternando entre duas imagens para fazer o fade
  useEffect(() => {
    order.current = []; pos.current = 0;
    const next = () => {
      if (!fichas.length) { setBg([EMPTY_BG, EMPTY_BG]); setFeature(null); return; }
      if (pos.current >= order.current.length) { order.current = fichas.map((f) => f.id).sort(() => Math.random() - .5); pos.current = 0; }
      const f = fichas.find((x) => x.id === order.current[pos.current++]) || fichas[0];
      const cur: Bg = { src: portraitSrc(f), pos: `50% ${f.foco ?? 25}%`, show: true };
      const nowB = !flip.current;
      setBg((prev) => (nowB ? [{ ...prev[0], show: false }, cur] : [cur, { ...prev[1], show: false }]));
      setFeature({ nome: f.nome, epiteto: f.epiteto });
      flip.current = nowB;
    };
    next();
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [fichas]);

  const start = async () => {
    if (started.current) return;
    started.current = true;
    sfx('start');
    setGo(true);
    await wait(reduceMotion ? 0 : 380);
    setGlitch(true);
    await wait(reduceMotion ? 0 : 420);
    setBlackout(true);
    await wait(650);
    show('menu', { instant: true });
    setBlackout(false);
    enterMenu();
  };

  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started.current && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); startRef.current(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section id="scr-title" className={screenCls(screen === 'title', instant) + (go ? ' go' : '') + (glitch ? ' glitch' : '')} aria-label="Tela de título" onClick={start}>
      <div className="t-city" />
      <div className="t-bg">
        {bg.map((b, i) => (
          <img key={i} alt="" src={b.src || undefined} className={b.show ? 'show' : ''} style={{ objectPosition: b.pos }} />
        ))}
      </div>
      <div className="t-grime" />
      <div className="t-ash">{ash.map((s, i) => <i key={i} style={s} />)}</div>
      <div className="t-logo">
        <svg viewBox="0 0 100 120" aria-hidden="true">
          <path d="M50 4 L62 22 L82 18 L76 40 L94 52 L74 62 L78 86 L56 78 L50 100 L44 78 L22 86 L26 62 L6 52 L24 40 L18 18 L38 22 Z" fill="#8f1616" stroke="#f2c230" strokeWidth="3" />
          <circle cx="50" cy="52" r="15" fill="#f2c230" />
          <path d="M50 44 v10 M45 58 h10 M50 54 l-4 8 h8 z" stroke="#3a1a00" strokeWidth="3" fill="#3a1a00" />
          <path d="M38 104 h24 l-4 12 h-16 z" fill="#f2c230" />
        </svg>
        <h1>Hall<br />da Fama</h1>
      </div>
      <div className="t-band"><span>ENFRENTE O PASSADO, GUARDE A LENDA</span></div>
      <button className="t-start">CLIQUE PARA COMEÇAR</button>
      <div className="t-feature">
        {feature ? <><b>{feature.nome}</b>{feature.epiteto}</> : <><b>Hall vazio</b>crie a primeira ficha</>}
      </div>
      <div className="t-ver">protótipo v0.2</div>
    </section>
  );
}
