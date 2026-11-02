import { DefinicaoSistema } from '../sistemas.types';
import { MODELO_D20, secaoHistoria } from './comum';

export const dnd5e: DefinicaoSistema = {
  id: 'dnd5e',
  nome: 'D&D 5e',
  descricao: 'Dungeons & Dragons, quinta edição: classe, raça, antecedente, tendência, combate e atributos.',
  secoes: [
    {
      id: 'perfil',
      titulo: 'Perfil',
      campos: [
        {
          id: 'classe', label: 'Classe', tipo: 'selecao', largura: 'meia', destaque: true,
          opcoes: ['Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 'Feiticeiro', 'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Patrulheiro'],
        },
        { id: 'raca', label: 'Raça', tipo: 'texto', largura: 'meia', destaque: true },
        { id: 'nivel', label: 'Nível', tipo: 'numero', largura: 'terco', destaque: true },
        { id: 'antecedente', label: 'Antecedente', tipo: 'texto', largura: 'terco', destaque: false },
        {
          id: 'tendencia', label: 'Tendência', tipo: 'selecao', largura: 'terco', destaque: false,
          opcoes: ['Leal e Bom', 'Neutro e Bom', 'Caótico e Bom', 'Leal e Neutro', 'Neutro', 'Caótico e Neutro', 'Leal e Mau', 'Neutro e Mau', 'Caótico e Mau'],
        },
      ],
    },
    {
      id: 'combate',
      titulo: 'Combate',
      campos: [
        { id: 'ca', label: 'Classe de Armadura', tipo: 'numero', largura: 'terco', destaque: false },
        { id: 'pv', label: 'Pontos de Vida', tipo: 'numero', largura: 'terco', destaque: false },
        { id: 'deslocamento', label: 'Deslocamento', tipo: 'texto', largura: 'terco', destaque: false, dica: 'Ex.: 9 m' },
      ],
    },
    {
      id: 'atributos',
      titulo: 'Atributos',
      campos: [{ id: 'atributos', label: 'Atributos', tipo: 'atributos', largura: 'cheia', destaque: false, modelo: MODELO_D20 }],
    },
    {
      id: 'equipamento',
      titulo: 'Perícias e equipamento',
      campos: [
        { id: 'pericias', label: 'Perícias e proficiências', tipo: 'textarea', largura: 'cheia', destaque: false },
        { id: 'equipamento', label: 'Equipamento', tipo: 'textarea', largura: 'cheia', destaque: false },
      ],
    },
    secaoHistoria(),
  ],
};
