import { useState } from 'react';
import type { FichaDraft, Sistema, Dados } from '../../types';
import { descreverEfeito } from '../../lib/calculo';
import { camposDe } from '../../lib/sistema';
import { sfx } from '../../lib/sfx';

export interface PassoRacaProps {
  draft: FichaDraft;
  setDado: (id: string, v: Dados[string]) => void;
  sistema: Sistema;
}

interface TopicoDetalhe {
  titulo?: string;
  conteudo: string | string[];
}

interface RacaCompleta {
  nome: string;
  imagem: string;
  statusLinha: string;
  topicos: TopicoDetalhe[];
  habilidadeResumo: string;
}

const RACAS_DETALHADAS: Record<string, RacaCompleta> = {
  'Meio Dragão': {
    nome: 'Meio Dragão',
    imagem: 'https://mouneteria.netlify.app/img/a-meiodragao.webp',
    statusLinha: '+2 FORÇA   -1 DESTREZA   +1 ÉTER   +1 AGILIDADE   +2 VIGOR',
    habilidadeResumo: 'SOPRO AMALDIÇOADO',
    topicos: [
      {
        conteudo: 'Meio Dragões recebem +2 em Força e Vigor, +1 em Éter e Agilidade, e -1 em Destreza.',
      },
      {
        conteudo: 'Causa +1.10x de dano de Éter em todos os seus golpes e feitiços.',
      },
      {
        conteudo: 'Inicia com a habilidade: Sopro amaldiçoado.',
      },
      {
        titulo: 'Sopro amaldiçoado:',
        conteudo: [
          'Você irá puxar todo o ar do seu pulmão e vai disparar uma rajada de fogo roxo, o inimigo vai tomar (30 dano mágico base + seu dano mágico) e causará um debuff de "Enfraquecimento" reduzindo o dano em 10 e sua armadura em 8 por 1 turno.',
          'Custo: 20 Mana · Fôlego: 1 · CD: 3 turnos · Skill ativa.',
        ],
      },
    ],
  },

  'Elfo': {
    nome: 'Elfo',
    imagem: 'https://mouneteria.netlify.app/img/a-elfo.webp',
    statusLinha: '+2 DESTREZA   +1 ÉTER   +2 AGILIDADE',
    habilidadeResumo: 'PONTARIA',
    topicos: [
      {
        conteudo: 'Elfos ganham +2 em Destreza e Agilidade, e +1 em Éter.',
      },
      {
        conteudo:
          'Enquanto está em um campo de batalha conhecido de forma abrangente, recebe +2 bônus em todos os dados de combate.',
      },
      {
        conteudo: 'Inicia com a habilidade: Pontaria.',
      },
      {
        titulo: 'Pontaria:',
        conteudo: [
          'Passivamente todos seus golpes a distância duplicam o raio de acerto e também seus recursos gastos caso seja uma magia será reduzido em 1.33x do custo de mana.',
          'Skill passiva.',
        ],
      },
    ],
  },

  'Gigante': {
    nome: 'Gigante',
    imagem: 'https://mouneteria.netlify.app/img/a-gigante.webp',
    statusLinha: '+3 FORÇA   +3 VIGOR   -1 AGILIDADE',
    habilidadeResumo: 'REFLETIR',
    topicos: [
      {
        conteudo: 'Gigantes recebem +3 em Força, +3 em Vigor e -1 em Agilidade devido ao seu porte imenso.',
      },
      {
        conteudo: 'Constituição colossal com alta resistência a impactos físicos.',
      },
      {
        conteudo: 'Inicia com a habilidade: Refletir.',
      },
      {
        titulo: 'Refletir (Skill ativa):',
        conteudo: [
          'Invoca uma esfera protetora envolta de si e de seus aliados (Max 3) que vai proteger 1/4x do dano recebido por 2 turnos.',
          'Custo: 20 de MP por pessoa · Fôlego: 1 · Skill ativa.',
        ],
      },
    ],
  },

  'Humano': {
    nome: 'Humano',
    imagem: 'https://mouneteria.netlify.app/img/a-humano.webp',
    statusLinha: '+1 FORÇA   +1 DESTREZA   -4 ÉTER   +5 INTELECTO   +1 AGILIDADE   +1 VIGOR',
    habilidadeResumo: 'GENIALIDADE',
    topicos: [
      {
        conteudo:
          'Arte de Humano: ganham +1 em todos os status exceto Éter e Intelecto (+5 Intelecto, -4 em Éter).',
      },
      {
        conteudo: 'Adaptabilidade: Recebe +3 em testes de aprendizagem.',
      },
      {
        conteudo: 'Inicia com a habilidade: Genialidade.',
      },
      {
        titulo: 'Genialidade (Skill ativa):',
        conteudo: [
          'Entra em uma epifania mental e faz com que qualquer dado de estratégia ou intelecto recebam um buff de +8 adicional pelos próximos 3 dados.',
          'Custo: 15 de HP · Fôlego: 0 · Skill ativa.',
        ],
      },
    ],
  },

  'Goblin': {
    nome: 'Goblin',
    imagem: 'https://mouneteria.netlify.app/img/a-goblin.webp',
    statusLinha: '+3 DESTREZA   +3 AGILIDADE   -1 INTELECTO',
    habilidadeResumo: 'FURTO',
    topicos: [
      {
        conteudo: 'Goblins recebem +3 em Agilidade, +3 em Destreza e -1 em Intelecto.',
      },
      {
        conteudo: 'No escuro se camufla completamente após ficar 1 turno sem atacar.',
      },
      {
        conteudo: 'Iniciam com a habilidade: Furto.',
      },
      {
        titulo: 'Furto (Skill ativa):',
        conteudo: [
          'Faz com que o indivíduo magicamente roube alguma coisa aleatória de seu alvo; quão maior seu dado for melhor o item que pode ser roubado.',
          'Custo: 15 de mana · Fôlego: 1 · Dado único que evolui com a skill: d20+2 · Skill ativa.',
        ],
      },
    ],
  },

  'Prisioneiro': {
    nome: 'Prisioneiro',
    imagem: 'https://mouneteria.netlify.app/img/a-prisioneiro.webp',
    statusLinha: '+1 DESTREZA   +3 ÉTER   -1 INTELECTO   +3 VIGOR',
    habilidadeResumo: 'DETERMINAÇÃO',
    topicos: [
      {
        conteudo: 'Prisioneiros recebem +3 em Vigor e Éter, +1 em Destreza e -1 em Intelecto.',
      },
      {
        conteudo: 'Penalidade mental: o máximo de sanidade que se pode ter é limitado a 80.',
      },
      {
        conteudo: 'Iniciam com a habilidade: Determinação.',
      },
      {
        titulo: 'Determinação (Skill passiva):',
        conteudo: [
          'Caso você tome um golpe que iria zerar sua vida, você resiste com 1 de HP. A skill entra em recarga e só é reativada após seu HP ser preenchido ao máximo novamente.',
          'Skill passiva.',
        ],
      },
    ],
  },

  'Tritões': {
    nome: 'Tritões',
    imagem: 'https://mouneteria.netlify.app/img/a-tritao.webp',
    statusLinha: '-1 FORÇA   +3 DESTREZA   +2 ÉTER   +1 AGILIDADE',
    habilidadeResumo: 'FLEXÍVEL COMO A ÁGUA',
    topicos: [
      {
        conteudo: 'Tritões ganham +3 em Destreza, +2 em Éter, +1 em Agilidade e -1 em Força.',
      },
      {
        conteudo: 'Fisiologia anfíbia: Ganha 2 membros extras funcionais.',
      },
      {
        conteudo: 'Inicia com a habilidade: Flexível como a água.',
      },
      {
        titulo: 'Flexível como a água:',
        conteudo: [
          'Passiva: sempre que estiver em chuva ou em um ambiente aquático seu status de agilidade aumenta em 1.5x.',
          'Ativa: Custa 1/2 de sua mana máxima; em troca cria uma nuvem que cobre a área de batalha inteira e faz chover durante os próximos 10 turnos.',
        ],
      },
    ],
  },

  'Demônio': {
    nome: 'Demônio',
    imagem: 'https://mouneteria.netlify.app/img/a-demonio.webp',
    statusLinha: '+2 FORÇA   +2 DESTREZA   +2 ÉTER   +2 INTELECTO   +2 AGILIDADE   +2 VIGOR',
    habilidadeResumo: 'CORROMPER',
    topicos: [
      {
        conteudo: 'Arte de Demônio: Demônios recebem +2 em todos os atributos base.',
      },
      {
        conteudo: 'Fraqueza sacra: Demônios recebem 1.4x de dano adicional de dano Luz ou Divino.',
      },
      {
        conteudo: 'Iniciam com a habilidade: Corromper.',
      },
      {
        titulo: 'Corromper (Skill ativa):',
        conteudo: [
          'Aplica uma maldição na mente do alvo que o deixa com status "Perverso" em alvos fracos, manipulando-o para te enxergar como aliado e reduzindo a força de seus golpes em 20 de dano físico.',
          'Custo: Inicia custando 15 de Mana (+50 de MP por evolução da skill) · Fôlego: 1 · Skill ativa.',
        ],
      },
    ],
  },

  'Vampiro': {
    nome: 'Vampiro',
    imagem: 'https://mouneteria.netlify.app/img/a-vampiro.webp',
    statusLinha: '+2 FORÇA   -3 DESTREZA   +2 ÉTER   +2 AGILIDADE   +2 VIGOR',
    habilidadeResumo: 'HEMOCINESE',
    topicos: [
      {
        conteudo: 'Vampiros ganham +2 em Vigor, Éter, Força e Agilidade, e -3 em Destreza.',
      },
      {
        conteudo: 'Sede de Sangue: Toda vez que consumir sangue se cura em 6 de HP.',
      },
      {
        conteudo: 'Inicia com a habilidade: Hemocinese.',
      },
      {
        titulo: 'Hemocinese (Skill ativa):',
        conteudo: [
          'Pode-se controlar sangue de qualquer animal ou líquido que possua hemoglobina ou ferro para criar armas ou objetos.',
          'Dano de arma de sangue: 40 dano base + chance de causar Hemorragia (5% da vida atual do inimigo como dano verdadeiro).',
          'Custo: 10 de Mana de ativação · Fôlego: 1 · Skill ativa.',
        ],
      },
    ],
  },

  'Hollow': {
    nome: 'Hollow',
    imagem: 'https://mouneteria.netlify.app/img/a-hollow.webp',
    statusLinha: '+1 FORÇA   +1 DESTREZA   +1 ÉTER   +1 INTELECTO   +1 AGILIDADE   +1 VIGOR',
    habilidadeResumo: 'DEVORAR',
    topicos: [
      {
        conteudo:
          'Hollows recebem a capacidade de aprender qualquer tipo de magia ou habilidade e ganham +1 em todos os status.',
      },
      {
        conteudo: 'Fragilidade mortal: Caso você chegue a 0 de HP, você morre definitivamente sem agonia.',
      },
      {
        conteudo: 'Inicia com a habilidade: Devorar.',
      },
      {
        titulo: 'Devorar (Skill ativa):',
        conteudo: [
          'Ao consumir carne ou matéria orgânica significativa de um aliado ou inimigo, ganha até +2 nos atributos diretos baseado na especialidade do alvo (ex.: devorar pernas de um corredor concede de 1 a +2 em Agilidade).',
        ],
      },
    ],
  },

  'Alquimista': {
    nome: 'Alquimista',
    imagem: 'https://mouneteria.netlify.app/img/a-alquimista.webp',
    statusLinha: '+3 FORÇA   -1 DESTREZA   +3 ÉTER   -1 INTELECTO   -1 AGILIDADE   +2 VIGOR',
    habilidadeResumo: 'TRANSMUTAÇÃO',
    topicos: [
      {
        conteudo: 'Alquimistas ganham +3 em Força e Éter, +2 em Vigor, e -1 em todos os outros atributos.',
      },
      {
        conteudo: 'Marca do sacrifício: Possui uma cicatriz em qualquer parte do corpo (obrigatório).',
      },
      {
        conteudo: 'Inicia com a habilidade: Transmutação.',
      },
      {
        titulo: 'Transmutação (Skill ativa):',
        conteudo: [
          'Role um dado de conhecimento (Intelecto) para aprender um tipo novo de matéria, minério ou elemento. Após aprender, pode criar armas ou replicar o minério à custa de seu próprio HP.',
          'Custo de ativação: Conforme o minério ou elemento utilizado.',
        ],
      },
    ],
  },
};

export function PassoRaca({ draft, setDado, sistema }: PassoRacaProps) {
  const [hoveredRaca, setHoveredRaca] = useState<string | null>(null);
  const [racaDetalhada, setRacaDetalhada] = useState<string | null>(null);

  const campos = camposDe(sistema);
  const campoRaca = campos.find((c) => c.id === 'raca' && c.tipo === 'selecao');
  const nomeDoCampo = Object.fromEntries(campos.map((c) => [c.id, c.label]));

  const racaSelecionada = (typeof draft.dados['raca'] === 'string'
    ? draft.dados['raca']
    : '') as string;

  const opcoes = campoRaca?.opcoes || Object.keys(RACAS_DETALHADAS);

  const selecionarRaca = (raca: string) => {
    sfx('confirm');
    setDado('raca', raca);
  };

  // Se o usuário clicou em "Ver detalhes", renderiza a Tela de Apresentação Cinematográfica Completa
  if (racaDetalhada) {
    const data = RACAS_DETALHADAS[racaDetalhada] || {
      nome: racaDetalhada,
      imagem: '',
      statusLinha: '',
      topicos: [],
      habilidadeResumo: '',
    };
    const isSelected = racaSelecionada === racaDetalhada;

    return (
      <div
        className="wiz-detalhes-fullscreen"
        style={{
          width: '100%',
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '10px 0 30px',
          animation: 'fadeIn 0.25s ease',
          boxSizing: 'border-box',
        }}
      >
        {/* Barra superior de retorno */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            className="btn subtle"
            style={{
              padding: '8px 18px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => setRacaDetalhada(null)}
          >
            ← Voltar para todas as raças
          </button>
        </div>

        {/* PARTE SUPERIOR: TEXTOS GRANDES À ESQUERDA, RETRATO IMPONENTE À DIREITA */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 'clamp(24px, 5vw, 60px)',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          {/* Lado Esquerdo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'var(--f-hk-body)',
                fontStyle: 'italic',
                fontSize: '28px',
                color: 'var(--gold)',
                letterSpacing: '0.04em',
                lineHeight: 1,
              }}
            >
              Raça
            </span>

            <h1
              style={{
                margin: '2px 0 16px',
                fontFamily: 'var(--f-hk)',
                fontSize: 'clamp(44px, 6.5vw, 78px)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#ffffff',
                textShadow: '0 4px 25px rgba(255, 255, 255, 0.25), 0 0 35px rgba(216, 180, 106, 0.35)',
                lineHeight: 1.05,
              }}
            >
              {data.nome.toUpperCase()}
            </h1>

            {/* Linha de Status em destaque (ex.: +2 DESTREZA   +1 ETER   +2 AGILIDADE) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                fontSize: '15px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: '#e2e8f0',
                textTransform: 'uppercase',
                marginTop: '4px',
              }}
            >
              {data.statusLinha.split('   ').map((st, i) => (
                <span
                  key={i}
                  style={{
                    color: st.startsWith('-') ? '#fca5a5' : '#7fd8a6',
                    textShadow: '0 0 10px rgba(0,0,0,0.6)',
                  }}
                >
                  {st}
                </span>
              ))}
            </div>
          </div>

          {/* Lado Direito: Retrato Vertical do Personagem (Grande e sem cortes) */}
          {data.imagem && (
            <div
              style={{
                width: 'clamp(240px, 28vw, 340px)',
                height: 'clamp(330px, 38vw, 460px)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.85), 0 0 35px rgba(139, 92, 246, 0.25)',
                background: '#04050a',
                flexShrink: 0,
              }}
            >
              <img
                src={data.imagem}
                alt={data.nome}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                  display: 'block',
                }}
              />
            </div>
          )}
        </div>

        {/* PARTE INFERIOR: QUADRO DE TEXTO COM CANTONEIRAS E BULLETS ◆ */}
        <div
          style={{
            position: 'relative',
            background: 'rgba(8, 10, 22, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '30px 34px',
            boxSizing: 'border-box',
            marginBottom: '32px',
          }}
        >
          {/* Detalhe de cantoneira angular superior esquerda: ┌ */}
          <div
            style={{
              position: 'absolute',
              top: '-1px',
              left: '-1px',
              width: '16px',
              height: '16px',
              borderTop: '2px solid #818cf8',
              borderLeft: '2px solid #818cf8',
            }}
          />

          {/* Detalhe de cantoneira angular inferior direita: ┘ */}
          <div
            style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '16px',
              height: '16px',
              borderBottom: '2px solid #818cf8',
              borderRight: '2px solid #818cf8',
            }}
          />

          {/* Lista de tópicos com bullet ◆ em fonte grande e legível */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.topicos.map((top, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    color: '#2dd4bf',
                    fontSize: '15px',
                    lineHeight: '1.65',
                    flexShrink: 0,
                  }}
                >
                  ◆
                </span>

                <div style={{ fontSize: '16px', color: '#d1d5db', lineHeight: '1.65' }}>
                  {top.titulo && (
                    <strong style={{ color: '#f3f4f6', display: 'block', marginBottom: '4px' }}>
                      {top.titulo}
                    </strong>
                  )}
                  {Array.isArray(top.conteudo) ? (
                    top.conteudo.map((linha, liIdx) => (
                      <p key={liIdx} style={{ margin: liIdx > 0 ? '6px 0 0' : 0 }}>
                        {linha}
                      </p>
                    ))
                  ) : (
                    <span>{top.conteudo}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BARRA DE AÇÕES NO RODAPÉ */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            type="button"
            className="btn subtle"
            style={{
              padding: '12px 26px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
            onClick={() => setRacaDetalhada(null)}
          >
            ← Voltar para a lista
          </button>

          <button
            type="button"
            className="btn primary"
            style={{
              padding: '12px 34px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
            onClick={() => {
              selecionarRaca(racaDetalhada);
              setRacaDetalhada(null);
            }}
          >
            {isSelected ? '✓ Raça já selecionada (Concluir)' : 'Selecionar ' + racaDetalhada}
          </button>
        </div>
      </div>
    );
  }

  // Visualização normal: Lista de Cards
  return (
    <div className="wiz-step-wrap">
      <div className="sys-wrap" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Cabeçalho Destacado "RAÇAS" */}
        <div
          style={{
            marginBottom: '26px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--f-hk)',
                fontSize: 'clamp(32px, 3.8vw, 44px)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#fff',
                textShadow: '0 2px 18px rgba(216, 180, 106, 0.35)',
                lineHeight: 1.1,
              }}
            >
              RAÇAS
            </h1>
            <span
              className="ed-sys"
              style={{
                fontSize: '12.5px',
                fontWeight: 500,
                padding: '2px 10px',
                background: 'rgba(216, 180, 106, 0.08)',
              }}
            >
              {opcoes.length} linhagens disponíveis
            </span>
          </div>

          <p
            className="sys-lead"
            style={{
              margin: '8px 0 0',
              fontSize: '14.5px',
              color: '#b9bfd4',
              maxWidth: '82ch',
              lineHeight: 1.55,
            }}
          >
            Escolha a ancestralidade do seu personagem. Cada linhagem molda seus atributos, concede dádivas passivas e define sua técnica inicial de combate.
          </p>
        </div>

        {/* Grade de Cards Verticais */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          {opcoes.map((opcao) => {
            const isSelected = racaSelecionada === opcao;
            const isHovered = hoveredRaca === opcao;
            const data = RACAS_DETALHADAS[opcao];
            const efeitos = campoRaca?.efeitos?.[opcao] || [];

            const statusResumo = efeitos
              .map((m) => descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo))
              .join(', ');

            return (
              <article
                key={opcao}
                onMouseEnter={() => setHoveredRaca(opcao)}
                onMouseLeave={() => setHoveredRaca(null)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#070a18',
                  border: isSelected
                    ? '1.5px solid var(--gold)'
                    : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(216,180,106,0.35), inset 0 0 12px rgba(216,180,106,0.12)'
                    : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                }}
              >
                {/* 1. Imagem que ocupa o topo/corpo principal do Card */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '270px',
                    overflow: 'hidden',
                    background: '#03040a',
                  }}
                >
                  {data?.imagem && (
                    <img
                      src={data.imagem}
                      alt={opcao}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 15%',
                        display: 'block',
                      }}
                    />
                  )}

                  {/* Gradiente escuro na base da imagem */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(7,10,24,0) 55%, rgba(7,10,24,0.92) 100%)',
                    }}
                  />

                  {/* Badge de Seleção no topo */}
                  {isSelected && (
                    <span
                      className="ed-sys"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(10,12,24,0.9)',
                        backdropFilter: 'blur(4px)',
                        margin: 0,
                        fontSize: '11px',
                        padding: '2px 8px',
                      }}
                    >
                      ✓ Selecionada
                    </span>
                  )}
                </div>

                {/* 2. Informações na base do Card (Nome, Habilidade em Destaque, Status) */}
                <div
                  style={{
                    padding: '12px 14px 14px',
                    background: '#070a18',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    flex: 1,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--f-hk)',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: isSelected ? 'var(--gold)' : '#ffffff',
                      lineHeight: 1.2,
                    }}
                  >
                    {opcao}
                  </h3>

                  {/* Habilidade Destacada */}
                  {data?.habilidadeResumo && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        color: '#93c5fd',
                        textTransform: 'uppercase',
                        margin: '2px 0',
                      }}
                    >
                      {data.habilidadeResumo}
                    </span>
                  )}

                  {/* Status Extras Resumidos */}
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#a1a7be',
                      lineHeight: 1.35,
                    }}
                  >
                    {statusResumo || 'Sem modificadores'}
                  </div>
                </div>

                {/* 3. Hover Overlay com as 2 opções: "Ver detalhes" e "Selecionar" */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(4, 5, 14, 0.85)',
                      backdropFilter: 'blur(3px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '20px',
                      zIndex: 10,
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    <button
                      type="button"
                      className="btn subtle"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        border: '1px solid rgba(255,255,255,0.2)',
                        textAlign: 'center',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRacaDetalhada(opcao);
                      }}
                    >
                      Ver detalhes
                    </button>

                    <button
                      type="button"
                      className="btn primary"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'center',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selecionarRaca(opcao);
                      }}
                    >
                      {isSelected ? '✓ Selecionada' : 'Selecionar'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
