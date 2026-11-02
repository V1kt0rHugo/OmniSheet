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
        'Puxa o ar do pulmão e dispara uma rajada de fogo roxo: 30 dano mágico base + seu dano mágico. Aplica "Enfraquecimento" (-10 dano e -8 armadura por 1 turno).',
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
        'Duplica o raio de acerto de todos os golpes à distância. Recursos mágicos gastos têm custo reduzido em 1.33x.',
    },
  },
  'Gigante': {
    imagem: 'https://mouneteria.netlify.app/img/a-gigante.webp',
    passivas: ['Constituição colossal e alta resistência física.'],
    habilidadeInicial: {
      nome: 'Refletir',
      tipo: 'Ativa',
      custo: '20 Mana / pessoa',
      folego: '1 Fôlego',
      descricao:
        'Esfera protetora em si e em até 3 aliados que absorve e protege 1/4 do dano total recebido durante 2 turnos.',
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
      <div className="sys-wrap" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <p className="sys-lead" style={{ maxWidth: '80ch', margin: '0 0 16px', fontSize: '14px' }}>
          Escolha a ancestralidade ou raça do seu personagem. Cada raça altera atributos base,
          confere características passivas e concede técnicas únicas de combate.
        </p>

        {/* Grade de Raças Compacta */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))',
            gap: '14px',
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
                  background: isSelected ? 'rgba(216,180,106,.08)' : 'rgba(10,12,24,.6)',
                  boxShadow: isSelected
                    ? '0 0 16px rgba(216,180,106,.25), inset 0 0 10px rgba(216,180,106,.08)'
                    : 'none',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Imagem Inteira Sem Cortar */}
                {extras?.imagem && (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '160px',
                      background: 'radial-gradient(ellipse at 50% 50%, rgba(32,38,70,0.45) 0%, rgba(6,8,18,0.95) 100%)',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                    }}
                  >
                    <img
                      src={extras.imagem}
                      alt={opcao}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.65))',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                    {isSelected && (
                      <span
                        className="ed-sys"
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(10,12,24,0.9)',
                          backdropFilter: 'blur(4px)',
                          margin: 0,
                          fontSize: '11px',
                          padding: '1px 8px',
                        }}
                      >
                        ✓ Selecionada
                      </span>
                    )}
                  </div>
                )}

                {/* Conteúdo Informativo Compacto */}
                <div
                  style={{
                    padding: '12px 14px 14px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3
                      style={{
                        margin: 0,
                        color: isSelected ? 'var(--gold)' : '#fff',
                        fontSize: '17px',
                        fontWeight: 600,
                      }}
                    >
                      {opcao}
                    </h3>
                  </header>

                  {/* Modificadores de atributos compactos */}
                  {efeitos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Passivas */}
                  {extras?.passivas && extras.passivas.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#c3c9de', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {extras.passivas.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '5px', alignItems: 'baseline' }}>
                          <span style={{ color: 'var(--gold)', fontSize: '10px' }}>✦</span>
                          <span style={{ lineHeight: '1.35' }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Habilidade Inicial Compacta */}
                  {extras?.habilidadeInicial && (
                    <div
                      className="carta"
                      style={{
                        marginTop: 'auto',
                        padding: '8px 10px',
                        background: 'rgba(7,10,24,0.6)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b style={{ color: 'var(--gold)', fontSize: '12.5px' }}>
                          {extras.habilidadeInicial.nome}
                        </b>
                        <small style={{ color: 'var(--text-dim)', fontSize: '10.5px', textTransform: 'uppercase' }}>
                          {extras.habilidadeInicial.tipo}
                        </small>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center',
                          margin: '3px 0 4px',
                          fontSize: '11px',
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

                      <p style={{ margin: 0, fontSize: '11.5px', color: '#b9bfd4', lineHeight: '1.4' }}>
                        {extras.habilidadeInicial.descricao}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <small style={{ color: isSelected ? 'var(--gold)' : 'var(--text-dim)', fontSize: '11.5px' }}>
                      {isSelected ? '✓ Selecionada' : 'Clique para selecionar'}
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
