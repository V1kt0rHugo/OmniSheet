import { screenCls, useApp } from '../app/AppContext';
import { Frag } from '../components/Frag';
import { hasItem, itemSrc } from '../lib/ficha';
import { calcular, comFormato, descreverBonus, formatar, type Calculo } from '../lib/calculo';
import { atributosDe, destaques, textoDe } from '../lib/sistema';
import { HabilidadesView } from '../components/Habilidades';
import { RolagemBotao } from '../components/RolagemBotao';
import { sfx } from '../lib/sfx';
import { pad2 } from '../lib/util';
import type { CampoDef, Ficha, Sistema } from '../types';
import { H } from './hallState';

const txt = (f: Ficha, c: CampoDef) => textoDe(f.dados, c.id).trim();
const attrs = (f: Ficha, c: CampoDef) => atributosDe(f.dados, c.id);

const CURTOS = ['texto', 'numero', 'selecao', 'calculado', 'booleano', 'recurso'];

/** Valor mostrado de um campo curto, ou null se não há nada a mostrar. */
function valorCurto(f: Ficha, c: CampoDef, calc: Calculo): { valor: string; nota?: string } | null {
  if (c.tipo === 'recurso') return { valor: `${formatar(calc.atuais[c.id])}/${formatar(calc.valores[c.id])}`, nota: descreverBonus(calc.bonus[c.id] ?? []) || undefined };
  if (c.tipo === 'calculado') return { valor: comFormato(c, formatar(calc.valores[c.id])), nota: descreverBonus(calc.bonus[c.id] ?? []) || undefined };
  if (c.tipo === 'numero') {
    const lista = calc.bonus[c.id] ?? [];
    if (!txt(f, c) && !lista.length) return null;
    return { valor: comFormato(c, formatar(calc.valores[c.id])), nota: descreverBonus(lista) || undefined };
  }
  if (c.tipo === 'booleano') return f.dados?.[c.id] === 'true' ? { valor: 'Sim' } : null;
  const v = txt(f, c);
  return v ? { valor: v } : null;
}

/** Mostra os campos do sistema: curtos agrupados por seção, textos longos e atributos com título próprio. */
export function SistemaCampos({ f, s }: { f: Ficha; s: Sistema }) {
  const calc = calcular(s, f.dados);
  return (
    <>
      {s.secoes.map((sec) => {
        const curtos = sec.campos
          .filter((c) => CURTOS.includes(c.tipo) && !c.destaque)
          .map((c) => ({ c, v: valorCurto(f, c, calc) }))
          .filter((x): x is { c: CampoDef; v: { valor: string; nota?: string } } => x.v !== null);
        return (
          <div key={sec.id} className="sheet-sec">
            {curtos.length > 0 && (
              <div>
                <h3>{sec.titulo}</h3>
                <div className="stat-grid">
                  {curtos.map(({ c, v }) => (
                    <div key={c.id} className="stat"><b>{v.valor}</b><span>{c.label}</span>{v.nota && <small className="stat-nota">{v.nota}</small>}</div>
                  ))}
                </div>
              </div>
            )}
            {sec.campos.map((c) => {
              if (c.tipo === 'rolagem') return <div key={c.id}><h3>{c.label}</h3><RolagemBotao formula={c.formula ?? ''} sistema={s} calc={calc} /></div>;
              if (c.tipo === 'habilidades') return <HabilidadesView key={c.id} campo={c} sistema={s} calc={calc} dados={f.dados} />;
              if (c.tipo === 'textarea' && txt(f, c)) return <div key={c.id}><h3>{c.label}</h3><p>{txt(f, c)}</p></div>;
              if (c.tipo === 'atributos' && attrs(f, c).length) {
                return (
                  <div key={c.id}><h3>{c.label}</h3>
                    <div className="stat-grid">
                      {attrs(f, c).map((a, i) => <div key={i} className="stat"><b>{a.v || '-'}</b><span>{a.n || 'Atributo'}</span></div>)}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      })}
    </>
  );
}

export function SheetScreen({ id }: { id: string | null }) {
  const { fichas, screen, instant, show, openEditor, sistemaPorId } = useApp();
  const idx = fichas.findIndex((x) => x.id === id);
  const f: Ficha | undefined = idx >= 0 ? fichas[idx] : undefined;
  const sistema = f ? sistemaPorId(f.sistemaId) : undefined;

  return (
    <section id="scr-sheet" className={screenCls(screen === 'sheet', instant)} aria-label="Ficha do personagem">
      <div className="scroll" key={id ?? 'none'}>
        <header className="ed-top">
          <button className="btn subtle" onClick={() => { sfx('cancel'); if (f) H.t = H.target = idx; show('hall', { assemble: true }); }}>Voltar ao Hall</button>
          <h2>{f?.nome}</h2>
          <button className="btn" onClick={() => { sfx('confirm'); if (f) openEditor(f, { from: 'sheet' }); }}>Editar ficha</button>
        </header>
        {f && (
          <div className="sheet-grid">
            <aside className="sheet-side">
              <Frag ficha={f} />
              {hasItem(f) && (
                <div className="itemcard">
                  <img src={itemSrc(f)} alt="" />
                  <div><b>{f.item.nome || 'Item sem nome'}</b><span>{f.item.descricao || ''}</span></div>
                </div>
              )}
            </aside>
            <div className="sheet-main">
              <div>
                <h1>{f.nome}</h1>
                {f.epiteto && <p className="ep">{f.epiteto}</p>}
                <div className="chips">
                  <span className="chip">Identidade {pad2(idx + 1)} de {pad2(fichas.length)}</span>
                  {[sistema?.nome, f.status, f.campanha, ...destaques(f, sistema)].filter(Boolean).map((c, i) => <span key={i} className="chip">{c}</span>)}
                </div>
              </div>
              {f.resumo.trim() && <div><h3>Resumo</h3><p>{f.resumo}</p></div>}
              {sistema ? <SistemaCampos f={f} s={sistema} /> : <p className="devnote">O sistema desta ficha não foi encontrado.</p>}
              <p className="devnote">O layout visual da ficha ainda está em desenvolvimento. Os dados acima já são os reais.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
