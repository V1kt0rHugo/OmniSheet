import { createContext, useContext, type ReactNode } from 'react';
import type { Ficha, Sistema } from '../types';

export type ScreenId = 'title' | 'menu' | 'hall' | 'systems' | 'editor' | 'sheet';
export type MenuPhase = 'off' | 'lit' | 'risen';
export type Origem = 'hall' | 'menu';
export interface ShowOpts { instant?: boolean; assemble?: boolean }
export interface EditorOpts { from?: Origem | 'sheet'; instant?: boolean; sistemaId?: string }
export interface ConfirmOpts { title: string; text: string; ok?: string; danger?: boolean }

export interface AppApi {
  fichas: Ficha[];
  sistemas: Sistema[];
  sistemaPorId: (id: string) => Sistema | undefined;
  screen: ScreenId;
  instant: boolean;
  assembleToken: number;
  menuPhase: MenuPhase;
  setMenuPhase: (p: MenuPhase) => void;
  show: (id: ScreenId, o?: ShowOpts) => void;
  /** Abre o editor. Ficha nova exige `sistemaId`; ficha existente usa o sistema dela. */
  openEditor: (f: Ficha | null, o?: EditorOpts) => void;
  openSheet: (id: string, o?: { instant?: boolean }) => void;
  /** Primeira etapa de criar uma ficha: escolher o sistema. */
  openSystemPicker: (o?: { from?: Origem; instant?: boolean }) => void;
  enterMenu: () => Promise<void>;
  setBlackout: (on: boolean) => void;
  toast: (msg: string) => void;
  openModal: (node: ReactNode, onCancel?: () => void) => void;
  closeModal: () => void;
  isModalOpen: () => boolean;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
}

export const AppContext = createContext<AppApi | null>(null);

export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp fora do AppContext');
  return c;
}

export const screenCls = (active: boolean, instant: boolean) =>
  'screen' + (active ? ' active' : '') + (instant ? ' instant' : '');
