import { useMemo, type CSSProperties } from 'react';
import { screenCls, useApp } from '../app/AppContext';
import { OptionsModal } from '../components/OptionsModal';
import { sfx } from '../lib/sfx';
import { reduceMotion, wait } from '../lib/util';
import { H } from './hallState';

const Fleur = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 12 H14 c4 0 6 -3 6 -6 c0 -2 -2 -3 -3.5 -2 c-1.5 1 -1 3 1 3" />
    <path d="M14 12 c4 0 6 3 6 6 c0 2 -2 3 -3.5 2 c-1.5 -1 -1 -3 1 -3" />
    <path d="M8 12 l3 -3 l3 3 l-3 3z" fill="currentColor" />
  </svg>
);

export function MenuScreen() {
  const { screen, instant, menuPhase, show, openSystemPicker, openModal } = useApp();

  const dust = useMemo(() => Array.from({ length: 34 }, () => {
    const z = 2 + Math.random() * 5;
    return {
      width: z + 'px', height: z + 'px', left: Math.random() * 100 + '%', top: '-5%',
      animationDuration: 12 + Math.random() * 16 + 's', animationDelay: -Math.random() * 25 + 's',
    } as CSSProperties;
  }), []);

  const toHall = async () => {
    sfx('trans');
    // some o menu antes de o Hall se montar
    document.getElementById('scr-menu')?.classList.remove('active');
    await wait(reduceMotion ? 100 : 700);
    H.t = H.target = 0;
    show('hall', { assemble: true });
  };

  const items = [
    { t: 'Ver Hall', go: toHall },
    { t: 'Registrar personagem', go: () => openSystemPicker({ from: 'menu' }) },
    { t: 'Opções', go: () => openModal(<OptionsModal />) },
    { t: 'Voltar ao título', go: () => location.reload() },
  ];

  return (
    <section id="scr-menu" className={screenCls(screen === 'menu', instant) + (menuPhase !== 'off' ? ' lit' : '') + (menuPhase === 'risen' ? ' risen' : '')} aria-label="Menu principal">
      <div className="m-shafts" />
      <div className="m-dust">{dust.map((s, i) => <i key={i} style={s} />)}</div>
      <div className="m-head">
        <svg viewBox="0 0 460 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M230 6 c-8 10 -8 20 0 30 c8 -10 8 -20 0 -30z" fill="currentColor" />
          <path d="M212 22 c-30 -18 -60 4 -96 -4 c-30 -6 -48 6 -76 2" />
          <path d="M248 22 c30 -18 60 4 96 -4 c30 -6 48 6 76 2" />
          <path d="M150 20 c-6 -12 -22 -10 -20 2 c2 8 12 6 12 0" />
          <path d="M310 20 c6 -12 22 -10 20 2 c-2 8 -12 6 -12 0" />
        </svg>
        <h2>Hall da Fama</h2>
        <svg viewBox="0 0 460 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M60 14 H200 M260 14 H400" />
          <path d="M230 2 l10 12 l-10 12 l-10 -12z" fill="currentColor" />
          <path d="M200 14 c8 0 10 8 18 8 M260 14 c-8 0 -10 8 -18 8" />
          <path d="M120 14 c10 10 30 12 50 4 M340 14 c-10 10 -30 12 -50 4" />
          <circle cx="56" cy="14" r="3" fill="currentColor" /><circle cx="404" cy="14" r="3" fill="currentColor" />
        </svg>
      </div>
      <nav className="m-nav" id="menuNav">
        {items.map((m) => (
          <button key={m.t} className="m-item" onMouseEnter={() => sfx('hover')} onClick={() => { sfx('confirm'); m.go(); }}>
            <span className="fl l"><Fleur /></span>{m.t}<span className="fl r"><Fleur /></span>
          </button>
        ))}
      </nav>
      <div className="m-foot">protótipo v0.2</div>
    </section>
  );
}
