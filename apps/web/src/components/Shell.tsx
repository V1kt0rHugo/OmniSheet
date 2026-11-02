import { useEffect, useRef, type ReactNode } from 'react';
import { toggleMute, useMuted } from '../lib/sfx';

/** Definições SVG compartilhadas (vidro e brilho das arestas). */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef2ff" stopOpacity=".30" />
          <stop offset=".5" stopColor="#b9c4ea" stopOpacity=".12" />
          <stop offset="1" stopColor="#8d98c8" stopOpacity=".22" />
        </linearGradient>
        <filter id="fGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

export function MuteButton() {
  const muted = useMuted();
  return (
    <button id="mute" aria-label={muted ? 'Ativar sons' : 'Silenciar sons'} onClick={(e) => { e.stopPropagation(); toggleMute(); }}>
      {muted ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 9l5 6M22 9l-5 6" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13" /></svg>
      )}
    </button>
  );
}

export function Modal({ content, onDismiss }: { content: ReactNode | null; onDismiss: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const open = content != null;

  useEffect(() => {
    if (!open) return;
    (box.current?.querySelector<HTMLElement>('[data-focus]') || box.current?.querySelector<HTMLElement>('button'))?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, onDismiss]);

  return (
    <div id="modal" className={open ? 'on' : ''} role="dialog" aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onDismiss(); }}>
      <div className="mbox" ref={box}>{content}</div>
    </div>
  );
}
