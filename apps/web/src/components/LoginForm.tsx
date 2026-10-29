import { loginInputSchema } from '@todo/shared';
import { useLogin, useRedirectIfSignedIn } from '../lib/auth-queries';
import { useCredentialsForm } from '../lib/credentials-form';
import { messageFor } from '../lib/messages';
import { Alert } from './Alert';
import { AuthCard } from './AuthCard';
import { Button } from './Button';
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
  const expiredMessage = messageFor('SESSION_EXPIRED');

  return (
    <AuthCard
      title="Iniciar sesión"
      footer={
        // RF-019, D-19: navegación que elige el usuario, con entrada en el historial.
        // Spec 004 RF-012: zona de pulsación de 44 px de alto.
        <>
          ¿No tienes cuenta?{' '}
          <a href="/signup" className="inline-flex min-h-11 items-center text-1 underline">
            Crear cuenta
          </a>
        </>
      }
    >
      {/* Spec 004 RF-003, RF-004, D-14: los avisos van encima de los campos; primero el de sesión
          caducada (E-5). */}
      {expired && (
        <div role="status">
          <Alert tone={expiredMessage.tone}>{expiredMessage.text}</Alert>
        </div>
      )}
      {/* RF-009, RF-010. RNF-001: la zona de alerta está siempre y solo cambia su contenido; VoiceOver
          no anuncia una que se inserta ya con él. Vacía, `sr-only` evita el hueco del `gap`. */}
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
          autoComplete="current-password"
          value={form.password}
          onChange={form.setPassword}
          error={form.fieldErrors.password}
        />
        {/* Spec 004 RF-013, D-9: un solo envío a la vez, sin perder el foco. */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          type="submit"
          loading={login.isPending}
          loadingLabel="Iniciando sesión…"
        >
          Iniciar sesión
        </Button>
      </form>
    </AuthCard>
  );
}

export const LoginForm = withQueryClient(LoginFormContent);
