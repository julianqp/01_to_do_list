# Verificación · Spec 003 · 2026-11-01 (tercera)
Resultado: **NO APTO**

## Resumen

- **Motivo:** la suite E2E termina en rojo y la fase 7 está sin cerrar.
  - **B-1:** `003 RF-007 D-9` falla en `chromium` y `webkit`: con un título largo y un temblor de ±1 px, la vista previa oscila. T-041 lo dejó parado, pendiente de la decisión del usuario, y ese test sigue en rojo a propósito.
  - **B-2:** T-041, T-042 y T-043 no están hechas. T-037 depende de ellas, así que **esta verificación se ha lanzado antes de tiempo** y no cierra T-037.
- **Lo nuevo de esta auditoría:** dos problemas importantes que los tests no ven.
  - **I-1:** con el dedo, si se suelta fuera justo al salir de una columna a la que ya se había pasado la tarjeta, el movimiento se guarda (E-21, RF-005). 12 de 12 en `chromium` y `webkit`. La protección de D-25 no funciona con el dedo en ese caso.
  - **I-2:** ordenar una columna solo se puede hacer arrastrando o con teclado, y WCAG 2.2 AA pide también una forma con un solo puntero sin arrastrar (criterio 2.5.7). RNF-001 y C-20 piden ese nivel, y §9 de la spec deja fuera la alternativa. **Lo tiene que decidir el usuario.**
- **Lo que mejora:** los dos importantes de la segunda verificación están corregidos en lo medido: soltar en el margen ya no guarda (D-31) y CA-2.5 da 0 fallos reales de 200 en `webkit`.
- **Independencia:** auditoría hecha en una sesión nueva, sin haber escrito el código. Se volvieron a ejecutar la suite y las medidas, y se leyó el código de producción de `main...HEAD` (`64f500f`).
- **Alcance revisado:** `spec.md` v3.1, `plan.md` (hasta D-31), `tasks.md` (39/43), constitución v1.1 y `DESIGN.md` 1.4.0-todo.1. Sustituye al informe de la segunda verificación, que sigue en el historial de git (`406a678`). El cambio sin confirmar de `tasks.md` (nota sobre M-3) se lee como una anotación del usuario.

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ✅ 40 ficheros, 897 tests en verde |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores y 5 sugerencias (`hints`) de Astro |
| `pnpm test:e2e` (4 ficheros × `chromium`, `chrome`, `webkit`) | ❌ **Termina con código 1:** 325 pasan, 33 saltados y 2 fallan, los dos `003 RF-007 D-9` (15 cambios de orden en `chromium` y 2 en `webkit`, con 1 como máximo). Sin *flaky* en esta pasada |
| Trazabilidad | ✅ 88/88 IDs con al menos un test cuyo título empieza por `003 ` (89 contando E-19, que es manual) |
| `003 CA-2.5` en `webkit`, 200 veces, sin reintentos | ✅ 196 pasan y 4 fallan, los 4 en `/signup` sin hidratar, antes de llegar al tablero (M-7 de la 004). **0 fallos reales** |
| RNF-002 entre columnas, 3 veces | ✅ 39 / 36,4 / 36,4 ms |
| RNF-002 reordenando en la columna de 200, 3 veces | ✅ 67,8 / 40,4 / 40,1 ms |
| Cambio de vista previa con 200 tarjetas (sin límite en la spec) | 43 / 41,3 / 40,5 ms |
| E-19 | ✅ Leída la migración: el relleno da el mismo orden que la lectura. Solo tiene un commit (`1814324`), el que se comprobó en T-002. No se repitió |
| Restos | ✅ Sin `console.log`, `TODO`, `FIXME`, `any` ni `.only` en los ficheros de producción de la spec ni en sus E2E |

**Saltados:** 27 en `chrome` y 6 en `webkit`, 12 más que en la segunda verificación. Coincide con lo que piden T-040 y T-041 (solo `chromium` y `webkit`), pero no se han revisado uno a uno.

**Sondas temporales.** Para lo que la suite no cubre se ejecutaron dos ficheros E2E en `chromium` y `webkit`, fuera del repositorio. En este informe, «sonda» significa que la evidencia sale de ahí y que **ningún test del repositorio la protege**.

**Comprobado por sonda, sin problemas:**

- Soltar en el hueco de 16 px entre dos columnas a 1280 no guarda.
- Arrastrar con ratón desde el asa guarda y no abre el detalle.
- Con el dedo, salir de la columna, esperar 500 ms y soltar no guarda.
- RF-024 entre columnas a 768: en cada flecha, el asa queda dentro de la ventana y sin tapar.
- Soltar sobre la cabecera, a 375 con `main` desplazado (12 y 40 tarjetas) y a 1024 × 420, no guarda. **Con una reserva:** `inVisibleColumn` solo recorta en horizontal. A 375 no guarda porque el scroll automático ya ha sacado la columna de debajo de la cabecera al soltar, y a 1024 × 420 porque `main` no hace scroll.

**Límites de esta auditoría:**

- Los anuncios se comprueban por el texto de la región viva, no por lo que dice un lector de pantalla (D-22, riesgo aceptado). El riesgo de D-24 tampoco se puede descartar.
- El arrastre con el dedo se comprueba con emulación táctil, como pide RNF-004. En `webkit` usa eventos sintéticos (D-17). En `chromium`, eventos de CDP, que Chromium trata como reales.
- La checklist §21 no se repitió, y no se hicieron capturas nuevas. `TaskCard.tsx` y `BoardColumn.tsx` no han cambiado desde la segunda verificación, así que el anillo cortado y el contraste de la capa se citan de sus medidas.
- Sin Safari real por parte de esta auditoría: ver M-3.

### Problemas de la verificación anterior

| Problema | Estado | Comprobación |
|---|---|---|
| I-1 (soltar en el margen) | ✅ Resuelto | D-31; los tests `003 … D-31` pasan en `chromium` y `webkit` |
| I-2 (caer una posición más abajo) | ✅ Resuelto en lo medido, sin documentar | 0 fallos reales de 200 aquí y de 300 en T-041, con `RemeasureOnPreview`. T-041 sigue abierta y el plan no lo recoge (M-2) |
| M-1 (anillo y sombra recortados) | ❌ Abierto | El anillo es T-042, sin hacer. La sombra, sin tarea por decisión del usuario |
| M-2 (cuelgue de escrituras a la vez) | ⚠️ Sin tarea | M-5 de este informe. `pnpm test` pasó una vez, sin E2E a la vez |
| M-3 (contraste en Safari) | ⚠️ En parte | Comprobado a ojo por el usuario sobre otra tarjeta. Ver M-3 de este informe |
| M-4 (RF-023 frente a D-26) | ✅ Resuelto | Spec v3.1, que coincide con [task-move.ts:213](../../apps/web/src/lib/task-move.ts#L213) y con `003 RF-023 D-26` |
| M-5 (documentos) | ❌ Abierto | M-6 de este informe. Es T-043, sin hacer, y las filas del roadmap, que se añaden al cerrar |

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. Todos los tests citados pasan en esta ejecución, salvo donde se indica. Abreviaturas de la columna «Test»: `e2e` = `e2e/drag-and-drop.spec.ts`; `move` = `apps/api/test/tasks.move.test.ts`; `list`, `create`, `update` = `apps/api/test/tasks.*.test.ts`; `service` = `tasks.service.test.ts`; `Board`, `TaskCard`, `BoardColumn`, `PrivateArea` = `apps/web/src/components/*.test.tsx`; `order` = `lib/board-order.test.ts`; `queries` = `lib/task-queries.test.tsx`; `messages` = `lib/task-messages.test.ts`; `tokens` = `styles/tokens.test.ts`; `shared` = `packages/shared/src/tasks.test.ts`.

### Requisitos funcionales

| ID | Código | Test | Veredicto |
|---|---|---|---|
| RF-001 | `task-move.ts` `commit`; `tasks.service.moveTask`; `task.repository.moveTaskOfUser` | `move`, `Board`, `order`, `e2e` | ✅ |
| RF-002 | `Board.tsx` `DragOverlay`; `TaskCard.tsx` variantes | `TaskCard`, `e2e` | ✅ |
| RF-003 | `shared` `actualEndDateAfterMove`; `today = todayLocal()` | `shared`, `move`, `service`, `Board`, `queries`, `e2e` | ✅ |
| RF-004 | Ídem | `shared`, `move`, `service`, `Board`, `queries`, `e2e` | ✅ |
| RF-005 | `onDragOver`, `onDragCancel`, `inVisibleColumn` (D-31) | `e2e` (CA-1.7, D-31, E-21, CA-4.5) | ⚠️ Con ratón cumple, también en el margen. Con el dedo, no al soltar en el mismo instante (I-1) |
| RF-006 | `TaskCard.tsx` botón de abrir y `event.detail` en el asa; `MouseSensor` `distance: 5` | `TaskCard`, `e2e` | ✅ |
| RF-007 | `makeRoom`; `stepPlacement`; `placementFromOver` | `move`, `service`, `Board`, `order`; `e2e`, **`003 RF-007 D-9` falla** | ⚠️ Coloca bien, pero la vista previa oscila (B-1) |
| RF-008 | `columnOrder` en `findTasksByUser` | `list`, `e2e` | ✅ |
| RF-009 | `createTask` con `makeRoom(backlog, 0)` | `create` | ✅ |
| RF-010 | `updateTask` con `toTop` | `list`, `update` | ✅ |
| RF-011 | `commit` con `samePlacement`; `RemeasureOnPreview` | `Board`, `order`, `e2e` | ✅ 0 fallos reales de 200 en `webkit` |
| RF-012 | `TaskCard.tsx` asa | `TaskCard`, `e2e` | ✅ |
| RF-013 | `clickHandle`; `pickedText` | `Board`, `TaskCard`, `messages`, `e2e` | ✅ |
| RF-014 | `keyDownOnHandle`; `stepPlacement`; `movedText` | `Board`, `order`, `messages`, `e2e` | ✅ |
| RF-015 | `stepPlacement` devuelve `undefined` | `Board`, `order` | ✅ |
| RF-016 | `clickHandle`; `focusedHandle`; `droppedText` | `Board`, `messages`, `e2e` | ✅ |
| RF-017 | `cancel`; `leaveHandle` en diferido | `Board`, `messages`, `e2e` | ✅ |
| RF-018 | `TouchSensor` `{ delay: 250, tolerance: 5 }` | `e2e` (CA-4.2 sin `webkit`, R-6) | ✅ |
| RF-019 | Columnas ocultas sin medidas (D-13); `inVisibleColumn` | `e2e`, con ratón y con el dedo | ⚠️ Soltar sobre «Crear tarea» guarda (M-4); hay que decidir si eso es «fuera» |
| RF-020 | `useMoveTask.onMutate`; `landing` | `queries`, `e2e` | ✅ |
| RF-021 | `onError`; `onSettled` sin esperar (D-29); `moveErrorText` | `Board`, `queries`, `e2e` con la API caída | ✅ |
| RF-022 | `onError` con `isTaskNotFound`; `onTaskGone` (D-26) | `move`, `Board`, `queries`, `messages`, `e2e` con borrado real | ✅ |
| RF-023 | `onMobileColumn` (D-13, D-26) | `Board`, `e2e` | ✅ Coincide con la spec v3.1 |
| RF-024 | `scrollIntoView` (D-23); `max-md:scroll-pb-24` | `e2e`. Sonda: entre columnas a 768 | ✅ |
| RF-025 | `PrivateArea` por `tasks.data` (D-30) | `PrivateArea`, `e2e` | ✅ |

### Criterios de aceptación

| ID | Test | Veredicto |
|---|---|---|
| CA-1.1 | `e2e` | ✅ |
| CA-1.2 | `e2e` | ✅ |
| CA-1.3 | `e2e` | ✅ |
| CA-1.4 | `Board`, `queries`, `e2e` con ratón | ✅ |
| CA-1.5 | `move`, `Board`, `e2e` con ratón | ✅ |
| CA-1.6 | `e2e` | ✅ |
| CA-1.7 | `e2e`, sobre el título y en el margen (D-31) | ✅ |
| CA-1.8 | `TaskCard`, `e2e` | ✅ |
| CA-1.9 | `e2e` | ✅ |
| CA-1.10 | `Board`, `e2e` con borrado real | ✅ |
| CA-1.11 | `TaskCard`, `e2e` | ✅ |
| CA-1.12 | `e2e` con `**/api/**` abortado | ✅ |
| CA-2.1 | `move`, `e2e` | ✅ |
| CA-2.2 | `list`, `e2e` (otro contexto de navegador) | ✅ |
| CA-2.3 | `create` | ✅ |
| CA-2.4 | `update` | ✅ |
| CA-2.5 | `Board`, `e2e`; 200 veces en `webkit` | ✅ |
| CA-2.6 | `Board`, `e2e` con ratón | ✅ |
| CA-3.1 | `TaskCard`, `e2e` (foco visible real) | ⚠️ De 768 a 1023 px, el anillo se corta por la derecha (M-1) |
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
| CA-4.5 | `e2e`, en los tres proyectos | ⚠️ Pasa en lo que comprueba. «Fuera de la columna» sobre «Crear tarea»: M-4 |
| CA-4.6 | `e2e`, en los tres proyectos | ✅ |

### Requisitos no funcionales

| ID | Evidencia | Veredicto |
|---|---|---|
| RNF-001 | Cumple: axe sin infracciones con la tarjeta cogida y en pleno arrastre, en los dos temas; `tokens` ≥ 3:1; asa de 44 y 32 px; movimiento reducido. **No cumple:** WCAG 2.5.7 al ordenar una columna (I-2), que axe no detecta. **Parcial:** anillo cortado de 768 a 1023 px (M-1). **❓** Contraste de la capa en Safari sobre «Crear tarea» (M-3) | ⚠️ |
| RNF-002 | `e2e` en `chromium`: entre columnas, 39 / 36,4 / 36,4 ms; en la columna de 200, 67,8 / 40,4 / 40,1 ms, frente a ≤ 100 ms | ✅ |
| RNF-003 | `move`, `update`, `service`: tarea ajena → 404, y el orden de su dueño no cambia | ✅ |
| RNF-004 | Tres proyectos, con emulación táctil (D-17). `chrome` se salta los tests que el plan limita a `chromium` y `webkit`, y CA-4.2 no corre en `webkit` (R-6). B-1 e I-1 salen en `chromium` y `webkit` | ⚠️ |
| RNF-005 | `tokens`, `design-rules.test`, `TaskCard` (D-27). Sombra de la tarjeta cogida recortada contra la lista, sin tarea por decisión del usuario | ⚠️ |

### Casos límite

| ID | Test | Veredicto |
|---|---|---|
| E-1 | `order`, `e2e` | ✅ |
| E-2 | `Board` | ✅ |
| E-3 | `Board`, `order` | ✅ |
| E-4 | `e2e` (`chromium`), hacia abajo | ✅ |
| E-5 | `e2e` (`chromium`, 1024 px) y `003 E-5 D-31` con el puntero en el margen | ✅ |
| E-6 | `TaskCard`, `e2e` | ✅ |
| E-7 | `Board`, `e2e` | ✅ |
| E-8 | `Board` (`location.replace`) | ✅ |
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
| E-19 | Manual: nota de T-002; migración sin cambios y leída aquí | ✅ |
| E-20 | `messages` | ✅ |
| E-21 | `e2e`, solo con ratón | ⚠️ Con ratón cumple. **Con el dedo, no** (I-1) y sin test |
| E-22 | `PrivateArea`, `e2e` | ✅ |

## Problemas

### Bloqueantes

**B-1 · La suite E2E está en rojo: la vista previa oscila con tarjetas de distinta altura.** Afecta a RF-007, a RNF-004, a D-9 y D-20 (que dicen que no oscila) y al criterio de T-041.

- **Dónde:** [e2e/drag-and-drop.spec.ts:695](../../e2e/drag-and-drop.spec.ts#L695) (el test), [task-move.ts:313-338](../../apps/web/src/lib/task-move.ts#L313-L338) (`onDragOver` y `onDragMove`) y [board-order.ts:93-94](../../apps/web/src/lib/board-order.ts#L93-L94).
- **Medido en la suite:** 15 cambios de orden en `chromium` y 2 en `webkit`, en 500 ms; el máximo es 1.
- **Medido (sonda):** «Corta uno» (62,5 px) sobre un título de 200 caracteres (242,5 px), en una malla de 2 px con un temblor de ±1 px. Solo hay cambios a estas alturas desde el borde superior de la tarjeta larga, en 300 ms:

| Altura | `chromium` | `webkit` |
|---|---|---|
| 38 px | 10 | 17 |
| 120 px | 14 | 17 |
| 128 px | 12 | 16 |

- **Causa probable, por la lectura del código y por el cálculo, sin instrumentar:** en la misma columna, `onDragOver` lleva la tarjeta al índice de la de debajo sin mirar de qué lado está el centro (D-9), y `onDragMove` la devuelve al cruzar (D-20). Las franjas coinciden con las fronteras calculadas: el punto medio entre los dos centros antes del cambio queda a 39,9 px, y el mismo punto después del cambio, a unos 129 px. La de 120 px coincide con el centro de la tarjeta larga, a 121 px. T-041 midió que, con el puntero quieto, no cambia nada; aquí no se repitió.
- **Por qué importa:** con ese temblor, en esas franjas estrechas, las tarjetas saltan decenas de veces por segundo, y cuanto más altas, más se nota. No se ha medido con una mano real. **No se guarda nada mal:** al soltar se guarda lo que enseña el hueco (`commit(drag)`). Por eso, como fallo de producto, sería importante. Es bloqueante porque deja la suite en rojo, y T-041 exige verla en verde y dice «si oscila, parar y avisar».
- **Propuesta, a elegir** (es la decisión que T-041 tiene pendiente):
  1. **Corregirlo (recomendada):** en la misma columna, una sola regla: la tarjeta cambia de sitio solo cuando su centro cruza el de la de debajo, con `onDragOver` sin mover nada ahí. Cambia D-9 y D-20. Esta opción aún no se ha probado: hay que comprobar con ella CA-1.1, CA-2.1 y CA-2.5.
  2. **Aceptarlo:** anotarlo como riesgo en el plan, corregir D-9 y D-20, y cambiar o quitar el test, con la franja medida.

**B-2 · La fase 7 no está terminada.** Afecta a DoD y a T-037, que depende de T-040 a T-043.

- **Qué falta:** [tasks.md](tasks.md) tiene 39 de 43 tareas `[x]`. Sin hacer:
  - **T-041:** queda decidir B-1, RNF-002 tres veces (medido aquí, en verde), `pnpm test:e2e` en verde, D-9 en el plan y dos comentarios (M-2).
  - **T-042:** el anillo de foco (M-1).
  - **T-043:** limpieza de `plan.md` (M-6).
  - **T-037:** esta verificación no la cierra, porque no se han cumplido sus dependencias.
- **Propuesta:** decidir B-1, I-1 e I-2, cerrar el lote y lanzar otra verificación.

### Importantes

**I-1 · Con el dedo, soltar fuera justo al salir de la columna guarda el movimiento, si la tarjeta ya había pasado a esa columna.** Afecta a RF-005 y E-21, desde 768 px, en `chromium` y `webkit`. Sin test: la verificación anterior ya anotó que E-21 no tenía test con el dedo.

- **Dónde:** [task-move.ts:183-187](../../apps/web/src/lib/task-move.ts#L183-L187) (el oyente en `window`) y [task-move.ts:343](../../apps/web/src/lib/task-move.ts#L343) (`!releasedAt.current` guarda).
- **Qué pasa:** con la vista previa en otra columna, React crea otra tarjeta y quita la original. Los eventos táctiles siguen yendo al elemento donde empezó el toque, que ya no está en el documento, así que `touchend` no pasa por `window`. `releasedAt` se queda en `null`, y eso se trata como «soltó en una columna». Es el fallo que D-25 quiere evitar, y T-029 lo probó solo con ratón. Con el ratón no pasa, porque `mouseup` sí llega a `window`.
- **Medido (sonda):** llevar la tarjeta de To do a In progress, esperar a que se pinte allí, y hacer el último `touchmove` y `touchend` a la vez sobre el título.

| | `chromium` (CDP) | `webkit` (sintéticos) |
|---|---|---|
| `touchend` vistos en `window` | 0 de 6 | 0 de 6 |
| Se guardó en In progress | **6 de 6** | **6 de 6** |
| Con 500 ms antes de soltar | No se guarda | No se guarda |

  En una pasada sin soltar «a la vez» (`touchmove` y `touchend` seguidos), `webkit` también guardó, y `chromium`, no.
- **Por qué importa:** con un gesto rápido en una tablet, la tarea cambia de estado sin soltarla en ninguna columna y, si es Done, con la fecha real de fin de hoy. La ventana es estrecha, y se corrige arrastrando otra vez. Por eso no bloquea. Es el mismo tipo de fallo que el I-1 anterior: se guarda lo que la spec dice que no.
- **Propuesta:** escuchar también en el elemento donde empezó el toque (`active.activatorEvent.target`, como hace el propio sensor de dnd-kit), y añadir `003 E-21` con el dedo cambiando de columna. El requisito ya lo pide, así que no hace falta cambiar la spec.

**I-2 · Ordenar una columna no se puede hacer con un solo puntero sin arrastrar (WCAG 2.2, criterio 2.5.7, AA).** Afecta a RNF-001, RF-007 y C-20. Es una contradicción de la spec, no un fallo del código.

- **Dónde:** [spec.md:154](spec.md#L154) (RNF-001: WCAG 2.2 AA), [spec.md:208](spec.md#L208) (fuera de alcance: «Subir» y «Bajar»: «la alternativa con teclado es el asa») y [TaskCard.tsx:122](../../apps/web/src/components/TaskCard.tsx#L122) (desde la v2.0, un clic en el asa abre el detalle).
- **Qué dice el criterio:** «All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging», salvo que arrastrar sea esencial. La guía de la W3C aclara que una equivalencia de teclado no basta por sí sola, y pone como ejemplos un kanban y una lista ordenable con controles para subir y bajar (*Understanding SC 2.5.7*).
- **Qué se cumple y qué no:**
  - **Cambiar de columna:** sí tiene alternativa, el estado en el detalle (002/HU-4), aunque entra siempre la primera.
  - **Ordenar dentro de una columna:** no la tiene. Quien usa un solo puntero y no puede arrastrar (temblor, un conmutador, un puntero de cabeza) no puede ordenar.
- **Por qué no se había visto:** C-20 pide expresamente «una alternativa sin arrastre usable con teclado», y eso sí se cumple. axe no lo detecta, y el plan lo da por bueno sin citar este criterio.
- **Propuesta, a elegir con `/sdd-cambiar-spec`:**
  1. **Cumplirlo (recomendada):** añadir controles «Subir» y «Bajar» activables con clic o toque, en el detalle o en la tarjeta. Ya está en «Ideas sin priorizar».
  2. **Excepción por escrito:** acotar RNF-001 y anotarla en la comprobación de constitución del plan. Si es permanente, como enmienda de C-20, que es lo que pide la constitución. Queda una barrera conocida.

### Menores

**M-1 · De 768 a 1023 px, el anillo de foco del asa y la sombra de la tarjeta cogida se recortan.** Afecta a RNF-001, RNF-005, CA-3.1 y C-20. [BoardColumn.tsx:112](../../apps/web/src/components/BoardColumn.tsx#L112) y [TaskCard.tsx:118](../../apps/web/src/components/TaskCard.tsx#L118) no han cambiado desde la medida anterior (2,04 px donde el anillo necesita 4), y no se volvió a medir. **Propuesta:** T-042 para el anillo. La sombra sigue sin tarea por decisión del usuario.

**M-2 · `RemeasureOnPreview` está en el código y no en el plan.** Afecta a D-9, D-20 y T-041.

- [Board.tsx:32-41](../../apps/web/src/components/Board.tsx#L32-L41) entró en el commit de T-040 (`64f500f`) junto con el test en rojo, aunque es trabajo de T-041. El Registro de T-041 describe el cambio, pero no dice que ya esté en ese commit, que no tiene cuerpo y cuyo título solo habla del margen.
- [plan.md:378](plan.md#L378) (D-9, «Medidas») sigue diciendo solo `MeasuringStrategy.Always`, y [plan.md:440](plan.md#L440) (D-20) dice «Sin oscilación», que no es cierto (B-1).
- [task-move.ts:78](../../apps/web/src/lib/task-move.ts#L78) y [helpers.ts:182](../../e2e/helpers.ts#L182) repiten la idea antigua.
- **Propuesta:** corregirlo al cerrar T-041, que ya lo pide, y decidir allí si `Always` sigue haciendo falta.

**M-3 · Contraste de la capa en Safari, comprobado solo en parte.** Afecta a RNF-001, «❓ no verificable» sobre «Crear tarea».

- **Comprobado por el usuario (nota sin confirmar en `tasks.md`):** en Safari real y tema oscuro, sobre otra tarjeta, la capa se ve correcta. Fue a ojo y sin medir. Esta auditoría no lo ha repetido.
- **Sin mirar:** la capa sobre «Crear tarea», donde la segunda verificación midió 4,39:1 en el `webkit` de Playwright, frente a 7:1. Tampoco se sabe si Safari se comporta igual.
- **Propuesta:** mirarlo una vez sobre «Crear tarea» en Safari. Si se ve igual, subir la opacidad de la capa, como el respaldo de §6.3.

**M-4 · A 375 px, soltar sobre «Crear tarea» guarda el movimiento.** Afecta a RF-019 y CA-4.5. **Es una decisión, no un fallo claro.**

- **Dónde:** el botón va fijo encima de la columna ([Board.tsx:161](../../apps/web/src/components/Board.tsx#L161)), y `inVisibleColumn` mira solo el rectángulo.
- **Medido (sonda):** con 12 tarjetas, soltando sobre el botón, sin esperar y a los 300 ms, se guardó las 4 veces, 2 en `chromium` y 2 en `webkit`, en una posición que dependía de cuánto había avanzado el scroll automático (`index` 6, 7, 10 y 11).
- **Lectura:** RF-019 dice que soltar fuera de la columna cancela. Debajo del puntero está el botón, pero geométricamente está la columna. Además, ese borde es adonde hay que llevar la tarjeta para que la página haga scroll hacia abajo, así que cancelar ahí también tendría un coste. El hueco enseña dónde cae, y no se abre ningún diálogo.
- **Propuesta:** decidir qué debe pasar y escribirlo en RF-019. Si se deja como está, una línea en la spec basta; no hace falta tocar el código.

**M-5 · Tests de escrituras a la vez que pueden agotar los 5 s (M-2 anterior).** Afecta a D-2. Sin tarea por decisión del usuario, y la causa sigue sin confirmar. Aquí, `pnpm test` pasó una vez y sin E2E a la vez, lo que no añade información. **Propuesta:** no lanzar `pnpm test` y `pnpm test:e2e` a la vez.

**M-6 · Limpieza de documentos.**

- [plan.md](plan.md) §4.4 no lista `PrivateArea.tsx`, y §4.5 cita §9 para el icono de 16 px en vez de §11.3 (T-043).
- [roadmap.md](../roadmap.md) sigue con `actualizado: 2026-10-31` y su historial termina en la aprobación del plan: faltan las v2.0, v3.0 y v3.1 y las verificaciones. Se añaden al cerrar, según la decisión del usuario.

**M-7 · `/signup` sin hidratar en `webkit`, 4 de 200 (2 %).** Es M-7 de la 004, ya conocido, y no es de esta spec. Se anota porque obliga a tener `retries: 1` en `webkit`, y ese reintento puede hacer pasar un fallo real por *flaky*, como advirtió la verificación anterior. Sin propuesta nueva.

## Deriva spec ↔ código

| Spec o plan | Código | Acción |
|---|---|---|
| E-21, RF-005: soltar fuera al salir no guarda | Con el dedo, sí guarda tras cambiar de columna | I-1: corregir el código |
| RNF-001: WCAG 2.2 AA; §9: sin «Subir» ni «Bajar» | Ordenar solo arrastrando o con teclado | I-2: decidir, porque la spec se contradice |
| RF-019: soltar fuera de la columna cancela | Sobre «Crear tarea» fijo, guarda | M-4: decidir y escribirlo |
| D-9 y D-20: no oscila | Oscila en franjas estrechas, con tarjetas de distinta altura | B-1: decidir |
| D-9: solo `MeasuringStrategy.Always` | Además, `RemeasureOnPreview` | M-2: corregir el plan |

**Alcance:** sin código de más, salvo que `RemeasureOnPreview` todavía no está en el plan (M-2); se traza a RF-011 y T-041. No hay nada de «Fuera de alcance» implementado. Todo lo de «Fuera de alcance» está ya en «Ideas sin priorizar» del roadmap.

**Plan:** D-23 a D-31 se corresponden con el código, salvo lo de M-2. D-25 no cumple lo que dice con el dedo (I-1).

## Constitución

| Artículo | Veredicto | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any` |
| C-2 | ✅ | `@dnd-kit/core` 6.3.1 fijada y justificada (plan §2, R-1) |
| C-4 | ✅ | `drag` y `landing` sin datos del servidor; `useTasks` con TanStack Query |
| C-5 | ✅ | Migración nueva; ninguna aplicada se ha tocado |
| C-7 | ✅ | `/api/tasks/:id/move`, relativa |
| C-8 | ✅ | Rutas → service → repository; `$queryRaw` y Prisma solo en el repository |
| C-9 | ✅ | Sin códigos nuevos; el texto lo decide el front |
| C-10 | ✅ | `moveTaskInputSchema` y `actualEndDateAfterMove` en `shared`, sin duplicar |
| C-11 | ✅ | `today` como `YYYY-MM-DD` |
| C-13 | ✅ | Tarea ajena → 404 `TASK_NOT_FOUND`, con test de `move`, y el orden del dueño no cambia |
| C-14 | ✅ | `validateTaskId` y `validateBody(moveTaskInputSchema)` |
| C-16 | ✅ | `position` no se expone |
| C-17 | ✅ | Cada RF tiene test. E-21 con el dedo, no (I-1) |
| C-18 | ✅ | Vitest, Supertest con Postgres real y Playwright |
| C-19 | ✅ | `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e`, que C-19 no nombra, en rojo (B-1) |
| C-20 | ⚠️ | Alternativa de teclado completa. **WCAG 2.2 AA no se cumple en 2.5.7 (I-2)**, sin excepción escrita; anillo cortado (M-1) |
| C-21 | ✅ | Sin nada fuera de la spec |
| C-22 | ✅ | `placeTask` y `makeRoom` con varios usos |
| C-23 | ✅ | Identificadores en inglés y textos en castellano |
| C-24 | ⚠️ | Formato correcto, pero `64f500f` mezcla T-040 con trabajo de T-041 y no lo dice (M-2) |
| C-25 | ✅ | `pnpm lint` sin errores |
| C-26 | ⚠️ | X-1 y X-2 justificadas; sombra recortada (M-1) y contraste en Safari sin comprobar del todo (M-3) |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ❌ | 39 de 43: faltan T-037, T-041, T-042 y T-043 (B-2) |
| Cada RF y CA con test que pasa | ⚠️ | 62/62 con test. `003 RF-007 D-9` falla (B-1) |
| Cada caso límite implementado y probado | ⚠️ | E-21 con el dedo, sin test y sin cumplir (I-1); E-19, manual |
| Sin código que no se trace | ✅ | `RemeasureOnPreview` se traza a T-041, abierta |
| Tests, linter y tipos en verde | ❌ | `pnpm test`, `lint` y `typecheck`, sí; `pnpm test:e2e`, no (B-1). El repositorio no tiene CI |
| Sin `console.log`, código comentado ni TODO | ✅ | |
| Accesibilidad revisada | ⚠️ | Automática. I-2, M-1 y M-3 abiertos; sin lector real (D-22) |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ❌ | I-1, I-2 y M-4 |
| Desviaciones anotadas en el plan | ❌ | D-9 y D-20 (M-2) |
| ADRs si hubo decisiones transversales | ✅ | No hubo; el plan no los pide |
| Estado de la spec → `implementada` | ⏳ | Sigue en `en-implementacion` |
| PR con spec, requisitos e informe | ⏳ | Pendiente |
| Revisada y aprobada | ⏳ | Pendiente |
