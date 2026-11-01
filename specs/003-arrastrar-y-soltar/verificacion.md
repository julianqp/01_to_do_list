# Verificación · Spec 003 · 2026-11-01
Resultado: **NO APTO**

## Resumen

- **Motivo:** un solo problema bloqueante (B-1). Al bajar una tarjeta con teclado en una columna con scroll, la tarjeta y el foco salen de la vista y nada los trae de vuelta. Incumple C-20 y RNF-001 («foco visible») en HU-3, que es P1. El resto de la spec se cumple, salvo un conflicto entre spec y plan que necesita una decisión (I-1) y varias observaciones menores.
- **Independencia:** auditoría hecha en una sesión nueva, sin haber escrito el código. Se repitieron todas las comprobaciones y se leyó el diff completo de `main...HEAD` (`7409ada`).
- **Alcance revisado:** `spec.md` v1.0, `plan.md` (hasta D-22), `research.md`, `tasks.md` (24/25 antes de este informe), constitución v1.1 y `DESIGN.md` 1.4.0-todo.1.

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ✅ 40 ficheros, 880 tests en verde |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores |
| `pnpm test:e2e` (4 ficheros × `chromium`, `chrome`, `webkit`) | ✅ 252 pasan, 11 saltados (los previstos) y 1 *flaky*: `board.spec.ts` «CA-1.1 RF-001 RF-003» en `webkit`, que pasó al reintentar (deuda M-7 de la 004) |
| Trazabilidad | ✅ 78/78 IDs con al menos un test cuyo título empieza por `003 ` (79 contando E-19, que es manual) |
| E-19, repetido en esta auditoría | ✅ Base temporal, ya borrada: migraciones de la 001 y la 002, 60 tareas de 2 usuarios en 8 columnas, con `createdAt` repetidos. El orden es idéntico antes y después de `task_position`, y no se repite ninguna posición (60 de 60 distintas) |
| Restos | ✅ Sin `console.log`, `TODO`, `FIXME` ni `any` en los ficheros de producción de la spec ni en `e2e/` |

**Sonda E2E temporal.** Para comprobar lo que la suite no cubre, se ejecutó `e2e/zz-audit-003.spec.ts` en `chromium` y `webkit`. Ya está borrada y no forma parte de la suite. En este informe, «sonda» significa que la evidencia sale de ahí y que **ningún test del repositorio la protege**. Se descartó un resultado propio no concluyente: un 404 simulado que dejaba la tarea viva en el servidor, repetido después con un borrado real (M-2).

**Límites de esta auditoría:**

- Los anuncios se comprueban por el texto de la región viva, no por lo que dice un lector de pantalla (decisión D-22; riesgo aceptado).
- El arrastre con el dedo se comprueba con emulación táctil, que es lo que pide RNF-004. En `webkit` usa eventos sintéticos (D-17).
- La checklist §21 con «aumentar contraste» y a 768 px no se repitió. Se revisaron 4 capturas: 1280 en claro y oscuro con arrastre, 1280 con la tarjeta fuera de vista y 375 con la tarjeta cogida. El resto se apoya en la nota de T-023.

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. Todos los tests citados pasan en esta ejecución. Abreviaturas de la columna «Test»: `e2e` = `e2e/drag-and-drop.spec.ts`; `move` = `apps/api/test/tasks.move.test.ts`; `Board`, `TaskCard`, `BoardColumn` = `apps/web/src/components/*.test.tsx`; `order` = `lib/board-order.test.ts`; `queries` = `lib/task-queries.test.tsx`; `messages` = `lib/task-messages.test.ts`; `shared` = `packages/shared/src/tasks.test.ts`; `service` = `tasks.service.test.ts`.

### Requisitos funcionales

| ID | Código | Test | Veredicto |
|---|---|---|---|
| RF-001 | `task-move.ts` `commit`; `tasks.service.moveTask`; `task.repository.moveTaskOfUser` | `move`, `Board`, `order`, `e2e` (CA-1.1) | ✅ |
| RF-002 | `Board.tsx` `DragOverlay`; `TaskCard.tsx` variantes | `TaskCard`, `BoardColumn`, `e2e` (CA-1.2) | ✅ |
| RF-003 | `shared` `actualEndDateAfterMove`; `today = todayLocal()` | `shared`, `move`, `service`, `Board`, `queries` | ✅ |
| RF-004 | Ídem | `shared`, `move`, `service`, `Board`, `queries` | ✅ |
| RF-005 | `task-move.ts` `onDragOver`, `onDragCancel` | `e2e` (CA-1.7, CA-4.5) | ⚠️ Falla si se suelta en el mismo fotograma en que se sale (M-1) |
| RF-006 | `TaskCard.tsx` botón de abrir; `MouseSensor` `distance: 5` | `TaskCard`, `e2e` (CA-1.8, CA-4.4) | ⚠️ Un clic o un toque en el asa no abre el detalle (I-1) |
| RF-007 | `makeRoom`; `stepPlacement`; `placementFromOver` | `move`, `service`, `Board`, `order`, `e2e` (CA-2.1) | ✅ |
| RF-008 | `columnOrder` en `findTasksByUser` | `tasks.list.test`, `e2e` (CA-1.3, CA-2.2) | ✅ |
| RF-009 | `createTask` con `makeRoom(backlog, 0)` | `tasks.create.test` | ✅ |
| RF-010 | `updateTask` con `toTop` | `tasks.list.test`, `tasks.update.test` | ✅ |
| RF-011 | `commit` con `samePlacement` | `Board`, `order`, `e2e` (CA-2.5) | ✅ |
| RF-012 | `TaskCard.tsx` asa | `TaskCard`, `e2e` (CA-3.1) | ✅ |
| RF-013 | `clickHandle`; `pickedText` | `Board`, `messages`, `e2e` | ✅ |
| RF-014 | `keyDownOnHandle`; `stepPlacement`; `movedText` | `Board`, `order`, `messages`, `e2e` | ✅ Mueve y anuncia; la visibilidad, en RNF-001 (B-1) |
| RF-015 | `stepPlacement` devuelve `undefined` | `Board`, `order` | ✅ |
| RF-016 | `clickHandle`; `focusedHandle`; `droppedText` | `Board`, `messages`, `e2e` | ✅ |
| RF-017 | `cancel`; `leaveHandle` en diferido | `Board`, `messages`, `e2e` | ✅ |
| RF-018 | `TouchSensor` `{ delay: 250, tolerance: 5 }` | `e2e` (CA-4.1, CA-4.2) | ✅ |
| RF-019 | Columnas ocultas sin medidas (D-13) | `e2e` (CA-4.3, CA-4.5, con el dedo). Con ratón a 375, solo sonda: correcto | ✅ |
| RF-020 | `useMoveTask.onMutate`; `landing` | `queries`, `e2e` | ✅ |
| RF-021 | `useMoveTask.onError`; `moveErrorText` | `Board`, `queries`, `messages`, `e2e` | ✅ |
| RF-022 | `onError` con `isTaskNotFound` | `move`, `Board`, `queries`, `messages` | ✅ El foco se pierde (M-2) |
| RF-023 | `onMobileColumn` | `Board`, `e2e` | ✅ |

### Criterios de aceptación

| ID | Test | Veredicto |
|---|---|---|
| CA-1.1 | `e2e` «CA-1.1 CA-1.3…» | ✅ |
| CA-1.2 | `e2e` «CA-1.2 RF-002» | ✅ |
| CA-1.3 | `e2e` «CA-1.1 CA-1.3…» | ✅ |
| CA-1.4 | `Board`, `queries` (con teclado; con ratón, mismo `commit`) | ✅ |
| CA-1.5 | `move`, `Board` | ✅ |
| CA-1.6 | `e2e` «CA-1.6 E-1» | ✅ |
| CA-1.7 | `e2e` «CA-1.7 RF-005» | ⚠️ M-1 |
| CA-1.8 | `TaskCard`, `e2e` | ⚠️ En el asa, no abre (I-1) |
| CA-1.9 | `Board`, `e2e` | ✅ |
| CA-1.10 | `Board` (con teclado) | ✅ |
| CA-2.1 | `move`, `e2e` | ✅ |
| CA-2.2 | `tasks.list.test`, `e2e` (otro contexto de navegador) | ✅ |
| CA-2.3 | `tasks.create.test` | ✅ |
| CA-2.4 | `tasks.update.test` | ✅ |
| CA-2.5 | `Board`, `e2e` | ✅ |
| CA-2.6 | `Board` | ✅ |
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
| CA-4.1 | `e2e`, en los tres proyectos | ✅ |
| CA-4.2 | `e2e`, en `chromium` y `chrome` (R-6) | ✅ |
| CA-4.3 | `e2e`, en los tres proyectos | ✅ |
| CA-4.4 | `e2e`, en los tres proyectos | ✅ Fuera del asa (I-1) |
| CA-4.5 | `e2e`, en los tres proyectos | ✅ |

### Requisitos no funcionales

| ID | Evidencia | Veredicto |
|---|---|---|
| RNF-001 | Cumple: axe sin infracciones con la tarjeta cogida (`e2e`) y en pleno arrastre con puntero (solo sonda), en los dos temas; `tokens.test` ≥ 3:1; asa de 44 y 32 px; movimiento reducido; foco visible también tras cambiar de columna (sonda). **No cumple:** foco visible al bajar la tarjeta en una columna con scroll | ⚠️ B-1 |
| RNF-002 | `e2e`: pasa el límite de ≤ 100 ms en `chromium`. El valor de esta ejecución no se recogió; T-022 anotó unos 40 ms | ✅ |
| RNF-003 | `move`, `tasks.update.test`, `service`: tarea ajena → 404 y el orden de su dueño no cambia | ✅ |
| RNF-004 | Tres proyectos, con emulación táctil (D-17) | ✅ |
| RNF-005 | Tokens: `tokens.test`, `design-rules.test`. El asa no tiene los estados de §8 | ⚠️ M-3 |

### Casos límite

| ID | Test | Veredicto |
|---|---|---|
| E-1 | `order`, `e2e` | ✅ |
| E-2 | `Board` | ✅ |
| E-3 | `Board`, `order` | ✅ |
| E-4 | `e2e` (`chromium`) | ✅ |
| E-5 | `e2e` (`chromium`, 1024 px) | ✅ |
| E-6 | `TaskCard`, `e2e`. Sonda: la capa mide igual que la tarjeta en reposo | ✅ |
| E-7 | `Board`, `e2e` | ✅ |
| E-8 | `Board` | ✅ |
| E-9 | `move`, `Board` | ✅ |
| E-10 | `move`, `service` | ✅ |
| E-11 | `move` (en serie y a la vez) | ✅ |
| E-12 | `Board`, `queries` | ✅ |
| E-13 | `Board` | ✅ |
| E-14 | `Board` | ✅ |
| E-15 | `shared`, `move`, `service` | ✅ |
| E-16 | `shared`, `Board` | ✅ |
| E-17 | `e2e` | ✅ |
| E-18 | `e2e` | ✅ |
| E-19 | Manual: nota de T-002 y repetido en esta auditoría | ✅ |
| E-20 | `messages` | ✅ |

## Problemas

### Bloqueantes

**B-1 · Al bajar una tarjeta con teclado, sale de la vista y no vuelve.** Afecta a RNF-001, C-20 y HU-3.

- **Dónde:** [task-move.ts:123-128](../../apps/web/src/lib/task-move.ts#L123-L128) y [task-move.ts:172-178](../../apps/web/src/lib/task-move.ts#L172-L178).
- **Qué pasa:** con Flecha abajo, el asa conserva el foco, así que el efecto no la vuelve a enfocar y el navegador no hace scroll. Las flechas llevan `preventDefault`, de modo que el usuario tampoco puede hacer scroll con el teclado mientras la tiene cogida. Flecha arriba no falla: React mueve el nodo, el foco se pierde y, al recuperarlo, el navegador hace scroll.
- **Medido (sonda), igual en `chromium` y `webkit`:**

| Ventana | Tarjetas en To do | Sale de la vista en la flecha | Al llegar al final, fuera de la vista |
|---|---|---|---|
| 1280 × 900 | 12 | 8.ª | 284 px |
| 1280 × 720 | 8 | 5.ª | 166 px |
| 375 × 812 | 12 | 7.ª | 315 px |

- **Por qué bloquea:** no hace falta una columna rara, solo más tarjetas de las que caben. Una persona que ve la pantalla y no usa ratón, que es quien pide HU-3 (P1, «sin esto no se publica»), mueve a ciegas: no ve la tarjeta ni el indicador de foco. C-20 exige foco visible y el plan no justifica ninguna excepción. La suite no lo detecta porque ningún test de teclado usa una columna con scroll.
- **Propuesta:** tras cada paso, `scrollIntoView({ block: 'nearest' })` en el asa, respetando `prefers-reduced-motion`. Añadir un E2E con una columna con scroll a 1280 y 375 px que compruebe que el asa queda dentro de la lista. Es un cambio pequeño. Sin cambiar RF, conviene añadir un CA a HU-3 con `/sdd-cambiar-spec`.

### Importantes

**I-1 · Un clic o un toque en el asa coge la tarjeta en vez de abrir el detalle.** Afecta a RF-006, CA-1.8 y spec §10. Necesita una decisión del usuario.

- **Dónde:** [task-move.ts:152-165](../../apps/web/src/lib/task-move.ts#L152-L165) y [TaskCard.tsx:111-119](../../apps/web/src/components/TaskCard.tsx#L111-L119).
- **Qué dice cada documento:** el glosario de la spec define el asa como «parte de la tarjeta» y RF-006 dice «haga clic o toque una tarjeta». El §10 añade que el asa es «el punto de entrada para el teclado». El plan (D-7) resuelve el `click` del asa como coger, por la activación de los lectores de pantalla, y `TaskCard.test` fija «clic en el asa, no». Es una deriva entre spec y plan que no está anotada.
- **Medido (sonda), con ratón a 1280 y con toque a 375, en `chromium` y `webkit`:** no se abre el detalle, la tarjeta se levanta y el anuncio solo va a la región viva `sr-only`. A 375 px, donde el asa mide 44 × 44, la tarjeta queda levantada sin ninguna indicación visible y sin flechas con las que moverla. Solo se sale tocando otra cosa, que cancela, o volviendo a tocar el asa.
- **Propuesta, a elegir:**
  1. Mantener el comportamiento y escribirlo en la spec con `/sdd-cambiar-spec`, con alguna indicación visible para quien no usa teclado.
  2. Que un clic de puntero en el asa abra el detalle y solo la activación por teclado o tecnología de asistencia coja la tarjeta. Habría que comprobar antes cómo distinguirlas, porque D-7 depende de que la activación del lector llegue como `click`.

### Menores

**M-1 · Soltar fuera en el mismo fotograma en que se sale guarda el movimiento.** Afecta a RF-005 y CA-1.7.

- **Dónde:** [task-move.ts:247-251](../../apps/web/src/lib/task-move.ts#L247-L251). `onDragEnd` no mira `over` y guarda `drag.current`, que aún es la última vista previa.
- **Medido (sonda, con eventos reales de Playwright):** veces que se guardó por error, según la espera entre el último movimiento y soltar.

| Escenario | 0 ms | 8 ms | 16 ms | 33 ms o más |
|---|---|---|---|---|
| `chromium`, 4 tarjetas | 6/6 | 5/6 | 0/6 | 0/6 |
| `webkit`, 4 tarjetas | 5/6 | 0/6 | 0/6 | 0/6 |
| `chromium`, 500 tareas | 4/4 | — | 1/4 | 0/4 |

- **Efecto:** la ventana es de un fotograma, así que es poco frecuente. Pero guarda sin avisar y, si la última vista previa era Done, pone la fecha real de fin.
- **Propuesta:** en `onDragEnd`, no guardar si el destino al soltar es `null`, y comprobar con esta misma medida si basta o si hay que recalcular el destino con la posición del puntero.

**M-2 · El foco se pierde cuando la tarjeta ya no está donde el usuario la dejó.** Afecta a RF-021 y RF-022 (WCAG 2.4.3). La sonda da `document.activeElement = BODY` en dos casos, en `chromium` y `webkit`:

- **Tarea borrada de verdad (404):** además, la región viva sigue diciendo «Has soltado…» (sale el aviso de `role="alert"`). La 002 lleva el foco a «Crear tarea» en este caso (002/D-14).
- **A 375 px con teclado y fallo de red:** la tarjeta vuelve a To do, pero el selector sigue en In progress y el asa queda en una columna oculta. El test «RF-016: el foco sigue en su asa» pasa en jsdom porque allí no se aplica `display: none`.
- **Propuesta:** decidir el destino del foco y volver a la columna de origen al fallar (ampliar RF-023).

**M-3 · El asa no tiene estados de hover ni de press.** Afecta a RNF-005 y C-26. [TaskCard.tsx:115](../../apps/web/src/components/TaskCard.tsx#L115) no lleva `hover:` ni `motion-safe:active:scale-94`, aunque §8 los pide para los botones de icono y `Button` sí los aplica. El plan no lo justifica como desviación.

**M-4 · Desviaciones que solo están en el Registro, no en el plan.** Afecta a la Definition of Done.

- `backdrop-glass` en la tarjeta levantada (T-023) no está en D-10.
- `focusedHandle` (T-015) no está en D-7.
- `onDragMove` (D-20) no está en el contrato de `dndProps` de §4.3.
- `columnDropId` y `columnDropStatus` (T-018) no están en §4.3.

**M-5 · Copia de datos de servidor en estado local.** Afecta a C-4. `useState(tasks)` en [task-move.ts:107](../../apps/web/src/lib/task-move.ts#L107) solo sirve para detectar cambios, pero es literalmente lo que C-4 prohíbe. `DragState.task` y `landing.task` también guardan la tarea, y la fila C-4 del plan §3 dice «un id y dos posiciones». No hay un fallo visible. Conviene usar una referencia o corregir la nota del plan.

**M-6 · Trazabilidad del proceso.**

- El commit `4bef849` reúne T-012, T-014 a T-022 y T-024, frente a «una tarea = un commit», así que el historial no permite comprobar el test primero en esas tareas.
- La columna «Commit» del Registro está vacía en todas las filas, aunque las reglas piden anotarlo.

**M-7 · Huecos de cobertura sin fallo conocido.**

- RF-019 con ratón y axe en pleno arrastre no tienen test en el repositorio (solo sonda: correctos).
- CA-1.4, CA-1.5, CA-1.10 y CA-2.6 solo se prueban con teclado; el ratón comparte `commit`.
- T-024 anotó un fallo sin explicar de CA-2.5 en `webkit`. No se reprodujo en esta ejecución, lo que no descarta que sea intermitente.

**M-8 · Limpieza.**

- [specs/roadmap.md](../roadmap.md) tiene la misma idea dos veces (líneas 77 y 79, «Animar…»).
- `task-messages.ts` (en `lib/`) importa `STATUS_NAMES` de `components/BoardColumn`, de modo que un módulo de textos arrastra el componente y dnd-kit (anotado en T-011).

## Deriva spec ↔ código

| Spec | Código | Acción |
|---|---|---|
| RF-006, CA-1.8: clic o toque en la tarjeta abre el detalle | En el asa, coge la tarjeta | I-1: decidir y cambiar la spec o el código |
| RF-005, CA-1.7: soltar fuera no guarda | Guarda si se suelta en el mismo fotograma | M-1: corregir el código |
| RF-023: al cancelar, vuelve a la columna de partida | Al fallar el guardado (no es cancelar) no vuelve; la spec no lo cubre | M-2: decidir y ampliar la spec |

**Alcance:** sin código de más. No hay nada de «Fuera de alcance» implementado (ni toasts, ni «Subir»/«Bajar», ni deshacer, ni arrastre entre columnas en móvil). `memo` y `landing` se trazan a RNF-002 y RF-020. El aviso de mover que sigue en pantalla tras un movimiento correcto no contradice la spec y ya está en «Ideas sin priorizar».

**Plan:** D-17 a D-22 están documentadas; lo que falta está en M-4. X-1 y X-2 están justificadas y recogidas en `DESIGN.md` 1.4.0-todo.1.

## Constitución

| Artículo | Veredicto | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any`. `event.key as MoveKey` va protegido por `MOVE_KEYS` |
| C-2 | ✅ | `@dnd-kit/core` 6.3.1 fijada y justificada (plan §2, R-1) |
| C-4 | ⚠️ | Isla única y caché de TanStack Query, sin `fetch` en efectos; copia de `tasks` en estado (M-5) |
| C-5 | ✅ | Migración nueva; la de la 002 no se toca |
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
| C-20 | ❌ | Alternativa de teclado completa, pero sin foco visible en columnas con scroll (B-1) y con foco perdido en dos casos (M-2) |
| C-21 | ✅ | Sin nada fuera de la spec |
| C-22 | ✅ | `placeTask` y `makeRoom` con varios usos |
| C-23 | ✅ | Identificadores en inglés y textos en castellano |
| C-24 | ⚠️ | Formato correcto; commits agrupados (M-6) |
| C-25 | ✅ | `pnpm lint` sin errores |
| C-26 | ⚠️ | X-1 y X-2 justificadas; estados del asa sin justificar (M-3) |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ✅ | T-001 a T-024 comprobadas; T-025 se marca con este informe |
| Cada RF y CA con test que pasa | ✅ | 54/54 |
| Cada caso límite implementado y probado | ✅ | E-19, manual y repetido |
| Sin código que no se trace | ✅ | |
| Tests, linter y tipos en verde | ⚠️ | En local, sí; el repositorio no tiene CI |
| Sin `console.log`, código comentado ni TODO | ✅ | |
| Accesibilidad revisada | ❌ | B-1 |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ❌ | I-1, M-1 y M-2 |
| Desviaciones anotadas en el plan | ⚠️ | M-4 |
| ADRs si hubo decisiones transversales | ✅ | No hubo; el plan no los pide |
| Estado de la spec → `implementada` | ❌ | Sigue en `en-implementacion` hasta resolver B-1 |
| PR con spec, requisitos e informe | ⏳ | Pendiente |
| Revisada y aprobada | ⏳ | Pendiente |
