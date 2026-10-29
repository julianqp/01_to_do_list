# Research · Spec 004 · Aplicar el sistema de diseño

Incógnitas técnicas resueltas antes del plan (2026-10-29). Las pruebas se hicieron en local con las versiones instaladas del proyecto (Tailwind 4.3.3, Playwright 1.64.1) y las versiones del registro de npm de ese día.

## R-1 · Cómo exponer los tokens de `DESIGN.md` a Tailwind 4.3.3

- **Pregunta:** `DESIGN.md` §18 pide un único fichero de tokens (`tokens.css`) expuesto a Tailwind con `@theme`. Varios nombres de `DESIGN.md` coinciden con espacios de nombres de Tailwind (`--text-*` es tamaño de letra en Tailwind, pero `--text-1` es un color en `DESIGN.md`; `--radius-*`, `--shadow-*` y `--ease-*` también existen en Tailwind). ¿Se pueden usar los nombres de `DESIGN.md` sin duplicar valores ni crear referencias circulares?
- **Prueba:** se compiló un CSS de ejemplo con `@tailwindcss/node` 4.3.3 (el mismo compilador que usa `@tailwindcss/vite`).
- **Hallazgos:**
  1. `@theme { --color-*: initial; }` elimina la paleta por defecto: `bg-gray-900` o `text-red-700` **no generan CSS**. Lo mismo con `--text-*`, `--ease-*`, `--radius-*` y `--breakpoint-*`.
  2. Las variables de `@theme` se emiten en `@layer theme` y las utilidades las usan con `var()` (`.text-display { font-size: var(--text-display); line-height: var(--text-display--line-height); … }`). Un `:root { … }` **sin capa** declarado después las sobrescribe. Así se cambia la escala tipográfica en móvil con una media query sin duplicar la utilidad.
  3. Las subpropiedades `--text-display--line-height`, `--letter-spacing` y `--font-weight` funcionan: `text-display` aplica tamaño, interlineado, tracking y peso de una vez.
  4. Por defecto, Tailwind solo emite las variables de `@theme` que se usan. Con `@theme static` las emite todas, y el catálogo queda completo en el CSS final.
  5. `@theme inline { --color-canvas: var(--bg-canvas); --color-1: var(--text-1); }` genera `bg-canvas { background-color: var(--bg-canvas) }` y `text-1 { color: var(--text-1) }`. Los colores pueden vivir como variables normales en `:root` y en `:root[data-theme="dark"]`, y cambiar con el tema.
  6. **Las sombras en `@theme` se descomponen:** Tailwind reescribe `--shadow-*` para insertar `--tw-shadow-color`. Con sombras de varias capas e `inset` el resultado no es fiable. En cambio, `shadow-(--shadow-glass)` genera `--tw-shadow: var(--shadow-glass)` sin tocar el valor. Lo mismo `z-(--z-sticky)` y `duration-(--dur-fast)`.
  7. Los valores arbitrarios literales (`p-[7px]`, `bg-[#fff]`, `text-[13px]`) **siguen compilando** aunque se haya vaciado el tema. Tailwind no puede prohibirlos.
- **Conclusión:** `tokens.css` lleva tres partes:
  - Un bloque `@theme static` con lo que no cambia con el tema: familias, escala tipográfica, radios, curvas y breakpoints, y el `initial` de cada espacio de nombres.
  - Un bloque `@theme inline` que da nombre de clase a los colores semánticos.
  - Variables normales para colores, sombras, capas, duraciones y retícula, con sus variantes de tema, de contraste y sin blur.

  Lo que Tailwind no puede impedir (valores literales) lo vigila un test que revisa el código (plan D-3).

## R-2 · Valores que `DESIGN.md` deja pendientes y su contraste

- **Pregunta:** `DESIGN.md` («Pendiente de decidir» 1) no tiene los valores de los acentos, `*-soft`, `--pill-*`, sombras, `--border-glass` ni `--dot-grid`. La spec (RNF-006 c) pide crearlos cumpliendo §1.3 (`oklch 0.68 0.11`) y §1.6 (contraste), con el contraste calculado.
- **Método:** script con `culori` 4.0.2. Las superficies translúcidas se componen en sRGB, como hace el navegador, sobre su fondo real (p. ej., campo = raised sobre la tarjeta glass, que está sobre el lienzo). Con blur, los puntos de la retícula quedan difuminados y se mide sobre el lienzo liso; sin blur (E-3), sobre un punto, que es el peor caso. Contraste según WCAG 2.x.

### Acentos (cumplen §1.3: misma L y C, cambia el tono)

| Token | oklch | Hex (sRGB) |
|---|---|---|
| `--sage` | `oklch(0.68 0.11 150)` | `#63AB74` |
| `--rose` | `oklch(0.68 0.11 15)` | `#D37B82` |
| `--lilac` | `oklch(0.68 0.11 300)` | `#A388D2` |
| `--amber` | `oklch(0.68 0.11 75)` | `#C08E43` |
| `--signal` | `oklch(0.68 0.11 40)` | `#D28063` |

Los cinco están dentro del gamut sRGB.

### Lo que **no** cumple con los valores literales de `DESIGN.md` (y obliga a desviarse)

| Uso | Contraste | Mínimo | Consecuencia (plan) |
|---|---|---|---|
| `--text-on-pill` (ink‑950) sobre un acento a L 0.68 | 6.16–6.77 | 7:1 (§1.4) | Las `--pill-*` usan tonos más claros del mismo acento, L 0.74–0.80 (X-6) |
| Acento a L 0.68 como icono de alerta sobre su alerta, en claro | 2.34–2.50 | 3:1 (RF-010) | Los iconos de alerta usan `--text-1` (X-7) |
| `--rose` como anillo de error sobre un campo o una tarjeta, en claro | 2.37–2.80 | 3:1 (RF-010) | Token nuevo `--ring-error`, más oscuro en claro (X-5) |
| `--ink-800` como contorno de foco (§8) sobre el lienzo o el glass oscuros | 1.41–1.52 | 3:1 (RF-010) | Token nuevo `--focus-outline` con valor propio en oscuro (X-4) |
| `--text-2` sobre una alerta, en oscuro | 6.03–6.31 | 7:1 | El texto de las alertas va en `--text-1` (X-7) |
| `--text-2` sobre una opción de menú con foco, en oscuro | 5.98 | 7:1 | El menú usa solo `--text-1` |
| `--text-3` sobre un punto de la retícula, en claro | 5.32 | 7:1 | `--text-3` nunca va directamente sobre el lienzo (en estas pantallas no se usa) |
| Brillo radial blanco ≥ 6 % sobre `--pill-ink` con texto ink‑0 | ≤ 7.46 | 8:1 (§1.4) | `--pill-ink` sin brillo radial (X-6) |
| `--surface-raised-hover` subido al 92 % sin blur, en oscuro | 6.53 con `--text-1` | 7:1 | El respaldo sin blur sube solo `glass`, `raised` y la cabecera, no `raised-hover` (X-11) |

### Contraste con los valores propuestos (todos cumplen)

Columnas: **N** = normal · **SB** = sin blur (E-3, superficies al 92 % y midiendo sobre un punto) · **C+** = «aumentar contraste» (superficies opacas, CA-5.2). El test de contraste del plan (D-12) vuelve a calcular esta misma tabla a partir de `tokens.css`.

| Superficie · texto que lleva | Claro N / SB / C+ | Oscuro N / SB / C+ |
|---|---|---|
| Lienzo (sobre un punto) · título «Mis tareas» `--text-1` (grande) | 12.15 / 12.15 / 12.15 | 12.87 / 12.87 / 12.87 |
| Tarjeta glass · título, enlace `--text-1` | 16.31 / 16.78 / 16.31 | 15.16 / 14.20 / 15.16 |
| Tarjeta glass · etiquetas y «¿No tienes cuenta?» `--text-2` | 10.71 / 11.02 / 10.71 | 11.14 / 10.44 / 11.14 |
| Campo (raised) · valor `--text-1` | 17.69 / 17.87 / 17.69 | 12.02 / 11.05 / 12.02 |
| Campo con foco (raised‑hover) · valor `--text-1` | 18.53 / 18.66 / 18.69 | 8.81 / 8.53 / 7.90 |
| Píldora glass de la cabecera · `--text-1` | 16.31 / 16.93 / 16.31 | 15.16 / 14.49 / 15.16 |
| Menú de cuenta (raised) · email `--text-1` | 17.38 / 17.72 / 17.69 | 12.39 / 11.06 / 12.02 |
| Opción de menú con foco (raised‑hover) · `--text-1` | 18.69 / 18.69 / 18.69 | 8.01 / 7.65 / 7.90 |
| Alerta de error en la tarjeta · `--text-1` | 15.21 / 15.38 / 15.21 | 8.76 / 8.21 / 8.76 |
| Alerta sin conexión en la tarjeta · `--text-1` | 15.32 / 15.49 / 15.32 | 8.63 / 8.00 / 8.63 |
| Alerta informativa en la tarjeta · `--text-1` | 15.33 / 15.47 / 15.33 | 8.55 / 8.02 / 8.55 |
| Alerta sin conexión bajo la cabecera · `--text-1` | 14.63 / 15.18 / 15.32 | 8.21 / 8.00 / 8.63 |
| Botón primario · `--text-on-accent` sobre la parada más clara de `--grad-primary` (`#34495A`) | 8.86 | 8.86 |
| **No texto (≥ 3:1)** · anillo e icono de error contra el campo / la tarjeta | 4.86 / 4.48 (SB 4.91 / 4.61) | 4.54 / 5.72 (SB 4.17 / 5.36) |
| **No texto (≥ 3:1)** · contorno de foco, peor superficie | 7.98 | 5.62 |
| `--pill-*` (parada más oscura, L 0.74) · `--text-on-pill` | ≥ 7.71 (rose) | igual (texto fijo, §1.5) |
| `--pill-ink` · ink‑0 | 8.86 | 8.86 |
| Tooltip · ink‑50 sobre ink‑950 | 16.34 | 16.34 |

Peor caso de texto normal: **7.65:1** (opción de menú con foco, oscuro, sin blur). Peor caso no textual: **4.17:1**.

## R-3 · Fuentes servidas desde la app (RNF-003, E-4)

- **Pregunta:** cómo servir Geist desde el propio proyecto (C-16, `DESIGN.md` §2.1) sin parpadeo de texto invisible.
- **Opciones:**
  - `@fontsource-variable/geist` 5.3.0 (2026-07-19). Trae los `woff2` y un CSS con `@font-face`, `font-display: swap` y `unicode-range` por subconjunto. El navegador solo descarga el subconjunto latino (32 KB) y Vite lo sirve desde el mismo origen. `wght.css` solo declara la versión normal (sin cursiva).
  - Paquete `geist` 1.8.2: pide `next` como dependencia par. Descartado.
  - Copiar los `woff2` al repo y escribir el `@font-face` a mano: no añade dependencia, pero mete binarios en el repo y hay que actualizarlos a mano.
  - API de fuentes de Astro: no se ha probado. Fontsource ya resuelve el caso sin configuración.
- **Conclusión:** `@fontsource-variable/geist` 5.3.0, importado desde `Layout.astro` (D-7). `swap` cubre E-4. Geist Mono no se instala: ninguna pantalla de esta spec la usa. El token `--font-mono` queda definido, y la spec que la use por primera vez añade la fuente.

## R-4 · Iconos (Lucide)

- **Pregunta:** `DESIGN.md` §9 deja la versión y la dependencia de Lucide al plan de la spec que los introduce.
- **Hallazgos:** `lucide-react` 1.62.0 (2026-10-27) admite React 19 como dependencia par y declara `sideEffects: false`, así que Vite solo incluye los iconos importados. Tiene `CircleAlert`, `TriangleAlert`, `Info`, `CircleCheck` y `LoaderCircle`. La 1.63.0 y la 1.64.0 tienen menos de 1 día (D-16 de la 001), así que se fija la 1.62.0.
- **Conclusión:** `lucide-react` 1.62.0, con `strokeWidth={1.4}` en cada uso a través de un único componente (D-8). La alternativa de copiar los SVG a mano se descarta: aquí hacen falta 4 iconos, pero la 002 necesita unos 15 más (§9).

## R-5 · Emular las preferencias del sistema en Playwright

- **Pregunta:** ¿se pueden automatizar CA-5.1–5.4, E-8 y E-13 en los tres proyectos E2E?
- **Prueba:** en `chromium`, `chrome` (Chrome 156) y `webkit` (WebKit 27.2), `page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce', contrast: 'more' })` hace que `matchMedia` devuelva `true` para las tres consultas. Cambiar la preferencia con la página abierta dispara el evento `change` de `matchMedia` (de forma asíncrona: el test tiene que esperar al resultado, no leerlo justo después). Los tres navegadores admiten `backdrop-filter` sin prefijo y colores `oklch()`.
- **Conclusión:** todo se automatiza en E2E en los tres proyectos. E-3 (sin soporte de blur) no se puede emular con navegadores que sí lo soportan. Se cubre calculando el contraste de las variantes `@supports not (backdrop-filter…)` de `tokens.css` en un test unitario (plan D-12).

## R-6 · Menú de cuenta accesible

- **Referencia:** patrón *Menu Button* de WAI-ARIA APG. Botón con `aria-haspopup="menu"`, `aria-expanded` y `aria-controls`; `role="menu"` con hijos `role="menuitem"`; Enter o Espacio abren el menú y llevan el foco a la primera opción; las flechas mueven el foco; Esc cierra y devuelve el foco al botón; Tab cierra y deja que el foco siga su orden.
- **Detalle:** un `role="menu"` solo admite como hijos `menuitem`, `group` y `separator`. Un texto suelto (el email) dentro del menú lo marca axe (`aria-required-children`). Por eso el email va fuera del `role="menu"`, en el mismo panel flotante, y da nombre al menú con `aria-labelledby`. Un lector de pantalla anuncia «menú ana@example.com, Cerrar sesión, elemento de menú».
- **Riesgo con Tab (E-14):** si el menú desaparece del DOM mientras tiene el foco, el navegador lo devuelve a `body` y el siguiente Tab empieza desde el principio de la página. Se resuelve llevando el foco al botón de cuenta en el `keydown` de Tab, sin `preventDefault`. Así, el Tab del navegador sigue desde el botón (plan D-10). Se comprueba en E2E en los tres navegadores.

## R-7 · Versiones

Antigüedad mínima de 1 día (`minimumReleaseAge`, plan 001 D-16).

| Paquete | Versión | Publicada | Dónde | Nota |
|---|---|---|---|---|
| lucide-react | **1.62.0** | 2026-10-27 | web | 1.63.0 y 1.64.0 tienen menos de 1 día |
| @fontsource-variable/geist | **5.3.0** | 2026-07-19 | web | |
| culori | **4.0.2** | 2025-06-27 | web (dev) | Sin dependencias |
| @types/culori | **4.0.1** | 2025-09-02 | web (dev) | `culori` no trae tipos (C-1) |
| @axe-core/playwright | **4.14.0** | 2026-10-15 | raíz (dev) | Dependencia par `playwright-core >= 1.0.0` |
