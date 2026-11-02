/**
 * Fórmulas são digitadas e exibidas por NOME (`[Força] * 5`) e guardadas por ID (`[forca] * 5`).
 * Assim, renomear um campo nunca quebra uma fórmula.
 */
export interface Ref { id: string; label: string }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** `[forca]` → `[Força]`. Também converte ids soltos de sistemas antigos (`vigor * 5` → `[Vigor] * 5`). */
export function idsParaNomes(src: string, campos: Ref[]): string {
  const porId = new Map(campos.map((c) => [c.id, c.label]));
  return src.replace(
    /\[([^\]]*)\]|(?<![a-z0-9_.])(\d*d\d+(?:k[hl]\d+)?)(?![a-z0-9_])|([a-z_][a-z0-9_.]*)/gi,
    (todo, dentro: string | undefined, dado: string | undefined, solto: string | undefined, pos: number) => {
      if (dado) return todo;
      if (dentro !== undefined) { const nome = porId.get(dentro.trim().toLowerCase()); return nome ? `[${nome}]` : todo; }
      if (solto) {
        if (src.slice(pos + solto.length).trimStart().startsWith('(')) return todo; // função
        const nome = porId.get(solto.toLowerCase().replace(/^atributos\./, ''));
        return nome ? `[${nome}]` : todo;
      }
      return todo;
    },
  );
}
