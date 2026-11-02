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
        'Molda armas com sangue/ferro: causam 40 dano base com chance de Hemorragia (5% do HP atual como dano verdadeiro).',
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
      <div className="mbox" style={{ width: 'min(540px, 95vw)', padding: '24px' }}>
        {/* Banner no topo do modal */}
        {extras?.imagem && (
          <div
            style={{
              width: '100%',
              height: '220px',
              borderRadius: '10px',
              overflow: 'hidden',
              marginBottom: '16px',
              background: '#04050a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <img
              src={extras.imagem}
              alt={raca}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--f-hk)', fontSize: '24px', color: 'var(--gold)' }}>
            {raca}
          </h3>
          {racaSelecionada === raca && <span className="ed-sys">✓ Selecionada</span>}
        </div>

        {/* Status / Modificadores */}
        {efeitos.length > 0 && (
          <div style={{ margin: '10px 0' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
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
                      borderColor: isPos ? 'rgba(127, 216, 166, 0.4)' : 'rgba(255, 157, 157, 0.4)',
                      color: isPos ? '#7fd8a6' : '#ff9d9d',
                      background: isPos ? 'rgba(127, 216, 166, 0.08)' : 'rgba(255, 157, 157, 0.08)',
                      fontSize: '12px',
                    }}
                  >
                    {descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Passivas */}
        {extras?.passivas && extras.passivas.length > 0 && (
          <div style={{ margin: '12px 0' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Características Raciais
            </span>
            {extras.passivas.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'baseline', fontSize: '13.5px', color: '#c3c9de', marginBottom: '4px' }}>
                <span style={{ color: 'var(--gold)' }}>✦</span>
                <span style={{ lineHeight: '1.4' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* Habilidade Inicial */}
        {extras?.habilidadeInicial && (
          <div className="carta" style={{ margin: '14px 0 6px', padding: '12px 14px', background: 'rgba(7,10,24,0.7)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ color: 'var(--gold)', fontSize: '14px' }}>{extras.habilidadeInicial.nome}</b>
              <small style={{ color: 'var(--text-dim)', fontSize: '11px', textTransform: 'uppercase' }}>
                {extras.habilidadeInicial.tipo}
              </small>
            </div>
            <div style={{ display: 'flex', gap: '8px', margin: '4px 0 6px', fontSize: '12px', color: 'var(--text-dim)' }}>
              <span style={{ color: 'var(--gold)' }}>{extras.habilidadeInicial.custo}</span>
              {extras.habilidadeInicial.folego && <span>· {extras.habilidadeInicial.folego}</span>}
              {extras.habilidadeInicial.cd && <span>· CD {extras.habilidadeInicial.cd}</span>}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#b9bfd4', lineHeight: '1.45' }}>
              {extras.habilidadeInicial.descricao}
            </p>
          </div>
        )}

        {/* Botões do modal */}
        <div className="mrow" style={{ marginTop: '20px' }}>
          <button type="button" className="btn subtle" onClick={closeModal}>
            Fechar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              selecionarRaca(raca);
              closeModal();
            }}
          >
            {racaSelecionada === raca ? 'Já selecionada' : 'Selecionar ' + raca}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="wiz-step-wrap">
      <div className="sys-wrap" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <p className="sys-lead" style={{ maxWidth: '80ch', margin: '0 0 20px', fontSize: '14px' }}>
          Passe o mouse sobre os cards para ver detalhes completos ou escolher sua raça.
        </p>

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

            // Resumo de status conciso (ex.: "+2 Força, -1 Destreza")
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
                        color: '#93c5fd', // tom azulado suave como na imagem de referência
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
