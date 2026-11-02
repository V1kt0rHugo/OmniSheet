import { screenCls, useApp, type Origem } from '../app/AppContext';
import { camposDe } from '../lib/sistema';
import { sfx } from '../lib/sfx';

/** Primeira etapa de criar uma ficha: escolher o sistema . */
export function SystemPickerScreen({ from }: { from: Origem }) {
  const { sistemas, fichas, screen, instant, show, openWizard } = useApp();

  const back = () => {
    sfx('cancel');
    if (from === 'menu') show('menu');
    else show('hall', { assemble: true });
  };

  return (
    <section id="scr-systems" className={screenCls(screen === 'systems', instant)} aria-label="Escolher sistema">
      <div className="scroll">
        <header className="ed-top">
          <button className="btn subtle" onClick={back}>Voltar</button>
          <h2>Escolha o sistema</h2>
        </header>
        <div className="sys-wrap">
          <p className="sys-lead">
            Cada sistema tem a sua própria ficha. Escolha em qual RPG o personagem vai jogar.
          </p>
          <div className="sys-grid">
            {sistemas.map((s) => {
              const usos = fichas.filter((f) => f.sistemaId === s.id).length;
              return (
                <article className="sys-card" key={s.id}>
                  <button className="sys-pick" onClick={() => { sfx('confirm'); openWizard(s.id, { from }); }}>
                    <h3>{s.nome}</h3>
                    <p>{s.descricao || 'Sem descrição.'}</p>
                    <small>{camposDe(s).length} campos · {usos} {usos === 1 ? 'ficha' : 'fichas'}</small>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
