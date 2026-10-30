---
spec: 002
plan_aprobado: 2026-10-30
progreso: 0/29
---

# Tareas · Spec 002 · Tablero de tareas

> Reglas:
> - Una tarea = 15 min a 2 h = un commit.
> - Orden de ejecución de arriba abajo, respetando "Depende de".
> - `[P]` = se puede hacer en paralelo con otras `[P]` de la misma fase (no tocan los mismos ficheros).
> - Al terminar: marcar `[x]`, actualizar `progreso` y anotar el commit.
> - Cada test empieza por el ID que verifica (`it('CA-1.2 …')`, `it('E-8 …')`, `test('RNF-002 …')`), para comprobar la trazabilidad con `grep` (T-028).
> - Lo que se descubra o se decida al implementar (versiones, nombres, desviaciones) va en el Registro. Si cambia una decisión, también va al plan como `D-x (añadida en T-0xx)`.
>
> Convenciones de esta spec:
> - **Rama:** `feat/002-tablero-de-tareas` (la crea T-001). Commits como `feat(api): T-0xx … [spec 002]` (C-24).
> - **Dependencias:** ninguna nueva (plan §2). Ninguna tarea toca `package.json` ni `pnpm-lock.yaml`.
> - **Test primero y C-19:**
>   - Cada tarea de las fases 3 y 4 escribe primero sus tests unitarios o de integración y los ve fallar por la razón correcta (se anota en el Registro). Después implementa y termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde.
>   - Los E2E nuevos (`e2e/board.spec.ts`) se escriben en T-005 y **pueden quedar en rojo** hasta T-025, salvo el del doble Esc, que tiene que pasar en T-019. `pnpm test:e2e` no forma parte de C-19.
>   - `e2e/auth.spec.ts` (la 001) y `e2e/design-system.spec.ts` (la 004) siguen en verde, salvo lo que cambia D-23 en T-018.
> - **Contratos:** los de plan §4.2 y §4.3.
> - **Valores visuales:** salen solo de `tokens.css` (ADR-0003). Los colores de texto, según D-9 (plan §5, R-1).
> - **Postgres:** `pnpm test` (proyecto `api`) y `pnpm test:e2e` necesitan `pnpm db:up`.

## Fase 1 · Preparación

Secuencial.

- [ ] **T-001** Crear la rama y registrar los documentos de la spec
  - Ficheros: `specs/002-tablero-de-tareas/{spec,plan,research,tasks}.md`, `specs/roadmap.md`, `specs/004-sistema-de-diseno/spec.md` (nota de 002/RF-037)
  - Cubre: C-24
  - Hecho cuando: existe la rama `feat/002-tablero-de-tareas`, creada desde `main`; un commit `docs(spec-002): …` contiene solo esos ficheros; `git status` limpio

- [ ] **T-002** Añadir el modelo `Task` y la migración `tasks_init`
  - Depende de: T-001
  - Ficheros: `apps/api/prisma/schema.prisma` (`enum TaskStatus`, `model Task`, `tasks Task[]` en `User`), `apps/api/prisma/migrations/<timestamp>_tasks_init/migration.sql` (generada con `pnpm db:migrate`), `apps/api/test/setup.ts` (`TRUNCATE "Task", "Session", "User"`)
  - Cubre: D-1, C-5, C-11, C-16 (plan §4.2)
  - Hecho cuando:
    - la migración crea el enum, la tabla con `@db.Date` en las tres fechas, `VarChar(200)` y `VarChar(5000)`, la clave foránea con `ON DELETE CASCADE` y el índice `(userId, createdAt)`;
    - la migración de la 001 no cambia (`git diff` vacío en ella);
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

## Fase 2 · Contratos y tests

T-003 y T-004 terminan en verde. T-005 escribe los E2E, que **deben fallar** por la razón indicada (se anota en el Registro), sin errores de sintaxis ni de tipos. Los tests de integración de la API van en T-007, con la ruta: `pnpm test` tiene que acabar cada tarea en verde (C-19).

- [ ] **T-003** [P] Definir los esquemas, tipos y reglas de la tarea en `shared`
  - Depende de: T-001
  - Ficheros:
    - `packages/shared/src/tasks.ts` (nuevo, plan §4.2) y `tasks.test.ts` (nuevo);
    - `packages/shared/src/errors.ts` (`TASK_NOT_FOUND`), `index.ts`;
    - `apps/web/src/lib/messages.ts`: `TASK_NOT_FOUND` con el texto genérico de la 001, para que `Record<ErrorCode, …>` compile (D-19).
  - Cubre: RF-014, RF-015, RF-016, RF-017 (fecha ISO), RF-018, RF-020, RF-039 (`isActualEndDateAllowed`), RF-040, RF-041, E-3, E-5, E-6, E-8, E-9, E-20, E-23, D-4
  - Casos (test primero):
    - título vacío o solo con espacios;
    - 200 / 201 puntos de código, con emoji;
    - recorte del título;
    - descripción de 5000 / 5001, con saltos de línea conservados;
    - fecha ISO inexistente (`2026-02-31`);
    - fin anterior a inicio (con `path` en `estimatedEndDate`); fin igual a inicio; una fecha sin la otra;
    - Done sin fin real; otro estado con fin real → `null`;
    - fin real anterior al inicio estimado, válido;
    - `isActualEndDateAllowed` en el límite;
    - un mensaje por campo; `status` fuera del enum; `taskIdSchema` con un id que no es un UUID.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-004** [P] Admitir `PUT` y `DELETE` en `apiFetch`
  - Depende de: T-001
  - Ficheros: `apps/web/src/lib/api.ts`, `apps/web/src/lib/api.test.ts`
  - Cubre: D-21 (base de RF-013 y RF-027)
  - Casos (test primero):
    - `PUT` y `DELETE` llevan `Content-Type: application/json` y un cuerpo JSON (`{}` en `DELETE` sin datos);
    - `204` → `undefined`;
    - el tratamiento de errores es el mismo que con `POST`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-005** Escribir los E2E del tablero (en rojo)
  - Depende de: T-001
  - Ficheros: `e2e/board.spec.ts` (nuevo), `e2e/helpers.ts` (`createTaskViaApi`, `boardColumn`, `taskCard`, `createTaskButton`)
  - Cubre: RF-021 (doble Esc, D-24), CA-1.1, CA-1.3, CA-1.4, CA-2.1, CA-3.1, CA-3.3, CA-4.1, CA-4.2, CA-4.3, CA-5.1, CA-5.2, CA-6.1, CA-7.1, CA-7.2, CA-7.3, RNF-001, RNF-002, RNF-004, RNF-005, E-2, E-4, E-16, E-17
  - Casos (plan §7):
    - **D-24, el primero:** con cambios sin guardar, dos Esc seguidos no cierran el diálogo.
    - **Flujo principal solo con teclado:** registro → estado vacío → crear → abrir → editar → In progress → Done con fecha → borrar.
    - **Aislamiento:** dos cuentas.
    - **Retrasada:** fin estimado de ayer.
    - **Móvil a 375 px:** selector de columna, panel inferior y «Crear tarea» a la vista.
    - **Responsive:** los seis anchos y el zoom al 200 %.
    - **E-16 y E-17.**
    - **E-4:** título de 200 caracteres sin espacios.
    - **axe** en el tablero y en el diálogo, en claro y oscuro.
    - **RNF-004 y E-2** (solo `chromium`): 500 tareas por `page.request`, las columnas en ≤ 2 s, y la cabecera visible al hacer scroll en una columna de 200.
  - Hecho cuando: `pnpm test:e2e e2e/board.spec.ts` falla porque no existe el tablero (no por la sintaxis ni por los tipos); `auth.spec.ts` y `design-system.spec.ts` siguen en verde; `pnpm typecheck` y `pnpm lint` en verde

## Fase 3 · Núcleo

- [ ] **T-006** Implementar el repository y el service de tareas
  - Depende de: T-002, T-003
  - Ficheros:
    - `apps/api/src/repositories/task.repository.ts`: conversión de fechas (D-5) y P2025 → `null`/`false` (D-3);
    - `apps/api/src/services/tasks.service.ts`: `userId` en cada llamada, límite de «hoy UTC + 1» con `now` (D-6), `TASK_NOT_FOUND`;
    - `apps/api/src/services/tasks.service.test.ts` (nuevo).
  - Cubre: RF-002, RF-004, RF-011, RF-013, RF-027, RF-030, RF-039, RF-041, D-1, D-3, D-5, D-6, D-25, C-8, C-13
  - Casos (test primero, en el service con Postgres real):
    - con `now` fijo, el fin real «hoy UTC + 1» se acepta y «+ 2» lanza `VALIDATION_ERROR`;
    - `updateTask` y `deleteTask` de una tarea ajena lanzan `TASK_NOT_FOUND` y no la cambian.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; solo `task.repository.ts` importa Prisma

- [ ] **T-007** Añadir las rutas `/api/tasks`, con sus tests de integración primero
  - Depende de: T-006
  - Ficheros: `apps/api/test/tasks.list.test.ts`, `tasks.create.test.ts`, `tasks.update.test.ts`, `tasks.delete.test.ts` (nuevos); `apps/api/test/helpers.ts` (`signupCookie(email)`, `createTaskFor(cookie, input)`); `apps/api/src/routes/tasks.routes.ts` (nuevo: `requireAuth`, `validateBody`, `:id` con `taskIdSchema` → `TASK_NOT_FOUND`); `apps/api/src/app.ts`
  - Cubre: RF-002, RF-004, RF-011, RF-013, RF-027, RF-030, RF-039 (API), RF-040, RF-041, RNF-003, CA-1.4, E-5, E-13, E-14, E-18, E-22, E-24, C-7, C-9, C-13, C-14, C-16 (plan §4.3, API)
  - Casos (test primero; fallan con 404 `NOT_FOUND` hasta montar la ruta):
    - **GET:** solo las tareas propias; recuento sin las ajenas; orden `createdAt desc` con fechas forzadas; desempate por `id` con el mismo `createdAt` (E-24); cambiar de estado no cambia el orden (E-22).
    - **POST:**
      - 201 con `status: 'backlog'`, también si el cuerpo trae `status: 'done'`;
      - título recortado;
      - 400 `VALIDATION_ERROR`;
      - 401 sin sesión;
      - 415 sin JSON.
    - **PUT:**
      - 200 con sustitución completa;
      - dos PUT seguidos: queda el segundo (E-13);
      - pasar a otro estado deja el fin real en `null` (CA-4.8);
      - Done sin fin real → 400;
      - fin real «pasado mañana UTC» → 400.
    - **DELETE:** 204.
    - **404 `TASK_NOT_FOUND` en PUT y DELETE:** tarea inexistente, **ajena** y con id mal formado (C-13, uno por operación); PUT o DELETE después de un DELETE (E-14).
    - **Cascada:** borrar el usuario borra sus tareas (C-16).
  - Hecho cuando: los tests fallan primero por la ruta que falta; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-008** [P] Formatear fechas y recuentos, y calcular «hoy» y «retrasada»
  - Depende de: T-003
  - Ficheros: `apps/web/src/lib/dates.ts`, `apps/web/src/lib/dates.test.ts` (nuevos)
  - Cubre: RF-003 (`tasksCount`), RF-017 (lectura «dd/mm/aaaa»), RF-032 (`isOverdue`), CA-6.3, CA-6.4, CA-6.5, E-7, E-10, E-11, E-19, D-17, D-18, R-3
  - Casos (test primero):
    - `parseDisplayDate`: «14/11/2026», «1/2/2026», «» → `null`; «31/02/2026», «2026-11-14» y «14/11/26» → `'invalid'`.
    - `formatShortDate`: sin año el año en curso y con año otro año; septiembre sale «sept».
    - `formatLongDate` y `formatDisplayDate`.
    - `todayLocal` con `TZ` adelantada y las 00:30 locales (E-10).
    - `isOverdue`: ayer sí; hoy no; Done no; sin fecha no.
    - Cambiar la hora simulada cambia el resultado (E-11).
    - `tasksCount(0 | 1 | 6)`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-009** [P] Crear la consulta y las mutaciones de tareas y los textos de sus errores
  - Depende de: T-003, T-004
  - Ficheros: `apps/web/src/lib/task-queries.ts`, `apps/web/src/lib/task-messages.ts`, `apps/web/src/lib/task-messages.test.ts`, `apps/web/src/lib/task-queries.test.tsx` (nuevos)
  - Cubre: RF-008 (texto), RF-024 (la lista se vuelve a pedir), RF-028, RF-029, RF-030 (texto), D-7, D-19
  - Casos (test primero):
    - `useCreateTask`, `useUpdateTask` y `useDeleteTask` solo se resuelven después de volver a pedir `GET /api/tasks`;
    - `TASK_NOT_FOUND` también invalida la lista;
    - textos de cargar, guardar y borrar para `NetworkError` y para un `ApiError` inesperado;
    - `TASK_NOT_FOUND` → «Esta tarea ya no existe.».
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-010** Implementar el borrador y la validación del formulario de tarea
  - Depende de: T-003, T-008
  - Ficheros: `apps/web/src/lib/task-form.ts`, `apps/web/src/lib/task-form.test.tsx` (nuevos)
  - Cubre: RF-014, RF-015, RF-016, RF-017, RF-018, RF-019, RF-021 (detección de «sin cambios»), RF-025, RF-038, RF-039 (fecha local), RF-040, RF-041, E-21, E-23, D-13
  - Casos (test primero, con `renderHook`):
    - borrador desde una tarea y vacío en creación; «sin cambios» al abrir y tras volver al valor inicial;
    - un error por campo y el foco en el primero, en el orden del formulario;
    - fecha inválida → mensaje de RF-017;
    - fin real posterior a hoy local → mensaje de RF-039;
    - elegir Done desde otro estado rellena hoy; si la tarea guardada ya estaba en Done, restaura su fecha;
    - con otro estado, el campo desaparece y se envía `null`;
    - editar el título de una tarea en Done conserva su fecha (E-21).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-011** [P] Añadir los tokens nuevos, las utilidades del tablero y las parejas de contraste de R-1
  - Depende de: T-001
  - Ficheros:
    - `apps/web/src/styles/tokens.css`: `--surface-veil`, `--veil-filter` y `--board-column-min`;
    - `apps/web/src/styles/global.css`: `dialog::backdrop` (D-22); utilidades `board-columns`, `board-columns-two` y `sheet-max-height` (D-16);
    - `apps/web/src/styles/tokens.test.ts`: valores esperados, superficies y parejas de R-1, y la pareja del título renombrada a «Tablero» (D-23).
  - Cubre: RNF-001, RNF-006, D-9, D-16, D-22, X-1, X-2, X-3 (plan §4.6, §7)
  - Casos (test primero):
    - los tokens nuevos tienen el valor de plan §4.6;
    - las parejas texto–superficie de D-9 cumplen el mínimo en N, SB y C+, claro y oscuro, con los números de R-1;
    - parejas de elementos no textuales: icono de estado en `--text-2` sobre la columna, anillo de error sobre `folderField` y contorno de foco sobre las superficies nuevas, ≥ 3:1.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` en verde sin cambiarlo

## Fase 4 · Integración / UI

- [ ] **T-012** [P] Añadir la variante `destructive` a `Button` y las variantes nuevas a `FormField`
  - Depende de: T-011
  - Ficheros: `apps/web/src/components/Button.tsx`, `Button.test.tsx`, `FormField.tsx`, `FormField.test.tsx` (nuevo si no existe)
  - Cubre: RF-010 («(opcional)»), D-9, D-17, D-19
  - Casos (test primero):
    - `destructive` usa `--pill-rose` y `--text-on-pill`;
    - `FormField`:
      - `type="text"` con `inputMode="numeric"` y `autoComplete="off"`;
      - `multiline` es un `<textarea>`;
      - `optional` añade «(opcional)» a la etiqueta;
      - `help` y el error se enlazan con `aria-describedby`.
    - Los tests de la 001 y la 004 siguen en verde.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-013** [P] Crear `SegmentedControl` con radios nativos
  - Depende de: T-011
  - Ficheros: `apps/web/src/components/SegmentedControl.tsx`, `SegmentedControl.test.tsx` (nuevos)
  - Cubre: RF-023, RF-034, CA-4.2 (flechas), D-15, X-4
  - Casos (test primero):
    - `<fieldset>` con `<legend>`, un radio por opción con su etiqueta y el elegido marcado;
    - las flechas cambian la opción (`user-event`) y llaman a `onChange`;
    - `selectedTone` aplica la clase del tono solo a la opción elegida;
    - opciones de 44 px (`h-11`).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-014** [P] Crear `FolderCard`
  - Depende de: T-011
  - Ficheros: `apps/web/src/components/FolderCard.tsx`, `FolderCard.test.tsx` (nuevos)
  - Cubre: D-22, §5 (tarjeta carpeta)
  - Casos (test primero):
    - el título es un encabezado y agrupa su contenido (`role="group"` con `aria-labelledby`);
    - la forma va en un SVG `aria-hidden` con `fill-folder`;
    - sin `style=` ni corchetes (lo vigila `design-rules.test`).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; una captura a 375 y 1280 en los dos temas, anotada en el Registro

- [ ] **T-015** [P] Preparar las utilidades de test para el tablero
  - Depende de: T-003
  - Ficheros: `apps/web/src/components/test-utils.tsx`
  - Cubre: plan §7 (doble de `showModal`, rutas de `/api/tasks`)
  - Casos:
    - si jsdom no tiene `HTMLDialogElement.prototype.showModal` ni `close`, se instala un doble mínimo (`open` y el evento `close`);
    - `taskFixture(overrides)` y la ruta por defecto `GET /api/tasks` → `{ tasks: [] }`.
  - Hecho cuando: los tests actuales de `apps/web` siguen en verde; un test temporal comprueba el doble (se borra al terminar); `pnpm typecheck` en verde

- [ ] **T-016** Crear `TaskCard` y `BoardColumn`
  - Depende de: T-008, T-015
  - Ficheros: `apps/web/src/components/TaskCard.tsx`, `TaskCard.test.tsx`, `BoardColumn.tsx`, `BoardColumn.test.tsx` (nuevos)
  - Cubre: RF-005, RF-007, RF-009, RF-032, CA-1.2, CA-1.5, CA-1.7, CA-6.1, CA-6.3, CA-6.4, CA-6.5, E-4, E-8, D-10, D-11, X-1, X-2, X-3
  - Casos (test primero):
    - **`TaskCard`:**
      - es un `<button>` con `data-task-id`;
      - título completo con `wrap-anywhere`;
      - fechas: «14 nov → 28 nov», «Fin estimado: 28 nov» o «Inicio estimado: 14 nov»;
      - en Done, la fecha real con «Fecha real de fin:» para lectores de pantalla;
      - insignia «Retrasada» solo según `isOverdue`;
      - fechas en `--text-2`;
      - con hover, sin `hover:bg-raised-hover`.
    - **`BoardColumn`:**
      - `<section>` con nombre «In progress, 3 tareas»;
      - `<h2>` con icono, nombre y «· 3»;
      - lista `<ul>`;
      - hueco vacío con las cuatro frases de RF-005 en `--text-2`;
      - `hiddenOnMobile` → `max-md:hidden`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-017** Crear `Board` con el título, el recuento, las columnas, el estado vacío y el selector de columna
  - Depende de: T-013, T-016
  - Ficheros: `apps/web/src/components/Board.tsx`, `Board.test.tsx` (nuevos)
  - Cubre: RF-001, RF-002 (conserva el orden), RF-003, RF-006, RF-034, RF-037, CA-1.1, CA-1.3, CA-1.8, E-1, D-11, X-8
  - Casos (test primero):
    - `<h1>` «Tablero» y «6 tareas» en `--text-2`;
    - cuatro columnas en orden, con las tareas de cada estado en el orden recibido;
    - sin tareas, el estado vacío de §12 con su «Crear tarea» y sin columnas ni otro primario;
    - el selector de columna (`md:hidden`) con «Estado · n» cambia qué columna pierde `max-md:hidden`; empieza en Backlog;
    - la zona de alerta del tablero existe y está vacía.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-018** Pintar el tablero en la zona privada, con el error de carga y el título «Tablero»
  - Depende de: T-009, T-017
  - Ficheros:
    - `apps/web/src/components/PrivateArea.tsx`: `useTasks`, error de página y «Reintentar» (D-8);
    - `PrivateArea.test.tsx`;
    - `apps/web/src/components/AppHeader.tsx` y `AppHeader.test.tsx`: `email` opcional;
    - `e2e/design-system.spec.ts`: `viewTitle` → «Tablero» (D-23).
  - Cubre: RF-004, RF-008, RF-037, CA-1.6, D-8, D-23
  - Casos (test primero):
    - con sesión, se ve el tablero y el único `h1` es «Tablero»; la cabecera y la pestaña siguen diciendo «Mis tareas»;
    - `GET /api/tasks` con `NetworkError` → el mensaje de RF-008 en la zona `role="alert"`, que ya estaba en la página, con «Reintentar»; al reintentar con éxito, se ve el tablero;
    - `me` con `NetworkError` → la cabecera sin email ni «Cerrar sesión» y el mismo error;
    - los tests de la 001 y la 004 de `PrivateArea` siguen en verde, con el título nuevo.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e e2e/design-system.spec.ts e2e/auth.spec.ts` en verde en los tres proyectos

- [ ] **T-019** Crear el esqueleto de `TaskDialog` con Esc, clic fuera y «¿Descartar los cambios?», y verificar el doble Esc
  - Depende de: T-010, T-012, T-014, T-018
  - Ficheros: `apps/web/src/components/TaskDialog.tsx` (nuevo; `<dialog>` con `showModal`, vistas `form`, `discard` y `confirmDelete`), `TaskDialog.test.tsx` (nuevo), `apps/web/src/components/Board.tsx` (abre y cierra el diálogo; foco D-14 al cerrar sin guardar)
  - Cubre: RF-021, RF-022 (cerrar sin guardar), CA-3.3, CA-3.4, D-12, D-14, D-24, X-7
  - Casos (test primero):
    - sin cambios, Esc, «Cancelar» o clic fuera cierran el diálogo y el foco vuelve a la tarjeta o a «Crear tarea»;
    - con cambios, se pregunta «¿Descartar los cambios?», con «Descartar cambios» (glass) y «Seguir editando» (primario);
    - «Seguir editando» y Esc en esa vista vuelven al formulario con lo escrito;
    - el evento `cancel` se cancela;
    - un solo diálogo en la página.
  - Hecho cuando:
    - los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde;
    - **el E2E del doble Esc de T-005 pasa en `chromium`, `chrome` y `webkit`.**
    - Si no pasa, **parar y avisar**: el plan alternativo de D-12 (diálogo propio con `inert`) es un cambio de plan.

- [ ] **T-020** Crear tareas desde el diálogo
  - Depende de: T-019
  - Ficheros: `apps/web/src/components/TaskDialog.tsx` (modo creación: carpetas «Datos» y «Fechas»), `TaskDialog.test.tsx`, `apps/web/src/components/Board.tsx` (foco en la tarjeta nueva)
  - Cubre: RF-010, RF-011, RF-014, RF-015, RF-016, RF-017, RF-018, RF-019, RF-022, RF-028, RF-031, CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5, CA-2.6, CA-2.7, E-15
  - Casos (test primero):
    - campos y «(opcional)»; sin campo de estado ni de fin real;
    - POST con las fechas en ISO;
    - al terminar de volver a pedir la lista, el diálogo se cierra, la tarjeta sale la primera de Backlog y tiene el foco;
    - un error por cada caso de CA-2.3 a CA-2.6, con el foco en el primero;
    - con `NetworkError`, el diálogo sigue abierto con lo escrito y la alerta de RF-028;
    - «Creando tarea…» y un doble clic hacen un solo POST (E-15).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-021** Abrir y editar una tarea, con sus errores
  - Depende de: T-020
  - Ficheros: `apps/web/src/components/TaskDialog.tsx` (modo edición), `TaskDialog.test.tsx`, `apps/web/src/components/Board.tsx` (abrir desde la tarjeta; zona de alerta y foco tras `TASK_NOT_FOUND`), `Board.test.tsx`
  - Cubre: RF-012, RF-013, RF-022, RF-028, RF-030, CA-3.1, CA-3.2, CA-3.5, CA-3.6, CA-4.4, E-12, E-14, D-14, D-20
  - Casos (test primero):
    - clic o Enter en la tarjeta abren el detalle con todos los datos;
    - guardar un título nuevo cierra el diálogo, actualiza la tarjeta y le devuelve el foco;
    - título vacío → CA-3.5;
    - PUT con `NetworkError` → alerta en el diálogo y la tarjeta sin cambios (CA-4.4);
    - PUT con 404 `TASK_NOT_FOUND` → el diálogo se cierra, «Esta tarea ya no existe.» en la zona de alerta del tablero, la tarjeta desaparece y el foco va a «Crear tarea»;
    - PUT con 401 `SESSION_EXPIRED` → `location.replace('/login?expired=1')`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-022** Cambiar el estado, gestionar la fecha real de fin y avisar de las retrasadas en el detalle
  - Depende de: T-021
  - Ficheros: `apps/web/src/components/TaskDialog.tsx` (selector de estado con tono, D-15; campo de fin real; aviso de retrasada), `TaskDialog.test.tsx`, `Board.test.tsx`
  - Cubre: RF-023, RF-024, RF-025, RF-033, RF-038, RF-039, RF-040, RF-041, CA-4.1, CA-4.3, CA-4.5, CA-4.6, CA-4.7, CA-4.8, CA-4.9, CA-6.2, E-21, E-23, D-15
  - Casos (test primero, con `vi.setSystemTime` en el 29/10/2026):
    - pasar de To do a In progress y guardar mueve la tarjeta y cambia los recuentos (CA-4.1);
    - elegir Done → fin real «29/10/2026» y la tarjeta muestra «29 oct»;
    - las ediciones y errores de CA-4.5 a CA-4.7;
    - salir de Done y volver más tarde → hoy (CA-4.8);
    - en To do no hay campo (CA-4.9);
    - elegir Done, después In progress, y guardar → `null` (E-23);
    - el aviso «Esta tarea tenía que terminar el 28 oct.» (CA-6.2);
    - la opción elegida lleva el tono de §1.3.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-023** Borrar una tarea con confirmación
  - Depende de: T-021
  - Ficheros: `apps/web/src/components/TaskDialog.tsx` (vista `confirmDelete`, «Borrar tarea» destructivo), `TaskDialog.test.tsx`, `Board.test.tsx`
  - Cubre: RF-026, RF-027, RF-029, RF-031, CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
  - Casos (test primero):
    - la pregunta «¿Borrar «Preparar la demo»? No se puede deshacer.» con «Borrar tarea» y «Cancelar»;
    - «Cancelar» y Esc vuelven al detalle;
    - al confirmar, «Borrando…»; después, la tarjeta desaparece, los recuentos bajan y el foco va a «Crear tarea»;
    - con `NetworkError`, la tarea sigue y sale la alerta de RF-029;
    - al borrar la última, el estado vacío.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [ ] **T-024** Ajustar la disposición: alto de página, scroll por columna, columnas por ancho, panel inferior y botón fijo en móvil
  - Depende de: T-022, T-023
  - Ficheros: `apps/web/src/components/PrivateArea.tsx` (`flex h-dvh flex-col`), `Board.tsx`, `BoardColumn.tsx`, `TaskDialog.tsx` (clases de D-16), los tests de esos componentes si comprueban clases
  - Cubre: RF-035, RF-036, RNF-002, E-2, E-16, E-17, D-16
  - Hecho cuando:
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde;
    - los E2E de T-005 de móvil, responsive, E-16 y E-17 pasan en `chromium`;
    - `pnpm test:e2e e2e/design-system.spec.ts e2e/auth.spec.ts` sigue en verde en los tres proyectos (riesgo de plan §8)

## Fase 5 · Pulido y cierre

- [ ] **T-025** Poner en verde todos los E2E en los tres proyectos
  - Depende de: T-024
  - Ficheros: `e2e/board.spec.ts` y `e2e/helpers.ts` (solo ajustes de selectores o esperas); cualquier corrección de comportamiento o aspecto en `apps/web` se anota en el Registro
  - Cubre: RNF-001, RNF-002, RNF-005, CA-1.1, CA-1.3, CA-1.4, CA-2.1, CA-3.1, CA-3.3, CA-4.1, CA-4.2, CA-4.3, CA-5.1, CA-5.2, CA-6.1, CA-7.1, CA-7.2, CA-7.3, E-4, E-16, E-17
  - Hecho cuando: `pnpm test:e2e` (los tres ficheros) en verde en `chromium`, `chrome` y `webkit`; axe sin infracciones en el tablero ni en el diálogo, en los dos temas

- [ ] **T-026** [P] Comprobar el rendimiento con 500 tareas
  - Depende de: T-024
  - Ficheros: `e2e/board.spec.ts` (solo el test de RNF-004 y E-2)
  - Cubre: RNF-004, E-2, D-25
  - Hecho cuando: en `chromium`, con 500 tareas (200 en una columna), las cuatro columnas están a la vista en ≤ 2 s desde `goto` en tres ejecuciones seguidas (los tiempos se anotan en el Registro); al hacer scroll dentro de la columna de 200, la cabecera sigue visible

- [ ] **T-027** [P] Actualizar `DESIGN.md` a 1.3.0-todo.1 y repasar la checklist §21
  - Depende de: T-011, T-022
  - Ficheros: `DESIGN.md`
  - Cubre: RNF-001, RNF-006, plan §4.6, `DESIGN.md` §19
  - Hecho cuando:
    - `DESIGN.md` recoge los tokens nuevos (§1.4, §3.2, §6.3), cada uno igual que en `tokens.css` (revisado con `grep`);
    - §1.3 confirma el mapa de estados y dónde se usa el tono;
    - §11.3 y §11.4 dejan de ser orientativos y recogen X-1, X-2, X-4, X-6, X-7 y X-8;
    - el punto 1 de «Pendiente de decidir» se ha quitado;
    - la versión es 1.3.0-todo.1, con su fila en el «Historial»;
    - la checklist §21 repasada en el tablero y en el diálogo a 375, 768 y 1280, en los dos temas y con «aumentar contraste», con el resultado en el Registro

- [ ] **T-028** Comprobar la trazabilidad de requisitos, criterios y casos límite en los tests
  - Depende de: T-025, T-026
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, todos los RF, CA, E y RNF
  - Hecho cuando: un `grep` en `packages/shared/src/**/*.test.ts`, `apps/api/{src,test}/**/*.test.ts`, `apps/web/src/**/*.test.ts(x)` y `e2e/board.spec.ts` encuentra al menos un test que empieza por cada uno de:
    - RF-001…RF-041;
    - CA-1.1…CA-1.8, CA-2.1…CA-2.7, CA-3.1…CA-3.6, CA-4.1…CA-4.9, CA-5.1…CA-5.5, CA-6.1…CA-6.5 y CA-7.1…CA-7.3;
    - E-1…E-24;
    - RNF-001…RNF-006.

    La lista de lo encontrado se anota en el Registro.

- [ ] **T-029** Ejecutar `/sdd-verificar`
  - Depende de: T-025, T-026, T-027, T-028
  - Ficheros: `specs/002-tablero-de-tareas/verificacion.md`
  - Cubre: todos

## Registro

| Tarea | Commit | Notas |
|-------|--------|-------|
|       |        |       |
