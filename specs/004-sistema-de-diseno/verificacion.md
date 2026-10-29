# Verificación · Spec 004 · 2026-10-29 (segunda)
Resultado: APTO CON OBSERVACIONES

> Condición: la spec no debe pasar a `implementada` ni cerrarse T-026 hasta que una persona haga las revisiones manuales ❓ de abajo (checklist de `DESIGN.md` §21, X-9 y el desenfoque del menú en Safari). La parte automática no encuentra nada bloqueante.

## Resumen

- **Alcance auditado:**
  - spec 004 v1.1 (`en-implementacion`);
  - plan aprobado (D-1–D-22, X-1–X-13);
  - `tasks.md` (28/29: falta T-026, que es esta verificación);
  - `research.md`, ADR-0003, `DESIGN.md` 1.2.1-todo.1, el diff `main...HEAD` (52 ficheros) y en detalle los tres commits posteriores a la primera verificación (`f07dcf2` T-027, `29b56aa` T-028, `e8767d7` T-029).
- **Comandos:**

  | Comando | Resultado |
  |---|---|
  | `pnpm test` | ✅ 21 ficheros, **383/383** |
  | `pnpm lint` | ✅ ESLint sin errores; Prettier «All matched files use Prettier code style!» |
  | `pnpm typecheck` | ✅ 0 errores, 0 avisos, 2 *hints* `ts(6385)` (`FormEvent` obsoleto en `apps/web/src/lib/credentials-form.ts:1` y `:51`, de la 001) |
  | `pnpm test:e2e` (1.ª) | ✅ **132/132**, sin flaky |
  | `pnpm test:e2e` (2.ª) | ✅ 131 passed + **1 flaky**: `[webkit] design-system.spec.ts:360 E-10 RF-007 con el menú abierto a 375, pasar a 768…` |
  | `pnpm test:e2e` (3.ª) | ✅ 131 passed + **1 flaky**: `[webkit] design-system.spec.ts:734 CA-5.2 RF-015 D-22 zona privada con «aumentar contraste»…` |

  - 132 = 44 tests × 3 proyectos (`chromium`, `chrome`, `webkit`).
  - Los dos flaky son el fallo ya conocido de D-20: la isla no se hidrata. La instantánea solo muestra los botones de la barra de Astro y `getByLabel(/email/i)` no aparece (en `signup`, antes de llegar a lo que mide el test). Siempre en WebKit, cada vez en un test distinto, y pasa al primer reintento.
  - El puerto 4321 estaba libre en todas las ejecuciones.
- **Comprobaciones propias en el navegador.** Las hice con un script de Playwright fuera del repositorio. La API `/api/auth/me` estaba simulada con `page.route`, así que no se escribió nada en la base de datos.
  - **¿Sirven las capturas para juzgar el desenfoque?** Lo probé con una página mínima: texto negro bajo un velo `rgba(255,255,255,.2)` con `backdrop-filter: blur(16px)`.
    - **Chromium sí lo pinta:** el píxel más oscuro bajo el velo es `142,142,142`.
    - **El WebKit de Playwright no lo pinta:** sale `51,51,51`, que es exactamente el 20 % de blanco sobre negro, sin desenfocar. Además, `CSS.supports` da `true`.

    Por tanto, las capturas de WebKit no sirven para juzgar el vidrio, y no saco conclusiones de ellas. Coincide con el Registro de T-027.
  - **Menú de cuenta abierto a 375 en Chromium:** el título «Mis tareas» sale **desenfocado** detrás del panel, en claro y en oscuro.
    - Contraste en el peor píxel, con el texto del panel oculto para medir el fondo: email 16.50 en claro y **10.77** en oscuro; opción con foco 18.69 en claro y **7.65** en oscuro. Todo ≥ 7:1.
    - El panel está en `<body>`, sin ningún ancestro con `filter` ni `backdrop-filter`.
  - **E-3 emulado** (sin `backdrop-filter` y con las superficies al 92 % de X-11, en Chromium y WebKit): en oscuro, el título se ve nítido detrás del panel. La opción con foco da **6.86:1** donde se cruza con un trazo del título; la media es 7.6. Ver I-1.
- **Conclusión:**
  - **B-1 está resuelto** en Chromium, comprobado con medidas. En Safari no se puede comprobar con esta herramienta. El arreglo es estructural (el panel sale de la *backdrop root* de la cabecera), así que debería valer igual, pero queda como ❓ manual.
  - **M-1 y M-4 están resueltos.**
  - Queda **un problema importante nuevo (I-1)**: E-3 en oscuro con el menú abierto. Solo ocurre en un navegador sin soporte de desenfoque, y ninguno de los de RNF-004 lo es.
  - Siguen los menores de la primera verificación que no se trataron.
  - Por IDs: 63 de 66 ✅, 3 ⚠️ (E-3, RNF-001, RNF-006) y 0 ❌. Además hay tres revisiones manuales ❓.

## Estado de los problemas de la primera verificación

| ID | Estado | Detalle |
|---|---|---|
| B-1 | **Resuelto** (Chromium) · ❓ Safari | D-21/T-027: panel con `createPortal` en `<body>`, `fixed end-4 top-19.25`. Medido: título desenfocado, ≥ 7.65:1 en el peor píxel. `tokens.test.ts` ya compone el menú sobre la página. Test unitario nuevo en `AppHeader.test.tsx` («RF-009 CA-3.1 D-21 … no está dentro de un elemento con desenfoque»). En WebKit, solo revisión manual en Safari |
| M-1 | **Resuelto** | D-22/T-028: `border-b border-contrast` en la cabecera (`AppHeader.tsx:78`). Nuevo E2E «CA-5.2 RF-015 D-22 zona privada…»: franja, píldoras, botón «Cerrar sesión», botón de cuenta y panel opacos con borde ink‑600, en los tres navegadores |
| M-2 | **Sigue (y crece)** | `global.css:20-21,31` sigue con literales. Se suman `top-19.25` (77 px), `min-h-8.5` (34 px) y `font-light` (ver m-1) |
| M-3 | **Sigue** | `--border-contrast` en oscuro sigue siendo ink‑600 (`tokens.css:297`, sin valor propio en `:root[data-theme='dark']`) |
| M-4 | **Resuelto** | T-029: inicial en `font-light` (`AccountMenu.tsx:108`); tooltip `min-h-8.5` (`AppHeader.tsx:65`). X-12 y X-13 en plan §4.5; `DESIGN.md` §14 Button y versión 1.2.1-todo.1 con su entrada en el historial |
| M-5 | **Sigue** | `DESIGN.md:350` (§11.2, «solo la cabecera»), `DESIGN.md:489` (§18, `@theme` en `global.css`), `spec.md:175` y `roadmap.md:41` («Pendiente de decidir» 4). Además, plan §3 dice «11 desviaciones» y ya hay 13 (m-3) |
| M-6 | **Sigue** | `DESIGN.md:117` sigue dando `--text-3` «7:1»; la regla de R-2 («nunca directamente sobre el lienzo») no está en `DESIGN.md` |
| M-7 | **Sigue** | 1 flaky de WebKit en 2 de 3 ejecuciones. La alternativa de D-20 (E2E contra `astro build`) no está en «Ideas sin priorizar» del roadmap |
| M-8 | **Sigue** | `design-system.spec.ts:638`: sin `wcag21a`; inicio de sesión y registro solo a 1280 |
| M-9 | **Sigue** | `design-system.spec.ts:797`: E-4 solo comprueba `toBeVisible()` |
| M-10 | **Cambió** | T-025 ya tiene su commit (`9987799`). Ahora es T-029 la que pone «(pendiente)» en el Registro (`tasks.md:445`); su commit es `e8767d7` |
| M-11 | **Sigue** (no se puede corregir sin reescribir la historia) | `4486c39` y `49b483f` sin IDs. Los tres commits nuevos cumplen C-24 |
| M-12 | **Sigue** | Los mismos 2 *hints* `ts(6385)` |

## Matriz de verificación (tabla)

Ficheros de test:
- **DS** `e2e/design-system.spec.ts`
- **TK** `apps/web/src/styles/tokens.test.ts` · **DR** `apps/web/src/design-rules.test.ts`
- **LF** / **SF** / **PA**: `apps/web/src/components/{LoginForm,SignupForm,PrivateArea}.test.tsx`, bloques «· sistema de diseño» y el caso CA-1.6 (D-15) de SF
- **AM** / **AH** / **BT** / **AL** / **IC**: `AccountMenu` / `AppHeader` / `Button` / `Alert` / `Icon` `.test.tsx`
- **MS** `apps/web/src/lib/messages.test.ts`

Rutas de código: `components/` = `apps/web/src/components/`.

Solo cuentan tests de la spec 004. Los de la 001 con el mismo ID (p. ej. SF «CA-1.4 RF-006…», AU «CA-1.1 RF-002…») no se cuentan. Con un script recorrí los nombres de los tests de la 004 (93 nombres, más los `it.each` de TK): los 66 IDs tienen al menos un test. Todos pasan (ver Resumen).

| ID | Código | Test (fichero · nombre) | Pasa | Veredicto |
|---|---|---|---|---|
| RF-001 | `components/AuthCard.tsx` | DS «CA-1.1 RF-001 RF-003 inicio de sesión a 1280: tarjeta de vidrio de 420 px, centrada y en orden» | ✅ | ✅ |
| RF-002 | `AuthCard.tsx` (`px-4 w-full max-w-105`) | DS «CA-1.2 RF-002 registro a 375 / 320…» | ✅ | ✅ |
| RF-003 | `LoginForm.tsx`, `SignupForm.tsx` | LF/SF «RF-003 … orden…» (`compareDocumentPosition`); DS CA-1.1 | ✅ | ✅ |
| RF-004 | `lib/messages.ts`, `Alert.tsx`, zonas `status`/`alert` | MS «RF-004 …»; LF CA-1.3, CA-1.5; SF CA-1.4; DS CA-1.4 | ✅ | ✅ |
| RF-005 | `FormField.tsx` | SF «CA-1.6 RF-005 RF-010 D-15…»; DS «CA-1.6 RF-005 … anillo de --ring-error» | ✅ | ✅ |
| RF-006 | `AppHeader.tsx` | AH «CA-2.1 RF-006 RF-024…», «RF-006 D-11 X-8 … fija…»; PA CA-2.1; DS CA-2.1 (`position: sticky`) | ✅ | ✅ |
| RF-007 | `AppHeader.tsx` (`max-md:hidden` / `md:hidden`) | AH «RF-007 D-11…»; DS «CA-2.2 RF-007 RF-023 a 375 / 767», «CA-2.2 … a 768» | ✅ | ✅ |
| RF-008 | `PrivateArea.tsx` (zona `alert` al principio de `<main>`) | PA «CA-2.3 RF-008…»; DS «CA-2.3 RF-008…» | ✅ | ✅ |
| RF-009 | `tokens.css`; `AccountMenu.tsx` (portal, D-21) | TK «CA-3.1 RF-009 {tema} {variante}: …» (menú ya sobre la página, `tokens.test.ts:324-326`); AH «RF-009 CA-3.1 D-21 el panel abierto del menú no está dentro de un elemento con desenfoque»; DS axe | ✅ | ✅ Medido en Chromium con el menú abierto: ≥ 7.65:1 en el peor píxel. El caso sin blur está en E-3 / I-1 |
| RF-010 | `--ring-error`, `--focus-outline`, iconos en `text-1` | TK «RF-010 … ≥ 3:1» (foco en oscuro 5.55 con el menú nuevo); SF CA-1.6 | ✅ | ✅ |
| RF-011 | `global.css:19-22` | DS «CA-3.2 RF-011 inicio de sesión con Tab…» | ✅ | ✅ (E2E solo en el inicio de sesión; la regla es global) |
| RF-012 | `h-11`/`h-13`, `size-11`, `min-h-11` | DS «CA-3.3 RF-012 a 375 / 1023…» (con el menú abierto); AM «RF-012 X-2 X-3…» | ✅ | ✅ |
| RF-013 | `Button.tsx` (D-9), `AccountMenu.tsx` | BT, LF CA-4.1, SF CA-4.2, PA/AM/AH CA-4.3; DS CA-4.1–4.3 (ancho igual con 2 s) | ✅ | ✅ |
| RF-014 | `motion-safe:active:scale-97` | BT «RF-014…»; DR; DS «CA-5.1 RF-014…» | ✅ | ✅ |
| RF-015 | `tokens.css:290-306`; `border border-contrast` y `border-b` en la cabecera (D-22) | TK «CA-5.2 RF-015…»; AH «CA-5.2 RF-015 D-22…»; DS «CA-5.2 RF-015…» (acceso) y «CA-5.2 RF-015 D-22 zona privada…» | ✅ | ✅ (M-1 resuelto) |
| RF-016 | `Layout.astro` (script), `tokens.css` | TK «RF-016 RNF-006…»; DS CA-5.3/CA-5.4, E-13 | ✅ | ✅ |
| RF-019 | `messages.ts`; `auth-queries`/`api`/`withQueryClient` sin cambios | MS «RF-019 los textos de los avisos son los de la spec 001»; `auth.spec.ts` en los 3 proyectos | ✅ | ✅ |
| RF-020 | `AccountMenu.tsx` | AM «CA-2.4 RF-020…» (el clic en la opción cubre el `pointerdown` dentro del panel, fuera de `rootRef`); DS «CA-2.4 CA-2.6…» | ✅ | ✅ |
| RF-021 | `AccountMenu.tsx:27-35` (comprueba `rootRef` y `panelRef`) | AM «CA-2.5 RF-021…» (×3) | ✅ | ✅ (solo unitario) |
| RF-022 | `AccountMenu.tsx` `handleKeyDown` (eventos del portal por el árbol de React) | AM CA-2.6, CA-2.5; DS «CA-2.4 CA-2.6…», «E-14 RF-022…» | ✅ | ✅ |
| RF-023 | `AccountMenu.tsx:23,108` | AM «RF-023 D-16…», «RF-023 C-26 la inicial va en Light…», «E-11 RF-023…»; DS CA-2.2 | ✅ | ✅ |
| RF-024 | `PrivateArea.tsx` (`h1.text-display`) | PA «CA-2.1 RF-006 RF-024…»; DS 56 px / 40 px | ✅ | ✅ |
| CA-1.1 | `AuthCard.tsx`, `LoginForm.tsx` | DS CA-1.1; LF «RF-003 CA-1.1 X-1…» | ✅ | ✅ (la retícula no se comprueba) |
| CA-1.2 | `AuthCard.tsx` | DS «CA-1.2 RF-002…»; SF «RF-003 CA-1.2 X-1…» | ✅ | ✅ |
| CA-1.3 | `LoginForm.tsx` | LF «CA-1.3 RF-004 con un 401…» | ✅ | ✅ |
| CA-1.4 | `SignupForm.tsx` | SF «CA-1.4 RF-004…»; DS «CA-1.4 RF-004…» | ✅ | ✅ |
| CA-1.5 | `LoginForm.tsx` (zona `status`) | LF «CA-1.5 RF-004 con ?expired=1…» | ✅ | ✅ |
| CA-1.6 | `FormField.tsx` | SF «CA-1.6 RF-005 RF-010 D-15…»; DS CA-1.6 | ✅ | ✅ |
| CA-2.1 | `AppHeader.tsx`, `PrivateArea.tsx` | DS «CA-2.1 RF-006 RF-024 a 1280…» (con `toHaveTitle`); AH; PA | ✅ | ✅ |
| CA-2.2 | `AppHeader.tsx`, `AccountMenu.tsx` | DS «CA-2.2 … a 375 / 767 / 768» | ✅ | ✅ |
| CA-2.3 | `PrivateArea.tsx` | PA y DS «CA-2.3 RF-008…» | ✅ | ✅ |
| CA-2.4 | `AccountMenu.tsx`, `PrivateArea.tsx` | AM «CA-2.4 RF-020…»; DS «CA-2.4 CA-2.6…» | ✅ | ✅ |
| CA-2.5 | `AccountMenu.tsx` | AM «CA-2.5 …» (×3) | ✅ | ✅ |
| CA-2.6 | `AccountMenu.tsx` | AM «CA-2.6 RF-022…»; DS «CA-2.4 CA-2.6…» | ✅ | ✅ |
| CA-3.1 | `tokens.css`, D-21 | TK «CA-3.1 RF-009…»; AH «RF-009 CA-3.1 D-21…»; DS axe | ✅ | ✅ Medido (ver RF-009) |
| CA-3.2 | `global.css` | DS «CA-3.2 RF-011…» | ✅ | ✅ |
| CA-3.3 | Ver RF-012 | DS «CA-3.3 RF-012…» | ✅ | ✅ |
| CA-3.4 | Layout fluido | DS «CA-3.4 RNF-002 … 640 px CSS» | ✅ | ✅ (zoom emulado con el ancho) |
| CA-4.1 | `Button.tsx`, `LoginForm.tsx` | LF «CA-4.1 RF-013 E-7…»; DS CA-4.1 | ✅ | ✅ |
| CA-4.2 | `Button.tsx`, `SignupForm.tsx` | SF «CA-4.2 RF-013…»; DS CA-4.2 | ✅ | ✅ |
| CA-4.3 | `AppHeader.tsx`, `AccountMenu.tsx` | PA, AH, AM y DS «CA-4.3…» | ✅ | ✅ |
| CA-4.4 | `Button.tsx` | BT «CA-4.4…»; LF «CA-4.4…» | ✅ | ✅ |
| CA-5.1 | `Button.tsx` (`motion-safe:`) | DS «CA-5.1 RF-014…» | ✅ | ✅ |
| CA-5.2 | `tokens.css:290-306`; `border-contrast` en todas las superficies, también la cabecera | TK; AH «CA-5.2 RF-015 D-22…»; DS las dos «CA-5.2…» | ✅ | ✅ (M-1 resuelto) |
| CA-5.3 | Script de `Layout.astro`, bloque oscuro | DS «CA-5.3 RF-016…» | ✅ | ✅ (la parte «y cumple CA-3.1» ya se cumple; B-1 resuelto) |
| CA-5.4 | Ídem, claro | DS «CA-5.4 RF-016…» | ✅ | ✅ |
| RNF-001 | ARIA del menú, zonas `alert`/`status`, foco | DS «RNF-001 RF-009 axe sin infracciones…» (claro y oscuro, con el menú a 375) | ✅ | ⚠️ La parte automática está en verde. Falta la checklist manual de §21 (❓), que el propio RNF-001 incluye; M-8 |
| RNF-002 | Layout fluido, `truncate`, `wrap-anywhere`; panel `w-72` con `end-4` (cabe a 320) | DS «RNF-002 RNF-004 E-2 …» y CA-3.4 | ✅ | ✅ |
| RNF-003 | Geist y Lucide empaquetados | DS «RNF-003 C-16…» | ✅ | ✅ (en `astro dev`) |
| RNF-004 | `playwright.config.ts` (chromium, chrome, webkit) | Todos los E2E en los tres proyectos | ✅ | ✅ (WebKit flaky, M-7; Edge a través de Chromium) |
| RNF-005 | `--dur*`, `--animate-spin` | TK «RNF-005 …»; IC «X-9 RNF-005…»; DR | ✅ | ✅ Cumple a la letra; la impresión del giro (X-9) es ❓ |
| RNF-006 | (a) DR · (b) `tokens.css` · (c) `DESIGN.md` 1.2.1-todo.1 | DR «RNF-006 D-3…»; TK completitud y valores | ✅ | ⚠️ (a) parcial: M-2 / m-1 |
| E-1 | `AppHeader.tsx` `EmailPill` | AH «E-1 D-13…», «E-1 X-13 el tooltip mide al menos 34 px…», «E-1 sin recorte…»; DS «E-1 RF-006 email de 254 caracteres…» | ✅ | ✅ |
| E-2 | Ídem RNF-002 | DS «RNF-002 RNF-004 E-2…» a 320 | ✅ | ✅ |
| E-3 | `tokens.css:274-286` | TK «E-3 X-11 sin blur…» y los pares SB de «CA-3.1 RF-009…» | ✅ | ⚠️ **I-1.** El test pasa (menú SB medido sobre un punto de la retícula, 7.55:1), pero, emulando E-3 en oscuro con el menú abierto, la opción con foco da **6.86:1** sobre el título nítido de detrás |
| E-4 | `Layout.astro:2`; `font-display: swap` de Fontsource | DS «E-4 …» | ✅ | ✅ (test débil, M-9) |
| E-5 | `LoginForm.tsx` | LF «E-5 …»; DS «E-6 RF-004 a 320…» | ✅ | ✅ |
| E-6 | `Alert.tsx` | AL «X-7 E-6 D-5…»; DS «E-6 RF-004 a 320…» | ✅ | ✅ |
| E-7 | `Button.tsx`, `AccountMenu.chooseLogout` | BT, LF, PA «… E-7 …» | ✅ | ✅ |
| E-8 | Evento `change` en `Layout.astro`; CSS | DS «E-8 RF-015 RF-016…» | ✅ | ✅ |
| E-9 | `lang="es"` | DS «E-9 …» | ✅ | ✅ |
| E-10 | `AccountMenu.tsx:39-48` | AM «E-10 …»; DS «E-10 RF-007…» | ✅ (flaky de D-20 en la 2.ª ejecución, de hidratación, no del menú) | ✅ |
| E-11 | `AccountMenu.tsx:23` | AM «E-11 RF-023…» | ✅ | ✅ |
| E-12 | `AccountMenu.tsx` `chooseLogout`/`close`; `PrivateArea.tsx` | AM «CA-4.3 RF-013 E-12…», «E-12 si falla…»; PA «E-12 …» | ✅ | ✅ (solo unitario) |
| E-13 | Script `is:inline` en `<head>` | DS «E-13 RF-016…» | ✅ | ✅ |
| E-14 | `AccountMenu.tsx` (`Tab` → `close()`; el panel, al final de `<body>`, ya no queda entre el botón y lo siguiente) | AM «E-14 …»; DS «E-14 RF-022 a 375…» (3 navegadores) | ✅ | ✅ |

**Pendiente de revisión manual (❓, la tiene que hacer una persona):**

- **Checklist de `DESIGN.md` §21.** En las tres pantallas (inicio de sesión, registro y zona privada), en claro y oscuro, con y sin «aumentar contraste», a 375, 768 y 1280 px. Qué mirar:
  - **Solo tokens.** DR lo cubre para colores, capas y duraciones (ver m-1).
  - **Texto ≥ 7:1 en su superficie real.** Abrir el menú de cuenta a 375 en los dos temas: el título debe verse desenfocado detrás del panel.
  - **Un solo primario por vista.** Títulos ≥ 20 px en Light 300 con tracking negativo («Iniciar sesión», «Crear cuenta», «Mis tareas»).
  - **Formas y profundidad.** Alturas y radios de §14 y §5; sin esquinas vivas ni bordes sólidos, salvo el de «aumentar contraste»; sombras de §6.2.
  - **Vidrio.** La retícula se ve en el lienzo y se difumina bajo la tarjeta, la cabecera, las píldoras y el panel del menú (§0).
  - **Estados.** Error, sin conexión, carga y sesión caducada. **Teclado, foco y movimiento reducido.**
  - **«Aumentar contraste» en oscuro.** Que el borde ink‑600 de las píldoras, los campos y el panel se distinga (M-3).
  - **Posición del panel.** El panel queda a 8 px de la franja de la cabecera y a 21 px del botón «A». Hay que juzgar si se lee como «unido» al botón (D-21).
- **Desenfoque del menú en Safari real** (B-1 en WebKit). El WebKit de Playwright no pinta `backdrop-filter` en las capturas (comprobado con una página mínima), así que no se puede verificar de forma automática. Abrir la zona privada en Safari a 375 px (ventana estrecha), abrir el menú de cuenta en los dos temas y comprobar que «tareas» se ve desenfocado detrás del email y de «Cerrar sesión», no nítido.
- **X-9 (plan §8).** Pulsar «Iniciar sesión», «Crear cuenta» y «Cerrar sesión» con la red lenta (DevTools, 2 s), y también con «reducir movimiento», porque el anillo sigue girando. Juzgar si un giro cada 420 ms se ve nervioso. Si molesta, se cambia RNF-005 con `/sdd-cambiar-spec`, no el código.

## Problemas (por gravedad: bloqueante / importante / menor), con ruta y propuesta

### Bloqueante

Ninguno.

### Importante

**I-1 · E-3 en oscuro: con el menú abierto, la opción con foco baja a 6.86:1 sobre el título de detrás (E-3, RF-009)**
- **Dónde:**
  - `apps/web/src/styles/tokens.css:274-286`: sin blur, raised al 92 %;
  - `apps/web/src/components/AccountMenu.tsx:120`: el panel queda encima del `h1`;
  - `apps/web/src/styles/tokens.test.ts:317,325-326`: el modelo.
- **Qué pasa:** sin desenfoque, el título display «Mis tareas» (`--text-1`, claro en oscuro) se ve nítido a través del 8 % que deja pasar el panel. Medidas a 375, en oscuro, emulando E-3 (sin `backdrop-filter` y con las superficies de X-11), en Chromium y en WebKit:
  - la opción con foco («Cerrar sesión») da **6.86:1** sobre un trazo del título (fondo `66,84,98`), con una media de 7.6;
  - el email da 10.89:1;
  - en claro no hay problema (≥ 17.4:1).
- **Por qué no lo ve el test:** `tokens.test.ts` compone el menú SB sobre `underGlass` = un punto de la retícula (7.55:1), sin el texto que hay detrás. Es el mismo punto ciego que ocultó B-1: el modelo no tiene en cuenta el contenido real bajo un panel flotante.
  - En la variante normal también es optimista: da 12.39 y 8.01, cuando el peor píxel medido es 10.77 y 7.65. Aun así cumple.
  - Con la 002, el tablero pondrá paneles y diálogos sobre tarjetas con texto, y ADR-0003 confía en este test para vigilarlo.
- **Alcance real:** ninguno de los navegadores de RNF-004 (Chrome, Safari y Edge recientes) carece de `backdrop-filter`. Por eso no bloquea, pero E-3 dice explícitamente que «el contraste sigue cumpliendo RF-009».
- **Propuesta** (pasa por el plan como `D-x`):
  - añadir a `TEXT_PAIRS` el par «menú / opción con foco sobre `--text-1`» en la variante SB (y, si se quiere, en N con un modelo de desenfoque);
  - cambiar lo que haga falta para que pase. Por ejemplo, que en `@supports not (backdrop-filter…)` el panel use la superficie opaca de «aumentar contraste», o que `--surface-raised` suba ahí al 100 %.

  Una alternativa es anotar en la spec que E-3 no aplica a los navegadores de RNF-004, con `/sdd-cambiar-spec`.

### Menor

- **m-1 · RNF-006 (a): más valores fuera del catálogo (amplía M-2).** Además de lo de M-2:
  - `font-light` (`AccountMenu.tsx:108`) sale del tema por defecto de Tailwind (`--font-weight-light`), no de `tokens.css`. `@theme static` no vacía `--font-weight-*`, así que también funcionan `font-bold`, `font-black`, etc., sin que DR lo detecte.
  - `top-19.25` (77 px) y `min-h-8.5` (34 px) no están en la escala de §3.1; vienen de D-22 y X-13.

  **Propuesta:** `--font-weight-*: initial` con los pesos de §2 (300, 400, 500) en `@theme static`, y decidir en el plan si la escala de espaciado es «múltiplos de `--spacing`» o la lista de §3.1.
- **m-2 · La posición del panel depende de un número mágico y nada la vigila (D-21, D-22).**
  - `AccountMenu.tsx:120`: `top-19.25 end-4` repite a mano la altura de la cabecera (`py-3` + `h-11` + 1 px de borde + 8) y su padding (`px-4`).
  - Si cambia la cabecera (padding, altura de las píldoras o el borde), el panel se descoloca, y ningún test comprueba dónde queda respecto al botón o a la cabecera.
  - **Propuesta:** un E2E que, con el menú abierto a 375 y 320, compruebe que `panel.top − header.bottom = 8` y que el borde derecho del panel coincide con el del botón. Al mismo tiempo, el E2E que proponía B-1, que el panel desenfoque en un navegador real (hoy solo lo comprueba jsdom, por estructura).
- **m-3 · Documentación del plan desfasada.** `plan.md:70` (§3, C-26) sigue diciendo «11 desviaciones justificadas (X-1–X-11)», pero ya hay 13 (X-12 y X-13).
  - **Propuesta:** actualizar la cifra.
- **m-4 · Registro de tareas.** `tasks.md:445`: T-029 pone «(pendiente)» en Commit; es `e8767d7` (es lo que queda de M-10).
- **M-3, M-5, M-6, M-7, M-8, M-9, M-11, M-12:** siguen como en la primera verificación (ver tabla de estado), con las mismas propuestas.

## Deriva spec ↔ código

| Spec / plan / `DESIGN.md` dice | El código hace | Ref. |
|---|---|---|
| E-3: sin desenfoque, «el contraste sigue cumpliendo RF-009» | Menú abierto en oscuro: 6.86:1 en la opción con foco | I-1 |
| D-3 / ADR-0003: «solo `tokens.css` puede tener valores literales»; RNF-006 (a) | Literales en `global.css`; pesos y medidas que vienen de Tailwind por defecto | M-2, m-1 |
| `DESIGN.md` §11.2: la zona privada muestra solo la cabecera | También el `h1` display (RF-024) | M-5 |
| `DESIGN.md` §18: `global.css` expone los tokens con `@theme` | Está en `tokens.css` | M-5 |
| Plan §3: 11 desviaciones | 13 (X-1–X-13) | m-3 |

Lo resuelto desde la primera verificación ya no es deriva: B-1 (RF-009, CA-3.1, §6.3), M-1 (CA-5.2) y M-4 (§14 Button, Avatar y Tooltip, con X-12 y X-13). Lo demás coincide: orden de avisos y campos, tonos, textos de la 001, gerundios, cabecera y sus variantes, menú (APG), preferencias del sistema, responsive y catálogo. La spec no ha cambiado desde la primera verificación (v1.1).

**Alcance:**
- Los tres commits nuevos solo tocan lo que piden T-027–T-029: el portal del panel, el borde de la cabecera, la inicial en Light, la altura mínima del tooltip, sus tests, `tokens.test.ts`, `research.md`, `plan.md` y `DESIGN.md`.
- No hay código de producto que no se trace a un requisito o a una decisión. Nada de «Fuera de alcance» se ha colado.

**Plan:**
- D-21 y D-22 están documentados con su porqué, sus alternativas y quién los decidió.
- X-12 y X-13 están en §4.5.
- D-21 dice «8 px de separación» bajo la cabecera, y el código lo cumple (77 = 69 + 8). Como efecto, el panel queda a 21 px del botón, cuando antes estaba a 8. No es una desviación, pero conviene mirarlo en la revisión manual.
- Sin documentar: solo la cifra de m-3.

## Constitución

| Artículo | Estado | Nota |
|---|---|---|
| C-1 | ✅ | `strict`; sin `any`, `@ts-ignore` ni `eslint-disable` en el diff |
| C-2 | ✅ | Sin dependencias nuevas desde la primera verificación (`createPortal` es de `react-dom`) |
| C-3 | ✅ | Sin cambios |
| C-4 | ✅ | Una isla por página; el portal no crea otra isla. Ningún efecto nuevo; los existentes solo se suscriben a eventos del navegador |
| C-5–C-15 | ✅ | No aplican |
| C-16 | ✅ | E2E RNF-003 en verde |
| C-17 | ✅ | Los 22 RF tienen tests. El de RF-009 ya no pasa con el requisito incumplido en los navegadores de RNF-004 (B-1 resuelto); queda el punto ciego de I-1 |
| C-18 | ✅ | Vitest + Testing Library; Playwright en tres proyectos |
| C-19 | ✅ | `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde |
| C-20 | ⚠️ | WCAG 2.2 AA automático en verde (axe, teclado, ARIA, 44 px, foco); falta la revisión manual (§21) |
| C-21 | ✅ | Ver Alcance |
| C-22 | ✅ | Sin abstracciones nuevas |
| C-23 | ✅ | Identificadores en inglés; sin tildes en los ficheros |
| C-24 | ⚠️ | T-027–T-029 con IDs y `[spec 004]`; siguen los dos commits del kit sin IDs (M-11) |
| C-25 | ✅ | `pnpm lint` en verde; configuración sin cambios |
| C-26 | ⚠️ | El contraste AAA se cumple en los estados reales de los navegadores soportados. Las desviaciones de `DESIGN.md` están justificadas (X-1–X-13). Falla solo en E-3 (I-1) y queda la revisión visual manual |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ⚠️ | 28/29. T-026 (esta verificación) no se cierra hasta las revisiones manuales ❓. Las 28 marcadas están hechas: cada una tiene su commit y su efecto en el código (T-027–T-029 comprobadas línea a línea) |
| Cada RF y CA con un test que lo verifica y pasa | ✅ | 22 RF y 24 CA; los tests de RF-009 / CA-3.1 miden ya el menú sobre la página |
| Cada caso límite implementado y probado | ⚠️ | E-1–E-14 con tests en verde; E-3 no se cumple en oscuro con el menú abierto (I-1) |
| No hay código que no se trace | ✅ | Ver Alcance |
| Tests, linter y tipos en verde (local y CI) | ⚠️ | En local, en verde. No hay CI en el repositorio |
| Sin `console.log`, código comentado ni TODO sin ticket | ✅ | Revisado en el diff |
| Accesibilidad revisada en componentes interactivos | ⚠️ | La automática, en verde; la manual (§21) está pendiente ❓ |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código (sin deriva) | ⚠️ | Solo E-3 (I-1) |
| Desviaciones del plan anotadas | ✅ | D-21, D-22, X-12 y X-13; falta actualizar la cifra de plan §3 (m-3) |
| ADRs si hubo decisiones transversales | ✅ | ADR-0003. Conviene anotar en su deuda que el test de contraste no modela el contenido bajo los paneles flotantes (I-1) |
| Estado de la spec → `implementada` | ❌ | Sigue en `en-implementacion`; cambiarlo tras la revisión manual |
| PR con enlace a la spec, requisitos e informe | ❌ | No hay PR todavía |
| Revisada y aprobada | ❌ | Pendiente |

**Para cerrar T-026 y pasar la spec a `implementada`:**
1. Hacer la checklist manual de §21, la revisión de X-9 y la del desenfoque del menú en Safari, y anotar el resultado en este informe.
2. Decidir I-1: corregirlo (con su `D-x` y el par nuevo en `tokens.test.ts`) o acotar E-3 en la spec con `/sdd-cambiar-spec`.
3. Los menores pueden quedar como observaciones o como ideas en el roadmap. Lo más barato: m-3, m-4 y M-5 son correcciones de texto.
