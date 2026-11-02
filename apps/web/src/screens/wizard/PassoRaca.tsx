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
  isSubraca?: boolean;
  dadoMinimo?: number;
}

const RACAS_DETALHADAS: Record<string, RacaCompleta> = {
  // ─── RAÇAS BASE (Dado não necessário) ──────────────────────────────
  'Meio Dragão': {
    nome: 'Meio Dragão',
    imagem: 'https://mouneteria.netlify.app/img/a-meiodragao.webp',
    statusLinha: '+2 FORÇA   -1 DESTREZA   +1 ÉTER   +1 AGILIDADE   +2 VIGOR',
    habilidadeResumo: 'SOPRO AMALDIÇOADO',
    isSubraca: false,
    topicos: [
      { conteudo: 'Meio Dragões recebem +2 em Força e Vigor, +1 em Éter e Agilidade, e -1 em Destreza.' },
      { conteudo: 'Causa +1.10x de dano de Éter em todos os seus golpes e feitiços.' },
      { conteudo: 'Inicia com a habilidade: Sopro amaldiçoado.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Elfos ganham +2 em Destreza e Agilidade, e +1 em Éter.' },
      { conteudo: 'Enquanto está em um campo de batalha conhecido de forma abrangente, recebe +2 bônus em todos os dados de combate.' },
      { conteudo: 'Inicia com a habilidade: Pontaria.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Gigantes recebem +3 em Força, +3 em Vigor e -1 em Agilidade devido ao seu porte imenso.' },
      { conteudo: 'Constituição colossal com alta resistência a impactos físicos.' },
      { conteudo: 'Inicia com a habilidade: Refletir.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Arte de Humano: ganham +1 em todos os status exceto Éter e Intelecto (+5 Intelecto, -4 em Éter).' },
      { conteudo: 'Adaptabilidade: Recebe +3 em testes de aprendizagem.' },
      { conteudo: 'Inicia com a habilidade: Genialidade.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Goblins recebem +3 em Agilidade, +3 em Destreza e -1 em Intelecto.' },
      { conteudo: 'No escuro se camufla completamente após ficar 1 turno sem atacar.' },
      { conteudo: 'Iniciam com a habilidade: Furto.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Prisioneiros recebem +3 em Vigor e Éter, +1 em Destreza e -1 em Intelecto.' },
      { conteudo: 'Penalidade mental: o máximo de sanidade que se pode ter é limitado a 80.' },
      { conteudo: 'Iniciam com a habilidade: Determinação.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Tritões ganham +3 em Destreza, +2 em Éter, +1 em Agilidade e -1 em Força.' },
      { conteudo: 'Fisiologia anfíbia: Ganha 2 membros extras funcionais.' },
      { conteudo: 'Inicia com a habilidade: Flexível como a água.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Arte de Demônio: Demônios recebem +2 em todos os atributos base.' },
      { conteudo: 'Fraqueza sacra: Demônios recebem 1.4x de dano adicional de dano Luz ou Divino.' },
      { conteudo: 'Iniciam com a habilidade: Corromper.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Vampiros ganham +2 em Vigor, Éter, Força e Agilidade, e -3 em Destreza.' },
      { conteudo: 'Sede de Sangue: Toda vez que consumir sangue se cura em 6 de HP.' },
      { conteudo: 'Inicia com a habilidade: Hemocinese.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Hollows recebem a capacidade de aprender qualquer tipo de magia ou habilidade e ganham +1 em todos os status.' },
      { conteudo: 'Fragilidade mortal: Caso você chegue a 0 de HP, você morre definitivamente sem agonia.' },
      { conteudo: 'Inicia com a habilidade: Devorar.' },
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
    isSubraca: false,
    topicos: [
      { conteudo: 'Alquimistas ganham +3 em Força e Éter, +2 em Vigor, e -1 em todos os outros atributos.' },
      { conteudo: 'Marca do sacrifício: Possui uma cicatriz em qualquer parte do corpo (obrigatório).' },
      { conteudo: 'Inicia com a habilidade: Transmutação.' },
      {
        titulo: 'Transmutação (Skill ativa):',
        conteudo: [
          'Role um dado de conhecimento (Intelecto) para aprender um tipo novo de matéria, minério ou elemento. Após aprender, pode criar armas ou replicar o minério à custa de seu próprio HP.',
          'Custo de ativação: Conforme o minério ou elemento utilizado.',
        ],
      },
    ],
  },

  // ─── SUB-RAÇAS PRIVILEGIADAS (Exigem Rolagem de d20) ───────────────────
  'Clérigo': {
    nome: 'Clérigo',
    imagem: 'https://mouneteria.netlify.app/img/a-clerigo.webp',
    statusLinha: '+3 FORÇA   +3 ÉTER   +3 VIGOR   -3 AGILIDADE',
    habilidadeResumo: 'CONCEDA-ME FORÇA',
    isSubraca: true,
    dadoMinimo: 8,
    topicos: [
      { conteudo: 'Requisito de d20: 08 ou superior.' },
      { conteudo: 'Clérigos ganham +3 em Éter, Vigor e Força, e -3 em Agilidade.' },
      { conteudo: 'Bênção Divina: Clérigos podem escolher uma divindade e uma bênção sagrada.' },
      { conteudo: 'Inicia com a habilidade: Conceda-me força.' },
      {
        titulo: 'Conceda-me força (Skill ativa):',
        conteudo: [
          'Cria um escudo mágico envolta de você e de seus aliados (10 de shield + seus pontos de Vigor).',
          'Custo: 10 de mana por pessoa · Fôlego: 1 · Skill ativa.',
        ],
      },
    ],
  },

  'Meio demônio': {
    nome: 'Meio demônio',
    imagem: 'https://mouneteria.netlify.app/img/a-meiodemonio.webp',
    statusLinha: '+4 FORÇA   +2 ÉTER   +2 VIGOR   -2 INTELECTO',
    habilidadeResumo: 'SE IMPOR',
    isSubraca: true,
    dadoMinimo: 10,
    topicos: [
      { conteudo: 'Requisito de d20: 10 ou superior.' },
      { conteudo: 'Meio demônios ganham +4 em Força, +2 em Vigor e Éter, e -2 em Intelecto.' },
      { conteudo: 'Resistência arcana: Dano arcano não causa dano adicional nessa raça.' },
      { conteudo: 'Inicia com a habilidade: Se impor.' },
      {
        titulo: 'Se impor (Skill ativa):',
        conteudo: [
          'Bate o pé no chão liberando sua presença demoníaca e aplicando "Medo" em área. Inimigos sob medo causam 20 pontos a menos de dano em você durante 2 turnos.',
          'Custo: 20 de mana · Fôlego: 1 · Skill ativa.',
        ],
      },
    ],
  },

  'Fada': {
    nome: 'Fada',
    imagem: 'https://mouneteria.netlify.app/img/a-fada.webp',
    statusLinha: '+6 ÉTER   +6 INTELECTO   -7 FORÇA',
    habilidadeResumo: 'ZEN',
    isSubraca: true,
    dadoMinimo: 10,
    topicos: [
      { conteudo: 'Requisito de d20: 10 ou superior.' },
      { conteudo: 'Fadas ganham +6 em Intelecto e Éter, e -7 em Força.' },
      { conteudo: 'Estatura diminuta: Tamanho máximo de uma fada é de 30 cm.' },
      { conteudo: 'Inicia com a habilidade: Zen.' },
      {
        titulo: 'Zen (Skill passiva):',
        conteudo: ['Fadas recuperam 5 pontos de mana passivamente em seu turno.'],
      },
    ],
  },

  'Ghost walker': {
    nome: 'Ghost walker',
    imagem: 'https://mouneteria.netlify.app/img/a-ghostwalker.webp',
    statusLinha: '+4 FORÇA   +3 ÉTER   +2 VIGOR   -3 DESTREZA',
    habilidadeResumo: 'DASH SOMBRIO',
    isSubraca: true,
    dadoMinimo: 11,
    topicos: [
      { conteudo: 'Requisito de d20: 11 ou superior.' },
      { conteudo: 'Ganham +4 em Força, +3 em Éter, +2 em Vigor, e -3 em Destreza.' },
      { conteudo: 'Afinidade espectral: Apto a magias e encantamentos do tipo "Morte".' },
      { conteudo: 'Inicia com a habilidade: Dash sombrio.' },
      {
        titulo: 'Dash sombrio (Skill ativa):',
        conteudo: [
          'Você pode se teletransportar instantaneamente para qualquer sombra em um raio de 35 metros.',
          'Custo: 16 de mana · Fôlego: 1 · CD: 2 turnos de recarga · Skill ativa.',
        ],
      },
    ],
  },

  'Meio Vampiro': {
    nome: 'Meio Vampiro',
    imagem: 'https://mouneteria.netlify.app/img/a-meiovampiro.webp',
    statusLinha: '+3 FORÇA   +3 ÉTER   +2 INTELECTO   -2 DESTREZA',
    habilidadeResumo: 'DISPARO',
    isSubraca: true,
    dadoMinimo: 12,
    topicos: [
      { conteudo: 'Requisito de d20: 12 ou superior.' },
      { conteudo: 'Meio vampiro ganha +3 de Força, +3 de Éter, +2 Intelecto e -2 de Destreza.' },
      { conteudo: 'Zero necessidade de beber sangue; em contrapartida, não se cura ao consumir sangue.' },
      { conteudo: 'Inicia com a habilidade: Disparo.' },
      {
        titulo: 'Disparo (Skill ativa):',
        conteudo: [
          'Ao juntar as mãos cria sangue mágico disparando projéteis extremamente rápidos de sangue pelos dedos. Ao acertar 3 vezes, causa hemorragia leve no inimigo (10 base + dano mágico; hemorragia: 30 de dano verdadeiro).',
          'Custo: 16 de mana · Fôlego: 1 · Skill ativa.',
        ],
      },
    ],
  },

  'Orc humano': {
    nome: 'Orc humano',
    imagem: 'https://mouneteria.netlify.app/img/a-orchumano.webp',
    statusLinha: '+4 FORÇA   +4 VIGOR   +2 AGILIDADE   -2 ÉTER   -2 INTELECTO',
    habilidadeResumo: 'BRUTALIDADE',
    isSubraca: true,
    dadoMinimo: 12,
    topicos: [
      { conteudo: 'Requisito de d20: 12 ou superior.' },
      { conteudo: 'Orcs Humanos ganham +4 em Força e Vigor, +2 em Agilidade, e -2 em Éter e Intelecto.' },
      { conteudo: 'Resistência mista: Começa com 10 de redução de dano físico base.' },
      { conteudo: 'Inicia com a habilidade: Brutalidade.' },
      {
        titulo: 'Brutalidade (Skill passiva ativa):',
        conteudo: [
          'A cada turno em batalha, ganha +1 bônus em todos seus dados de combate (até o máximo de 3).',
          'Custo por turno: 5 de HP · Fôlego: 0 · Skill passiva ativa.',
        ],
      },
    ],
  },

  'Costurado': {
    nome: 'Costurado',
    imagem: 'https://mouneteria.netlify.app/img/a-costurado.webp',
    statusLinha: '+3 DESTREZA   +3 AGILIDADE   +1 ÉTER   -1 VIGOR',
    habilidadeResumo: 'SEM MAIS DOR',
    isSubraca: true,
    dadoMinimo: 12,
    topicos: [
      { conteudo: 'Requisito de d20: 12 ou superior.' },
      { conteudo: 'Ganham +3 de Agilidade e Destreza, +1 em Éter e -1 em Vigor.' },
      { conteudo: 'Carrega deformações ou cicatrizes marcadas pelo corpo (obrigatório).' },
      { conteudo: 'Iniciam com a habilidade: Sem mais dor.' },
      {
        titulo: 'Sem mais dor (Skill passiva):',
        conteudo: [
          'Ao chegar em 2/4 de HP, recebe um escudo equivalente a 1/4 da sua vida máxima que dura até ser destruído.',
          'Fôlego: 0 · Skill passiva.',
        ],
      },
    ],
  },

  'Gigante combatente': {
    nome: 'Gigante combatente',
    imagem: 'https://mouneteria.netlify.app/img/a-gigantecombatente.webp',
    statusLinha: '+4 VIGOR   +3 DESTREZA   +3 ÉTER   -4 INTELECTO',
    habilidadeResumo: 'REPELIR',
    isSubraca: true,
    dadoMinimo: 12,
    topicos: [
      { conteudo: 'Requisito de d20: 12 ou superior.' },
      { conteudo: 'Gigantes combatentes ganham +4 em Vigor, +3 em Destreza e Éter, e -4 em Intelecto.' },
      { conteudo: 'Núcleo vital alternativo: Imune a dano Verdadeiro e recebe metade do dano de projéteis pontiagudos.' },
      { conteudo: 'Iniciam com a habilidade: Repelir.' },
      {
        titulo: 'Repelir (Skill ativa):',
        conteudo: [
          'Seu corpo cria espinhos temporários: 1/4 do dano corpo a corpo sofrido se volta contra o atacante.',
          'Skill ativa.',
        ],
      },
    ],
  },

  'Humano mágico': {
    nome: 'Humano mágico',
    imagem: 'https://mouneteria.netlify.app/img/a-humanomagico.webp',
    statusLinha: '+3 INTELECTO   +3 ÉTER   +3 VIGOR   -1 FORÇA   -1 DESTREZA   -1 AGILIDADE',
    habilidadeResumo: 'CRIATIVIDADE',
    isSubraca: true,
    dadoMinimo: 13,
    topicos: [
      { conteudo: 'Requisito de d20: 13 ou superior.' },
      { conteudo: 'Humanos Mágicos ganham +3 em Intelecto, Éter e Vigor, e -1 em Força, Destreza e Agilidade.' },
      { conteudo: 'Resistência Arcana: Anula 7 de dano mágico base a cada 15 níveis.' },
      { conteudo: 'Inicia com a habilidade: Criatividade.' },
      {
        titulo: 'Criatividade (Skill ativa):',
        conteudo: [
          'Sacrifica 20 pontos de mana para ter sucesso garantido nos próximos 2 dados de Intelecto/Estratégia, e ganha +5 de bônus em aprendizagem.',
          'Fôlego: 0 · Skill ativa.',
        ],
      },
    ],
  },

  'Kitsune': {
    nome: 'Kitsune',
    imagem: 'https://mouneteria.netlify.app/img/a-kitsune.webp',
    statusLinha: '+7 ÉTER   +7 INTELECTO   +1 VIGOR   -3 FORÇA   -3 DESTREZA   -3 AGILIDADE',
    habilidadeResumo: 'ENTRE A MORTE HÁ ESPERANÇA',
    isSubraca: true,
    dadoMinimo: 16,
    topicos: [
      { conteudo: 'Requisito de d20: 16 ou superior (Linhagem Mística).' },
      { conteudo: 'Kitsunes ganham +7 em Éter e Intelecto, +1 em Vigor, e -3 em Força, Destreza e Agilidade.' },
      { conteudo: 'Fluxo Espiritual: Regenera mana 1.3x mais rápido.' },
      { conteudo: 'Inicia com a habilidade: Entre a morte há esperança.' },
      {
        titulo: 'Entre a morte há esperança (Skill passiva):',
        conteudo: [
          'Toda vez que vê algo morto (até 48h), pode estudar suas propriedades espirituais e rolar aprendizagem para absorver conhecimentos do que já se foi.',
          'Skill passiva.',
        ],
      },
    ],
  },

  'Meio besta': {
    nome: 'Meio besta',
    imagem: 'https://mouneteria.netlify.app/img/a-meiobesta.webp',
    statusLinha: '+4 FORÇA   +3 AGILIDADE   +3 VIGOR   -4 DESTREZA   -4 INTELECTO',
    habilidadeResumo: 'FERAL',
    isSubraca: true,
    dadoMinimo: 16,
    topicos: [
      { conteudo: 'Requisito de d20: 16 ou superior (Linhagem Feral).' },
      { conteudo: 'Monstros ganham +4 em Força, +3 em Agilidade e Vigor, e -4 em Intelecto e Destreza.' },
      { conteudo: 'Fisiologia Customizada: Escolha entre traços de Mamíferos, Répteis ou Insectoides.' },
      {
        titulo: 'Instinto Predatório:',
        conteudo: ['Sentidos aguçados e força descomunal para perseguição e emboscada.'],
      },
    ],
  },
};

export function PassoRaca({ draft, setDado, sistema }: PassoRacaProps) {
  const [hoveredRaca, setHoveredRaca] = useState<string | null>(null);
  const [racaDetalhada, setRacaDetalhada] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'base' | 'subraca'>('todas');
  const [girandoDado, setGirandoDado] = useState(false);

  const campos = camposDe(sistema);
  const campoRaca = campos.find((c) => c.id === 'raca' && c.tipo === 'selecao');
  const nomeDoCampo = Object.fromEntries(campos.map((c) => [c.id, c.label]));

  const racaSelecionada = (typeof draft.dados['raca'] === 'string'
    ? draft.dados['raca']
    : '') as string;

  // Valor rolado do d20 recuperado do draft
  const dadoRolado = typeof draft.dados['d20_raca'] === 'string' && draft.dados['d20_raca'] !== ''
    ? Number(draft.dados['d20_raca'])
    : null;

  const opcoes = campoRaca?.opcoes || Object.keys(RACAS_DETALHADAS);

  // Função para girar o d20 com animação e efeito sonoro
  const rolarD20 = () => {
    if (girandoDado) return;
    setGirandoDado(true);
    sfx('hover');

    let iter = 0;
    const interval = setInterval(() => {
      iter++;
      const randomVal = Math.floor(Math.random() * 20) + 1;
      setDado('d20_raca', String(randomVal));

      if (iter >= 14) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 20) + 1;
        setDado('d20_raca', String(finalVal));
        setGirandoDado(false);
        sfx('confirm');
      }
    }, 55);
  };

  const selecionarRaca = (raca: string) => {
    const data = RACAS_DETALHADAS[raca];
    // Se for sub-raça e não cumpriu o requisito de d20, não permite selecionar
    if (data?.isSubraca && data.dadoMinimo) {
      if (dadoRolado === null) {
        alert(`Para escolher a sub-raça ${raca}, você precisa girar o d20 no topo primeiro!`);
        return;
      }
      if (dadoRolado < data.dadoMinimo) {
        alert(
          `A sub-raça ${raca} exige tirar no mínimo ${data.dadoMinimo} no d20. Você tirou ${dadoRolado}!`
        );
        return;
      }
    }

    sfx('confirm');
    setDado('raca', raca);
  };

  // Filtragem de raças
  const opcoesFiltradas = opcoes.filter((op) => {
    const info = RACAS_DETALHADAS[op];
    if (filtroTipo === 'base') return !info?.isSubraca;
    if (filtroTipo === 'subraca') return !!info?.isSubraca;
    return true;
  });

  // Se o usuário clicou em "Ver detalhes", renderiza a Tela de Apresentação Cinematográfica Completa
  if (racaDetalhada) {
    const data = RACAS_DETALHADAS[racaDetalhada] || {
      nome: racaDetalhada,
      imagem: '',
      statusLinha: '',
      topicos: [],
      habilidadeResumo: '',
      isSubraca: false,
    };
    const isSelected = racaSelecionada === racaDetalhada;
    const desbloqueada =
      !data.isSubraca ||
      (typeof data.dadoMinimo === 'number' && dadoRolado !== null && dadoRolado >= data.dadoMinimo);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

          {data.isSubraca && (
            <span
              className="ed-sys"
              style={{
                fontSize: '12.5px',
                padding: '4px 12px',
                borderColor: desbloqueada ? '#7fd8a6' : 'rgba(255, 157, 157, 0.5)',
                color: desbloqueada ? '#7fd8a6' : '#fca5a5',
              }}
            >
              🎲 Exige d20 ≥ {data.dadoMinimo} {dadoRolado !== null && `(Seu dado: ${dadoRolado})`}
            </span>
          )}
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
              {data.isSubraca ? 'Sub-raça Privilegiada' : 'Raça'}
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

            {/* Linha de Status em destaque */}
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

          {/* Lado Direito: Retrato Vertical */}
          {data.imagem && (
            <div
              style={{
                width: 'clamp(240px, 28vw, 340px)',
                height: 'clamp(330px, 38vw, 460px)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: data.isSubraca
                  ? '2px solid rgba(216, 180, 106, 0.55)'
                  : '2px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.85), 0 0 35px rgba(216, 180, 106, 0.2)',
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
          {/* Cantoneiras */}
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
            disabled={!desbloqueada}
            style={{
              padding: '12px 34px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '8px',
              opacity: desbloqueada ? 1 : 0.45,
            }}
            onClick={() => {
              selecionarRaca(racaDetalhada);
              setRacaDetalhada(null);
            }}
          >
            {!desbloqueada
              ? `Bloqueada (Tire no mínimo ${data.dadoMinimo} no d20)`
              : isSelected
              ? '✓ Raça já selecionada'
              : 'Selecionar ' + racaDetalhada}
          </button>
        </div>
      </div>
    );
  }

  // Visualização normal: Lista de Cards com Rolagem de d20
  return (
    <div className="wiz-step-wrap">
      <div className="sys-wrap" style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Cabeçalho Destacado "RAÇAS" */}
        <div
          style={{
            marginBottom: '20px',
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
              RAÇAS & SUB-RAÇAS
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
              {opcoes.length} linhagens no total
            </span>
          </div>

          <p
            className="sys-lead"
            style={{
              margin: '8px 0 16px',
              fontSize: '14.5px',
              color: '#b9bfd4',
              maxWidth: '82ch',
              lineHeight: 1.55,
            }}
          >
            Escolha a ancestralidade do seu personagem. Sub-raças são linhagens privilegiadas que exigem sorte:
            role o <strong>d20</strong> para desbloquear sub-raças cujo requisito seja menor ou igual ao seu resultado.
          </p>

          {/* PAINEL DE CONTROLE DE ROLAGEM DO D20 DE SUB-RAÇA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'rgba(10, 14, 28, 0.75)',
              border: '1px solid rgba(216, 180, 106, 0.25)',
              marginTop: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn primary"
                disabled={girandoDado}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  boxShadow: '0 0 14px rgba(216,180,106,0.3)',
                }}
                onClick={rolarD20}
              >
                <span style={{ fontSize: '18px' }}>🎲</span>
                {girandoDado ? 'Rolando d20...' : dadoRolado ? 'Rolar d20 novamente' : 'Girar d20 para Sub-raças'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', color: 'var(--text-dim)' }}>Resultado atual:</span>
                <span
                  style={{
                    fontFamily: 'var(--f-hsr-c)',
                    fontSize: '26px',
                    fontWeight: 700,
                    color: dadoRolado ? 'var(--gold)' : '#71717a',
                    padding: '2px 12px',
                    borderRadius: '6px',
                    background: 'rgba(216, 180, 106, 0.08)',
                    border: '1px solid rgba(216, 180, 106, 0.3)',
                    minWidth: '40px',
                    textAlign: 'center',
                  }}
                >
                  {dadoRolado !== null ? dadoRolado : '-'}
                </span>

                {dadoRolado !== null && (
                  <span style={{ fontSize: '13px', color: '#7fd8a6', marginLeft: '6px' }}>
                    ✓ Sub-raças com requisito até <strong>{dadoRolado}</strong> estão liberadas!
                  </span>
                )}
              </div>
            </div>

            {/* Filtros em Abas */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${filtroTipo === 'todas' ? 'primary' : 'subtle'}`}
                style={{ fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}
                onClick={() => setFiltroTipo('todas')}
              >
                Todas ({opcoes.length})
              </button>
              <button
                type="button"
                className={`btn ${filtroTipo === 'base' ? 'primary' : 'subtle'}`}
                style={{ fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}
                onClick={() => setFiltroTipo('base')}
              >
                Raças Base (11)
              </button>
              <button
                type="button"
                className={`btn ${filtroTipo === 'subraca' ? 'primary' : 'subtle'}`}
                style={{ fontSize: '12.5px', padding: '6px 12px', borderRadius: '6px' }}
                onClick={() => setFiltroTipo('subraca')}
              >
                Sub-raças (11)
              </button>
            </div>
          </div>
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
          {opcoesFiltradas.map((opcao) => {
            const isSelected = racaSelecionada === opcao;
            const isHovered = hoveredRaca === opcao;
            const data = RACAS_DETALHADAS[opcao];
            const efeitos = campoRaca?.efeitos?.[opcao] || [];

            const isSub = !!data?.isSubraca;
            const bloqueada =
              isSub && (typeof data.dadoMinimo === 'number') && (dadoRolado === null || dadoRolado < data.dadoMinimo);

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
                    : bloqueada
                    ? '1px solid rgba(244, 63, 94, 0.25)'
                    : isSub
                    ? '1px solid rgba(216, 180, 106, 0.35)'
                    : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: isSelected
                    ? '0 0 20px rgba(216,180,106,0.35), inset 0 0 12px rgba(216,180,106,0.12)'
                    : '0 4px 14px rgba(0,0,0,0.4)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'none',
                  opacity: bloqueada && !isHovered ? 0.72 : 1,
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
                        filter: bloqueada ? 'grayscale(35%)' : 'none',
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

                  {/* Badges no topo do Card */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isSub ? (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: bloqueada ? 'rgba(239, 68, 68, 0.85)' : 'rgba(216, 180, 106, 0.9)',
                          color: '#080a14',
                          backdropFilter: 'blur(4px)',
                        }}
                      >
                        {bloqueada ? `🔒 Exige d20 ≥ ${data.dadoMinimo}` : `🎲 d20 ≥ ${data.dadoMinimo}`}
                      </span>
                    ) : <span />}

                    {isSelected && (
                      <span
                        className="ed-sys"
                        style={{
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
                </div>

                {/* 2. Informações na base do Card */}
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
                        color: isSub ? '#fbbf24' : '#93c5fd',
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
                      background: 'rgba(4, 5, 14, 0.88)',
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
                    {bloqueada && (
                      <span style={{ fontSize: '12px', color: '#fca5a5', textAlign: 'center', fontWeight: 500 }}>
                        {dadoRolado === null ? 'Gire o d20 no topo!' : `Tirou ${dadoRolado} (Precisa de ${data.dadoMinimo})`}
                      </span>
                    )}

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
                      disabled={bloqueada}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textAlign: 'center',
                        opacity: bloqueada ? 0.4 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selecionarRaca(opcao);
                      }}
                    >
                      {bloqueada ? '🔒 Bloqueada' : isSelected ? '✓ Selecionada' : 'Selecionar'}
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
