import { useRef, type ChangeEvent } from 'react';
import type { FichaDraft, Dados } from '../../types';
import { shrink } from '../../lib/image';

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

  const enquadramento = getDado('enquadramento') || 'inteira';
  const zoom = Number(getDado('zoom_retrato') || '50');
  const horizontal = Number(getDado('pos_horizontal') || '50');
  const vertical = typeof draft.foco === 'number' ? draft.foco : 50;

  const handleCentralizar = () => {
    set('foco', 50);
    setDado('zoom_retrato', '50');
    setDado('pos_horizontal', '50');
  };

  // Cálculo de transformação para o preview da imagem
  // zoom: 50 -> 1x, 0 -> 0.7x, 100 -> 2x
  const scale = 0.7 + (zoom / 100) * 1.3;
  // horizontal: 0% a 100%
  const posX = horizontal;
  // vertical: 0% a 100%
  const posY = vertical;

  return (
    <div className="wiz-passo-identificacao">
      <div className="wiz-header-text">
        <span className="wiz-eyebrow">PASSO 1</span>
        <h2 className="wiz-title">IDENTIFICAÇÃO</h2>
        <p className="wiz-subtitle">
          Os campos da ficha base. Só o nome é obrigatório agora.
        </p>
      </div>

      {/* Grid Linha 1: 5 campos */}
      <div className="wiz-field-row five-cols">
        <label className={`wiz-label ${nameErr ? 'has-error' : ''}`}>
          <span>NOME *</span>
          <input
            type="text"
            placeholder="Ex.: Kael"
            value={draft.nome}
            onChange={(e) => {
              set('nome', e.target.value);
              if (e.target.value.trim()) setNameErr(false);
            }}
          />
        </label>

        <label className="wiz-label">
          <span>SOBRENOME</span>
          <input
            type="text"
            placeholder=""
            value={getDado('sobrenome')}
            onChange={(e) => setDado('sobrenome', e.target.value)}
          />
        </label>

        <label className="wiz-label">
          <span>JOGADOR</span>
          <input
            type="text"
            placeholder=""
            value={getDado('jogador')}
            onChange={(e) => setDado('jogador', e.target.value)}
          />
        </label>

        <label className="wiz-label">
          <span>IDADE</span>
          <input
            type="text"
            placeholder=""
            value={getDado('idade')}
            onChange={(e) => setDado('idade', e.target.value)}
          />
        </label>

        <label className="wiz-label">
          <span>PESO</span>
          <input
            type="text"
            placeholder="Ex.: 68 kg"
            value={getDado('peso')}
            onChange={(e) => setDado('peso', e.target.value)}
          />
        </label>
      </div>

      {/* Grid Linha 2: 4 campos */}
      <div className="wiz-field-row four-cols">
        <label className="wiz-label">
          <span>ALTURA</span>
          <input
            type="text"
            placeholder="Ex.: 1,78 m"
            value={getDado('altura')}
            onChange={(e) => setDado('altura', e.target.value)}
          />
        </label>

        <label className="wiz-label">
          <span>DIA DE NASCIMENTO</span>
          <input
            type="text"
            placeholder="00/00/2047"
            value={getDado('data_nascimento')}
            onChange={(e) => setDado('data_nascimento', e.target.value)}
          />
        </label>

        <label className="wiz-label">
          <span>ESPECIALISTA</span>
          <input
            type="text"
            placeholder="Em que ele é especialista"
            value={getDado('especialista')}
            onChange={(e) => setDado('especialista', e.target.value)}
          />
        </label>

        <label className="wiz-label">
          <span>APELIDO</span>
          <input
            type="text"
            placeholder=""
            value={getDado('apelido')}
            onChange={(e) => setDado('apelido', e.target.value)}
          />
        </label>
      </div>

      {/* Seção Retrato & Enquadramento */}
      <div className="wiz-portrait-section">
        {/* Caixa do Retrato */}
        <div
          className="wiz-portrait-box"
          onClick={() => fileInputRef.current?.click()}
          title="Clique para enviar ou alterar o retrato"
        >
          {draft.imagem ? (
            <div
              className="wiz-portrait-img-wrap"
              style={{
                overflow: 'hidden',
                width: '100%',
                height: '100%',
              }}
            >
              <img
                src={draft.imagem}
                alt="Retrato"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: enquadramento === 'preencher' ? 'cover' : 'contain',
                  transform: `scale(${scale})`,
                  objectPosition: `${posX}% ${posY}%`,
                }}
              />
            </div>
          ) : (
            <div className="wiz-portrait-placeholder">
              <span className="wiz-question-mark">?</span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          hidden
          onChange={onFileInputChange}
        />

        {/* Controles do Retrato */}
        <div className="wiz-portrait-controls">
          <div className="wiz-ctrl-group">
            <span className="wiz-sub-label">RETRATO</span>
            <div className="wiz-btn-row">
              <button
                type="button"
                className="wiz-btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Enviar imagem
              </button>
              {draft.imagem && (
                <button
                  type="button"
                  className="wiz-btn-ghost subtle"
                  onClick={() => set('imagem', null)}
                >
                  Remover
                </button>
              )}
            </div>
            <p className="wiz-caption">
              Sem imagem, a ficha usa a arte da classe ou da raça.
            </p>
          </div>

          <div className="wiz-ctrl-group">
            <span className="wiz-sub-label">ENQUADRAMENTO</span>
            <div className="wiz-pill-toggle">
              <button
                type="button"
                className={`wiz-pill-btn ${enquadramento === 'preencher' ? 'active' : ''}`}
                onClick={() => setDado('enquadramento', 'preencher')}
              >
                Preencher
              </button>
              <button
                type="button"
                className={`wiz-pill-btn ${enquadramento === 'inteira' ? 'active' : ''}`}
                onClick={() => setDado('enquadramento', 'inteira')}
              >
                Inteira
              </button>
            </div>
          </div>

          <div className="wiz-sliders-group">
            <div className="wiz-slider-item">
              <span className="wiz-slider-name">Zoom</span>
              <input
                type="range"
                min="0"
                max="100"
                value={zoom}
                onChange={(e) => setDado('zoom_retrato', e.target.value)}
              />
            </div>

            <div className="wiz-slider-item">
              <span className="wiz-slider-name">Horizontal</span>
              <input
                type="range"
                min="0"
                max="100"
                value={horizontal}
                onChange={(e) => setDado('pos_horizontal', e.target.value)}
              />
            </div>

            <div className="wiz-slider-item">
              <span className="wiz-slider-name">Vertical</span>
              <input
                type="range"
                min="0"
                max="100"
                value={vertical}
                onChange={(e) => set('foco', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="wiz-centralizar-row">
            <button
              type="button"
              className="wiz-btn-ghost"
              onClick={handleCentralizar}
            >
              Centralizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
