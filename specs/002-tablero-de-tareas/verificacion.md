# Verificación · Spec 002 · 2026-10-31 (segunda)
Resultado: **APTO**

## Resumen

- **Qué es esta verificación:** la segunda (T-035), después de la fase 6 (T-030 a T-034), que corrigió las observaciones de la primera (`bc5a287`, APTO CON OBSERVACIONES).
- **Aviso de independencia:** no se hizo en una sesión nueva, sino en la misma en la que se implementaron T-030 a T-033. Para compensarlo, se repitieron desde cero todas las comprobaciones (tests, lint, tipos, E2E completos y trazabilidad) y se revisó línea a línea el diff de la fase 6 (`bc5a287..HEAD`). Si se quiere una auditoría independiente, basta con volver a ejecutar `/sdd-verificar` tras `/clear`.
- **Alcance revisado:** `spec.md` v1.1, `plan.md` (decisiones D-12, D-15, D-18 y D-19 modificadas el 2026-10-31), `tasks.md` (34/35 antes de esta tarea) y la constitución v1.1. Diff completo de la spec: `adc7fa7..HEAD` (`adc7fa7` es el `main` anterior a la fusión de la PR #2).
- **Resultados de la ejecución:**

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ✅ 38 ficheros, 755 tests en verde |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores |
| `pnpm test:e2e` (3 ficheros × `chromium`, `chrome`, `webkit`) | ✅ 181 pasan y 2 se saltan (RNF-004 solo en `chromium`), **sin *flaky*** en esta ejecución |
| Trazabilidad | ✅ 114/114 IDs con al menos un test de la spec 002, con el criterio de T-028 (líneas de test añadidas desde `adc7fa7`) |
| Restos de la primera verificación | `grep` de `console.log` en `e2e/` y de `formatLongDate` en `apps/`, `packages/` y `e2e/`: vacíos |

- **Conclusión:** todos los RF, CA, RNF y E se cumplen y tienen tests que pasan. Los problemas de la primera verificación están resueltos o asumidos por escrito. Queda una nota menor de registro (N-1), que no afecta al producto.

## Seguimiento de la primera verificación

| ID | Problema | Estado | Evidencia |
|---|---|---|---|
| I-1 | En móvil, un toque junto al asa del panel inferior lo cerraba | ✅ Resuelto (T-030) | [TaskDialog.tsx:112-117](../../apps/web/src/components/TaskDialog.tsx): el clic fuera exige `target === dialog` **y** el punto fuera de `getBoundingClientRect()`. Unitarios: «RF-021 RF-035 D-12 sin cambios / con cambios, un pointerdown … dentro de su rectángulo … no cierra ni pregunta». E2E: «RF-021 RF-035 CA-7.2 D-12 a 375, un toque dentro del panel inferior junto al asa no lo cierra», en verde en los tres proyectos. El clic en el velo con cambios (CA-3.3) sigue preguntando |
| I-2 | PR #2 fusionada antes de verificar | ⏳ Se resuelve con la PR de seguimiento | Esta rama tiene 6 commits que no están en `main`, con este informe y el cierre |
| I-3 | Commits sin IDs; `0e71e56` contenía T-002 | ✅ Asumido y anotado | Nota al principio del Registro de `tasks.md` con qué commit contiene cada tarea; desde T-030 los commits llevan IDs (`95f077c`, `d6e75db`) |
| M-1 | RF-016 no se probaba en la interfaz | ✅ Resuelto (T-032) | `TaskDialog.test.tsx`, caso «RF-016 E-6 descripción de 5001 caracteres» (falla si se anula la regla, según el Registro) |
| M-2 | `console.log` en el E2E de RNF-004 | ✅ Resuelto (T-032) | `test.info().annotations` |
| M-3 | `formatLongDate` sin uso | ✅ Resuelto (T-033) | Eliminada; D-18 actualizada |
| M-4 | Dos acentos en el detalle | ✅ Resuelto (T-031) | «Borrar tarea» del detalle en glass; `destructive` solo en la confirmación. D-15 y D-19 en el plan y `DESIGN.md` 1.3.1-todo.1. axe AA + AAA de contraste en verde en los dos temas |
| M-5 | Desviaciones solo en el Registro | ✅ Resuelto | Plan §4.3 (`Button`, `Icon`) y D-15 (`SegmentedControl`, T-024) |
| M-6 | Cambios de `.claude/` y `CLAUDE.md` en la rama | ℹ️ Informativo | Herramientas del flujo, no del producto; hay que mencionarlos en la PR |
| Deriva §10 | «En el detalle, siempre con año» contra CA-6.2 | ✅ Resuelto | Spec v1.1 |

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. Todos los tests citados pasan en esta ejecución.

### Requisitos funcionales

| ID | Código | Test | Veredicto |
|---|---|---|---|
| RF-001 | `Board.tsx` (columnas en el orden de `TASK_STATUSES`) | `Board.test`; e2e «CA-1.1 RF-001 RF-003…» | ✅ |
| RF-002 | `task.repository.findTasksByUser` (`createdAt desc, id desc`); `Board.groupByStatus` conserva el orden | `tasks.list.test`; `Board.test` (CA-1.8) | ✅ |
| RF-003 | `Board.tsx`, `BoardColumn.tsx`, `dates.tasksCount` | `dates.test`, `Board.test`, e2e CA-1.1 | ✅ |
| RF-004 | `tasks.service.listTasks(userId)` | `tasks.list.test`; e2e «CA-1.4 RF-004 RNF-003» | ✅ |
| RF-005 | `BoardColumn.tsx` (`EMPTY_PHRASES`) | `BoardColumn.test` | ✅ |
| RF-006 | `Board.tsx` `EmptyBoard` | `Board.test`; e2e del flujo principal | ✅ |
| RF-007 | `TaskCard.tsx` | `TaskCard.test` | ✅ |
| RF-008 | `PrivateArea.tsx` `LoadError` + `retry` | `PrivateArea.test` | ✅ |
| RF-009 | `BoardColumn.tsx` `aria-label` | `BoardColumn.test`; e2e CA-1.1 | ✅ |
| RF-010 | `TaskDialog.tsx` (creación) | `TaskDialog.test` «RF-010 D-9 campos…» | ✅ |
| RF-011 | `POST` sin `status` → backlog | `tasks.create.test`; `TaskDialog.test` CA-2.1 | ✅ |
| RF-012 | `TaskCard` `<button>`; `TaskDialog` (edición) | `TaskDialog.test` CA-3.1; e2e con teclado | ✅ |
| RF-013 | `PUT` completo; invalidación antes de cerrar | `tasks.update.test`; `TaskDialog.test` CA-3.2 | ✅ |
| RF-014 | `shared/tasks.ts` `titleSchema` | `tasks.test`; `task-form.test`; `TaskDialog.test` CA-2.3, CA-3.5 | ✅ |
| RF-015 | ídem, en puntos de código | `tasks.test`; `TaskDialog.test` CA-2.4 | ✅ |
| RF-016 | `descriptionSchema`; `task-form.ts` | `tasks.test`; `tasks.create.test`; `TaskDialog.test` «RF-016 E-6 descripción de 5001 caracteres» | ✅ |
| RF-017 | `dates.parseDisplayDate`; `z.iso.date()` | `dates.test`; `TaskDialog.test` CA-2.6; `task-form.test` | ✅ |
| RF-018 | `refine` `endNotBeforeStart` | `tasks.test`; `TaskDialog.test` CA-2.5 | ✅ |
| RF-019 | `task-form.focusFirstError` | `task-form.test`; `TaskDialog.test` (foco en cada caso) | ✅ |
| RF-020 | `trim()` del título; descripción sin tocar | `tasks.test`; `tasks.create.test`; `task-form.test` | ✅ |
| RF-021 | `TaskDialog.requestClose`, `handlePointerDown` (D-12) | `TaskDialog.test` (Esc, «Cancelar», clic fuera y clic dentro del rectángulo); e2e del doble Esc, del clic fuera y del toque junto al asa | ✅ |
| RF-022 | `Board.tsx` `focusTarget` (D-14) | `TaskDialog.test` («Board · abrir y cerrar»); e2e CA-3.4 | ✅ |
| RF-023 | `SegmentedControl` (radios nativos) | `SegmentedControl.test`; e2e CA-4.2 | ✅ |
| RF-024 | invalidación de `['tasks']` (D-7) | `TaskDialog.test` CA-4.1; `task-queries.test` | ✅ |
| RF-025 | `task-form.setStatus` | `task-form.test`; `TaskDialog.test` CA-4.3 | ✅ |
| RF-026 | vista `confirmDelete`; «Borrar tarea» del detalle en glass (D-19) | `TaskDialog.test` «RF-026 D-15 D-19…», CA-5.1, CA-5.3 | ✅ |
| RF-027 | `DELETE`; foco en «Crear tarea» | `tasks.delete.test`; `TaskDialog.test` CA-5.2; e2e | ✅ |
| RF-028 | `saveErrorText` en la alerta del diálogo | `TaskDialog.test` CA-2.7, 500, CA-4.4 | ✅ |
| RF-029 | `deleteErrorText` | `TaskDialog.test` CA-5.4 | ✅ |
| RF-030 | 404 `TASK_NOT_FOUND`; aviso del tablero | `tasks.update/delete.test`; `TaskDialog.test` CA-3.6 y DELETE 404 | ✅ |
| RF-031 | `Button` `loading`; `handleSubmit` | `TaskDialog.test` E-15, «Guardando…», «Borrando…» | ✅ |
| RF-032 | `dates.isOverdue`; insignia en `TaskCard` | `dates.test`; `TaskCard.test`; e2e CA-6.1 | ✅ |
| RF-033 | aviso en `TaskDialog.tsx` | `TaskDialog.test` CA-6.2; e2e | ✅ |
| RF-034 | selector `md:hidden` y `max-md:hidden` | `Board.test`; e2e CA-7.1 | ✅ |
| RF-035 | clases `max-md:*` del `<dialog>`; clic fuera por rectángulo | `TaskDialog.test`; e2e CA-7.2 y del toque junto al asa | ✅ |
| RF-036 | «Crear tarea» `max-md:fixed…` | e2e CA-7.3 | ✅ |
| RF-037 | `<h1>Tablero</h1>` | `Board.test`; `PrivateArea.test`; e2e `design-system.spec` | ✅ |
| RF-038 | `showActualEndDate` | `task-form.test`; `TaskDialog.test` CA-4.9 | ✅ |
| RF-039 | `isActualEndDateAllowed` (front con `todayLocal`, API con «hoy UTC + 1») | `task-form.test`; `TaskDialog.test` CA-4.6; `tasks.service.test`; `tasks.update.test` | ✅ |
| RF-040 | `refine` de Done sin fecha | `tasks.test`; `TaskDialog.test` CA-4.7; `tasks.update.test` | ✅ |
| RF-041 | `transform` a `null` | `tasks.test`; `tasks.update.test`; `TaskDialog.test` CA-4.8, E-23 | ✅ |

### Criterios de aceptación

| ID | Test principal | Veredicto |
|---|---|---|
| CA-1.1 | e2e a 1280 px (regiones, «Backlog · 2»…, «6 tareas»); `Board.test` | ✅ |
| CA-1.2 | `BoardColumn.test`; e2e CA-1.1 | ✅ |
| CA-1.3 | `Board.test`; e2e del flujo principal | ✅ |
| CA-1.4 | e2e con dos cuentas; `tasks.list.test` | ✅ |
| CA-1.5 | `TaskCard.test`; `dates.test` | ✅ |
| CA-1.6 | `PrivateArea.test` (mensaje, «Reintentar» con éxito) | ✅ |
| CA-1.7 | `BoardColumn.test` | ✅ |
| CA-1.8 | `Board.test`; `tasks.list.test` | ✅ |
| CA-2.1 | `TaskDialog.test`; e2e | ✅ |
| CA-2.2 | `TaskDialog.test`; `tasks.create.test` | ✅ |
| CA-2.3 – CA-2.6 | `TaskDialog.test` `it.each` (sin POST, error bajo el campo, foco) | ✅ |
| CA-2.7 | `TaskDialog.test` | ✅ |
| CA-3.1 | `TaskDialog.test`; e2e con teclado | ✅ |
| CA-3.2 | `TaskDialog.test`; e2e | ✅ |
| CA-3.3 | `TaskDialog.test`; e2e (doble Esc y clic fuera) | ✅ |
| CA-3.4 | `TaskDialog.test`; e2e | ✅ |
| CA-3.5 | `TaskDialog.test` | ✅ |
| CA-3.6 | `TaskDialog.test`; `tasks.update.test` | ✅ |
| CA-4.1 | `TaskDialog.test` (columna y recuentos) | ✅ |
| CA-4.2 | e2e del flujo principal (Tab, Enter, flechas) | ✅ |
| CA-4.3 | `TaskDialog.test`; e2e | ✅ |
| CA-4.4 | `TaskDialog.test` | ✅ |
| CA-4.5 – CA-4.7 | `TaskDialog.test`; `task-form.test`; `tasks.update.test` | ✅ |
| CA-4.8 | `TaskDialog.test` | ✅ |
| CA-4.9 | `TaskDialog.test`; `task-form.test` | ✅ |
| CA-5.1 | `TaskDialog.test`; e2e | ✅ |
| CA-5.2 | `TaskDialog.test`; e2e | ✅ |
| CA-5.3 | `TaskDialog.test` (`it.each` «Cancelar» y Esc) | ✅ |
| CA-5.4 | `TaskDialog.test` | ✅ |
| CA-5.5 | `TaskDialog.test`; e2e | ✅ |
| CA-6.1 | `TaskCard.test`; e2e (el estado lo da la columna) | ✅ |
| CA-6.2 | `TaskDialog.test`; e2e | ✅ |
| CA-6.3 – CA-6.5 | `TaskCard.test`; `dates.test` | ✅ |
| CA-7.1 | e2e a 375 | ✅ |
| CA-7.2 | e2e a 375 (panel a todo el ancho y abajo; cambio de estado; un toque junto al asa no lo cierra). Editar y borrar en el panel van por el mismo componente, probado en unitarios | ✅ |
| CA-7.3 | e2e a 375 | ✅ |

### Requisitos no funcionales

| ID | Evidencia | Veredicto |
|---|---|---|
| RNF-001 | axe (AA + `color-contrast-enhanced`) en el tablero y el diálogo, claro y oscuro, en los tres proyectos; `tokens.test` (parejas R-1); e2e solo con teclado. La checklist manual §21 consta en T-027 y no se ha repetido tras el cambio de T-031 (un botón de rosa a glass) | ✅ (manual: ❓ no repetida) |
| RNF-002 | e2e de 320 a 1600 y zoom al 200 % | ✅ |
| RNF-003 | `tasks.update/delete.test` (ajena → 404 como inexistente); `tasks.list.test` | ✅ |
| RNF-004 | e2e `chromium` con 500 tareas, en verde (≤ 2 s); el tiempo va en las anotaciones del test | ✅ |
| RNF-005 | `board.spec.ts` en `chromium`, `chrome` y `webkit` | ✅ |
| RNF-006 | `tokens.test`; `design-rules.test` sin cambios y en verde | ✅ |

### Casos límite

| ID | Evidencia | Veredicto |
|---|---|---|
| E-1 | `Board.test` | ✅ |
| E-2 | e2e RNF-004/E-2 | ✅ |
| E-3 | `tasks.test` | ✅ |
| E-4 | e2e; `TaskCard.test` | ✅ |
| E-5 | `tasks.test`; `tasks.create.test` | ✅ |
| E-6 | `tasks.test`; `TaskDialog.test` (RF-016) | ✅ |
| E-7 | `dates.test`; `task-form.test` | ✅ |
| E-8 | `TaskCard.test`; `tasks.test` | ✅ |
| E-9 | `tasks.test` | ✅ |
| E-10 | `dates.test` (TZ adelantada) | ✅ |
| E-11 | `dates.test` | ✅ |
| E-12 | `TaskDialog.test`; `PrivateArea.test` | ✅ |
| E-13 | `tasks.update.test` | ✅ |
| E-14 | `tasks.update/delete.test`; `TaskDialog.test` | ✅ |
| E-15 | `TaskDialog.test` | ✅ |
| E-16 | e2e | ✅ |
| E-17 | e2e | ✅ |
| E-18 | `tasks.update/delete.test`; `tasks.service.test` | ✅ |
| E-19 | `dates.test`; `Board.test`; `BoardColumn.test` | ✅ |
| E-20 | `tasks.test` | ✅ |
| E-21 | `task-form.test`; `TaskDialog.test` | ✅ |
| E-22 | `tasks.list.test` | ✅ |
| E-23 | `tasks.test`; `task-form.test`; `TaskDialog.test` | ✅ |
| E-24 | `tasks.list.test` | ✅ |

## Problemas

### Bloqueantes

Ninguno.

### Importantes

Ninguno abierto. I-2 se cierra con la PR de seguimiento (ver «Definition of Done»).

### Menores

- **N-1 · Faltan los commits de T-030 a T-034 en el Registro.** En `specs/002-tablero-de-tareas/tasks.md`, filas T-030 a T-034, la columna Commit tiene «—». Son `95f077c` (T-030, T-031 y T-032, en un solo commit porque tocan los mismos ficheros) y `d6e75db` (T-033 y T-034). Además, `d6e75db` se hizo antes que `95f077c`, así que en el historial `tasks.md` marca T-030 a T-032 como hechas un commit antes de su código. No afecta al producto. **Propuesta:** rellenar la columna al cerrar la spec.

## Deriva spec ↔ código

Ninguna. Se revisó en concreto:
- el clic fuera (RF-021): solo el velo cierra o pregunta;
- el formato de fechas del detalle (spec §10 v1.1, CA-6.2, D-18);
- «Borrar tarea» y su confirmación (RF-026, CA-5.1; los colores los fija `DESIGN.md` §11.4 1.3.1-todo.1);
- §9 «Fuera de alcance»: nada implementado.

## Constitución

| Artículo | Estado | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any` en producción ni `@ts-ignore` |
| C-2 | ✅ | Sin dependencias nuevas |
| C-4 | ✅ | Una isla; TanStack Query; efectos solo de DOM; borrador justificado (D-13) |
| C-5 | ✅ | Migración nueva `tasks_init`; la de la 001 no cambia |
| C-7 | ✅ | Rutas relativas `/api/tasks` |
| C-8 | ✅ | Capas respetadas; de producción, solo los repositories importan Prisma |
| C-9 | ✅ | `TASK_NOT_FOUND` en el catálogo; el front decide el texto |
| C-10 | ✅ | Esquemas, mensajes y reglas en `shared`, sin duplicar |
| C-11 | ✅ | `@db.Date` y `YYYY-MM-DD` |
| C-13 | ✅ | Ajena = inexistente (404); un test de tarea ajena por operación |
| C-14 | ✅ | `validateBody` y `taskIdSchema` |
| C-16 | ✅ | Solo los datos del glosario; cascada probada |
| C-17 | ✅ | 114/114 |
| C-18 | ✅ | Vitest y Testing Library, Supertest con Postgres real, Playwright |
| C-19 | ✅ | Tests, lint y tipos en verde |
| C-20 | ✅ | Sin arrastre; teclado; foco atrapado; axe |
| C-21 | ✅ | Sin nada de «Fuera de alcance» |
| C-22 | ✅ | `formatLongDate` eliminada; las abstracciones nuevas tienen dos usos |
| C-23 | ✅ | Identificadores en inglés, textos en castellano |
| C-24 | ✅ | Desde T-030, commits con IDs. El historial anterior (`0e71e56`, `5104bad`) está en `main`, asumido y anotado en el Registro (I-3) |
| C-25 | ✅ | `pnpm lint` en verde |
| C-26 | ✅ | `DESIGN.md` 1.3.1-todo.1; desviaciones X-1 a X-9 justificadas en el plan |

C-3, C-6, C-12 y C-15 no se tocan.

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ✅ | 35/35 con esta (T-035) |
| Cada RF y CA con un test que pasa | ✅ | Ver la matriz |
| Cada caso límite implementado y probado | ✅ | E-1…E-24 |
| Sin código que no se trace | ✅ | |
| Tests, lint y tipos en verde (local y CI) | ✅ / ❓ | En local, en verde. No hay CI configurado |
| Sin `console.log`, código comentado ni TODO | ✅ | |
| Accesibilidad revisada | ✅ | axe en los dos temas y teclado; checklist §21 en T-027 |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ✅ | v1.1 |
| Desviaciones del plan anotadas en el plan | ✅ | |
| ADRs si hubo decisiones transversales | ✅ | No hubo |
| Estado de la spec → `implementada` | ⏳ | Pendiente de la confirmación del usuario |
| PR con enlace a la spec, requisitos e informe | ⏳ | PR de seguimiento con esta rama (la #2 ya está fusionada, I-2) |
| Revisada y aprobada | ⏳ | La revisión de la PR de seguimiento |
