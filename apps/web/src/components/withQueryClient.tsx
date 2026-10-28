import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ComponentType } from 'react';
import { ApiError } from '../lib/api';

const MAX_RETRIES = 3;

// D-10: reintentar un 401 retrasaría la redirección; solo se reintentan los errores de red.
const retry = (failureCount: number, error: Error) =>
  !(error instanceof ApiError) && failureCount < MAX_RETRIES;

// D-10, RF-012, RF-013: en la zona privada, una sesión que no vale lleva al inicio de sesión.
function redirectIfSignedOut(error: Error) {
  if (!(error instanceof ApiError)) return;
  if (error.code === 'UNAUTHENTICATED') location.replace('/login');
  if (error.code === 'SESSION_EXPIRED') location.replace('/login?expired=1');
}

function createQueryClient(requireSession: boolean) {
  const onError = requireSession ? redirectIfSignedOut : undefined;
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: { queries: { retry } },
  });
}

// Astro monta cada isla por separado: cada una trae su propio QueryClient, creado en cada montaje (D-10).
export function withQueryClient<P extends object>(
  Component: ComponentType<P>,
  { requireSession = false }: { requireSession?: boolean } = {},
) {
  function WithQueryClient(props: P) {
    const [client] = useState(() => createQueryClient(requireSession));
    return (
      <QueryClientProvider client={client}>
        <Component {...props} />
      </QueryClientProvider>
    );
  }
  WithQueryClient.displayName = `withQueryClient(${Component.displayName ?? Component.name})`;
  return WithQueryClient;
}
