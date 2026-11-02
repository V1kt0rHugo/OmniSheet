import { SecaoDef } from '../sistemas.types';

/** Seis atributos clássicos com valor 10, usados como "modelo sugerido" em campos de atributos. */
export const MODELO_D20 = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map((n) => ({ n, v: '10' }));

/** Seção de textos longos de personagem. O id da seção precisa ser único dentro do sistema. */
export const secaoHistoria = (id = 'historia'): SecaoDef => ({
  id,
  titulo: 'História',
  campos: [
    { id: 'aparencia', label: 'Aparência', tipo: 'textarea', largura: 'cheia', destaque: false },
    { id: 'personalidade', label: 'Personalidade', tipo: 'textarea', largura: 'cheia', destaque: false },
    { id: 'historia', label: 'História', tipo: 'textarea', largura: 'cheia', destaque: false },
  ],
});
