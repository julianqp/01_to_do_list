import { CloudOff } from 'lucide-react';
import { useEffect } from 'react';
import { ApiError } from '../lib/api';
import { useLogout, useMe } from '../lib/auth-queries';
import { messageForError } from '../lib/messages';
import { loadErrorText } from '../lib/task-messages';
import { useTasks } from '../lib/task-queries';
import { Alert } from './Alert';
import { AppHeader, type LogoutHandler } from './AppHeader';
import { Board } from './Board';
import { Button } from './Button';
import { Icon } from './Icon';
import { withQueryClient } from './withQueryClient';

// CA-3.2, D-10: una página restaurada desde la caché de ida y vuelta (bfcache) no vuelve a
// comprobar la sesión; recargarla sí lo hace. El efecto se suscribe a un evento del navegador.
function useReloadWhenRestoredFromCache() {
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) location.reload();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);
}

// Spec 002 D-8: una sesión que no vale redirige (withQueryClient); cualquier otro error, después de
// los reintentos, es el error de carga de RF-008.
const isSessionError = (error: Error | null) =>
  error instanceof ApiError &&
  (error.code === 'UNAUTHENTICATED' || error.code === 'SESSION_EXPIRED');

// §12 «Error de página»: círculo glass con cloud-off, el mensaje y «Reintentar» (X-5: sin código).
function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      <span className="flex size-18 items-center justify-center rounded-pill border border-contrast bg-glass text-1 shadow-(--shadow-pill) backdrop-glass">
        <Icon icon={CloudOff} size={26} />
      </span>
      <p className="max-w-md text-balance text-1">{loadErrorText}</p>
      <Button variant="glass" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}

function PrivateAreaContent() {
  const me = useMe();
  const tasks = useTasks({ enabled: me.isSuccess });
  const logout = useLogout();
  useReloadWhenRestoredFromCache();

  const meFailed = me.isError && !isSessionError(me.error);
  const tasksFailed = tasks.isError && !isSessionError(tasks.error);
  const loadFailed = meFailed || tasksFailed;

  // D-8: «Reintentar» vuelve a pedir lo que falló; sin `me` no se piden las tareas.
  const retry = () => void (meFailed ? me.refetch() : tasks.refetch());

  // Spec 004 E-12: el menú de cuenta se cierra si falla (onError de esta llamada).
  const onLogout: LogoutHandler = (callbacks) =>
    logout.mutate(undefined, { onError: callbacks?.onError });
  const logoutError = logout.isError ? messageForError(logout.error) : undefined;

  return (
    // Spec 002 D-16: la página ocupa el alto de la ventana; desde 768 px cada columna hace scroll por
    // su cuenta (E-2). Por debajo, el que hace scroll es <main>.
    <div className="flex h-dvh flex-col">
      {/* RF-015. Spec 004 RF-006, RF-007: email y «Cerrar sesión» en la cabecera. Spec 002 D-8: si no
          se ha podido comprobar la sesión, solo el nombre de la app. Plan §4.1: no sale hasta tener
          las tareas. */}
      {(tasks.isSuccess || loadFailed) && (
        <AppHeader email={me.data?.email} loggingOut={logout.isPending} onLogout={onLogout} />
      )}
      {/* RF-036: en móvil, el relleno de abajo deja sitio a «Crear tarea», fijo abajo. */}
      <main className="mx-auto flex min-h-0 w-full max-w-420 flex-1 flex-col gap-6 overflow-y-auto px-4 py-8 max-md:pb-24 md:px-7">
        {/* D-11: si no se ha podido cerrar la sesión, se avisa y se sigue dentro. Spec 004 RF-008:
            debajo de la cabecera. RNF-001: la zona de alerta está siempre y solo cambia su contenido
            (ver LoginForm). Spec 002 D-8: también lleva el error de carga. */}
        <div role="alert" className="empty:sr-only">
          {logoutError && <Alert tone={logoutError.tone}>{logoutError.text}</Alert>}
          {loadFailed && <LoadError onRetry={retry} />}
        </div>
        {/* Plan §4.1: mientras se comprueba la sesión (o se redirige, D-10) o se piden las tareas, no
            se ve nada. */}
        {tasks.isSuccess ? (
          <Board tasks={tasks.data} />
        ) : (
          !loadFailed && <p className="sr-only">Cargando…</p>
        )}
      </main>
    </div>
  );
}

export const PrivateArea = withQueryClient(PrivateAreaContent, { requireSession: true });
