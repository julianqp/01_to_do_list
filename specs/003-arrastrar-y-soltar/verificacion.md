# Verificación · Spec 003 · 2026-11-01 (cuarta)
Resultado: **APTO CON OBSERVACIONES**

## Resumen

- **Lo esencial:** no hay bloqueantes. Las cuatro comprobaciones están en verde y los dos bloqueantes y los dos importantes de la tercera verificación están resueltos. Ratón, dedo, teclado y «Subir» y «Bajar» funcionan como dice la spec v4.0 en el flujo normal.
- **Por qué no es APTO:** dos importantes, los dos con un movimiento o un guardado **en camino** en el diálogo. La suite no los detecta. Ninguno pierde datos y la ventana es lo que tarde la petición.
  - **I-1:** si se cierra el diálogo con «Subir» o «Bajar» en camino y falla, la tarjeta vuelve a su sitio o desaparece **sin ningún aviso**. Contradice RF-021 y RF-022. Ya lo anotó T-048, sin decidir.
  - **I-2 (nuevo):** si se pulsa «Subir» o «Bajar» con «Guardar cambios» en camino, el diálogo no se cierra al guardar y, si el guardado falla, **el error no sale**. Rompe 002/RF-013 y 002/RF-028 desde código de esta spec.
- **Recomendación:** no cerrar la spec todavía. Los dos arreglos son pequeños, y los tests nuevos cuestan poco comparados con dejar un fallo silencioso. El cierre, y con él T-037, queda pendiente de la decisión del usuario.
- **Independencia:** auditoría en una sesión nueva, sin haber escrito el código, sobre `6e90cb6` con el árbol limpio. Se volvió a ejecutar todo y se leyó el código de producción de `main...HEAD`.
- **Alcance revisado:** `spec.md` v4.0, `plan.md` (hasta D-35), `tasks.md` (48/49), constitución v1.1 y `DESIGN.md` 1.5.0-todo.1. Sustituye al informe de la tercera verificación, que sigue en el historial de git (`b8924dd`).

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ✅ 40 ficheros, 927 tests en verde |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores y 5 sugerencias (`hints`) de Astro |
| `pnpm test:e2e` (4 ficheros × `chromium`, `chrome`, `webkit`) | ✅ Código 0: 384 pasan, 42 saltados (`chrome` 36, `webkit` 6) y 3 «flaky» en `webkit`. Los 3 fallan en `signup`, antes de llegar al tablero (M-5), y pasan al reintentar |
| Trazabilidad | ✅ 106/106 IDs con al menos un test cuyo título empieza por `003 ` (107 contando E-19, que es manual) |
| `webkit`, sin reintentos, ×30: `003 CA-2.5`, los tres `003 RF-007 D-9` y los dos `003 E-21` | ✅ 177 de 180 pasan. Los 3 fallos son de `signup`. **0 fallos reales** |
| RNF-002 entre columnas, 3 veces | ✅ 20,4 / 21,7 / 23,7 ms |
| RNF-002 reordenando en la columna de 200, 3 veces | ✅ 49,6 / 50 / 47,1 ms, frente a los 20 ms de T-044: más lento aquí, pero lejos de los 100 ms |
| Cambio de vista previa con 200 tarjetas (sin límite en la spec) | 51,3 / 55,6 / 47,3 ms |
| E-19 | ✅ Leída la migración: el relleno da el mismo orden que la lectura. Solo tiene un commit. No se repitió la comprobación manual de T-002 |
| Restos | ✅ Sin `console.log`, `TODO`, `FIXME`, `any`, `.only` ni `style=` en los ficheros de producción de la spec. Los `TODO` de `e2e/drag-and-drop.spec.ts` son una constante |

**Sondas temporales.** Para lo que la suite no cubre se ejecutaron dos ficheros E2E en `chromium` y `webkit`, fuera del repositorio. En este informe, «sonda» significa que la evidencia sale de ahí y que **ningún test del repositorio la protege**.

**Comprobado por sonda, sin problemas:**

- Control de I-2: sin pulsar «Subir», con el `PUT` igual de lento, el diálogo se cierra al guardar y, si falla, sale el error. La causa queda aislada.
- `index` muy grande en `POST …/move` (1000, 2³¹ − 1, 2³¹ y 2⁵³ − 1): responde 200 y va al final, como dice D-3.
- Con ratón a paso lento y un título de 200 caracteres en la columna: de la primera a la última y de vuelta, cae donde se suelta y hace una sola petición por gesto.

**Límites de esta auditoría:**

- Los anuncios se comprueban por el texto de la región viva, no por lo que dice un lector de pantalla (D-22, riesgo aceptado). El riesgo de D-24 tampoco se puede descartar.
- El arrastre con el dedo se comprueba con emulación táctil, como pide RNF-004. En `webkit` usa eventos sintéticos (D-17).
- La checklist §21 no se repitió. T-042 y T-048 anotan capturas de lo que cambiaron, y aquí solo se miraron el anillo del botón inactivo y la capa sobre «Crear tarea».
- Sin Safari real por parte de esta auditoría: ver M-3.
- No se buscó el cuelgue de M-4. `pnpm test` pasó una vez, sin E2E a la vez.

### Problemas de la verificación anterior

| Problema | Estado | Comprobación |
|---|---|---|
| B-1 (la vista previa oscila) | ✅ Resuelto | D-9 y D-20. `003 RF-007 D-9` sin cambiar pasa, y 0 fallos reales en ×30 en `webkit` |
| B-2 (fase 7 sin terminar) | ✅ Resuelto | 48 de 49 tareas `[x]`. Solo queda T-037, que es esta verificación |
| I-1 (E-21 con el dedo) | ✅ Resuelto | D-33. `003 E-21 RF-005 D-33` pasa, también en ×30 en `webkit` |
| I-2 (WCAG 2.5.7) | ✅ Resuelto | HU-5, RF-026 a RF-029 y D-34. Quedan los casos de I-1 e I-2 de este informe |
| M-1 (anillo y sombra recortados) | ⚠️ En parte | Anillo resuelto (T-042; `003 RNF-001 C-20` pasa). La sombra sigue sin tarea por decisión del usuario, y no se volvió a medir |
| M-2 (`RemeasureOnPreview` fuera del plan) | ✅ Resuelto | D-32. Queda un resto en `plan.md`: M-6 |
| M-3 (contraste de la capa en Safari) | ⚠️ Abierto | M-3 de este informe |
| M-4 (soltar sobre «Crear tarea») | ✅ Resuelto | RF-019, CA-4.7 y D-35, con tests con ratón y con el dedo |
| M-5 (cuelgue de escrituras a la vez) | ⚠️ Sin tarea | M-4 de este informe |
| M-6 (documentos) | ⚠️ En parte | `plan.md` §4.4 y §4.5 corregidos (T-043). El roadmap se completa al cerrar: M-6 de este informe |
| M-7 (`/signup` sin hidratar) | ⚠️ Conocido | M-5 de este informe. Es de la 004 |

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. Todos los tests citados pasan en esta ejecución. Abreviaturas de la columna «Test»: `e2e` = `e2e/drag-and-drop.spec.ts`; `move` = `apps/api/test/tasks.move.test.ts`; `list`, `create`, `update` = `apps/api/test/tasks.*.test.ts`; `service` = `tasks.service.test.ts`; `Board`, `TaskCard`, `BoardColumn`, `PrivateArea`, `TaskDialog`, `Button` = `apps/web/src/components/*.test.tsx`; `order` = `lib/board-order.test.ts`; `queries` = `lib/task-queries.test.tsx`; `messages` = `lib/task-messages.test.ts`; `tokens` = `styles/tokens.test.ts`; `shared` = `packages/shared/src/tasks.test.ts`.

### Requisitos funcionales

| ID | Código | Test | Veredicto |
|---|---|---|---|
| RF-001 | `task-move.ts` `commit`; `tasks.service.moveTask`; `task.repository.moveTaskOfUser` | `move`, `Board`, `order`, `e2e` | ✅ |
| RF-002 | `Board.tsx` `DragOverlay`; `TaskCard.tsx` variantes | `TaskCard`, `BoardColumn`, `e2e` | ✅ |
| RF-003 | `shared` `actualEndDateAfterMove`; `today = todayLocal()` | `shared`, `move`, `service`, `Board`, `queries`, `e2e` | ✅ |
| RF-004 | Ídem | `shared`, `move`, `service`, `Board`, `queries`, `e2e` | ✅ |
| RF-005 | `onDragOver`, `onDragCancel`, `inVisibleColumn` (D-31), `touchend` en el origen (D-33) | `e2e` (CA-1.7, D-31, E-21, D-33, CA-4.5) | ✅ |
| RF-006 | `TaskCard.tsx` botón de abrir y `event.detail` en el asa; `MouseSensor` `distance: 5` | `TaskCard`, `e2e` | ✅ |
| RF-007 | `makeRoom`; `stepPlacement`; `placementFromOver` con `below`; `RemeasureOnPreview` | `move`, `service`, `Board`, `TaskDialog`, `order`, `e2e` | ✅ |
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
| RF-020 | `useMoveTask.onMutate`; `landing` | `queries`, `TaskDialog`, `e2e` | ✅ |
| RF-021 | `onError`; `onSettled` sin esperar (D-29); `moveErrorText` | `Board`, `queries`, `e2e` con la API caída | ⚠️ Desde el tablero cumple. Con «Subir» o «Bajar» y el diálogo ya cerrado, sin aviso (I-1) |
| RF-022 | `onError` con `isTaskNotFound`; `onTaskGone` (D-26) | `move`, `Board`, `queries`, `messages`, `e2e` con borrado real | ⚠️ Ídem: la tarjeta desaparece sin aviso (I-1) |
| RF-023 | `onMobileColumn` (D-13, D-26) | `Board`, `e2e` | ✅ |
| RF-024 | `scrollIntoView` (D-23); `max-md:scroll-pb-24` | `e2e` | ✅ |
| RF-025 | `PrivateArea` por `tasks.data` (D-30) | `PrivateArea`, `e2e` | ✅ |
| RF-026 | Bloque de posición en `TaskDialog.tsx`; `movedText`; `aria-live="polite"` | `TaskDialog`, `e2e` | ✅ |
| RF-027 | `moveWithinColumn`; `useTaskForm` sin tocar | `TaskDialog`, `e2e` | ⚠️ Pisa un guardado en camino (I-2). Con clic en `webkit`, el foco no queda en el botón (M-2) |
| RF-028 | `stepTo`; `Button` `inactive`; `MOVE_NEEDS_SAVE` | `Button`, `TaskDialog`, `messages`, `e2e` | ✅ Conserva el foco; el anillo se ve poco (M-1) |
| RF-029 | `onError` de la llamada; `kind: 'notFound'` | `TaskDialog`, `e2e` | ✅ Con el diálogo abierto, que es lo que pide. Cerrado: I-1 |

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
| CA-2.5 | `Board`, `e2e`; ×30 en `webkit` | ✅ |
| CA-2.6 | `Board`, `e2e` con ratón | ✅ |
| CA-3.1 | `TaskCard`, `e2e` (foco visible real y 4 px de sitio, T-042) | ✅ |
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
| CA-3.12 | `Board`, `e2e` con borrado real | ✅ |
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
| CA-5.5 | `Button`, `TaskDialog` | ✅ Conserva el foco; el anillo se ve poco (M-1) |
| CA-5.6 | `TaskDialog` | ✅ |
| CA-5.7 | `TaskDialog` | ✅ |
| CA-5.8 | `TaskDialog`, `messages`; `e2e` con axe | ✅ |
| CA-5.9 | `TaskDialog`, `e2e` | ✅ |
| CA-5.10 | `TaskDialog`, `e2e` con borrado real | ✅ |
| CA-5.11 | `TaskDialog` | ✅ |

### Requisitos no funcionales

| ID | Evidencia | Veredicto |
|---|---|---|
| RNF-001 | Cumple: axe sin infracciones con la tarjeta cogida, en pleno arrastre y con el detalle abierto, en los dos temas; `tokens` ≥ 3:1; asa de 44 y 32 px; movimiento reducido; WCAG 2.5.7 con «Subir» y «Bajar» y el estado del detalle. **Parcial:** anillo del botón inactivo en 2,44:1 en claro (M-1). **❓** La capa sobre «Crear tarea» en Safari (M-3) | ⚠️ |
| RNF-002 | `e2e` en `chromium`: entre columnas, 20,4 / 21,7 / 23,7 ms; en la columna de 200, 49,6 / 50 / 47,1 ms, frente a ≤ 100 ms | ✅ |
| RNF-003 | `move`, `update`, `service`: tarea ajena → 404, y el orden de su dueño no cambia | ✅ |
| RNF-004 | Tres proyectos, con emulación táctil (D-17). `chrome` se salta los 36 tests que el plan limita a `chromium` y `webkit` o a `chromium`, y CA-4.2 no corre en `webkit` (R-6) | ✅ |
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
| E-8 | `Board`, `TaskDialog` (`location.replace`) | ✅ |
| E-9 | `move`, `Board` | ⚠️ Sin aviso si el diálogo ya se cerró (I-1) |
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
| E-21 | `e2e`, con ratón y con el dedo; ×30 en `webkit` | ✅ |
| E-22 | `PrivateArea`, `e2e` | ✅ |
| E-23 | `TaskDialog` | ✅ |
| E-24 | `TaskDialog` | ✅ |

## Problemas

### Bloqueantes

Ninguno.

### Importantes

**I-1 · Si se cierra el diálogo con «Subir» o «Bajar» en camino y falla, no sale ningún aviso.** Afecta a RF-021, RF-022 y E-9. Ya lo anotó T-048 ([tasks.md:668](tasks.md#L668), hallazgo 1) y T-049 lo dejó sin decidir. Hasta ahora, lo de `TASK_NOT_FOUND` estaba sin medir. Sin test.

- **Dónde:** [TaskDialog.tsx:197-204](../../apps/web/src/components/TaskDialog.tsx#L197-L204). El aviso cuelga del `onError` de `mutate`, y TanStack no lo llama con el componente ya desmontado. El `onError` de `useMoveTask` sí se ejecuta, y por eso la tarjeta vuelve. El tablero evita este problema usando la promesa de `mutateAsync` ([task-move.ts:216-224](../../apps/web/src/lib/task-move.ts#L216-L224)).
- **Medido (sonda), con «Subir», «Cancelar» y la respuesta a los 800 ms:**

| Respuesta | Resultado | `chromium` | `webkit` |
|---|---|---|---|
| Red caída | La tarjeta se ve subida al cerrar y vuelve a la posición 2 | 0 avisos | 0 avisos |
| Tarea ya borrada | La tarjeta desaparece | 0 avisos, foco en `BODY` | 0 avisos, foco en `BODY` |

- **Por qué importa:** es el gesto natural: subir y cerrar. El usuario cree que la tarea ha subido y, si no está mirando, no se entera de que no se guardó. En el caso de la tarea borrada, además, el foco se pierde. No se pierde nada guardado, y en uso local la ventana es muy corta; crece con un servidor lento.
- **Propuesta:** avisar en el tablero si el diálogo ya se cerró, con `mutateAsync` y un aviso que suba a `Board`, como hace `commit`; con `TASK_NOT_FOUND`, además, el foco a «Crear tarea». RF-029 solo habla del diálogo abierto, así que hace falta una línea en la spec con `/sdd-cambiar-spec`. Y un E2E con `page.route` retrasado para cada caso.

**I-2 · Pulsar «Subir» o «Bajar» con «Guardar cambios» en camino deja el diálogo abierto y oculta el error de guardar.** Afecta a RF-027 y a 002/RF-013 y 002/RF-028, que ya funcionaban. **Nuevo:** T-048 solo miró el orden contrario. Sin test.

- **Dónde:** [TaskDialog.tsx:194-196](../../apps/web/src/components/TaskDialog.tsx#L194-L196). `moveWithinColumn` solo comprueba `moveTask.isPending` y llama a `updateTask.reset()`, que desengancha la mutación en curso: no llega su `onSuccess`, que cierra, ni su error a `failedSave`. `handleSubmit` ya tiene la protección que aquí falta (`if (saving) return`, [TaskDialog.tsx:138](../../apps/web/src/components/TaskDialog.tsx#L138)).
- **Medido (sonda), con el título cambiado, el `PUT` a 1000 ms y «Subir» durante «Guardando…», 3 s después:**

| `PUT` | Sin pulsar «Subir» (control) | Pulsando «Subir» |
|---|---|---|
| Va bien | El diálogo se cierra | **Sigue abierto**, con el título ya guardado. «Cancelar» pregunta «¿Descartar los cambios?» por algo ya guardado |
| Falla | Sale «No hemos podido guardar la tarea…» | **Sin error**, y el título no se ha guardado |

  Igual en `chromium` y `webkit`.
- **Por qué importa:** si falla, el usuario no recibe ninguna señal de que no se guardó, y el botón deja de decir «Guardando…». Hay que pulsar «Subir» o «Bajar» durante el guardado, así que es poco frecuente. No se pierde el borrador.
- **Propuesta:** en `moveWithinColumn`, `if (saving) return`, como en `handleSubmit`, con su test en `TaskDialog.test.tsx`. La spec no dice qué pasa en este caso: una frase en RF-027 («con un guardado en camino, tampoco hace nada») lo deja escrito.

### Menores

**M-1 · El anillo de foco del botón inactivo baja de 3:1 en claro.** Afecta a RNF-001, C-20 y CA-5.5. Hallazgo 2 de T-048, sin decidir.

- **Dónde:** [Button.tsx:63](../../apps/web/src/components/Button.tsx#L63). `opacity-45` también afecta al `outline`.
- **Medido:** con los colores calculados por `chromium` y `webkit` sobre la carpeta: en claro, de 11,02:1 a **2,44:1**; en oscuro, de 10,55:1 a 3,22:1. En la captura, el anillo se ve, pero flojo.
- **Lectura:** WCAG 1.4.11 exime a los componentes inactivos y axe no lo marca, pero CA-5.5 deja el foco ahí justo al llegar al borde: quien usa el teclado acaba exactamente en ese estado.
- **Propuesta, a elegir:** aceptarlo y anotarlo en el plan; o bajar la opacidad solo en el contenido y no en el botón entero, lo que cambia cómo se aplica el «Deshabilitado» de `DESIGN.md` §14.

**M-2 · Con clic en `webkit`, «Subir» y «Bajar» no se quedan con el foco.** Afecta a RF-027 («el foco en el botón pulsado»). Hallazgo 3 de T-048, sin decidir.

- **Medido (sonda), tras un clic en «Bajar»:** en `chromium`, el foco en el botón y Tab va al campo siguiente. En `webkit`, el foco en el `<dialog>` y **Tab vuelve al primer campo del formulario**. Es como trata Safari los botones. Con teclado se cumple en todos los proyectos (`003 CA-5.4`).
- **Propuesta, a elegir:** acotar RF-027 a la activación con teclado; o llamar a `focus()` en el botón, una línea y un test.

**M-3 · La capa sobre «Crear tarea» en `webkit`: el botón se transparenta.** Afecta a RNF-001. Sigue sin Safari real. D-35 lo da por consecuencia aceptada con la medida del `webkit` de Playwright, sin haberlo mirado en Safari.

- **Medido (sonda, a 375 con la barra de Astro quitada, porque tapaba la medida):** texto de la capa frente a su fondo más común: 12,7:1 en `chromium` y 12,6:1 en `webkit` en claro, y 9,6:1 y 10,3:1 en oscuro. **No mide el peor caso.** En las capturas de `webkit`, en los dos temas, «Crear tarea» se ve a través de la capa y se cruza con el título; en `chromium`, no, porque sí aplica el blur. La segunda verificación midió 4,39:1 con la capa sobre el botón; esa medida no se ha repetido. Dura lo que el arrastre, porque la capa está en el aire.
- **Propuesta:** mirarlo una vez en Safari real. Si se ve igual, subir la opacidad de la capa, como el respaldo de §6.3.

**M-4 · Tests de escrituras a la vez que pueden agotar los 5 s, y sombra recortada.** Vienen de verificaciones anteriores y siguen sin tarea por decisión del usuario. El cuelgue (D-2) no se ha buscado aquí: `pnpm test` pasó una vez y sin E2E a la vez, lo que no añade información. La sombra de la tarjeta cogida (RNF-005) no se volvió a medir. **Propuesta:** no lanzar `pnpm test` y `pnpm test:e2e` a la vez, y si quieres cerrarlos del todo, anotarlos como riesgo aceptado en el plan.

**M-5 · `/signup` sin hidratar en `webkit`.** Es M-7 de la 004, ya conocido, y no es de esta spec: 3 «flaky» en la suite y 3 de 180 sin reintentos (1,7 %), todos en `signup`. Se anota porque obliga a tener `retries: 1` en `webkit`, y ese reintento podría esconder un fallo real. Sin propuesta nueva.

**M-6 · Restos en documentos y comentarios.** Sin efecto en el comportamiento.

- [plan.md:244](plan.md#L244): el contrato de `dndProps` sigue listando `measuring`, que T-041 quitó (D-32).
- [task-move.ts:148-149](../../apps/web/src/lib/task-move.ts#L148-L149): el comentario dice que la mutación «espera a volver a pedir la lista», y desde D-29 ya no espera.
- [Board.tsx:28](../../apps/web/src/components/Board.tsx#L28): cita D-9 para `RemeasureOnPreview`; ahora es D-32.
- [tasks.md:669](tasks.md#L669): T-049 sigue sin hash (`6e90cb6`); según la regla de [tasks.md:28](tasks.md#L28) se anota al empezar la siguiente tarea.
- [roadmap.md](../roadmap.md): sigue con `actualizado: 2026-10-31`, y su historial termina en la aprobación del plan: faltan las v2.0 a v4.0 y las verificaciones. Se añaden al cerrar, según la decisión del usuario.

**M-7 · `9702bc2` junta cinco tareas en un commit.** Afecta a la regla de «un commit por tarea» ([tasks.md:28](tasks.md#L28)): T-041, T-044, T-045, T-042 y T-046. El mensaje las nombra y el Registro lo refleja, así que se sigue la pista. Sin propuesta: arreglarlo exigiría reescribir el historial.

## Deriva spec ↔ código

| Spec o plan | Código | Acción |
|---|---|---|
| RF-021, RF-022, E-9: aviso al fallar | Con el diálogo ya cerrado, sin aviso | I-1: corregir el código y completar RF-029 |
| 002/RF-013, 002/RF-028: al guardar, se cierra o avisa | Pulsar «Subir» durante el guardado lo anula | I-2: corregir el código y completar RF-027 |
| RF-027: «el foco en el botón pulsado» | Con clic en `webkit`, en el `<dialog>` | M-2: decidir |
| Plan §4.3: `measuring` en `dndProps` | Ya no se usa | M-6: corregir el plan |
| D-35: «`webkit` midió 4,39:1» como consecuencia aceptada | Se transparenta en `webkit`, sin mirar en Safari real | M-3: decidir tras mirarlo |

**Alcance:** sin código de más; todo lo nuevo se traza a RF-026 a RF-029, D-32 y D-33. No hay nada de «Fuera de alcance» implementado. Todo lo de «Fuera de alcance» está en «Ideas sin priorizar» del roadmap; «Cambiar el estado desde la tarjeta» está con el origen de la 002.

**Plan:** D-32 a D-35 se corresponden con el código, salvo lo de M-6. D-34 dice que el `onError` de la llamada resuelve los errores, y eso solo vale con el diálogo abierto (I-1). Su punto «una pulsación cada vez» no contempla el guardado en camino (I-2).

## Constitución

| Artículo | Veredicto | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any` |
| C-2 | ✅ | `@dnd-kit/core` 6.3.1 fijada y justificada (plan §2, R-1). Sin dependencias nuevas desde entonces |
| C-4 | ✅ | `drag` y `landing` sin datos del servidor; el diálogo saca la posición de la lista en cada render (D-34) |
| C-5 | ✅ | Migración nueva; ninguna aplicada se ha tocado |
| C-7 | ✅ | `/api/tasks/:id/move`, relativa |
| C-8 | ✅ | Rutas → service → repository; `$queryRaw` y Prisma solo en los repositories |
| C-9 | ✅ | Sin códigos nuevos; el texto lo decide el front |
| C-10 | ✅ | `moveTaskInputSchema` y `actualEndDateAfterMove` en `shared`, sin duplicar |
| C-11 | ✅ | `today` como `YYYY-MM-DD` |
| C-13 | ✅ | Tarea ajena → 404 `TASK_NOT_FOUND`, con test de `move`, y el orden del dueño no cambia |
| C-14 | ✅ | `validateTaskId` y `validateBody(moveTaskInputSchema)` |
| C-16 | ✅ | `position` no se expone |
| C-17 | ⚠️ | Cada RF tiene test, 106/106. Los casos de I-1 e I-2, no |
| C-18 | ✅ | Vitest, Supertest con Postgres real y Playwright |
| C-19 | ✅ | `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde |
| C-20 | ⚠️ | Alternativas de teclado y de un solo puntero completas. Anillo del botón inactivo por debajo de 3:1 en claro (M-1); foco perdido en I-1 con la tarea borrada |
| C-21 | ✅ | Sin nada fuera de la spec |
| C-22 | ✅ | `useMoveTask`, `placementOf`, `stepPlacement` y `movedText` se reutilizan en el diálogo |
| C-23 | ✅ | Identificadores en inglés y textos en castellano |
| C-24 | ⚠️ | Formato correcto; un commit con cinco tareas (M-7) |
| C-25 | ✅ | `pnpm lint` sin errores |
| C-26 | ⚠️ | X-1 y X-2 justificadas; sombra recortada (M-4) y capa en Safari sin mirar (M-3) |

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ⏳ | 48 de 49. Solo falta T-037, que se cierra con la decisión sobre este informe |
| Cada RF y CA con test que pasa | ✅ | 78/78. I-1 e I-2 son casos que esos tests no recorren |
| Cada caso límite implementado y probado | ⚠️ | E-9 con el diálogo ya cerrado (I-1); E-19, manual |
| Sin código que no se trace | ✅ | |
| Tests, linter y tipos en verde | ✅ | También `pnpm test:e2e`. El repositorio no tiene CI |
| Sin `console.log`, código comentado ni TODO | ✅ | |
| Accesibilidad revisada | ⚠️ | Automática y con WCAG 2.5.7 resuelto. M-1 y M-3 abiertos; sin lector real (D-22) |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ⚠️ | I-1, I-2 y M-2 |
| Desviaciones anotadas en el plan | ⚠️ | M-6, y D-34 en lo de I-1 e I-2 |
| ADRs si hubo decisiones transversales | ✅ | No hubo; el plan no los pide |
| Estado de la spec → `implementada` | ⏳ | Sigue en `en-implementacion`, pendiente de la decisión del usuario |
| PR con spec, requisitos e informe | ⏳ | Pendiente |
| Revisada y aprobada | ⏳ | Pendiente |
