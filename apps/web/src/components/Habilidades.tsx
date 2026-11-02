import { useState } from 'react';
import type { Calculo } from '../lib/calculo';
import { formatar } from '../lib/calculo';
import { custoEfetivo } from '../lib/rolagem';
import { camposDe, cartasDe, textoDe } from '../lib/sistema';
import { sfx } from '../lib/sfx';
import type { CampoDef, CampoModelo, Carta, CartasValor, Dados, Sistema, TentativaRolagem } from '../types';
import { RequisitoRolagem } from './RequisitoRolagem';
import { RolagemBotao } from './RolagemBotao';

const numero = (v: string) => { const n = parseFloat(v.replace(',', '.')); return Number.isFinite(n) ? n : 0; };

/** Título do card: o primeiro campo de texto preenchido, senão "Magia 1". */
function tituloDa(c: CampoDef, carta: Carta, i: number) {
  const m = c.habilidades!;
  const primeiro = m.campos.find((x) => x.tipo === 'texto');
  return (primeiro && carta.valores[primeiro.id]?.trim()) || `${m.nome} ${i + 1}`;
}

interface EditorProps {
  campo: CampoDef;
  sistema: Sistema;
  calc: Calculo;
  dados: Dados;
  setDado: (id: string, v: Dados[string]) => void;
  toast: (msg: string) => void;
}

/** Lista de cards de habilidades na ficha (editor). Adicionar pode exigir uma rolagem de dado mínimo. */
export function HabilidadesEditor({ campo, sistema, calc, dados, setDado, toast }: EditorProps) {
  const modelo = campo.habilidades!;
  const cartas = cartasDe(dados, campo.id);
  const [tentando, setTentando] = useState(false);
  const [tentativas, setTentativas] = useState<TentativaRolagem[]>([]);
  const campos = camposDe(sistema);

  const gravar = (novas: Carta[]) => setDado(campo.id, { cartas: novas } satisfies CartasValor);
  const novaCarta = (): Carta => ({
    id: crypto.randomUUID(),
    valores: Object.fromEntries(modelo.campos.map((c) => [c.id, c.padrao ?? ''])),
  });
  const adicionar = () => { gravar([...cartas, novaCarta()]); setTentando(false); setTentativas([]); };

  const requisito = modelo.requisito;
  const restantes = requisito && requisito.tentativas > 0 ? Math.max(0, requisito.tentativas - tentativas.length) : null;

  const setValor = (id: string, campoId: string, v: string) => gravar(cartas.map((c) => (c.id === id ? { ...c, valores: { ...c.valores, [campoId]: v } } : c)));

  /** Paga o custo de um card a partir do campo de recurso (ou número) escolhido no modelo. */
  const usar = (custo: number, recursoId: string, marca?: string) => {
    const alvo = campos.find((c) => c.id === recursoId);
    if (!alvo) return;
    const atual = alvo.tipo === 'recurso' ? (calc.atuais[recursoId] ?? 0) : numero(textoDe(dados, recursoId));
    if (custo > atual) { toast(`${alvo.label} insuficiente: custo ${formatar(custo)}, você tem ${formatar(atual)}.`); return; }
    setDado(recursoId, String(Math.round((atual - custo) * 100) / 100));
    if (marca) setDado(marca, 'true');
    sfx('confirm');
  };

  const renderCampo = (carta: Carta, m: CampoModelo) => {
    const v = carta.valores[m.id] ?? '';
    if (m.tipo === 'textarea') return <label className="fld span-6" key={m.id}><span>{m.label}</span><textarea value={v} onChange={(e) => setValor(carta.id, m.id, e.target.value)} /></label>;
    if (m.tipo === 'selecao') {
      return (
        <label className="fld" key={m.id}><span>{m.label}</span>
          <select value={v} onChange={(e) => setValor(carta.id, m.id, e.target.value)}>
            <option value="">—</option>
            {m.opcoes?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
      );
    }
    if (m.tipo === 'rolagem') {
      return <div className="fld" key={m.id}><span>{m.label}</span><RolagemBotao formula={m.formula ?? ''} sistema={sistema} calc={calc} /></div>;
    }
    if (m.tipo === 'custo') {
      const alvo = campos.find((c) => c.id === m.recurso);
      const base = numero(v);
      const pago = custoEfetivo(m, base, calc);
      return (
        <div className="fld" key={m.id}><span>{m.label}{alvo && <i>{alvo.label}</i>}</span>
          <div className="recurso-row">
            <input type="number" min={0} value={v} onChange={(e) => setValor(carta.id, m.id, e.target.value)} />
            <button type="button" className="btn" disabled={!alvo || !v} onClick={() => usar(pago, m.recurso ?? '', m.marca)}>Usar</button>
          </div>
          {pago !== base && <small className="fld-total">paga {formatar(pago)}{alvo ? ` de ${alvo.label}` : ''}</small>}
        </div>
      );
    }
    return (
      <label className="fld" key={m.id}><span>{m.label}</span>
        <input type={m.tipo === 'numero' ? 'number' : 'text'} maxLength={m.tipo === 'texto' ? 120 : undefined} value={v} onChange={(e) => setValor(carta.id, m.id, e.target.value)} />
      </label>
    );
  };

  return (
    <div className="cartas span-6">
      {cartas.map((carta, i) => (
        <article className="carta" key={carta.id}>
          <header>
            <b>{tituloDa(campo, carta, i)}</b>
            <button type="button" className="icon-btn" aria-label={`Remover ${modelo.nome}`} onClick={() => gravar(cartas.filter((c) => c.id !== carta.id))}>×</button>
          </header>
          <div className="carta-campos">{modelo.campos.map((m) => renderCampo(carta, m))}</div>
        </article>
      ))}

      {tentando && requisito ? (
        <RequisitoRolagem sistema={sistema} calc={calc} requisito={requisito} titulo={`uma nova ${modelo.nome}`}
          estado={{ aprovado: false, tentativas, restantes, esgotado: restantes === 0 }}
          onRolar={(r, ok) => { if (ok) adicionar(); else setTentativas((t) => [...t, { total: r.total, texto: r.texto }]); }}
          onCancelar={() => { setTentando(false); setTentativas([]); }} />
      ) : (
        <div className="row">
          <button type="button" className="btn" onClick={() => (requisito ? setTentando(true) : adicionar())}>
            Adicionar {modelo.nome.toLowerCase()}{requisito ? ' (exige rolagem)' : ''}
          </button>
        </div>
      )}
    </div>
  );
}

/** Cards de habilidades na ficha lida: só leitura, com os botões de rolar. */
export function HabilidadesView({ campo, sistema, calc, dados }: { campo: CampoDef; sistema: Sistema; calc: Calculo; dados: Dados }) {
  const modelo = campo.habilidades!;
  const cartas = cartasDe(dados, campo.id);
  const campos = camposDe(sistema);
  if (!cartas.length) return null;
  return (
    <div>
      <h3>{campo.label}</h3>
      <div className="cartas">
        {cartas.map((carta, i) => (
          <article className="carta" key={carta.id}>
            <header><b>{tituloDa(campo, carta, i)}</b></header>
            <div className="carta-view">
              {modelo.campos.map((m) => {
                const v = carta.valores[m.id]?.trim() ?? '';
                if (m.tipo === 'rolagem') return <div key={m.id}><small>{m.label}</small><RolagemBotao formula={m.formula ?? ''} sistema={sistema} calc={calc} /></div>;
                if (!v || (m.tipo === 'texto' && m.id === modelo.campos.find((x) => x.tipo === 'texto')?.id)) return null;
                if (m.tipo === 'custo') {
                  const pago = custoEfetivo(m, numero(v), calc);
                  return <p key={m.id}><small>{m.label}</small> {v}{pago !== numero(v) ? ` (paga ${formatar(pago)})` : ''} {campos.find((c) => c.id === m.recurso)?.label}</p>;
                }
                return <p key={m.id}><small>{m.label}</small> {v}</p>;
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
