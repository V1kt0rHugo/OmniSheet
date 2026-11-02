import { useState } from 'react';
import type { Calculo } from '../lib/calculo';
import type { ResultadoRolagem } from '../lib/formula';
import { idsParaNomes } from '../lib/formulaNomes';
import { rolarNoSistema } from '../lib/rolagem';
import { refsCitaveis } from '../lib/sistema';
import { sfx } from '../lib/sfx';
import type { Sistema } from '../types';

/** Resultado de uma rolagem: o total em destaque e a conta por baixo. */
export function ResultadoView({ r }: { r: ResultadoRolagem }) {
  return (
    <output className="roll-out" aria-live="polite">
      <b>{r.total}</b>
      <small>{r.texto}</small>
    </output>
  );
}

/** Botão que rola uma fórmula do sistema e mostra o resultado (não é guardado na ficha). */
export function RolagemBotao({ formula, sistema, calc, rotulo = 'Rolar' }: { formula: string; sistema: Sistema; calc: Calculo; rotulo?: string }) {
  const [res, setRes] = useState<ResultadoRolagem | null>(null);
  const [erro, setErro] = useState(false);
  const refs = refsCitaveis(sistema);

  const rolar = () => {
    const r = rolarNoSistema(sistema, calc, formula);
    setErro(!r);
    setRes(r);
    if (r) sfx('hover');
  };

  return (
    <div className="roll-wrap">
      <div className="roll-linha">
        <button type="button" className="btn" onClick={rolar}>{rotulo}</button>
        <code className="roll-formula">{idsParaNomes(formula, refs)}</code>
      </div>
      {res && <ResultadoView r={res} />}
      {erro && <small className="fld-erro">Não consegui rolar: a fórmula cita algo que não está disponível.</small>}
    </div>
  );
}
