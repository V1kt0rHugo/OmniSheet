import type { CSSProperties, KeyboardEventHandler, MouseEventHandler, ReactNode, DragEventHandler } from 'react';
import { portraitSrc, shapeFor } from '../lib/ficha';
import type { Ficha } from '../types';

interface Props {
  ficha: Pick<Ficha, 'id' | 'imagem' | 'cor' | 'foco'>;
  className?: string;
  children?: ReactNode;
  interactive?: boolean;
  onClick?: MouseEventHandler;
  onKeyDown?: KeyboardEventHandler;
  onDragOver?: DragEventHandler;
  onDragLeave?: DragEventHandler;
  onDrop?: DragEventHandler;
}

/** Fragmento de vidro com o retrato recortado (usado no editor e na ficha). */
export function Frag({ ficha, className = '', children, interactive, ...handlers }: Props) {
  const sh = shapeFor(ficha.id);
  const a11y = interactive ? { role: 'button', tabIndex: 0, 'aria-label': 'Escolher retrato' } : {};
  return (
    <div className={('frag-prev ' + className).trim()} style={{ '--hue': ficha.cor ?? 210 } as CSSProperties} {...a11y} {...handlers}>
      <svg className="g" viewBox="0 0 100 100"><polygon points={sh.svg} /></svg>
      <div className="img" style={{ clipPath: sh.clip, backgroundImage: `url("${portraitSrc(ficha)}")`, backgroundPosition: `50% ${ficha.foco ?? 25}%` }} />
      <svg className="e" viewBox="0 0 100 100"><polygon className="edge" points={sh.svg} /></svg>
      {children}
    </div>
  );
}
