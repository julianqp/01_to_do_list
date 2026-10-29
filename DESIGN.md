# DESIGN.md — Tinta & Niebla · adaptación To do list · v1.1.0-todo.1

Reglas de diseño de la **app de tareas con tablero kanban** (`01_to_do_list`). Es la fuente de verdad de **lo visual**: color, tipografía, espaciado, forma, superficies, movimiento, iconos, componentes y tono de los textos.

**Precedencia:**
- En lo visual manda este documento.
- En lo técnico (stack, estructura de carpetas, arquitectura, seguridad, datos) manda la constitución (`.sdd/constitution.md`).
- En el comportamiento (qué pasa, cuándo y con qué mensaje) manda la spec de cada funcionalidad. Si una spec necesita salirse de este documento, lo justifica en su plan.

**Plataforma:** web app, escritorio (principal) y móvil (responsive).
**Accesibilidad objetivo:** WCAG 2.2 **AAA en texto** (≥ 7:1), AA en el resto.

### Origen de esta adaptación

Adaptado de **Tinta & Niebla v1.1.0**, el sistema de diseño de un CRM de VTC (copia íntegra en `../DESIGN-tinta-niebla-vtc-original.md`, fuera de este repositorio). Se conservan la esencia, la paleta base, la tipografía, el espacio, la forma, las superficies, el movimiento, los estados, los formularios, los componentes que aplican y la voz.

- **Eliminado:** pantallas del CRM (panel, despacho, flota, onboarding de conductores), mapas, fotografía, visualización de datos, email, marketing y landing, y los formatos españoles de matrícula, NIF o IBAN.
- **Adaptado al dominio de tareas:** el significado de los acentos, los iconos, los patrones de pantalla, el vocabulario y los ejemplos.

Los valores que este documento no incluye (acentos, píldoras, sombras, retícula de puntos) estaban en los ficheros de tokens del sistema original: ver §21 y «Pendiente de decidir».

---

## 0. Esencia

**Vidrio suave sobre tinta azul.** Una herramienta personal para organizar tareas que se siente ligera: columnas de vidrio sobre un lienzo punteado, tarjetas en píldora y un único acento cuando significa algo.

Principios, en orden de prioridad:

1. **La tinta estructura.** La jerarquía se marca con la opacidad de la superficie y el peso y tamaño del texto, no con el color.
2. **El acento significa.** Sage, rose, lilac y amber codifican un estado. Nunca decoran.
3. **Sin aristas.** Píldoras y radios amplios. El borde es luz (brillo interior de 1px) más una sombra larga.
4. **Grande y ligero.** Títulos en Light 300 con tracking negativo. Todo lo demás, discreto.
5. **Cercano y claro.** Se habla de tú, en frases cortas y humanas. El sistema nunca culpa a nadie.

---

## 1. Color

### 1.1 Paleta base (inmutable)

| Token | Hex | Uso principal |
|---|---|---|
| `--ink-950` | `#06141B` | Texto principal (claro) · lienzo (oscuro) |
| `--ink-900` | `#11212D` | Superficie oscura · final del degradado primario |
| `--ink-800` | `#253745` | **Marca** · primario · selección · texto 2 (claro) |
| `--ink-600` | `#4A5C6A` | Iconos · elementos no textuales |
| `--ink-300` | `#9BA8AB` | Inactivo · conectores vacíos |
| `--ink-200` | `#CCD0CF` | Niebla · texto 2 (oscuro) |

### 1.2 Neutros derivados

| Token | Hex | Uso |
|---|---|---|
| `--ink-700` | `#3A4C59` | **Texto terciario** (claro), 7.0:1 |
| `--ink-500` | `#627480` | Solo elementos no textuales en oscuro |
| `--ink-400` | `#74858B` | Solo no‑texto: anillos vacíos, iconos decorativos |
| `--ink-100` | `#E3E6E6` | **Lienzo claro** |
| `--ink-50` | `#EEF0F0` | Texto principal (oscuro) · superficies muy claras |
| `--ink-0` | `#F8F9F9` | Texto sobre tinta · blanco del sistema |

### 1.3 Acentos semánticos

Todos tienen la misma luminosidad y croma (`oklch 0.68 0.11`). Solo cambia el tono.

| Token | Significado en la app de tareas |
|---|---|
| `--sage` | Completado (Done) · acción realizada con éxito |
| `--rose` | Error · destructivo (borrar) |
| `--lilac` | Info · nuevo · listo para empezar (To do) |
| `--amber` | **Aviso**: la fecha estimada de finalización ya ha pasado y la tarea no está hecha |
| `--signal` | Solo el punto de notificación de 7px y el contador |

Cada acento tiene su versión `*-soft` para fondos (insignias, tintes de fila y de alerta) y su `--pill-*` para píldoras de estado.

**Reglas de acento**
- Máximo **un** elemento de acento grande y sólido por vista.
- El acento nunca es fondo de página, de sección ni de columna del tablero.
- Los estados neutros usan tinta, no un quinto acento.
- El significado nunca depende solo del color. Siempre lo acompaña una etiqueta, un icono o un glifo. El modo «solo tinta» (todos los acentos → `--ink-600`) debe seguir siendo comprensible.

**Mapa de estados del dominio** *(propuesta; la confirma la spec 002)*

| Estado de la tarea | Tono | Icono |
|---|---|---|
| Backlog | Tinta neutra | `circle-dashed` |
| To do | lilac | `circle` |
| In progress | ink (`--pill-ink`) | `circle-dot` |
| Done | sage | `circle-check` |
| Retrasada (cualquier estado salvo Done, con fecha estimada de fin pasada) | amber, como insignia añadida al estado | `clock-alert` |

### 1.4 Tokens semánticos

| Token | Claro | Oscuro | Contraste mínimo sobre lienzo |
|---|---|---|---|
| `--bg-canvas` | ink‑100 | ink‑950 | — |
| `--surface-glass` | `rgba(244,246,246,.60)` | `rgba(17,33,45,.62)` | — |
| `--surface-raised` | `rgba(250,251,251,.80)` | `rgba(37,55,69,.70)` | — |
| `--surface-raised-hover` | `rgba(255,255,255,.96)` | `rgba(74,92,106,.62)` | — |
| `--surface-sunken` | `rgba(204,208,207,.42)` | `rgba(6,20,27,.50)` | — |
| `--surface-folder` | `#F1F3F3` | `#11212D` | — |
| `--surface-row` | `#E8EBEB` | `#1A2C39` | — |
| `--text-1` | ink‑950 | ink‑50 | 17:1 |
| `--text-2` | ink‑800 | ink‑200 | 9.8:1 |
| `--text-3` | ink‑700 | `#B0BBBE` | 7:1 |
| `--text-on-accent` | ink‑0 | ink‑0 | sobre `--grad-primary` / `--pill-ink` ≥ 8:1 |
| `--text-on-pill` | ink‑950 | ink‑950 | sobre `--pill-sage/rose/lilac/amber` ≥ 7:1 |

En los componentes usa siempre el token semántico, nunca el hex. Los hex de la paleta solo van en la definición de los tokens.

### 1.5 Tema oscuro
- Se activa con `data-theme="dark"` en `<html>`, no en un contenedor: los tokens compuestos (`--dot-grid`) se resuelven en la raíz.
- Mismos componentes y mismos tokens. Prohibido el color condicional por tema dentro de un componente.
- `--pill-*` (excepto `ink`) llevan texto fijo oscuro en ambos temas.
- La app respeta `prefers-color-scheme`. Si hay selector de tema o no, lo decide la spec que lo implemente.

### 1.6 Contraste (AAA en texto)
- **Texto normal ≥ 7:1. Texto grande (≥ 24px, o ≥ 19px en 500) ≥ 4.5:1.** Se comprueba en la superficie real (raised, row, folder, columna glass), no solo en el lienzo.
- Elementos no textuales (iconos de estado, anillos, bordes de foco) ≥ 3:1.
- Prohibido el texto blanco sobre sage, rose, lilac o amber. En esos casos se usa `--text-on-pill`.
- Los metadatos sobre `--pill-ink` van a opacidad ≥ 0.85.
- `--ink-400` y `--ink-500` nunca se usan para texto.
- Los placeholders usan `--text-3`. Nunca son la única etiqueta del campo.

---

## 2. Tipografía

### 2.1 Familias
- **Geist** 200–700 para toda la interfaz.
- **Geist Mono** 400–500 solo para códigos técnicos (el código de error de §13) y atajos de teclado.
- Respaldo: `'Helvetica Neue', Helvetica, Arial, sans-serif`.
- Fechas y recuentos van en **Geist con `font-variant-numeric: tabular-nums`**.
- Las fuentes se sirven desde el propio proyecto, no desde Google Fonts: la constitución no permite peticiones a terceros que rastreen al usuario (C-16).

### 2.2 Escala

| Token | Escritorio | Móvil | Peso | Interlineado | Tracking | Uso |
|---|---|---|---|---|---|---|
| `--text-display` | 56 | 40 | 300 | 1.05 | −0.035em | Título de vista («Tablero») |
| `--text-h1` | 40 | 32 | 300 | 1.05 | −0.03em | Título de pantalla de acceso («Iniciar sesión») |
| `--text-h2` | 30 | 26 | 300 | 1.1 | −0.025em | Título de diálogo, título de la tarea en su detalle |
| `--text-h3` | 20 | 18 | 300–400 | 1.15 | −0.02em | Título de columna, título de grupo de campos |
| `--text-body` | 15 | 16 | 400 | 1.5 | −0.01em | Controles, título de la tarjeta, cuerpo |
| `--text-sm` | 13 | 14 | 400 | 1.4 | 0 | Etiquetas, descripciones |
| `--text-xs` | 11–12 | 12 | 400 | 1.3 | 0 | Metadatos, fechas en la tarjeta (mínimo absoluto 11px) |

En móvil el cuerpo sube a 16px para evitar el zoom en iOS.

### 2.3 Reglas
- **Desde 20px, Light 300.** Nunca negrita en títulos.
- El peso 500 solo para énfasis puntual.
- Tipo oración siempre. Sin MAYÚSCULAS en etiquetas.
- `text-wrap: balance` en títulos y `text-wrap: pretty` en párrafos. Ancho de lectura de 60–72ch (descripción de la tarea).
- Patrón **«Etiqueta: valor»**: etiqueta en `--text-1`, valor en `--text-3` («Fin estimado: 14 nov 2026»).

---

## 3. Espacio, rejilla y layout

### 3.1 Escala (base 4)
`4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 64` → `--space-1 … --space-16`.

| Contexto | Valor |
|---|---|
| Entre píldoras hermanas (cabecera, barra de acciones) | 6–8 |
| Entre tarjetas dentro de una columna | 10 |
| Entre filas dentro de una carpeta | 6 |
| Padding de tarjeta grande y de columna | 24–28 (móvil 20) |
| Padding de tarjeta de tarea | 16–20 |
| **Gutter entre columnas del tablero** | **28** (tablet 20, móvil 16) |
| Margen de página | 28–40 (móvil 16) |

Siempre `flex`/`grid` + `gap`. Nunca separar hermanos con márgenes o espacios en blanco.

### 3.2 Layout de la app (escritorio, ≥ 1280px)
- Cabecera **sin barra**: píldoras flotantes sobre el lienzo, fija (`--z-sticky`) con lienzo al 80% y blur al hacer scroll. A la izquierda, el nombre de la app; a la derecha, el email del usuario y «Cerrar sesión».
- Tablero: **cuatro columnas** de igual ancho (`repeat(4, minmax(280px, 1fr))`), una por estado. Cada columna hace scroll vertical por su cuenta; la cabecera se queda fija.
- El detalle o la edición de una tarea se abre en un diálogo (§15, Overlays) sin cambiar de página.

### 3.3 Fondo
- Lienzo liso `--bg-canvas` con retícula de puntos `--dot-grid` (1px cada 22px).
- Sin imágenes ni degradados de fondo.

---

## 4. Responsive y breakpoints

| Token | Ancho | Dispositivo | Tablero |
|---|---|---|---|
| — | < 480 | Móvil | Una columna visible; se cambia de estado con un control segmentado o deslizando |
| `--bp-sm` | ≥ 480 | Móvil grande | Igual que móvil |
| `--bp-md` | ≥ 768 | Tablet | Dos columnas visibles con scroll horizontal |
| `--bp-lg` | ≥ 1024 | Portátil | Cuatro columnas con scroll horizontal si no caben |
| `--bp-xl` | ≥ 1280 | Escritorio | Cuatro columnas completas |
| `--bp-2xl` | ≥ 1600 | Monitor grande | Contenido máx. 1680px centrado |

Las media queries no aceptan `var()`: copia los valores literales. *Desktop‑first*.

**Reglas por tamaño**
- **Móvil:** la cabecera se reduce al nombre de la app y un botón de cuenta. Los diálogos pasan a *sheets* inferiores con radio 34 arriba. El botón primario («Crear tarea») va abajo, en la zona del pulgar, y puede ser de ancho completo.
- **Objetivos táctiles ≥ 44px**, con 8px mínimo entre ellos. Los controles `sm` (32px) no se usan por debajo de 1024px.
- Los textos no se truncan sin `title` o un tooltip. Nada de alturas fijas en cajas con texto: el título de una tarea puede ocupar varias líneas.

---

## 5. Forma

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | 8 | Casillas |
| `--radius-sm` | 14 | Detalles internos pequeños |
| `--radius-md` | 22–26 | Alertas, textarea (24), menús (26) |
| `--radius-lg` | 28–30 | Cuerpo de carpeta, tarjeta de tarea |
| `--radius-xl` | 34 | Columnas del tablero, tarjetas grandes, diálogos, *sheets* |
| `--radius-pill` | 999 | **Todos los controles** |

- No hay esquinas vivas en ningún elemento visible.
- Radio anidado = radio exterior − padding.
- **Firma: tarjeta carpeta.** Pestaña con radio de 26px arriba a la izquierda que fluye a un hombro curvo (72×52) hacia el cuerpo (radio `0 28 28 28`). Agrupa campos de una misma cosa (en el detalle de una tarea: «Datos» y «Fechas»). No es una tarjeta genérica.

---

## 6. Superficies, profundidad y efectos

### 6.1 Niveles
1. **Lienzo:** `--bg-canvas` con puntos.
2. **Glass:** `--surface-glass`, reposo. Columnas del tablero.
3. **Raised:** `--surface-raised`. Inputs, tarjetas de tarea y hover de glass.
4. **Seleccionado:** `--surface-raised-hover` + `--shadow-glass`.
5. **Flotante:** `--shadow-float`. Diálogos, menús, tarjeta mientras se arrastra.
6. **Acento:** `--pill-*` + `--shadow-accent`. Es lo único que debe llamar la atención.

`--surface-sunken` se usa para pistas, esqueletos, controles segmentados y la zona donde se soltará una tarjeta.

### 6.2 Sombras
`--shadow-pill` (reposo) · `--shadow-glass` (tarjeta, seleccionado, foco) · `--shadow-float` (flotantes) · `--shadow-accent` (píldoras de acento).
- Siempre con tinte `rgba(6,20,27,…)`, nunca negro.
- **Sin bordes sólidos.** La arista es `inset 0 1px 0 rgba(255,255,255,.85)`. Excepciones: anillos de estado de 1.5px (selección en el tono, error rose, casilla vacía ink‑400) y `0 0 0 1px var(--border-glass)` en flotantes.

### 6.3 Vidrio
- `backdrop-filter: blur(24px) saturate(140%)` en todo lo que flota sobre color o contenido. El velo de los diálogos usa `blur(8px)` + `rgba(6,20,27,.32)`.
- No pongas `filter` en un ancestro de un elemento con `backdrop-filter`: rompe el blur.
- Fallback: si no hay soporte, se sube la opacidad de la superficie al 92%.

### 6.4 Degradados permitidos
- `--grad-primary` (135°, #34495A → ink‑800 → ink‑900): botón primario, casillas activas y progreso.
- `--pill-ink | sage | rose | lilac | amber`: lineal de 100° con brillo radial arriba a la izquierda.
- Prohibido: degradados de fondo de página, arcoíris, morado‑azul genérico y texto con degradado.

---

## 7. Capas (z-index)

| Token | Valor | Para |
|---|---|---|
| `--z-base` | 0 | Contenido |
| `--z-raised` | 1 | Tarjeta elevada en hover |
| `--z-sticky` | 100 | Cabecera, cabecera de columna |
| `--z-drawer` | 900 | *Sheet* inferior |
| `--z-dropdown` | 1000 | Select |
| `--z-popover` | 1100 | Menú contextual, selector de fecha |
| `--z-overlay` | 1200 | Velo de diálogo |
| `--z-modal` | 1300 | Diálogo |
| `--z-toast` | 1400 | Notificaciones |
| `--z-tooltip` | 1500 | Tooltip (siempre arriba) |

Usa siempre el token. Si algo no encaja, el problema es de estructura, no de número. Solo puede haber un diálogo abierto a la vez. La tarjeta que se arrastra usa `--z-popover`.

---

## 8. Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--ease-out` | `cubic-bezier(.22,1,.36,1)` | Por defecto |
| `--ease-spring` | `cubic-bezier(.34,1.4,.64,1)` | Elementos que aparecen (tarjeta nueva, radio) |
| `--dur-fast` | 140ms | Press, color |
| `--dur` | 220ms | Interruptores, selección, tarjeta que cambia de columna |
| `--dur-slow` | 420ms | Diálogos, *sheets* |

- **Hover:** la superficie sube un nivel. Tarjetas de tarea: `translateY(-1px)`.
- **Press:** `scale(0.97)`, o `0.94` en botones de icono.
- **Foco:** anillo `0 0 0 3px rgba(74,92,106,.18)` + superficie al 96%. Además, `outline: 2px solid var(--ink-800)` con `outline-offset: 2px` en `:focus-visible`.
- **Arrastrar (spec 003):** la tarjeta se levanta con `--shadow-float` y `scale(1.02)`; la columna de destino muestra un hueco en `--surface-sunken` con la altura de la tarjeta.
- **Toast:** entra desde abajo a la derecha (en móvil, arriba), dura 4s y lleva «Deshacer» cuando aplica.
- Solo se animan `transform`, `opacity`, `background` y `box-shadow`. Nada dura más de 420ms.
- `prefers-reduced-motion`: se quitan los desplazamientos y se mantienen los cambios de color.

---

## 9. Iconografía

- **Lucide**, contorno, **trazo 1.4** (máximo 1.6), `currentColor`. La versión exacta y la dependencia se fijan en el plan de la spec que los introduzca (C-4).
- Tamaños: 16 (en botones y tarjetas), 18 (por defecto), 20–22 (alertas, diálogos), 26 (estado vacío).
- En un botón de icono, el icono mide el 40% del diámetro.
- **Iconos del dominio:** `kanban` (tablero), `list-todo` (tarea), `plus` (crear), `pencil` (editar), `trash-2` (borrar), `calendar-days` (fecha estimada), `calendar-check` (fecha real de fin), `clock-alert` (retrasada), los de estado del §1.3, `grip-vertical` (asa de arrastre), `log-out` (cerrar sesión), `user` (cuenta).
- **Notificación:** punto `--signal` de 7px con un halo de 2px del color de la superficie.
- Prohibido: emoji, iconos rellenos, mezclar sets. Unicode solo `✓`, `→` (rangos de fechas) y `·` (separador).
- **No hay logo.** Donde iría, se escribe el nombre de la app en Geist 400.

---

## 10. Imágenes

- No hay fotografía ni ilustración figurativa.
- Los estados vacíos usan un icono Lucide dentro de un círculo glass (§13).

---

## 11. Patrones de pantalla

### 11.1 Inicio de sesión y registro
- Lienzo punteado (sin fotografía) y una tarjeta glass centrada de 420px como máximo; en móvil, a ancho completo con margen de 16px.
- Título h1 Light («Iniciar sesión» / «Crear cuenta»), campos de email y contraseña, botón primario a ancho completo y, debajo, el enlace a la otra pantalla (RF-019 de la spec 001).
- Los avisos de formulario (credenciales incorrectas, sin conexión, sesión caducada) van como Alert dentro de la tarjeta, encima de los campos.

### 11.2 Zona privada
- Cabecera flotante de §3.2 en todas las pantallas con sesión.
- Debajo, el tablero (§11.3). Mientras no exista la spec 002, la zona privada muestra solo la cabecera.

### 11.3 Tablero kanban *(orientativo; lo concreta la spec 002)*
- Título display «Tablero» + recuento de tareas en `--text-3` + primario «Crear tarea».
- Cuatro columnas glass, una por estado: título h3 con el icono del estado y el recuento («In progress · 3»).
- **Tarjeta de tarea:** raised, radio 30, padding 16–20. Título en `--text-body` (varias líneas si hace falta), fechas estimadas en `--text-xs` tabular («14 nov → 28 nov»), insignia amber «Retrasada» cuando aplique. En Done, la fecha real de fin con `calendar-check`.
- Clic o Enter en la tarjeta abre su detalle en un diálogo.
- Columna vacía: hueco en `--surface-sunken` con una frase corta en `--text-3` («Nada en curso»), nunca una columna en blanco.

### 11.4 Detalle y edición de una tarea *(orientativo)*
- Diálogo de 460px como máximo (en móvil, *sheet* al 92%). Título h2 Light.
- Campos agrupados en dos carpetas: **Datos** (título, descripción) y **Fechas** (inicio estimado, fin estimado, fin real).
- El estado se cambia con un Select o un control segmentado con los cuatro estados (y, en la spec 003, también arrastrando).
- Acciones al pie: secundario «Cancelar», primario «Guardar cambios». «Borrar tarea» va aparte, en `destructive`, con confirmación.

---

## 12. Estados

| Estado | Patrón |
|---|---|
| **Vacío (primera vez)** | Círculo glass de 72px con icono 26 · título Light 24 · una frase cálida · una acción primaria. «Todavía no tienes tareas. Crea la primera y empieza a organizarte.» |
| **Vacío (sin resultados)** | Igual, sin primario, con un botón glass para volver al estado anterior. |
| **Carga inicial** | Esqueleto con la geometría final si tarda más de 300ms. Por debajo de 300ms no se muestra nada. Nunca un spinner a pantalla completa. |
| **Carga de acción** | Anillo de 16px dentro del botón + gerundio («Guardando…»). El botón se mantiene del mismo ancho. |
| **Error de campo** | Anillo rose + icono + mensaje bajo el campo (§13). |
| **Error de sección** | Alerta rose dentro de la tarjeta o columna con «Reintentar». El resto de la pantalla sigue funcionando. |
| **Error de página** | Estado vacío con icono `cloud-off`, mensaje humano y «Reintentar». El código técnico, en mono pequeño. |
| **Sin conexión** | Alerta amber con el mensaje que fije la spec (en la 001, «No se ha podido conectar. Inténtalo de nuevo»). No se encolan cambios. |
| **Éxito** | Toast sage, con «Deshacer» cuando sea reversible. No hay pantallas de éxito. |

---

## 13. Formularios y validación

- **Layout:** una columna, 560px como máximo. Etiqueta encima a 13px en `--text-2` con sangría de 20px, alineada con el texto interior. Campos relacionados en línea solo si son cortos (fecha de inicio / fecha de fin).
- Los campos se agrupan en tarjetas carpeta o glass con título h3.
- **Obligatoriedad:** se marcan los **opcionales** con «(opcional)» en `--text-3`. Nada de asteriscos.
- **Cuándo validar** es comportamiento y lo decide la spec. Por defecto: al salir del campo y, al corregir, mientras se escribe. Al enviar, el foco va al primer error. (La spec 001 valida al enviar, D-7.)
- **Mensaje de error:** qué pasa + cómo arreglarlo, en tú y sin culpar. «La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.» Nunca «Campo inválido».
- **Ayuda:** texto de 12px bajo el campo en `--text-3`. Ejemplos de formato en la ayuda, no en el placeholder.
- **Fechas:** se escriben y se muestran como «14/11/2026» en los campos y «14 nov 2026» en la tarjeta; se guardan como `YYYY-MM-DD` (C-9).
- **Acciones:** al final y a la derecha (primario a la derecha del secundario). En móvil, el primario va a ancho completo y fijo abajo.
- Si sales de un diálogo con cambios sin guardar, se pide confirmación.
- Un `<label>` real por cada campo. Error enlazado con `aria-describedby` y `aria-invalid="true"`. `autocomplete` correcto.

---

## 14. Componentes: especificaciones

Alturas de control: **32 (sm, solo escritorio) · 44 (md) · 52–56 (inputs, lg)**.

### Acciones
- **Button:** píldora con padding horizontal 14 / 20 / 26 y texto 13 / 15 / 16. Variantes: `primary` (`--grad-primary`, uno por vista), `glass`, `ghost`, `tint` (sobre acento) y `destructive` (`--pill-rose` + `--text-on-pill`, siempre confirmado). Deshabilitado a opacidad .45. Cargando: anillo + gerundio.
- **IconButton:** círculo de 32 / 44 / 52, en `glass`, `solid` (seleccionado), `ghost` o `tint`. Siempre con `aria-label`.

### Formularios
- **Input:** 52px, `--surface-raised`. Foco: superficie al 96% + anillo. Error: anillo rose de 1.5px + mensaje. Deshabilitado: hundido y opacidad .5.
- **Textarea:** radio 24 y padding 16/20 (descripción de la tarea).
- **Select:** input con «Etiqueta:» en `--text-3` y un chevron. Se despliega en un panel flotante de radio 26 con opciones de 44px y `check`.
- **Fecha:** píldora con `calendar-days`. El selector se abre en un popover con días en círculos de 40px, el seleccionado en ink‑800 y hoy con anillo.
- **Segmentado:** contenedor hundido con items de 38px (cambio de estado, columnas en móvil).
- **Checkbox:** 24px, radio 8.

### Tablero *(nuevos, para la spec 002)*
- **BoardColumn:** glass de radio 34, padding 20–24, cabecera h3 con icono y recuento, lista de tarjetas con gap 10.
- **TaskCard:** raised de radio 30, padding 16–20; título, fechas y estado según §11.3. Es un botón accesible (abre el detalle) con `grip-vertical` como asa en la spec 003.

### Datos
- **FolderCard** (§5) · **FieldRow:** píldora de ≥ 46px, o variante etiqueta/valor.
- **StatusPill:** `ink` lleva texto claro. `sage/rose/lilac/amber` llevan `--text-on-pill`. En la tarjeta de tarea, versión compacta de 28px (Badge).

### Personas
- **Avatar:** círculo de 32/40 con la inicial del email en ink‑950 Light, en la cabecera.

### Feedback
- **Alert:** raised de radio 26 con tinte del tono (sage, rose, amber, lilac) e icono `circle-check`, `circle-alert`, `triangle-alert` o `info`.
- **Badge:** 28px con fondo `*-soft` y punto de 7px.
- **Skeleton:** formas hundidas con la geometría de la tarjeta.
- **Toast:** `--pill-ink`, ≥ 320px, 4s, con «Deshacer». **Estado vacío:** ver §12.

### Overlays
- **Dialog:** velo + blur 8 y tarjeta de 460px como máximo, de radio 34. Título Light 28. Acciones a la derecha. Se cierra con Esc o clic fuera, salvo con cambios sin guardar. Atrapa el foco.
- **Sheet (móvil):** sube desde abajo con radio 34 arriba, asa de 36×4 y altura de 50% o 92%.
- **Menu / Popover:** radio 26, padding 6, items de 42px. El destructivo va al final, en rose.
- **Tooltip:** píldora de 34px en ink‑950 con texto ink‑50. Aparece con un retardo de 400ms y no lleva contenido interactivo.

---

## 15. Contenido y voz

**Voz: cálida y cercana.** Como una compañera ordenada que te ayuda a llevar tus cosas: amable, directa, sin tecnicismos.

- **Tratamiento:** **tú**, siempre. El sistema puede hablar en primera persona del plural para sus propias acciones («No hemos podido guardar la tarea»), nunca para atribuir errores al usuario.
- **Mayúsculas:** tipo oración («Crear tarea»).
- **Botones:** verbo en infinitivo de 1–3 palabras: Crear tarea, Guardar cambios, Borrar tarea, Iniciar sesión, Crear cuenta, Cerrar sesión. Nunca «OK», «Enviar» genérico ni «Haz clic aquí».
- **Títulos:** sustantivo concreto: Tablero, Tarea.
- **Metadatos:** recuento llano: «12 tareas», «3 en curso».
- **Errores:** qué pasó + qué hacer, sin culpa: «No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.»
- **Avisos:** concretos y con fecha: «Esta tarea tenía que terminar el 14 nov.»
- **Confirmaciones destructivas:** pregunta concreta + consecuencia: «¿Borrar «Preparar la demo»? No se puede deshacer.»
- **Vocabulario:** tarea (no «ítem» ni «ticket»), tablero, columna, estado, fecha estimada de inicio, fecha estimada de fin, fecha real de fin. Los nombres de los estados se escriben tal cual los define la spec: Backlog, To do, In progress, Done.
- **Sin emoji, sin exclamaciones dobles, sin «¡Ups!».** Como mucho una exclamación en mensajes positivos.

---

## 16. Formatos

- **Idioma:** español de España (`es-ES`).
- **Nunca concatenar cadenas.** Plantillas con variables y plurales: `{count, plural, one {# tarea} other {# tareas}}`.
- **Fechas con `Intl`:** «14 nov 2026» en la tarjeta y el detalle; «14/11/2026» en los campos; rangos con «→» («14 nov → 28 nov»).
- **Zona horaria:** las fechas de las tareas no tienen hora (C-9). «Hoy» y «retrasada» se calculan con la fecha local del navegador.
- **Layout:** propiedades lógicas (`margin-inline-start`, `padding-inline`).

---

## 17. Accesibilidad

- Contraste según el §1.6, comprobado en ambos temas y en cada superficie.
- HTML semántico: `<button>`, `<a>`, `<input>` y `landmarks` (`header`, `main`). Las columnas del tablero son regiones con nombre («In progress, 3 tareas»).
- ARIA: `aria-label` en botones de icono; `aria-pressed`/`aria-expanded`/`aria-selected` en conmutadores y desplegables; `role="dialog" aria-modal` y trampa de foco en diálogos; `aria-live="polite"` en toasts y `assertive` en errores bloqueantes.
- Foco siempre visible (§8). El orden de tabulación sigue el orden visual.
- Teclado completo: **mover una tarea entre columnas siempre tiene una alternativa sin arrastre** (C-20).
- El significado nunca depende solo del color (§1.3).
- Objetivos ≥ 44px en táctil. El texto puede ampliarse al 200% sin perder contenido.
- `prefers-reduced-motion` y `prefers-contrast: more` (en este último, subir las superficies al 100% y añadir un borde de 1px ink‑600).

---

## 18. Tokens en este proyecto

- **Fuente de verdad:** `apps/web/src/styles/tokens.css` (variables CSS de claro y oscuro). `global.css` los expone a Tailwind 4 con `@theme`, para usarlos como clases (`bg-canvas`, `text-1`…).
- Prohibido el hex suelto en componentes y las clases de color genéricas de Tailwind (`gray-900`, `red-700`): solo tokens.
- **Nombres:** `--{categoría}-{rol}-{variante}` en kebab‑case (`--surface-raised-hover`). Los primitivos (`--ink-800`) solo los consumen los semánticos.
- Los tokens se crean en la spec 004 (Aplicar el sistema de diseño).

---

## 19. Cambios en este documento

- Este documento cambia **dentro de una spec**, como el resto de fuentes de verdad: se edita en la misma rama y se cita en el plan.
- Versionado semántico sobre la versión base: **MAJOR** si se elimina o renombra un token o componente; **MINOR** si se añade; **PATCH** para ajustes de valor.
- Cada cambio se anota en el «Historial» del final.
- **Excepciones:** una pantalla puede salirse del sistema solo con una justificación escrita en el plan de su spec. Si se repite 3 veces, pasa a ser candidata a componente.

---

## 20. Hacer / No hacer

**Hacer**
- Columnas de vidrio y tarjetas en píldora sobre el lienzo punteado.
- Datos de una tarea agrupados en carpetas.
- Un único acento fuerte por vista.
- Títulos grandes y ligeros.
- Separar con espacio y opacidad.
- Hablar de tú, con calidez y concreción.

**No hacer**
- Bordes sólidos grises, divisores o tablas con rejilla.
- Esquinas vivas o radios < 8px.
- Negrita en títulos, MAYÚSCULAS en etiquetas o tracking positivo.
- Texto blanco sobre acentos.
- Acentos decorativos o columnas de color.
- Sombras negras o duras. Degradados agresivos.
- Tarjetas con borde izquierdo de color, emoji o iconos rellenos.
- Hex sueltos en componentes o z-index numéricos.
- Más de un primario por vista.
- Concatenar cadenas o formatear fechas a mano.

---

## 21. Checklist de revisión

- [ ] Solo tokens: ningún hex, clase de color genérica de Tailwind ni z-index suelto.
- [ ] Funciona en `data-theme="dark"` sin tocar el componente.
- [ ] **Texto ≥ 7:1** en su superficie real (≥ 4.5:1 si es grande).
- [ ] Un solo primario y un solo acento fuerte por vista. Los estados con etiqueta e icono además de color.
- [ ] Títulos de 20px o más en Light 300 con tracking negativo.
- [ ] Alturas de control y radios según §14 y §5. Objetivos ≥ 44px en táctil.
- [ ] Sin bordes sólidos. Profundidad con las sombras del §6.2.
- [ ] Responsive revisado en 375, 768, 1024, 1280 y 1600.
- [ ] Estados vacío, carga, error y sin conexión diseñados.
- [ ] Formularios: opcionales marcados y errores útiles.
- [ ] Textos en tú, tipo oración, con formatos `es-ES` vía `Intl` y plurales.
- [ ] Iconos Lucide de trazo 1.4, con `aria-label` en los botones de icono.
- [ ] Teclado, foco y movimiento reducido verificados.

---

## Pendiente de decidir

1. **Valores de tokens que faltan.** Este documento no incluye los valores de `--sage`, `--rose`, `--lilac`, `--amber`, `--signal`, sus `*-soft` y `--pill-*`, las sombras `--shadow-*`, `--border-glass` ni `--dot-grid`: estaban en los ficheros `tokens/*.css` del sistema original. Lo mejor es copiarlos de ahí. Si no, la spec 004 los define respetando §1.3 (misma luminosidad y croma `oklch 0.68 0.11`) y el contraste del §1.6, y se añaden a este documento.
2. **Tema oscuro:** si la spec 004 lo implementa ya o se deja preparado para después.
3. **Mapa de colores de los estados** (§1.3): lo confirma la spec 002.
4. **Textos de la spec 001:** algunos mensajes («Este campo es obligatorio») son más secos que la voz del §15. Si se quieren reescribir, es un cambio de la spec 001.

---

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.1.0-todo.1 | 2026-10-29 | Adaptación de Tinta & Niebla v1.1.0 (CRM VTC) a la app de tareas: fuera pantallas del CRM, mapas, fotografía, datos, email y marketing; acentos, iconos, patrones y voz adaptados al tablero kanban; tokens en `apps/web` y fuentes servidas desde el proyecto |
