# Verificación · Spec 003 · 2026-11-01 (quinta)
Resultado: **APTO CON OBSERVACIONES**

## Resumen

- **Lo esencial:** no hay bloqueantes. Ratón, dedo, teclado y «Subir» y «Bajar» cumplen la spec v5.0 en sus flujos normales y en los casos de error que pide. Los dos importantes y los menores M-1, M-2 y M-6 de la cuarta verificación están resueltos.
- **Por qué no es APTO:** quedan dos importantes.
  - **I-1:** `pnpm test` falla de vez en cuando, y sigue sin saberse por qué. Un test de escrituras a la vez que suele tardar 45 ms superó los 5 s, sin E2E en marcha. Eso desmiente el supuesto del riesgo aceptado en el plan §8 y no descarta un bloqueo en código de producción (D-2).
  - **I-2:** el aviso de error del diálogo sale arriba, y no se ve si el diálogo está desplazado. Afecta a CA-5.9 solo con el diálogo desplazado, pero a «Guardar cambios» de la 002 en los cuatro tamaños medidos. El usuario no ve ninguna señal de que no se ha guardado. Es un defecto de la 002 que no se detectó antes, no de esta spec.
- **Menores nuevos:** tres desviaciones en casos raros (M-1 a M-3). Ninguna pierde datos, y la lista se corrige sola al volver a pedirse.
- **Recomendación:** el núcleo de la spec está listo y no veo motivo para otra ronda completa. Antes de cerrar, decide I-1 e I-2. Lo que menos cuesta y más protege es I-2: un solo efecto en `TaskDialog` lo resuelve también para la 002.
- **Independencia:** auditoría en una sesión nueva, sin haber escrito el código, sobre `d4bd677` con el árbol limpio. Se volvió a ejecutar todo y se leyó el código de producción de `main...HEAD`.
- **Alcance revisado:** `spec.md` v5.0, `plan.md` (hasta D-38), `tasks.md` (52/53), constitución v1.1 y `DESIGN.md` 1.5.0-todo.1. Sustituye al informe de la cuarta verificación, que sigue en el historial de git (`2688bb0`).

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ⚠️ 40 ficheros y 943 tests en verde en 20 de 21 pasadas. **1 fallo** por tiempo agotado (I-1) |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores y 5 sugerencias (`hints`) de Astro |
| `pnpm test:e2e` (4 ficheros × `chromium`, `chrome`, `webkit`) | ✅ Código 0: 414 pasan, 46 saltados (`chrome` 40, `webkit` 6) y 2 «flaky» en `webkit`. Los 2 fallan en `signup` (M-6) y pasan al reintentar |
| Trazabilidad | ✅ 111/111 IDs con al menos un test cuyo título empieza por `003 `. El ID 112, E-19, es manual y aquí se probó de verdad |
| `webkit`, sin reintentos, ×10: `003 CA-5.12` a `CA-5.14`, `E-25`, `E-26`, los `D-38`, `CA-2.5`, `RF-007 D-9` y `E-21` | ✅ 166 de 170 pasan. Los 4 fallos son de `signup` (2,4 %). **0 fallos reales** |
| RNF-002 entre columnas, 3 veces | ✅ 22,3 / 19 / 21,7 ms |
| RNF-002 reordenando en la columna de 200, 3 veces | ✅ 22 / 22,2 / 45,3 ms |
| Cambio de vista previa con 200 tarjetas (sin límite en la spec) | 35,9 / 36,8 / 36,5 ms |
| E-19, con datos reales | ✅ En una base temporal, ya borrada: migraciones de la 001 y la 002, 200 tareas de 2 usuarios con `createdAt` repetidos y la migración `task_position`. **0 tareas cambian de orden**, 0 posiciones repetidas, índice sustituido y sin valor por defecto. La migración solo tiene un commit |
| Restos | ✅ Sin `console.log`, `TODO`, `FIXME`, `any` ni `style=` en los ficheros de producción de la spec |

**Sondas temporales.** Para lo que la suite no cubre se ejecutaron dos ficheros E2E en `chromium` y `webkit`, fuera del repositorio. En este informe, «sonda» significa que la evidencia sale de ahí y que **ningún test del repositorio la protege**.

**Comprobado por sonda, sin problemas:**

- E-4 hacia arriba: `scrollTop` de 1836 a 0. E-5 hacia la izquierda: `scrollLeft` de 760 a 0 (ver M-5).
- Control de M-1: con otra tarea que sigue existiendo, el foco va a «Crear tarea» como pide la spec.

**Límites de esta auditoría:**

- Los anuncios se comprueban por el texto de la región viva, no por lo que dice un lector de pantalla (D-22, riesgo aceptado). El riesgo de D-24 tampoco se puede descartar.
- El arrastre con el dedo se comprueba con emulación táctil, como pide RNF-004. En `webkit` usa eventos sintéticos (D-17). No se ha probado en un móvil real.
- La checklist §21 no se repitió: T-050 a T-053 no cambian lo visual.
- Sin Safari real: ver M-4.
- La causa de I-1 no se ha encontrado.

### Problemas de la verificación anterior

| Problema | Estado | Comprobación |
|---|---|---|
| I-1 (sin aviso con el diálogo cerrado) | ✅ Resuelto | D-36, RF-029, CA-5.13, CA-5.14, E-25 y E-26, con tests unitarios y E2E. Queda un caso cercano en M-3 |
| I-2 (pulsar con un guardado en camino) | ✅ Resuelto | D-37, RF-028, CA-5.12. `003 CA-5.12` pasa, también ×10 en `webkit` |
| M-1 (anillo del botón inactivo) | ✅ Decidido | Riesgo aceptado por el usuario en el plan §8. No se volvió a medir |
| M-2 (foco tras el clic en `webkit`) | ✅ Resuelto | D-38. `003 RF-027 D-38` y `003 RF-028 D-38` pasan |
| M-3 (capa sobre «Crear tarea» en `webkit`) | ⚠️ Abierto | M-4 de este informe |
| M-4 (escrituras a la vez y sombra) | ⚠️ En parte | La sombra es riesgo aceptado (plan §8). El cuelgue pasa a I-1 de este informe, porque ya no vale lo que se aceptó |
| M-5 (`/signup` sin hidratar) | ⚠️ Conocido | M-6 de este informe. Es de la 004 |
| M-6 (documentos) | ✅ Resuelto | Comprobados `measuring`, los dos comentarios y el roadmap. Quedan otros restos en M-7 |
| M-7 (un commit con cinco tareas) | ✅ Anotado | Consta en el Registro, y se repite con `a43d380`: M-7 de este informe |

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. Todos los tests citados pasan en esta ejecución. Abreviaturas de la columna «Test»: `e2e` = `e2e/drag-and-drop.spec.ts`; `move` = `apps/api/test/tasks.move.test.ts`; `list`, `create`, `update` = `apps/api/test/tasks.*.test.ts`; `service` = `tasks.service.test.ts`; `Board`, `TaskCard`, `BoardColumn`, `PrivateArea`, `TaskDialog`, `Button` = `apps/web/src/components/*.test.tsx`; `order` = `lib/board-order.test.ts`; `queries` = `lib/task-queries.test.tsx`; `messages` = `lib/task-messages.test.ts`; `tokens` = `styles/tokens.test.ts`; `shared` = `packages/shared/src/tasks.test.ts`.

### Requisitos funcionales

| ID | Código | Test | Veredicto |
|---|---|---|---|
| RF-001 | `task-move.ts` `commit`; `tasks.service.moveTask`; `task.repository.moveTaskOfUser` | `move`, `Board`, `order`, `e2e` | ✅ |
| RF-002 | `Board.tsx` `DragOverlay`; `TaskCard.tsx` variantes | `BoardColumn`, `TaskCard`, `e2e` | ✅ |
| RF-003 | `shared` `actualEndDateAfterMove`; `today = todayLocal()` | `service`, `move`, `Board`, `queries`, `e2e`, `shared` | ✅ |
| RF-004 | Ídem | `service`, `move`, `Board`, `queries`, `e2e`, `shared` | ✅ |
| RF-005 | `onDragOver`, `onDragCancel`, `inVisibleColumn` (D-31), `touchend` en el origen (D-33) | `e2e` (CA-1.7, D-31, E-21, D-33, CA-4.5) | ✅ |
| RF-006 | `TaskCard.tsx` botón de abrir y `event.detail` en el asa; `MouseSensor` `distance: 5` | `TaskCard`, `e2e` | ✅ |
| RF-007 | `makeRoom`; `stepPlacement`; `placementFromOver` con `below`; `RemeasureOnPreview` | `service`, `move`, `Board`, `TaskDialog`, `order`, `e2e` | ✅ |
| RF-008 | `columnOrder` en `findTasksByUser` | `list`, `e2e` | ✅ |
| RF-009 | `createTask` con `makeRoom(backlog, 0)` | `create` | ✅ |
| RF-010 | `updateTask` con `toTop` | `list`, `update`, `TaskDialog` | ✅ |
| RF-011 | `commit` con `samePlacement`; `RemeasureOnPreview` | `Board`, `order`, `e2e` | ✅ |
| RF-012 | `TaskCard.tsx` asa | `TaskCard`, `e2e` | ✅ |
| RF-013 | `clickHandle`; `pickedText` | `Board`, `TaskCard`, `messages`, `e2e` | ✅ |
| RF-014 | `keyDownOnHandle`; `stepPlacement`; `movedText` | `Board`, `order`, `messages`, `e2e` | ✅ |
| RF-015 | `stepPlacement` devuelve `undefined` | `Board`, `order` | ✅ |
| RF-016 | `clickHandle`; `focusedHandle`; `droppedText` | `Board`, `messages`, `e2e` | ✅ |
| RF-017 | `cancel`; `leaveHandle` en diferido | `Board`, `messages`, `e2e` | ✅ |
| RF-018 | `TouchSensor` `{ delay: 250, tolerance: 5 }` | `e2e` (CA-4.2 sin `webkit`, R-6) | ✅ |
| RF-019 | Columnas ocultas sin medidas (D-13); `inVisibleColumn` (D-35) | `e2e`, con ratón y con el dedo | ✅ |
| RF-020 | `useMoveTask.onMutate`; `landing` | `TaskDialog`, `queries`, `e2e` | ✅ |
| RF-021 | `onError`; `onSettled` sin esperar (D-29); `moveErrorText`; `handleMoveFailedAfterClose` (D-36) | `Board`, `messages`, `queries`, `e2e` con la API caída | ⚠️ Si «Subir» falla y después «Guardar cambios» cierra el diálogo, el aviso se pierde (M-3) |
| RF-022 | `onError` con `isTaskNotFound`; `onTaskGone` (D-26) | `move`, `Board`, `messages`, `queries`, `e2e` con borrado real | ⚠️ Foco en `BODY` si la lista se queda vacía al llegar (M-1) |
| RF-023 | `onMobileColumn` (D-13, D-26) | `Board`, `e2e` | ✅ |
| RF-024 | `scrollIntoView` (D-23); `max-md:scroll-pb-24` | `e2e` | ✅ |
| RF-025 | `PrivateArea` por `tasks.data` (D-30) | `PrivateArea`, `e2e` | ✅ |
| RF-026 | Bloque de posición en `TaskDialog.tsx`; `movedText`; `aria-live="polite"` | `TaskDialog`, `e2e` | ✅ |
| RF-027 | `moveWithinColumn`; `useTaskForm` sin tocar; `onClick` del contenedor (D-38) | `TaskDialog`, `e2e` | ⚠️ Al cerrar y volver a abrir la misma tarea, otra pulsación sí sale (M-2) |
| RF-028 | `stepTo`; `Button` `inactive`; `MOVE_NEEDS_SAVE`; `saving` (D-37) | `Button`, `TaskDialog`, `messages`, `e2e` | ✅ Anillo poco visible, riesgo aceptado (plan §8) |
| RF-029 | `.catch` de `mutateAsync`; `kind: 'notFound'`; `onMoveFailedAfterClose`; `deletedByUser` | `TaskDialog`, `queries`, `e2e` | ⚠️ El aviso sale en el diálogo, pero no siempre se ve (I-2). Foco en `BODY` con la lista vacía (M-1) |

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
| CA-1.9 | `Board`, `e2e` | ✅ |
| CA-1.10 | `Board`, `e2e` con borrado real | ✅ |
| CA-1.11 | `TaskCard`, `e2e` | ✅ |
| CA-1.12 | `e2e` con `**/api/**` abortado | ✅ |
| CA-2.1 | `move`, `e2e` | ✅ |
| CA-2.2 | `list`, `e2e` (otro contexto de navegador) | ✅ |
| CA-2.3 | `create` | ✅ |
| CA-2.4 | `update` | ✅ |
| CA-2.5 | `Board`, `e2e`; ×10 en `webkit` | ✅ |
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
| CA-3.11 | `e2e` a 1280 × 900, 1280 × 720, 768 y 375 | ✅ |
| CA-3.12 | `Board`, `e2e` con borrado real | ✅ Con otras tareas en el tablero, como dice el criterio. Ver M-1 |
| CA-3.13 | `Board`, `e2e` con `…/move` y con toda la API abortados | ✅ |
| CA-4.1 | `e2e`, en los tres proyectos | ✅ |
| CA-4.2 | `e2e`, en `chromium` y `chrome` (R-6) | ✅ En `webkit`, sin prueba |
| CA-4.3 | `e2e`, en los tres proyectos | ✅ |
| CA-4.4 | `e2e`, en los tres proyectos | ✅ |
| CA-4.5 | `e2e`, en los tres proyectos | ✅ |
| CA-4.6 | `e2e`, en los tres proyectos | ✅ |
| CA-4.7 | `e2e`, con ratón y con el dedo, columna larga y corta | ✅ |
| CA-5.1 | `TaskDialog` | ✅ |
| CA-5.2 | `TaskDialog`, `e2e` con volver a cargar | ✅ |
| CA-5.3 | `TaskDialog`, `e2e` con toque a 375 | ✅ |
| CA-5.4 | `TaskDialog`, `e2e` con Enter y con Espacio | ✅ |
| CA-5.5 | `Button`, `TaskDialog`, `e2e` `003 RF-028 D-38` | ✅ Anillo poco visible, riesgo aceptado (plan §8) |
| CA-5.6 | `TaskDialog` | ✅ |
| CA-5.7 | `TaskDialog` | ✅ |
| CA-5.8 | `TaskDialog`, `messages`; `e2e` con axe | ✅ |
| CA-5.9 | `TaskDialog`, `e2e` | ⚠️ Cumple desde arriba del todo. Con el diálogo desplazado, el aviso no se ve (I-2) |
| CA-5.10 | `TaskDialog`, `e2e` con borrado real | ✅ Con otras tareas en el tablero. Ver M-1 |
| CA-5.11 | `TaskDialog` | ✅ |
| CA-5.12 | `TaskDialog`, `e2e` con el `PUT` retenido; ×10 en `webkit` | ✅ |
| CA-5.13 | `TaskDialog`, `e2e` con la red abortada; ×10 en `webkit` | ✅ |
| CA-5.14 | `TaskDialog`, `e2e` con borrado real, última tarea y otro foco; ×10 en `webkit` | ✅ Ver M-1 |

### Requisitos no funcionales

| ID | Evidencia | Veredicto |
|---|---|---|
| RNF-001 | Cumple: axe sin infracciones (AA y AAA de texto) con la tarjeta cogida, en pleno arrastre y con el detalle abierto, en los dos temas; `tokens` ≥ 3:1; asa de 44 y 32 px; movimiento reducido; WCAG 2.5.7 con «Subir» y «Bajar» y el estado del detalle. **Parcial:** foco en `BODY` (M-1) y botón con foco fuera de la vista tras el aviso (I-2). **❓** La capa sobre «Crear tarea» en Safari (M-4). Anillo del botón inactivo, riesgo aceptado | ⚠️ |
| RNF-002 | `e2e` en `chromium`: entre columnas, 22,3 / 19 / 21,7 ms; en la columna de 200, 22 / 22,2 / 45,3 ms, frente a ≤ 100 ms | ✅ |
| RNF-003 | `move`, `update`, `service`: tarea ajena → 404, y el orden de su dueño no cambia | ✅ |
| RNF-004 | Tres proyectos, con emulación táctil (D-17). `chrome` se salta los 40 tests que el plan limita a `chromium` y `webkit` o a `chromium`, y CA-4.2 no corre en `webkit` (R-6) | ✅ |
| RNF-005 | `tokens`, `design-rules.test`, `TaskCard` (D-27). Sombra de la tarjeta cogida recortada, riesgo aceptado (plan §8), sin volver a medir | ✅ |

### Casos límite

| ID | Test | Veredicto |
|---|---|---|
| E-1 | `order`, `e2e` | ✅ |
| E-2 | `Board` | ✅ |
| E-3 | `Board`, `order` | ✅ |
| E-4 | `e2e` (`chromium`), hacia abajo; hacia arriba, solo sonda (M-5) | ✅ |
| E-5 | `e2e` (`chromium`), hacia la derecha, y `003 E-5 D-31`; hacia la izquierda, solo sonda (M-5) | ✅ |
| E-6 | `TaskCard`, `e2e` | ✅ |
| E-7 | `Board`, `e2e` | ✅ |
| E-8 | `Board`, `TaskDialog` (`location.replace`) | ✅ |
| E-9 | `move`, `Board` | ⚠️ Foco en `BODY` si la lista se queda vacía al llegar (M-1) |
| E-10 | `service`, `move` | ✅ |
| E-11 | `move` (en serie y a la vez) | ✅ Sin posiciones repetidas. La prueba a la vez es intermitente (I-1) |
| E-12 | `Board`, `queries` | ✅ |
| E-13 | `Board` | ✅ |
| E-14 | `Board` | ✅ |
| E-15 | `service`, `move`, `shared` | ✅ |
| E-16 | `Board`, `shared` | ✅ |
| E-17 | `e2e` | ✅ |
| E-18 | `e2e` | ✅ |
| E-19 | Manual: migración real en una base temporal, 0 tareas cambian de orden | ✅ |
| E-20 | `messages` | ✅ |
| E-21 | `e2e`, con ratón y con el dedo; ×10 en `webkit` | ✅ |
| E-22 | `PrivateArea`, `e2e` | ✅ |
| E-23 | `TaskDialog` | ✅ |
| E-24 | `TaskDialog` | ✅ |
| E-25 | `TaskDialog`, `e2e`; ×10 en `webkit` | ✅ |
| E-26 | `TaskDialog`, `queries`, `e2e`; ×10 en `webkit` | ✅ |

## Problemas

### Bloqueantes

Ninguno.

### Importantes

**I-1 · `pnpm test` falla de vez en cuando en las escrituras a la vez, y no se sabe por qué.** Afecta a C-19, a la DoD y, si fuera un bloqueo real, a D-2, RF-009 y E-11. Es lo que T-051 y T-053 dejaron para esta verificación.

- **Medido:**

| Tanda | Pasadas | Fallos |
|---|---|---|
| `pnpm test` antes de la E2E completa | 1 | 0 |
| `pnpm test` después de la E2E completa | 5 | 0 |
| E2E corta y justo después `pnpm test` | 3 | **1** |
| E2E corta y justo después la suite con `--testTimeout=40000`, midiendo Postgres | 12 | 0 |
| E2E corta y justo después solo el proyecto `api` | 6 | 0 |

- **El fallo, ahora con la salida:** `003 RF-009 D-2 creaciones a la vez no repiten posición` ([tasks.create.test.ts:133](../../apps/api/test/tasks.create.test.ts#L133)), `Test timed out in 5000ms`. No es el de T-051 y T-053 (`003 E-11 D-2`, [tasks.move.test.ts:265](../../apps/api/test/tasks.move.test.ts#L265)), pero las dos pruebas hacen lo mismo: varias transacciones a la vez con `lockUser`.
- **Por qué importa:** esa prueba tarda 43–47 ms en todas las demás pasadas medidas, así que no es lentitud corriente. Con T-053 ya van 3 fallos conocidos. **El plan §8 lo acepta «si `pnpm test` y `pnpm test:e2e` se lanzan a la vez» ([plan.md:695](plan.md#L695)), y aquí la E2E ya había terminado**, así que ese riesgo aceptado no lo cubre.
- **Lo que no se sabe:** no se ha visto el bloqueo por dentro, porque la tanda con Postgres muestreado no volvió a caer. Sin evidencia a favor ni en contra quedan un bloqueo en `$transaction` con el adaptador `pg`, Postgres o la red de Docker. Por el código no se ve un interbloqueo: solo se bloquea la fila de `User`, y Postgres lo cortaría con un error, no con una espera. Si fuera real, el usuario vería como mucho un movimiento o una creación que tarda; el movimiento acabaría en el aviso de RF-021. No se ve riesgo de corromper el orden.
- **Propuesta, a elegir:**
  1. Una tarea corta: dejar el muestreo de `pg_stat_activity` y la salida en un script y repetir hasta que caiga. Es la única forma de saberlo.
  2. Aceptarlo con el dato nuevo: corregir la fila del plan §8 para decir que también ocurre en serie, que la causa es desconocida y que hay que reejecutar `pnpm test` si cae ahí. Barato, pero C-19 deja de ser una señal limpia.

**I-2 · El aviso de error del diálogo no se ve con el diálogo desplazado.** Afecta a RF-029 y CA-5.9 y, sobre todo, a 002/RF-028. **Nuevo.** Sin test: `toBeVisible` de Playwright no mira si está fuera del área de scroll.

- **Dónde:** [TaskDialog.tsx:252-254](../../apps/web/src/components/TaskDialog.tsx#L252-L254). La alerta va arriba del formulario, y nada la trae a la vista. El diálogo mide unos 1100 px, así que casi siempre tiene scroll. El aviso está dentro del diálogo, como pide la spec, y `role="alert"` lo anuncia al lector, pero quien mira la pantalla no lo ve.
- **Medido (sonda), en px desde arriba de la ventana. Los números son de `chromium`, y `webkit` da lo mismo con ±1 px:**

| Ventana | Borde superior del diálogo | «Guardar cambios» falla: aviso en | «Subir» falla, sin desplazar: aviso en | «Subir» falla: botón con el foco en (borde inferior del diálogo) |
|---|---|---|---|---|
| 375 × 667 | 53 | **−355 a −253, no se ve** | 147 a 249, se ve | **744 a 788 (667), fuera de la vista** |
| 375 × 812 | 65 | **−210 a −108, no se ve** | 159 a 261, se ve | 756 a 800 (812), se ve |
| 1280 × 720 | 18 | **−316 a −241, no se ve** | 104 a 179, se ve | **668 a 712 (702), cortado** |
| 1280 × 900 | 18 | **−136 a −61, no se ve** | 104 a 179, se ve | 668 a 712 (882), se ve |

  Con «Subir» y el diálogo desplazado para tener el botón arriba, el aviso queda en −187 a −85 a 375 × 667 (`chromium`) y tampoco se ve.
- **Por qué importa:**
  - **En la 002, siempre:** para pulsar «Guardar cambios» hay que bajar, así que si falla el botón vuelve a su texto y no se ve nada. El usuario puede creer que el diálogo se ha quedado colgado, y no se entera de por qué. No se pierde lo escrito, porque el diálogo sigue abierto. Se midió sobre esta rama: el código del aviso viene de 002/D-20, y «Subir» y «Bajar» añaden algo de altura. No se midió en `main`.
  - **En esta spec:** solo con el diálogo desplazado. El texto de la posición vuelve al de antes, sin explicación visible. Y al aparecer el aviso, empuja el botón con el foco fuera de la vista a 375 × 667 y lo corta a 1280 × 720 (C-20).
- **Propuesta:** un efecto que, cuando aparece `actionError`, haga `scrollIntoView({ block: 'nearest' })` sobre la alerta, con su test comprobando el rectángulo contra el del diálogo. Son pocas líneas y lo arregla todo menos el foco, que se queda fuera de la vista hasta la siguiente tecla. Como es defecto de la 002, decide si entra aquí con `/sdd-cambiar-spec` o en una spec aparte. **Yo lo arreglaría aquí:** la frase de RF-029 no cambia de sentido y no merece una spec propia.

### Menores

**M-1 · El foco se pierde si, al llegar el 404, la lista se queda vacía después.** Afecta a RF-022, RF-029, CA-5.14, E-9 y C-20. Es el hallazgo de T-050 que quedó para esta verificación. **Confirmado.** Sin test.

- **Dónde:** [Board.tsx:196](../../apps/web/src/components/Board.tsx#L196) y [Board.tsx:208](../../apps/web/src/components/Board.tsx#L208). El foco va al «Crear tarea» de la cabecera; al llegar la lista vacía, ese botón se desmonta y aparece otro en el estado vacío, sin foco.
- **Medido (sonda):** con 2 tareas borradas en otra pestaña, tras «Subir» en el detalle y tras soltar con teclado: foco en `BODY`, en `chromium` y `webkit`. Con otra tarea que sigue existiendo: en «Crear tarea».
- **Por qué es menor:** hace falta que en otra pestaña se hayan borrado todas las demás tareas. El aviso sale, y solo se pierde la posición del teclado.
- **Propuesta:** que `Board` devuelva el foco a `createRef` si `empty` pasa a ser cierto y el foco se ha perdido. Un test con 2 tareas borradas. O aceptarlo y anotarlo en el plan §8.

**M-2 · Al cerrar y volver a abrir la misma tarea, otra pulsación sí sale con el movimiento en camino.** Afecta a RF-027 («otra pulsación no hace nada»). **Nuevo.** Sin test.

- **Dónde:** [TaskDialog.tsx:210](../../apps/web/src/components/TaskDialog.tsx#L210). `moveTask.isPending` es de esa instancia del diálogo, y la nueva empieza sin nada en camino.
- **Medido (sonda):** «Subir», «Cancelar», reabrir y «Bajar»: 2 peticiones `…/move` a la vez. Abortadas las dos, el orden queda el de antes, con un aviso en el tablero y otro en el diálogo, en `chromium` y `webkit`.
- **Por qué es menor:** requiere un servidor lento y tres gestos seguidos. Lo que pinte un `from` viejo lo corrige la lista al volver a pedirse (`onSettled`).
- **Propuesta, a elegir:** acotar RF-027 a «en ese diálogo», sin código; o mirar con `useIsMutating` si hay un movimiento en camino de esa tarea.

**M-3 · Si «Subir» falla con «Guardar cambios» en camino, el aviso desaparece al cerrarse el diálogo.** Afecta a RF-021 y RF-029. **Nuevo**, el caso que le quedaba a I-1 de la cuarta verificación. Sin test.

- **Dónde:** el aviso se lee de `moveTask.isError` ([TaskDialog.tsx:96](../../apps/web/src/components/TaskDialog.tsx#L96)), y `onSuccess` de guardar cierra sin mirarlo ([TaskDialog.tsx:165](../../apps/web/src/components/TaskDialog.tsx#L165)). `onMoveFailedAfterClose` solo se llama si el fallo llega con el diálogo ya cerrado.
- **Medido (sonda):** título cambiado, «Subir», «Guardar cambios», el movimiento se aborta y luego el `PUT` va bien. El aviso se ve dentro del diálogo mientras dura el `PUT`. Después el diálogo se cierra, el título se guarda, la tarjeta vuelve a su sitio y **no queda ningún aviso**, en `chromium` y `webkit`.
- **Por qué es menor:** hace falta que falle el movimiento y no el guardado, por ejemplo con un 500. Con la red caída fallan los dos y el diálogo sigue abierto, con el error de guardar.
- **Propuesta:** en `onSuccess` de guardar, si `moveTask.isError`, llamar a `onMoveFailedAfterClose`. O aceptarlo y anotarlo en D-36.

**M-4 · La capa sobre «Crear tarea» en `webkit`: el botón se transparenta.** Afecta a RNF-001. Es M-3 de la cuarta verificación. **No se volvió a medir** y sigue sin Safari real, así que es ❓. Dura lo que el arrastre, y D-35 lo da por consecuencia aceptada. **Propuesta:** mirarlo una vez en Safari real. Si se ve igual, subir la opacidad de la capa, como el respaldo de §6.3.

**M-5 · E-4 y E-5 solo tienen test en un sentido.** La spec pide «inferior o superior» y «derecho o izquierdo», y [e2e/drag-and-drop.spec.ts:1987](../../e2e/drag-and-drop.spec.ts#L1987) y [:2009](../../e2e/drag-and-drop.spec.ts#L2009) solo prueban abajo y a la derecha. Por sonda funcionan los otros dos (ver el Resumen). **Propuesta:** dos tests, que son casi copiar los que hay.

**M-6 · `/signup` sin hidratar en `webkit`.** Es M-7 de la 004, ya conocido, y no es de esta spec: 2 «flaky» en la suite y 4 de 170 sin reintentos (2,4 %), todos en `signup`. Se anota porque obliga a tener `retries: 1` en `webkit`, y ese reintento podría esconder un fallo real. Sin propuesta nueva.

**M-7 · Restos en documentos.** Sin efecto en el comportamiento.

- [plan.md:579](plan.md#L579): RF-029 dice que CA-5.13 y CA-5.14 se prueban en `Board.test`, y están en `TaskDialog.test.tsx`, como explica el Registro de T-050. T-050 también lista `Board.test.tsx` en sus ficheros, y no cambió.
- [plan.md:695](plan.md#L695): el riesgo aceptado se queda corto (I-1).
- [tasks.md:722-725](tasks.md#L722-L725): T-050 a T-053 siguen sin hash (`a43d380` y `d4bd677`). Según [tasks.md:28](tasks.md#L28), se anotan al empezar la siguiente tarea.
- `a43d380` junta T-050, T-051 y T-052, contra «un commit por tarea» ([tasks.md:28](tasks.md#L28)). El mensaje las nombra, así que se sigue la pista. Arreglarlo exigiría reescribir el historial.
- [plan.md:6](plan.md#L6): `aprobado: 2026-10-31`, aunque el plan se ha cambiado hasta la v5.0 con las decisiones del usuario. La spec sí anota la fecha de su v5.0.

## Deriva spec ↔ código

| Spec o plan | Código | Acción |
|---|---|---|
| RF-022, RF-029: «el foco DEBE pasar a Crear tarea» | En `BODY` si la lista se queda vacía después | M-1: corregir o aceptar |
| RF-027: «otra pulsación no hace nada» | Al reabrir el detalle, otra pulsación sale | M-2: corregir o acotar la spec |
| RF-021: aviso al fallar | Se pierde si guardar cierra el diálogo después | M-3: corregir o aceptar en D-36 |
| RF-029, 002/RF-028: mostrar el aviso en el diálogo | Sale, pero fuera de la vista con el diálogo desplazado | I-2: corregir |
| Plan §8: el cuelgue, solo con las dos órdenes a la vez | También en serie | I-1: investigar o corregir el plan |
| D-35: «`webkit` midió 4,39:1» como consecuencia aceptada | Se transparenta en `webkit`, sin mirar en Safari real | M-4: decidir tras mirarlo |

**Alcance:** sin código de más; lo nuevo desde la cuarta verificación se traza a RF-028, RF-029, D-36, D-37 y D-38. No hay nada de «Fuera de alcance» implementado. Los 11 puntos de la §9 de la spec están en «Ideas sin priorizar» del roadmap.

**Plan:** D-36 a D-38 se corresponden con el código. La comprobación del asa de D-36 está anotada. Los restos, en M-7.

## Constitución

| Artículo | Veredicto | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any` |
| C-2 | ✅ | `@dnd-kit/core` 6.3.1 fijada y justificada (plan §2, R-1). Sin dependencias nuevas desde entonces |
| C-4 | ✅ | `drag` y `landing` sin datos del servidor; el diálogo saca la posición de la lista en cada render (D-34) |
| C-5 | ✅ | Migración nueva con un solo commit; ninguna aplicada se ha tocado |
| C-7 | ✅ | `/api/tasks/:id/move`, relativa |
| C-8 | ✅ | Rutas → service → repository; Prisma solo en los repositories |
| C-9 | ✅ | Sin códigos nuevos; el texto lo decide el front |
| C-10 | ✅ | `moveTaskInputSchema` y `actualEndDateAfterMove` en `shared`, sin duplicar |
| C-11 | ✅ | `today` como `YYYY-MM-DD` |
| C-13 | ✅ | Tarea ajena → 404 `TASK_NOT_FOUND`, con test de `move`, y el orden del dueño no cambia |
| C-14 | ✅ | `validateTaskId` y `validateBody(moveTaskInputSchema)` |
| C-16 | ✅ | `position` no se expone |
| C-17 | ✅ | Cada RF tiene test: 29/29. Los casos de M-1 a M-3 e I-2, no |
| C-18 | ✅ | Vitest, Supertest con Postgres real y Playwright |
| C-19 | ⚠️ | `pnpm lint` y `pnpm typecheck` en verde. `pnpm test`, 20 de 21 (I-1) |
| C-20 | ⚠️ | Alternativas de teclado y de un solo puntero completas. Foco perdido en M-1 y fuera de la vista en I-2. Anillo del botón inactivo, excepción justificada en el plan §3 |
| C-21 | ✅ | Sin nada fuera de la spec |
| C-22 | ✅ | `useMoveTask`, `placementOf`, `stepPlacement` y `movedText` se reutilizan en el diálogo |
| C-23 | ✅ | Identificadores en inglés y textos en castellano |
| C-24 | ⚠️ | Formato correcto; dos commits con varias tareas (M-7) |
| C-25 | ✅ | `pnpm lint` sin errores |
| C-26 | ⚠️ | X-1 y X-2 justificadas; sombra aceptada; capa en Safari sin mirar (M-4) |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ⏳ | 52 de 53. Solo falta T-037, que se cierra con la decisión sobre este informe |
| Cada RF y CA con test que pasa | ✅ | 81/81. I-2 y M-1 a M-3 son casos que esos tests no recorren |
| Cada caso límite implementado y probado | ✅ | 26/26; E-19 con una prueba manual real. E-4 y E-5, en un sentido (M-5) |
| Sin código que no se trace | ✅ | |
| Tests, linter y tipos en verde | ⚠️ | I-1. `pnpm test:e2e`, código 0. El repositorio no tiene CI |
| Sin `console.log`, código comentado ni TODO | ✅ | |
| Accesibilidad revisada | ⚠️ | Automática y con WCAG 2.5.7 resuelto. I-2, M-1 y M-4 abiertos; sin lector real (D-22) |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ⚠️ | I-2 y M-1 a M-3 |
| Desviaciones anotadas en el plan | ⚠️ | M-7 |
| ADRs si hubo decisiones transversales | ✅ | No hubo; el plan no los pide |
| Estado de la spec → `implementada` | ⏳ | Sigue en `en-implementacion`, pendiente de la decisión del usuario |
| PR con spec, requisitos e informe | ⏳ | Pendiente |
| Revisada y aprobada | ⏳ | Pendiente |
