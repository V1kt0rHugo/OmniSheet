import { useRef } from 'react';
import { useApp } from '../app/AppContext';
import { useFichaMutations } from '../api/useFichas';
import { demoDraft } from '../lib/ficha';
import { camposDe } from '../lib/sistema';
import { clamp, isUuid } from '../lib/util';
import { H } from '../screens/hallState';
import type { Atributo, Dados, FichaInput, Sistema } from '../types';

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const int = (v: unknown, min: number, max: number, def: number) => (typeof v === 'number' && Number.isFinite(v) ? clamp(Math.round(v), min, max) : def);
const atributos = (v: unknown): Atributo[] =>
  Array.isArray(v) ? v.map((a) => ({ n: str(a?.n), v: str(a?.v) })) : [];

/** Campos do formato antigo (antes dos sistemas), que viram dados do sistema "Livre". */
const LEGADO = ['classe', 'ancestralidade', 'nivel', 'aparencia', 'personalidade', 'historia'];

/** Aceita só os campos conhecidos, com tipos seguros. Ids que não são UUID (backups antigos) ganham um novo. */
function toInput(raw: Record<string, unknown>, sistemas: Sistema[]): FichaInput {
  const item = (raw.item ?? {}) as Record<string, unknown>;
  const sistema = sistemas.find((s) => s.id === raw.sistemaId);
  // sistema desconhecido (ex.: backup de outra instalação) cai no "Livre", guardando o que couber
  const alvo = sistema ?? sistemas.find((s) => s.id === 'livre') ?? sistemas[0];
  const fonte = (sistema && raw.dados && typeof raw.dados === 'object' ? raw.dados : raw) as Record<string, unknown>;
  const dados: Dados = {};
  for (const c of camposDe(alvo)) {
    const v = fonte[c.id] ?? (alvo.id === 'livre' && LEGADO.includes(c.id) ? raw[c.id] : undefined);
    dados[c.id] = c.tipo === 'atributos' ? atributos(v ?? raw.atributos) : str(v);
  }
  return {
    id: isUuid(raw.id) ? (raw.id as string) : undefined,
    sistemaId: alvo.id,
    nome: str(raw.nome), epiteto: str(raw.epiteto), campanha: str(raw.campanha), status: str(raw.status) || 'Ativo', resumo: str(raw.resumo),
    dados,
    item: { nome: str(item.nome), descricao: str(item.descricao), imagem: str(item.imagem) || null, ...(str(item.tipo) ? { tipo: str(item.tipo) } : {}) },
    imagem: str(raw.imagem) || null,
    foco: int(raw.foco, 0, 100, 25), cor: int(raw.cor, 0, 360, 210), demo: raw.demo === true,
  };
}

export function OptionsModal() {
  const { fichas, sistemas, closeModal, confirm, toast } = useApp();
  const { createMany, removeMany } = useFichaMutations();
  const fileRef = useRef<HTMLInputElement>(null);
  const N = fichas.length;
  const demos = fichas.filter((f) => f.demo).length;

  const gen = async () => {
    try {
      await createMany.mutateAsync(Array.from({ length: 40 }, (_, i) => demoDraft(i, sistemas[i % sistemas.length])));
      closeModal(); toast('40 fichas de teste criadas.');
    } catch { toast('Não consegui criar as fichas de teste.'); }
  };

  const clearDemos = async () => {
    try { await removeMany.mutateAsync(true); closeModal(); toast('Fichas de exemplo removidas.'); }
    catch { toast('Não consegui remover as fichas de exemplo.'); }
  };

  const exportBackup = () => {
    const data = fichas.map(({ criadoEm: _c, atualizadoEm: _a, ...f }) => f);
    const url = URL.createObjectURL(new Blob([JSON.stringify({ versao: 3, fichas: data })], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'hall-da-fama-backup.json'; a.click();
    URL.revokeObjectURL(url);
    closeModal();
  };

  const importBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : data.fichas;
      if (!Array.isArray(list)) throw new Error('formato');
      const inputs = list.filter((r: unknown) => r && typeof (r as { nome?: unknown }).nome === 'string').map((r: Record<string, unknown>) => toInput(r, sistemas));
      const res = await createMany.mutateAsync(inputs);
      closeModal();
      toast(res.count ? `${res.count} ${res.count === 1 ? 'ficha importada' : 'fichas importadas'}.` : 'Nenhuma ficha nova no arquivo.');
    } catch { toast('Arquivo de backup inválido.'); }
  };

  const clearAll = async () => {
    closeModal();
    const ok = await confirm({ title: 'Apagar todas as fichas?', text: 'O Hall volta a ficar vazio. Se quiser guardar uma cópia, exporte um backup antes.', ok: 'Apagar tudo', danger: true });
    if (!ok) return;
    try { await removeMany.mutateAsync(false); H.t = H.target = 0; toast('Todas as fichas foram apagadas.'); }
    catch { toast('Não consegui apagar as fichas.'); }
  };

  return (
    <>
      <h3>Opções</h3>
      <p>{N} {N === 1 ? 'ficha salva' : 'fichas salvas'}. Guardadas no banco de dados.</p>
      <div className="stack">
        <button className="btn" disabled={!sistemas.length} onClick={gen}>Gerar 40 fichas de teste</button>
        <button className="btn" disabled={!demos} onClick={clearDemos}>Remover fichas de exemplo ({demos})</button>
        <button className="btn" disabled={!N} onClick={exportBackup}>Exportar backup</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>Importar backup</button>
        <button className="btn danger" disabled={!N} onClick={clearAll}>Apagar todas as fichas</button>
      </div>
      <input type="file" ref={fileRef} accept="application/json,.json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ''; }} />
      <div className="mrow"><button className="btn" data-focus onClick={closeModal}>Fechar</button></div>
    </>
  );
}
