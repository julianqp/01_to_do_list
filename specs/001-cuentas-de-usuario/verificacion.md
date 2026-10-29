# Verificación · Spec 001 · 2026-10-29

Resultado: **NO APTO**

Rama `feat/001-cuentas-de-usuario` (46 commits sobre `master`, último `3718e5e`, el arreglo de foco de T-038). Lo único sin commitear es el Registro de T-038 en `tasks.md`, con los resultados de VoiceOver.

## Resumen

La funcionalidad está completa y probada. Los 18 RF, los 18 CA y los 10 casos límite tienen código y al menos un test en verde. Los resultados:

| Comprobación | Resultado |
|--------------|-----------|
| `pnpm test` | ✅ 111/111 (13 ficheros: `shared`, `api` contra el Postgres `todo_test` y `web`) |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ `tsc` en todos los paquetes, `astro check` (0 errores) y `tsc -p tsconfig.json` de la raíz |
| `pnpm test:e2e` | ✅ 15/15 (5 tests × `chromium`, `chrome` y `webkit`) |
| VoiceOver + Safari (manual, lo hizo el usuario) | ⚠️ 2 de 3 casos bien; ❌ el error de `role="alert"` del inicio de sesión no se anuncia |

No es apto por dos motivos:

1. **RNF-001 / C-20 no se cumple.** Con VoiceOver, «Email o contraseña incorrectos» no se anuncia en `/login`. Los mensajes de error deben «anunciarse a lectores de pantalla».
2. **El Definition of Done no está completo.** T-038 está sin marcar porque falta arreglar B-1. T-041 es esta verificación.

## Matriz de verificación

Leyenda de las columnas de test: U = unitario, I = integración de la API, C = componente, E = E2E. Todos los tests citados pasan. Las rutas de test no llevan el prefijo del proyecto.

| ID | Código | Test (fichero › nombre) | ¿Pasa? | Veredicto |
|----|--------|-------------------------|--------|-----------|
| RF-001 | `services/auth.service.ts:27` `signup`, `repositories/user.repository.ts:9` | I `auth.signup.test.ts` › «CA-1.1 RF-001 RF-002 crea la cuenta…» | ✅ | ✅ |
| RF-002 | `auth.service.ts:31` (`startSession`), `lib/auth-queries.ts:35` (`onSuccess` → `/`) | I idem; C `SignupForm.test.tsx` › «CA-1.1 RF-002 …»; E «CA-1.1 RF-002 RNF-001 registro → zona privada» | ✅ | ✅ |
| RF-003 | `shared/src/auth.ts:15` (`trim().toLowerCase()`, en registro e inicio de sesión) | U «RF-003 quita los espacios…»; I «RF-003 guarda el email…», «CA-2.2 RF-003 …» | ✅ | ✅ |
| RF-004 | D-9 en `user.repository.ts:13`, `auth.service.ts:30`, `lib/messages.ts:12` (`field: 'email'`) | I «CA-1.2 RF-003 RF-004 …» (no cambia la cuenta y sigue habiendo 1 usuario); C «CA-1.2 RF-004 E-8 …» | ✅ | ✅ |
| RF-005 | `shared/src/auth.ts:22` | U «CA-1.3», «E-2» ×2, «E-10»; C «CA-1.3 RF-005 E-1 …» | ✅ | ✅ |
| RF-006 | `shared/src/auth.ts:27` (puntos de código) | U «CA-1.4 E-3 …», «E-3 …»; C «CA-1.4 RF-006 …» | ✅ | ✅ |
| RF-007 | `shared/src/auth.ts:15-19` | U «E-1 RF-007 …» ×3; C «CA-1.5 RF-007 E-1 …» | ✅ | ✅ |
| RF-008 | `auth.service.ts:35` + `services/password.ts:39` | I «CA-2.1 RF-008 …»; C «CA-2.1 RF-008 …»; E flujo completo | ✅ | ✅ |
| RF-009 | `auth.service.ts:38` (un solo `INVALID_CREDENTIALS`), `messages.ts:13` | I «CA-2.3 CA-2.4 RF-009 …» (cuerpos idénticos); C «CA-2.3 CA-2.5 RF-009 …» | ✅ | ✅ (el anuncio a lectores de pantalla falla: ver RNF-001) |
| RF-010 | `lib/api.ts:36-67`, `lib/credentials-form.ts:72-73`, `messages.ts:9` | U `api.test.ts` «RF-010 E-7 …» ×2; C «RF-010 E-7 …» en los dos formularios | ✅ | ✅ |
| RF-011 | `auth.service.ts:46`, `routes/auth.routes.ts:28`, `auth-queries.ts:51` | I «CA-3.1 RF-011 E-6 …», «RF-011 sin cookie → 204»; C «CA-3.1 RF-011 …»; E flujo completo | ✅ | ✅ |
| RF-012 | `middleware/require-auth.ts`, `components/withQueryClient.tsx:12` | I «CA-4.1 RF-012 …», «RF-012 con un token desconocido…»; C «CA-4.1 RF-012 …»; E «CA-4.1 RF-012 …» | ✅ | ✅ (con la API caída, ver M-3) |
| RF-013 | `auth.service.ts:58`, `withQueryClient.tsx:15`, `LoginForm.tsx:19-25` | I «CA-4.2 CA-5.2 RF-013 RF-017 E-5 …»; C «CA-4.2 RF-013 …» ×2, «RF-013 sin ?expired=1 …» | ✅ | ⚠️ falla un caso: cerrar sesión con la sesión ya caducada (M-4) |
| RF-014 | `auth-queries.ts:21` `useRedirectIfSignedIn` | C «CA-4.3 RF-014 …» ×2; E flujo completo (`/login` y `/signup` con sesión) | ✅ | ✅ |
| RF-015 | `components/PrivateArea.tsx:29-40` | C «RF-015 con sesión (me 200) muestra el email…» | ✅ | ✅ |
| RF-016 | `routes/session-cookie.ts:23` (`Max-Age` de 30 días) | I «RF-016 C-12 emite la cookie sid …»; E «CA-5.1 RF-016 …» | ✅ | ✅ |
| RF-017 | `auth.service.ts:58` | I «CA-4.2 CA-5.2 RF-013 RF-017 E-5 …» | ✅ | ✅ |
| RF-018 | `auth.service.ts:63`, `require-auth.ts:23` | I «CA-5.3 RF-018 D-3 …» | ✅ | ✅ |
| CA-1.1 | RF-001 + RF-002 + RF-015 | I, C, E (email visible tras registrarse) | ✅ | ✅ |
| CA-1.2 | RF-003 + RF-004 | I (`ANA@Example.com `), C | ✅ | ✅ |
| CA-1.3 | `emailSchema` | U, C (sin llamar a `fetch`) | ✅ | ✅ |
| CA-1.4 | `passwordSchema` | U, C | ✅ | ✅ |
| CA-1.5 | Esquemas | U, C | ✅ | ✅ |
| CA-2.1 | RF-008 | I (sesión confirmada con `/me`), C | ✅ | ✅ |
| CA-2.2 | RF-003 | I, E (`email.toUpperCase()` con teclado) | ✅ | ✅ |
| CA-2.3 | RF-009 | I, C | ✅ | ✅ |
| CA-2.4 | RF-009 | I (mismo status y mismo cuerpo) | ✅ | ✅ |
| CA-2.5 | `credentials-form.ts:72-73` | C «CA-2.3 CA-2.5 RF-009 …» | ✅ | ✅ |
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
| RNF-001 | `FormField.tsx` (etiqueta, `aria-invalid`, `aria-describedby`), `role="alert"`, foco en el primer error, `focus-visible` (T-038, `3718e5e`) | C: etiquetas y foco; E: todo con teclado; manual: contraste, foco y VoiceOver (ver detalle) | ✅ automáticos / ❌ VoiceOver | ❌ |
| RNF-002 | `password.ts` (argon2id PHC), `PublicUser`, `error-handler.ts:38` (sin cuerpo) | U «RNF-002 el hash no contiene la contraseña»; I «RNF-002 C-12 no guarda la contraseña en claro…», cuerpos con solo `id` y `email`; I `errors.test.ts` (500 sin email ni contraseña en el log) | ✅ | ✅ |
| RNF-003 | `prisma/schema.prisma` + migración `20261028191330_auth_init` | Revisión manual (abajo); I «RNF-003 C-16 borrar un usuario borra sus sesiones» | ✅ | ✅ |
| RNF-004 | `playwright.config.ts` (`chromium`, `chrome`, `webkit`; D-18) | E 15/15 | ✅ | ⚠️ ni Firefox ni Edge se han probado (I-2) |

**Detalle de RNF-001**, comprobado en esta verificación y en T-038:

| Punto | Resultado |
|-------|-----------|
| Solo con teclado | ✅ E2E con Tab, Option+Tab en WebKit y Enter |
| Etiquetas visibles | ✅ test de componente |
| Error asociado al campo | ✅ `aria-invalid` y `aria-describedby`, test de componente |
| Contraste del texto | ✅ ≥ 6.42:1 (errores en `red-700`); el resto, entre 17.75 y 21:1 |
| Bordes de los campos | ✅ 4.84:1 |
| Foco visible | ✅ 17.75:1 desde `3718e5e`: antes, el anillo por defecto de WebKit daba 2.16:1 |
| VoiceOver: registro con los campos vacíos | ✅ anuncia «Este campo es obligatorio» |
| VoiceOver: error solo en la contraseña, con Enter desde ese campo | ✅ se anuncia |
| VoiceOver: `/login` con credenciales incorrectas | ❌ no anuncia «Email o contraseña incorrectos» |

**Revisión manual del esquema (RNF-003, C-16):**
- `User` solo tiene `id`, `email` (único, normalizado) y `passwordHash` (PHC argon2id).
- `Session` solo tiene `id`, `tokenHash` (SHA-256, único), `userId` y `expiresAt`.
- No hay `createdAt`, nombre ni ningún otro dato. La clave foránea es `ON DELETE CASCADE`.
- Cumple.

## Problemas

### Bloqueantes

- **B-1 · RNF-001, C-20: el error del formulario de inicio de sesión no se anuncia con VoiceOver.**
  - **Dónde:** [LoginForm.tsx:47-51](../../apps/web/src/components/LoginForm.tsx#L47-L51). Afecta de la misma forma al `role="alert"` de [SignupForm.tsx:41-45](../../apps/web/src/components/SignupForm.tsx#L41-L45) (RF-010) y al de [PrivateArea.tsx:45-49](../../apps/web/src/components/PrivateArea.tsx#L45-L49) (D-11).
  - **Causa probable:** el `<p role="alert">` no existe hasta que hay un error y se inserta ya con el texto. VoiceOver en Safari no siempre anuncia una zona `alert` que se añade así. Además, en ese mismo momento se vacía la contraseña, que tiene el foco ([credentials-form.ts:73](../../apps/web/src/lib/credentials-form.ts#L73)), y VoiceOver anuncia ese cambio.
  - **Por qué no lo detectó ningún test:** `LoginForm.test.tsx` solo comprueba que el `role="alert"` existe en jsdom, no que se anuncie.
  - **Propuesta (dentro de T-038, que permite cambiar clases y atributos):** dejar la zona `role="alert"` siempre presente y vacía, y cambiar solo su texto; o mover el foco al mensaje (`tabIndex={-1}`). Después, repetir la prueba con VoiceOver en los tres mensajes.
- **B-2 · Definition of Done: tareas sin cerrar.**
  - **Dónde:** [tasks.md](tasks.md). T-038 sigue `[ ]`. Su arreglo de foco ya está commiteado (`3718e5e`), pero queda B-1.
  - **Propuesta:** arreglar B-1 dentro de T-038, marcarla `[x]` y volver a ejecutar `/sdd-verificar` (T-041).

### Importantes

- **I-1 · HU-1: un visitante sin cuenta no puede llegar al registro.**
  - **Qué pasa:** sin sesión, `/` lleva a `/login`, y ni `/login` ni `/signup` tienen un enlace a la otra pantalla ([LoginForm.tsx](../../apps/web/src/components/LoginForm.tsx), [SignupForm.tsx](../../apps/web/src/components/SignupForm.tsx)). Solo se llega a `/signup` escribiendo la dirección.
  - **No es deriva:** la spec no pide ese enlace, y ya está en «Ideas sin priorizar» del roadmap (origen T-036), con la nota «valorar `/sdd-cambiar-spec` antes de cerrar 001».
  - **Propuesta:** `/sdd-cambiar-spec` para añadir un RF con los dos enlaces antes de dar la spec por implementada. Sin eso, HU-1 no se puede cumplir en la práctica.
- **I-2 · RNF-004: falta la decisión que D-18 dejó pendiente.**
  - **Qué pasa:** RNF-004 pide «las dos últimas versiones estables de Chrome, Firefox, Safari y Edge».
    - Firefox no tiene ninguna prueba, ni automática ni manual.
    - Edge se da por cubierto con Chromium, pero no se ha abierto en Edge.
    - Safari se prueba con el WebKit de Playwright. La prueba con VoiceOver confirma que la app funciona en Safari real.
    - «Dos últimas versiones» no es verificable con un solo equipo.
  - **Ya estaba previsto:** el plan (D-18 y §8) pedía decidirlo antes de esta verificación.
  - **Propuesta (decide el usuario):**
    - (a) recorrer a mano el flujo del E2E en Firefox y Edge y anotarlo aquí; o
    - (b) `/sdd-cambiar-spec` sobre RNF-004 para reflejar lo que de verdad se prueba.

### Menores

- **M-1 · DoD «sin `console.log`».** [server.ts:8](../../apps/api/src/server.ts#L8) escribe «API escuchando en …» al arrancar. Es informativo y no lleva datos personales. Propuesta: aceptarlo como excepción en el DoD o pasarlo a `console.info`, si se quiere que la regla sea literal.
- **M-2 · C-2, dependencias justificadas en el plan.** `@testing-library/dom` ([apps/web/package.json](../../apps/web/package.json)) solo está justificada en el Registro de T-008, no en la tabla de plan §2. Propuesta: añadirla a esa tabla («peer obligatorio de `@testing-library/react`»).
- **M-3 · RF-012 / RF-010: con la API caída, la zona privada se queda en blanco.**
  - **Qué pasa:** [PrivateArea.tsx:24](../../apps/web/src/components/PrivateArea.tsx#L24) solo pinta «Cargando…» (`sr-only`) mientras `me` no responde con éxito. Tras los 3 reintentos de red, `me` queda en error y la pantalla se queda vacía para siempre, sin ningún mensaje.
  - **Por qué es menor:** la spec no define este caso (RF-010 habla de enviar un formulario).
  - **Propuesta:** idea para el roadmap, o aclaración en la spec 002, que reutiliza la misma isla.
- **M-4 · RF-013: cerrar sesión con la sesión ya caducada lleva al inicio de sesión sin el aviso.**
  - **Qué pasa:** `POST /api/auth/logout` ([auth.routes.ts:28](../../apps/api/src/routes/auth.routes.ts#L28)) no comprueba la sesión y siempre responde 204, así que el front va a `/login` sin `?expired=1`.
  - **Por qué es menor:** es poco probable, porque TanStack vuelve a pedir `me` al recuperar el foco la ventana (`refetchOnWindowFocus`) y esa petición ya redirige con el aviso. Solo pasaría con la pestaña enfocada durante más de 7 días sin uso.
  - **Propuesta:** aceptarlo y anotarlo en plan D-11, o aclarar en la spec si «cerrar sesión» cuenta como acción de RF-013.
- **M-5 · C-24, formato de los commits.** 5 commits de las fases de documentación (`docs(spec-001): …`) no llevan el sufijo `[spec 001]` que usan los demás. Referencian la spec en el ámbito, así que no hace falta reescribir la historia. Propuesta: aceptarlo.
- **M-6 · Entrega.**
  - La rama principal en local es `master`; `CLAUDE.md` y el flujo hablan de `main`.
  - No hay remoto ni CI. El DoD pide «en verde (local y CI)» y que haya una PR revisada.
  - **Propuesta:** crear el remoto y decidir si se añade CI (spec o ADR aparte; C-6 dice que de momento solo hay uso local).

## Deriva spec ↔ código

| Requisito | Spec | Código / realidad |
|-----------|------|-------------------|
| RNF-001 | Los mensajes de error se anuncian a lectores de pantalla | El `role="alert"` del inicio de sesión no lo anuncia VoiceOver (B-1) |
| RNF-004 | Chrome, Firefox, Safari y Edge | Se prueban `chromium`, `chrome` y `webkit`; Firefox y Edge no (D-18, I-2) |
| RF-013 | Cualquier acción con la sesión caducada muestra el aviso | Cerrar sesión con la sesión caducada no lo muestra (M-4) |
| HU-1 | El visitante puede crear una cuenta | Solo escribiendo `/signup` a mano (I-1; hueco de la spec, no del código) |

Sin otra deriva. Las demás precisiones (T-024, T-028, T-031, T-037) están anotadas en el plan.

**Plan:** no hay desviaciones sin documentar, salvo M-2. El `focus-visible` de plan §6 (RNF-001) faltaba hasta T-038 (`3718e5e`).

## Constitución

| Artículo | Cumple | Evidencia / nota |
|----------|--------|------------------|
| C-1 | ✅ | `strict` en `tsconfig.base.json`; ningún `any` en el código del proyecto. El único `eslint-disable` está justificado: `require-auth.ts:8`, `no-namespace` |
| C-2 | ⚠️ | Workspaces correctos. `@testing-library/dom` no está en la tabla de plan §2 (M-2) |
| C-3 | ✅ | `.nvmrc` = 24, `engines.node` `^24.19.0`, `packageManager` `pnpm@11.20.0`, `.npmrc` con `engine-strict=true` (y `engineStrict` en `pnpm-workspace.yaml`, D-14) |
| C-4 | ✅ | Astro estático + Tailwind, tres islas `client:only="react"`. Ningún `fetch(` fuera de `lib/api.ts`. El único `useEffect` (`useRedirectIfSignedIn`, y el de `pageshow`) sincroniza con la navegación y no pide datos |
| C-5 | ✅ | Express 5, Prisma 7, Postgres 18 en `docker compose`. Una migración commiteada y sin editar |
| C-6 | ✅ | Solo uso local |
| C-7 | ✅ | Rutas relativas `/api/...` (el tipo de `apiFetch` lo obliga); proxy en `astro.config.mjs`; sin CORS |
| C-8 | ✅ | Prisma solo se importa en `src/repositories/` (`grep`); routes → services → repositories, sin llamadas hacia arriba |
| C-9 | ✅ | `error-handler.ts`: todo error con `{ error: { code, message } }`; catálogo en `shared/src/errors.ts`; el front elige el texto por `code` (`messages.ts`) |
| C-10 | ✅ | `shared` solo depende de `zod`, y su `tsconfig` tiene `types: []` |
| C-11 | N/A | No hay fechas sin hora |
| C-12 | ✅ | Cookie `HttpOnly; Secure; SameSite=Lax` (test de integración); argon2id; las respuestas solo llevan `id` y `email`; token solo en `Set-Cookie`; SHA-256 en BD; CSRF con D-13 (test de integración del 415) |
| C-13 | ✅ | Patrón `requireAuth` → `res.locals.user`. Aún no hay tareas |
| C-14 | ✅ | `validateBody` con los esquemas de `shared` en signup y login |
| C-15 | ✅ | `env.ts` con Zod (test); solo `.env.example` versionado; Compose lee la contraseña de `.env` |
| C-16 | ✅ | Datos mínimos y cascada (revisión manual y test de integración); las sesiones caducan y se borran |
| C-17 | ✅ | Los 18 RF tienen tests (T-039) |
| C-18 | ✅ | Vitest + Testing Library, Supertest contra Postgres real (sin mocks de Prisma), Playwright |
| C-19 | ✅ | Tests, lint y tipos en verde. La excepción temporal terminó en T-036 |
| C-20 | ❌ | B-1. El resto se cumple: teclado, contraste y foco visible (desde `3718e5e`) |
| C-21 | ✅ | No hay funcionalidad fuera de la spec. Todo el código se traza a una tarea o un requisito |
| C-22 | ✅ | Las abstracciones tienen ≥ 2 usos (plan §3) |
| C-23 | ✅ | Código en inglés, textos en castellano; ningún nombre de fichero con tildes ni `ñ` (`git ls-files`) |
| C-24 | ⚠️ | Rama `feat/001-…`; los commits de código siguen el formato; 5 de documentación no (M-5) |
| C-25 | ✅ | ESLint flat con typescript-eslint, plugin de Astro y hooks de React; Prettier. `pnpm lint` en verde |

## Definition of Done

**Trazabilidad**
- [ ] Todas las tareas de `tasks.md` están `[x]`. *Faltan T-038 (B-2) y T-041 (esta verificación).*
- [x] Cada RF y CA tiene al menos un test que lo verifica y pasa.
- [x] Cada caso límite de la spec está implementado y probado (E-1…E-10).
- [x] No hay código que no se trace a una tarea o un requisito.

**Calidad**
- [ ] Tests, linter y comprobación de tipos en verde (local y CI). *En local, sí; no hay CI (M-6).*
- [ ] Sin `console.log`, código comentado ni TODO sin ticket. *Queda el `console.log` de `server.ts:8` (M-1); no hay código comentado ni TODO.*
- [ ] Accesibilidad revisada en componentes interactivos. *Revisada, pero con un fallo abierto (B-1).*
- [x] Sin secretos ni datos personales en el código o los logs.

**Documentación**
- [ ] `spec.md` refleja exactamente lo que hace el código (sin deriva). *Ver la sección de deriva (RNF-001, RNF-004, RF-013).*
- [x] Desviaciones del plan anotadas en el plan. *Salvo M-2.*
- [x] ADRs creados si hubo decisiones transversales (ADR-0001, ADR-0002).
- [ ] Estado de la spec → `implementada`. *No procede con NO APTO.*

**Entrega**
- [ ] PR con enlace a la spec, requisitos cubiertos e informe de `/sdd-verificar`. *No hay remoto (M-6).*
- [ ] Revisada y aprobada.
