---
spec: 001
plan_aprobado: 2026-10-28
progreso: 9/41
---

# Tareas · Spec 001 · Cuentas de usuario

> Reglas:
> - Una tarea = 15 min a 2 h = un commit.
> - Orden de ejecución de arriba abajo, respetando "Depende de".
> - `[P]` = se puede hacer en paralelo con otras `[P]` de la misma fase (no tocan los mismos ficheros).
> - Al terminar: marcar `[x]`, actualizar `progreso` y anotar el commit.
>
> Convenciones de esta spec:
> - **Dependencias:** todas se instalan en la fase 1, con las versiones de research R-3. Desde la fase 2 ninguna tarea toca `package.json` ni `pnpm-lock.yaml`, así que las `[P]` no chocan en el lockfile.
> - **Nombres de test:** cada `it(...)` empieza por el ID que verifica (`'CA-1.2 …'`, `'E-8 …'`, `'D-13 …'`). Así la trazabilidad se puede comprobar con `grep` (T-039) y en `/sdd-verificar`.
> - **Test primero y C-19:** de T-013 a T-035 rige la excepción temporal a C-19 registrada en [plan.md §3](plan.md#3-comprobación-de-constitución).
> - **Postgres:** `pnpm test` y `pnpm test:e2e` necesitan `pnpm db:up` (plan §7).

## Fase 1 · Preparación

Secuencial: todas las tareas tocan el `package.json` raíz o el lockfile. Al final de la fase, el esqueleto está en verde antes de cualquier funcionalidad (riesgo de versiones, plan §8).

- [x] **T-001** Crear la raíz del monorepo con versiones fijadas
  - Ficheros: `package.json` (`engines.node` `^24.19.0`, `packageManager` `pnpm@11.20.0`, script `typecheck` = `pnpm -r typecheck`, devDeps `typescript@6.0.3` y `@types/node`), `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `.npmrc` (`engine-strict=true`), `.nvmrc` (`24`), `.gitignore` (`node_modules`, `.env`, `apps/api/src/generated/`, salidas de Astro y Playwright), `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`)
  - Cubre: C-1, C-2, C-3, C-15 (`.env` ignorado)
  - Hecho cuando: `corepack enable && pnpm install` termina sin errores con Node 24.19; `pnpm typecheck` termina con 0; `git check-ignore .env` lo confirma como ignorado

- [x] **T-002** Configurar ESLint y Prettier
  - Depende de: T-001
  - Ficheros: `eslint.config.js` (flat: `@eslint/js`, typescript-eslint con `no-explicit-any` en `error`, eslint-plugin-astro, eslint-plugin-react-hooks), `.prettierrc` (con prettier-plugin-astro), `.prettierignore`, `package.json` (script `lint`, devDeps)
  - Cubre: C-25, C-1
  - Hecho cuando: `pnpm lint` termina con 0; un fichero temporal con `const x: any = 1` hace fallar `pnpm lint` (se comprueba y se borra)

- [x] **T-003** Crear el paquete `shared` y la configuración raíz de Vitest
  - Depende de: T-001
  - Ficheros: `packages/shared/package.json` (`@todo/shared`, `"exports": { ".": "./src/index.ts" }`, dependencia `zod@4.6.7`, script `typecheck`), `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`, `vitest.config.ts` (proyecto `shared`), `package.json` (script `test`, devDep `vitest@5.0.5`)
  - Cubre: C-10, C-18, D-6 (ADR-0002)
  - Hecho cuando: `pnpm test` termina con 0 sin tests (`passWithNoTests`); `pnpm typecheck` incluye `shared` y pasa; `packages/shared/package.json` solo depende de `zod`

- [x] **T-004** Crear el esqueleto de la API con el entorno validado
  - Depende de: T-003
  - Ficheros: `apps/api/package.json` (`express@5.3.0`, `zod`, `@todo/shared: workspace:*`; dev: `tsx`, `@types/express`, `supertest`, `@types/supertest`; scripts `dev` con `tsx watch --env-file`, `typecheck`), `apps/api/tsconfig.json`, `apps/api/src/config/env.ts` (`DATABASE_URL`, `PORT`, `NODE_ENV` con Zod), `apps/api/src/config/env.test.ts`, `apps/api/src/app.ts` (`createApp()` con `express.json()`), `apps/api/src/server.ts`, `.env.example`, `vitest.config.ts` (proyecto `api`)
  - Cubre: C-5, C-8, C-15
  - Hecho cuando: `env.test.ts` pasa (entorno válido → objeto tipado; `DATABASE_URL` ausente o `PORT` no numérico → error); con `.env` copiado de `.env.example`, `pnpm --filter api dev` escucha en `http://localhost:3000`; sin `DATABASE_URL` el proceso sale con código ≠ 0

- [x] **T-005** Levantar Postgres local con las bases de desarrollo y de test
  - Depende de: T-001
  - Ficheros: `docker-compose.yml` (Postgres 18, contraseña leída de `.env`), `docker/init-test-db.sql` (crea `todo_test`), `package.json` (script `db:up`), `.env.example` (variables de Postgres sin valores reales)
  - Cubre: C-5, C-15
  - Hecho cuando: `pnpm db:up` deja el contenedor sano y `docker compose exec db psql -U <usuario> -l` muestra `todo` y `todo_test`

- [x] **T-006** Crear el esquema de Prisma y la migración inicial
  - Depende de: T-004, T-005
  - Ficheros: `apps/api/prisma/schema.prisma` (modelos `User` y `Session` de plan §4.2, generador `prisma-client` en `src/generated/prisma`), `apps/api/prisma.config.ts`, `apps/api/prisma/migrations/<timestamp>_auth_init/migration.sql`, `apps/api/src/repositories/prisma.ts` (cliente con `@prisma/adapter-pg`), `apps/api/package.json` (`prisma`, `@prisma/client`, `@prisma/adapter-pg` en 7.10.1; script `postinstall` = `prisma generate`), `package.json` (script `db:migrate`)
  - Cubre: C-5, C-16, RNF-003
  - Hecho cuando: `pnpm db:migrate` crea las tablas `User` y `Session` en `todo`; la migración está commiteada; borrar `src/generated/` y ejecutar `pnpm install` lo regenera; `pnpm typecheck` pasa

- [x] **T-007** Montar la infraestructura de tests de integración de la API
  - Depende de: T-006
  - Ficheros: `apps/api/test/global-setup.ts` (`prisma migrate deploy` sobre `todo_test`; si Postgres no responde, falla con "ejecuta `pnpm db:up`"), `apps/api/test/setup.ts` (`TRUNCATE "Session", "User"` antes de cada test), `apps/api/test/helpers.ts` (extraer `sid` de `Set-Cookie` y enviarla en `Cookie`), `vitest.config.ts` (proyecto `api` con `fileParallelism: false` y `DATABASE_URL` de test)
  - Cubre: C-18, plan §7
  - Hecho cuando: con Postgres levantado, `pnpm test` aplica la migración en `todo_test` y termina con 0; con Postgres parado, falla mostrando el mensaje de `pnpm db:up`

- [x] **T-008** Crear el esqueleto del front con HTTPS y proxy a la API
  - Depende de: T-002, T-004
  - Ficheros: `apps/web/package.json` (`astro@7.4.3`, `@astrojs/react`, `react`/`react-dom@19.3.1`, `@tanstack/react-query`, `tailwindcss`/`@tailwindcss/vite@4.3.3`, `@todo/shared`; dev: `@astrojs/check`, `@vitejs/plugin-basic-ssl`, `@types/react`, `@types/react-dom`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`; script `typecheck` con `astro check`), `apps/web/tsconfig.json`, `apps/web/astro.config.mjs` (React, Tailwind, `basicSsl()`, proxy `/api` → `http://localhost:3000`), `apps/web/src/layouts/Layout.astro` (`lang="es"`), `apps/web/src/styles/global.css`, `apps/web/src/pages/{index,login,signup}.astro` (solo el layout), `vitest.config.ts` (proyecto `web` con jsdom), `package.json` (script `dev` que arranca api y web)
  - Cubre: C-4, C-7, D-1 (ADR-0001)
  - Hecho cuando: `pnpm dev` sirve `https://localhost:4321/`, `/login` y `/signup`; `curl -k https://localhost:4321/api/cualquiera` recibe la respuesta de Express (no la de Astro); `pnpm typecheck` ejecuta `astro check` y pasa

- [x] **T-009** Configurar Playwright y dejar el esqueleto en verde
  - Depende de: T-007, T-008
  - Ficheros: `playwright.config.ts` (proyectos `chromium`, `firefox`, `webkit`; `baseURL` `https://localhost:4321`; `ignoreHTTPSErrors: true`; `webServer` = `pnpm dev` con `DATABASE_URL` de `todo_test`), `e2e/.gitkeep`, `package.json` (script `test:e2e`, devDep `@playwright/test@1.64.1`)
  - Cubre: C-18, RNF-004, D-1
  - Hecho cuando: `pnpm exec playwright install` instala los tres motores; `pnpm test:e2e` arranca los servidores y termina con 0 sin tests; `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

## Fase 2 · Contratos y tests (primero en rojo)

- [ ] **T-010** Definir el catálogo de errores y los tipos de autenticación en `shared`
  - Depende de: T-003
  - Ficheros: `packages/shared/src/errors.ts` (`ERROR_CODES`, `ErrorCode`, `ApiErrorBody` de plan §4.2), `packages/shared/src/auth.ts` (`PublicUser`; `emailSchema`, `passwordSchema`, `signupInputSchema`, `loginInputSchema` exportados con su forma, aún sin reglas; `SignupInput`, `LoginInput`), `packages/shared/src/index.ts`
  - Cubre: C-9, C-10, RNF-002 (`PublicUser` = solo `id` y `email`)
  - Hecho cuando: `pnpm typecheck` y `pnpm lint` pasan; `index.ts` reexporta todo lo anterior

- [ ] **T-011** [P] Definir las firmas de la API como stubs
  - Depende de: T-010
  - Ficheros: `apps/api/src/errors.ts` (`AppError` con `code` y `status`, completo), `apps/api/src/services/{auth.service,password,session-token}.ts`, `apps/api/src/repositories/{user.repository,session.repository}.ts`, `apps/api/src/routes/session-cookie.ts` (`readCookie` y escritura/borrado de `sid`) — firmas de plan §4.3 que lanzan `Error('not implemented')`
  - Cubre: C-8, plan §4.3
  - Hecho cuando: `pnpm typecheck` y `pnpm lint` pasan; solo `repositories/*` importa `generated/prisma`

- [ ] **T-012** [P] Definir las firmas del cliente web como stubs
  - Depende de: T-010
  - Ficheros: `apps/web/src/lib/api.ts` (`ApiError`, `NetworkError`, `apiFetch` con la firma de §4.3), `apps/web/src/lib/messages.ts`, `apps/web/src/components/{FormField,SignupForm,LoginForm,PrivateArea}.tsx` (props de §4.3, devuelven `null`)
  - Cubre: plan §4.3
  - Hecho cuando: `pnpm typecheck` y `pnpm lint` pasan

- [ ] **T-013** [P] Escribir los tests unitarios de los esquemas de email y contraseña
  - Depende de: T-010
  - Ficheros: `packages/shared/src/auth.test.ts`
  - Cubre: RF-003, RF-005, RF-006, RF-007, CA-1.3, CA-1.4, CA-1.5, E-1, E-2, E-3, E-4, E-10
  - Casos: `"  ANA@Example.com "` → `ana@example.com`; `ana@` y `ñandú@correo.es` → "Introduce un email válido"; email de 254 válido y de 255 → "El email no puede tener más de 254 caracteres"; contraseña de 7 y 129 → "La contraseña debe tener entre 8 y 128 caracteres", 8 y 128 válidas; `"  a ñ 😀 b  "` de longitud válida se acepta sin cambios y el emoji cuenta 1; `""` y `"   "` → "Este campo es obligatorio" en los dos campos y en los dos esquemas (signup y login); `loginInputSchema` no aplica límites de longitud ni formato
  - Hecho cuando: los tests existen y fallan porque los esquemas aún no tienen reglas

- [ ] **T-014** [P] Escribir los tests unitarios de contraseña, token y cookie
  - Depende de: T-011
  - Ficheros: `apps/api/src/services/password.test.ts`, `apps/api/src/services/session-token.test.ts`, `apps/api/src/routes/session-cookie.test.ts`
  - Cubre: RNF-002, C-12, D-2, D-4, D-5
  - Casos: `hashPassword` devuelve PHC `$argon2id$v=19$m=19456,t=2,p=1$…`, no contiene la contraseña y da hashes distintos para la misma entrada; `verifyPassword` acierta con la correcta y falla con otra; el token tiene 32 bytes en base64url y su hash es SHA-256 en hex; `readCookie` encuentra `sid` entre varias cookies y devuelve `undefined` si no está o no hay cabecera
  - Hecho cuando: los tests existen y fallan con `not implemented`

- [ ] **T-015** [P] Escribir los tests de integración del registro
  - Depende de: T-007, T-011
  - Ficheros: `apps/api/test/auth.signup.test.ts`
  - Cubre: CA-1.1, CA-1.2, RF-001, RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-016, E-8, RNF-002, C-12
  - Casos: signup válido → 201, `{ user }` con exactamente `id` y `email`, usuario en BD y `/me` con la cookie → 200; `Set-Cookie` con `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` y `Max-Age=2592000`; `ANA@Example.com ` con `ana@example.com` ya registrado → 409 `EMAIL_ALREADY_REGISTERED` y sigue habiendo 1 usuario; email o contraseña no válidos o vacíos → 400 `VALIDATION_ERROR`; dos signup en paralelo con el mismo email → uno 201 y otro 409, 1 usuario en BD
  - Hecho cuando: los tests existen y fallan porque la ruta no existe (404)

- [ ] **T-016** [P] Escribir los tests de integración del inicio de sesión
  - Depende de: T-007, T-011
  - Ficheros: `apps/api/test/auth.login.test.ts`
  - Cubre: CA-2.1, CA-2.2, CA-2.3, CA-2.4, RF-003, RF-008, RF-009, E-4, RNF-002
  - Casos: login correcto → 200, `{ user }` con exactamente `id` y `email`, y cookie; `Ana@Example.com` → 200; contraseña incorrecta y email inexistente → mismo status 401 y mismo `code` `INVALID_CREDENTIALS`; cuenta registrada con `"  a ñ 😀 b  "` entra con esa misma contraseña; campos vacíos → 400
  - Hecho cuando: los tests existen y fallan porque la ruta no existe (404)

- [ ] **T-017** [P] Escribir los tests de integración de sesión, renovación y cierre
  - Depende de: T-007, T-011
  - Ficheros: `apps/api/test/auth.session.test.ts`
  - Cubre: CA-3.1, CA-4.1, CA-4.2, CA-5.2, CA-5.3, RF-011, RF-012, RF-013, RF-017, RF-018, E-5, E-6, E-9, RNF-003, D-3
  - Casos: `/me` sin cookie o con token desconocido → 401 `UNAUTHENTICATED`; `expiresAt` = ahora − 1 día → 401 `SESSION_EXPIRED` y la sesión se borra de BD; `expiresAt` = ahora + 1 día → 200, `expiresAt` ≈ ahora + 7 días y `Set-Cookie` renovada; logout → 204 con cookie borrada y `/me` con la misma cookie → 401; logout sin cookie → 204 (idempotente); dos logins (A y B), logout con A → `/me` con B → 200; al iniciar sesión se borran las sesiones caducadas de ese usuario; borrar un `User` borra sus `Session`
  - Hecho cuando: los tests existen y fallan porque las rutas no existen

- [ ] **T-018** [P] Escribir los tests de integración del formato de error y CSRF
  - Depende de: T-007, T-011
  - Ficheros: `apps/api/test/errors.test.ts`
  - Cubre: C-9, C-14, D-13, C-12
  - Casos: `GET /api/no-existe` → 404 `{ error: { code: 'NOT_FOUND', message } }`; JSON mal formado → 400 `VALIDATION_ERROR`; `POST /api/auth/logout` con cookie válida y `Content-Type: application/x-www-form-urlencoded` → 415 `UNSUPPORTED_MEDIA_TYPE` y después `/me` → 200; signup y login sin `application/json` → 415; error no controlado (`vi.spyOn` sobre un método del service) → 500 `INTERNAL_ERROR` y `console.error` no recibe el cuerpo de la petición
  - Hecho cuando: los tests existen y fallan por el formato de respuesta (Express por defecto)

- [ ] **T-019** [P] Escribir los tests unitarios de `apiFetch`
  - Depende de: T-012
  - Ficheros: `apps/web/src/lib/api.test.ts`
  - Cubre: RF-010, E-7, C-7, C-9, D-13
  - Casos: `fetch` que rechaza → `NetworkError`; respuesta 500 → error inesperado (mismo trato que red); 4xx con `{ error }` → `ApiError` con `code` y `status`; `POST` envía `Content-Type: application/json` y cuerpo `{}` si no hay datos; 204 → sin cuerpo; ruta relativa `/api/...`
  - Hecho cuando: los tests existen y fallan con `not implemented`

- [ ] **T-020** [P] Escribir los tests de componente del registro
  - Depende de: T-012
  - Ficheros: `apps/web/src/components/SignupForm.test.tsx`
  - Cubre: CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-4.3, RF-002, RF-004, RF-005, RF-006, RF-007, RF-010, RF-014, E-1, E-7, E-8, RNF-001
  - Casos (con `fetch` simulado y `location.replace` espiado): 201 → `location.replace('/')`; 409 → "Ya existe una cuenta con ese email" asociado al campo email (`aria-describedby`, `aria-invalid`); `ana@` → mensaje de formato junto al email y no se llama a `fetch`; contraseña de 7 → mensaje de longitud junto a la contraseña; los dos vacíos → "Este campo es obligatorio" en cada campo; tras un envío inválido el foco está en el primer campo con error; `fetch` que rechaza y respuesta 500 → "No se ha podido conectar. Inténtalo de nuevo", email conservado y contraseña vacía; el botón "Crear cuenta" queda `disabled` mientras se envía; `me` 200 → `location.replace('/')`; etiquetas visibles consultables por `getByLabelText`
  - Hecho cuando: los tests existen y fallan porque el componente devuelve `null`

- [ ] **T-021** [P] Escribir los tests de componente del inicio de sesión
  - Depende de: T-012
  - Ficheros: `apps/web/src/components/LoginForm.test.tsx`
  - Cubre: CA-2.1, CA-2.3, CA-2.4, CA-2.5, CA-4.2, CA-4.3, RF-007, RF-008, RF-009, RF-010, RF-013, RF-014, E-7, RNF-001
  - Casos: 200 → `location.replace('/')`; 401 `INVALID_CREDENTIALS` → "Email o contraseña incorrectos" con `role="alert"`, email conservado y contraseña vacía; campos vacíos → obligatorio en cada uno; red y 500 → mensaje de RF-010 con email conservado y contraseña vacía; con `?expired=1` → "Tu sesión ha caducado. Vuelve a iniciar sesión"; `me` 200 → `location.replace('/')`; foco en el primer campo con error
  - Hecho cuando: los tests existen y fallan porque el componente devuelve `null`

- [ ] **T-022** [P] Escribir los tests de componente de la zona privada
  - Depende de: T-012
  - Ficheros: `apps/web/src/components/PrivateArea.test.tsx`
  - Cubre: CA-3.1, CA-3.2, CA-4.1, CA-4.2, RF-011, RF-012, RF-013, RF-015, E-5, D-10, D-11
  - Casos: `me` 200 → muestra el email y el botón "Cerrar sesión"; `me` 401 `UNAUTHENTICATED` → `location.replace('/login')`; `me` 401 `SESSION_EXPIRED` → `location.replace('/login?expired=1')`; "Cerrar sesión" con 204 → `location.replace('/login')`; logout con red caída o 500 → mensaje de RF-010 y no redirige; evento `pageshow` con `persisted: true` → `location.reload()`; mientras `me` está pendiente solo hay "Cargando…" para lectores de pantalla
  - Hecho cuando: los tests existen y fallan porque el componente devuelve `null`

- [ ] **T-023** [P] Escribir los tests E2E del flujo principal
  - Depende de: T-009
  - Ficheros: `e2e/auth.spec.ts`
  - Cubre: CA-1.1, CA-2.2, CA-3.1, CA-3.2, CA-4.1, CA-4.3, CA-5.1, RF-002, RF-012, RF-014, RF-016, E-6, RNF-001, RNF-004
  - Tests separados (emails únicos por ejecución, todo con teclado): (1) `registro → zona privada` con el email visible; (2) flujo completo: registro → recargar → cerrar sesión → "atrás" muestra el login → login con mayúsculas → abrir `/login` con sesión lleva a la zona privada; (3) abrir `/` sin sesión → login; (4) contexto nuevo con el `storageState` guardado → entra directo; (5) dos páginas del mismo contexto, cerrar sesión en una y recargar la otra → login
  - Hecho cuando: los tests existen y `pnpm test:e2e` falla en el primer paso de cada uno (no hay formulario)

## Fase 3 · Núcleo

- [ ] **T-024** [P] Implementar los esquemas de email y contraseña
  - Depende de: T-013
  - Ficheros: `packages/shared/src/auth.ts`
  - Cubre: RF-003, RF-005, RF-006, RF-007, E-1, E-2, E-3, E-4, E-10, D-7
  - Hecho cuando: T-013 en verde (`pnpm vitest run --project shared`); mensajes en castellano según plan §4.2

- [ ] **T-025** [P] Implementar el hash y la verificación de contraseñas con argon2id nativo
  - Depende de: T-014
  - Ficheros: `apps/api/src/services/password.ts`
  - Cubre: RNF-002, C-12, D-4
  - Hecho cuando: `password.test.ts` en verde; sin dependencias nuevas (`crypto.argon2` y `timingSafeEqual`)

- [ ] **T-026** [P] Implementar el token de sesión y la cookie `sid`
  - Depende de: T-014
  - Ficheros: `apps/api/src/services/session-token.ts`, `apps/api/src/routes/session-cookie.ts`
  - Cubre: C-12, RF-016, D-2, D-3 (cookie de 30 días), D-5
  - Hecho cuando: `session-token.test.ts` y `session-cookie.test.ts` en verde

- [ ] **T-027** [P] Implementar los repositorios de usuarios y sesiones
  - Depende de: T-011
  - Ficheros: `apps/api/src/repositories/user.repository.ts`, `apps/api/src/repositories/session.repository.ts`
  - Cubre: RF-001, E-8, RNF-003, C-8, D-9 (P2002 → `null`)
  - Hecho cuando: `pnpm typecheck` y `pnpm lint` pasan; `grep -rl "generated/prisma" apps/api/src --include=*.ts` solo lista ficheros de `repositories/` (los tests de T-015–T-017 los ejercitan en T-029 y T-030)

- [ ] **T-028** [P] Implementar los middlewares transversales de la API
  - Depende de: T-018
  - Ficheros: `apps/api/src/routes/middleware/require-json.ts`, `apps/api/src/routes/middleware/validate-body.ts`, `apps/api/src/routes/middleware/error-handler.ts`, `apps/api/src/app.ts` (orden de montaje, 404 de `/api/*`)
  - Cubre: C-9, C-14, D-13, plan §9 (log sin cuerpo)
  - Hecho cuando: en `errors.test.ts` pasan los casos que no necesitan rutas de auth (404, JSON mal formado, 415 en signup/login/logout)

- [ ] **T-029** Implementar el registro y el inicio de sesión (service y rutas)
  - Depende de: T-015, T-016, T-024, T-025, T-026, T-027, T-028
  - Ficheros: `apps/api/src/services/auth.service.ts` (`signup`, `login`, limpieza de sesiones caducadas del usuario), `apps/api/src/routes/auth.routes.ts` (`POST /signup`, `POST /login` con `validateBody` y `Set-Cookie`), `apps/api/src/app.ts` (montar el router)
  - Cubre: RF-001, RF-002, RF-003, RF-004, RF-008, RF-009, E-4, E-8, D-3, D-8, D-9
  - Hecho cuando: `auth.signup.test.ts` y `auth.login.test.ts` en verde

- [ ] **T-030** Implementar la sesión, su renovación y el cierre (service y rutas)
  - Depende de: T-017, T-029
  - Ficheros: `apps/api/src/services/auth.service.ts` (`authenticate`, `logout`), `apps/api/src/routes/middleware/require-auth.ts` (usuario en `res.locals`), `apps/api/src/routes/auth.routes.ts` (`GET /me`, `POST /logout`)
  - Cubre: RF-011, RF-012, RF-013, RF-017, RF-018, E-5, E-6, E-9, C-13 (patrón `requireAuth`), D-3
  - Hecho cuando: `auth.session.test.ts` y `errors.test.ts` enteros en verde; `pnpm vitest run --project api` en verde

- [ ] **T-031** [P] Implementar `apiFetch` y los textos por código de error
  - Depende de: T-019
  - Ficheros: `apps/web/src/lib/api.ts`, `apps/web/src/lib/messages.ts`
  - Cubre: RF-004, RF-009, RF-010, RF-013, E-7, C-7, C-9, D-13
  - Hecho cuando: `api.test.ts` en verde; `messages.ts` da los textos exactos de la spec para `EMAIL_ALREADY_REGISTERED`, `INVALID_CREDENTIALS`, sesión caducada y error de conexión

## Fase 4 · Integración / UI

- [ ] **T-032** Montar el `QueryClient` y los hooks de autenticación
  - Depende de: T-031
  - Ficheros: `apps/web/src/components/withQueryClient.tsx` (con el `QueryCache`/`MutationCache` de D-10 para la zona privada), `apps/web/src/lib/auth-queries.ts` (`useMe`, `useLogin`, `useSignup`, `useLogout`)
  - Cubre: C-4, D-10, RF-012, RF-013
  - Hecho cuando: `pnpm typecheck` y `pnpm lint` pasan; ningún fichero de `apps/web/src` llama a `fetch` fuera de `lib/api.ts` ni usa `useEffect` para datos (`grep`); los tests de T-033 y T-034 lo ejercitan

- [ ] **T-033** [P] Implementar `FormField` y el formulario de registro
  - Depende de: T-020, T-024, T-032
  - Ficheros: `apps/web/src/components/FormField.tsx`, `apps/web/src/components/SignupForm.tsx`, `apps/web/src/pages/signup.astro` (isla `client:only="react"`)
  - Cubre: CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-4.3, RF-002, RF-004, RF-005, RF-006, RF-007, RF-010, RF-014, E-1, E-7, E-8, RNF-001, D-7, D-12
  - Hecho cuando: `SignupForm.test.tsx` en verde

- [ ] **T-034** [P] Implementar la zona privada
  - Depende de: T-022, T-032
  - Ficheros: `apps/web/src/components/PrivateArea.tsx` (incluye el listener de `pageshow`), `apps/web/src/pages/index.astro` (isla `client:only="react"`)
  - Cubre: CA-3.1, CA-3.2, CA-4.1, CA-4.2, RF-011, RF-012, RF-013, RF-015, E-5, D-10, D-11
  - Hecho cuando: `PrivateArea.test.tsx` en verde

- [ ] **T-035** Comprobar el registro de punta a punta a través del proxy
  - Depende de: T-023, T-030, T-033, T-034
  - Ficheros: ninguno (solo si hiciera falta ajustar `apps/web/astro.config.mjs`)
  - Cubre: RF-001, RF-002, CA-1.1, C-7, D-1 (riesgo "proxy y `Set-Cookie`", plan §8)
  - Hecho cuando: `pnpm test:e2e --project=chromium -g "registro → zona privada"` pasa. Si falla por el proxy o la cookie, se para y se avisa antes de seguir con la UI

- [ ] **T-036** Implementar el formulario de inicio de sesión
  - Depende de: T-021, T-033
  - Ficheros: `apps/web/src/components/LoginForm.tsx`, `apps/web/src/pages/login.astro` (isla `client:only="react"`)
  - Cubre: CA-2.1, CA-2.3, CA-2.4, CA-2.5, CA-4.2, CA-4.3, RF-007, RF-008, RF-009, RF-010, RF-013, RF-014, E-7, RNF-001, D-12
  - Hecho cuando: `LoginForm.test.tsx` en verde; `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde completos

## Fase 5 · Pulido y cierre

- [ ] **T-037** Poner en verde el E2E completo en los tres motores
  - Depende de: T-035, T-036
  - Ficheros: `e2e/auth.spec.ts` (solo ajustes de selectores o esperas); cualquier corrección de comportamiento en `apps/web` se anota en el Registro
  - Cubre: CA-2.2, CA-3.2, CA-4.1, CA-4.3, CA-5.1, RF-016, E-6, RNF-001 (solo teclado), RNF-004
  - Hecho cuando: `pnpm test:e2e` en verde en `chromium`, `firefox` y `webkit`

- [ ] **T-038** [P] Revisar la accesibilidad de formularios y zona privada
  - Depende de: T-036
  - Ficheros: `apps/web/src/components/{FormField,SignupForm,LoginForm,PrivateArea}.tsx` (solo clases y atributos si hace falta), `specs/001-cuentas-de-usuario/tasks.md` (Registro)
  - Cubre: RNF-001, C-20
  - Hecho cuando: anotado en el Registro: contraste de texto, errores y foco ≥ 4.5:1 medido con las herramientas del navegador; foco visible en todos los controles; con VoiceOver, al enviar con errores se anuncian los mensajes de cada campo y el de `role="alert"`; `pnpm test` sigue en verde

- [ ] **T-039** [P] Comprobar la trazabilidad de requisitos y casos límite en los tests
  - Depende de: T-037
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, E-1…E-10, todos los RF y CA
  - Hecho cuando: un `grep` en `**/*.test.ts(x)` y `e2e/` encuentra al menos un test por cada RF-001…RF-018, CA-1.1…CA-5.3 y E-1…E-10; `grep -r "not implemented" apps packages` no devuelve nada

- [ ] **T-040** [P] Escribir el README de arranque
  - Depende de: T-009
  - Ficheros: `README.md`
  - Cubre: C-3, D-1 (aviso del certificado autofirmado), plan §4.4
  - Hecho cuando: siguiendo el README en un clon limpio (`corepack enable`, `pnpm i`, `cp .env.example .env`, `pnpm db:up`, `pnpm db:migrate`, `pnpm dev`) se abre `https://localhost:4321` y se llega al formulario de inicio de sesión; explica `pnpm test` y `pnpm test:e2e`

- [ ] **T-041** Ejecutar `/sdd-verificar`
  - Depende de: T-037, T-038, T-039, T-040
  - Ficheros: `specs/001-cuentas-de-usuario/verificacion.md`
  - Cubre: todos (incluida la revisión manual del esquema de RNF-003)
  - Hecho cuando: el informe da APTO o APTO CON OBSERVACIONES y el Definition of Done está completo

## Cobertura

| ID | Tareas |
|----|--------|
| RF-001 | T-015, T-027, T-029, T-035 |
| RF-002 | T-015, T-020, T-023, T-029, T-033, T-035 |
| RF-003 | T-013, T-015, T-016, T-024, T-029 |
| RF-004 | T-015, T-020, T-029, T-031, T-033 |
| RF-005 | T-013, T-015, T-020, T-024, T-033 |
| RF-006 | T-013, T-015, T-020, T-024, T-033 |
| RF-007 | T-013, T-015, T-016, T-020, T-021, T-024, T-033, T-036 |
| RF-008 | T-016, T-021, T-029, T-036 |
| RF-009 | T-016, T-021, T-029, T-031, T-036 |
| RF-010 | T-019, T-020, T-021, T-022, T-031, T-033, T-036 |
| RF-011 | T-017, T-022, T-030, T-034 |
| RF-012 | T-017, T-022, T-023, T-030, T-032, T-034 |
| RF-013 | T-017, T-021, T-022, T-030, T-031, T-032, T-034, T-036 |
| RF-014 | T-020, T-021, T-023, T-033, T-036 |
| RF-015 | T-022, T-034 |
| RF-016 | T-015, T-023, T-026, T-037 |
| RF-017 | T-017, T-030 |
| RF-018 | T-017, T-030 |
| CA-1.1 | T-015, T-020, T-023, T-033, T-035 |
| CA-1.2 | T-015, T-020, T-033 |
| CA-1.3 | T-013, T-020, T-033 |
| CA-1.4 | T-013, T-020, T-033 |
| CA-1.5 | T-013, T-020, T-033 |
| CA-2.1 | T-016, T-021, T-036 |
| CA-2.2 | T-016, T-023, T-037 |
| CA-2.3 | T-016, T-021, T-036 |
| CA-2.4 | T-016, T-021, T-036 |
| CA-2.5 | T-021, T-036 |
| CA-3.1 | T-017, T-022, T-023, T-034 |
| CA-3.2 | T-022, T-023, T-034, T-037 |
| CA-4.1 | T-017, T-022, T-023, T-034, T-037 |
| CA-4.2 | T-017, T-021, T-022, T-034, T-036 |
| CA-4.3 | T-020, T-021, T-023, T-033, T-036, T-037 |
| CA-5.1 | T-023, T-037 |
| CA-5.2 | T-017, T-030 |
| CA-5.3 | T-017, T-030 |
| E-1 | T-013, T-020, T-024, T-033 |
| E-2 | T-013, T-024 |
| E-3 | T-013, T-024 |
| E-4 | T-013, T-016, T-024, T-029 |
| E-5 | T-017, T-022, T-030, T-034 |
| E-6 | T-017, T-023, T-030, T-037 |
| E-7 | T-019, T-020, T-021, T-031, T-033, T-036 |
| E-8 | T-015, T-020, T-027, T-029, T-033 |
| E-9 | T-017, T-030 |
| E-10 | T-013, T-024 |
| RNF-001 | T-020, T-021, T-023, T-033, T-036, T-037, T-038 |
| RNF-002 | T-010, T-014, T-015, T-016, T-025 |
| RNF-003 | T-006, T-017, T-027, T-041 |
| RNF-004 | T-009, T-023, T-037 |

## Registro

| Tarea | Commit | Notas |
|-------|--------|-------|
| T-001 | 3a67945 | `engineStrict: true` añadido en `pnpm-workspace.yaml` porque pnpm 11 ignora `engine-strict` de `.npmrc` (plan D-14). Volta da pnpm 11.20.0 en local sin `corepack enable`; comprobado que `corepack pnpm --version` respeta `packageManager` (11.20.0) |
| T-002 | e090a1a | `lint` = `eslint . && prettier --check .` (C-25 cubre los dos). `.prettierignore` excluye la documentación SDD (`specs/`, `docs/`, `.sdd/`, `.claude/`, `CLAUDE.md`). `@eslint/js` fijado en 10.0.1 (R-3 no lo listaba) |
| T-003 | bf0048b | `packages/shared/tsconfig.json` con `types: []`: el compilador rechaza `process` y cualquier API de Node en `shared` (C-10). `typescript` lo aporta la raíz; `shared` solo depende de `zod` |
| T-004 | cba92f0 | `env.ts` exporta `parseEnv(source)` (función pura); `server.ts` la llama con `process.env`. `allowBuilds` con `esbuild: false` en `pnpm-workspace.yaml` (plan D-15). Con un entorno no válido, `tsx src/server.ts` sale con código 1; en `pnpm --filter api dev` (`tsx watch`) se muestra el error y el vigilante sigue esperando cambios en vez de salir. Versiones no listadas en R-3: `tsx` 4.23.15, `@types/express` 5.0.6, `supertest` 7.3.1, `@types/supertest` 7.2.1 |
| T-005 | b962e04 | Imagen `postgres:18`, puerto publicado solo en `127.0.0.1`, volumen en `/var/lib/postgresql` (ruta que pide la imagen 18) y `healthcheck` con `pg_isready`. `db:up` = `docker compose up -d --wait`. Las credenciales usan `${VAR:?}`: sin `.env`, Compose falla diciendo qué variable falta. `init-test-db.sql` solo se ejecuta al crear el volumen |
| T-006 | 086123f | Migración `20261028191330_auth_init`. `prisma.config.ts` carga el `.env` de la raíz con `process.loadEnvFile` si existe (Prisma 7 no lo hace solo) y no pisa una `DATABASE_URL` ya definida (comprobado con `todo_test`). Sin `DATABASE_URL`, `prisma generate` funciona igual, así que el `postinstall` de un clon limpio no necesita `.env`. `allowBuilds`: `@prisma/engines` en `true` y `prisma` en `false` (plan D-15). pnpm 11 no ejecuta `postinstall` si las dependencias no han cambiado («Already up to date»): borrar solo `src/generated/` y ejecutar `pnpm install` no regenera el cliente, pero en un clon limpio (sin `node_modules`) sí; para regenerarlo a mano, `pnpm --filter @todo/api exec prisma generate` |
| T-007 | 0d99289 | La `DATABASE_URL` de test se saca de la del `.env` cambiando la base a `todo_test`, sin variable nueva; sin `.env`, `pnpm test` falla con "copia .env.example a .env". `global-setup.ts` comprueba por TCP que Postgres responde antes de `migrate deploy`. Vitest 5.0.5 pierde el mensaje de los errores de `globalSetup` (`code.charCodeAt is not a function` al formatear la traza), así que el mensaje de `pnpm db:up` se escribe también con `console.error`. Helper: `sidCookie(res)` devuelve `sid=<token>` o lanza si no hay cookie. `test/` añadido al `include` de `apps/api/tsconfig.json` para que pase por `typecheck`. Verificado con un test temporal (base `todo_test`, `TRUNCATE` entre tests, `sidCookie`), borrado al terminar |
| T-008 | d9c2cbc | `astro` 7.4.2 y `@astrojs/react` 7.1.1 en vez de 7.4.3 / 7.1.2 (plan D-16, R-3 actualizado). Añadido `@testing-library/dom` 10.4.2: es peer obligatorio de `@testing-library/react`. `dev` = `pnpm -r --parallel dev`. Títulos de página (la spec no los fija): "Mis tareas", "Iniciar sesión", "Crear cuenta". **Ojo T-009:** Astro 7 detecta si lo ejecuta un agente de IA (paquete `am-i-vibing`) y entonces arranca `astro dev` en segundo plano y su script termina; se desactiva definiendo `ASTRO_DEV_BACKGROUND`. En una terminal normal se queda en primer plano y `Ctrl+C` para web y api (comprobado). Verificado con ficheros temporales: `astro check` detecta errores en `.astro` y `.tsx`; el proyecto `web` de Vitest monta un componente con jsdom, Testing Library y `user-event` |
| T-009 | (pendiente) | `test:e2e` = `playwright test --pass-with-no-tests`. `reuseExistingServer: false`: un `pnpm dev` ya abierto usa la base de desarrollo, así que Playwright falla en vez de reutilizarlo. La URL de `todo_test` sale a `test-database-url.ts` en la raíz (la usan `vitest.config.ts` y `playwright.config.ts`, C-22); `--env-file` de la API no la pisa (comprobado). `apps/web` `dev` = `astro dev --ignore-lock` (plan D-17): sin eso, desde un agente quedaba un `astro dev` huérfano en el 4321. Spec temporal en los tres motores, borrado al terminar: Chromium y WebKit OK; **Firefox no arranca en este macOS 27.0.1** (riesgo añadido en plan §8, a resolver antes de T-023/T-037). Pendiente para T-023: ni `e2e/` ni los `*.config.ts` de la raíz pasan por `typecheck` (no hay `tsconfig` raíz) |
