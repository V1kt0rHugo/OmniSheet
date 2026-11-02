import { useRef, type ChangeEvent } from 'react';
import type { FichaDraft, Dados } from '../../types';
import { shrink } from '../../lib/image';
import { Frag } from '../../components/Frag';

export interface PassoIdentificacaoProps {
  draft: FichaDraft;
  set: <K extends keyof FichaDraft>(k: K, v: FichaDraft[K]) => void;
  setDado: (id: string, v: Dados[string]) => void;
  nameErr: boolean;
  setNameErr: (v: boolean) => void;
  toast: (msg: string) => void;
}

export function PassoIdentificacao({
  draft,
  set,
  setDado,
  nameErr,
  setNameErr,
  toast,
}: PassoIdentificacaoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDado = (id: string): string => {
    const val = draft.dados[id];
    return typeof val === 'string' ? val : '';
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Escolha um arquivo de imagem.');
      return;
    }
    try {
      const resized = await shrink(file, 680, 'image/jpeg', 0.82);
      set('imagem', resized);
    } catch {
      toast('Não consegui carregar essa imagem.');
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = '';
  };

  return (
    <div className="ed-grid">
      {/* Coluna da Esquerda: Fragmento de Vidro (Retrato da Ficha no OminiSheet) */}
      <aside className="ed-visual">
        <Frag
          ficha={draft}
          interactive
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {!draft.imagem && (
            <div className="hint">Clique ou arraste o retrato aqui</div>
          )}
        </Frag>

        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Escolher retrato
          </button>
          {draft.imagem && (
            <button
              type="button"
              className="btn subtle"
              onClick={() => set('imagem', null)}
            >
              Remover
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          hidden
          onChange={onFileInputChange}
        />

        <label className="fld">
          <span>
            Enquadramento vertical <i>ajusta a posição no fragmento</i>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={draft.foco ?? 25}
            onChange={(e) => set('foco', +e.target.value)}
          />
        </label>

        <label className="fld">
          <span>
            Cor do fragmento <i>aura no espelho do Hall</i>
          </span>
          <input
            type="range"
            min={0}
            max={359}
            value={draft.cor ?? 210}
            onChange={(e) => set('cor', +e.target.value)}
          />
        </label>
      </aside>

      {/* Coluna da Direita: Formulário de Identificação no Estilo do OminiSheet */}
      <div className="ed-form">
        <section>
          <h3>Identidade Básica</h3>
          <p className="sys-lead" style={{ fontSize: '14px', margin: 0 }}>
            Defina o nome e as informações do personagem. Apenas o nome é obrigatório neste momento.
          </p>

          <label className={`fld ${nameErr ? 'bad' : ''}`}>
            <span>
              Nome <i>obrigatório</i>
            </span>
            <input
              type="text"
              placeholder="Ex.: Kael"
              autoComplete="off"
              maxLength={80}
              value={draft.nome}
              onChange={(e) => {
                set('nome', e.target.value);
                if (e.target.value.trim()) setNameErr(false);
              }}
            />
            {nameErr && <em className="err">Informe o nome do personagem.</em>}
          </label>

          <div className="g2">
            <label className="fld">
              <span>Sobrenome</span>
              <input
                type="text"
                autoComplete="off"
                maxLength={80}
                value={getDado('sobrenome')}
                onChange={(e) => setDado('sobrenome', e.target.value)}
              />
            </label>

            <label className="fld">
              <span>Apelido</span>
              <input
                type="text"
                autoComplete="off"
                maxLength={80}
                value={getDado('apelido')}
                onChange={(e) => setDado('apelido', e.target.value)}
              />
            </label>
          </div>

          <div className="g2">
            <label className="fld">
              <span>Jogador <i>quem interpreta</i></span>
              <input
                type="text"
                autoComplete="off"
                maxLength={80}
                value={getDado('jogador')}
                onChange={(e) => setDado('jogador', e.target.value)}
              />
            </label>

            <label className="fld">
              <span>Especialista em</span>
              <input
                type="text"
                placeholder="Ex.: Armas pesadas, magias antigas..."
                autoComplete="off"
                maxLength={80}
                value={getDado('especialista')}
                onChange={(e) => setDado('especialista', e.target.value)}
              />
            </label>
          </div>
        </section>

        <section>
          <h3>Características Físicas</h3>
          <div className="g3">
            <label className="fld">
              <span>Idade</span>
              <input
                type="text"
                placeholder="Ex.: 24"
                autoComplete="off"
                maxLength={20}
                value={getDado('idade')}
                onChange={(e) => setDado('idade', e.target.value)}
              />
            </label>

            <label className="fld">
              <span>Altura</span>
              <input
                type="text"
                placeholder="Ex.: 1,78 m"
                autoComplete="off"
                maxLength={20}
                value={getDado('altura')}
                onChange={(e) => setDado('altura', e.target.value)}
              />
            </label>

            <label className="fld">
              <span>Peso</span>
              <input
                type="text"
                placeholder="Ex.: 72 kg"
                autoComplete="off"
                maxLength={20}
                value={getDado('peso')}
                onChange={(e) => setDado('peso', e.target.value)}
              />
            </label>
          </div>

          <div className="g2">
            <label className="fld">
              <span>Data de Nascimento</span>
              <input
                type="text"
                placeholder="00/00/2047"
                autoComplete="off"
                maxLength={30}
                value={getDado('data_nascimento')}
                onChange={(e) => setDado('data_nascimento', e.target.value)}
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
