import type { Sistema } from '../types';
import { request } from './http';

export const sistemasApi = {
  list: () => request<Sistema[]>('/sistemas'),
};
