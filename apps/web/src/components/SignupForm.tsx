import { signupInputSchema } from '@todo/shared';
import { useRedirectIfSignedIn, useSignup } from '../lib/auth-queries';
import { useCredentialsForm } from '../lib/credentials-form';
import { FormField } from './FormField';
import { withQueryClient } from './withQueryClient';

const IDS = { email: 'signup-email', password: 'signup-password' };

function SignupFormContent() {
  const me = useRedirectIfSignedIn();
  const signup = useSignup();
  const form = useCredentialsForm({ ids: IDS, schema: signupInputSchema, submit: signup.mutate });

  // Plan §4.1: mientras se comprueba la sesión (o se redirige) no se ve nada.
  if (me.isPending || me.isSuccess) return <p className="sr-only">Cargando…</p>;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
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
          autoComplete="new-password"
          value={form.password}
          onChange={form.setPassword}
          error={form.fieldErrors.password}
        />
        {form.formError && (
          <p role="alert" className="text-red-700">
            {form.formError}
          </p>
        )}
        {/* E-8: un solo envío a la vez. */}
        <button
          type="submit"
          disabled={signup.isPending}
          className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}

export const SignupForm = withQueryClient(SignupFormContent);
