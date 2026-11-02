import { useState, useRef, useEffect } from 'react';
import { screenCls, useApp } from '../app/AppContext';
import { useFichaMutations } from '../api/useFichas';
import { newDraft } from '../lib/ficha';
import { sfx } from '../lib/sfx';
import { H } from './hallState';
import { clamp } from '../lib/util';
import type { FichaDraft, Dados, Sistema } from '../types';
import { PassoIdentificacao } from './wizard/PassoIdentificacao';
import { PassoRaca } from './wizard/PassoRaca';

export interface WizardSession {
  sistemaId: string;
  from: 'hall' | 'menu';
  key: number;
}

export function WizardScreen({ session }: { session: WizardSession | null }) {
  const { screen, instant, sistemaPorId } = useApp();
  const sistema = session ? sistemaPorId(session.sistemaId) : undefined;

  return (
    <section
      id="scr-wizard"
      className={screenCls(screen === 'wizard', instant)}
      aria-label="Criação de Personagem"
    >
      {session && sistema && (
        <WizardForm key={session.key} session={session} sistema={sistema} />
      )}
    </section>
  );
}

function WizardForm({
  session,
  sistema,
}: {
  session: WizardSession;
  sistema: Sistema;
}) {
  const { fichas, show, openSheet, toast, confirm } = useApp();
  const { create } = useFichaMutations();

  const [draft, setDraft] = useState<FichaDraft>(() => newDraft(sistema));
  const [dirty, setDirty] = useState(false);
  const [passo, setPasso] = useState<number>(0);
  const [nameErr, setNameErr] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const TOTAL_PASSOS = 2;

  const set = <K extends keyof FichaDraft>(k: K, v: FichaDraft[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setDirty(true);
  };

  const setDado = (id: string, v: Dados[string]) => {
    setDraft((d) => ({ ...d, dados: { ...d.dados, [id]: v } }));
    setDirty(true);
  };

  // Se o usuário selecionou uma raça e não enviou imagem própria, pode usar a da raça
  useEffect(() => {
    const raca = draft.dados['raca'];
    if (raca === 'Meio Dragão' && !draft.imagem) {
      // Deixa a arte da raça pronta caso deseje usar como fallback
    }
  }, [draft.dados, draft.imagem]);

  const handleNext = async () => {
    if (passo === 0) {
      if (!draft.nome.trim()) {
        setNameErr(true);
        toast('O nome é obrigatório para avançar.');
        return;
      }
      setNameErr(false);
      sfx('confirm');
      setPasso(1);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      return;
    }

    if (passo === 1) {
      // Concluir criação da ficha
      await saveFicha();
    }
  };

  const handleBack = () => {
    if (passo > 0) {
      sfx('cancel');
      setPasso((p) => p - 1);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } else {
      handleCancel();
    }
  };

  const leave = () => {
    if (session.from === 'menu') show('menu');
    else show('hall', { assemble: true });
  };

  const handleCancel = async () => {
    if (dirty) {
      const ok = await confirm({
        title: 'Descartar alterações?',
        text: 'O que você preencheu nesta ficha ainda não foi salvo.',
        ok: 'Descartar',
        danger: true,
      });
      if (!ok) return;
    }
    sfx('cancel');
    leave();
  };

  const saveFicha = async () => {
    const nome = draft.nome.trim();
    if (!nome) {
      setPasso(0);
      setNameErr(true);
      toast('Informe o nome da ficha.');
      return;
    }

    setSaving(true);
    try {
      const idx = fichas.length;
      const payload: FichaDraft = {
        ...draft,
        nome,
        // Se a raça for Meio Dragão, podemos garantir a skill inicial
        dados: { ...draft.dados },
      };

      await create.mutateAsync(payload);
      sfx('confirm');
      H.born = payload.id;
      setTimeout(() => {
        H.born = null;
      }, 2000);
      H.t = H.target = Math.max(0, idx - 1.2);
      H.dirty = true;
      show('hall', { assemble: true });
      H.target = clamp(idx, 0, idx + 1);
      toast('Ficha criada com sucesso!');
      setDirty(false);
    } catch (e) {
      toast((e as Error).message || 'Não consegui salvar a ficha. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wiz-container scroll" ref={scrollRef}>
      <div className="wiz-content-wrap">
        {passo === 0 && (
          <PassoIdentificacao
            draft={draft}
            set={set}
            setDado={setDado}
            nameErr={nameErr}
            setNameErr={setNameErr}
            toast={toast}
          />
        )}

        {passo === 1 && (
          <PassoRaca
            draft={draft}
            setDado={setDado}
            sistema={sistema}
          />
        )}
      </div>

      {/* Barra de Rodapé Fixa */}
      <footer className="wiz-bottom-bar">
        <button
          type="button"
          className="wiz-btn-voltar"
          onClick={handleBack}
        >
          ← Voltar
        </button>

        <div className="wiz-status-salvo">
          <span className="wiz-cloud-icon">☁</span> Salvo na mesa
        </div>

        <button
          type="button"
          className="wiz-btn-proximo"
          disabled={saving}
          onClick={handleNext}
        >
          {passo === TOTAL_PASSOS - 1
            ? saving
              ? 'Salvando...'
              : 'Concluir →'
            : 'Próximo →'}
        </button>
      </footer>
    </div>
  );
}
