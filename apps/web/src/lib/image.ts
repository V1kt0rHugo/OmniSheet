function loadImg(file: File) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); res(im); };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('img')); };
    im.src = u;
  });
}

/** Reduz a imagem para caber no banco: lado maior limitado a `max`, saída como data URI. */
export async function shrink(file: File, max: number, mime: 'image/jpeg' | 'image/webp', q: number) {
  const im = await loadImg(file);
  const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(im.naturalWidth * k));
  c.height = Math.max(1, Math.round(im.naturalHeight * k));
  const x = c.getContext('2d')!;
  if (mime === 'image/jpeg') { x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); }
  x.drawImage(im, 0, 0, c.width, c.height);
  let out = c.toDataURL(mime, q);
  if (mime === 'image/webp' && !out.startsWith('data:image/webp')) out = c.toDataURL('image/png');
  return out;
}
