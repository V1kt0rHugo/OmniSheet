import { DefinicaoSistema } from '../sistemas.types';
import { MODELO_D20, secaoHistoria } from './comum';

export const livre: DefinicaoSistema = {
  id: 'livre',
  nome: 'Livre',
  descricao: 'Modelo genérico: classe, ancestralidade, nível, atributos e história. Serve para qualquer RPG.',
  secoes: [
    {
      id: 'perfil',
      titulo: 'Perfil',
      campos: [
        { id: 'classe', label: 'Classe ou papel', tipo: 'texto', largura: 'terco', destaque: true },
        { id: 'ancestralidade', label: 'Ancestralidade', tipo: 'texto', largura: 'terco', destaque: true },
        { id: 'nivel', label: 'Nível', tipo: 'texto', largura: 'terco', destaque: true },
      ],
    },
    {
      id: 'atributos',
      titulo: 'Atributos',
      campos: [{ id: 'atributos', label: 'Atributos', tipo: 'atributos', largura: 'cheia', destaque: false, modelo: MODELO_D20 }],
    },
    secaoHistoria(),
  ],
};
