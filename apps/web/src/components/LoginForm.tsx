import { loginInputSchema } from '@todo/shared';
import { useLogin, useRedirectIfSignedIn } from '../lib/auth-queries';
import { useCredentialsForm } from '../lib/credentials-form';
import { messageFor } from '../lib/messages';
import { FormField } from './FormField';
import { withQueryClient } from './withQueryClient';

const IDS = { email: 'login-email', password: 'login-password' };

function LoginFormContent() {
  const me = useRedirectIfSignedIn();
  const login = useLogin();
  const form = useCredentialsForm({ ids: IDS, schema: loginInputSchema, submit: login.mutate });

  // Plan §4.1: mientras se comprueba la sesión (o se redirige) no se ve nada.
  if (me.isPending || me.isSuccess) return <p className="sr-only">Cargando…</p>;

  // RF-013: la zona privada llega aquí con ?expired=1 cuando la sesión ha caducado (D-10).
  const expired = new URLSearchParams(location.search).get('expired') === '1';

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
      {expired && <p role="status">{messageFor('SESSION_EXPIRED').text}</p>}
      {/* D-12: sin los globos de validación del navegador. */}
      <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-4">
        <FormField
          id={IDS.email}
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={form.setEmail}
          error={form.fieldErrors.email}
        />
        <FormField
          id={IDS.password}
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={form.setPassword}
          error={form.fieldErrors.password}
        />
        {/* RF-009, RF-010. RNF-001: la zona de alerta está siempre y solo cambia el texto; VoiceOver no
            anuncia una que se inserta ya con él. Vacía, `sr-only` evita el hueco del `gap`. */}
        <p role="alert" className="text-red-700 empty:sr-only">
          {form.formError}
        </p>
        <button
          type="submit"
          disabled={login.isPending}
          className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Iniciar sesión
        </button>
      </form>
      {/* RF-019, D-19: navegación que elige el usuario, con entrada en el historial. */}
      <p>
        ¿No tienes cuenta?{' '}
        <a
          href="/signup"
          className="font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Crear cuenta
        </a>
      </p>
    </main>
  );
}

export const LoginForm = withQueryClient(LoginFormContent);
