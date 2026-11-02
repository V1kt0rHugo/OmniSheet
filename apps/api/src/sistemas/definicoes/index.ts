import { DefinicaoSistema } from '../sistemas.types';
import { validateSecoes } from '../sistemas.validation';
import { dnd5e } from './dnd5e';
import { livre } from './livre';
import { mouneteria } from './mouneteria';

/**
 * TODOS OS SISTEMAS DO SITE. Para adicionar um, crie um arquivo nesta pasta (copie `livre.ts` ou veja
 * `docs/adicionando-sistemas.md`) e coloque-o na lista abaixo. Ao reiniciar a API ele aparece na escolha
 * de sistema; se algo estiver errado, a API não sobe e diz qual campo corrigir.
 *
 * A ordem da lista é a ordem da tela de escolha.
 */
export const SISTEMAS: DefinicaoSistema[] = [
  livre,
  dnd5e,
  mouneteria,
];

/** Confere as definições: ids únicos, tipos, fórmulas, referências entre campos e ciclos. Lança erro com o sistema e o motivo. */
export function validarDefinicoes(lista: DefinicaoSistema[]) {
  const ids = new Set<string>();
  for (const s of lista) {
    if (!/^[a-z0-9_-]{1,40}$/.test(s.id)) throw new Error(`Sistema "${s.nome}": id inválido "${s.id}" (use letras minúsculas, números, - e _).`);
    if (ids.has(s.id)) throw new Error(`Sistema "${s.nome}": o id "${s.id}" já é usado por outro sistema.`);
    ids.add(s.id);
    if (!s.nome.trim()) throw new Error(`Sistema "${s.id}": falta o nome.`);
    try {
      validateSecoes(s.secoes);
    } catch (e) {
      throw new Error(`Sistema "${s.nome}" (${s.id}) inválido: ${(e as { message?: string }).message ?? e}`);
    }
  }
}
