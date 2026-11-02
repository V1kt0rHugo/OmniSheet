import { useState } from 'react';
import type { Calculo } from '../lib/calculo';
import type { ResultadoRolagem } from '../lib/formula';
import { idsParaNomes } from '../lib/formulaNomes';
import { rolarNoSistema, type EstadoRequisito } from '../lib/rolagem';
import { refsCitaveis } from '../lib/sistema';
import { sfx } from '../lib/sfx';
import type { Requisito, Sistema } from '../types';
import { ResultadoView } from './RolagemBotao';

interface Props {
  sistema: Sistema;
  calc: Calculo;
  requisito: Requisito;
  estado: EstadoRequisito;
  /** O que está sendo conquistado, ex.: "Mago" ou "a magia". */
  titulo: string;
  /** Chamado a cada rolagem, com o resultado e se alcançou o mínimo. */
  onRolar: (r: ResultadoRolagem, aprovado: boolean) => void;
  onCancelar?: () => void;
}

/** Caixa de "dado mínimo": o jogador rola e só ganha a opção ou habilidade se alcançar o valor exigido. */
export function RequisitoRolagem({ sistema, calc, requisito, estado, titulo, onRolar, onCancelar }: Props) {
  const [ultimo, setUltimo] = useState<ResultadoRolagem | null>(null);
  const refs = refsCitaveis(sistema);

  const rolar = () => {
    const r = rolarNoSistema(sistema, calc, requisito.rolagem);
    if (!r) return;
    const ok = r.total >= requisito.minimo;
    setUltimo(r);
    sfx(ok ? 'confirm' : 'cancel');
    onRolar(r, ok);
  };

  return (
    <div className="req-box" role="group" aria-label={`Requisito para ${titulo}`}>
      <p>
        Para ter <b>{titulo}</b> é preciso rolar <code>{idsParaNomes(requisito.rolagem, refs)}</code> e tirar pelo menos <b>{requisito.minimo}</b>.
        {estado.restantes !== null && <> Tentativas restantes: <b>{estado.restantes}</b>.</>}
      </p>
      <div className="row">
        <button type="button" className="btn primary" disabled={estado.esgotado} onClick={rolar}>Rolar</button>
        {onCancelar && <button type="button" className="btn subtle" onClick={onCancelar}>Cancelar</button>}
      </div>
      {ultimo && <ResultadoView r={ultimo} />}
      {estado.tentativas.length > 0 && (
        <ul className="req-hist">
          {estado.tentativas.map((t, i) => (
            <li key={i} className={t.total >= requisito.minimo ? 'ok' : 'falhou'}>
              {t.total >= requisito.minimo ? '✓' : '✗'} {t.texto}
            </li>
          ))}
        </ul>
      )}
      {estado.esgotado && <small className="fld-erro">Sem tentativas: esta opção não pode ser escolhida.</small>}
    </div>
  );
}
