/**
 * Estado mutável do Hall, compartilhado com quem precisa posicionar a espiral antes de abri-la
 * (menu, editor, ficha). Fica fora do React porque muda a cada quadro de animação.
 */
export const H = {
  t: 0,           // posição atual na espiral (animada)
  target: 0,      // posição de destino
  born: null as string | null, // id da ficha recém-criada (anima o fragmento)
  justDragged: false,
  dirty: true,
  w: 0, h: 0, cx: 0, cy: 0, S: 150, R0: 150, a: 25, asp: 1.4,
};
