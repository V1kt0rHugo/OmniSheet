import type { FichaDraft, Sistema, Dados } from '../../types';
import { descreverEfeito } from '../../lib/calculo';
import { camposDe } from '../../lib/sistema';

export interface PassoRacaProps {
  draft: FichaDraft;
  setDado: (id: string, v: Dados[string]) => void;
  sistema: Sistema;
}

interface RacaInfo {
  imagem: string;
  passivas: string[];
  habilidadeInicial: {
    nome: string;
    tipo: 'Ativa' | 'Passiva';
    custo: string;
    folego?: string;
    cd?: string;
    descricao: string;
  };
}

const RACAS_DATA: Record<string, RacaInfo> = {
  'Meio Dragão': {
    imagem: 'https://mouneteria.netlify.app/img/a-meiodragao.webp',
    passivas: ['Causa +1.10x de dano Éter.'],
    habilidadeInicial: {
      nome: 'Sopro amaldiçoado',
      tipo: 'Ativa',
      custo: '20 Mana',
      folego: '1 Fôlego',
      cd: '3 turnos',
      descricao:
        'Puxa o ar do pulmão e dispara uma rajada de fogo roxo: causa 30 dano mágico base + seu dano mágico e aplica "Enfraquecimento" (-10 dano e -8 armadura por 1 turno).',
    },
  },
  'Elfo': {
    imagem: 'https://mouneteria.netlify.app/img/a-elfo.webp',
    passivas: [
      'Em campo de batalha conhecido de forma abrangente, recebe +2 de bônus em todos os dados de combate.',
    ],
    habilidadeInicial: {
      nome: 'Pontaria',
      tipo: 'Passiva',
      custo: 'Passiva',
      descricao:
        'Passivamente duplica o raio de acerto de todos os golpes à distância. Gastos de recursos mágicos são reduzidos em 1.33x do custo de Mana.',
    },
  },
  'Gigante': {
    imagem: 'https://mouneteria.netlify.app/img/a-gigante.webp',
    passivas: ['Resistência titânica e constituição imensa.'],
    habilidadeInicial: {
      nome: 'Refletir',
      tipo: 'Ativa',
      custo: '20 Mana / pessoa',
      folego: '1 Fôlego',
      descricao:
        'Invoca uma esfera protetora envolta de si e de até 3 aliados que absorve e protege 1/4 do dano total recebido durante 2 turnos.',
    },
  },
  'Humano': {
    imagem: 'https://mouneteria.netlify.app/img/a-humano.webp',
    passivas: ['Adaptabilidade: Recebe +3 de bônus em testes de aprendizagem.'],
    habilidadeInicial: {
      nome: 'Genialidade',
      tipo: 'Ativa',
      custo: '15 HP',
      folego: '0 Fôlego',
      descricao:
        'Entra em epifania mental: qualquer rolagem de dado de estratégia ou intelecto recebe um buff de +8 adicional pelos próximos 3 dados.',
    },
  },
  'Goblin': {
    imagem: 'https://mouneteria.netlify.app/img/a-goblin.webp',
    passivas: ['No escuro se camufla completamente após ficar 1 turno sem atacar.'],
    habilidadeInicial: {
      nome: 'Furto',
      tipo: 'Ativa',
      custo: '15 Mana',
      folego: '1 Fôlego',
      descricao:
        'Surrupia magicamente um item aleatório do alvo. Quanto maior o dado rolado, mais valioso e raro é o item roubado (Dado base: d20+2).',
    },
  },
  'Prisioneiro': {
    imagem: 'https://mouneteria.netlify.app/img/a-prisioneiro.webp',
    passivas: ['Sanidade máxima limitada a 80.'],
    habilidadeInicial: {
      nome: 'Determinação',
      tipo: 'Passiva',
      custo: 'Passiva',
      descricao:
        'Ao receber um golpe fatal que zeraria sua vida, você resiste com 1 de HP. A técnica recarrega e pode ser usada novamente assim que o HP for restaurado ao máximo.',
    },
  },
  'Tritões': {
    imagem: 'https://mouneteria.netlify.app/img/a-tritao.webp',
    passivas: [
      'Ganha 2 membros extras funcionais.',
      'Na chuva ou em ambiente aquático, sua Agilidade aumenta em 1.5x.',
    ],
    habilidadeInicial: {
      nome: 'Flexível como a Água',
      tipo: 'Ativa',
      custo: 'Metade da Mana máxima',
      descricao:
        'Cria uma densa tempestade que cobre a arena de batalha por inteiro, fazendo chover pelos próximos 10 turnos (ativando seus bônus aquáticos).',
    },
  },
  'Demônio': {
    imagem: 'https://mouneteria.netlify.app/img/a-demonio.webp',
    passivas: [
      'Bônus de +2 em todos os atributos.',
      'Vulnerabilidade: Sofre 1.4x de dano adicional contra fontes de Luz ou Divino.',
    ],
    habilidadeInicial: {
      nome: 'Corromper',
      tipo: 'Ativa',
      custo: '15 Mana (+50 MP / nível)',
      folego: '1 Fôlego',
      descricao:
        'Aplica "Perverso" na mente de alvos fracos, manipulando-os para te verem como aliado e reduzindo a força dos golpes deles em 20 de dano físico.',
    },
  },
  'Vampiro': {
    imagem: 'https://mouneteria.netlify.app/img/a-vampiro.webp',
    passivas: ['Consumo de Sangue: Restaura 6 de HP sempre que consumir sangue.'],
    habilidadeInicial: {
      nome: 'Hemocinese',
      tipo: 'Ativa',
      custo: '10 Mana',
      folego: '1 Fôlego',
      descricao:
        'Manipula sangue ou ferro líquido para moldar armas ou constructos. Armas causam 40 dano base com chance de causar Hemorragia (5% do HP atual como dano verdadeiro).',
    },
  },
  'Hollow': {
    imagem: 'https://mouneteria.netlify.app/img/a-hollow.webp',
    passivas: [
      'Capacidade de aprender qualquer magia ou habilidade do jogo.',
      'Fragilidade Existencial: Se chegar a 0 de HP, morre imediatamente sem testes de agonia.',
    ],
    habilidadeInicial: {
      nome: 'Devorar',
      tipo: 'Ativa',
      custo: 'Carne orgânica',
      descricao:
        'Ao consumir material orgânico significativo de um aliado ou inimigo, absorve de +1 a +2 no atributo principal da especialidade do alvo.',
    },
  },
  'Alquimista': {
    imagem: 'https://mouneteria.netlify.app/img/a-alquimista.webp',
    passivas: ['Carrega uma cicatriz obrigatória em alguma parte do corpo.'],
    habilidadeInicial: {
      nome: 'Transmutação',
      tipo: 'Ativa',
      custo: 'Custo de HP variável',
      descricao:
        'Role conhecimento (Intelecto) para sintetizar uma nova matéria, minério ou elemento. Uma vez aprendido, permite replicar a matéria ou criar armas.',
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

  const opcoes = campoRaca?.opcoes || Object.keys(RACAS_DATA);

  const selecionarRaca = (raca: string) => {
    setDado('raca', raca);
  };

  return (
    <div className="wiz-step-wrap">
      <div className="sys-wrap" style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <p className="sys-lead" style={{ maxWidth: '80ch', margin: '0 0 20px' }}>
          Escolha a ancestralidade ou raça do seu personagem. Cada raça altera atributos base,
          confere características passivas e concede técnicas únicas de combate.
        </p>

        {/* Grade de Raças Fluida */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px',
            alignItems: 'stretch',
          }}
        >
          {opcoes.map((opcao) => {
            const isSelected = racaSelecionada === opcao;
            const extras = RACAS_DATA[opcao];
            const efeitos = campoRaca?.efeitos?.[opcao] || [];

            return (
              <article
                key={opcao}
                className="sys-card"
                onClick={() => selecionarRaca(opcao)}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.12)',
                  background: isSelected ? 'rgba(216,180,106,.09)' : 'rgba(10,12,24,.6)',
                  boxShadow: isSelected
                    ? '0 0 18px rgba(216,180,106,.25), inset 0 0 12px rgba(216,180,106,.1)'
                    : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Ilustração da Raça tipo Banner */}
                {extras?.imagem && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '180px',
                      overflow: 'hidden',
                      background: '#04050a',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <img
                      src={extras.imagem}
                      alt={opcao}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 20%',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(180deg, rgba(7,10,24,0) 50%, rgba(7,10,24,0.9) 100%)',
                      }}
                    />
                    {isSelected && (
                      <span
                        className="ed-sys"
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(10,12,24,0.85)',
                          backdropFilter: 'blur(4px)',
                          margin: 0,
                        }}
                      >
                        ✓ Selecionada
                      </span>
                    )}
                  </div>
                )}

                <div className="sys-pick" style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: isSelected ? 'var(--gold)' : '#fff', fontSize: '20px' }}>
                      {opcao}
                    </h3>
                  </header>

                  {/* Modificadores de atributos com cores de bônus / penalidade */}
                  {efeitos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {efeitos.map((m, idx) => {
                        const isPos = m.valor > 0;
                        return (
                          <span
                            key={idx}
                            className="chip"
                            style={{
                              borderColor: isPos ? 'rgba(127, 216, 166, 0.4)' : 'rgba(255, 157, 157, 0.4)',
                              color: isPos ? '#7fd8a6' : '#ff9d9d',
                              background: isPos ? 'rgba(127, 216, 166, 0.08)' : 'rgba(255, 157, 157, 0.08)',
                              fontSize: '12px',
                              padding: '2px 8px',
                            }}
                          >
                            {descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Características Passivas */}
                  {extras?.passivas && extras.passivas.length > 0 && (
                    <div style={{ marginBottom: '12px', fontSize: '13px', color: '#c3c9de', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {extras.passivas.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                          <span style={{ color: 'var(--gold)', fontSize: '11px' }}>✦</span>
                          <span style={{ lineHeight: '1.4' }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Habilidade Inicial */}
                  {extras?.habilidadeInicial && (
                    <div
                      className="carta"
                      style={{
                        marginTop: 'auto',
                        padding: '10px 14px',
                        background: 'rgba(7,10,24,0.65)',
                        border: '1px solid rgba(255,255,255,0.09)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ color: 'var(--gold)', fontSize: '13.5px' }}>
                          {extras.habilidadeInicial.nome}
                        </b>
                        <small style={{ color: 'var(--text-dim)', fontSize: '11.5px', textTransform: 'uppercase' }}>
                          {extras.habilidadeInicial.tipo}
                        </small>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center',
                          margin: '4px 0 6px',
                          fontSize: '11.5px',
                          color: 'var(--text-dim)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ color: 'var(--gold)' }}>{extras.habilidadeInicial.custo}</span>
                        {extras.habilidadeInicial.folego && (
                          <>
                            <span>·</span>
                            <span>{extras.habilidadeInicial.folego}</span>
                          </>
                        )}
                        {extras.habilidadeInicial.cd && (
                          <>
                            <span>·</span>
                            <span>CD {extras.habilidadeInicial.cd}</span>
                          </>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#b9bfd4', lineHeight: '1.45' }}>
                        {extras.habilidadeInicial.descricao}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '14px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <small style={{ color: isSelected ? 'var(--gold)' : 'var(--text-dim)', fontSize: '12px' }}>
                      {isSelected ? '✓ Raça escolhida para a ficha' : 'Clique para selecionar'}
                    </small>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
