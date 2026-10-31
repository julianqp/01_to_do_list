---
spec: 003
creado: 2026-10-31
---

# Investigación técnica · Spec 003 · Arrastrar y soltar

> Incógnitas técnicas del plan y lo que se ha comprobado. «§n» remite a `DESIGN.md`.

## R-1 · ¿Con qué se arrastra con ratón y con el dedo?

La spec pide: tarjeta levantada que sigue al puntero o al dedo y hueco de destino (RF-002), clic sin desplazar = abrir el detalle (RF-006), mantener el dedo antes de arrastrar y deslizar = scroll (RF-018), Esc y soltar fuera cancelan (RF-005), scroll automático vertical y horizontal (E-4, E-5) y cancelar al cambiar el tamaño de la ventana (E-17).

| Opción | A favor | En contra |
|---|---|---|
| HTML5 Drag and Drop nativo | Sin dependencias | Sin eventos táctiles en la emulación de Playwright ni en la mayoría de móviles; la imagen que sigue al puntero es una captura que no admite `--shadow-float` ni escala; sin «mantener el dedo»; el scroll automático depende del navegador |
| Eventos de puntero propios | Sin dependencias; control total | Hay que escribir umbral de clic, retardo táctil, bloqueo del scroll durante el arrastre, capa que sigue al puntero, detección del destino, scroll automático en dos ejes y cancelación con Esc y al redimensionar. Unas 300–400 líneas con muchos casos límite, y es justo la parte con más riesgo de la spec |
| **`@dnd-kit/core` 6.3.1** | Sensores de ratón y táctil con umbral (`distance`) y retardo (`delay` + `tolerance`); `DragOverlay`; scroll automático; detección de colisiones configurable. Sin dependencias fuera de su familia (`@dnd-kit/utilities`, `@dnd-kit/accessibility`, `tslib`). `peerDependencies: react >=16.8` | Sin versiones nuevas desde el 2024-12-05 (estable; el autor trabaja en `@dnd-kit/react`). Su sensor de teclado no encaja con RF-014 (ver R-2) |
| `@dnd-kit/react` 0.5.3 | Sucesor de la anterior | Antes de 1.0; la versión se publicó hoy (2026-10-31): API inestable |
| `@hello-pangea/dnd` 18.0.1 | Teclado y anuncios incluidos | Arrastra `redux`, `react-redux`, `raf-schd` y `css-box-model`. Su teclado lleva a la posición más cercana de la columna vecina (RF-014 pide la primera) y mide las columnas al empezar, así que no puede llevar la tarjeta a una columna oculta en móvil (RF-023) |
| `@atlaskit/pragmatic-drag-and-drop` | Pequeña | Se apoya en el DnD nativo (mismos problemas táctiles) y no trae teclado |

Comprobado en el código de `@dnd-kit/core` 6.3.1 (`dist/core.esm.js`):

- Los sensores de puntero cancelan con `Escape` (`handleKeydown`) y con el evento `resize` de la ventana (`windowListeners.add(EventName.Resize, this.handleCancel)`): CA-1.7 y E-17 sin código propio.
- Al activarse el arrastre, añade en captura un `click` con `stopPropagation` en el documento: al soltar no se dispara el `onClick` de la tarjeta (el arrastre no abre el detalle). Sin activar (movimiento < `distance`), el clic llega normal (CA-1.8).
- `TouchSensor` registra `touchmove` como no pasivo y llama a `preventDefault` solo después de activarse: antes del retardo, deslizar hace scroll y supera la `tolerance`, y el arrastre se cancela (CA-4.2).
- El scroll automático usa los ancestros con scroll del elemento sobre el que está el puntero (`useScrollableAncestors(overNode ?? activeNode)`): la lista de la columna de destino (E-4) y el tablero con scroll horizontal (E-5).
- Tamaño: el ESM sin minificar de `core` pesa 104 KB (22,3 KB con gzip); `utilities`, 2,4 KB y `accessibility`, 0,6 KB con gzip. Vite lo minifica al compilar.
- `@dnd-kit/sortable` no hace falta: aporta transformaciones con `style=` en línea (prohibido por ADR-0003) y un sensor de teclado que no se usa. El orden se pinta reordenando la lista (plan D-9).

**Conclusión:** `@dnd-kit/core` para ratón y dedo; el teclado, propio (R-2).

## R-2 · ¿Por qué el teclado no usa el `KeyboardSensor` de dnd-kit?

- El `KeyboardSensor` mueve la capa por coordenadas y busca el destino más cercano en esa dirección. RF-014 pide reglas exactas: arriba y abajo, una posición; izquierda y derecha, la **primera** posición de la columna vecina; en los bordes, nada (RF-015).
- Por debajo de 768 px las otras columnas tienen `display: none` y no tienen coordenadas: el sensor no puede llevar la tarjeta allí (RF-023).
- Los anuncios de dnd-kit van ligados a sus eventos y por defecto están en inglés (E-20).
- Una máquina de estados propia es una función pura (posición actual + tecla → posición nueva) que se prueba en jsdom sin medir el DOM.

## R-3 · ¿Cómo se guarda el orden?

| Opción | A favor | En contra |
|---|---|---|
| **Entero `position` por usuario y estado, con huecos; colocar = desplazar +1 desde el ancla** | Tres sentencias por movimiento (buscar el ancla, `updateMany` con `increment`, actualizar la tarea); legible en la BD; sin dependencias | Escribe hasta N filas por movimiento (≤ 500, una sola sentencia); necesita serializar las escrituras del mismo usuario para que no haya posiciones repetidas |
| Renumerar la columna entera (0…n−1) en cada movimiento | Siempre denso | Una sentencia por fila o SQL a mano con `unnest` |
| Índice fraccionario (cadenas o decimales) | Una sola fila por movimiento | Hace falta una librería o escribir el algoritmo; con decimales se agota la precisión y hay que rebalancear |

- **Serializar:** `SELECT 1 FROM "User" WHERE id = $1 FOR UPDATE` al empezar cada transacción que coloca una tarea. Dos pestañas del mismo usuario esperan una a la otra; usuarios distintos, no. Con eso las posiciones no se repiten dentro de una columna y la segunda escritura gana (E-11).
- **Sin restricción `UNIQUE`:** Postgres comprueba la unicidad fila a fila durante el `UPDATE … position + 1`, y fallaría a mitad de desplazamiento salvo con `DEFERRABLE`, que Prisma no declara.
- **Tareas existentes (E-19):** la migración rellena `position` con `ROW_NUMBER() OVER (PARTITION BY "userId", status ORDER BY "createdAt" DESC, id DESC) - 1`, que es el orden actual de 002/RF-002.

## R-4 · Foco en el asa cuando la tarjeta se mueve

- Al pasar a otra columna, React desmonta el `<li>` de una lista y lo monta en otra: es otro elemento y el foco se pierde.
- Dentro de la misma columna, React reordena con `insertBefore`, y mover un nodo con el foco también lo pierde (el foco vuelve a `body`).
- Que el navegador lance `blur` al quitar del DOM el elemento con foco no es igual en todos los motores.

Por eso:

1. Un efecto de layout vuelve a enfocar el asa de la tarjeta cogida después de cada paso (RF-016, CA-3.5, CA-3.6).
2. RF-017 («si el foco sale del asa, se cancela») se comprueba **en diferido**: el `blur` programa una comprobación (`setTimeout(0)`) y solo cancela si, para entonces, el foco no está en el asa de esa tarjeta. Las teclas de React se procesan de forma síncrona y el efecto de layout corre antes de ese `setTimeout`.

Es la parte con más riesgo del teclado: se verifica primero en E2E, en Chromium y en WebKit (plan D-15).

## R-5 · Contraste del hueco de destino

RNF-001 pide AA para el hueco de destino, y un objeto gráfico necesita 3:1 contra lo que tiene al lado (§1.6). Medido con los valores de `tokens.css` (composición sobre el lienzo liso, sin retícula):

| Tema | Columna | Hueco (`--surface-sunken`) contra la columna | `--ink-400` contra la columna | `--ink-500` contra la columna |
|---|---|---|---|---|
| Claro | glass 60 % | 1.13:1 | 3.35:1 | ≈ 4.3:1 |
| Claro | glass 92 % (< 768 px) | 1.16:1 | 3.51:1 | — |
| Oscuro | glass 62 % | 1.04:1 | 4.52:1 | — |
| Oscuro | glass 92 % (< 768 px) | 1.07:1 | 4.32:1 | — |

- El hueco solo, como dice §8, no llega a 3:1.
- Hace falta un anillo de 1.5 px, el ancho de los anillos de estado de §6.2. Se usa `--ink-500` en claro, con más margen que `--ink-400` (3.35, demasiado justo para la variante con retícula), y `--ink-400` en oscuro.
- `tokens.test.ts` medirá el valor definitivo en N, SB y C+ (plan §7).

## R-6 · Emulación táctil en los E2E

- La pantalla táctil de Playwright (`page.touchscreen`) solo hace `tap`: no sirve para mantener y arrastrar.
- En `chromium` y `chrome`, la sesión CDP (`Input.dispatchTouchEvent`) genera eventos táctiles de confianza, que además hacen scroll: valen para CA-4.1, CA-4.2, CA-4.3 y CA-4.5.
- En `webkit` no hay CDP. Se crean `TouchEvent` sintéticos con `new Touch(...)` en `page.evaluate`, en un contexto con `hasTouch: true`. Los oyentes de dnd-kit sí los reciben, pero un evento sintético no hace scroll: CA-4.2 (deslizar hace scroll) solo se comprueba en los proyectos Chromium.
- **A verificar en la primera tarea táctil** (plan D-15). Si WebKit no acepta `new Touch`, esa parte de RNF-004 se queda sin prueba en WebKit y se avisa antes como cambio del plan.

## R-7 · Actualización optimista con varios movimientos a la vez

RF-020 pide pintar el movimiento antes de que responda el servidor, y E-12 permite mover otra tarjeta mientras se guarda la anterior. Se sigue el patrón de TanStack Query v5 para actualizaciones optimistas concurrentes:

- `onMutate`: `cancelQueries(['tasks'])` y `setQueryData` con el movimiento.
- `onError`: deshacer **solo esa tarjeta** sobre la caché actual. Restaurar una copia de la lista de antes desharía también los demás movimientos (E-12).
- `onSettled`: invalidar `['tasks']` solo si es la última mutación de mover en curso (`queryClient.isMutating({ mutationKey: ['moveTask'] }) === 1`). Si no, la lista vuelta a pedir pisaría los movimientos que aún no han respondido.
