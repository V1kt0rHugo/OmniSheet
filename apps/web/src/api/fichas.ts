import type { Ficha, FichaInput } from '../types';
import { request } from './http';

export const fichasApi = {
  list: () => request<Ficha[]>('/fichas'),
  create: (data: FichaInput) => request<Ficha>('/fichas', { method: 'POST', body: JSON.stringify(data) }),
  createMany: (data: FichaInput[]) => request<{ count: number }>('/fichas/bulk', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: FichaInput) => request<Ficha>(`/fichas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/fichas/${id}`, { method: 'DELETE' }),
  removeMany: (onlyDemo: boolean) => request<{ count: number }>(`/fichas?demo=${onlyDemo}`, { method: 'DELETE' }),
};
