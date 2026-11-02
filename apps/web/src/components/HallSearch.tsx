import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { textoDeBusca } from '../lib/sistema';
import { norm, pad2 } from '../lib/util';
import type { Ficha } from '../types';

export function HallSearch({ fichas, onPick }: { fichas: Ficha[]; onPick: (i: number) => void }) {
  const { sistemaPorId } = useApp();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return [];
    const m: number[] = [];
    fichas.forEach((f, i) => { if (norm(textoDeBusca(f, sistemaPorId(f.sistemaId))).includes(n)) m.push(i); });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, fichas]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!(e.target as Element).closest('.h-search')) setOpen(false); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const pick = (i: number) => { onPick(i); setQ(''); setOpen(false); };

  return (
    <div className="h-search" ref={root}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
      <input ref={input} type="search" autoComplete="off" placeholder="Buscar ficha" aria-label="Buscar ficha" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && matches.length) pick(matches[0]);
          if (e.key === 'Escape') { setQ(''); setOpen(false); input.current?.blur(); }
          if (e.key === 'ArrowDown') { root.current?.querySelector<HTMLButtonElement>('.h-results button')?.focus(); e.preventDefault(); }
        }} />
      {open && q.trim() && (
        <div className="h-results">
          {matches.length ? (
            <>
              {matches.slice(0, 8).map((i) => (
                <button key={fichas[i].id} onClick={() => pick(i)}>
                  <span className="num">{pad2(i + 1)}</span><span>{fichas[i].nome}</span>
                  <span className="sub">{fichas[i].campanha || fichas[i].epiteto || ''}</span>
                </button>
              ))}
              {matches.length > 8 && <div className="none">+{matches.length - 8} resultados. Refine a busca.</div>}
            </>
          ) : <div className="none">Nenhuma ficha encontrada.</div>}
        </div>
      )}
    </div>
  );
}
