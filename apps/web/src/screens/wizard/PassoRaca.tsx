import { useState } from 'react';
import type { FichaDraft, Sistema, Dados } from '../../types';
import { descreverEfeito } from '../../lib/calculo';
import { camposDe } from '../../lib/sistema';
import { useApp } from '../../app/AppContext';
import { sfx } from '../../lib/sfx';

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
        'Puxa todo o ar do pulmão e dispara uma rajada de fogo roxo: 30 dano mágico base + seu dano mágico. Causa "Enfraquecimento" (-10 dano e -8 armadura por 1 turno).',
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
        'Passivamente duplica o raio de acerto de todos os golpes à distância. Gastos de recursos mágicos têm custo reduzido em 1.33x de Mana.',
    },
  },
  'Gigante': {
    imagem: 'https://mouneteria.netlify.app/img/a-gigante.webp',
    passivas: ['Constituição colossal e alta resistência titânica.'],
    habilidadeInicial: {
      nome: 'Refletir',
      tipo: 'Ativa',
      custo: '20 Mana / pessoa',
      folego: '1 Fôlego',
      descricao:
        'Invoca esfera protetora envolta de si e de até 3 aliados que absorve 1/4 do dano total recebido durante 2 turnos.',
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
        'Epifania mental: rolagens de estratégia ou intelecto recebem buff de +8 adicional pelos próximos 3 dados.',
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
        'Surrupia magicamente um item aleatório do alvo. Quanto maior o dado rolado, mais valioso o item (Dado base: d20+2).',
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
        'Ao sofrer golpe fatal que zeraria sua vida, resiste com 1 de HP. Recarrega assim que a vida for restaurada ao máximo.',
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
      custo: 'Metade da Mana máx.',
      descricao:
        'Cria densa tempestade na arena por 10 turnos, ativando seus bônus de combate aquático.',
    },
  },
  'Demônio': {
    imagem: 'https://mouneteria.netlify.app/img/a-demonio.webp',
    passivas: [
      'Bônus de +2 em todos os atributos.',
      'Vulnerabilidade: Sofre 1.4x de dano adicional contra Luz ou Divino.',
    ],
    habilidadeInicial: {
      nome: 'Corromper',
      tipo: 'Ativa',
      custo: '15 Mana (+50 MP/lvl)',
      folego: '1 Fôlego',
      descricao:
        'Aplica "Perverso" em alvos fracos, manipulando-os para te verem como aliado e reduzindo seus ataques em 20 de dano físico.',
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
        'Molda armas com sangue/ferro: causam 40 dano base com chance de Hemorragia (5% do HP atual do alvo como dano verdadeiro).',
    },
  },
  'Hollow': {
    imagem: 'https://mouneteria.netlify.app/img/a-hollow.webp',
    passivas: [
      'Aprende qualquer magia ou habilidade.',
      'Fragilidade Existencial: Ao chegar a 0 de HP, morre imediatamente sem agonia.',
    ],
    habilidadeInicial: {
      nome: 'Devorar',
      tipo: 'Ativa',
      custo: 'Carne orgânica',
      descricao:
        'Ao consumir matéria orgânica de um aliado ou inimigo, absorve +1 a +2 no atributo principal da especialidade do alvo.',
    },
  },
  'Alquimista': {
    imagem: 'https://mouneteria.netlify.app/img/a-alquimista.webp',
    passivas: ['Carrega uma cicatriz obrigatória visível no corpo.'],
    habilidadeInicial: {
      nome: 'Transmutação',
      tipo: 'Ativa',
      custo: 'HP variável',
      descricao:
        'Role Intelecto para aprender novas matérias ou minérios. Uma vez aprendido, replica a matéria ou forja armas à custa de HP.',
    },
  },
};

export function PassoRaca({ draft, setDado, sistema }: PassoRacaProps) {
  const { openModal, closeModal } = useApp();
  const [hoveredRaca, setHoveredRaca] = useState<string | null>(null);

  const campos = camposDe(sistema);
  const campoRaca = campos.find((c) => c.id === 'raca' && c.tipo === 'selecao');
  const nomeDoCampo = Object.fromEntries(campos.map((c) => [c.id, c.label]));

  const racaSelecionada = (typeof draft.dados['raca'] === 'string'
    ? draft.dados['raca']
    : '') as string;

  const opcoes = campoRaca?.opcoes || Object.keys(RACAS_DATA);

  const selecionarRaca = (raca: string) => {
    sfx('confirm');
    setDado('raca', raca);
  };

  const abrirModalDetalhes = (raca: string) => {
    const extras = RACAS_DATA[raca];
    const efeitos = campoRaca?.efeitos?.[raca] || [];

    openModal(
      <div
        className="mbox"
        style={{
          width: 'min(580px, 92vw)',
          maxWidth: '580px',
          boxSizing: 'border-box',
          padding: '24px',
          overflowX: 'hidden',
          border: '1px solid rgba(216, 180, 106, 0.3)',
          background: 'linear-gradient(180deg, #0e1224 0%, #080a16 100%)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 30px rgba(216,180,106,0.1)',
        }}
      >
        {/* Banner Ilustrado no Topo do Modal */}
        {extras?.imagem && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '240px',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '18px',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(30, 36, 70, 0.5) 0%, rgba(4, 5, 14, 0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={extras.imagem}
              alt={raca}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.75))',
              }}
            />
            {racaSelecionada === raca && (
              <span
                className="ed-sys"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(8, 10, 20, 0.9)',
                  backdropFilter: 'blur(4px)',
                  margin: 0,
                  fontSize: '11.5px',
                  padding: '3px 10px',
                }}
              >
                ✓ Selecionada
              </span>
            )}
          </div>
        )}

        {/* Título da Raça */}
        <div style={{ marginBottom: '14px' }}>
          <h3
            style={{
              margin: '0 0 4px',
              fontFamily: 'var(--f-hk)',
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--gold)',
              textShadow: '0 2px 10px rgba(216,180,106,0.3)',
            }}
          >
            {raca.toUpperCase()}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Linhagem de Mouneteria
          </span>
        </div>

        {/* Modificadores de Atributos */}
        {efeitos.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              Modificadores de Atributos
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {efeitos.map((m, idx) => {
                const isPos = m.valor > 0;
                return (
                  <span
                    key={idx}
                    className="chip"
                    style={{
                      borderColor: isPos ? 'rgba(127, 216, 166, 0.45)' : 'rgba(255, 157, 157, 0.45)',
                      color: isPos ? '#7fd8a6' : '#ff9d9d',
                      background: isPos ? 'rgba(127, 216, 166, 0.1)' : 'rgba(255, 157, 157, 0.1)',
                      fontSize: '12px',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontWeight: 500,
                    }}
                  >
                    {descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Características Raciais */}
        {extras?.passivas && extras.passivas.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <span
              style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
                fontWeight: 600,
              }}
            >
              Características Raciais
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {extras.passivas.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'baseline',
                    fontSize: '13px',
                    color: '#c9cee0',
                    lineHeight: '1.4',
                  }}
                >
                  <span style={{ color: 'var(--gold)', fontSize: '11px' }}>✦</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card de Habilidade Inicial */}
        {extras?.habilidadeInicial && (
          <div
            className="carta"
            style={{
              marginBottom: '20px',
              padding: '14px 16px',
              background: 'rgba(5, 7, 18, 0.75)',
              border: '1px solid rgba(216, 180, 106, 0.2)',
              borderRadius: '10px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <b style={{ color: 'var(--gold)', fontSize: '15px', fontFamily: 'var(--f-hk)', letterSpacing: '0.02em' }}>
                {extras.habilidadeInicial.nome}
              </b>
              <span
                style={{
                  fontSize: '10.5px',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(216, 180, 106, 0.12)',
                  border: '1px solid rgba(216, 180, 106, 0.3)',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                Habilidade Inicial · {extras.habilidadeInicial.tipo}
              </span>
            </div>

            {/* Custos e Recarga */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                margin: '6px 0 8px',
                fontSize: '12px',
                color: 'var(--text-dim)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ color: '#93c5fd', fontWeight: 500 }}>{extras.habilidadeInicial.custo}</span>
              {extras.habilidadeInicial.folego && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{extras.habilidadeInicial.folego}</span>
                </>
              )}
              {extras.habilidadeInicial.cd && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ color: '#e2e8f0' }}>CD {extras.habilidadeInicial.cd}</span>
                </>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: '#b9bfd4', lineHeight: '1.5' }}>
              {extras.habilidadeInicial.descricao}
            </p>
          </div>
        )}

        {/* Rodapé do Modal com Botões Alinhados */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            boxSizing: 'border-box',
          }}
        >
          <button type="button" className="btn subtle" onClick={closeModal} style={{ padding: '8px 18px' }}>
            Fechar
          </button>
          <button
            type="button"
            className="btn primary"
            style={{ padding: '8px 22px', fontWeight: 600 }}
            onClick={() => {
              selecionarRaca(raca);
              closeModal();
            }}
          >
            {racaSelecionada === raca ? '✓ Já selecionada' : 'Selecionar ' + raca}
          </button>
        </div>
      </div>
    );
  };

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
            const extras = RACAS_DATA[opcao];
            const efeitos = campoRaca?.efeitos?.[opcao] || [];

            // Resumo de status conciso
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
                  {extras?.imagem && (
                    <img
                      src={extras.imagem}
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

                  {/* Gradiente escuro sutil na base da imagem para fundir com a parte inferior */}
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
                  {extras?.habilidadeInicial && (
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
                      {extras.habilidadeInicial.nome}
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
                        abrirModalDetalhes(opcao);
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
