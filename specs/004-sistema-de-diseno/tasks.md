---
spec: 004
plan_aprobado: 2026-10-29
progreso: 26/27
---

# Tareas · Spec 004 · Aplicar el sistema de diseño

> Reglas:
> - Una tarea = 15 min a 2 h = un commit.
> - Orden de ejecución de arriba abajo, respetando "Depende de".
> - `[P]` = se puede hacer en paralelo con otras `[P]` de la misma fase (no tocan los mismos ficheros).
> - Al terminar: marcar `[x]`, actualizar `progreso` y anotar el commit.
> - Cada test empieza por el ID que verifica (`it('CA-1.2 …')`, `it('E-8 …')`, `test('RNF-002 …')`), para comprobar la trazabilidad con `grep` (T-025).
> - Lo que se descubra o se decida al implementar (versiones, nombres, desviaciones) va en el Registro. Si cambia una decisión, también va al plan como `D-x (añadida en T-0xx)`.
>
> Convenciones de esta spec:
> - **Rama:** `feat/004-sistema-de-diseno` (ya existe). Commits como `feat(web): T-0xx … [spec 004]` (C-24).
> - **Dependencias:** todas se instalan en T-001 con las versiones de research R-7. Desde la fase 2, ninguna tarea toca `package.json` ni `pnpm-lock.yaml`.
> - **Test primero y C-19:** el plan (§3) fija C-19 sin excepción.
>   - Cada tarea de las fases 3 y 4 escribe primero sus tests unitarios, los ve fallar por la razón correcta (se anota en el Registro), implementa y termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde.
>   - Los E2E nuevos (`e2e/design-system.spec.ts`) se escriben en la fase 2 y **pueden quedar en rojo** hasta T-023: `pnpm test:e2e` no forma parte de C-19.
>   - `e2e/auth.spec.ts` (la 001) tiene que seguir en verde en todo momento (RF-019).
> - **Contratos:** los de plan §4.3. Los valores visuales salen solo de `tokens.css` (plan §4.2, ADR-0003). Cada texto va sobre las superficies de la tabla «Texto por superficie» (plan §4.2).
> - **Postgres:** `pnpm test:e2e` necesita `pnpm db:up` (plan 001 §7).

## Fase 1 · Preparación

Secuencial: las dos tareas tocan el lockfile o los E2E de la 001.

- [x] **T-001** Instalar las dependencias nuevas con versiones fijadas
  - Ficheros: `apps/web/package.json` (`lucide-react` 1.62.0, `@fontsource-variable/geist` 5.3.0; dev: `culori` 4.0.2, `@types/culori` 4.0.1), `package.json` (dev: `@axe-core/playwright` 4.14.0), `pnpm-lock.yaml`
  - Cubre: D-7, D-8, D-12, C-2 (plan §2, R-7)
  - Hecho cuando: `pnpm install` termina sin errores ni excepciones a `minimumReleaseAge` (001 D-16); las cinco versiones son exactas (sin `^`); `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-002** Extraer las utilidades E2E de la 001 a `e2e/helpers.ts`
  - Depende de: T-001
  - Ficheros: `e2e/helpers.ts` (nuevo: `tabTo`, `uniqueEmail`, `signup`, `logout`, `submitCredentials`, `expectPrivateArea`, `expectLoginScreen`, `emailField`, `passwordField`, `logoutButton`, `appLink`, `PASSWORD`), `e2e/auth.spec.ts` (solo importaciones)
  - Cubre: D-17, RF-019
  - Hecho cuando: `git diff e2e/auth.spec.ts` solo toca importaciones y definiciones movidas, ningún `test(...)`; `pnpm test:e2e` en verde en `chromium`, `chrome` y `webkit`; `pnpm typecheck` y `pnpm lint` en verde

## Fase 2 · Contratos y tests

T-003 y T-004 terminan en verde. T-005–T-008 escriben los E2E primero: deben fallar por la razón indicada (que se anota en el Registro), sin errores de sintaxis ni de tipos. Comparten fichero, así que van en orden.

- [x] **T-003** [P] Simular `matchMedia` en las utilidades de test
  - Depende de: T-001
  - Ficheros: `apps/web/src/components/test-utils.tsx`
  - Cubre: E-10 (infraestructura), plan §8 (jsdom no tiene `matchMedia`)
  - Casos: `mockBrowser()` instala un `matchMedia` simulado por consulta (`matches` configurable) y devuelve un `setMediaMatches(query, matches)` que lanza `change` a los oyentes registrados; se restaura en `afterEach`
  - Hecho cuando: los tests actuales de `apps/web` siguen en verde; un test temporal comprueba que `setMediaMatches` dispara el oyente (se borra al terminar); `pnpm typecheck` en verde

- [x] **T-004** [P] Definir los contratos de los componentes y el tono de los mensajes
  - Depende de: T-001
  - Ficheros:
    - nuevos: `apps/web/src/components/{Icon,Button,Alert,AuthCard,AppHeader,AccountMenu}.tsx` (props y firmas de plan §4.3; de momento devuelven `null`)
    - `apps/web/src/lib/messages.ts`: `FormMessage` con `tone: AlertTone` y tono por mensaje
    - `apps/web/src/lib/credentials-form.ts`: `formError: FormMessage | undefined`
    - `apps/web/src/components/{LoginForm,SignupForm}.tsx`: pintan `form.formError?.text`; el comportamiento no cambia
  - Cubre: plan §4.3, RF-004 (tonos), RF-019
  - Hecho cuando: `pnpm typecheck` y `pnpm lint` en verde; los tests actuales en verde sin tocarlos; `messageFor('INVALID_CREDENTIALS').tone === 'error'`, `'SESSION_EXPIRED'` → `'info'` y `'NETWORK_ERROR'` → `'offline'` (comprobado en un test nuevo de `apps/web/src/lib/messages.test.ts`, con el nombre `RF-004 …`)

- [x] **T-005** Escribir los E2E de las pantallas de acceso
  - Depende de: T-002
  - Ficheros: `e2e/design-system.spec.ts` (nuevo)
  - Cubre: CA-1.1, CA-1.2, CA-1.4, CA-4.1, CA-4.2, RF-001, RF-002, RF-003, RF-005
  - Casos:
    - 1280: la tarjeta del inicio de sesión mide 420 px, está centrada en horizontal y tiene `backdrop-filter`; en orden vertical: título, Email, Contraseña, botón principal (a todo el ancho de la tarjeta) y «¿No tienes cuenta? Crear cuenta».
    - 375 y 320, registro: la tarjeta mide 343 y 288 px, sin scroll horizontal, y el botón sigue dentro de la tarjeta.
    - Registro con `ana@`: el `box-shadow` del campo Email incluye el color calculado de `--ring-error`.
    - Registro con `page.route` en `abort`: alerta con `data-tone="offline"`, «No se ha podido conectar. Inténtalo de nuevo», encima del campo Email.
    - Inicio de sesión y registro con un `page.route` que tarda 2 s: el botón muestra «Iniciando sesión…» / «Creando cuenta…» con el mismo ancho que antes y `aria-disabled="true"`.
  - Hecho cuando: los tests existen y fallan por el aspecto (p. ej., la tarjeta mide 384 px: `max-w-sm` de la 001), no por errores del test; `pnpm typecheck` en verde; `auth.spec.ts` sigue en verde

- [x] **T-006** Escribir los E2E de la zona privada y el menú de cuenta
  - Depende de: T-005
  - Ficheros: `e2e/design-system.spec.ts`
  - Cubre: CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.6, CA-4.3, RF-006, RF-007, RF-008, RF-020, RF-022, RF-024, E-1, E-10, E-14
  - Casos:
    - 1280: el `banner` tiene «Mis tareas», el email y «Cerrar sesión», con `position: sticky`; el `h1` «Mis tareas» mide 56 px; el título de la pestaña es «Mis tareas».
    - 375 y 767: solo el nombre y un botón con «A»; no se ven el email ni «Cerrar sesión». 768: email y «Cerrar sesión» visibles y sin botón de cuenta.
    - 375: el `h1` mide 40 px; teclado (Tab, o Alt+Tab en WebKit) hasta el botón de cuenta → Enter → la opción «Cerrar sesión» tiene el foco → flechas → Esc devuelve el foco al botón; elegir la opción lleva a `/login`.
    - 375: Tab con el menú abierto lo cierra, y el foco no queda en el botón de cuenta ni dentro del menú (E-14).
    - 375 con el menú abierto → 768: el menú desaparece y se ven el email y «Cerrar sesión» (E-10).
    - Logout con `abort`: sigue en `/`, con una alerta `data-tone="offline"` entre el `banner` y el `h1`.
    - Logout con 2 s: «Cerrando sesión…», mismo ancho.
    - E-1: cuenta con un email válido de 254 caracteres a 1280: el email no se sale de la cabecera ni se solapa con «Cerrar sesión»; al pasar el ratón y al llevar el foco aparece un tooltip con el email completo.
  - Hecho cuando: los tests existen y fallan por el aspecto o porque falta el botón de cuenta; `auth.spec.ts` sigue en verde

- [x] **T-007** Escribir los E2E de responsive, objetivos táctiles y foco
  - Depende de: T-006
  - Ficheros: `e2e/design-system.spec.ts`
  - Cubre: RNF-002, CA-3.2, CA-3.3, CA-3.4, RF-011, RF-012, E-2, E-6, E-9
  - Casos:
    - RNF-002: las tres pantallas a 320, 375, 768, 1024, 1280 y 1600, con `scrollWidth ≤ innerWidth` y el título, los campos y los botones dentro de la ventana.
    - CA-3.4: registro con ventana de 640 px CSS (zoom 200 % a 1280, plan §6).
    - CA-3.3: a 375 y 1023, cada botón, campo, enlace, botón de cuenta y opción del menú (abierto) mide ≥ 44 × 44 y está a ≥ 8 px del siguiente.
    - CA-3.2: recorrer el inicio de sesión con Tab; cada elemento enfocado tiene `outline` sólido de 2 px y el orden de foco coincide con el orden vertical.
    - E-6: a 320, `?expired=1` + credenciales incorrectas → dos alertas de más de una línea y sin desbordarse.
    - E-9: `html[lang=es]`.
  - Hecho cuando: los tests existen y los que dependen del aspecto fallan (p. ej., enlaces de menos de 44 px de alto); `auth.spec.ts` sigue en verde

- [x] **T-008** Escribir los E2E de preferencias del sistema, peticiones y accesibilidad
  - Depende de: T-007
  - Ficheros: `e2e/design-system.spec.ts`
  - Cubre: CA-5.1, CA-5.2, CA-5.3, CA-5.4, RF-014, RF-015, RF-016, E-4, E-8, E-13, RNF-001, RNF-003, RF-009 (axe)
  - Casos:
    - `colorScheme` dark / light → `html[data-theme]` y fondo de `body` = `rgb(6, 20, 27)` / `rgb(227, 230, 230)`.
    - E-13: `addInitScript` con `MutationObserver`: `data-theme="dark"` aparece cuando `document.body` aún es `null`.
    - E-8: con la pantalla abierta, cambiar `colorScheme` y `contrast` cambia los estilos sin navegar.
    - CA-5.2: con `contrast: 'more'`, tarjeta, campos y alertas con fondo de alfa 1 y borde de 1 px del color de ink‑600.
    - CA-5.1: con `reducedMotion: 'reduce'`, botón con `mouse.down()` → `scale` = `none`.
    - RNF-003: todas las peticiones de cada pantalla son de `https://localhost:4321`.
    - E-4: con `**/*.woff2` en `abort`, el título y los campos se ven.
    - RNF-001: axe (`@axe-core/playwright`, etiquetas `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` y la regla `color-contrast-enhanced`) en las tres pantallas × dos temas y con el menú abierto a 375 → 0 infracciones.
  - Hecho cuando: los tests existen y fallan por la razón indicada (p. ej., sin `data-theme`). Los que ya pasan hoy (probablemente RNF-003 y E-4) se anotan en el Registro, y si RNF-003 falla por la barra de herramientas de Astro, también (plan §8); `auth.spec.ts` sigue en verde

## Fase 3 · Núcleo: el catálogo

- [x] **T-009** Crear `tokens.css` con los valores del tema claro y su test de completitud
  - Depende de: T-001
  - Ficheros: `apps/web/src/styles/tokens.css` (nuevo: `@theme static`, `@theme inline` y `:root` de plan §4.2), `apps/web/src/styles/global.css` (`@import './tokens.css'` tras Tailwind), `apps/web/src/styles/tokens.test.ts` (nuevo)
  - Cubre: RNF-006 (b), RNF-005, D-1, D-2
  - Casos (test primero):
    - Lista explícita de los tokens con nombre de `DESIGN.md` §1–§8 más los nuevos de plan §4.2; cada uno está definido en `tokens.css`, y `--bp-*` se busca como `--breakpoint-*` (plan §4.6).
    - Cada `--dur*` ≤ 420 ms; `--animate-spin` usa `var(--dur-slow)`.
    - Los valores coinciden con plan §4.2 (los acentos son `oklch(0.68 0.11 h)` con los tonos aprobados).
  - Hecho cuando: el test falla primero porque `tokens.css` no existe; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; un componente temporal con `bg-gray-900` no genera CSS en `pnpm --filter @todo/web exec astro build` (se comprueba y se borra)

- [x] **T-010** Añadir el tema oscuro, la escala móvil, «aumentar contraste» y el respaldo sin blur, con el test de contraste
  - Depende de: T-009
  - Ficheros: `apps/web/src/styles/tokens.css` (`:root[data-theme='dark']`, `@media (width < 768px)`, `@media (prefers-contrast: more)`, `@supports not (backdrop-filter: blur(1px))`), `apps/web/src/styles/tokens.test.ts`
  - Cubre: RF-009, RF-010, RF-015, RF-016, CA-3.1, CA-5.2, CA-5.3, E-3, RNF-006 (b), D-12
  - Casos (test primero):
    - Un lector mínimo de bloques de `tokens.css` resuelve los tokens de cada variante: claro y oscuro × normal / sin blur / contraste.
    - Con `culori`, compone las superficies como en R-2 y exige cada par de la tabla «Texto por superficie» de plan §4.2: ≥ 7:1 el texto (≥ 4.5:1 el título display), ≥ 3:1 el anillo de error, el icono de campo y el foco.
    - El bloque oscuro redefine todos los tokens semánticos de §1.4 y los nuevos que dependen del tema.
    - Las superficies de la variante de contraste tienen alfa 1 y `--border-contrast` = ink‑600.
    - Los números coinciden con R-2 (±0.01).
  - Hecho cuando: el test falla primero porque faltan los bloques; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-011** Aplicar el lienzo, el foco, la fuente y el tema en `global.css` y `Layout.astro`
  - Depende de: T-010
  - Ficheros:
    - `apps/web/src/styles/global.css`, en `@layer base`:
      - `body`: `--bg-canvas`, `--dot-grid`, `--font-sans`, `text-body` y `--text-1`;
      - `:focus-visible` con `--focus-outline` y `outline-offset: 2px`;
      - autofill con tokens.

      Además, `@utility backdrop-glass` con `--glass-filter`.
    - `apps/web/src/layouts/Layout.astro`: script `is:inline` de tema en `<head>` (D-4) e importación de `@fontsource-variable/geist/wght.css` (D-7).
  - Cubre: RF-011, RF-016, CA-5.3, CA-5.4, E-4, E-8 (tema), E-13, RNF-003, D-4, D-5, D-7
  - Hecho cuando: `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; en `pnpm test:e2e`, los E2E de T-008 de tema (CA-5.3, CA-5.4, E-8 tema, E-13), RNF-003 y E-4 pasan en los tres proyectos; `auth.spec.ts` en verde

## Fase 4 · Integración / UI

Cada tarea escribe primero sus tests unitarios (rojo), implementa y termina en verde.

- [x] **T-012** [P] Implementar `Icon` y `Spinner`
  - Depende de: T-004, T-009
  - Ficheros: `apps/web/src/components/Icon.tsx`, `apps/web/src/components/Icon.test.tsx` (nuevo)
  - Cubre: D-8, X-9, RNF-005
  - Casos: `Icon` pinta un SVG de Lucide con `stroke-width` 1.4, el tamaño pedido (18 por defecto) y `aria-hidden="true"`; `Spinner` es `LoaderCircle` de 16 px con `animate-spin` y `aria-hidden`
  - Hecho cuando: tests en verde; `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-013** Implementar `Button` con su estado de carga
  - Depende de: T-012
  - Ficheros: `apps/web/src/components/Button.tsx`, `apps/web/src/components/Button.test.tsx` (nuevo)
  - Cubre: RF-013, CA-4.4, E-7, D-9, X-10
  - Casos (test primero):
    - Variantes `primary` (`--grad-primary`, `text-on-accent`) y `glass`; tamaños `md` (44) y `lg` (52); `fullWidth`.
    - Con `loading`: muestra `Spinner` + `loadingLabel` y lleva `aria-disabled="true"`, sin `disabled`; un clic no llama a `onClick`, y en un `<form>` no lo envía (ni con clic ni con Enter en un campo).
    - La etiqueta que no se ve lleva `aria-hidden`, así que el nombre accesible es el de la etiqueta visible.
    - Al pasar `loading` a `false` vuelve el texto original y se puede pulsar.
    - La presión con `motion-safe:active:scale-97`.
  - Hecho cuando: tests en verde; `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-014** [P] Implementar `Alert`
  - Depende de: T-012
  - Ficheros: `apps/web/src/components/Alert.tsx`, `apps/web/src/components/Alert.test.tsx` (nuevo)
  - Cubre: RF-004, E-6, X-7, D-14
  - Casos: `tone` → `data-tone` + icono (`error` → `CircleAlert`, `offline` → `TriangleAlert`, `info` → `Info`); `textContent` = el texto (el icono no añade texto); sin `role` propio; texto e icono en `text-1`; radio `--radius-md`, fondo raised con tinte `*-soft`, `border border-contrast`; sin altura fija
  - Hecho cuando: tests en verde; `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-015** [P] Rehacer el aspecto de `FormField` con el anillo y el icono de error
  - Depende de: T-012
  - Ficheros: `apps/web/src/components/FormField.tsx`, `apps/web/src/components/SignupForm.test.tsx` (caso nuevo CA-1.6)
  - Cubre: RF-005, CA-1.6, D-15, RF-010
  - Casos (test primero): con `ana@`, el campo Email tiene `aria-invalid="true"`, el mensaje de la 001 («Introduce un email válido») en `aria-describedby` y un icono SVG `aria-hidden` dentro del contenedor del campo; campo de 52 px (`h-13`), `rounded-pill`, `bg-raised`, etiqueta `text-sm text-2` con sangría de 20 px; foco con `raised-hover` + `--focus-halo`; error con un anillo `inset` de `--ring-error`
  - Hecho cuando: el caso nuevo falla primero (no hay icono); después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde, con los tests de la 001 sin tocar

- [x] **T-016** Implementar `AuthCard` y rehacer el inicio de sesión
  - Depende de: T-013, T-014, T-015
  - Ficheros: `apps/web/src/components/AuthCard.tsx`, `apps/web/src/components/LoginForm.tsx`, `apps/web/src/components/LoginForm.test.tsx`
  - Cubre: RF-001, RF-003, RF-004, RF-013, CA-1.1, CA-1.3, CA-1.5, CA-4.1, CA-4.4, E-5, E-7, X-1, D-14, D-16
  - Casos (test primero):
    - Orden del DOM (`compareDocumentPosition`): `h1` «Iniciar sesión» → zona `status` → zona `alert` → Email → Contraseña → botón → enlace, todo dentro de la tarjeta.
    - 401: alerta `data-tone="error"`, antes del Email.
    - `?expired=1`: alerta `data-tone="info"`.
    - E-5: `?expired=1` + 401 → dos alertas, primero la informativa.
    - Red: `data-tone="offline"`.
    - Con respuesta pendiente: «Iniciando sesión…», `aria-disabled` y un segundo clic no hace otra petición (E-7).
    - Tras el error, vuelve «Iniciar sesión».
  - Hecho cuando: los casos nuevos fallan primero; después, todos los tests de `LoginForm` (los de la 001 sin cambios) en verde; `pnpm lint` y `pnpm typecheck` en verde; en `pnpm test:e2e`, los de T-005 del inicio de sesión pasan en los tres proyectos

- [x] **T-017** Rehacer el registro
  - Depende de: T-016
  - Ficheros: `apps/web/src/components/SignupForm.tsx`, `apps/web/src/components/SignupForm.test.tsx`
  - Cubre: RF-002, RF-003, RF-004, RF-013, CA-1.2, CA-1.4, CA-4.2, CA-4.4, E-7, RF-019
  - Casos (test primero):
    - Orden del DOM como en T-016, con `h1` «Crear cuenta».
    - Red: alerta `data-tone="offline"` encima del Email.
    - Pendiente: «Creando cuenta…».
    - El test de la 001 «E-8 el botón queda desactivado mientras se envía» pasa a comprobar `aria-disabled="true"` y que un segundo clic no hace otra petición (plan §7; es el único test de la 001 que cambia).
  - Hecho cuando: los casos nuevos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; en `pnpm test:e2e`, todos los de T-005 pasan en los tres proyectos y `auth.spec.ts` sigue en verde

- [x] **T-018** [P] Implementar el menú de cuenta: abrir, cerrar y teclado
  - Depende de: T-003, T-012
  - Ficheros: `apps/web/src/components/AccountMenu.tsx`, `apps/web/src/components/AccountMenu.test.tsx` (nuevo)
  - Cubre: RF-020, RF-021, RF-022, RF-023, CA-2.4, CA-2.5, CA-2.6, E-11, E-14, X-2, X-3, D-10, D-16
  - Casos (test primero, `user-event`):
    - El botón con «A» tiene nombre «Cuenta de ana@example.com», `aria-haspopup="menu"` y `aria-expanded`.
    - Al activarlo se abre el panel con el email y `role="menu"` (con `aria-labelledby` al email) y la opción «Cerrar sesión», que llama a `onLogout`.
    - Enter y Espacio abren y enfocan la primera opción; las flechas mueven el foco en bucle.
    - Esc cierra y devuelve el foco al botón; `pointerdown` fuera cierra; volver a pulsar el botón cierra.
    - E-14: con un botón centinela después del menú, Tab desde la opción cierra y el foco va al centinela.
    - E-11: `1ana@example.com` → «1».
    - Opciones y botón de 44 px.
  - Hecho cuando: tests en verde; `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-019** Completar el menú de cuenta: espera, error y cambio de ancho
  - Depende de: T-013, T-018
  - Ficheros: `apps/web/src/components/AccountMenu.tsx`, `apps/web/src/components/AccountMenu.test.tsx`
  - Cubre: RF-013, CA-4.3, E-10, E-12, D-9, D-10
  - Casos (test primero):
    - Con `loggingOut`, el menú sigue abierto y la opción muestra «Cerrando sesión…» + `Spinner`, con `aria-disabled`; un segundo clic no llama a `onLogout`.
    - E-12: si se llama al `onError` recibido por `onLogout`, el menú se cierra y el foco queda en el botón de cuenta.
    - E-10: con el menú abierto, `setMediaMatches('(min-width: 768px)', true)` lo cierra.
  - Hecho cuando: los casos nuevos fallan primero; después, tests en verde; `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-020** Implementar la cabecera con el email recortado y su tooltip
  - Depende de: T-013, T-019
  - Ficheros: `apps/web/src/components/AppHeader.tsx`, `apps/web/src/components/AppHeader.test.tsx` (nuevo)
  - Cubre: RF-006, RF-007, CA-2.1, CA-2.2, E-1, X-8, D-11, D-13
  - Casos (test primero):
    - El `banner` contiene la píldora «Mis tareas» (no es un encabezado), el email y el `Button` glass «Cerrar sesión», en la variante `max-md:hidden`, y `AccountMenu` en la variante `md:hidden`.
    - `sticky top-0`, `bg-header`, `backdrop-glass` y `z-(--z-sticky)`.
    - E-1, con `scrollWidth > clientWidth` simulado: con el foco en el email, a los 400 ms (temporizador simulado) aparece un tooltip `aria-hidden` con el email completo; Esc lo oculta; sin recorte no aparece.
    - El `textContent` del email es el email completo.
  - Hecho cuando: tests en verde; `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-021** Rehacer la zona privada
  - Depende de: T-014, T-020
  - Ficheros: `apps/web/src/components/PrivateArea.tsx`, `apps/web/src/components/PrivateArea.test.tsx`
  - Cubre: RF-006, RF-008, RF-013, RF-024, CA-2.1, CA-2.3, CA-4.3, CA-4.4, E-7, E-12, RF-019
  - Casos (test primero):
    - `AppHeader` fuera de `<main>`; un único `heading` de nivel 1, «Mis tareas», dentro de `<main>` con `text-display`.
    - Logout con 500: zona `role="alert"` con `data-tone="offline"` después del `banner` y antes del `h1`.
    - Logout pendiente: «Cerrando sesión…» en el botón de escritorio; doble clic → una sola petición (E-7).
    - Logout desde el menú con 500: menú cerrado y alerta visible (E-12, a través de `onLogout`).
    - Los tests de la 001 (`RF-015`, `D-11`, `RNF-001`, `CA-3.2`, `RF-012`) siguen sin cambios.
  - Hecho cuando: los casos nuevos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; en `pnpm test:e2e`, los de T-006 pasan en los tres proyectos y `auth.spec.ts` sigue en verde

- [x] **T-022** Añadir el test de reglas del catálogo
  - Depende de: T-017, T-021
  - Ficheros: `apps/web/src/design-rules.test.ts` (nuevo); componentes solo si aparece algún caso
  - Cubre: RNF-006 (a), RF-014, RNF-005, D-3, ADR-0003
  - Casos: en `apps/web/src/**/*.{tsx,astro}` (sin `*.test.*`) y en `global.css`, cero casos de:
    - colores literales (`#hex`, `rgb(`, `hsl(`, `oklch(`);
    - valores entre corchetes (`-[`);
    - `style=`;
    - `z-`, `duration-` o `delay-` seguidos de un número;
    - `scale-`, `translate-` o `rotate-` sin `motion-safe:`.

    Además, cada `(--x)` existe en `tokens.css`.
  - Hecho cuando: el test pasa; con una violación temporal de cada tipo en un componente, falla con el fichero y la línea (se comprueba y se deshace); `pnpm lint` y `pnpm typecheck` en verde

## Fase 5 · Pulido y cierre

- [x] **T-023** Poner en verde todos los E2E en los tres proyectos
  - Depende de: T-011, T-017, T-021, T-022
  - Ficheros: `e2e/design-system.spec.ts` (solo ajustes de selectores o esperas); cualquier corrección de comportamiento o aspecto en `apps/web` se anota en el Registro
  - Cubre: RNF-001, RNF-002, RNF-003, RNF-004, CA-3.2, CA-3.3, CA-3.4, CA-5.1, CA-5.2, E-2, E-6, E-8, E-14, y todos los de T-005–T-008
  - Hecho cuando: `pnpm test:e2e` (`design-system.spec.ts` y `auth.spec.ts`) en verde en `chromium`, `chrome` y `webkit`; axe sin infracciones; si E-14 falla en algún navegador, se aplica el plan B de plan §8 y se anota como `D-x (añadida en T-023)`

- [x] **T-024** [P] Actualizar `DESIGN.md` con los valores y las reglas nuevas
  - Depende de: T-010
  - Ficheros: `DESIGN.md`
  - Cubre: RNF-006 (c), plan §4.6, `DESIGN.md` §19
  - Hecho cuando:
    - `DESIGN.md` tiene los valores de plan §4.2 en §1.3, §1.4, §3.3, §4 (`--bp-*` ↔ `--breakpoint-*`), §5, §6.2, §8 y §17;
    - X-4, X-5, X-6, X-7 y X-11 están escritas como reglas;
    - los puntos 1 y 2 de «Pendiente de decidir» se han quitado;
    - la versión es 1.2.0-todo.1, con su entrada en el «Historial»;
    - cada valor coincide con `tokens.css` (revisado token a token con `grep`)

- [x] **T-025** [P] Comprobar la trazabilidad de requisitos, criterios y casos límite en los tests
  - Depende de: T-023
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, todos los RF, CA y E
  - Hecho cuando: un `grep` en `apps/web/src/**/*.test.ts(x)` y `e2e/*.spec.ts` encuentra al menos un test que empieza por cada RF-001…RF-016 y RF-019…RF-024, CA-1.1…CA-1.6, CA-2.1…CA-2.6, CA-3.1…CA-3.4, CA-4.1…CA-4.4, CA-5.1…CA-5.4, E-1…E-14 y RNF-001…RNF-006. La lista de lo encontrado se anota en el Registro

- [x] **T-027** Sacar el panel del menú de cuenta de la cabecera y medir su contraste sobre lo que tiene detrás
  - Depende de: T-021, T-010
  - Origen: verificación del 2026-10-29, problema B-1 (`verificacion.md`). El panel está dentro de la cabecera, que ya lleva `backdrop-filter`, así que su desenfoque no llega al contenido de la página. El título «Mis tareas» se ve nítido detrás del email y de «Cerrar sesión»: en oscuro, 4.53:1 y 5.43:1
  - Ficheros: `apps/web/src/components/AccountMenu.tsx` (panel en un portal en `<body>`, D-21), `apps/web/src/components/AppHeader.test.tsx` (caso nuevo), `apps/web/src/components/AccountMenu.test.tsx` (si hace falta), `apps/web/src/styles/tokens.test.ts` (menú medido sobre la página, no sobre la cabecera), `specs/004-sistema-de-diseno/research.md` (R-2: celdas del menú)
  - Cubre: RF-009, CA-3.1, D-10, D-12, D-21
  - Casos (test primero):
    - Con el menú abierto, el panel no está dentro de ningún elemento con `backdrop-glass`: un `backdrop-filter` dentro de otro solo desenfoca lo que hay en su padre.
    - `tokens.test.ts`: el menú y su opción con foco se componen sobre la página (lienzo, o un punto de la retícula sin blur), no sobre la cabecera, y siguen ≥ 7:1 en las seis variantes.
    - Los tests del menú (RF-020–RF-023, E-10–E-12, E-14) siguen en verde.
  - Hecho cuando: los casos nuevos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; en `pnpm test:e2e`, los E2E de T-006, T-007 (CA-3.3) y T-008 (axe con el menú abierto) pasan en los tres proyectos; una captura a 375 con el menú abierto, en los dos temas, muestra el título desenfocado detrás del panel

- [ ] **T-026** Ejecutar `/sdd-verificar`
  - Depende de: T-023, T-024, T-025, T-027
  - Ficheros: `specs/004-sistema-de-diseno/verificacion.md`
  - Cubre: todos, incluida la checklist manual de `DESIGN.md` §21 (plan §7): tres pantallas en los dos temas, con «aumentar contraste» y a 375, 768 y 1280. También la revisión de X-9 (velocidad del anillo de carga, plan §8)
  - Hecho cuando: el informe da APTO o APTO CON OBSERVACIONES y el Definition of Done está completo

## Cobertura

| ID | Tareas |
|----|--------|
| RF-001 | T-005, T-016, T-023 |
| RF-002 | T-005, T-016, T-017 |
| RF-003 | T-005, T-016, T-017 |
| RF-004 | T-004, T-005, T-014, T-016, T-017 |
| RF-005 | T-005, T-015 |
| RF-006 | T-006, T-020, T-021 |
| RF-007 | T-006, T-020 |
| RF-008 | T-006, T-021 |
| RF-009 | T-008, T-010, T-023, T-027 |
| RF-010 | T-010, T-015 |
| RF-011 | T-007, T-011 |
| RF-012 | T-007, T-018, T-023 |
| RF-013 | T-005, T-006, T-013, T-016, T-017, T-019, T-021 |
| RF-014 | T-008, T-013, T-022 |
| RF-015 | T-008, T-010 |
| RF-016 | T-008, T-010, T-011 |
| ~~RF-017~~ | Eliminado en la spec (pasa a RNF-006) |
| ~~RF-018~~ | Eliminado en la spec (pasa a RNF-006) |
| RF-019 | T-002, T-004, T-017, T-021, T-023 |
| RF-020 | T-006, T-018 |
| RF-021 | T-018 |
| RF-022 | T-006, T-018 |
| RF-023 | T-018 |
| RF-024 | T-006, T-021 |
| CA-1.1 | T-005, T-016 |
| CA-1.2 | T-005, T-017 |
| CA-1.3 | T-016 |
| CA-1.4 | T-005, T-017 |
| CA-1.5 | T-016 |
| CA-1.6 | T-005, T-015 |
| CA-2.1 | T-006, T-020, T-021 |
| CA-2.2 | T-006, T-020 |
| CA-2.3 | T-006, T-021 |
| CA-2.4 | T-006, T-018 |
| CA-2.5 | T-018 |
| CA-2.6 | T-006, T-018 |
| CA-3.1 | T-008, T-010, T-027 |
| CA-3.2 | T-007, T-023 |
| CA-3.3 | T-007, T-023 |
| CA-3.4 | T-007, T-023 |
| CA-4.1 | T-005, T-016 |
| CA-4.2 | T-005, T-017 |
| CA-4.3 | T-006, T-019, T-021 |
| CA-4.4 | T-013, T-016, T-017, T-021 |
| CA-5.1 | T-008, T-023 |
| CA-5.2 | T-008, T-010, T-023 |
| CA-5.3 | T-008, T-010, T-011 |
| CA-5.4 | T-008, T-011 |
| ~~CA-6.1~~, ~~CA-6.2~~ | Eliminados en la spec (pasan a RNF-006) |
| E-1 | T-006, T-020 |
| E-2 | T-007, T-023 |
| E-3 | T-010 |
| E-4 | T-008, T-011 |
| E-5 | T-016 |
| E-6 | T-007, T-014, T-023 |
| E-7 | T-013, T-016, T-017, T-021 |
| E-8 | T-008, T-011, T-023 |
| E-9 | T-007 |
| E-10 | T-003, T-006, T-019 |
| E-11 | T-018 |
| E-12 | T-019, T-021 |
| E-13 | T-008, T-011 |
| E-14 | T-006, T-018, T-023 |
| RNF-001 | T-008, T-023, T-026 |
| RNF-002 | T-007, T-023 |
| RNF-003 | T-008, T-011, T-023 |
| RNF-004 | T-002, T-023 |
| RNF-005 | T-009, T-012, T-022 |
| RNF-006 | T-009 (b), T-010 (b), T-022 (a), T-024 (c) |

## Registro

| Tarea | Commit | Notas |
|-------|--------|-------|
| T-001 | 8d42da5 | Versiones instaladas con `--save-exact`, iguales a R-7: `lucide-react` 1.62.0, `@fontsource-variable/geist` 5.3.0, `culori` 4.0.2, `@types/culori` 4.0.1 (web) y `@axe-core/playwright` 4.14.0 (raíz). La política de cadena de suministro de pnpm 11 pasa sin excepciones a `minimumReleaseAge`. `pnpm lint` ya fallaba en la rama antes de esta tarea: Prettier marcaba `DESIGN.md` (commit f5a3341, escrito a mano). Con el visto bueno del usuario, `DESIGN.md` se añade a `.prettierignore`, junto a `CLAUDE.md` |
| T-002 | 08ab097 | `e2e/helpers.ts` exporta las doce utilidades de la tarea; `MAX_TABS` queda dentro del módulo, porque solo lo usa `tabTo`. `auth.spec.ts` importa solo las ocho que usa; el diff no toca ningún `test(...)` (Prettier solo reajusta las líneas en blanco). `pnpm test:e2e`: 21/21 en `chromium`, `chrome` y `webkit` |
| T-003 | e3af216 | El test temporal falló primero con `TypeError: window.matchMedia is not a function`. `FakeMediaQueryList` extiende `EventTarget` (sin `addListener`/`removeListener`, la API antigua) y hay una lista por consulta: todos los `matchMedia` con la misma consulta comparten oyentes. `setMediaMatches` lanza `change` siempre, aunque el valor no cambie. Por defecto ninguna consulta coincide. Las listas se vacían en `afterEach` y `vi.unstubAllGlobals` restaura el global. Test temporal (2 casos) en verde y borrado |
| T-004 | cbb9c76 | `messages.test.ts` falló primero con `expected undefined to be 'error'`. `AlertTone` vive en `Alert.tsx` (plan §4.3) y `messages.ts` lo importa solo como tipo. Nombres que el plan no fijaba: `IconProps`, `AlertProps`, `AuthCardProps`, `AppHeaderProps` y `AccountMenuProps`. Los contratos devuelven `null` (`void props` para que ESLint no marque la prop sin usar) hasta su tarea. `EMAIL_ALREADY_REGISTERED` → `'error'` y `UNEXPECTED` → `'offline'`. Los tests de la 001, sin tocar: 119/119; `auth.spec.ts` 21/21 |
| T-005 | 231b98d | 7 casos × 3 proyectos = 21, todos en rojo por el aspecto: CA-1.1 mide 384 px (`max-w-sm`); CA-1.2 mide 375 / 320 (sin margen de 16 px); CA-1.6 «`--ring-error` no está definido»; CA-1.4 no hay `[data-tone="offline"]`; CA-4.1 y CA-4.2 no aparece «Iniciando sesión…» / «Creando cuenta…». `auth.spec.ts` 21/21. Selectores que el plan no fijaba: la tarjeta es el padre directo del `h1` (`authCard`) y el botón principal es el único `button` del `form` (`submitButton`), porque su nombre cambia mientras espera. El color de `--ring-error` se lee con un `span` de prueba (`color: var(--ring-error)`), así sale con la misma notación que `box-shadow`, y se espera con `expect.poll` por si el campo tiene transición. Las utilidades propias (`box`, `open`, `expectNoHorizontalScroll`, `fillCredentials`, `slowDown`) se quedan en el spec: un solo uso (C-22) |
| T-006 | 502df74 | 10 casos × 3 proyectos = 30, todos en rojo: no hay `banner` (la `<header>` de la 001 está dentro de `<main>`, así que no es un landmark), no hay botón «Cuenta de …» ni `[data-tone]`, y el `h1` mide 24 px en vez de 40. La cuenta con el email de 254 caracteres se registra bien. `auth.spec.ts` 21/21. Decisiones de test que el plan no fijaba: los emails empiezan por `ana-` para que la inicial sea «A»; el de 254 caracteres es `e2e-{uuid}` relleno hasta 64 + el dominio de 189 del test de `shared`; textos y botones de la cabecera con `filter({ visible: true })`, porque el email también estará en el menú cerrado y en el tooltip; la píldora del email se busca por `[tabindex="0"]` (D-13); el tooltip es «el elemento visible de la cabecera con el email entero y sin recortar», porque es `aria-hidden` y no tiene rol; entre el ratón y el foco se oculta con Esc (D-13). E-14 usa el fixture `browserName` para pulsar Alt+Tab en WebKit, en lugar de tocar `helpers.ts`. Aviso para T-023: los casos que esperan con `click`/`boundingBox` agotan los 30 s del test mientras sigan en rojo |
| T-007 | 9d18df9 | 9 casos × 3 proyectos. En rojo por el aspecto: RNF-002 de la zona privada (a 320, `scrollWidth` 339–347), CA-3.3 a 375 y 1023 (el campo Email mide 42 px de alto) y E-6 (no hay `[data-tone]`). **Ya pasan hoy:** RNF-002 de inicio de sesión y registro, CA-3.4, CA-3.2 (la 001 ya pinta un contorno sólido de 2 px con `focus-visible`) y E-9. Decisiones de test que el plan no fijaba: «interactivo» = `a[href], button, input, [tabindex="0"]` visibles, en orden del DOM (la barra de Astro está en un shadow root y no entra); «a 8 px del siguiente» = la mayor de las separaciones en horizontal o en vertical respecto al siguiente en el DOM; en E-6, las líneas se cuentan por las alturas distintas a las que empiezan los trozos de texto de la alerta; en CA-3.4, la ventana mide 640 × 450 (1280 × 900 con zoom al 200 %). `tabKey(browserName)` se extrae dentro del spec y E-14 pasa a usarlo. `auth.spec.ts` 21/21 |
| T-008 | 84ea9b1 | 10 casos × 3 proyectos. En rojo por la razón indicada: CA-5.3 y CA-5.4 (no hay `data-theme`), E-13 (`themeBeforeBody` sin valor), E-8 (fondo de `body` `rgba(0, 0, 0, 0)`), CA-5.2 (no hay `[data-tone]`) y RNF-001 (falta el botón de cuenta para abrir el menú; las tres pantallas ya dan 0 infracciones en los dos temas). **Ya pasan hoy:** RNF-003 (la barra de herramientas de Astro no pide nada a terceros, así que no hace falta `devToolbar: { enabled: false }`, plan §8), E-4 y CA-5.1. Detalles: `color-contrast-enhanced` no lleva ninguna de las etiquetas WCAG AA, así que axe hace una segunda pasada con `withRules`, una detrás de otra («Axe is already running» si van a la vez); se excluye `astro-dev-toolbar`. RNF-003 descarta las URL `data:`. CA-5.2 compara el borde con ink‑600 calculado (`rgb(74, 92, 106)`) y lee el alfa de `rgba()`, de `… / a)` o de `transparent`. `auth.spec.ts` 21/21 |
| T-009 | d5ef0f7 | El test falló primero con `ENOENT` (no había `tokens.css`). Con jsdom, `import.meta.url` no es una URL `file:`: el test lee el fichero con `import.meta.dirname`. Prettier reescribe los valores de `tokens.css` (hex en minúsculas, `.60` → `0.6`, espacio tras las comas), así que el test los compara en forma canónica. `readBlocks` es el lector de bloques que también usará T-010: cada bloque guarda su ruta de selectores. Decisiones que el plan no fijaba: `*-soft` solo para sage, rose, lilac y amber (los mismos que `--pill-*`; `--signal` es solo el punto de aviso); `--text-h3` con peso 300 (§2.2 da 300–400 y §2.3 dice «desde 20px, Light 300»); nombres de clase en `@theme inline`: `canvas`, `glass`, `raised`, `raised-hover`, `sunken`, `folder`, `row`, `header`, `tooltip`, `1`, `2`, `3`, `on-accent`, `on-pill`, `on-tooltip`, `ring-error`, `contrast` y `{sage,rose,lilac,amber}-soft`. Comprobado con `astro build`: un componente temporal con `bg-gray-900 bg-canvas text-display` no genera `gray-900` y sí `.bg-canvas` y `.text-display` (con interlineado, tracking y peso); el componente y `dist/` se borraron. Desde aquí, las clases de color y de tamaño de la 001 (`bg-gray-900`, `text-red-700`, `text-2xl`) dejan de generar CSS hasta la fase 4. 105 tests nuevos; `auth.spec.ts` 21/21 |
| T-010 | d799cbc | El test falló primero porque faltaban los bloques (59 casos: el bloque oscuro no redefinía nada, la escala móvil estaba vacía y el glass seguía con alfa 0.6). Para reproducir R-2 con ±0.005, `culori` lee los colores, cada composición se hace en sRGB y se guarda con 8 bits por canal, como el navegador. Lo que no lleva blur (el título «Mis tareas», la alerta bajo la cabecera) se mide siempre sobre un punto de la retícula. **Errata de R-2:** la píldora de la cabecera y el menú de cuenta en la columna SB se habían calculado con la cabecera al 80 %, no al 92 % de X-11. Corregido en research (17.05 / 14.51 y 11.18; antes 16.93, 14.49 y 11.06); todo sigue ≥ 7:1 y el peor caso no cambia. **D-18 (añadida al plan):** el bloque de contraste va después del de sin blur, para que ganen las superficies opacas si coinciden. Además de la tabla «Texto por superficie», el test comprueba el tooltip (16.34), `--pill-*` (mínimo 7.71, rose) y `--pill-ink` (8.86). `--text-on-accent` y `--text-on-pill` se repiten en el bloque oscuro con el mismo valor, porque DESIGN.md §1.4 los lista. 324 tests; `auth.spec.ts` 21/21 |
| T-011 | ca8f4b9 | Test primero: los E2E de T-008, ya en rojo («sin `data-theme`»). Ahora pasan CA-5.3, CA-5.4, E-13, RNF-003 y E-4 en los tres proyectos. En E-8 la parte del tema pasa; el paso de contraste sigue en rojo hasta que la tarjeta lleve `border-contrast` (T-016). Autorrelleno: Chrome y Safari pintan el fondo con `!important`, así que no se puede sustituir por el token. Se mantiene `-webkit-text-fill-color: var(--text-1)` y se aplaza el cambio de fondo con `transition: background-color 0s 86400s`, que nunca llega a verse, así que no es una animación (RNF-005). El campo conserva su propio fondo raised sin tocar `box-shadow`, que lo usan el anillo de error y el halo de foco (D-15). El script de tema va en un bloque `{ … }` para no dejar variables globales. `backdrop-glass` emite también `-webkit-backdrop-filter`. `auth.spec.ts` 21/21 |
| T-012 | d84ea63 | Los 3 casos fallaron primero con «no hay SVG» (el contrato devolvía `null`). Lucide 1.62 pinta `class="lucide lucide-{nombre}"`, `width`/`height` y `stroke-width` como atributos; `aria-hidden="true"` se pasa explícito. Comprobado con `astro build`: `.animate-spin{animation:var(--animate-spin)}`, `--animate-spin: spin var(--dur-slow) linear infinite` y los `@keyframes spin` por defecto de Tailwind se mantienen |
| T-013 | 7854459 | Los 6 casos fallaron primero (el contrato devolvía `null`). Clases que el plan no fijaba: primary = `bg-(image:--grad-primary) text-on-accent shadow-(--shadow-accent)`; glass = `border border-contrast bg-glass backdrop-glass text-1 shadow-(--shadow-pill) hover:bg-raised` (sube un nivel al pasar el ratón, §8); md = `h-11 px-5` (padding 20 de §14) y lg = `h-13 px-6.5` (26). Las dos tallas usan `text-body`: §14 da 16 px para lg, pero la escala de §2.2 no tiene 16 en escritorio. El anillo va siempre en la etiqueta del gerundio, que es invisible y `aria-hidden` mientras no se espera; así el botón mide desde el principio lo que la etiqueta más larga (D-9). El test de Enter en un campo usa un caso de control (sin espera, Enter sí envía). Comprobado con `astro build` que se generan todas las clases (`scale-97`, `px-6.5`, `bg-(image:…)`, `duration-(--dur-fast)`) |
| T-014 | e31925f | Los 5 casos fallaron primero con «no hay alerta». El tinte sobre el fondo raised es un degradado del mismo color (`bg-raised bg-linear-to-r from-rose-soft to-rose-soft`): el fondo base sigue siendo `background-color` raised, que es lo que mide CA-5.2 (opaco con contraste), y el tinte va en `background-image`. Medidas que el plan no fijaba: `px-5 py-3.5`, `gap-3` e icono de 18 px con `mt-0.5` para alinearlo con la primera línea; texto con `min-w-0 text-pretty` (E-6) |
| T-015 | cacef76 | CA-1.6 falló primero (no había icono). **Toca dos ficheros fuera de la lista** (`tokens.css` y `tokens.test.ts`) para el token nuevo `--ring-error-width: 1.5px`: **D-19 (añadida al plan)**. Hallazgo: `inset-ring-1.5` no existe en Tailwind 4.3, y `inset-ring-2`, `ring-2` o `border-2` se leen como el color `--color-2`; en las tareas siguientes no hay que usar anchos numéricos 1/2/3 (para `border` vale `border`, de 1 px). El icono se centra con `absolute inset-y-0 end-5 flex items-center`, no con `-translate-y-1/2`, que D-3 solo admite con `motion-safe:`. Mensaje en `text-1` (D-15), etiqueta `ps-5 text-sm text-2`. Los tests de la 001, sin tocar; el E2E CA-1.6 ya pasa en los tres proyectos; `auth.spec.ts` 21/21 |
| T-016 | 175e19d | Los 7 casos nuevos fallaron primero; los 13 de la 001 siguieron en verde sin tocarlos. `AuthCard`: `<main>` en rejilla centrada con `px-4 py-10` y tarjeta `w-full max-w-105 rounded-xl border border-contrast bg-glass p-7 max-md:p-5 shadow-(--shadow-glass) backdrop-glass` (padding de 28 y de 20 en móvil, §3.1); título `text-h1 text-balance` como primer hijo; el pie es un `<p class="text-2">`. El enlace es `inline-flex min-h-11` (RF-012) en `text-1` subrayado. La zona `status` solo existe con `?expired=1`, como en la 001 (D-14). En los tres proyectos ya pasan los E2E de T-005 del inicio de sesión (CA-1.1 y CA-4.1); `auth.spec.ts` 21/21 |
| T-017 | 108d56f | Los 3 casos nuevos y el E-8 ajustado fallaron primero. El test de la 001 «E-8 el botón "Crear cuenta" queda desactivado mientras se envía» comprueba ahora `aria-disabled="true"` y que un segundo clic no hace otra petición (plan §7; es el único test de la 001 que cambia). Los E2E de T-005 pasan, 21/21 en los tres proyectos. **Intermitente en `auth.spec.ts`:** 3 de unas 10 ejecuciones, siempre en WebKit y con los tres proyectos en paralelo, falló la hidratación de una isla («[astro-island] Error hydrating /src/components/SignupForm.tsx TypeError: Importing a module script failed») y no aparecía el campo Email. No ocurre con WebKit solo, y después pasó 6 de 6 veces seguidas. Ocurrió justo después de editar el código, con el servidor de desarrollo compilando en frío. Es del servidor de desarrollo (Vite sirve los módulos sin empaquetar), no del código de la app, pero cada isla importa ahora más módulos (Icon, Button, Alert, FormField, AuthCard). Queda como riesgo para T-023: si vuelve, investigar un calentamiento del servidor antes de los tests |
| T-018 | 2e40b35 | Los 11 casos fallaron primero (el contrato devolvía `null`). El panel está siempre en el DOM con el atributo `hidden`; al abrir, `flushSync` lo pinta antes de llevar el foco a la primera opción, y no hace falta un efecto que mueva el foco (los efectos solo se suscriben a eventos del navegador, plan §2). El único efecto escucha `pointerdown` en `document` mientras el menú está abierto. El clic en el propio botón no cuenta como «fuera», así que el botón funciona como interruptor (RF-021). Medidas que el plan no fijaba: panel `w-72` (288 px, cabe a 320) alineado a la derecha del botón con `mt-2`, `rounded-md`, `p-1.5` (6 px de §14 Menu), `bg-raised backdrop-glass shadow-(--shadow-float) border border-contrast` y `z-(--z-popover)`; email en `text-sm text-1 wrap-anywhere`. El test de las flechas recorre las opciones que haya (hoy solo una) |
| T-019 | 2eb5c5c | Los 3 casos nuevos fallaron primero (no había «Cerrando sesión…» y el menú seguía abierto). La opción llama a `onLogout({ onError: close })`; `close` es la misma función de Esc (cierra con `flushSync` y enfoca el botón). La opción no reutiliza `Button`, porque necesita `role="menuitem"` y `tabIndex={-1}`: muestra `Spinner` + «Cerrando sesión…» con `aria-disabled` y no apila las etiquetas, porque ya ocupa todo el ancho del panel. El efecto de E-10 se suscribe a `matchMedia('(min-width: 768px)')` solo mientras el menú está abierto; el valor va literal, porque `matchMedia` no admite `var()` (= `--breakpoint-md`). Sin avisos de `act` ni de `flushSync` en la salida de los tests |
| T-020 | 7dcdb64 | Los 8 casos fallaron primero (el contrato devolvía `null`). `EmailPill` va en el mismo fichero (un solo uso). Se recorta con `block truncate max-w-80 min-w-0 leading-11`. El tooltip es hermano de la píldora, dentro de un contenedor `relative` que escucha `mouseenter`/`mouseleave`, porque si estuviera dentro del elemento con `overflow: hidden` quedaría recortado; el ratón puede pasar de la píldora al tooltip sin que desaparezca (WCAG 1.4.13). Esc lo oculta con un `keydown` en `document` solo mientras se ve. Retardo de 400 ms en una constante (`TOOLTIP_DELAY_MS`, §14). Tooltip: `bg-tooltip text-on-tooltip text-sm rounded-md wrap-anywhere w-max max-w-96`, alineado a la derecha, debajo de la píldora y con `z-(--z-tooltip)`. Contenido de la cabecera: `max-w-420` (1680 px, D-11) y `px-4 md:px-7` (§3.1). Comprobado con `astro build`: `max-md:hidden` sale como `@media not all and (width>=768px)` |
| T-021 | 2b94858 | Los 4 casos nuevos fallaron primero; los 10 de la 001 siguen sin cambios. `onLogout` llama a `logout.mutate(undefined, { onError })`, así que el menú se cierra si falla (E-12) sin tocar `auth-queries.ts`. `<main>`: `max-w-420 px-4 py-8 md:px-7`, con la zona `alert` primero y el `h1` `text-display text-balance` después. **Ficheros fuera de la lista (imprescindibles):** (1) `AccountMenu.tsx`: el panel solo pinta su contenido cuando está abierto. Con el email también en el panel cerrado, `getByText(email)` encontraba dos elementos y fallaban los tests de la 001 (`RF-015`, `D-11`) y el `expectPrivateArea` de los E2E (RF-019). El panel sigue en el DOM para `aria-controls`. (2) `e2e/design-system.spec.ts`, E-1: la heurística del tooltip daba por bueno el contenedor de la píldora, que tiene el mismo `textContent` y no se desborda aunque el email esté recortado dentro. Ahora exige que el email sea texto propio del elemento, y comprueba antes de pasar el ratón que no se ve el email completo, para que el test no sea vacío. Los 30 E2E de T-006 en verde en los tres proyectos; `auth.spec.ts` 21/21 |
| T-022 | f140386 | El test pasó a la primera: ningún componente tenía casos, así que no hubo que tocar componentes. Revisa los `*.tsx` y `*.astro` de `apps/web/src` (sin `*.test.*`) y `styles/global.css`. Un primer caso comprueba que la lista de ficheros incluye componentes, páginas, layout y `global.css`, para que el test no pase por no leer nada. Las referencias con tipo (`bg-(image:--grad-primary)`, `inset-ring-(length:--ring-error-width)`) y los `var(--x)` de `global.css` también se comprueban contra `tokens.css`. Comprobado con un `TempViolations.tsx` temporal, ya borrado: 12 avisos, cada uno con fichero y línea (`components/TempViolations.tsx:4 capa o tiempo con número: z-10`); `motion-safe:rotate-3` no cuenta como violación |
| T-023 | e2353c6 | `pnpm test:e2e` en verde en `chromium`, `chrome` y `webkit` (129 tests: `design-system.spec.ts` y `auth.spec.ts`) en 4 ejecuciones seguidas; en dos, 1–2 tests de WebKit pasaron al reintento («flaky»). axe, sin infracciones. E-14 pasa en los tres navegadores, así que no hace falta el plan B. Cambios: (1) `design-system.spec.ts`: `openPrivateArea` registra siempre a 1280 px; si la ventana ya era estrecha, `signup` no veía el email (CA-3.3 a 375). Sin cambios en la app. (2) **D-20 (añadida al plan, la decidió el usuario):** `retries: 1` solo en el proyecto `webkit`. Diagnóstico: `FAILED …/node_modules/.vite/deps/jsx-runtime-….js The network connection was lost`. WebKit pierde una conexión keep-alive con el servidor de desarrollo y la isla no se hidrata; pasaba en unas 4 de cada 10 ejecuciones y solo con los tres proyectos a la vez. Probé subir `keepAliveTimeout` con un plugin de Vite: siguió fallando 2 de 6 veces y lo revertí. Las dependencias ya estaban preempaquetadas y no hubo reoptimización de Vite |
| T-024 | ae38f94 | `DESIGN.md` 1.2.0-todo.1. Valores de plan §4.2 en §1.3 (acentos, `*-soft`, `--pill-*`, `--pill-ink`, `--grad-primary`), §1.4 (filas nuevas: `--surface-header`, tooltip, `--ring-error`, `--border-contrast`), §3.3 (retícula), §4 (`--bp-*` ↔ `--breakpoint-*`), §5 (md 26, lg 30), §6.2 (tabla de sombras y `--border-glass`), §8 (`--focus-outline`, `--focus-halo`) y §17 (valores opacos). Reglas: X-4 en §8, X-5 y X-7 en §1.4, X-6 en §1.3 y X-11 en §6.3. También se documenta `--ring-error-width` (D-19). Se quitan los puntos 1 y 2 de «Pendiente de decidir» y se renumeran los demás; se actualizan la versión, el párrafo de origen y el historial. 55 valores revisados uno a uno contra `tokens.css` con un script (en forma canónica, por el formato de Prettier): todos coinciden. Observación para T-026: §18 dice que `global.css` expone los tokens con `@theme`, pero hoy el `@theme` está en `tokens.css` y `global.css` lo importa; no se toca porque la tarea no lo pide |
| T-025 | 9987799 | Los IDs de la 001 se repiten en la 004 (CA-1.1, E-5…), así que solo cuentan los tests de la 004: `design-system.spec.ts`, `tokens.test.ts`, `design-rules.test.ts`, `messages.test.ts`, los tests de `Icon`, `Button`, `Alert`, `AccountMenu` y `AppHeader`, los bloques «· sistema de diseño» de `LoginForm`, `SignupForm` y `PrivateArea`, y el caso CA-1.6 (D-15) de `SignupForm`. **Faltaban 2 de 66:** RF-019 (nuevo test `RF-019 los textos de los avisos son los de la spec 001` en `messages.test.ts`) y RNF-004 (se añade a los títulos de los E2E de RNF-002, que recorren los anchos de móvil en los tres proyectos). **Encontrados, 66/66:** RF-001 y RF-002 (E2E); RF-003 (Login, Signup, E2E); RF-004 (Alert, Login, Signup, messages, E2E); RF-005 (Signup, E2E); RF-006 (AppHeader, PrivateArea, E2E); RF-007 (AppHeader, E2E); RF-008 (PrivateArea, E2E); RF-009 (tokens, E2E); RF-010 (Signup, tokens); RF-011 (E2E); RF-012 (AccountMenu, E2E); RF-013 (AccountMenu, Button, Login, PrivateArea, Signup, E2E); RF-014 (Button, design-rules, E2E); RF-015 y RF-016 (tokens, E2E); RF-019 (messages); RF-020, RF-022 y RF-023 (AccountMenu, E2E); RF-021 (AccountMenu); RF-024 (AppHeader, PrivateArea, E2E); CA-1.1 (Login, E2E); CA-1.2 (Signup, E2E); CA-1.3 y CA-1.5 (Login); CA-1.4 y CA-1.6 (Signup, E2E); CA-2.1 (AppHeader, PrivateArea, E2E); CA-2.2 (E2E); CA-2.3 (PrivateArea, E2E); CA-2.4 y CA-2.6 (AccountMenu, E2E); CA-2.5 (AccountMenu); CA-3.1 (tokens); CA-3.2–CA-3.4 (E2E); CA-4.1 (Login); CA-4.2 (Signup); CA-4.3 (AccountMenu, AppHeader, PrivateArea, E2E); CA-4.4 (Button, Login); CA-5.1, CA-5.3 y CA-5.4 (E2E); CA-5.2 (tokens, E2E); E-1 (AppHeader, E2E); E-2, E-4, E-8, E-9 y E-13 (E2E); E-3 (tokens); E-5 (Login); E-6 (Alert, E2E); E-7 (Button, Login, PrivateArea); E-10 y E-14 (AccountMenu, E2E); E-11 (AccountMenu); E-12 (AccountMenu, PrivateArea); RNF-001–RNF-004 (E2E); RNF-005 (Icon, design-rules, tokens); RNF-006 (design-rules, tokens) |
| T-027 | (pendiente) | Arregla B-1 de la verificación (D-21, añadida al plan y decidida por el usuario). El caso nuevo de `AppHeader.test.tsx` falló primero: el panel estaba dentro de la cabecera, que lleva `backdrop-glass`. Ahora el panel se pinta con `createPortal` en `<body>`, `fixed end-4 top-19`, y el clic fuera tiene en cuenta el botón y el panel. `tokens.test.ts` compone el menú sobre la página: cambian tres celdas SB de R-2 (menú 17.53 / 10.90 y opción con foco en oscuro 7.55) y el peor contorno de foco en oscuro (5.55). Corregido en research con la nota ²; todo sigue ≥ 7:1 en el texto y ≥ 3:1 en el foco. 380 tests unitarios; E2E 129 en dos ejecuciones (una con 1 flaky de WebKit, D-20, en CA-2.3). Capturas a 375 con el menú abierto: en Chromium, claro y oscuro, el título sale desenfocado detrás del panel. **En WebKit no se puede comprobar con Playwright:** su WebKit no pinta el desenfoque de `backdrop-filter` en las capturas ni en una página mínima sin la app (`CSS.supports` da `true`, pero el texto sale nítido), así que las capturas de WebKit de la verificación tampoco lo demostraban. Queda para la revisión manual en Safari (§21, T-026) |
