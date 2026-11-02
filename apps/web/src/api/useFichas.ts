import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fichasApi } from './fichas';
import { sistemasApi } from './sistemas';
import type { Ficha, FichaInput, Sistema } from '../types';

const FICHAS = ['fichas'];
const SISTEMAS = ['sistemas'];
const EMPTY_FICHAS: Ficha[] = [];
const EMPTY_SISTEMAS: Sistema[] = [];

export function useFichasQuery() {
  const q = useQuery({ queryKey: FICHAS, queryFn: fichasApi.list });
  return { fichas: q.data ?? EMPTY_FICHAS, loading: q.isLoading, error: q.error as Error | null };
}

export function useSistemasQuery() {
  const q = useQuery({ queryKey: SISTEMAS, queryFn: sistemasApi.list });
  return { sistemas: q.data ?? EMPTY_SISTEMAS, loading: q.isLoading, error: q.error as Error | null };
}

/** As mutações só resolvem depois da lista ser recarregada, então quem chama já vê o estado novo. */
export function useFichaMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: FICHAS });
  return {
    create: useMutation({ mutationFn: (d: FichaInput) => fichasApi.create(d), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, data }: { id: string; data: FichaInput }) => fichasApi.update(id, data), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => fichasApi.remove(id), onSuccess: refresh }),
    createMany: useMutation({ mutationFn: (d: FichaInput[]) => fichasApi.createMany(d), onSuccess: refresh }),
    removeMany: useMutation({ mutationFn: (onlyDemo: boolean) => fichasApi.removeMany(onlyDemo), onSuccess: refresh }),
  };
}
