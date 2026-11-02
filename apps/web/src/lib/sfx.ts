import { useSyncExternalStore } from 'react';

const SRC = {
  start: '/sfx/title-start.mp3',
  menuIn: '/sfx/menu-in.mp3',
  hover: '/sfx/hover.mp3',
  confirm: '/sfx/confirm.mp3',
  cancel: '/sfx/cancel.mp3',
  trans: '/sfx/transition.mp3',
  shardHover: '/sfx/shard-hover.mp3',
  glass: '/sfx/glass-break.mp3',
} as const;
export type SfxName = keyof typeof SRC;

const VOL: Record<SfxName, number> = { start: .8, menuIn: .55, hover: .4, confirm: .7, cancel: .7, trans: .75, shardHover: .5, glass: 1 };

let muted = false;
const subs = new Set<() => void>();

export function sfx(name: SfxName) {
  if (muted) return;
  try {
    const a = new Audio(SRC[name]);
    a.volume = VOL[name];
    a.play().catch(() => {});
  } catch { /* sem áudio */ }
}

export function toggleMute() {
  muted = !muted;
  subs.forEach((f) => f());
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb); }; },
    () => muted,
  );
}
