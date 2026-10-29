# Verificación · Spec 001 · 2026-10-29

Resultado: **APTO CON OBSERVACIONES**

Verifica la spec v2.0 en la rama `feat/001-cuentas-de-usuario` (50 commits sobre `master`, último `ac459af`), con el árbol de trabajo limpio.

Es la tercera verificación de hoy:
1. **NO APTO** (informe en `dc36256`). B-1 y B-2 se resolvieron con T-038 (`dc36256`, `351d649`); la I-2 de entonces (Firefox), con la spec v1.2.
2. **APTO CON OBSERVACIONES** (informe en `965202a`). Su I-1 (no había enlaces entre el inicio de sesión y el registro) se resolvió con la spec v2.0 (RF-019, CA-1.6, CA-2.6) y T-042 (`ac459af`).

Los identificadores de los problemas se mantienen de un informe a otro.

## Resumen

Los 19 RF, los 20 CA y los 10 casos límite tienen código y al menos un test que pasa. Las 49 IDs aparecen en el nombre de algún test: se comprobó con `vitest list` y `playwright test --list`.

| Comprobación | Resultado |
|--------------|-----------|
| `pnpm test` | ✅ 118/118 (13 ficheros: `shared`, `api` contra el Postgres `todo_test` y `web`) |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ `tsc` en todos los paquetes, `astro check` y `tsc -p tsconfig.json` de la raíz |
| `pnpm test:e2e` | ✅ 21/21 (7 tests × `chromium`, `chrome` y `webkit`) |
| `grep "not implemented"` en `apps` y `packages` | ✅ ninguno |
| Spec temporal de auditoría (borrado), en los 3 proyectos | ✅ los enlaces de RF-019 en negro sobre blanco (21:1), subrayados, con el contorno de foco `gray-900`, y «atrás» desde `/signup` vuelve a `/login` |

No hay bloqueantes. Quedan dos observaciones importantes, las dos aceptadas por el usuario en la spec v1.2:
- **I-2:** que los errores se anuncian a un lector de pantalla (RNF-001) solo se comprueba con un sustituto automático.
- **I-3:** de RNF-004, Edge y Safari solo se prueban a través de sus motores.

## Matriz de verificación

Leyenda de las columnas de test: U = unitario, I = integración de la API, C = componente, E = E2E. Todos los tests citados pasan. Las rutas de código y de test no llevan el prefijo del paquete.

| ID | Código | Test (fichero › nombre) | ¿Pasa? | Veredicto |
|----|--------|-------------------------|--------|-----------|
| RF-001 | `services/auth.service.ts:27` `signup`, `repositories/user.repository.ts:9` | I `auth.signup.test.ts` › «CA-1.1 RF-001 RF-002 crea la cuenta…» | ✅ | ✅ |
| RF-002 | `auth.service.ts:31` (`startSession`), `lib/auth-queries.ts:35` (`onSuccess` → `/`) | I idem; C `SignupForm.test.tsx` › «CA-1.1 RF-002 …»; E «CA-1.1 RF-002 RNF-001 registro → zona privada» | ✅ | ✅ |
| RF-003 | `shared/src/auth.ts:15` (`trim().toLowerCase()`, en registro e inicio de sesión) | U «RF-003 quita los espacios…»; I «RF-003 guarda el email…», «CA-2.2 RF-003 …» | ✅ | ✅ |
| RF-004 | D-9 en `user.repository.ts:13`, `auth.service.ts:30`, `lib/messages.ts:12` (`field: 'email'`) | I «CA-1.2 RF-003 RF-004 …»; C «CA-1.2 RF-004 E-8 …» | ✅ | ✅ |
| RF-005 | `shared/src/auth.ts:22` | U «CA-1.3», «E-2» ×2, «E-10»; C «CA-1.3 RF-005 E-1 …» | ✅ | ✅ |
| RF-006 | `shared/src/auth.ts:27` (puntos de código) | U «CA-1.4 E-3 …», «E-3 …»; C «CA-1.4 RF-006 …» | ✅ | ✅ |
| RF-007 | `shared/src/auth.ts:15-19` | U «E-1 RF-007 …» ×3; C «CA-1.5 RF-007 E-1 …» | ✅ | ✅ |
| RF-008 | `auth.service.ts:35` + `services/password.ts:39` | I «CA-2.1 RF-008 …»; C «CA-2.1 RF-008 …»; E flujo completo | ✅ | ✅ |
| RF-009 | `auth.service.ts:38` (un solo `INVALID_CREDENTIALS`), `messages.ts:13` | I «CA-2.3 CA-2.4 RF-009 …» (cuerpos idénticos); C «CA-2.3 CA-2.5 RF-009 …», «RNF-001 RF-009 … zona de alerta …» | ✅ | ✅ |
| RF-010 | `lib/api.ts:36-67`, `lib/credentials-form.ts:72-73`, `messages.ts:9` | U `api.test.ts` «RF-010 E-7 …» ×2; C «RF-010 E-7 …» en los dos formularios, «RNF-001 RF-010 … zona de alerta …» | ✅ | ✅ |
| RF-011 | `auth.service.ts:46`, `routes/auth.routes.ts:28`, `auth-queries.ts:51` | I «CA-3.1 RF-011 E-6 …», «RF-011 sin cookie → 204»; C «CA-3.1 RF-011 …»; E flujo completo | ✅ | ✅ |
| RF-012 | `middleware/require-auth.ts`, `components/withQueryClient.tsx:12` | I «CA-4.1 RF-012 …», «RF-012 con un token desconocido…»; C «CA-4.1 RF-012 …»; E «CA-4.1 RF-012 …» | ✅ | ✅ (con la API caída, ver M-3) |
| RF-013 | `auth.service.ts:58`, `withQueryClient.tsx:15`, `LoginForm.tsx:19-24` | I «CA-4.2 CA-5.2 RF-013 RF-017 E-5 …»; C «CA-4.2 RF-013 …» ×2, «RF-013 sin ?expired=1 …» | ✅ | ⚠️ falla un caso: cerrar sesión con la sesión ya caducada (M-4) |
| RF-014 | `auth-queries.ts:21` `useRedirectIfSignedIn` | C «CA-4.3 RF-014 …» ×2; E flujo completo (`/login` y `/signup` con sesión) | ✅ | ✅ |
| RF-015 | `components/PrivateArea.tsx:28-42` | C «RF-015 con sesión (me 200) muestra el email…» | ✅ | ✅ |
| RF-016 | `routes/session-cookie.ts:23` (`Max-Age` de 30 días) | I «RF-016 C-12 emite la cookie sid …»; E «CA-5.1 RF-016 …» | ✅ | ✅ |
| RF-017 | `auth.service.ts:58` | I «CA-4.2 CA-5.2 RF-013 RF-017 E-5 …» | ✅ | ✅ |
| RF-018 | `auth.service.ts:63`, `require-auth.ts:23` | I «CA-5.3 RF-018 D-3 …» | ✅ | ✅ |
| RF-019 | D-19: `LoginForm.tsx:58-67` (`href="/signup"`), `SignupForm.tsx:53-62` (`href="/login"`), dentro de la isla | C «CA-1.6 RF-019 ofrece ir al registro…», «CA-2.6 RF-019 ofrece ir al inicio de sesión…» (texto exacto de la spec), «RF-019 D-19 mientras se comprueba la sesión no hay enlace…» ×2; E «CA-1.6 RF-019 RNF-001 …», «CA-2.6 RF-019 RNF-001 …» | ✅ | ✅ |
| CA-1.1 | RF-001 + RF-002 + RF-015 | I, C, E (email visible tras registrarse) | ✅ | ✅ |
| CA-1.2 | RF-003 + RF-004 | I (`ANA@Example.com `), C | ✅ | ✅ |
| CA-1.3 | `emailSchema` | U, C (sin llamar a `fetch`) | ✅ | ✅ |
| CA-1.4 | `passwordSchema` | U, C | ✅ | ✅ |
| CA-1.5 | Esquemas | U, C | ✅ | ✅ |
| CA-1.6 | RF-019 | C; E con teclado: `/` sin sesión → inicio de sesión → «Crear cuenta» → registro → zona privada | ✅ | ✅ |
| CA-2.1 | RF-008 | I (sesión confirmada con `/me`), C | ✅ | ✅ |
| CA-2.2 | RF-003 | I, E (`email.toUpperCase()` con teclado) | ✅ | ✅ |
| CA-2.3 | RF-009 | I, C | ✅ | ✅ |
| CA-2.4 | RF-009 | I (mismo status y mismo cuerpo) | ✅ | ✅ |
| CA-2.5 | `credentials-form.ts:72-73` | C «CA-2.3 CA-2.5 RF-009 …» | ✅ | ✅ |
| CA-2.6 | RF-019 | C; E con teclado: `/signup` → «Iniciar sesión» → `/login` con el formulario | ✅ | ✅ |
| CA-3.1 | RF-011 | I, C, E | ✅ | ✅ |
| CA-3.2 | `location.replace` + `PrivateArea.tsx:8-16` (`pageshow`) | C «CA-3.2 D-10 …» ×2; E flujo completo («atrás» y escribir la dirección) | ✅ | ✅ |
| CA-4.1 | RF-012 | I, C, E | ✅ | ✅ |
| CA-4.2 | RF-013 | I, C | ✅ | ✅ |
| CA-4.3 | RF-014 | C ×2, E | ✅ | ✅ |
| CA-5.1 | RF-016 | E «CA-5.1 RF-016 …» (`storageState` en un contexto nuevo; la cookie tiene caducidad) | ✅ | ✅ |
| CA-5.2 | RF-017 | I (`expiresAt` = ahora − 1 día) | ✅ | ✅ |
| CA-5.3 | RF-018 | I (`expiresAt` = ahora + 1 día → se renueva a +7 días) | ✅ | ✅ |
| E-1 | `shared/src/auth.ts:15-19` | U ×3, C | ✅ | ✅ |
| E-2 | `emailSchema` | U 254 sí / 255 no | ✅ | ✅ |
| E-3 | `passwordSchema` | U 7 y 129 no / 8 y 128 sí | ✅ | ✅ |
| E-4 | `nonBlankPassword` sin `trim` | U ×2, I (login con `"  a ñ 😀 b  "`) | ✅ | ✅ |
| E-5 | D-10 | I, C | ✅ | ✅ |
| E-6 | Una sesión por cookie | I, E (dos pestañas) | ✅ | ✅ |
| E-7 | RF-010 | U, C | ✅ | ✅ |
| E-8 | D-9 + `disabled={signup.isPending}` | I (dos registros con `Promise.all`), C (botón desactivado) | ✅ | ✅ |
| E-9 | Una fila `Session` por inicio de sesión | I «E-9 cerrar sesión en un navegador no cierra la del otro» | ✅ | ✅ |
| E-10 | `z.email()` | U `ñandú@correo.es` | ✅ | ✅ |
| RNF-001 | `FormField.tsx` (etiqueta, `aria-invalid`, `aria-describedby`, `focus-visible`), zona `role="alert"` persistente (`LoginForm.tsx:47`, `SignupForm.tsx:41`, `PrivateArea.tsx:45`), foco en el primer error, enlaces de RF-019 subrayados y con foco visible | C: etiquetas, foco en el primer error, errores asociados al campo (`expectFieldError`) y «RNF-001 … zona de alerta que ya estaba en la página» ×3; E: todo con teclado, incluidos los enlaces de RF-019; medido en T-038 y en esta auditoría: contraste y foco (ver detalle) | ✅ | ⚠️ que los errores se anuncian solo se comprueba con un sustituto automático (I-2) |
| RNF-002 | `password.ts` (argon2id PHC), `PublicUser`, `error-handler.ts:38` (sin cuerpo) | U «RNF-002 el hash no contiene la contraseña»; I «RNF-002 C-12 no guarda la contraseña en claro…», cuerpos con solo `id` y `email`; I `errors.test.ts` (500 sin email ni contraseña en el log) | ✅ | ✅ |
| RNF-003 | `prisma/schema.prisma` + migración `20261028191330_auth_init` | Revisión manual (abajo); I «RNF-003 C-16 borrar un usuario borra sus sesiones» | ✅ | ✅ |
| RNF-004 | `playwright.config.ts` (`chromium`, `chrome`, `webkit`; D-18 actualizada a la v1.2) | E 21/21 | ✅ | ⚠️ Chrome sí; Safari y Edge, solo sus motores; las «dos últimas versiones», no verificables (I-3) |

**Detalle de RNF-001** (la spec v1.2 lo comprueba solo con pruebas automáticas):

| Punto | Resultado |
|-------|-----------|
| Solo con teclado | ✅ E2E con Tab, Option+Tab en WebKit y Enter, también para los enlaces de RF-019 |
| Etiquetas visibles | ✅ test de componente |
| Error asociado al campo | ✅ `aria-invalid` y `aria-describedby`, test de componente |
| Contraste del texto (T-038) | ✅ ≥ 6.42:1 (errores en `red-700`); el resto, entre 17.75 y 21:1 |
| Contraste de los enlaces (esta auditoría) | ✅ 21:1, y subrayados, así que no se distinguen solo por el color |
| Bordes de los campos (T-038) | ✅ 4.84:1 |
| Foco visible | ✅ 17.75:1 en los tres proyectos: campos y botones (T-038), enlaces (esta auditoría) |
| Anuncio a lectores de pantalla | ⚠️ ver abajo |

Sobre el anuncio a lectores de pantalla:
- Los tests automáticos fijan la técnica: la zona `role="alert"` existe vacía antes del error y el mensaje se escribe en ese mismo nodo.
- No se ha comprobado con un lector de pantalla real después de `dc36256`.
- Con VoiceOver, antes del arreglo: los errores de campo se anunciaban, pero el `role="alert"` de `/login`, no.

**Revisión manual del esquema (RNF-003, C-16):**
- `User` solo tiene `id`, `email` (único, normalizado) y `passwordHash` (PHC argon2id).
- `Session` solo tiene `id`, `tokenHash` (SHA-256, único), `userId` y `expiresAt`.
- No hay `createdAt`, nombre ni ningún otro dato. La clave foránea es `ON DELETE CASCADE`.
- Cumple.

## Problemas

### Bloqueantes

Ninguno.

### Importantes

- **I-1 · Resuelta.** Los enlaces entre el inicio de sesión y el registro entran en la spec v2.0 (RF-019, CA-1.6, CA-2.6) y en T-042 (`ac459af`).
- **I-2 · RNF-001: que los errores se anuncian a un lector de pantalla no está comprobado de verdad.**
  - **Dónde:** [LoginForm.tsx:47](../../apps/web/src/components/LoginForm.tsx#L47), [SignupForm.tsx:41](../../apps/web/src/components/SignupForm.tsx#L41), [PrivateArea.tsx:45](../../apps/web/src/components/PrivateArea.tsx#L45).
  - **Qué hay:** la spec v1.2 acepta comprobarlo solo con pruebas automáticas, y los tests pasan. Pero solo verifican que la zona `role="alert"` está antes del error y recibe el texto, no lo que dice el lector.
  - **Por qué importa:** la única prueba real, anterior al arreglo, falló en `/login`. Sigue vaciándose la contraseña en el mismo momento que aparece el mensaje ([credentials-form.ts:73](../../apps/web/src/lib/credentials-form.ts#L73)), que es la otra causa posible.
  - **Propuesta:** aceptarlo como riesgo conocido, como decidió el usuario. Si alguien vuelve a probar con un lector de pantalla y falla, la siguiente medida es ese `setPassword('')`.
- **I-3 · RNF-004: cobertura de navegadores por aproximación.**
  - **Chrome:** probado de verdad (`channel: 'chrome'`).
  - **Edge:** solo con `chromium`, su mismo motor.
  - **Safari:** con el WebKit de Playwright. El usuario usó la app en Safari durante la prueba con VoiceOver, pero sin recorrer el flujo completo.
  - **«Dos últimas versiones estables»:** no verificable con un solo equipo.
  - **Propuesta:** aceptarlo como está en plan §6, o recorrer a mano el flujo del E2E en Edge y Safari una vez y anotarlo aquí.

### Menores

- **M-1 · DoD «sin `console.log`».** [server.ts:8](../../apps/api/src/server.ts#L8) escribe «API escuchando en …» al arrancar. Es informativo y no lleva datos personales. Propuesta: aceptarlo como excepción o pasarlo a `console.info`.
- **M-2 · C-2, dependencias justificadas en el plan.** `@testing-library/dom` ([apps/web/package.json](../../apps/web/package.json)) solo está justificada en el Registro de T-008, no en la tabla de plan §2. Propuesta: añadirla («peer obligatorio de `@testing-library/react`»).
- **M-3 · RF-012 / RF-010: con la API caída, la zona privada se queda en blanco.**
  - **Qué pasa:** [PrivateArea.tsx:24](../../apps/web/src/components/PrivateArea.tsx#L24) solo pinta «Cargando…» (`sr-only`) mientras `me` no responde con éxito. Tras los 3 reintentos de red, la pantalla se queda vacía y sin mensaje.
  - **Por qué es menor:** la spec no define este caso.
  - **Propuesta:** idea para el roadmap, o aclaración en la spec 002, que reutiliza la isla.
- **M-4 · RF-013: cerrar sesión con la sesión ya caducada lleva al inicio de sesión sin el aviso.**
  - **Qué pasa:** `POST /api/auth/logout` ([auth.routes.ts:28](../../apps/api/src/routes/auth.routes.ts#L28)) no comprueba la sesión y siempre responde 204.
  - **Por qué es menor:** es poco probable, porque al recuperar el foco la ventana se vuelve a pedir `me` (`refetchOnWindowFocus`), que ya redirige con el aviso.
  - **Propuesta:** aceptarlo y anotarlo en D-11, o aclarar en la spec si «cerrar sesión» cuenta como acción de RF-013.
- **M-5 · C-24, formato de los commits.** 5 commits de las fases de documentación (`docs(spec-001): …`, anteriores a T-001) no llevan el sufijo `[spec 001]`. Referencian la spec en el ámbito. Propuesta: aceptarlo.
- **M-6 · Entrega.**
  - La rama principal en local es `master`; `CLAUDE.md` habla de `main`.
  - No hay remoto ni CI. El DoD pide «en verde (local y CI)» y una PR revisada.
  - **Propuesta:** crear el remoto y abrir la PR contra `master`. Si se quiere CI, decidirlo en una spec o un ADR aparte (C-6).

## Deriva spec ↔ código

| Requisito | Spec | Código / realidad |
|-----------|------|-------------------|
| RNF-001 | Los errores se anuncian a lectores de pantalla (comprobado con pruebas automáticas, v1.2) | Las pruebas automáticas pasan; con un lector real, sin confirmar (I-2) |
| RNF-004 | Chrome, Safari y Edge | Chrome directo; Safari y Edge, solo sus motores (I-3) |
| RF-013 | Cualquier acción con la sesión caducada muestra el aviso | Cerrar sesión con la sesión caducada no lo muestra (M-4) |

Sin otra deriva. RF-019 se cumple con el texto exacto de la spec. Las precisiones de T-024, T-028, T-031, T-037 y T-038, D-19 y los cambios v1.2 y v2.0 están anotados en el plan.

**Plan:** no hay desviaciones sin documentar, salvo M-2.

## Constitución

| Artículo | Cumple | Evidencia / nota |
|----------|--------|------------------|
| C-1 | ✅ | `strict` en `tsconfig.base.json`; ningún `any` en el código del proyecto. El único `eslint-disable` está justificado: `require-auth.ts:8`, `no-namespace` |
| C-2 | ⚠️ | Workspaces correctos. `@testing-library/dom` no está en la tabla de plan §2 (M-2) |
| C-3 | ✅ | `.nvmrc` = 24, `engines.node` `^24.19.0`, `packageManager` `pnpm@11.20.0`, `.npmrc` con `engine-strict=true` (y `engineStrict` en `pnpm-workspace.yaml`, D-14) |
| C-4 | ✅ | Astro estático + Tailwind, tres islas `client:only="react"`. Ningún `fetch(` fuera de `lib/api.ts`. Los dos `useEffect` (redirección con sesión y `pageshow`) sincronizan con la navegación y no piden datos |
| C-5 | ✅ | Express 5, Prisma 7, Postgres 18 en `docker compose`. Una migración commiteada y sin editar |
| C-6 | ✅ | Solo uso local |
| C-7 | ✅ | Rutas relativas `/api/...` (el tipo de `apiFetch` lo obliga); proxy en `astro.config.mjs`; sin CORS. Los enlaces de RF-019 también son relativos |
| C-8 | ✅ | Prisma solo se importa en `src/repositories/` (`grep`); routes → services → repositories, sin llamadas hacia arriba |
| C-9 | ✅ | `error-handler.ts`: todo error con `{ error: { code, message } }`; catálogo en `shared/src/errors.ts`; el front elige el texto por `code` |
| C-10 | ✅ | `shared` solo depende de `zod`, y su `tsconfig` tiene `types: []` |
| C-11 | N/A | No hay fechas sin hora |
| C-12 | ✅ | Cookie `HttpOnly; Secure; SameSite=Lax` (test de integración); argon2id; las respuestas solo llevan `id` y `email`; token solo en `Set-Cookie`; SHA-256 en BD; CSRF con D-13 (test de integración del 415) |
| C-13 | ✅ | Patrón `requireAuth` → `res.locals.user`. Aún no hay tareas |
| C-14 | ✅ | `validateBody` con los esquemas de `shared` en signup y login |
| C-15 | ✅ | `env.ts` con Zod (test); solo `.env.example` versionado; Compose lee la contraseña de `.env` |
| C-16 | ✅ | Datos mínimos y cascada (revisión manual y test de integración); las sesiones caducan y se borran |
| C-17 | ✅ | Los 19 RF tienen tests |
| C-18 | ✅ | Vitest + Testing Library, Supertest contra Postgres real (sin mocks de Prisma), Playwright |
| C-19 | ✅ | Tests, lint y tipos en verde |
| C-20 | ⚠️ | Teclado, foco visible (17.75:1), roles ARIA y contraste (≥ 4.5:1) comprobados, también en los enlaces nuevos. Que los mensajes se anuncian, solo con el sustituto automático (I-2). No hay arrastre en esta spec |
| C-21 | ✅ | No hay funcionalidad fuera de la spec. Todo el código se traza a una tarea o un requisito |
| C-22 | ✅ | Las abstracciones tienen ≥ 2 usos (plan §3; `emptyAlert` en 3 tests y `appLink` en 2 E2E) |
| C-23 | ✅ | Código en inglés, textos en castellano; ningún nombre de fichero con tildes ni `ñ` |
| C-24 | ⚠️ | Rama `feat/001-…`; los commits de código siguen el formato; 5 de documentación no (M-5) |
| C-25 | ✅ | ESLint flat con typescript-eslint, plugin de Astro y hooks de React; Prettier. `pnpm lint` en verde |

## Definition of Done

**Trazabilidad**
- [ ] Todas las tareas de `tasks.md` están `[x]`. *41/42: solo falta T-041, que es esta verificación. Su «Hecho cuando» pide APTO o APTO CON OBSERVACIONES, que se cumple, y el DoD completo, que solo se completa con la entrega.*
- [x] Cada RF y CA tiene al menos un test que lo verifica y pasa.
- [x] Cada caso límite de la spec está implementado y probado (E-1…E-10).
- [x] No hay código que no se trace a una tarea o un requisito.

**Calidad**
- [ ] Tests, linter y comprobación de tipos en verde (local y CI). *En local, sí; no hay CI (M-6).*
- [ ] Sin `console.log`, código comentado ni TODO sin ticket. *Queda el `console.log` de `server.ts:8` (M-1).*
- [x] Accesibilidad revisada en componentes interactivos (T-038 y esta auditoría, con el alcance de la spec v1.2; observación I-2).
- [x] Sin secretos ni datos personales en el código o los logs.

**Documentación**
- [x] `spec.md` refleja lo que hace el código. *Quedan las observaciones de la tabla de deriva, ninguna contradice un RF.*
- [x] Desviaciones del plan anotadas en el plan. *Salvo M-2.*
- [x] ADRs creados si hubo decisiones transversales (ADR-0001, ADR-0002).
- [ ] Estado de la spec → `implementada`. *Pendiente de que lo confirme el usuario.*

**Entrega**
- [ ] PR con enlace a la spec, requisitos cubiertos e informe de `/sdd-verificar`. *No hay remoto (M-6).*
- [ ] Revisada y aprobada.
