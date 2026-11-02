import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppContext, type AppApi, type ConfirmOpts, type EditorOpts, type MenuPhase, type Origem, type ScreenId, type ShowOpts } from './app/AppContext';
import { useFichasQuery, useSistemasQuery } from './api/useFichas';
import { Modal, MuteButton, SvgDefs } from './components/Shell';
import { TitleScreen } from './screens/TitleScreen';
import { MenuScreen } from './screens/MenuScreen';
import { HallScreen } from './screens/HallScreen';
import { EditorScreen, type EditorSession } from './screens/EditorScreen';
import { SheetScreen } from './screens/SheetScreen';
import { SystemPickerScreen } from './screens/SystemPickerScreen';
import { WizardScreen, type WizardSession } from './screens/WizardScreen';
import { sfx } from './lib/sfx';
import { reduceMotion, wait } from './lib/util';
import type { Ficha, Sistema } from './types';

interface ModalState { node: ReactNode; onCancel?: () => void }

function ConfirmBox({ title, text, ok = 'Confirmar', danger = false, onDone }: ConfirmOpts & { onDone: (v: boolean) => void }) {
  return (
    <>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="mrow">
        <button className="btn" data-focus onClick={() => onDone(false)}>Cancelar</button>
        <button className={'btn ' + (danger ? 'danger' : 'primary')} onClick={() => onDone(true)}>{ok}</button>
      </div>
    </>
  );
}

export function App() {
  const { fichas, error } = useFichasQuery();
  const { sistemas, error: errorSistemas } = useSistemasQuery();
  const sistemasRef = useRef<Sistema[]>(sistemas);
  sistemasRef.current = sistemas;
  const fichasRef = useRef<Ficha[]>(fichas);
  fichasRef.current = fichas;

  const [screen, setScreen] = useState<ScreenId>('title');
  const [instant, setInstant] = useState(false);
  const [assembleToken, setAssembleToken] = useState(0);
  const [menuPhase, setMenuPhase] = useState<MenuPhase>('off');
  const [blackout, setBlackout] = useState(false);
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [pickerFrom, setPickerFrom] = useState<Origem>('hall');
  const [wizardSession, setWizardSession] = useState<WizardSession | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const modalRef = useRef<ModalState | null>(null);
  modalRef.current = modal;
  const toastTimer = useRef<number>();
  const editorKey = useRef(0);
  const wizardKey = useRef(0);

  const show = useCallback((id: ScreenId, { instant: inst = false, assemble = false }: ShowOpts = {}) => {
    setInstant(inst);
    setScreen(id);
    if (assemble) setAssembleToken((t) => t + 1);
  }, []);

  // `instant` só vale durante a troca: depois de dois quadros volta a permitir a transição suave
  useEffect(() => {
    if (!instant) return;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setInstant(false)); });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
  }, [instant, screen]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastOn(false), 2600);
  }, []);

  useEffect(() => { if (error || errorSistemas) toast('Não consegui falar com o servidor. A API está rodando?'); }, [error, errorSistemas, toast]);

  const openModal = useCallback((node: ReactNode, onCancel?: () => void) => setModal({ node, onCancel }), []);
  const closeModal = useCallback(() => setModal(null), []);
  const dismissModal = useCallback(() => {
    const c = modalRef.current?.onCancel;
    setModal(null);
    c?.();
  }, []);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((res) => {
    openModal(<ConfirmBox {...o} onDone={(v) => { setModal(null); res(v); }} />, () => res(false));
  }), [openModal]);

  const openEditor = useCallback((f: Ficha | null, { from = 'hall', instant: inst = false, sistemaId }: EditorOpts = {}) => {
    const sid = f?.sistemaId ?? sistemaId;
    if (!sid) return;
    setEditor({ ficha: f, sistemaId: sid, from, key: ++editorKey.current });
    show('editor', { instant: inst });
  }, [show]);

  const openSystemPicker = useCallback(({ from = 'hall', instant: inst = false }: { from?: Origem; instant?: boolean } = {}) => {
    setPickerFrom(from);
    show('systems', { instant: inst });
  }, [show]);

  const openSheet = useCallback((id: string, { instant: inst = false }: { instant?: boolean } = {}) => {
    if (!fichasRef.current.some((f) => f.id === id)) { show('hall'); return; }
    setSheetId(id);
    show('sheet', { instant: inst });
  }, [show]);

  const openWizard = useCallback((sistemaId: string, opts?: { from?: Origem }) => {
    setWizardSession({ sistemaId, from: opts?.from ?? 'hall', key: ++wizardKey.current });
    show('wizard');
  }, [show]);

  const enterMenu = useCallback(async () => {
    setMenuPhase('off');
    await wait(80);
    sfx('menuIn');
    setMenuPhase('lit');
    await wait(reduceMotion ? 0 : 1100);
    setMenuPhase('risen');
    await wait(900);
    document.querySelector<HTMLElement>('#menuNav button')?.focus({ preventScroll: true });
  }, []);

  const api = useMemo<AppApi>(() => ({
    fichas, sistemas, sistemaPorId: (id) => sistemasRef.current.find((x) => x.id === id), screen, instant, assembleToken, menuPhase, setMenuPhase, show,
    openEditor, openSheet, openSystemPicker, openWizard, enterMenu,
    setBlackout, toast, openModal, closeModal, isModalOpen: () => modalRef.current != null, confirm,
  }), [fichas, sistemas, screen, instant, assembleToken, menuPhase, show, openEditor, openSheet, openSystemPicker, openWizard, enterMenu, toast, openModal, closeModal, confirm]);

  return (
    <AppContext.Provider value={api}>
      <div id="app">
        <TitleScreen />
        <MenuScreen />
        <HallScreen />
        <SystemPickerScreen from={pickerFrom} />
        <EditorScreen session={editor} />
        <SheetScreen id={sheetId} />
        <WizardScreen session={wizardSession} />

        <div id="fx" />
        <div id="blackout" className={blackout ? 'on' : ''} />
        <div id="flash" />
        <Modal content={modal?.node ?? null} onDismiss={dismissModal} />
        <div id="toast" role="status" className={toastOn ? 'on' : ''}>{toastMsg}</div>
        <MuteButton />
      </div>
      <SvgDefs />
    </AppContext.Provider>
  );
}
