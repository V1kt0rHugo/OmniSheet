import type { FichaDraft, Sistema, Dados } from '../../types';
import { descreverEfeito } from '../../lib/calculo';
import { camposDe } from '../../lib/sistema';

export interface PassoRacaProps {
  draft: FichaDraft;
  setDado: (id: string, v: Dados[string]) => void;
  sistema: Sistema;
}

// Metadados visuais e ilustrações para raças conhecidas
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
  // Encontra o campo de seleção de raça
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
    <div className="wiz-passo-raca">
      <div className="wiz-header-text">
        <span className="wiz-eyebrow">PASSO 2</span>
        <h2 className="wiz-title">RAÇA</h2>
        <p className="wiz-subtitle">
          Escolha a raça do seu personagem. Os atributos e habilidades são ajustados automaticamente.
        </p>
      </div>

      <div className="wiz-racas-grid">
        {opcoes.map((opcao) => {
          const isSelected = racaSelecionada === opcao;
          const extras = RACAS_EXTRAS[opcao];
          const efeitos = campoRaca?.efeitos?.[opcao] || [];

          return (
            <div
              key={opcao}
              className={`wiz-raca-card ${isSelected ? 'selected' : ''}`}
              onClick={() => selecionarRaca(opcao)}
            >
              <div className="wiz-raca-card-header">
                {extras?.imagem ? (
                  <div className="wiz-raca-thumb">
                    <img src={extras.imagem} alt={opcao} />
                  </div>
                ) : (
                  <div className="wiz-raca-thumb placeholder">
                    <span>{opcao.slice(0, 1)}</span>
                  </div>
                )}
                <div className="wiz-raca-meta">
                  <h3 className="wiz-raca-name">{opcao}</h3>
                  <span className="wiz-raca-badge">
                    {isSelected ? '✓ Selecionada' : 'Clique para escolher'}
                  </span>
                </div>
              </div>

              {/* Modificadores de atributos */}
              {efeitos.length > 0 && (
                <div className="wiz-raca-section">
                  <span className="wiz-raca-subhead">MODIFICADORES DE ATRIBUTOS</span>
                  <div className="wiz-raca-chips">
                    {efeitos.map((m, idx) => (
                      <span
                        key={idx}
                        className={`wiz-chip ${m.valor >= 0 ? 'pos' : 'neg'}`}
                      >
                        {descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Passivas */}
              {extras?.passivas && extras.passivas.length > 0 && (
                <div className="wiz-raca-section">
                  <span className="wiz-raca-subhead">CARACTERÍSTICAS DA RAÇA</span>
                  <ul className="wiz-raca-list">
                    {extras.passivas.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Habilidade Inicial */}
              {extras?.habilidadeInicial && (
                <div className="wiz-raca-section wiz-skill-box">
                  <div className="wiz-skill-header">
                    <span className="wiz-raca-subhead">HABILIDADE INICIAL:</span>
                    <strong className="wiz-skill-title">
                      {extras.habilidadeInicial.nome}
                    </strong>
                  </div>
                  <div className="wiz-skill-cost-row">
                    <span className="wiz-cost-tag">Custo: {extras.habilidadeInicial.custo}</span>
                    <span className="wiz-cost-tag">Fôlego: {extras.habilidadeInicial.folego}</span>
                    <span className="wiz-cost-tag">CD: {extras.habilidadeInicial.cd}</span>
                  </div>
                  <p className="wiz-skill-desc">
                    {extras.habilidadeInicial.descricao}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
