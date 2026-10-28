import { useEffect } from 'react';
import { useLogout, useMe } from '../lib/auth-queries';
import { messageForError } from '../lib/messages';
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

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Mis tareas</h1>
        <div className="flex items-center gap-4">
          {/* RF-015 */}
          <p>{me.data.email}</p>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded border border-gray-900 px-4 py-2 font-medium disabled:opacity-60"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      {/* D-11: si no se ha podido cerrar la sesión, se avisa y se sigue dentro. */}
      {logout.isError && (
        <p role="alert" className="text-red-700">
          {messageForError(logout.error).text}
        </p>
      )}
    </main>
  );
}

export const PrivateArea = withQueryClient(PrivateAreaContent, { requireSession: true });
