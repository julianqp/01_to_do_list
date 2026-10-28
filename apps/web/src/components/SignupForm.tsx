import { signupInputSchema } from '@todo/shared';
import { useState, type FormEvent } from 'react';
import { useRedirectIfSignedIn, useSignup } from '../lib/auth-queries';
import { messageForError } from '../lib/messages';
import { FormField } from './FormField';
import { withQueryClient } from './withQueryClient';

type Field = 'email' | 'password';
type FieldErrors = Partial<Record<Field, string>>;

const IDS: Record<Field, string> = { email: 'signup-email', password: 'signup-password' };
const FIELDS: Field[] = ['email', 'password'];

// El primer mensaje de cada campo (el esquema da uno solo por campo, T-024).
function fieldErrorsOf(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: FieldErrors = {};
  for (const { path, message } of issues) {
    const field = FIELDS.find((name) => name === path[0]);
    if (field && !errors[field]) errors[field] = message;
  }
  return errors;
}

// RNF-001: el foco va al primer campo con error.
function focusFirstError(form: HTMLFormElement, errors: FieldErrors) {
  const field = FIELDS.find((name) => errors[name]);
  if (field) (form.elements.namedItem(IDS[field]) as HTMLInputElement | null)?.focus();
}

function SignupFormContent() {
  const me = useRedirectIfSignedIn();
  const signup = useSignup();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();

  // Plan §4.1: mientras se comprueba la sesión (o se redirige) no se ve nada.
  if (me.isPending || me.isSuccess) return <p className="sr-only">Cargando…</p>;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(undefined);
    // D-7: el front valida con el mismo esquema que la API.
    const result = signupInputSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = fieldErrorsOf(result.error.issues);
      setFieldErrors(errors);
      focusFirstError(form, errors);
      return;
    }
    setFieldErrors({});
    signup.mutate(result.data, {
      onError: (error) => {
        const message = messageForError(error);
        // RF-004: el email duplicado se muestra junto al campo.
        if (message.field) {
          const errors = { [message.field]: message.text };
          setFieldErrors(errors);
          focusFirstError(form, errors);
          return;
        }
        // RF-010: se conserva el email y se vacía la contraseña.
        setFormError(message.text);
        setPassword('');
      },
    });
  }

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      {/* D-12: sin los globos de validación del navegador. */}
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          id={IDS.email}
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
        />
        <FormField
          id={IDS.password}
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
        />
        {formError && (
          <p role="alert" className="text-red-700">
            {formError}
          </p>
        )}
        {/* E-8: un solo envío a la vez. */}
        <button
          type="submit"
          disabled={signup.isPending}
          className="rounded bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          Crear cuenta
        </button>
      </form>
    </main>
  );
}

export const SignupForm = withQueryClient(SignupFormContent);
