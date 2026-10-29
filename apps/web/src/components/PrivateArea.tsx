import { useEffect } from 'react';
import { useLogout, useMe } from '../lib/auth-queries';
import { messageForError } from '../lib/messages';
import { Alert } from './Alert';
import { AppHeader, type LogoutHandler } from './AppHeader';
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

function PrivateAreaContent() {
  const me = useMe();
  const logout = useLogout();
  useReloadWhenRestoredFromCache();

  // Plan §4.1: mientras se comprueba la sesión (o se redirige, D-10) no se ve nada.
  if (!me.isSuccess) return <p className="sr-only">Cargando…</p>;

  // Spec 004 E-12: el menú de cuenta se cierra si falla (onError de esta llamada).
  const onLogout: LogoutHandler = (callbacks) =>
    logout.mutate(undefined, { onError: callbacks?.onError });
  const logoutError = logout.isError ? messageForError(logout.error) : undefined;

  return (
    <>
      {/* RF-015. Spec 004 RF-006, RF-007: email y «Cerrar sesión» en la cabecera. */}
      <AppHeader email={me.data.email} loggingOut={logout.isPending} onLogout={onLogout} />
      <main className="mx-auto flex max-w-420 flex-col gap-6 px-4 py-8 md:px-7">
        {/* D-11: si no se ha podido cerrar la sesión, se avisa y se sigue dentro. Spec 004 RF-008:
            debajo de la cabecera. RNF-001: la zona de alerta está siempre y solo cambia su contenido
            (ver LoginForm). */}
        <div role="alert" className="empty:sr-only">
          {logoutError && <Alert tone={logoutError.tone}>{logoutError.text}</Alert>}
        </div>
        {/* Spec 004 RF-024: el título de la vista es el encabezado principal. */}
        <h1 className="text-display text-balance">Mis tareas</h1>
      </main>
    </>
  );
}

export const PrivateArea = withQueryClient(PrivateAreaContent, { requireSession: true });
