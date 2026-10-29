import { signupInputSchema } from '@todo/shared';
import { useRedirectIfSignedIn, useSignup } from '../lib/auth-queries';
import { useCredentialsForm } from '../lib/credentials-form';
import { Alert } from './Alert';
import { AuthCard } from './AuthCard';
import { Button } from './Button';
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
    <AuthCard
      title="Crear cuenta"
      footer={
        // RF-019, D-19: navegación que elige el usuario, con entrada en el historial.
        // Spec 004 RF-012: zona de pulsación de 44 px de alto.
        <>
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="inline-flex min-h-11 items-center text-1 underline">
            Iniciar sesión
          </a>
        </>
      }
    >
      {/* RF-010. RNF-001: la zona de alerta está siempre y solo cambia su contenido (ver LoginForm).
          Spec 004 RF-003, RF-004: encima de los campos. */}
      <div role="alert" className="empty:sr-only">
        {form.formError && <Alert tone={form.formError.tone}>{form.formError.text}</Alert>}
      </div>
      {/* D-12: sin los globos de validación del navegador. */}
      <form noValidate onSubmit={form.handleSubmit} className="flex flex-col gap-5">
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
        {/* E-8, spec 004 RF-013 y D-9: un solo envío a la vez, sin perder el foco. */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          type="submit"
          loading={signup.isPending}
          loadingLabel="Creando cuenta…"
        >
          Crear cuenta
        </Button>
      </form>
    </AuthCard>
  );
}

export const SignupForm = withQueryClient(SignupFormContent);
