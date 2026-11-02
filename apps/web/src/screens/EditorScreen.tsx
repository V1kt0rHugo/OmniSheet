import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { screenCls, useApp } from '../app/AppContext';
import { useFichaMutations } from '../api/useFichas';
import { Frag } from '../components/Frag';
import { newDraft } from '../lib/ficha';
import { shrink } from '../lib/image';
import { sfx } from '../lib/sfx';
import { calcular, comFormato, descreverBonus, descreverEfeito, formatar } from '../lib/calculo';
import { CHAVE_ROLAGENS, atributosDe as atributosDeDados, camposDe, dadosCompletos, rolagensDe, textoDe as textoDeDados } from '../lib/sistema';
import { estadoRequisito, chaveRequisito } from '../lib/rolagem';
import { HabilidadesEditor } from '../components/Habilidades';
import { RequisitoRolagem } from '../components/RequisitoRolagem';
import { RolagemBotao } from '../components/RolagemBotao';
import { clamp, norm } from '../lib/util';
import type { Atributo, CampoDef, Dados, Ficha, FichaDraft, ItemFicha, Sistema } from '../types';
import { H } from './hallState';

export interface EditorSession { ficha: Ficha | null; sistemaId: string; from: 'hall' | 'menu' | 'sheet'; key: number }

export function EditorScreen({ session }: { session: EditorSession | null }) {
  const { screen, instant, sistemaPorId } = useApp();
  const sistema = session ? sistemaPorId(session.sistemaId) : undefined;
  return (
    <section id="scr-editor" className={screenCls(screen === 'editor', instant)} aria-label="Editor de ficha">
      {session && sistema && <EditorForm key={session.key} session={session} sistema={sistema} />}
    </section>
  );
}

function toDraft(f: Ficha | null, sistema: Sistema): FichaDraft {
  if (!f) return newDraft(sistema);
  const { criadoEm: _c, atualizadoEm: _a, ...rest } = structuredClone(f);
  return {
    ...rest,
    dados: dadosCompletos(sistema, rest.dados),
    item: Object.assign({ nome: '', descricao: '', imagem: null }, rest.item),
  };
}

const SPAN: Record<CampoDef['largura'], string> = { cheia: 'span-6', meia: 'span-3', terco: 'span-2' };

function EditorForm({ session, sistema }: { session: EditorSession; sistema: Sistema }) {
  const { fichas, show, openSheet, toast, confirm, instant } = useApp();
  const { create, update, remove } = useFichaMutations();
  const isNew = !session.ficha;
  const [draft, setDraft] = useState<FichaDraft>(() => toDraft(session.ficha, sistema));
  const [dirty, setDirty] = useState(false);
  const [nameErr, setNameErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dropP, setDropP] = useState(false);
  const [dropI, setDropI] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileP = useRef<HTMLInputElement>(null);
  const fileI = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (instant) return;
    const t = setTimeout(() => nomeRef.current?.focus({ preventScroll: true }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calc = useMemo(() => calcular(sistema, draft.dados), [sistema, draft.dados]);
  // opção que o jogador tentou escolher e ainda precisa vencer a rolagem de dado mínimo, por campo
  const [pendente, setPendente] = useState<Record<string, string>>({});
  const nomeDoCampo = useMemo(() => Object.fromEntries(camposDe(sistema).map((c) => [c.id, c.label])), [sistema]);
  const campanhas = useMemo(() => [...new Set(fichas.map((x) => x.campanha).filter(Boolean))], [fichas]);

  const set = <K extends keyof FichaDraft>(k: K, v: FichaDraft[K]) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true); };
  const setItem = <K extends keyof ItemFicha>(k: K, v: ItemFicha[K]) => { setDraft((d) => ({ ...d, item: { ...d.item, [k]: v } })); setDirty(true); };
  const setDado = (id: string, v: Dados[string]) => { setDraft((d) => ({ ...d, dados: { ...d.dados, [id]: v } })); setDirty(true); };
  const text = (k: 'epiteto' | 'campanha' | 'resumo' | 'status') => ({
    value: draft[k], onChange: (e: { target: { value: string } }) => set(k, e.target.value),
  });

  /* ---------- imagens ---------- */
  const pickImage = async (file: File | undefined, kind: 'portrait' | 'item') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Escolha um arquivo de imagem.'); return; }
    try {
      if (kind === 'portrait') set('imagem', await shrink(file, 680, 'image/jpeg', .78));
      else setItem('imagem', await shrink(file, 280, 'image/webp', .85));
    } catch { toast('Não consegui ler essa imagem.'); }
  };
  const dropHandlers = (kind: 'portrait' | 'item', setOver: (v: boolean) => void) => ({
    onDragOver: (e: DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: DragEvent) => { e.preventDefault(); setOver(false); pickImage(e.dataTransfer.files[0], kind); },
  });

  /* ---------- campos do sistema ---------- */
  const atributosDe = (c: CampoDef) => atributosDeDados(draft.dados, c.id);
  const textoDe = (c: CampoDef) => textoDeDados(draft.dados, c.id);

  /** Escolha numa lista de opções; opções com dado mínimo só valem depois de a rolagem alcançar o valor exigido. */
  const escolher = (c: CampoDef, opcao: string) => {
    const req = c.requisitos?.[opcao];
    if (!req || opcao === textoDe(c)) { setPendente((p) => { const { [c.id]: _x, ...resto } = p; return resto; }); setDado(c.id, opcao); return; }
    const est = estadoRequisito(draft.dados, c.id, opcao, req);
    if (est.aprovado) { setPendente((p) => { const { [c.id]: _x, ...resto } = p; return resto; }); setDado(c.id, opcao); return; }
    if (est.esgotado) { toast(`Sem tentativas para ${opcao}.`); return; }
    setPendente((p) => ({ ...p, [c.id]: opcao }));
  };
  const registrarRolagem = (c: CampoDef, opcao: string, total: number, texto: string, aprovado: boolean) => {
    const chave = chaveRequisito(c.id, opcao);
    const antes = rolagensDe(draft.dados)[chave];
    setDado(CHAVE_ROLAGENS, { ...rolagensDe(draft.dados), [chave]: { tentativas: [...(antes?.tentativas ?? []), { total, texto }], aprovado: aprovado || antes?.aprovado === true } });
    if (aprovado) { setDado(c.id, opcao); setPendente((p) => { const { [c.id]: _x, ...resto } = p; return resto; }); }
  };

  const renderCampo = (c: CampoDef) => {
    if (c.tipo === 'atributos') {
      const rows = atributosDe(c);
      const setRows = (r: Atributo[]) => setDado(c.id, r);
      return (
        <div className="span-6" key={c.id}>
          <div className="attrs">
            {rows.map((a, i) => (
              <div className="attr" key={i}>
                <input value={a.n} placeholder="Nome (ex.: Força)" aria-label={`Nome do atributo ${i + 1}`} maxLength={40}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, n: e.target.value } : x)))} />
                <input value={a.v} placeholder="Valor" aria-label={`Valor do atributo ${i + 1}`} maxLength={12}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
                <button type="button" aria-label={`Remover atributo ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn" type="button" onClick={() => {
              setRows([...rows, { n: '', v: '' }]);
              setTimeout(() => scrollRef.current?.querySelector<HTMLInputElement>('.attr:last-child input')?.focus(), 0);
            }}>Adicionar atributo</button>
            {c.modelo && c.modelo.length > 0 && (
              <button className="btn subtle" type="button" onClick={() => {
                const have = new Set(rows.map((a) => norm(a.n)));
                setRows([...rows, ...c.modelo!.filter((m) => !have.has(norm(m.n))).map((m) => ({ n: m.n, v: m.v }))]);
              }}>Usar modelo do sistema</button>
            )}
          </div>
        </div>
      );
    }
    const label = <span>{c.label}{c.dica && <i>{c.dica}</i>}</span>;
    if (c.tipo === 'calculado') {
      const lista = calc.bonus[c.id] ?? [];
      return (
        <div className={'fld ' + SPAN[c.largura]} key={c.id}>{label}
          <output className="calc-out" title={c.formula}>{comFormato(c, formatar(calc.valores[c.id]))}</output>
          {lista.length > 0 && <small className="fld-total">base {formatar(calc.base[c.id])} · {descreverBonus(lista)}</small>}
        </div>
      );
    }
    if (c.tipo === 'recurso') {
      const max = calc.valores[c.id];
      const lista = calc.bonus[c.id] ?? [];
      const bruto = textoDe(c);
      return (
        <div className={'fld ' + SPAN[c.largura]} key={c.id}>{label}
          <div className="recurso-row">
            <input type="number" min={0} max={max ?? undefined} value={bruto !== '' ? bruto : String(calc.atuais[c.id] ?? 0)} onChange={(e) => setDado(c.id, e.target.value)} />
            <span className="recurso-max">/ {formatar(max)}</span>
            <button type="button" className="btn subtle" onClick={() => setDado(c.id, '')}>Cheio</button>
          </div>
          {lista.length > 0 && <small className="fld-total">máximo base {formatar(calc.base[c.id])} · {descreverBonus(lista)}</small>}
        </div>
      );
    }
    if (c.tipo === 'rolagem') {
      return <div className={'fld ' + SPAN[c.largura]} key={c.id}>{label}<RolagemBotao formula={c.formula ?? ''} sistema={sistema} calc={calc} /></div>;
    }
    if (c.tipo === 'habilidades') {
      return (
        <div className="fld span-6" key={c.id}>{label}
          <HabilidadesEditor campo={c} sistema={sistema} calc={calc} dados={draft.dados} setDado={setDado} toast={toast} />
        </div>
      );
    }
    if (c.tipo === 'booleano') {
      return (
        <div className={'fld ' + SPAN[c.largura]} key={c.id}>
          <label className="sb-check"><input type="checkbox" checked={draft.dados[c.id] === 'true'} onChange={(e) => setDado(c.id, e.target.checked ? 'true' : 'false')} /><span>{c.label}{c.dica && <i className="sb-dica">{c.dica}</i>}</span></label>
        </div>
      );
    }
    if (c.tipo === 'textarea') {
      return <label className="fld span-6" key={c.id}>{label}<textarea value={textoDe(c)} onChange={(e) => setDado(c.id, e.target.value)} /></label>;
    }
    if (c.tipo === 'selecao') {
      const v = textoDe(c);
      const fora = v && !c.opcoes?.includes(v); // valor que já não está na lista do sistema continua selecionável
      const alvo = pendente[c.id];
      const reqAlvo = alvo ? c.requisitos?.[alvo] : undefined;
      return (
        <div className={'fld ' + SPAN[c.largura]} key={c.id}>
          <label className="fld">{label}
            <select value={v} onChange={(e) => escolher(c, e.target.value)}>
              <option value="">—</option>
              {fora && <option value={v}>{v}</option>}
              {c.opcoes?.map((o) => {
                const req = c.requisitos?.[o];
                const est = req ? estadoRequisito(draft.dados, c.id, o, req) : undefined;
                const nota = req && !est!.aprovado && o !== v ? ` (dado mínimo ${req.minimo})` : '';
                return <option key={o} value={o} disabled={est?.esgotado && o !== v}>{o}{nota}</option>;
              })}
            </select>
          </label>
          {(c.efeitos?.[v]?.length ?? 0) > 0 && <small className="fld-total">{c.efeitos![v].map((m) => descreverEfeito(m, nomeDoCampo[m.campo] ?? m.campo)).join(' · ')}</small>}
          {alvo && reqAlvo && (
            <RequisitoRolagem sistema={sistema} calc={calc} requisito={reqAlvo} titulo={alvo}
              estado={estadoRequisito(draft.dados, c.id, alvo, reqAlvo)}
              onRolar={(r, ok) => registrarRolagem(c, alvo, r.total, r.texto, ok)}
              onCancelar={() => setPendente((p) => { const { [c.id]: _x, ...resto } = p; return resto; })} />
          )}
        </div>
      );
    }
    return (
      <label className={'fld ' + SPAN[c.largura]} key={c.id}>{label}
        <input type={c.tipo === 'numero' ? 'number' : 'text'} inputMode={c.tipo === 'numero' ? 'numeric' : undefined}
          maxLength={c.tipo === 'texto' ? 120 : undefined} autoComplete="off" value={textoDe(c)} onChange={(e) => setDado(c.id, e.target.value)} />
        {c.tipo === 'numero' && (calc.bonus[c.id]?.length ?? 0) > 0 && (
          <small className="fld-total">total {formatar(calc.valores[c.id])} · {descreverBonus(calc.bonus[c.id])}</small>
        )}
      </label>
    );
  };

  /* ---------- salvar, cancelar, excluir ---------- */
  const save = async () => {
    const nome = draft.nome.trim();
    if (!nome) { setNameErr(true); nomeRef.current?.focus(); if (scrollRef.current) scrollRef.current.scrollTop = 0; return; }
    const dados = { ...draft.dados };
    for (const k of Object.keys(dados)) {
      const v = dados[k];
      if (Array.isArray(v)) dados[k] = v.filter((a) => a.n.trim() || a.v.trim());
    }
    const payload: FichaDraft = { ...draft, nome, dados };
    setSaving(true);
    try {
      if (isNew) {
        const idx = fichas.length;
        await create.mutateAsync(payload);
        sfx('confirm');
        H.born = payload.id;
        setTimeout(() => { H.born = null; }, 2000);
        H.t = H.target = Math.max(0, idx - 1.2);
        H.dirty = true;
        show('hall', { assemble: true });
        H.target = clamp(idx, 0, idx + 1);
        toast('Ficha criada. Um novo fragmento se formou no espelho.');
      } else {
        const { id, sistemaId: _s, ...data } = payload;
        await update.mutateAsync({ id, data });
        sfx('confirm');
        toast('Ficha atualizada.');
        openSheet(id);
      }
      setDirty(false);
    } catch (e) {
      toast((e as Error).message || 'Não consegui salvar. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  const leave = () => {
    if (session.from === 'sheet' && !isNew) openSheet(draft.id);
    else if (session.from === 'menu') show('menu');
    else show('hall', { assemble: true });
  };
  const cancel = async () => {
    if (dirty) {
      const ok = await confirm({ title: 'Descartar alterações?', text: 'O que você preencheu nesta ficha ainda não foi salvo.', ok: 'Descartar', danger: true });
      if (!ok) return;
    }
    sfx('cancel');
    leave();
  };
  const del = async () => {
    const ok = await confirm({ title: 'Excluir ficha?', text: `"${draft.nome}" será removida do Hall e o fragmento some do espelho. Isso não pode ser desfeito.`, ok: 'Excluir ficha', danger: true });
    if (!ok) return;
    const idx = fichas.findIndex((x) => x.id === draft.id);
    try {
      await remove.mutateAsync(draft.id);
    } catch { toast('Não consegui excluir. Tente de novo.'); return; }
    sfx('cancel');
    H.t = H.target = clamp(idx, 0, Math.max(0, fichas.length - 1));
    H.dirty = true;
    show('hall', { assemble: true });
    toast('Ficha excluída.');
  };

  const hasItemImg = !!draft.item.imagem;

  return (
    <div className="scroll" ref={scrollRef}>
      <header className="ed-top">
        <button className="btn subtle" onClick={cancel}>Voltar</button>
        <h2>{isNew ? 'Nova ficha' : 'Editar ficha'} <span className="ed-sys">{sistema.nome}</span></h2>
        <button className="btn primary" disabled={saving} onClick={save}>Salvar ficha</button>
      </header>
      <div className="ed-grid">
        <aside className="ed-visual">
          <Frag ficha={draft} interactive className={dropP ? 'drop' : ''}
            onClick={() => fileP.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileP.current?.click(); } }}
            {...dropHandlers('portrait', setDropP)}>
            {!draft.imagem && <div className="hint">Clique ou arraste o retrato aqui</div>}
          </Frag>
          <div className="row">
            <button className="btn" onClick={() => fileP.current?.click()}>Escolher retrato</button>
            {draft.imagem && <button className="btn subtle" onClick={() => set('imagem', null)}>Remover</button>}
          </div>
          <input type="file" ref={fileP} accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0], 'portrait'); e.target.value = ''; }} />
          <label className="fld"><span>Enquadramento vertical</span>
            <input type="range" min={0} max={100} value={draft.foco} onChange={(e) => set('foco', +e.target.value)} /></label>
          <label className="fld"><span>Cor do fragmento</span>
            <input type="range" min={0} max={359} value={draft.cor} onChange={(e) => set('cor', +e.target.value)} /></label>
          <div className={'item-prev' + (dropI ? ' drop' : '')} role="button" tabIndex={0} aria-label="Escolher imagem do item"
            onClick={() => fileI.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileI.current?.click(); } }}
            {...dropHandlers('item', setDropI)}>
            <div className="box">{hasItemImg && <img src={draft.item.imagem!} alt="" />}</div>
            <span>{hasItemImg ? 'Imagem do item. Clique para trocar.' : 'Imagem do item vinculado. Ela aparece no centro do Hall.'}</span>
          </div>
          <input type="file" ref={fileI} accept="image/*" hidden onChange={(e) => { pickImage(e.target.files?.[0], 'item'); e.target.value = ''; }} />
          {hasItemImg && <button className="btn subtle" onClick={() => setItem('imagem', null)}>Remover imagem do item</button>}
        </aside>

        <div className="ed-form">
          <section>
            <h3>Identidade</h3>
            <label className={'fld' + (nameErr ? ' bad' : '')}><span>Nome <i>obrigatório</i></span>
              <input ref={nomeRef} maxLength={80} autoComplete="off" value={draft.nome}
                onChange={(e) => { set('nome', e.target.value); setNameErr(false); }}
                onBlur={(e) => { if (dirty && !e.target.value.trim()) setNameErr(true); }} />
              <em className="err">{nameErr ? 'Informe o nome da ficha.' : ''}</em></label>
            <label className="fld"><span>Epíteto <i>aparece abaixo do nome</i></span><input maxLength={120} autoComplete="off" {...text('epiteto')} /></label>
            <div className="g2">
              <label className="fld"><span>Campanha</span><input list="dlCampanhas" maxLength={100} autoComplete="off" {...text('campanha')} /></label>
              <label className="fld"><span>Status</span>
                <select {...text('status')}><option>Ativo</option><option>Aposentado</option><option>Morto</option><option>Desaparecido</option></select></label>
            </div>
            <datalist id="dlCampanhas">{campanhas.map((c) => <option key={c} value={c} />)}</datalist>
            <label className="fld"><span>Resumo <i>aparece no painel do Hall</i></span><textarea maxLength={400} {...text('resumo')} /></label>
          </section>

          {sistema.secoes.map((s) => (
            <section key={s.id}>
              <h3>{s.titulo}</h3>
              <div className="fgrid">{s.campos.map(renderCampo)}</div>
            </section>
          ))}

          <section>
            <h3>Item vinculado</h3>
            <label className="fld"><span>Nome do item</span><input maxLength={80} autoComplete="off" value={draft.item.nome} onChange={(e) => setItem('nome', e.target.value)} /></label>
            <label className="fld"><span>Descrição do item</span><textarea style={{ minHeight: 70 }} value={draft.item.descricao} onChange={(e) => setItem('descricao', e.target.value)} /></label>
          </section>
          <div className="ed-foot">
            {!isNew && <button className="btn danger" type="button" onClick={del}>Excluir ficha</button>}
            <button className="btn primary" type="button" disabled={saving} onClick={save} style={{ marginLeft: 'auto' }}>Salvar ficha</button>
          </div>
        </div>
      </div>
    </div>
  );
}
