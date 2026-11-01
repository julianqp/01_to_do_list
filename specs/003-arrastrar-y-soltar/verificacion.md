# Verificación · Spec 003 · 2026-11-01 (segunda)
Resultado: **APTO CON OBSERVACIONES**

## Resumen

- **Motivo:** no hay bloqueantes y el bloqueante anterior (B-1) está resuelto. Quedan dos problemas importantes, porque en ambos se guarda un movimiento que la spec dice que no debe guardarse o que cae en otro sitio:
  - **I-1:** soltar en el margen del tablero, de 768 a 1279 px, guarda el movimiento en vez de cancelarlo (RF-005). Se ve en `chromium` y en `webkit`.
  - **I-2:** en `webkit`, al salir de la columna y volver, la tarjeta puede caer una posición más abajo y guardarse (RF-011, CA-2.5). Es el fallo de T-035, que sigue sin corregir: 3 de 100 en el test de la suite.
- **Decisión pendiente:** T-036 dejó I-2 y el cuelgue M-2 «pendientes de la decisión del usuario antes de T-037». No hay ninguna decisión anotada, así que aquí siguen abiertos.
- **Independencia:** auditoría hecha en una sesión nueva, sin haber escrito el código. Se repitieron todas las comprobaciones y se leyó el código de producción de `main...HEAD` (`17af22e`). Los fallos que el Registro daba por conocidos se volvieron a medir.
- **Alcance revisado:** `spec.md` v3.0, `plan.md` (hasta D-30), `tasks.md` (38/39 antes de este informe), constitución v1.1 y `DESIGN.md` 1.4.0-todo.1. Sustituye al informe de T-025 (NO APTO), que sigue en el historial de git (`860d1de`).

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ✅ 40 ficheros, 897 tests en verde |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores y 5 sugerencias (`hints`) de Astro |
| `pnpm test:e2e` (4 ficheros × `chromium`, `chrome`, `webkit`) | ✅ Termina con código 0: 305 pasan, 21 saltados (los previstos) y 1 *flaky* en `webkit`, `design-system.spec.ts` CA-4.3 de la spec 004, que pasó al reintentar. `webkit` lleva `retries: 1` ([playwright.config.ts](../../playwright.config.ts)), que puede ocultar I-2 |
| Trazabilidad | ✅ 88/88 IDs con al menos un test cuyo título empieza por `003 ` (89 contando E-19, que es manual) |
| Suite de la API, 25 veces seguidas | ✅ 25 de 25, 123 tests cada vez. Ver M-2 |
| `003 CA-2.5` en `webkit`, 100 veces, sin reintentos | ❌ 97 pasan y 3 fallan (I-2) |
| RNF-002, 3 veces | ✅ 38,5 / 40,7 / 39 ms |
| E-19 | ✅ La migración no ha cambiado desde que se comprobó en T-002 y en la verificación anterior (`git log`). No se repitió |
| Restos | ✅ Sin `console.log`, `TODO`, `FIXME` ni `any` en los ficheros de producción de la spec ni en sus E2E. `.env` no está en el repositorio |

**Sondas temporales.** Para lo que la suite no cubre se ejecutaron dos ficheros E2E en `chromium` y `webkit` y uno de la API. Ya están borrados y no forman parte de la suite. En este informe, «sonda» significa que la evidencia sale de ahí y que **ningún test del repositorio la protege**. Una primera medida de contraste se descartó porque incluía las esquinas redondeadas de la capa, y se repitió solo sobre la caja del texto.

**Comprobado por sonda, sin problemas:**

- Soltar sobre la cabecera a 375 px con `main` desplazado no guarda (RF-019).
- El margen izquierdo a 1024 px, con el tablero desplazado, no guarda.
- Reordenar hacia abajo cae donde indica el destino y se mantiene al volver a cargar (RF-007).
- La capa mide igual que la tarjeta en reposo, también con 200 caracteres (E-6).
- `index` de hasta 2^53 − 1 → 200, al final de la columna (D-3).
- Entre 4 y 40 creaciones a la vez, sin posiciones repetidas y sin errores (D-2).
- El test de E-16 también pasa lanzado con `TZ=UTC` y `TZ=America/New_York`, así que no depende de la zona de la máquina.

**Límites de esta auditoría:**

- Los anuncios se comprueban por el texto de la región viva, no por lo que dice un lector de pantalla (D-22, riesgo aceptado). El riesgo de D-24, que un lector envíe su activación como un clic de puntero, tampoco se puede descartar.
- El arrastre con el dedo se comprueba con emulación táctil, como pide RNF-004. En `webkit` usa eventos sintéticos (D-17), que no hacen scroll: CA-4.2 no corre ahí (R-6).
- La checklist §21 no se repitió entera. Se revisaron 6 capturas: en `chromium`, 375 y 768 en claro y 1280 en oscuro con la tarjeta cogida, y 1280 en oscuro con arrastre; en `webkit`, 1280 en oscuro con arrastre, dos veces. Sin «aumentar contraste». El resto se apoya en la nota de T-023, anterior a D-27.
- Sin Safari real: ver M-3.

### Problemas de la verificación anterior

| Problema | Estado | Comprobación |
|---|---|---|
| B-1 (la tarjeta sale de la vista) | ✅ Resuelto | E2E de CA-3.11 a 1280 × 900, 1280 × 720 y 375, en `chromium` y `webkit` |
| I-1 (clic en el asa) | ✅ Resuelto | Spec v2.0, D-24, CA-1.11 y CA-4.6 |
| M-1 (soltar fuera en el mismo fotograma) | ✅ Resuelto | E-21, 6 veces por test. Sigue abierto en el margen del tablero: I-1 de este informe |
| M-2 (foco perdido) | ✅ Resuelto | CA-3.12 y CA-3.13, también con toda la API caída |
| M-3 (estados del asa) | ✅ Resuelto | D-27 |
| M-4 (desviaciones sin anotar) | ✅ Resuelto | D-7, D-10 y §4.3 las recogen. Queda D-9: ver I-2 |
| M-5 (copia de datos en estado) | ✅ Resuelto | `drag` y `landing` guardan id y posiciones ([task-move.ts:46-54](../../apps/web/src/lib/task-move.ts#L46-L54)) |
| M-6 (commits) | ⚠️ En parte | Hash por tarea desde T-026; T-029 a T-031 comparten `9b6eb86`, anotado en el Registro |
| M-7 (cobertura) | ✅ Resuelto | T-034 |
| M-8 (limpieza) | ✅ Resuelto | `task-messages.ts` no importa `components/`; una sola idea de animar en el roadmap |

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. Todos los tests citados pasan en esta ejecución, salvo donde se indica. Abreviaturas de la columna «Test»: `e2e` = `e2e/drag-and-drop.spec.ts`; `move` = `apps/api/test/tasks.move.test.ts`; `list`, `create`, `update` = `apps/api/test/tasks.*.test.ts`; `service` = `tasks.service.test.ts`; `Board`, `TaskCard`, `BoardColumn`, `PrivateArea` = `apps/web/src/components/*.test.tsx`; `order` = `lib/board-order.test.ts`; `queries` = `lib/task-queries.test.tsx`; `messages` = `lib/task-messages.test.ts`; `tokens` = `styles/tokens.test.ts`; `shared` = `packages/shared/src/tasks.test.ts`.

### Requisitos funcionales

| ID | Código | Test | Veredicto |
|---|---|---|---|
| RF-001 | `task-move.ts` `commit`; `tasks.service.moveTask`; `task.repository.moveTaskOfUser` | `move`, `Board`, `order`, `e2e` | ✅ |
| RF-002 | `Board.tsx` `DragOverlay`; `TaskCard.tsx` variantes | `TaskCard`, `BoardColumn`, `e2e` | ✅ |
| RF-003 | `shared` `actualEndDateAfterMove`; `today = todayLocal()` | `shared`, `move`, `service`, `Board`, `queries`, `e2e` | ✅ |
| RF-004 | Ídem | `shared`, `move`, `service`, `Board`, `queries`, `e2e` | ✅ |
| RF-005 | `onDragOver`, `onDragCancel`, `inVisibleColumn` | `e2e` (CA-1.7, E-21, CA-4.5) | ⚠️ No se cumple en el margen del tablero, de 768 a 1279 px (I-1) |
| RF-006 | `TaskCard.tsx` botón de abrir y `event.detail` en el asa; `MouseSensor` `distance: 5` | `TaskCard`, `e2e` | ✅ |
| RF-007 | `makeRoom`; `stepPlacement`; `placementFromOver` | `move`, `service`, `Board`, `order`, `e2e` | ⚠️ En `webkit`, la vista previa puede quedar una posición más abajo (I-2) |
| RF-008 | `columnOrder` en `findTasksByUser` | `list`, `e2e` | ✅ |
| RF-009 | `createTask` con `makeRoom(backlog, 0)` | `create` | ✅ |
| RF-010 | `updateTask` con `toTop` | `list`, `update` | ✅ |
| RF-011 | `commit` con `samePlacement` | `Board`, `order`, `e2e` | ⚠️ `samePlacement` funciona, pero I-2 hace que el sitio no sea el mismo |
| RF-012 | `TaskCard.tsx` asa | `TaskCard`, `e2e` | ✅ |
| RF-013 | `clickHandle`; `pickedText` | `Board`, `TaskCard`, `messages`, `e2e` | ✅ |
| RF-014 | `keyDownOnHandle`; `stepPlacement`; `movedText` | `Board`, `order`, `messages`, `e2e` | ✅ |
| RF-015 | `stepPlacement` devuelve `undefined` | `Board`, `order` | ✅ |
| RF-016 | `clickHandle`; `focusedHandle`; `droppedText` | `Board`, `messages`, `e2e` | ✅ |
| RF-017 | `cancel`; `leaveHandle` en diferido | `Board`, `messages`, `e2e` | ✅ |
| RF-018 | `TouchSensor` `{ delay: 250, tolerance: 5 }` | `e2e` (CA-4.2 sin `webkit`, R-6) | ✅ |
| RF-019 | Columnas ocultas sin medidas (D-13); `inVisibleColumn` | `e2e`, con ratón y con el dedo | ✅ |
| RF-020 | `useMoveTask.onMutate`; `landing` | `queries`, `e2e` | ✅ |
| RF-021 | `onError`; `onSettled` sin esperar (D-29); `moveErrorText` | `Board`, `queries`, `messages`, `e2e` con la API caída | ✅ |
| RF-022 | `onError` con `isTaskNotFound`; `onTaskGone` (D-26) | `move`, `Board`, `queries`, `messages`, `e2e` con borrado real | ✅ |
| RF-023 | `onMobileColumn` (D-13, D-26) | `Board`, `e2e` | ⚠️ Solo vuelve a la columna si el foco sigue en el asa; la spec no lo condiciona (M-4) |
| RF-024 | `scrollIntoView` (D-23); `max-md:scroll-pb-24` | `e2e` | ✅ |
| RF-025 | `PrivateArea` por `tasks.data` (D-30) | `PrivateArea`, `e2e` | ✅ |

### Criterios de aceptación

| ID | Test | Veredicto |
|---|---|---|
| CA-1.1 | `e2e` | ✅ |
| CA-1.2 | `e2e` | ✅ |
| CA-1.3 | `e2e` | ✅ |
| CA-1.4 | `Board`, `queries`, `e2e` con ratón | ✅ |
| CA-1.5 | `move`, `Board`, `e2e` con ratón. Con la fecha de hoy en vez del 27/10, sin cambiar lo que se comprueba | ✅ |
| CA-1.6 | `e2e` | ✅ |
| CA-1.7 | `e2e`, soltando sobre el título | ⚠️ I-1 |
| CA-1.8 | `TaskCard`, `e2e` | ✅ |
| CA-1.9 | `Board`, `e2e` | ✅ |
| CA-1.10 | `Board`, `e2e` con borrado real | ✅ |
| CA-1.11 | `TaskCard`, `e2e` | ✅ |
| CA-1.12 | `e2e` con `**/api/**` abortado, en `chromium` y `webkit` | ✅ |
| CA-2.1 | `move`, `e2e` | ✅ |
| CA-2.2 | `list`, `e2e` (otro contexto de navegador) | ✅ |
| CA-2.3 | `create` | ✅ |
| CA-2.4 | `update` | ✅ |
| CA-2.5 | `Board`, `e2e` | ⚠️ **Falla 3 de 100 en `webkit`** (I-2); pasa la suite porque reintenta |
| CA-2.6 | `Board`, `e2e` con ratón | ✅ |
| CA-3.1 | `TaskCard`, `e2e` (foco visible real) | ✅ |
| CA-3.2 | `Board`, `TaskCard`, `messages`, `e2e` | ✅ |
| CA-3.3 | `Board`, `order`, `messages` | ✅ |
| CA-3.4 | `Board`, `order`, `messages`, `e2e` | ✅ |
| CA-3.5 | `Board`, `messages`, `e2e` | ✅ |
| CA-3.6 | `Board`, `messages`, `e2e` | ✅ |
| CA-3.7 | `Board`, `order` | ✅ |
| CA-3.8 | `TaskCard` | ✅ |
| CA-3.9 | `Board`, `e2e` | ✅ |
| CA-3.10 | `Board`, `e2e` | ✅ |
| CA-3.11 | `e2e` a 1280 × 900, 1280 × 720 y 375 | ✅ |
| CA-3.12 | `Board`, `e2e` con borrado real | ✅ |
| CA-3.13 | `Board`, `e2e` con `…/move` y con toda la API abortados | ✅ |
| CA-4.1 | `e2e`, en los tres proyectos | ✅ |
| CA-4.2 | `e2e`, en `chromium` y `chrome` (R-6) | ✅ En `webkit`, sin prueba |
| CA-4.3 | `e2e`, en los tres proyectos | ✅ |
| CA-4.4 | `e2e`, en los tres proyectos | ✅ |
| CA-4.5 | `e2e`, en los tres proyectos | ✅ |
| CA-4.6 | `e2e`, en los tres proyectos | ✅ |

### Requisitos no funcionales

| ID | Evidencia | Veredicto |
|---|---|---|
| RNF-001 | Cumple: axe sin infracciones con la tarjeta cogida y en pleno arrastre, en los dos temas; `tokens` ≥ 3:1; asa de 44 y 32 px; movimiento reducido. Contraste del texto de la capa ≥ 7:1 en `chromium` (sonda, M-3). **Parcial:** anillo de foco cortado de 768 a 1023 px (M-1). **❓** Contraste de la capa en Safari (M-3) | ⚠️ |
| RNF-002 | `e2e` en `chromium`: 38,5 / 40,7 / 39 ms, frente a ≤ 100 ms | ✅ |
| RNF-003 | `move`, `update`, `service`: tarea ajena → 404, y el orden de su dueño no cambia | ✅ |
| RNF-004 | Tres proyectos, con emulación táctil (D-17). `chrome` se salta los tests que el plan limita a `chromium` y `webkit`, y CA-4.2 no corre en `webkit` (R-6). I-2 solo se ha visto en `webkit` | ⚠️ I-2 |
| RNF-005 | `tokens`, `design-rules.test`, `TaskCard` (D-27). La sombra de la tarjeta cogida se recorta contra la lista (M-1) | ✅ |

### Casos límite

| ID | Test | Veredicto |
|---|---|---|
| E-1 | `order`, `e2e` | ✅ |
| E-2 | `Board` | ✅ |
| E-3 | `Board`, `order` | ✅ |
| E-4 | `e2e` (`chromium`), hacia abajo | ✅ |
| E-5 | `e2e` (`chromium`, 1024 px), hacia la derecha | ✅ El scroll funciona; soltar ahí es I-1 |
| E-6 | `TaskCard`, `e2e`. Sonda: la capa mide igual | ✅ |
| E-7 | `Board`, `e2e` | ✅ |
| E-8 | `Board` (`location.replace`) | ✅ |
| E-9 | `move`, `Board` | ✅ |
| E-10 | `move`, `service` | ✅ |
| E-11 | `move` (en serie y a la vez) | ✅ |
| E-12 | `Board`, `queries` | ✅ |
| E-13 | `Board` | ✅ |
| E-14 | `Board` | ✅ |
| E-15 | `shared`, `move`, `service` | ✅ |
| E-16 | `shared`, `Board`. Sonda: con otras zonas horarias | ✅ |
| E-17 | `e2e` | ✅ |
| E-18 | `e2e` | ✅ |
| E-19 | Manual: nota de T-002 y verificación anterior; migración sin cambios | ✅ |
| E-20 | `messages` | ✅ |
| E-21 | `e2e`, con ratón. Con el dedo no hay test | ✅ Salvo el margen de I-1 |
| E-22 | `PrivateArea`, `e2e` | ✅ |

## Problemas

### Bloqueantes

Ninguno.

### Importantes

**I-1 · Soltar en el margen del tablero guarda el movimiento en vez de cancelarlo.** Afecta a RF-005 y CA-1.7, de 768 a 1279 px, en `chromium` y `webkit`.

- **Dónde:** [task-move.ts:84-90](../../apps/web/src/lib/task-move.ts#L84-L90) (`collisionDetection`) y [task-move.ts:97-101](../../apps/web/src/lib/task-move.ts#L97-L101) (`inVisibleColumn`).
- **Qué pasa:** en esos anchos, las columnas no caben y el tablero hace scroll horizontal ([Board.tsx:193](../../apps/web/src/components/Board.tsx#L193)). Una columna recortada sigue midiendo su rectángulo entero, también por fuera del tablero. `pointerWithin` y `inVisibleColumn` miran ese rectángulo, así que el margen derecho de la página cuenta como columna, aunque debajo del puntero esté `main`.
- **Medido (sonda):** puntero a 8 px del borde derecho de la ventana, con `elementFromPoint` = `MAIN` en todos los casos, según la espera antes de soltar.

| Ancho | `chromium`: 0 / 100 / 300 / 1000 ms | `webkit`: 0 / 100 / 300 / 1000 ms |
|---|---|---|
| 768 px | In progress / Done / no / no | In progress / In progress / Done / no |
| 1024 px | Done / no / no / no | Done / Done / no / no |
| 1200 px | no / no / no / no | Done / no / no / no |

  «Done» o «In progress» es la columna donde se guardó; «no», que no se guardó. La ventana dura lo que tarda el scroll automático en acabar, hasta unos 300 ms o más. Depende del scroll: otra pasada a 1024 px con 50 ms guardó en `chromium` y no en `webkit`.
- **Por qué importa:** E-5 lleva al usuario justo a ese borde. Si suelta en el margen, la tarea cambia de estado sin que lo haya soltado en ninguna columna, a veces en una que aún no se ve y, si es Done, con la fecha real de fin de hoy. El hueco sí se muestra en esa columna, si se ve, y el movimiento se puede deshacer arrastrando de nuevo. Por eso no bloquea.
- **Propuesta:** recortar el rectángulo de las columnas con el del tablero visible, en los dos sitios, y añadir un E2E con esta medida. Es un cambio pequeño. El requisito ya lo pide, así que no hace falta cambiar la spec.

**I-2 · Al salir de la columna y volver, la tarjeta puede caer una posición más abajo y guardarse.** Afecta a RF-011, RF-007, CA-2.5 y RNF-004, y a D-9. Es el fallo de T-035, sin corregir.

- **Dónde:** [task-move.ts:77-80](../../apps/web/src/lib/task-move.ts#L77-L80) (`measuring`) y [task-move.ts:318-327](../../apps/web/src/lib/task-move.ts#L318-L327) (`onDragMove`). D-9 da por hecho que `MeasuringStrategy.Always` vuelve a medir cuando la lista cambia, y T-035 midió que no: los rectángulos de las tarjetas se quedan viejos. El plan no se ha corregido, y el comentario de [task-move.ts:78](../../apps/web/src/lib/task-move.ts#L78) y el de [helpers.ts:182](../../e2e/helpers.ts#L182) repiten esa idea.
- **Medido en esta auditoría:**
  - `003 CA-2.5` en `webkit`, 100 veces sin reintentos: **3 fallos**, los tres iguales: «Comprar pan», «Llamar al banco», «Preparar la demo», en vez de la demo la segunda. T-035 midió que además se guarda (`POST …/move` con `index: 2`); no se ha repetido esa medida.
  - Sonda, con el mismo recorrido a velocidades controladas: 0 fallos de 185 en `webkit` y 0 de 235 en `chromium`, con 0, 4, 8 y 16 ms entre movimientos y, en `chromium`, con la CPU limitada a 4x y 6x. T-035 tampoco lo vio a 16 ms (0 de 142 y 0 de 100).
- **Lectura:** solo se ha visto con la secuencia exacta del test, y solo en `webkit`. No hay ninguna medida que lo reproduzca a velocidad de ratón, lo que no lo descarta: la causa está en el código, no en el test. El hueco enseña dónde va a caer antes de soltar, así que no es silencioso del todo y se corrige arrastrando otra vez. Sigue pendiente confirmar si también explica el fallo de `003 RF-006` en `webkit` (T-038).
- **Efecto en la suite:** con `retries: 1`, el test en rojo pasa al reintentar, así que un fallo real se ve como *flaky*.
- **Propuesta, a elegir:**
  1. Corregirlo: volver a medir las tarjetas cuando cambia la vista previa (`measureDroppableContainers`, lo que hace `@dnd-kit/sortable`). Cambia D-9, y hay que comprobar RNF-002, porque con 200 tarjetas se mide más.
  2. Aceptarlo como riesgo conocido: anotarlo en el plan como D-x, corregir D-9 y dejar claro por qué ese test puede fallar en `webkit`.

### Menores

**M-1 · De 768 a 1023 px, el anillo de foco del asa y la sombra de la tarjeta cogida se recortan.** Afecta a RNF-001, RNF-005 y C-20.

- **Dónde:** [BoardColumn.tsx:112](../../apps/web/src/components/BoardColumn.tsx#L112) (`md:overflow-y-auto`, con solo `p-1` de margen) y [TaskCard.tsx:118](../../apps/web/src/components/TaskCard.tsx#L118) (`end-0 top-0` hasta 1024 px).
- **Medido (sonda):** con la tarjeta cogida y la escala 1.02, al asa le quedan 2,04 px hasta el borde de la lista, y el anillo necesita 4 px (`outline` 2 + `offset` 2). En la captura a 768 px el círculo sale cortado por la derecha, y la sombra se ve como una banda recta arriba y abajo de la tarjeta. El foco se sigue viendo por los otros tres lados, y a 375 y 1280 px está entero.
- **Propuesta:** más margen en la lista o el asa más adentro en ese tramo.

**M-2 · Tests de escrituras a la vez que agotan los 5 s, de forma intermitente.** Afecta a D-2 y a la fiabilidad de la suite. Viene de T-039.

- **Medido:** sin nada más corriendo, 0 de 26 pasadas de la suite de la API, y sin errores de 4 a 40 creaciones a la vez (25 repeticiones más la pasada inicial; 125 ms con 40). **Con los E2E corriendo a la vez sobre la misma base, 1 de 8 pasadas:** `003 E-11 D-2 dos move a la vez` agotó los 5 s. Es otro test que el de T-039, con el mismo patrón (`Promise.all` de operaciones que empiezan con `lockUser`).
- **Lectura:** apoya que tenga que ver con la coincidencia con los E2E, como ya sospechaba T-039, pero **la causa no está confirmada**, y T-039 no dejó claro si su fallo coincidió con ellos. No hay efecto visible esperado para el usuario: si una transacción no termina, Prisma la corta, el movimiento falla y sale el aviso de RF-021. Tampoco se ha comprobado que ese sea el camino real de este fallo.
- **Propuesta:** no lanzar `pnpm test` y `pnpm test:e2e` a la vez. Si vuelve a salir sin E2E, investigarlo con `pg_stat_activity` en el momento del cuelgue.

**M-3 · Sin comprobar en Safari real: el difuminado de la tarjeta levantada.** Afecta a RNF-001, «❓ no verificable».

- **Medido (sonda), peor contraste en la caja del texto de la capa, título / fecha:**

| Tema y debajo | `chromium` | `webkit` de Playwright |
|---|---|---|
| Claro, sobre otra tarjeta | 17,23 / 10,9 | 11,67 / 7,66 |
| Claro, sobre «Crear tarea» | 12,99 / 8,55 | 12,41 / 8,13 |
| Oscuro, sobre otra tarjeta | 12,09 / 8,05 | 12,04 / **5,48** |
| Oscuro, sobre «Crear tarea» | 9,25 / 8,02 | **4,39** / 7,46 |

- **Lectura:** el objetivo es 7:1. En `webkit`, `backdrop-filter` figura en el estilo calculado, pero en la captura no se ve difuminado: «Crear tarea» y el texto de otra tarjeta se leen nítidos a través de la capa. No se sabe si es cosa de cómo captura Playwright o si pasa también en Safari. Es solo mientras la capa pasa por encima de algo, y su texto es secundario, porque la tarjeta se está moviendo. axe no lo detecta.
- **Propuesta:** mirarlo una vez en Safari, en tema oscuro, arrastrando una tarjeta sobre otra. Si se ve igual, subir la opacidad de la capa, como el respaldo de §6.3.

**M-4 · RF-023 no dice lo que hace el código cuando el foco ya salió del asa.** La spec dice que, si falla el guardado, «DEBE volver a mostrar la columna de partida», sin condiciones. D-26 solo lo hace si el foco sigue en el asa ([task-move.ts:202](../../apps/web/src/lib/task-move.ts#L202)), y el test `003 RF-023 D-26` fija ese comportamiento. La decisión tiene sentido, pero solo está en el plan. **Propuesta:** añadir la condición a RF-023 con `/sdd-cambiar-spec`, como ya la tiene RF-022.

**M-5 · Limpieza de documentos.**

- [plan.md](plan.md) §4.4 no lista `PrivateArea.tsx`, que cambia por D-23 y D-30.
- [plan.md](plan.md) §4.5 dice que el icono de 16 px del asa sigue «§9», pero §9 pide el 40 % del diámetro (17,6 y 12,8 px). `DESIGN.md` §11.3 sí fija los 16 px, así que no es un fallo visual: lo que falla es la cita.
- [roadmap.md](../roadmap.md) no tiene filas de la spec v2.0, de la v3.0 ni de la verificación NO APTO, y sigue con `actualizado: 2026-10-31`. `/sdd-cambiar-spec` no lo exige, pero la spec 001 sí las anotó. Se puede añadir al cerrar.

## Deriva spec ↔ código

| Spec | Código | Acción |
|---|---|---|
| RF-005, CA-1.7: soltar fuera de cualquier columna no guarda | Guarda en el margen del tablero, de 768 a 1279 px, durante el scroll | I-1: corregir el código |
| RF-011, CA-2.5: soltar en el mismo sitio no cambia nada | En `webkit`, a veces la tarjeta cae una posición más abajo | I-2: decidir |
| RF-023: si falla el guardado, vuelve a la columna de partida | Solo si el foco sigue en el asa | M-4: añadirlo a la spec |

**Alcance:** sin código de más. No hay nada de «Fuera de alcance» implementado (ni toasts, ni «Subir»/«Bajar», ni deshacer, ni arrastre entre columnas en móvil). `memo`, `landing`, `latestTasks` y `pressHandle` se trazan a RNF-002, RF-020 y D-24. Todo lo de «Fuera de alcance» está ya en «Ideas sin priorizar» del roadmap.

**Plan:** D-23 a D-30 están documentadas y se corresponden con el código. La única desviación sin corregir es D-9 (I-2), más lo de M-5.

## Constitución

| Artículo | Veredicto | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any` |
| C-2 | ✅ | `@dnd-kit/core` 6.3.1 fijada y justificada (plan §2, R-1) |
| C-4 | ✅ | `drag` y `landing` sin datos del servidor; `useTasks` con TanStack Query; `latestTasks` es una referencia, no estado (D-24) |
| C-5 | ✅ | Migración nueva; ninguna aplicada se ha tocado |
| C-7 | ✅ | `/api/tasks/:id/move`, relativa |
| C-8 | ✅ | Rutas → service → repository; `$queryRaw` y Prisma solo en el repository |
| C-9 | ✅ | Sin códigos nuevos; el texto lo decide el front |
| C-10 | ✅ | `moveTaskInputSchema` y `actualEndDateAfterMove` en `shared`, sin duplicar |
| C-11 | ✅ | `today` como `YYYY-MM-DD` |
| C-13 | ✅ | Tarea ajena → 404 `TASK_NOT_FOUND`, con test de `move`, y el orden del dueño no cambia |
| C-14 | ✅ | `validateTaskId` y `validateBody(moveTaskInputSchema)` |
| C-16 | ✅ | `position` no se expone |
| C-17 | ✅ | Cada RF tiene test |
| C-18 | ✅ | Vitest, Supertest con Postgres real y Playwright |
| C-19 | ✅ | Tests, linter y tipos en verde |
| C-20 | ⚠️ | Alternativa de teclado completa y foco siempre a la vista; anillo cortado de 768 a 1023 px (M-1) |
| C-21 | ✅ | Sin nada fuera de la spec |
| C-22 | ✅ | `placeTask` y `makeRoom` con varios usos |
| C-23 | ✅ | Identificadores en inglés y textos en castellano |
| C-24 | ✅ | Formato correcto. Algún commit agrupa tareas, anotado en el Registro |
| C-25 | ✅ | `pnpm lint` sin errores |
| C-26 | ⚠️ | X-1 y X-2 justificadas; sombra recortada (M-1) y contraste en Safari sin comprobar (M-3) |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ✅ | T-001 a T-036, T-038 y T-039 comprobadas por su resultado y su Registro; T-037 se marca con este informe |
| Cada RF y CA con test que pasa | ⚠️ | 62/62 con test; CA-2.5 falla 3 de 100 en `webkit` (I-2) |
| Cada caso límite implementado y probado | ✅ | E-19, manual |
| Sin código que no se trace | ✅ | |
| Tests, linter y tipos en verde | ⚠️ | En local, sí; el repositorio no tiene CI |
| Sin `console.log`, código comentado ni TODO | ✅ | |
| Accesibilidad revisada | ⚠️ | Automática y con 6 capturas; M-1 y M-3 abiertos; sin lector real (D-22) |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ⚠️ | I-1, I-2 y M-4 |
| Desviaciones anotadas en el plan | ⚠️ | D-9 sigue sin corregir (I-2); M-5 |
| ADRs si hubo decisiones transversales | ✅ | No hubo; el plan no los pide |
| Estado de la spec → `implementada` | ⏳ | Sigue en `en-implementacion` hasta que el usuario decida |
| PR con spec, requisitos e informe | ⏳ | Pendiente |
| Revisada y aprobada | ⏳ | Pendiente |
