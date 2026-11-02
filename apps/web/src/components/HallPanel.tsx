import { useApp } from '../app/AppContext';
import { hasItem, itemSrc } from '../lib/ficha';
import { destaques } from '../lib/sistema';
import { pad2 } from '../lib/util';
import type { Ficha } from '../types';

export function HallPanel({ fichas, hover }: { fichas: Ficha[]; hover: number | null }) {
  const { sistemaPorId } = useApp();
  const N = fichas.length;
  const f = hover !== null ? fichas[hover] : undefined;

  if (hover !== null && !f) {
    return (
      <aside className="h-panel idle" id="panel" aria-live="polite">
        <div className="ttl"><span className="n">+</span><h3>Nova ficha</h3></div>
        <p className="desc">Clique para criar uma nova identidade. Ela vira o próximo fragmento do espelho.</p>
      </aside>
    );
  }
  if (!f || hover === null) {
    return (
      <aside className="h-panel idle" id="panel" aria-live="polite">
        <div className="ttl"><h3>{N ? 'Passe o mouse sobre um fragmento' : 'O espelho está intacto'}</h3></div>
        <p className="desc">{N ? 'Cada fragmento é uma identidade diferente do mesmo personagem. Clique para abrir a ficha.' : 'Crie a primeira ficha e o primeiro fragmento se forma.'}</p>
      </aside>
    );
  }

  const sistema = sistemaPorId(f.sistemaId);
  const camp = [sistema?.nome, f.campanha, destaques(f, sistema).join(' ')].filter(Boolean).join(' | ')
    + (f.item?.nome ? ` | Item: ${f.item.nome}` : '');
  return (
    <aside className="h-panel" id="panel" aria-live="polite">
      {hasItem(f) && <div className="icon"><img src={itemSrc(f)} alt="" /></div>}
      <div className="ttl">
        <span className="n">{pad2(hover + 1)}</span>
        <div><h3>{f.nome}</h3>{f.epiteto && <p className="ep">{f.epiteto}</p>}</div>
      </div>
      <p className="camp">{camp}</p>
      {f.resumo && <p className="desc">{f.resumo}</p>}
      <div className="status">{f.status || 'Ativo'}{f.demo ? ' (exemplo)' : ''}</div>
    </aside>
  );
}
