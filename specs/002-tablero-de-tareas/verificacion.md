# Verificación · Spec 002 · 2026-10-31

Resultado: **APTO CON OBSERVACIONES**

## Resumen

- **Alcance revisado:** `spec.md` v1.0, `plan.md` (aprobado), `tasks.md` (28/29; falta T-029, que es esta verificación) y la constitución v1.1.
- **Diff revisado:** `adc7fa7..HEAD`, 74 ficheros. `main` ya contiene la rama: la PR #2 se fusionó **antes** de verificar (ver I-2). Por eso no se usa `git diff main...HEAD`, que sale vacío; la base es el `main` anterior a la fusión (`adc7fa7`, fusión de la 004).
- **Resultados de la ejecución:**

| Comprobación | Resultado |
|---|---|
| `pnpm test` | ✅ 38 ficheros, 753 tests en verde (Postgres de test levantado) |
| `pnpm lint` | ✅ ESLint y Prettier sin errores |
| `pnpm typecheck` | ✅ 0 errores (5 *hints* de Astro) |
| `pnpm test:e2e` (3 ficheros × `chromium`, `chrome`, `webkit`) | ✅ 177 pasan y 2 se saltan (RNF-004 solo en `chromium`). Un *flaky* en WebKit en `design-system.spec.ts` (CA-2.2 de la 004, «a 767»), que pasa al reintentar: es la deuda M-7 de la 004, no el tablero. `board.spec.ts` en verde en los tres proyectos |
| RNF-004 en esta ejecución | 171 ms (límite 2000 ms) |

- **Trazabilidad:** con un script sobre los nombres de los tests, cada uno de los 114 IDs (RF-001…RF-041, CA-1.1…CA-7.3, RNF-001…RNF-006 y E-1…E-24) tiene al menos un test de la spec 002 cuyo nombre empieza por él. También se leyeron los tests clave para comprobar que verifican lo que dicen: validaciones del diálogo, estado y fecha real de fin, borrado, flujo con teclado y móvil.
- **Prueba extra en el navegador:** se hizo para confirmar I-1, con un test temporal fuera del repositorio.
- **Conclusión:** la funcionalidad cumple la spec. No hay ningún problema bloqueante. Hay un defecto de comportamiento en móvil (I-1) y dos problemas de proceso (I-2, I-3) que conviene resolver o asumir por escrito antes de cerrar.

## Matriz de verificación

Leyenda: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable. «Pasa» = el test indicado pasa en esta ejecución.

### Requisitos funcionales

| ID | Código | Test | Pasa | Veredicto |
|---|---|---|---|---|
| RF-001 | `Board.tsx` (columnas en el orden de `TASK_STATUSES`) | `Board.test` (orden); e2e «CA-1.1 RF-001 RF-003…» | ✅ | ✅ |
| RF-002 | `task.repository.ts` `findTasksByUser` (`createdAt desc, id desc`); `Board.groupByStatus` conserva el orden | `tasks.list.test` (orden, E-22, E-24); `Board.test` (CA-1.8) | ✅ | ✅ |
| RF-003 | `Board.tsx:135`, `BoardColumn.tsx:51`, `dates.tasksCount` | `dates.test`, `Board.test`, e2e CA-1.1 | ✅ | ✅ |
| RF-004 | `tasks.service.listTasks(userId)` | `tasks.list.test` (ajenas fuera); e2e «CA-1.4 RF-004 RNF-003» | ✅ | ✅ |
| RF-005 | `BoardColumn.tsx:24-29,55` | `BoardColumn.test` (las cuatro frases) | ✅ | ✅ |
| RF-006 | `Board.tsx` `EmptyBoard` | `Board.test` (CA-1.3); e2e del flujo principal | ✅ | ✅ |
| RF-007 | `TaskCard.tsx` | `TaskCard.test` (CA-1.5, E-8, Done) | ✅ | ✅ |
| RF-008 | `PrivateArea.tsx` `LoadError` + `retry` | `PrivateArea.test` (tasks y me con NetworkError; reintento) | ✅ | ✅ |
| RF-009 | `BoardColumn.tsx:46` `aria-label` | `BoardColumn.test` (CA-1.7); e2e CA-1.1 (nombre accesible) | ✅ | ✅ |
| RF-010 | `TaskDialog.tsx` (modo creación) | `TaskDialog.test` «RF-010 D-9 campos…» | ✅ | ✅ |
| RF-011 | `POST` sin `status` → backlog | `tasks.create.test` (también con `status: 'done'`); `TaskDialog.test` CA-2.1 | ✅ | ✅ |
| RF-012 | `TaskCard` `<button>`; `TaskDialog` (edición) | `TaskDialog.test` «CA-3.1 RF-012 clic o Enter…»; e2e con teclado | ✅ | ✅ |
| RF-013 | `PUT` completo; `useUpdateTask` invalida antes de cerrar | `tasks.update.test`; `TaskDialog.test` CA-3.2 | ✅ | ✅ |
| RF-014 | `shared/tasks.ts` `titleSchema` | `tasks.test`; `task-form.test`; `TaskDialog.test` CA-2.3, CA-3.5 | ✅ | ✅ |
| RF-015 | ídem, en puntos de código | `tasks.test` (200/201, emoji); `TaskDialog.test` CA-2.4 | ✅ | ✅ |
| RF-016 | `descriptionSchema`; `task-form.ts` asigna el error a `description` | `tasks.test` (5000/5001); `tasks.create.test` (400); `FormField.test` (pinta el mensaje) | ✅ | ⚠️ ningún test lleva una descripción de 5001 caracteres por el diálogo ni por `useTaskForm` hasta ver el error bajo el campo (M-1) |
| RF-017 | `dates.parseDisplayDate`; `z.iso.date()` | `dates.test` (E-7); `TaskDialog.test` CA-2.6; `task-form.test` | ✅ | ✅ |
| RF-018 | `refine` `endNotBeforeStart` (`path: estimatedEndDate`) | `tasks.test`; `TaskDialog.test` CA-2.5 | ✅ | ✅ |
| RF-019 | `task-form.ts` `focusFirstError` | `task-form.test` «RF-019 un error por campo…»; `TaskDialog.test` (foco en cada caso) | ✅ | ✅ |
| RF-020 | `trim()` del título; descripción sin tocar | `tasks.test`; `tasks.create.test` E-5; `task-form.test` (saltos de línea) | ✅ | ✅ |
| RF-021 | `TaskDialog.requestClose`, vista `discard` | `TaskDialog.test` (Esc, «Cancelar», clic fuera); e2e del doble Esc | ✅ | ✅ (ver I-1: en móvil, una zona dentro del panel cuenta como «fuera») |
| RF-022 | `Board.tsx` `focusTarget` (D-14) | `TaskDialog.test` («Board · abrir y cerrar»); e2e CA-3.4 | ✅ | ✅ |
| RF-023 | `SegmentedControl` (radios nativos) | `SegmentedControl.test` (flechas); e2e CA-4.2 | ✅ | ✅ |
| RF-024 | invalidación de `['tasks']` (D-7) | `TaskDialog.test` CA-4.1 (recuentos); `task-queries.test` | ✅ | ✅ |
| RF-025 | `task-form.setStatus` | `task-form.test`; `TaskDialog.test` CA-4.3 | ✅ | ✅ |
| RF-026 | vista `confirmDelete` | `TaskDialog.test` CA-5.1, CA-5.3 | ✅ | ✅ |
| RF-027 | `DELETE`; foco en «Crear tarea» | `tasks.delete.test`; `TaskDialog.test` CA-5.2; e2e | ✅ | ✅ |
| RF-028 | `saveErrorText` en la alerta del diálogo | `TaskDialog.test` CA-2.7, «RF-028 un error inesperado (500)…», CA-4.4 | ✅ | ✅ |
| RF-029 | `deleteErrorText` | `TaskDialog.test` CA-5.4 | ✅ | ✅ |
| RF-030 | 404 `TASK_NOT_FOUND` (ruta y service); aviso del tablero | `tasks.update/delete.test` (inexistente, ajena, id mal formado); `TaskDialog.test` CA-3.6 y DELETE 404 | ✅ | ✅ |
| RF-031 | `Button` `loading`; `handleSubmit` ignora envíos con una petición en curso | `TaskDialog.test` E-15, «Guardando…», «Borrando…» | ✅ | ✅ |
| RF-032 | `dates.isOverdue`; insignia en `TaskCard` | `dates.test`; `TaskCard.test`; e2e CA-6.1 | ✅ | ✅ |
| RF-033 | `TaskDialog.tsx:180-186` | `TaskDialog.test` CA-6.2; e2e | ✅ | ✅ |
| RF-034 | selector `md:hidden` y `max-md:hidden` | `Board.test`; e2e CA-7.1 | ✅ | ✅ |
| RF-035 | clases `max-md:*` del `<dialog>` | `TaskDialog.test` (clases); e2e CA-7.2 (posición y ancho) | ✅ | ✅ (ver I-1) |
| RF-036 | `Board.tsx:121` `max-md:fixed…` | e2e CA-7.3 | ✅ | ✅ |
| RF-037 | `Board.tsx:133` `<h1>Tablero</h1>` | `Board.test`; `PrivateArea.test`; e2e `design-system.spec` (D-23) | ✅ | ✅ |
| RF-038 | `showActualEndDate` | `task-form.test`; `TaskDialog.test` CA-4.9 | ✅ | ✅ |
| RF-039 | `isActualEndDateAllowed` (front con `todayLocal`, API con «hoy UTC + 1») | `task-form.test`; `TaskDialog.test` CA-4.6; `tasks.service.test`; `tasks.update.test` | ✅ | ✅ |
| RF-040 | `refine` de Done sin fecha | `tasks.test`; `TaskDialog.test` CA-4.7; `tasks.update.test` | ✅ | ✅ |
| RF-041 | `transform` a `null` | `tasks.test`; `tasks.update.test`; `TaskDialog.test` CA-4.8, E-23 | ✅ | ✅ |

### Criterios de aceptación

| ID | Test principal | Pasa | Veredicto |
|---|---|---|---|
| CA-1.1 | e2e «CA-1.1 RF-001 RF-003…» (1280 px: regiones, h2 «Backlog · 2»… y «6 tareas»); `Board.test` | ✅ | ✅ |
| CA-1.2 | `BoardColumn.test`; e2e CA-1.1 («Nada terminado todavía») | ✅ | ✅ |
| CA-1.3 | `Board.test`; e2e del flujo principal | ✅ | ✅ |
| CA-1.4 | e2e con dos cuentas; `tasks.list.test` | ✅ | ✅ |
| CA-1.5 | `TaskCard.test` («14 nov → 28 nov», `wrap-anywhere`); `dates.test` | ✅ | ✅ |
| CA-1.6 | `PrivateArea.test` (mensaje en la alerta, debajo de la cabecera; «Reintentar» con éxito) | ✅ | ✅ |
| CA-1.7 | `BoardColumn.test` («In progress, 3 tareas») | ✅ | ✅ |
| CA-1.8 | `Board.test` (conserva el orden); `tasks.list.test` (fechas de creación forzadas) | ✅ | ✅ |
| CA-2.1 | `TaskDialog.test` (primera de Backlog y con el foco); e2e | ✅ | ✅ |
| CA-2.2 | `TaskDialog.test` (POST con ISO); `tasks.create.test` | ✅ | ✅ |
| CA-2.3 – CA-2.6 | `TaskDialog.test` `it.each` (sin POST, error bajo el campo y foco en él) | ✅ | ✅ |
| CA-2.7 | `TaskDialog.test` (NetworkError: sigue abierto, con lo escrito y la alerta) | ✅ | ✅ |
| CA-3.1 | `TaskDialog.test` (clic y Enter); e2e con teclado | ✅ | ✅ |
| CA-3.2 | `TaskDialog.test`; e2e | ✅ | ✅ |
| CA-3.3 | `TaskDialog.test` («Seguir editando», «Descartar cambios»); e2e (Esc doble, clic fuera) | ✅ | ✅ |
| CA-3.4 | `TaskDialog.test`; e2e (foco en la tarjeta) | ✅ | ✅ |
| CA-3.5 | `TaskDialog.test` | ✅ | ✅ |
| CA-3.6 | `TaskDialog.test` (PUT 404); `tasks.update.test` (PUT tras DELETE) | ✅ | ✅ |
| CA-4.1 | `TaskDialog.test` (columna y recuentos con `LiveBoard`) | ✅ | ✅ |
| CA-4.2 | e2e del flujo principal (Tab, Enter, flechas, Enter en «Guardar cambios») | ✅ | ✅ |
| CA-4.3 | `TaskDialog.test` («29/10/2026» → «29 oct»); e2e | ✅ | ✅ |
| CA-4.4 | `TaskDialog.test` (alerta, tarjeta sin moverse) | ✅ | ✅ |
| CA-4.5 – CA-4.7 | `TaskDialog.test`; `task-form.test`; `tasks.update.test` | ✅ | ✅ |
| CA-4.8 | `TaskDialog.test` (PUT con `actualEndDate: null`; al volver a Done, hoy) | ✅ | ✅ |
| CA-4.9 | `TaskDialog.test`; `task-form.test` | ✅ | ✅ |
| CA-5.1 | `TaskDialog.test` (pregunta, opciones, mismo diálogo); e2e | ✅ | ✅ |
| CA-5.2 | `TaskDialog.test`; e2e | ✅ | ✅ |
| CA-5.3 | `TaskDialog.test` `it.each` («Cancelar» y Esc) | ✅ | ✅ |
| CA-5.4 | `TaskDialog.test` | ✅ | ✅ |
| CA-5.5 | `TaskDialog.test`; e2e (estado vacío y foco) | ✅ | ✅ |
| CA-6.1 | `TaskCard.test`; e2e | ✅ | ✅ (el estado lo da la columna; la tarjeta no repite el estado) |
| CA-6.2 | `TaskDialog.test` («…el 28 oct.»); e2e | ✅ | ✅ |
| CA-6.3 – CA-6.5 | `TaskCard.test`; `dates.test` | ✅ | ✅ |
| CA-7.1 | e2e a 375 (Backlog al empezar, «Done · 1», sin scroll horizontal) | ✅ | ✅ |
| CA-7.2 | e2e a 375 (panel abajo a todo el ancho; cambio de estado) | ✅ | ✅ El e2e solo cambia el estado; editar y borrar en el panel van por el mismo componente, probado en unitarios. Ver I-1 |
| CA-7.3 | e2e a 375 (botón en la mitad inferior y dentro de la ventana) | ✅ | ✅ |

### Requisitos no funcionales

| ID | Evidencia | Pasa | Veredicto |
|---|---|---|---|
| RNF-001 | axe (AA + `color-contrast-enhanced`) en el tablero y en el diálogo, claro y oscuro; `tokens.test` (parejas de R-1); e2e solo con teclado. La checklist manual §21 consta en el Registro de T-027 y no se ha repetido | ✅ | ✅ (la parte manual, ❓ no repetida) |
| RNF-002 | e2e de 320 a 1600 con y sin diálogo; zoom al 200 % | ✅ | ✅ |
| RNF-003 | `tasks.update/delete.test` (tarea ajena → 404 igual que inexistente); `tasks.list.test`; esquema solo con los datos del glosario | ✅ | ✅ |
| RNF-004 | e2e `chromium`: 171 ms con 500 tareas | ✅ | ✅ |
| RNF-005 | `board.spec.ts` en `chromium`, `chrome` y `webkit` | ✅ | ✅ |
| RNF-006 | `tokens.test` (tokens nuevos); `design-rules.test` sin cambios y en verde | ✅ | ✅ |

### Casos límite

| ID | Evidencia | Veredicto |
|---|---|---|
| E-1 | `Board.test` | ✅ |
| E-2 | e2e RNF-004/E-2 (scroll propio, cabecera visible, `scrollY` = 0) | ✅ |
| E-3 | `tasks.test` (200/201 con emoji) | ✅ |
| E-4 | e2e (no desborda); `TaskCard.test` (`wrap-anywhere`) | ✅ |
| E-5 | `tasks.test`; `tasks.create.test` | ✅ |
| E-6 | `tasks.test` | ✅ (en la interfaz, ver M-1) |
| E-7 | `dates.test`; `task-form.test` | ✅ |
| E-8 | `TaskCard.test`; `tasks.test` | ✅ |
| E-9 | `tasks.test` | ✅ |
| E-10 | `dates.test` (TZ adelantada, 00:30 local) | ✅ |
| E-11 | `dates.test` (cambiar la hora simulada cambia el resultado) | ✅ |
| E-12 | `TaskDialog.test` (401 → `location.replace`); `PrivateArea.test` | ✅ |
| E-13 | `tasks.update.test` (dos PUT seguidos) | ✅ |
| E-14 | `tasks.update/delete.test`; `TaskDialog.test` | ✅ |
| E-15 | `TaskDialog.test` (doble clic → un POST) | ✅ |
| E-16 | e2e (1280 → 375 → 1280 con lo escrito) | ✅ |
| E-17 | e2e (Done a 375 → cuatro columnas a 1280) | ✅ |
| E-18 | `tasks.update/delete.test`; `tasks.service.test` | ✅ |
| E-19 | `dates.test`; `Board.test`; `BoardColumn.test` | ✅ |
| E-20 | `tasks.test` | ✅ |
| E-21 | `task-form.test`; `TaskDialog.test` | ✅ |
| E-22 | `tasks.list.test` | ✅ |
| E-23 | `tasks.test`; `task-form.test`; `TaskDialog.test` | ✅ |
| E-24 | `tasks.list.test` (mismo `createdAt`, desempate por `id`) | ✅ |

## Problemas

### Bloqueantes

Ninguno.

### Importantes

- **I-1 · En móvil, tocar junto al asa del panel inferior lo cierra como un «clic fuera»** (RF-021, RF-035, CA-7.2, D-12)
  - **Dónde:**
    - `apps/web/src/components/TaskDialog.tsx:110-112`: el cierre se activa con `event.target === event.currentTarget`.
    - `TaskDialog.tsx:169-173`: el asa es un `<span>` `block mx-auto mt-3 w-9`.
  - **Causa:** D-12 da por hecho que «el contenido llena el diálogo», pero no es así en el panel inferior. El margen superior del asa (12 px) y los márgenes laterales (`mx-auto`) son área del propio `<dialog>`.
  - **Comprobado en `chromium` a 375 px:** un toque 8 px por debajo del borde superior del panel y a 40 px de su borde izquierdo da `elementFromPoint` = `DIALOG`, y el diálogo se cierra.
    - Sin cambios, se cierra.
    - Con cambios, pregunta «¿Descartar los cambios?», así que no se pierde nada sin aviso.
  - Por la misma causa, en escritorio un clic en la barra de scroll del diálogo (`overflow-y-auto`) también contaría como «fuera». Esto **no se ha comprobado**.
  - **Propuesta:**
    - que el «clic fuera» compare con el rectángulo del contenido (o con un contenedor interno que llene el diálogo), y no con `target === dialog`;
    - o que el asa esté dentro del contenedor del contenido.
    - Añadir un e2e a 375 px que toque junto al asa y compruebe que el diálogo sigue abierto.
- **I-2 · La PR se fusionó en `main` antes de verificar** (DoD «Entrega»)
  - `main` = `079c199 Merge pull request #2 … feat/002-tablero-de-tareas`, sin este informe ni la spec en `implementada`.
  - **Propuesta:** dejar constancia en la PR o en el Historial del roadmap. Los cambios de esta verificación, y los arreglos de I-1 si se hacen, irán en una PR de seguimiento.
- **I-3 · El historial de commits no sigue `tasks.md` ni C-24** (C-24, reglas de `tasks.md`: «Una tarea = un commit» y «anotar el commit»)
  - De T-002 a T-028 todo va en dos commits:
    - `0e71e56`, titulado «T-004 PUT y DELETE en apiFetch», contiene en realidad la migración y el esquema de **T-002**, y nada de `apiFetch`.
    - `5104bad`, «feat(web): spec 2», con 57 ficheros, sin IDs de tarea y con cambios de API (`feat(web)`).
  - El Registro de `tasks.md` tiene «—» en la columna Commit de T-002 a T-028.
  - **Propuesta:** el historial ya está en `main` y no se reescribe. Anotar la desviación en el Registro (qué commit contiene cada tarea) y, para la 003, volver a un commit por tarea.

### Menores

- **M-1 · RF-016 no se prueba en la interfaz.** El límite de 5000 caracteres de la descripción se prueba en `shared`, en la API y en el pintado de `FormField`. Ningún test envía 5001 caracteres por `useTaskForm` o `TaskDialog` hasta ver el mensaje bajo «Descripción» con el foco en el campo. El código lo resuelve por la ruta genérica (`task-form.ts`, que asigna el error por `path`). **Propuesta:** añadir el caso al `it.each` de `TaskDialog.test.tsx:325`.
- **M-2 · Un `console.log` en un test.** Está en `e2e/board.spec.ts:465` (tiempo de RNF-004), contra la DoD («sin `console.log`»). **Propuesta:** `test.info().annotations.push({ type: 'RNF-004', description: \`${elapsed} ms\` })`.
- **M-3 · Código sin uso.** `formatLongDate` (`apps/web/src/lib/dates.ts:62`) solo se usa en su test. El detalle muestra las fechas en los campos («14/11/2026») y el aviso de retraso en formato corto (CA-6.2). **Propuesta:** quitarla, o anotar en el plan por qué se conserva (D-18 la preveía).
- **M-4 · Dos acentos en el detalle, contra D-15.** D-15 y X-3 dicen «un solo acento por vista», pero en el detalle conviven la opción elegida del estado (`TaskDialog.tsx:213-219`, D-15) y «Borrar tarea» en `destructive`/`--pill-rose` (`TaskDialog.tsx:264`, D-19, §11.4). Lo señaló T-027 y no se decidió. **Propuesta:** decidirlo y anotarlo en el plan (por ejemplo, «Borrar tarea» en glass dentro del detalle y `destructive` solo en la confirmación), o aceptarlo como excepción en X-3.
- **M-5 · Desviaciones del plan anotadas solo en el Registro.** La DoD pide que estén en el plan:
  - `SegmentedControl` pasa de `h-11` a `min-h-11 flex-auto px-2 py-1` (T-024);
  - `Icon` admite `size={26}` (T-017);
  - `Button` acepta `autoFocus` y `ref` (T-019).

  Ninguna contradice una decisión. **Propuesta:** una línea por cada una en el plan, como se hizo con X-9.
- **M-6 · Cambios ajenos a la spec en la rama.** `.claude/commands/*.md`, `.claude/settings.json` y `CLAUDE.md` (commit `e19428b chore: …`) son herramientas del flujo, no de la 002. No afectan al producto; solo se anotan para la descripción de la PR.

## Deriva spec ↔ código

| Punto | Spec | Código | Valoración |
|---|---|---|---|
| Clic fuera en móvil | RF-021: preguntar o cerrar al pulsar **fuera** del diálogo | Un toque dentro del panel, junto al asa, cuenta como fuera | Deriva (I-1) |
| Fechas en el detalle | §10 Supuestos: «en el detalle, siempre con año» | Campos «28/10/2026» (con año); aviso de retraso «28 oct» sin año | El código sigue CA-6.2 y D-18. La spec se contradice entre §10 y CA-6.2. **Propuesta:** precisar §10 («los campos del detalle, siempre con año») con `/sdd-cambiar-spec` cuando haya otro cambio |
| Textos no fijados por la spec | — | Títulos «Nueva tarea» / «Detalle de la tarea», carpetas «Datos» / «Fechas», ayuda «Ejemplo: 14/11/2026», «Fin estimado:» / «Inicio estimado:» | Fijados en `DESIGN.md` §11.4 y §13 y en el plan (D-10, D-17). Sin deriva: los textos los manda `DESIGN.md` (C-26) |
| Alcance | §9 Fuera de alcance | No se implementa nada de §9: sin arrastre, sin estado al crear, sin toasts, sin «Deshacer», sin calendario, sin deslizar | Sin deriva |

## Constitución

| Artículo | Estado | Nota |
|---|---|---|
| C-1 | ✅ | Sin `any` en código de producción (solo `expect.any` en tests) ni `@ts-ignore` |
| C-2 | ✅ | Sin dependencias nuevas (`package.json` y lockfile sin cambios) |
| C-4 | ✅ | El tablero vive en la isla `PrivateArea`; datos con TanStack Query; los efectos solo sincronizan con el DOM (`showModal`, foco). El borrador del formulario está justificado en D-13 |
| C-5 | ✅ | Migración `20261030183329_tasks_init` nueva; la de la 001 no cambia |
| C-7 | ✅ | Rutas relativas `/api/tasks` |
| C-8 | ✅ | `routes → services → repositories`; de producción, solo los repositories importan Prisma (`tasks.service.test.ts` lo usa para crear usuarios, como los tests de la 001) |
| C-9 | ✅ | `TASK_NOT_FOUND` en `ERROR_CODES`; el front decide el texto |
| C-10 | ✅ | Esquemas, mensajes y `isActualEndDateAllowed` en `shared`; ni web ni api los duplican |
| C-11 | ✅ | `@db.Date` y `YYYY-MM-DD`; conversión solo en el repository |
| C-13 | ✅ | `where: { id, userId }`; ajena, inexistente e id mal formado → 404 `TASK_NOT_FOUND`; un test de tarea ajena por operación (GET, PUT, DELETE) |
| C-14 | ✅ | `validateBody` con los esquemas de `shared`; `:id` con `taskIdSchema` |
| C-16 | ✅ | Solo los datos del glosario; `ON DELETE CASCADE` (probado) |
| C-17 | ✅ | Todos los RF con test (RF-016 en la interfaz, parcial: M-1) |
| C-18 | ✅ | Vitest y Testing Library, Supertest contra Postgres real, Playwright |
| C-19 | ✅ | Tests, lint y tipos en verde |
| C-20 | ✅ | Cambio de estado sin arrastre, con radios nativos; foco atrapado en el `<dialog>`; axe AA + AAA de contraste |
| C-21 | ✅ | Nada de «Fuera de alcance» implementado |
| C-22 | ⚠️ | `formatLongDate` sin uso real (M-3) |
| C-23 | ✅ | Identificadores en inglés, textos en castellano |
| C-24 | ❌ | Commits sin IDs y uno mal etiquetado (I-3) |
| C-25 | ✅ | `pnpm lint` en verde |
| C-26 | ✅ | `DESIGN.md` 1.3.0-todo.1 con los tokens y desviaciones X-1…X-9; queda abierta la incoherencia de acentos (M-4) |

C-3, C-6, C-12 y C-15 no se tocan.

## Definition of Done

| Punto | Estado | Nota |
|---|---|---|
| Todas las tareas `[x]` | ✅ | 28/29; T-029 es esta verificación |
| Cada RF y CA con un test que pasa | ✅ | Ver la matriz (RF-016 en la interfaz, M-1) |
| Cada caso límite implementado y probado | ✅ | E-1…E-24 |
| Sin código que no se trace | ⚠️ | `formatLongDate` (M-3) |
| Tests, lint y tipos en verde (local y CI) | ✅ / ❓ | En local, en verde. No hay CI configurado |
| Sin `console.log`, código comentado ni TODO | ⚠️ | `e2e/board.spec.ts:465` (M-2) |
| Accesibilidad revisada | ✅ | axe en los dos temas, teclado y checklist §21 (T-027) |
| Sin secretos ni datos personales | ✅ | |
| `spec.md` refleja el código | ⚠️ | I-1 y la frase de §10 sobre el año |
| Desviaciones del plan anotadas en el plan | ⚠️ | M-5 |
| ADRs si hubo decisiones transversales | ✅ | No hubo |
| Estado de la spec → `implementada` | ⏳ | Pendiente de la confirmación del usuario |
| PR con enlace a la spec, requisitos e informe | ❌ | PR #2 ya fusionada sin el informe (I-2) |
| Revisada y aprobada | ❓ | No consta la revisión |
