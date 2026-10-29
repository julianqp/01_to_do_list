import { useState, type FormEvent } from 'react';
import { messageForError, type FormMessage } from './messages';

type Field = 'email' | 'password';
export type FieldErrors = Partial<Record<Field, string>>;

type Issue = { path: readonly PropertyKey[]; message: string };
// La forma de `safeParse` de los esquemas de `shared`, sin depender de `zod` desde `web`.
type CredentialsSchema<T> = {
  safeParse: (
    value: unknown,
  ) => { success: true; data: T } | { success: false; error: { issues: readonly Issue[] } };
};

const FIELDS: Field[] = ['email', 'password'];

// El primer mensaje de cada campo (el esquema da uno solo por campo, T-024).
function fieldErrorsOf(issues: readonly Issue[]) {
  const errors: FieldErrors = {};
  for (const { path, message } of issues) {
    const field = FIELDS.find((name) => name === path[0]);
    if (field && !errors[field]) errors[field] = message;
  }
  return errors;
}

// RNF-001: el foco va al primer campo con error (los inputs llevan `name` = `id`, ver FormField).
function focusFirstError(form: HTMLFormElement, ids: Record<Field, string>, errors: FieldErrors) {
  const field = FIELDS.find((name) => errors[name]);
  if (field) (form.elements.namedItem(ids[field]) as HTMLInputElement | null)?.focus();
}

// Estado y envío de los formularios de registro e inicio de sesión.
// - D-7: valida con el esquema de `shared` antes de enviar.
// - Error de un campo (RF-004): junto al campo y con el foco en él.
// - Error del formulario (RF-009, RF-010, CA-2.5): aviso general; se conserva el email y se vacía la contraseña.
export function useCredentialsForm<T>({
  ids,
  schema,
  submit,
}: {
  ids: Record<Field, string>;
  schema: CredentialsSchema<T>;
  submit: (input: T, options: { onError: (error: Error) => void }) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormMessage>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(undefined);
    const result = schema.safeParse({ email, password });
    if (!result.success) {
      const errors = fieldErrorsOf(result.error.issues);
      setFieldErrors(errors);
      focusFirstError(form, ids, errors);
      return;
    }
    setFieldErrors({});
    submit(result.data, {
      onError: (error) => {
        const message = messageForError(error);
        if (message.field) {
          const errors = { [message.field]: message.text };
          setFieldErrors(errors);
          focusFirstError(form, ids, errors);
          return;
        }
        setFormError(message);
        setPassword('');
      },
    });
  }

  return { email, setEmail, password, setPassword, fieldErrors, formError, handleSubmit };
}
