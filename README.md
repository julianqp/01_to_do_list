# To-do list

App personal de tareas con varios usuarios. Monorepo con pnpm:

- `apps/web`: front con Astro, islas React y Tailwind.
- `apps/api`: API con Express 5, Prisma y PostgreSQL.
- `packages/shared`: esquemas Zod, tipos y catálogo de errores que usan los dos.

Las specs, los planes y las tareas están en [`specs/`](specs/). Las decisiones de arquitectura, en [`docs/adr/`](docs/adr/).

## Requisitos

- Node 24 (la versión exacta está en `.nvmrc` y en `engines`).
- Corepack, que viene con Node. Instala la versión de pnpm que fija `packageManager`.
- Docker con Docker Compose, para el Postgres local.
- Para los tests E2E, además, Google Chrome instalado ([plan D-18](specs/001-cuentas-de-usuario/plan.md)).

## Arranque

```sh
corepack enable
pnpm i
cp .env.example .env    # cambia la contraseña en POSTGRES_PASSWORD y en DATABASE_URL
pnpm db:up              # Postgres 18 con las bases todo y todo_test
pnpm db:migrate         # aplica las migraciones a la base todo
pnpm dev                # API en :3000 y front en :4321
```

Abre **https://localhost:4321**. Sin sesión, la app te lleva al formulario de inicio de sesión. Desde `/signup` puedes crear una cuenta.

`pnpm dev` arranca la API y el front a la vez. `Ctrl+C` para los dos.

### Aviso del certificado

En desarrollo, el front se sirve por HTTPS con un certificado autofirmado. Sin HTTPS, Safari no guarda la cookie de sesión `Secure` ([ADR-0001](docs/adr/0001-https-en-desarrollo-local.md)). La primera vez, cada navegador avisa de que la conexión no es privada:

- **Chrome / Edge:** «Configuración avanzada» → «Acceder a localhost (sitio no seguro)».
- **Safari:** «Mostrar detalles» → «visitar este sitio web».

La API (`http://localhost:3000`) no se abre directamente: el front la llama por `/api` a través del proxy del servidor de desarrollo.

## Tests y comprobaciones

Los tests necesitan el Postgres levantado (`pnpm db:up`). Usan la base `todo_test` y la vacían en cada test, así que no tocan tus datos de `todo`.

| Comando          | Qué hace                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`      | Vitest: unitarios (`shared`, `api`), integración de la API con Supertest contra `todo_test` y componentes React con Testing Library |
| `pnpm test:e2e`  | Playwright: el flujo principal en Chromium, Google Chrome y WebKit. Arranca sus propios servidores contra `todo_test`               |
| `pnpm lint`      | ESLint y Prettier                                                                                                                   |
| `pnpm typecheck` | TypeScript en todos los paquetes y `astro check`                                                                                    |

Antes del primer `pnpm test:e2e`, instala los navegadores de Playwright:

```sh
pnpm exec playwright install chromium webkit
```

`pnpm test:e2e` falla si ya hay un `pnpm dev` abierto (puertos 4321 y 3000): ese servidor usa la base `todo`, y Playwright no lo reutiliza. Ciérralo antes.
