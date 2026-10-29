# Verificación · Spec 004 · 2026-10-29
Resultado: NO APTO

## Resumen

- **Alcance auditado:** spec 004 v1.1 (`en-implementacion`), plan aprobado (D-1–D-20, X-1–X-11), `tasks.md` (25/26, falta T-026), `research.md`, ADR-0003, `DESIGN.md` 1.2.0-todo.1 y el diff `main...HEAD` (51 ficheros, 25 commits de tarea).
- **Comandos:**

  | Comando | Resultado |
  |---|---|
  | `pnpm test` | ✅ 21 ficheros, **379/379** |
  | `pnpm lint` | ✅ ESLint sin errores; Prettier «All matched files use Prettier code style» |
  | `pnpm typecheck` | ✅ 0 errores, 0 avisos. 2 *hints* `ts(6385)`: `FormEvent` obsoleto en `apps/web/src/lib/credentials-form.ts:1` y `:51`; el import ya estaba en `main` |
  | `pnpm test:e2e` (1.ª) | ✅ 128 passed + **1 flaky**: `[webkit] auth.spec.ts:82 E-6 cerrar sesión en una pestaña…` (de la 001) |
  | `pnpm test:e2e` (2.ª) | ✅ 128 passed + **1 flaky**: `[webkit] design-system.spec.ts:477 RNF-002 RNF-004 E-2 zona privada…` |
  | `pnpm test:e2e` (3.ª) | ✅ **129/129**, sin flaky |

  Los dos flaky son el mismo fallo de D-20: la instantánea de la página solo muestra la barra de Astro, sin la isla, y `getByLabel(/email/i)` no aparece. Siempre en WebKit y siempre se recupera al primer reintento (`retries: 1` solo en `webkit`). 129 = 43 tests × 3 proyectos.
- **Hallazgo principal (bloqueante):** en móvil, con el menú de cuenta abierto, el título «Mis tareas» se ve **nítido, sin desenfocar**, a través del panel y se cruza con el email y con «Cerrar sesión». Pasa en Chromium y WebKit y en los dos temas (capturas tomadas en un script aparte, fuera del repo). En tema oscuro, donde se cruzan los dos textos, el contraste baja a **4.53:1** (email) y **5.43:1** (opción con foco). RF-009 y CA-3.1 piden ≥ 7:1, y es P1. Ningún test lo detecta: el test de contraste supone que el menú está sobre la cabecera, y axe lo deja como «incompleto».
- **El resto** está bien implementado y bien probado. 59 de 66 IDs ✅, 5 ⚠️ y 2 ❌ (RF-009 y CA-3.1, por el mismo defecto). Además quedan dos comprobaciones manuales ❓: la checklist de `DESIGN.md` §21 y X-9.

## Matriz de verificación (tabla)

Ficheros de test:
- **DS** `e2e/design-system.spec.ts` · **AU** `e2e/auth.spec.ts` (001)
- **TK** `apps/web/src/styles/tokens.test.ts` · **DR** `apps/web/src/design-rules.test.ts`
- **LF** / **SF** / **PA**: `apps/web/src/components/{LoginForm,SignupForm,PrivateArea}.test.tsx`, bloques «· sistema de diseño» y el caso CA-1.6 (D-15) de SF
- **AM** / **AH** / **BT** / **AL** / **IC**: `AccountMenu` / `AppHeader` / `Button` / `Alert` / `Icon` `.test.tsx`
- **MS** `apps/web/src/lib/messages.test.ts`

Rutas de código: `components/` = `apps/web/src/components/`.

Solo cuentan tests de la spec 004. Los de la 001 con el mismo ID (p. ej. SF «CA-1.4 RF-006 con una contraseña de 7 caracteres…», SF «CA-2.6 RF-019 ofrece ir al inicio de sesión…», AU «CA-1.1 RF-002…») no se cuentan.

| ID | Código | Test (fichero · nombre) | Pasa | Veredicto |
|---|---|---|---|---|
| RF-001 | `components/AuthCard.tsx` | DS «CA-1.1 RF-001 RF-003 inicio de sesión a 1280: tarjeta de vidrio de 420 px…» | ✅ | ✅ |
| RF-002 | `AuthCard.tsx` (`px-4 w-full max-w-105`) | DS «CA-1.2 RF-002 registro a 375 / 320…» (343 y 288 px, x = 16) | ✅ | ✅ |
| RF-003 | `LoginForm.tsx`, `SignupForm.tsx` | LF/SF «RF-003 … orden…» (`compareDocumentPosition`); DS CA-1.1 (orden vertical) | ✅ | ✅ |
| RF-004 | `lib/messages.ts`, `components/Alert.tsx`, zonas `status`/`alert` | MS «RF-004 cada aviso…»; LF CA-1.3, CA-1.5, «RF-004 sin conexión…»; SF CA-1.4; AL «… tono»; DS CA-1.4 | ✅ | ✅ |
| RF-005 | `components/FormField.tsx` | SF «CA-1.6 RF-005 RF-010 D-15 …»; DS «CA-1.6 RF-005 … anillo de --ring-error» | ✅ | ✅ |
| RF-006 | `components/AppHeader.tsx` | AH «CA-2.1 RF-006 RF-024…», «RF-006 D-11 X-8 … fija…»; PA CA-2.1; DS CA-2.1 (`position: sticky`) | ✅ | ✅ |
| RF-007 | `AppHeader.tsx` (`max-md:hidden` / `md:hidden`) | AH «RF-007 D-11…»; DS «CA-2.2 RF-007 RF-023 a 375 / 767», «CA-2.2 … a 768» | ✅ | ✅ |
| RF-008 | `PrivateArea.tsx` (zona `alert` al principio de `<main>`) | PA «CA-2.3 RF-008…»; DS «CA-2.3 RF-008 cerrar sesión sin conexión…» | ✅ | ✅ |
| RF-009 | `styles/tokens.css`; superficies de los componentes | TK «CA-3.1 RF-009 {tema} {variante}: …» (14 pares × 6 variantes); DS «RNF-001 RF-009 axe…» | ✅ | ❌ **B-1.** Los tests pasan, pero el menú de cuenta abierto (< 768 px, oscuro) da 4.53:1 y 5.43:1 donde el título se ve a través del panel. TK mide el menú «sobre la cabecera» (`tokens.test.ts:324-325`), y en realidad cae sobre `<main>`, sin desenfoque |
| RF-010 | `--ring-error`, `--focus-outline`, iconos de alerta en `text-1` | TK «RF-010 {tema} {variante}: anillo e icono de error y contorno de foco ≥ 3:1», «… peor contorno de foco coincide con R-2»; SF CA-1.6 | ✅ | ✅ |
| RF-011 | `styles/global.css:19-22` (`:focus-visible`) | DS «CA-3.2 RF-011 inicio de sesión con Tab…» | ✅ | ✅ (E2E solo en el inicio de sesión; la regla es global) |
| RF-012 | Controles `h-11`/`h-13`, `size-11`, `min-h-11` | DS «CA-3.3 RF-012 a 375 / 1023…» (tres pantallas y menú abierto); AM «RF-012 X-2 X-3…» | ✅ | ✅ |
| RF-013 | `components/Button.tsx` (D-9), `AccountMenu.tsx` | BT «RF-013 E-7 D-9…» (×2); LF CA-4.1; SF CA-4.2; PA CA-4.3; AM «CA-4.3 RF-013 E-12…»; DS CA-4.1, CA-4.2, CA-4.3 (ancho igual con 2 s) | ✅ | ✅ |
| RF-014 | `motion-safe:active:scale-97`; alertas sin animación | BT «RF-014 X-10…»; DR «RNF-006 RF-014 RNF-005 D-3 …»; DS «CA-5.1 RF-014…» | ✅ | ✅ |
| RF-015 | `tokens.css:290-306`, `border border-contrast` | TK «CA-5.2 RF-015 … opacas y el borde es ink‑600»; DS «CA-5.2 RF-015…», «E-8 RF-015 RF-016…» | ✅ | ⚠️ M-1: la franja de la cabecera (`bg-header`) es translúcida y no lleva `border-contrast`. El E2E solo revisa el inicio de sesión |
| RF-016 | `layouts/Layout.astro` (script), `tokens.css:218-259` | TK «RF-016 RNF-006 el bloque oscuro redefine…»; DS «CA-5.3/CA-5.4 RF-016…», «E-13 RF-016…» | ✅ | ✅ |
| RF-019 | `messages.ts` (textos iguales), `auth-queries`/`api`/`withQueryClient` sin cambios | MS «RF-019 los textos de los avisos son los de la spec 001»; AU completo en los 3 proyectos; tests de la 001 sin tocar salvo SF «E-8…» (plan §7) | ✅ | ✅ |
| RF-020 | `components/AccountMenu.tsx` | AM «CA-2.4 RF-020…»; DS «CA-2.4 CA-2.6 RF-020 RF-022 RF-024 a 375 con teclado…» | ✅ | ✅ |
| RF-021 | `AccountMenu.tsx` (Esc, `pointerdown`, interruptor) | AM «CA-2.5 RF-021…» (×3) | ✅ | ✅ (solo unitario) |
| RF-022 | `AccountMenu.tsx` `handleKeyDown` | AM «CA-2.6 RF-022 con Enter / Espacio…», «… flechas…», «CA-2.5 RF-021 RF-022 Esc…»; DS CA-2.4/CA-2.6, «E-14 RF-022…» | ✅ | ✅ (con una sola opción, las flechas solo pueden dejar el foco donde está) |
| RF-023 | `AccountMenu.tsx:23` (`toLocaleUpperCase('es-ES')`), `aria-label` | AM «RF-023 D-16…», «E-11 RF-023…»; DS «CA-2.2 RF-007 RF-023…» (`toHaveAccessibleName`) | ✅ | ✅ |
| RF-024 | `PrivateArea.tsx` (`h1.text-display`) | PA «CA-2.1 RF-006 RF-024…» (un solo h1, en `<main>`); AH (sin encabezado en el `banner`); DS 56 px a 1280 y 40 px a 375 | ✅ | ✅ |
| CA-1.1 | `AuthCard.tsx`, `LoginForm.tsx` | DS CA-1.1 (420 px, centrada, `backdrop-filter`, orden, botón a todo el ancho); LF «RF-003 CA-1.1 X-1…» | ✅ | ✅ (la retícula no se comprueba: `global.css:6-9`) |
| CA-1.2 | `AuthCard.tsx` | DS «CA-1.2 RF-002 registro a 375…»; SF «RF-003 CA-1.2 X-1…» | ✅ | ✅ |
| CA-1.3 | `LoginForm.tsx`, `messages.ts` | LF «CA-1.3 RF-004 con un 401…» (tono `error`, icono, antes del Email) | ✅ | ✅ |
| CA-1.4 | `SignupForm.tsx` | SF «CA-1.4 RF-004 sin conexión… con icono…»; DS «CA-1.4 RF-004 registro sin conexión…» | ✅ | ✅ |
| CA-1.5 | `LoginForm.tsx` (zona `status`) | LF «CA-1.5 RF-004 con ?expired=1…»; icono por tono en AL | ✅ | ✅ |
| CA-1.6 | `FormField.tsx` | SF «CA-1.6 RF-005 RF-010 D-15…» (mensaje de la 001, icono, anillo); DS CA-1.6 | ✅ | ✅ |
| CA-2.1 | `AppHeader.tsx`, `PrivateArea.tsx`, `pages/index.astro` | DS «CA-2.1 RF-006 RF-024 a 1280…» (incluye `toHaveTitle('Mis tareas')`); AH; PA | ✅ | ✅ |
| CA-2.2 | `AppHeader.tsx`, `AccountMenu.tsx` | DS «CA-2.2 … a 375», «… a 767», «… a 768» | ✅ | ✅ |
| CA-2.3 | `PrivateArea.tsx` | PA «CA-2.3 RF-008…»; DS «CA-2.3 RF-008…» | ✅ | ✅ |
| CA-2.4 | `AccountMenu.tsx`, `PrivateArea.tsx` (`onLogout`) | AM «CA-2.4 RF-020…»; DS «CA-2.4 CA-2.6…» (Enter en la opción → `/login`) | ✅ | ✅ |
| CA-2.5 | `AccountMenu.tsx` | AM «CA-2.5 RF-021 RF-022 Esc…», «… pointerdown fuera…», «… volver a pulsar…» | ✅ | ✅ |
| CA-2.6 | `AccountMenu.tsx` | AM «CA-2.6 RF-022…»; DS «CA-2.4 CA-2.6…» (Tab/Alt+Tab → Enter → foco en la opción) | ✅ | ✅ |
| CA-3.1 | `tokens.css` | TK «CA-3.1 RF-009…»; DS axe | ✅ | ❌ **B-1** (igual que RF-009) |
| CA-3.2 | `global.css` | DS «CA-3.2 RF-011…» (contorno sólido de 2 px; orden de foco = orden vertical) | ✅ | ✅ |
| CA-3.3 | Ver RF-012 | DS «CA-3.3 RF-012 a 375 / 1023…» | ✅ | ✅ |
| CA-3.4 | Layout fluido | DS «CA-3.4 RNF-002 registro con zoom al 200 %…» (ventana de 640 × 450) | ✅ | ✅ (zoom emulado con el ancho; no se usa el zoom real del navegador) |
| CA-4.1 | `Button.tsx`, `LoginForm.tsx` | LF «CA-4.1 RF-013 E-7…»; DS «CA-4.1 RF-013 /login con el servidor lento…» | ✅ | ✅ |
| CA-4.2 | `Button.tsx`, `SignupForm.tsx` | SF «CA-4.2 RF-013…»; DS «CA-4.2 RF-013 /signup…» | ✅ | ✅ |
| CA-4.3 | `AppHeader.tsx`, `AccountMenu.tsx` | PA, AH y AM «CA-4.3…»; DS «CA-4.3 RF-013 cerrar sesión con el servidor lento…» | ✅ | ✅ |
| CA-4.4 | `Button.tsx` | BT «CA-4.4 al acabar la espera…», «RF-013 CA-4.4 sin espera…»; LF «CA-4.4 tras el error vuelve…» | ✅ | ✅ |
| CA-5.1 | `Button.tsx` (`motion-safe:`) | DS «CA-5.1 RF-014 con «reducir movimiento»…» (`scale` y `transform` = `none` con el botón pulsado) | ✅ | ✅ |
| CA-5.2 | `tokens.css:290-306`; `border-contrast` en tarjeta, campos, alertas, píldoras, botones y panel | TK «CA-5.2 RF-015…»; DS «CA-5.2 RF-015…» (solo en el inicio de sesión) | ✅ | ⚠️ M-1 |
| CA-5.3 | Script de `Layout.astro`, `:root[data-theme='dark']` | DS «CA-5.3 RF-016 tema oscuro…» | ✅ | ⚠️ El tema se aplica bien, pero la segunda mitad de CA-5.3 («y cumple CA-3.1») falla en oscuro con el menú abierto (B-1) |
| CA-5.4 | Ídem, tema claro | DS «CA-5.4 RF-016 tema claro…» | ✅ | ✅ |
| RNF-001 | ARIA de AM, zonas `alert`/`status`, foco global | DS «RNF-001 RF-009 axe sin infracciones…, tema claro / oscuro» (0 infracciones, menú incluido) | ✅ | ⚠️ La parte automática pasa. Falta la checklist manual de §21 (❓, ver más abajo), que el propio RNF-001 incluye |
| RNF-002 | Layout fluido, `truncate`, `wrap-anywhere` | DS «RNF-002 RNF-004 E-2 /login, /signup, zona privada… de 320 a 1600» y CA-3.4 | ✅ | ✅ |
| RNF-003 | `@fontsource-variable/geist` y `lucide-react` empaquetados | DS «RNF-003 C-16 abrir las tres pantallas no hace peticiones fuera de la app» | ✅ | ✅ (en `astro dev`; no hay E2E contra `build`) |
| RNF-004 | `playwright.config.ts` (chromium, chrome y webkit) | Todos los E2E en los tres proyectos; «RNF-002 RNF-004…» a anchos de móvil | ✅ | ✅ (Edge no se prueba aparte, sino a través de Chromium, como en la 001 D-18; WebKit flaky, ver M-7) |
| RNF-005 | `--dur-fast/--dur/--dur-slow`; `--animate-spin` | TK «RNF-005 ninguna duración pasa de 420 ms…»; IC «X-9 RNF-005…»; DR | ✅ | ✅ Cumple a la letra. La impresión del giro a 420 ms (X-9) está pendiente de revisión manual ❓ |
| RNF-006 | (a) DR · (b) `tokens.css` · (c) `DESIGN.md` 1.2.0-todo.1 | DR «RNF-006 D-3 revisa…», «… ningún valor fuera del catálogo»; TK completitud y valores; (c) revisado a mano: todos los nombres de `DESIGN.md` §1–§8 están en `tokens.css` (`--bp-*` como `--breakpoint-*`) | ✅ | ⚠️ (a) parcial: M-2 |
| E-1 | `AppHeader.tsx` `EmailPill` | AH «E-1 D-13…» (×3); DS «E-1 RF-006 email de 254 caracteres…» (sin desbordar, `ellipsis`, tooltip con el ratón y con el foco) | ✅ | ✅ |
| E-2 | Ídem RNF-002 | DS «RNF-002 RNF-004 E-2…» a 320 | ✅ | ✅ |
| E-3 | `tokens.css:275-286` | TK «E-3 X-11 sin blur…» y los pares de la variante SB | ✅ | ✅ Verificado por cálculo. No se puede emular en el navegador (R-5) |
| E-4 | `Layout.astro:2`; `font-display: swap` comprobado en `node_modules/@fontsource-variable/geist/wght.css` | DS «E-4 si la fuente no llega…» | ✅ | ✅ (test débil, M-9) |
| E-5 | `LoginForm.tsx` (zona `status` antes de `alert`) | LF «E-5 con ?expired=1 y un 401…»; DS «E-6 RF-004 a 320…» (dos alertas) | ✅ | ✅ |
| E-6 | `Alert.tsx` (sin altura fija, `text-pretty`) | AL «X-7 E-6 D-5…»; DS «E-6 RF-004 a 320…» (más de una línea, sin desbordar) | ✅ | ✅ |
| E-7 | `Button.tsx` `handleClick`; `AccountMenu.chooseLogout` | BT «RF-013 E-7 D-9…»; LF «CA-4.1 RF-013 E-7…»; PA «CA-4.3 RF-013 E-7…»; SF «E-8…» (001, ajustado) | ✅ | ✅ |
| E-8 | Evento `change` en `Layout.astro`; contraste y movimiento en CSS | DS «E-8 RF-015 RF-016 cambiar tema y contraste con la pantalla abierta…» | ✅ | ✅ («Reducir movimiento» no se cambia con la página abierta; es una media query de CSS) |
| E-9 | `Layout.astro` `lang="es"`; textos nuevos en castellano | DS «E-9 las tres pantallas están en español…» | ✅ | ✅ |
| E-10 | `AccountMenu.tsx:37-45` | AM «E-10 con el menú abierto, pasar a 768 px…»; DS «E-10 RF-007…» | ✅ | ✅ |
| E-11 | `AccountMenu.tsx:23` | AM «E-11 RF-023…» («1») | ✅ | ✅ |
| E-12 | `AccountMenu.tsx` `chooseLogout`/`close`; `PrivateArea.tsx` `onLogout` | AM «CA-4.3 RF-013 E-12…», «E-12 si falla…»; PA «E-12 si falla el cierre de sesión desde el menú…» | ✅ | ✅ (solo unitario) |
| E-13 | Script `is:inline` en `<head>` | DS «E-13 RF-016 … antes de que exista <body>» | ✅ | ✅ |
| E-14 | `AccountMenu.tsx` (`Tab` → `close()`) | AM «E-14 con Tab desde la opción…» (centinela); DS «E-14 RF-022 a 375…» (3 navegadores) | ✅ | ✅ |

**Pendiente de revisión manual (❓, la tiene que hacer una persona):**

- **Checklist de `DESIGN.md` §21**, en las tres pantallas (inicio de sesión, registro, zona privada), en tema claro y oscuro, con y sin «aumentar contraste», a 375, 768 y 1280 px. Qué mirar en cada combinación:
  - **Solo tokens.** Los tests DR ya lo cubren para colores y capas (ver M-2).
  - **Texto ≥ 7:1 en su superficie real.** Abrir el menú de cuenta a 375 en los dos temas: hoy falla (B-1).
  - **Un solo primario por vista.** Títulos ≥ 20 px en Light 300 con tracking negativo: «Iniciar sesión», «Crear cuenta» y «Mis tareas».
  - **Formas y profundidad.** Alturas y radios de §14 y §5; que no haya esquinas vivas ni bordes sólidos (salvo el borde de «aumentar contraste»); profundidad con las sombras de §6.2 (brillo interior y sombra larga).
  - **Vidrio.** Que la retícula se vea en el lienzo y se difumine bajo la tarjeta, la cabecera y las píldoras, como pide §0.
  - **Estados.** Error, sin conexión, carga y sesión caducada.
  - **Teclado, foco y movimiento reducido.**
  - **«Aumentar contraste» en oscuro.** Que el borde ink‑600 de las píldoras y campos se distinga (M-3).
- **X-9 (plan §8).** Pulsar «Iniciar sesión», «Crear cuenta» y «Cerrar sesión» con la red lenta (DevTools, 2 s) y juzgar si el anillo, que da una vuelta cada 420 ms, se ve demasiado rápido o nervioso. Hacerlo también con «reducir movimiento», porque sigue girando. Si molesta, el plan prevé cambiar RNF-005 con `/sdd-cambiar-spec`, no el código.

## Problemas (por gravedad: bloqueante / importante / menor), con ruta y propuesta

### Bloqueante

**B-1 · El menú de cuenta no desenfoca lo que tiene debajo: el título se ve a través del panel y el texto baja de 7:1 (RF-009, CA-3.1, CA-5.3; `DESIGN.md` §6.3)**
- **Dónde:**
  - `apps/web/src/components/AppHeader.tsx:76`: `<header … bg-header backdrop-glass>`;
  - `apps/web/src/components/AccountMenu.tsx:113`: el panel `absolute … top-full … bg-raised … backdrop-glass` está dentro de esa cabecera.
- **Causa:** la cabecera tiene `backdrop-filter`, así que es la *backdrop root* de lo que lleva dentro. El panel solo puede desenfocar lo que está dentro de la cabecera (mide 68 px de alto). Por debajo de esa altura, el contenido de `<main>` se ve sin desenfocar a través de la transparencia de `--surface-raised` (alfa 0.8 en claro y 0.7 en oscuro). `DESIGN.md` §6.3 ya avisa de que un filtro en un ancestro rompe el blur.
- **Comprobado:**
  - Medidas a 375 px: el panel ocupa [71, 64, 359, 181] y el `h1` [16, 100, 359, 142]. Se solapan.
  - Capturas en Chromium y WebKit, claro y oscuro: «tareas» se lee nítido detrás del email y de «Cerrar sesión».
  - Contraste en los píxeles donde se cruzan, en oscuro: email `--text-1` sobre `#616F78` = **4.53:1**; opción con foco sobre `#53636F` = **5.43:1**. En claro da 11.67:1 (cumple RF-009, pero el efecto visual es el mismo).
- **Por qué no lo vieron los tests:**
  - `tokens.test.ts:324-325` compone `menu` y `menuFocus` sobre la cabecera (`over(header, …)`), no sobre el contenido que el panel tiene detrás de verdad.
  - axe no calcula el fondo con `backdrop-filter`: lo deja como «incompleto» (plan D-12).
- **Propuesta** (es un cambio de diseño, así que pasa por el plan como `D-x` antes de tocar código):
  - (a) sacar el panel de la *backdrop root* de la cabecera (renderizarlo fuera del `<header>`, p. ej. con un portal a `body`, posicionado bajo el botón), para que su `backdrop-glass` desenfoque `<main>`; o
  - (b) quitar el `backdrop-filter` de la cabecera y que la franja sea opaca o casi opaca (afecta a X-8 / D-11); o
  - (c) dar al panel una superficie opaca. Necesita un token o una regla nueva en `DESIGN.md`.

  En los tres casos hay que añadir a `TEXT_PAIRS` un par «menú sobre el contenido de la página» (peor caso: sobre texto `--text-1`) y una comprobación E2E. Por ejemplo, que `document.elementsFromPoint` en el centro del email del menú no devuelva el `h1` sin un ancestro que lo desenfoque, o una captura comparada.

### Importante

Ninguno aparte de B-1. El defecto de modelo de `tokens.test.ts` que oculta B-1 se corrige junto con él.

### Menor

- **M-1 · La franja de la cabecera no lleva el borde de «aumentar contraste» (RF-015, CA-5.2).**
  - `AppHeader.tsx:76`: `bg-header` es una superficie translúcida (`--surface-header`) y no lleva `border border-contrast`. Con `contrast: more` pasa a opaca (`#E3E6E6` / `#06141B`, el mismo color que el lienzo), con 0 px de borde (comprobado en el navegador). Visualmente no se distingue del lienzo, así que no estorba, pero no cumple la letra de CA-5.2.
  - El E2E «CA-5.2…» (`e2e/design-system.spec.ts:709`) solo revisa el inicio de sesión: ni las píldoras de la cabecera, ni el botón glass, ni el botón de cuenta, ni el panel.
  - **Propuesta:** decidir en el plan si la franja cuenta como superficie (y añadir un borde inferior) o anotarla como excepción. Ampliar el E2E a la zona privada.
- **M-2 · RNF-006 (a) solo se vigila en parte.** `design-rules.test.ts` no detecta:
  - (1) valores literales en `global.css`, aunque D-3 y ADR-0003 dicen que «solo `tokens.css` puede tener valores literales»: `global.css:20-21` (`outline: 2px`, `outline-offset: 2px`) y `:31` (`transition: background-color 0s 86400s`);
  - (2) espaciados y medidas fuera de la escala §3.1, porque `--spacing` admite cualquier múltiplo: `mt-0.5` (2 px), `p-1.5` (6), `py-2.5` (10), `px-3.5`/`py-3.5` (14), `px-6.5` (26), `w-72`, `max-w-80`, `max-w-96`.

  Casi todos tienen respaldo en `DESIGN.md` §14 (6, 14, 26), pero no son tokens del catálogo.

  **Propuesta:** tokens `--focus-outline-width`/`--focus-outline-offset`; ampliar DR a los literales de `global.css` (con una lista de excepciones justificada, como el retardo del autorrelleno); y decidir en el plan si la escala de espaciado es «múltiplos de `--spacing`» o la lista de §3.1.
- **M-3 · En oscuro, el borde de «aumentar contraste» se ve poco.** `--border-contrast` = ink‑600 (`tokens.css:297`, sin valor propio en el bloque oscuro) da 2.50:1 sobre glass `#0D1C26`, 1.98:1 sobre raised `#1E2F3C`, 1.30:1 sobre raised-hover `#394B59` y 2.70:1 sobre la cabecera. RF-010 no lo exige (no es icono, anillo ni foco), pero el modo existe para dar más contraste.
  - **Propuesta:** un valor oscuro propio (p. ej. ink‑500 o ink‑400), decidido en `DESIGN.md` §17.
- **M-4 · Desviaciones de `DESIGN.md` sin justificar en el plan (C-26).**
  - Botón `lg` con texto de 15 px en vez de 16 (`Button.tsx:49`, §14): solo está en el Registro de T-013.
  - Tooltip con `rounded-md` y varias líneas, en vez de «píldora de 34 px» (`AppHeader.tsx:64`, §14).
  - Inicial del botón de cuenta en peso 400 (`text-body`) en vez de «ink‑950 Light» (`AccountMenu.tsx:104`, §14 Avatar).

  **Propuesta:** añadirlas como X-12–X-14 en plan §4.5.
- **M-5 · `DESIGN.md` y la spec quedan desfasados.**
  - `DESIGN.md:350` (§11.2) dice «Mientras no exista la spec 002, la zona privada muestra solo la cabecera», pero RF-024 añade el título display.
  - `DESIGN.md:489` (§18) dice que `global.css` expone los tokens con `@theme`; está en `tokens.css` (ya lo vio T-024).
  - `specs/004-sistema-de-diseno/spec.md:175` y `specs/roadmap.md:41` remiten a «Pendiente de decidir» 4, que tras la renumeración de T-024 es el 2.
  - **Propuesta:** corregir las tres referencias.
- **M-6 · Aviso para la spec 002.** `DESIGN.md` §1.4 da `--text-3` «7:1 sobre lienzo», pero research R-2 mide 5.32:1 sobre un punto de la retícula en claro. §11.3 propone el recuento del tablero en `--text-3` sobre el lienzo. La regla de R-2 («`--text-3` nunca va directamente sobre el lienzo») no pasó a `DESIGN.md`.
  - **Propuesta:** añadirla en §1.6 o corregir la cifra de §1.4.
- **M-7 · WebKit sigue siendo flaky (D-20).** Hubo 1 flaky en 2 de 3 ejecuciones, uno de ellos en `auth.spec.ts` (001). Está documentado y lo decidió el usuario, pero un reintento puede ocultar un fallo real de hidratación en WebKit.
  - **Propuesta:** ya está en las alternativas de D-20: E2E contra `astro build` + preview cuando haya ADR de despliegue. Anotarlo en «Ideas sin priorizar» del roadmap para que no viva solo en el plan.
- **M-8 · Cobertura de axe.** `design-system.spec.ts:633` no incluye la etiqueta `wcag21a`. Además, el inicio de sesión y el registro solo se auditan a 1280 px.
  - **Propuesta:** añadir `wcag21a` y una pasada a 375.
- **M-9 · El E2E de E-4 es débil.** `design-system.spec.ts:763` solo comprueba `toBeVisible()`, que también pasaría con `font-display: block` (texto invisible). La implementación es correcta (`swap` en el CSS de Fontsource), pero el test no lo demuestra.
  - **Propuesta:** comprobar `document.fonts` o el `font-display` de la regla `@font-face`.
- **M-10 · Registro de tareas.** `specs/004-sistema-de-diseno/tasks.md:411`: T-025 tiene el commit «(pendiente)», pero es `9987799`.
- **M-11 · C-24.** Dos commits de la rama no llevan IDs: `4486c39 chore: sdd-implementar…` y `49b483f chore: actualizar kit SDD…`. Son del kit SDD (`.claude/commands`, `.sdd/templates`), no de producto, y no tocan lo que pide la spec.
- **M-12 · Tipos.** 2 hints `ts(6385)` (`FormEvent` obsoleto) en `apps/web/src/lib/credentials-form.ts:1, 51`. Vienen de la 001 y no rompen C-19.
  - **Propuesta:** anotarlo como idea para cuando se toque el formulario.

## Deriva spec ↔ código

| Spec / `DESIGN.md` dice | El código hace | Ref. |
|---|---|---|
| RF-009 / CA-3.1: todo texto ≥ 7:1 sobre la superficie en que aparece | Con el menú de cuenta abierto (< 768 px, oscuro), 4.53:1 y 5.43:1 donde se cruza con el título | B-1 |
| `DESIGN.md` §6.3: «todo lo que flota» se desenfoca; un filtro en un ancestro rompe el blur | El panel del menú está dentro de una cabecera con `backdrop-filter` y no desenfoca `<main>` | B-1 |
| CA-5.2: superficies translúcidas → opacas **y** con borde de 1 px | La franja de la cabecera pasa a opaca, pero sin borde | M-1 |
| D-3 / ADR-0003: «solo `tokens.css` puede tener valores literales» | `global.css` tiene `2px`, `2px` y `0s 86400s` | M-2 |
| `DESIGN.md` §14 (botón lg 16 px, tooltip píldora de 34 px, avatar Light) | 15 px, `rounded-md` en varias líneas, peso 400 | M-4 |
| `DESIGN.md` §11.2: la zona privada muestra solo la cabecera | También el `h1` display «Mis tareas» (RF-024, decidido en la spec) | M-5 |
| `DESIGN.md` §18: `global.css` expone los tokens con `@theme` | El `@theme` está en `tokens.css` | M-5 |

Lo demás coincide: el orden de los avisos y los campos, los tonos, los textos de la 001, los gerundios, la cabecera y sus variantes, el menú (APG), las preferencias del sistema, el responsive y el catálogo.

**Alcance:** no hay código de producto que no se trace a un requisito o decisión.
- Los tokens que no se usan (sage, `--pill-*`, `--signal`, sombras de acento) los pide RNF-006 (b), sin componentes (C-21).
- `--ring-error-width` es D-19.
- No se ha colado nada de «Fuera de alcance»: ni selector de tema, ni esqueleto, ni mostrar/ocultar contraseña, ni toasts.

Los únicos cambios ajenos a la spec son los del kit SDD (M-11).

**Plan:**
- D-18, D-19 y D-20 se añadieron bien al plan.
- Los ficheros fuera de lista de T-015 y T-021 están justificados en el Registro.
- Sin documentar: M-4 y el modelo de superficie del menú en `tokens.test.ts`, que no coincide con D-12 («compone las superficies como en R-2… sobre su fondo real»).

## Constitución

| Artículo | Estado | Nota |
|---|---|---|
| C-1 | ✅ | `strict`; sin `any`, `@ts-ignore` ni `eslint-disable` en `apps/web/src` ni en `e2e` |
| C-2 | ✅ | Cuatro dependencias nuevas, justificadas en plan §2 y R-7, con versión exacta |
| C-3 | ✅ | Sin cambios |
| C-4 | ✅ | Astro estático + Tailwind 4; una isla por página (`client:only`). Los efectos solo se suscriben a `matchMedia`, `pointerdown`, `keydown` y `pageshow`; sin `fetch` en efectos |
| C-5–C-15 | ✅ | No aplican: la API, la BD, `shared` y la seguridad no cambian |
| C-16 | ✅ | E2E RNF-003: ninguna petición a terceros |
| C-17 | ✅ | Cada RF tiene al menos un test, pero el de RF-009 pasa con el requisito incumplido (B-1) |
| C-18 | ✅ | Vitest + Testing Library; Playwright en tres proyectos |
| C-19 | ✅ | `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde |
| C-20 | ⚠️ | WCAG 2.2 AA automático en verde (axe, teclado, ARIA, 44 px). Falta la revisión manual (§21) |
| C-21 | ✅ | Ver Alcance |
| C-22 | ✅ | `Button` 3 usos, `Alert` 4, `AuthCard` 2, `Icon` varios. `AppHeader`/`AccountMenu` separados por tamaño (justificado en el plan) |
| C-23 | ✅ | Identificadores en inglés; ficheros sin tildes |
| C-24 | ⚠️ | Commits de tarea correctos (`… T-0xx … [spec 004]`); dos commits del kit sin IDs (M-11) |
| C-25 | ✅ | Configuración sin cambios; `pnpm lint` en verde. `DESIGN.md` en `.prettierignore` con el visto bueno del usuario (Registro T-001) |
| C-26 | ❌ | El contraste AAA del texto no se cumple en un estado real (B-1); además, tres desviaciones de `DESIGN.md` sin justificar en el plan (M-4) |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ⚠️ | 25/26. T-026 (esta verificación) no se puede cerrar: su «Hecho cuando» pide APTO o APTO CON OBSERVACIONES. Las 25 marcadas están hechas de verdad: cada una tiene commit y su efecto está en el código |
| Cada RF y CA con un test que lo verifica y pasa | ⚠️ | Todos tienen test y pasan, pero el de RF-009 / CA-3.1 no ve B-1 |
| Cada caso límite implementado y probado | ✅ | E-1–E-14. E-3 solo por cálculo (no se puede emular) |
| No hay código que no se trace | ✅ | Ver Alcance |
| Tests, linter y tipos en verde (local y CI) | ⚠️ | Local en verde. No hay CI en el repositorio (`.github/` no existe) |
| Sin `console.log`, código comentado ni TODO sin ticket | ✅ | Revisado en el diff |
| Accesibilidad revisada en componentes interactivos | ⚠️ | Automática en verde; manual (§21) pendiente ❓ |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código (sin deriva) | ❌ | B-1, M-1 |
| Desviaciones del plan anotadas | ⚠️ | M-4 y el modelo del menú en `tokens.test.ts` |
| ADRs si hubo decisiones transversales | ✅ | ADR-0003 |
| Estado de la spec → `implementada` | ❌ | Sigue en `en-implementacion`; no debe cambiar hasta resolver B-1 |
| PR con enlace a la spec, requisitos e informe | ❌ | No hay PR todavía |
| Revisada y aprobada | ❌ | Pendiente |

**Para pasar a APTO (o APTO CON OBSERVACIONES):**
1. Resolver B-1, con su `D-x` en el plan, el par nuevo en `tokens.test.ts` y la comprobación E2E.
2. Hacer la checklist manual de §21 y la revisión de X-9, y anotar el resultado aquí.
3. Decidir M-1 y M-4 (plan o código).

Los demás puntos menores pueden quedar como observaciones o como ideas en el roadmap.
