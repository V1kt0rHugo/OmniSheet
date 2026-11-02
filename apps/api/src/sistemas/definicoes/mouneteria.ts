import { CampoDef, DefinicaoSistema } from '../sistemas.types';
import { secaoHistoria } from './comum';

/**
 * MOUNETERIA: ficha do personagem (criação e referência).
 *
 * Cobre atributos, recursos (Vida, Mana, Fôlego com rastreamento de valor atual), bônus derivados,
 * skills e história. Rolagens de combate, gastos de Fôlego e Mana, reações e inimigos ficam
 * na aba de combate, a ser implementada à parte.
 *
 * Regra dos dados: a cada 5 pontos um atributo ganha +1 de bônus. Os tamanhos dos dados e os
 * valores de dano fixo pertencem à aba de combate.
 */

const atributo = (id: string, label: string): CampoDef =>
  ({ id, label, tipo: 'numero', largura: 'terco', destaque: false, padrao: '0' });

const calc = (id: string, label: string, formula: string, extra: Partial<CampoDef> = {}): CampoDef =>
  ({ id, label, tipo: 'calculado', largura: 'terco', destaque: false, formula, ...extra });

const recurso = (id: string, label: string, formula: string, extra: Partial<CampoDef> = {}): CampoDef =>
  ({ id, label, tipo: 'recurso', largura: 'meia', destaque: true, formula, ...extra });

export const mouneteria: DefinicaoSistema = {
  id: 'mouneteria',
  nome: 'Mouneteria',
  descricao: 'Força, Destreza, Éter, Intelecto, Agilidade e Vigor — recursos rastreados, bônus derivados e skills.',
  secoes: [

    // ── Recursos ─────────────────────────────────────────────────────────────
    {
      id: 'recursos',
      titulo: 'Recursos',
      campos: [
        recurso('vida', 'Vida', '10 * [vigor]', {
          dica: '+10 de Vida por ponto de Vigor.',
        }),
        recurso('mana', 'Mana', '2 * [eter]', {
          dica: '+2 de Mana por ponto de Éter.',
        }),
        recurso('folego', 'Fôlego', '1 + floor([vigor] / 15)', {
          dica: 'Todos começam com 1, +1 a cada 15 pontos de Vigor.',
        }),
      ],
    },

    // ── Raça ─────────────────────────────────────────────────────────────────
    {
      id: 'raca',
      titulo: 'Raça',
      campos: [
        {
          id: 'raca', label: 'Raça', tipo: 'selecao', largura: 'meia', destaque: true,
          opcoes: ['Meio Dragão'],
          dica: 'Escolha a raça do seu personagem. Os bônus são aplicados automaticamente nos atributos.',
          efeitos: {
            'Meio Dragão': [
              { campo: 'forca',    operacao: 'somar', valor:  2 },
              { campo: 'destreza', operacao: 'somar', valor: -1 },
              { campo: 'eter',     operacao: 'somar', valor:  1 },
              { campo: 'agilidade',operacao: 'somar', valor:  1 },
              { campo: 'vigor',    operacao: 'somar', valor:  2 },
              { campo: 'mult_dano_eter', operacao: 'somar', valor: 10 },
            ],
          },
        },
        {
          id: 'mult_dano_eter',
          label: 'Multiplicador de dano Éter (%)',
          tipo: 'numero',
          largura: 'meia',
          destaque: false,
          padrao: '100',
          dica: 'Base 100 = 1.00×. O Meio Dragão recebe +10 (= 1.10×). Usado pela aba de combate.',
        },
      ],
    },

    // ── Atributos ────────────────────────────────────────────────────────────
    {
      id: 'forca',
      titulo: 'Força',
      campos: [
        atributo('forca', 'Força'),
        calc('bonus_forca', 'Bônus (Força)', 'floor([forca] / 5)', {
          prefixo: '+', dica: '+1 de bônus a cada 5 pontos.',
        }),
      ],
    },
    {
      id: 'destreza',
      titulo: 'Destreza',
      campos: [
        atributo('destreza', 'Destreza'),
        calc('bonus_destreza', 'Bônus (Destreza)', 'floor([destreza] / 5)', {
          prefixo: '+', dica: '+1 de bônus a cada 5 pontos (lutar, procurar coisas ou pessoas).',
        }),
      ],
    },
    {
      id: 'eter',
      titulo: 'Éter',
      campos: [
        atributo('eter', 'Éter'),
        calc('bonus_eter', 'Bônus (Éter)', 'floor([eter] / 5)', {
          prefixo: '+', dica: '+1 de bônus a cada 5 pontos (lutar e sentir magia).',
        }),
      ],
    },
    {
      id: 'intelecto',
      titulo: 'Intelecto',
      campos: [
        atributo('intelecto', 'Intelecto'),
        calc('bonus_intelecto', 'Bônus (Intelecto)', 'floor([intelecto] / 5)', {
          prefixo: '+', dica: '+1 de bônus a cada 5 pontos.',
        }),
        calc('reducao_mana', 'Redução de custo de Mana', '[intelecto]', {
          largura: 'meia', dica: '-1 de custo de Mana por ponto de Intelecto, limitado a 50% do custo da skill.',
        }),
        calc('regen_mana', 'Regeneração de Mana por rodada', '2 * floor([intelecto] / 5)', {
          largura: 'meia', prefixo: '+', dica: '+2 de Mana por rodada a cada 5 pontos de Intelecto.',
        }),
      ],
    },
    {
      id: 'agilidade',
      titulo: 'Agilidade',
      campos: [
        atributo('agilidade', 'Agilidade'),
        calc('bonus_agilidade', 'Bônus (Agilidade)', 'floor([agilidade] / 5)', {
          prefixo: '+', dica: '+1 de bônus a cada 5 pontos.',
        }),
        calc('movimento_extra', 'Movimento extra por turno', 'floor([agilidade] / 2)', {
          largura: 'meia', sufixo: ' m', dica: '+1 metro de movimento a cada 2 pontos de Agilidade.',
        }),
      ],
    },
    {
      id: 'vigor',
      titulo: 'Vigor',
      campos: [
        atributo('vigor', 'Vigor'),
        { id: 'defesa_base', label: 'Defesa base', tipo: 'numero', largura: 'terco', destaque: false, padrao: '0',
          dica: 'Sua defesa antes dos bônus de Vigor.' },
        calc('defesa', 'Defesa total', '[defesa_base] + 2 * floor([vigor] / 5)', {
          largura: 'meia', destaque: true, dica: '+2 de defesa a cada 5 pontos de Vigor.',
        }),
      ],
    },

    // ── Skills ───────────────────────────────────────────────────────────────
    {
      id: 'skills',
      titulo: 'Skills ativas',
      campos: [
        {
          id: 'skills', label: 'Skills ativas', tipo: 'habilidades', largura: 'cheia', destaque: false,
          habilidades: {
            nome: 'Skill',
            nome_plural: 'Skills',
            campos: [
              { id: 'nome',         label: 'Nome',            tipo: 'texto' },
              { id: 'custo_mana',   label: 'Custo de Mana',   tipo: 'numero', padrao: '0' },
              { id: 'custo_folego', label: 'Custo de Fôlego', tipo: 'numero', padrao: '1' },
              { id: 'cd',           label: 'CD (turnos)',      tipo: 'numero', padrao: '0' },
              { id: 'descricao',    label: 'Efeito',           tipo: 'textarea' },
            ],
          },
        },
      ],
    },

    // ── Skills de raça ────────────────────────────────────────────────────────
    // Skills que certas raças recebem ao iniciar; o jogador não adiciona nem remove.
    {
      id: 'skills_raca',
      titulo: 'Skills de raça',
      campos: [
        {
          id: 'skills_raca', label: 'Skills de raça', tipo: 'habilidades', largura: 'cheia', destaque: false,
          habilidades: {
            nome: 'Skill de raça',
            nome_plural: 'Skills de raça',
            campos: [
              { id: 'nome',         label: 'Nome',            tipo: 'texto' },
              { id: 'custo_mana',   label: 'Custo de Mana',   tipo: 'numero', padrao: '0' },
              { id: 'custo_folego', label: 'Custo de Fôlego', tipo: 'numero', padrao: '1' },
              { id: 'cd',           label: 'CD (turnos)',      tipo: 'numero', padrao: '0' },
              { id: 'descricao',    label: 'Efeito',           tipo: 'textarea' },
            ],
          },
        },
      ],
    },

    secaoHistoria(),
  ],
};
