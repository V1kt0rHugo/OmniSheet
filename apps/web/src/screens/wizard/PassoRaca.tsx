import type { FichaDraft, Sistema, Dados } from '../../types';
import { descreverEfeito } from '../../lib/calculo';
import { camposDe } from '../../lib/sistema';

export interface PassoRacaProps {
  draft: FichaDraft;
  setDado: (id: string, v: Dados[string]) => void;
  sistema: Sistema;
}

interface RacaInfo {
  imagem?: string;
  passivas?: string[];
  habilidadeInicial?: {
    nome: string;
    custo: string;
    cd: string;
    folego: string;
    descricao: string;
  };
}

const RACAS_EXTRAS: Record<string, RacaInfo> = {
  'Meio Dragão': {
    imagem: 'https://mouneteria.netlify.app/img/a-meiodragao.webp',
    passivas: ['Causa +1.10x de dano Éter'],
    habilidadeInicial: {
      nome: 'Sopro amaldiçoado',
      custo: '20 Mana',
      folego: '1 Fôlego',
      cd: '3 turnos',
      descricao:
        'Você irá puxar todo o ar do seu pulmão e vai disparar uma rajada de fogo roxo, o inimigo vai tomar (30 dano mágico base + seu dano mágico) e causará um debuff de "Enfraquecimento" reduzindo o dano em 10 e sua armadura em 8 por 1 turno.',
    },
  },
};

export function PassoRaca({ draft, setDado, sistema }: PassoRacaProps) {
  const campos = camposDe(sistema);
  const campoRaca = campos.find((c) => c.id === 'raca' && c.tipo === 'selecao');
  const nomeDoCampo = Object.fromEntries(campos.map((c) => [c.id, c.label]));

  const racaSelecionada = (typeof draft.dados['raca'] === 'string'
    ? draft.dados['raca']
    : '') as string;

  const opcoes = campoRaca?.opcoes || ['Meio Dragão'];

  const selecionarRaca = (raca: string) => {
    setDado('raca', raca);
  };

  return (
    <div className="wiz-step-wrap">
      <div className="sys-wrap">
        <p className="sys-lead">
          Escolha a ancestralidade ou raça do seu personagem. Cada raça confere bônus específicos a atributos e pode conceder técnicas iniciais.
        </p>

        <div className="sys-grid">
          {opcoes.map((opcao) => {
            const isSelected = racaSelecionada === opcao;
            const extras = RACAS_EXTRAS[opcao];
            const efeitos = campoRaca?.efeitos?.[opcao] || [];

            return (
              <article
                key={opcao}
                className={`sys-card ${isSelected ? 'selected' : ''}`}
                style={{
                  borderColor: isSelected ? 'var(--gold)' : undefined,
                  background: isSelected ? 'rgba(216,180,106,.08)' : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => selecionarRaca(opcao)}
              >
                <div className="sys-pick">
                  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3>
                      {opcao}
                      {isSelected && <span className="ed-sys">Escolhida</span>}
                    </h3>
                  </header>

                  {extras?.imagem && (
                    <div
                      style={{
                        width: '100%',
                        height: '140px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        margin: '6px 0',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <img
                        src={extras.imagem}
                        alt={opcao}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {efeitos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '6px 0' }}>
                      {efeitos.map((m, idx) => (
                        <span key={idx} className="chip" style={{ borderColor: 'rgba(216,180,106,.4)', color: 'var(--gold)' }}>
                          {descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)}
                        </span>
                      ))}
                    </div>
                  )}

                  {extras?.passivas && (
                    <div style={{ margin: '4px 0', fontSize: '13px', color: '#c3c9de' }}>
                      {extras.passivas.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--gold)' }}>✦</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {extras?.habilidadeInicial && (
                    <div
                      className="carta"
                      style={{
                        marginTop: '8px',
                        padding: '10px 12px',
                        background: 'rgba(7,10,24,.6)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ color: 'var(--gold)', fontSize: '13.5px' }}>
                          {extras.habilidadeInicial.nome}
                        </b>
                        <small style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>
                          Habilidade Inicial
                        </small>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', margin: '4px 0', fontSize: '11.5px', color: 'var(--text-dim)' }}>
                        <span>{extras.habilidadeInicial.custo}</span>
                        <span>·</span>
                        <span>{extras.habilidadeInicial.folego}</span>
                        <span>·</span>
                        <span>CD {extras.habilidadeInicial.cd}</span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#b9bfd4', lineHeight: '1.4' }}>
                        {extras.habilidadeInicial.descricao}
                      </p>
                    </div>
                  )}

                  <small style={{ marginTop: 'auto', paddingTop: '8px' }}>
                    {isSelected ? '✓ Raça selecionada para a ficha' : 'Clique para selecionar esta raça'}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
