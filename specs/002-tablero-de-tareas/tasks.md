---
spec: 002
plan_aprobado: 2026-10-30
progreso: 34/35
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

- [x] **T-001** Crear la rama y registrar los documentos de la spec
  - Ficheros: `specs/002-tablero-de-tareas/{spec,plan,research,tasks}.md`, `specs/roadmap.md`, `specs/004-sistema-de-diseno/spec.md` (nota de 002/RF-037)
  - Cubre: C-24
  - Hecho cuando: existe la rama `feat/002-tablero-de-tareas`, creada desde `main`; un commit `docs(spec-002): …` contiene solo esos ficheros; `git status` limpio

- [x] **T-002** Añadir el modelo `Task` y la migración `tasks_init`
  - Depende de: T-001
  - Ficheros: `apps/api/prisma/schema.prisma` (`enum TaskStatus`, `model Task`, `tasks Task[]` en `User`), `apps/api/prisma/migrations/<timestamp>_tasks_init/migration.sql` (generada con `pnpm db:migrate`), `apps/api/test/setup.ts` (`TRUNCATE "Task", "Session", "User"`)
  - Cubre: D-1, C-5, C-11, C-16 (plan §4.2)
  - Hecho cuando:
    - la migración crea el enum, la tabla con `@db.Date` en las tres fechas, `VarChar(200)` y `VarChar(5000)`, la clave foránea con `ON DELETE CASCADE` y el índice `(userId, createdAt)`;
    - la migración de la 001 no cambia (`git diff` vacío en ella);
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

## Fase 2 · Contratos y tests

T-003 y T-004 terminan en verde. T-005 escribe los E2E, que **deben fallar** por la razón indicada (se anota en el Registro), sin errores de sintaxis ni de tipos. Los tests de integración de la API van en T-007, con la ruta: `pnpm test` tiene que acabar cada tarea en verde (C-19).

- [x] **T-003** [P] Definir los esquemas, tipos y reglas de la tarea en `shared`
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

- [x] **T-004** [P] Admitir `PUT` y `DELETE` en `apiFetch`
  - Depende de: T-001
  - Ficheros: `apps/web/src/lib/api.ts`, `apps/web/src/lib/api.test.ts`
  - Cubre: D-21 (base de RF-013 y RF-027)
  - Casos (test primero):
    - `PUT` y `DELETE` llevan `Content-Type: application/json` y un cuerpo JSON (`{}` en `DELETE` sin datos);
    - `204` → `undefined`;
    - el tratamiento de errores es el mismo que con `POST`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-005** Escribir los E2E del tablero (en rojo)
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

- [x] **T-006** Implementar el repository y el service de tareas
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

- [x] **T-007** Añadir las rutas `/api/tasks`, con sus tests de integración primero
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

- [x] **T-008** [P] Formatear fechas y recuentos, y calcular «hoy» y «retrasada»
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

- [x] **T-009** [P] Crear la consulta y las mutaciones de tareas y los textos de sus errores
  - Depende de: T-003, T-004
  - Ficheros: `apps/web/src/lib/task-queries.ts`, `apps/web/src/lib/task-messages.ts`, `apps/web/src/lib/task-messages.test.ts`, `apps/web/src/lib/task-queries.test.tsx` (nuevos)
  - Cubre: RF-008 (texto), RF-024 (la lista se vuelve a pedir), RF-028, RF-029, RF-030 (texto), D-7, D-19
  - Casos (test primero):
    - `useCreateTask`, `useUpdateTask` y `useDeleteTask` solo se resuelven después de volver a pedir `GET /api/tasks`;
    - `TASK_NOT_FOUND` también invalida la lista;
    - textos de cargar, guardar y borrar para `NetworkError` y para un `ApiError` inesperado;
    - `TASK_NOT_FOUND` → «Esta tarea ya no existe.».
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-010** Implementar el borrador y la validación del formulario de tarea
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

- [x] **T-011** [P] Añadir los tokens nuevos, las utilidades del tablero y las parejas de contraste de R-1
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

- [x] **T-012** [P] Añadir la variante `destructive` a `Button` y las variantes nuevas a `FormField`
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

- [x] **T-013** [P] Crear `SegmentedControl` con radios nativos
  - Depende de: T-011
  - Ficheros: `apps/web/src/components/SegmentedControl.tsx`, `SegmentedControl.test.tsx` (nuevos)
  - Cubre: RF-023, RF-034, CA-4.2 (flechas), D-15, X-4
  - Casos (test primero):
    - `<fieldset>` con `<legend>`, un radio por opción con su etiqueta y el elegido marcado;
    - las flechas cambian la opción (`user-event`) y llaman a `onChange`;
    - `selectedTone` aplica la clase del tono solo a la opción elegida;
    - opciones de 44 px (`h-11`).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-014** [P] Crear `FolderCard`
  - Depende de: T-011
  - Ficheros: `apps/web/src/components/FolderCard.tsx`, `FolderCard.test.tsx` (nuevos)
  - Cubre: D-22, §5 (tarjeta carpeta)
  - Casos (test primero):
    - el título es un encabezado y agrupa su contenido (`role="group"` con `aria-labelledby`);
    - la forma va en un SVG `aria-hidden` con `fill-folder`;
    - sin `style=` ni corchetes (lo vigila `design-rules.test`).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; una captura a 375 y 1280 en los dos temas, anotada en el Registro

- [x] **T-015** [P] Preparar las utilidades de test para el tablero
  - Depende de: T-003
  - Ficheros: `apps/web/src/components/test-utils.tsx`
  - Cubre: plan §7 (doble de `showModal`, rutas de `/api/tasks`)
  - Casos:
    - si jsdom no tiene `HTMLDialogElement.prototype.showModal` ni `close`, se instala un doble mínimo (`open` y el evento `close`);
    - `taskFixture(overrides)` y la ruta por defecto `GET /api/tasks` → `{ tasks: [] }`.
  - Hecho cuando: los tests actuales de `apps/web` siguen en verde; un test temporal comprueba el doble (se borra al terminar); `pnpm typecheck` en verde

- [x] **T-016** Crear `TaskCard` y `BoardColumn`
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

- [x] **T-017** Crear `Board` con el título, el recuento, las columnas, el estado vacío y el selector de columna
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

- [x] **T-018** Pintar el tablero en la zona privada, con el error de carga y el título «Tablero»
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

- [x] **T-019** Crear el esqueleto de `TaskDialog` con Esc, clic fuera y «¿Descartar los cambios?», y verificar el doble Esc
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

- [x] **T-020** Crear tareas desde el diálogo
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

- [x] **T-021** Abrir y editar una tarea, con sus errores
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

- [x] **T-022** Cambiar el estado, gestionar la fecha real de fin y avisar de las retrasadas en el detalle
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

- [x] **T-023** Borrar una tarea con confirmación
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

- [x] **T-024** Ajustar la disposición: alto de página, scroll por columna, columnas por ancho, panel inferior y botón fijo en móvil
  - Depende de: T-022, T-023
  - Ficheros: `apps/web/src/components/PrivateArea.tsx` (`flex h-dvh flex-col`), `Board.tsx`, `BoardColumn.tsx`, `TaskDialog.tsx` (clases de D-16), los tests de esos componentes si comprueban clases
  - Cubre: RF-035, RF-036, RNF-002, E-2, E-16, E-17, D-16
  - Hecho cuando:
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde;
    - los E2E de T-005 de móvil, responsive, E-16 y E-17 pasan en `chromium`;
    - `pnpm test:e2e e2e/design-system.spec.ts e2e/auth.spec.ts` sigue en verde en los tres proyectos (riesgo de plan §8)

## Fase 5 · Pulido y cierre

- [x] **T-025** Poner en verde todos los E2E en los tres proyectos
  - Depende de: T-024
  - Ficheros: `e2e/board.spec.ts` y `e2e/helpers.ts` (solo ajustes de selectores o esperas); cualquier corrección de comportamiento o aspecto en `apps/web` se anota en el Registro
  - Cubre: RNF-001, RNF-002, RNF-005, CA-1.1, CA-1.3, CA-1.4, CA-2.1, CA-3.1, CA-3.3, CA-4.1, CA-4.2, CA-4.3, CA-5.1, CA-5.2, CA-6.1, CA-7.1, CA-7.2, CA-7.3, E-4, E-16, E-17
  - Hecho cuando: `pnpm test:e2e` (los tres ficheros) en verde en `chromium`, `chrome` y `webkit`; axe sin infracciones en el tablero ni en el diálogo, en los dos temas

- [x] **T-026** [P] Comprobar el rendimiento con 500 tareas
  - Depende de: T-024
  - Ficheros: `e2e/board.spec.ts` (solo el test de RNF-004 y E-2)
  - Cubre: RNF-004, E-2, D-25
  - Hecho cuando: en `chromium`, con 500 tareas (200 en una columna), las cuatro columnas están a la vista en ≤ 2 s desde `goto` en tres ejecuciones seguidas (los tiempos se anotan en el Registro); al hacer scroll dentro de la columna de 200, la cabecera sigue visible

- [x] **T-027** [P] Actualizar `DESIGN.md` a 1.3.0-todo.1 y repasar la checklist §21
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

- [x] **T-028** Comprobar la trazabilidad de requisitos, criterios y casos límite en los tests
  - Depende de: T-025, T-026
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, todos los RF, CA, E y RNF
  - Hecho cuando: un `grep` en `packages/shared/src/**/*.test.ts`, `apps/api/{src,test}/**/*.test.ts`, `apps/web/src/**/*.test.ts(x)` y `e2e/board.spec.ts` encuentra al menos un test que empieza por cada uno de:
    - RF-001…RF-041;
    - CA-1.1…CA-1.8, CA-2.1…CA-2.7, CA-3.1…CA-3.6, CA-4.1…CA-4.9, CA-5.1…CA-5.5, CA-6.1…CA-6.5 y CA-7.1…CA-7.3;
    - E-1…E-24;
    - RNF-001…RNF-006.

    La lista de lo encontrado se anota en el Registro.

- [x] **T-029** Ejecutar `/sdd-verificar`
  - Depende de: T-025, T-026, T-027, T-028
  - Ficheros: `specs/002-tablero-de-tareas/verificacion.md`
  - Cubre: todos

## Fase 6 · Correcciones de la verificación

Salen de `verificacion.md` (2026-10-31) y de los cambios del plan de ese día: D-12, D-15, D-18 y D-19, y §4.3 y §4.6. Spec v1.1, sin cambios de comportamiento. Las reglas de arriba siguen valiendo: test primero, un commit por tarea con su ID (C-24) y `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde (C-19).

- [x] **T-030** Hacer que el «clic fuera» del diálogo solo cuente fuera de su rectángulo
  - Depende de: T-029
  - Ficheros: `apps/web/src/components/TaskDialog.tsx` (`handlePointerDown`), `TaskDialog.test.tsx`, `e2e/board.spec.ts`
  - Cubre: RF-021, RF-035, CA-3.3, CA-7.2, D-12 (I-1)
  - Casos (test primero):
    - **Unitarios**, con `getBoundingClientRect` simulado en el `<dialog>`:
      - un `pointerdown` sobre el `<dialog>` con el punto dentro de su rectángulo no cierra ni pregunta;
      - con el punto fuera, se comporta como hasta ahora: sin cambios cierra, con cambios pregunta.
      - Los tests de clic fuera que ya existen pasan a dar el punto fuera del rectángulo.
    - **E2E a 375 px:** un toque 8 px por debajo del borde superior del panel y a 40 px de su borde izquierdo (junto al asa) deja el diálogo abierto.
  - Hecho cuando:
    - los casos nuevos fallan primero (el E2E falla porque el diálogo se cierra, como en la verificación);
    - después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde;
    - `pnpm test:e2e e2e/board.spec.ts` en verde en `chromium`, `chrome` y `webkit`, incluido el clic fuera con cambios (CA-3.3)

- [x] **T-031** Poner «Borrar tarea» del detalle en glass y dejar `destructive` solo en la confirmación
  - Depende de: T-030 (los dos tocan `TaskDialog.tsx`)
  - Ficheros: `apps/web/src/components/TaskDialog.tsx`, `TaskDialog.test.tsx`, `DESIGN.md` (§11.4, versión `1.3.1-todo.1` y fila en el Historial)
  - Cubre: RF-026, RNF-001, RNF-006, D-15, D-19, C-26 (M-4)
  - Casos (test primero): el test «RF-026 D-19 al crear no hay «Borrar tarea»; en el detalle sí…» pasa a esperar `bg-glass` y no `--pill-rose`; en la confirmación (CA-5.1), «Borrar tarea» sigue en `--pill-rose`
  - Hecho cuando:
    - el caso falla primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde;
    - el axe de `e2e/board.spec.ts` (RNF-001) sigue en verde en los dos temas;
    - `DESIGN.md` §11.4 dice glass en el detalle y `destructive` en la confirmación, con la versión 1.3.1-todo.1 y su fila en el Historial

- [x] **T-032** Probar RF-016 desde el diálogo y quitar el `console.log` del E2E de rendimiento
  - Depende de: T-031 (los dos tocan `TaskDialog.test.tsx`)
  - Ficheros: `apps/web/src/components/TaskDialog.test.tsx` (un caso más en el `it.each` de CA-2.3–CA-2.6), `e2e/board.spec.ts` (test de RNF-004)
  - Cubre: RF-016, RF-019, E-6, RNF-004 (M-1, M-2)
  - Casos:
    - `'RF-016 E-6 descripción de 5001 caracteres'`: no hay POST, sale «La descripción puede tener hasta 5000 caracteres. Acórtala un poco.» bajo «Descripción (opcional)» y el foco va al campo. Es un test nuevo sobre código que ya existe, así que puede pasar a la primera; se comprueba que falla si se quita el mensaje del esquema y se anota en el Registro.
    - RNF-004: el tiempo va en `test.info().annotations` en lugar de `console.log`.
  - Hecho cuando: `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `grep -rn "console.log" e2e/` no encuentra nada; el test de RNF-004 sigue en verde en `chromium`

- [x] **T-033** [P] Quitar `formatLongDate`, que no usa ninguna pantalla
  - Depende de: T-029
  - Ficheros: `apps/web/src/lib/dates.ts`, `apps/web/src/lib/dates.test.ts`
  - Cubre: D-18, C-22 (M-3)
  - Hecho cuando: `grep -rn "formatLongDate" apps/ packages/` no encuentra nada; `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-034** Volver a comprobar la trazabilidad de requisitos, criterios y casos límite en los tests
  - Depende de: T-030, T-031, T-032, T-033
  - Ficheros: ninguno (tests existentes solo si falta alguno)
  - Cubre: C-17, todos los RF, CA, E y RNF
  - Hecho cuando: el mismo `grep` de T-028 encuentra al menos un test que empieza por cada ID (114/114), y el resultado se anota en el Registro

- [ ] **T-035** Ejecutar `/sdd-verificar` de nuevo (en una sesión nueva)
  - Depende de: T-034
  - Ficheros: `specs/002-tablero-de-tareas/verificacion.md`
  - Cubre: todos
  - Hecho cuando: el informe está escrito; si sale APTO, la spec pasa a `implementada` con la confirmación del usuario

## Registro

> Commits (I-3 de la verificación del 2026-10-31): de T-002 a T-028 el trabajo no se hizo con un commit por tarea. `0e71e56` («T-004 PUT y DELETE en apiFetch») contiene en realidad T-002 (migración, esquema y `setup.ts`). `5104bad` («feat(web): spec 2») contiene T-003 a T-028, incluido el `apiFetch` de T-004. El historial ya está en `main` y no se reescribe; desde T-030 se vuelve a un commit por tarea.

| Tarea | Commit | Notas |
|-------|--------|-------|
| T-001 | 8407dd0, 1be71e5, 134ca2c | La rama ya existía, creada desde `main` (`git merge-base --is-ancestor main HEAD`). Los documentos quedaron en tres commits `docs(spec-002)` en vez de uno; solo contienen ficheros de la lista. `git status` limpio al empezar |
| T-002 | 0e71e56 (titulado «T-004») | Migración `20261030183329_tasks_init` generada con `pnpm db:migrate --name tasks_init` (Prisma 7.10.1): enum, tabla con `DATE` en las tres fechas, `VARCHAR(200)`/`VARCHAR(5000)`, FK `ON DELETE CASCADE` e índice `Task_userId_createdAt_idx`. La migración de la 001 sin cambios. `setup.ts` vacía también `"Task"` |
| T-003 | 5104bad | Test primero: falló al importar `./tasks` (no existía). Zod 4.6.7: un issue con `abort: true` queda con `continue: false` y Zod se salta los `refine` del objeto aunque lleven `when`; el título va sin `abort` (vacío y > 200 no coinciden) para que RF-018 y RF-040 salgan a la vez que el error del título (un mensaje por campo). Los `refine` de objeto llevan `when` para no comparar fechas ya inválidas. Nombre no fijado por el plan: `TASK_MESSAGES` exporta los textos, para que el front use los de RF-017 y RF-039 sin duplicarlos (D-4, C-10). `z.iso.date()` ya rechaza `2026-02-31`. `messages.ts` recibe `TASK_NOT_FOUND` → texto genérico (D-19) |
| T-004 | 5104bad | Test primero: los casos de PUT y DELETE fallaron (el método no se enviaba como JSON y no tipaba). `apiFetch` trata como POST todo método distinto de GET (D-21) |
| T-006 | 5104bad | Test primero: falló al importar `./tasks.service`. Prisma 7.10.1: `migrate dev` ya no ejecuta `generate`; hubo que lanzar `prisma generate` (si no, `prisma.task` no existe en los tipos). `update`/`delete` con `where: { id, userId }` (where único extendido) → P2025 si no es suya (D-3). El límite de D-6 se calcula con `setUTCDate(+1)`. De los ficheros nuevos de producción, solo `task.repository.ts` importa Prisma; el test del service usa `prisma` solo para crear usuarios, como los tests de la 001 |
| T-007 | 5104bad | Test primero: 37 de 38 fallaron con 404 `NOT_FOUND` (el de 415 pasaba ya por `requireJson`). `tasksRouter.use(requireAuth)` para las cuatro rutas; `validateTaskId` (nombre no fijado por el plan) va antes de `validateBody`, así que un id mal formado da 404 aunque el cuerpo no sea válido. `helpers.ts` gana también `NEW_TASK` y `utcIsoDate`. Orden de errores: 415 → 401 → 404 (id) → 400 |
| T-008 | 5104bad | Test primero: falló al importar `./dates`. `process.env.TZ` se cambia en el propio test (Node aplica el cambio al vuelo) para E-10: 28/10 10:30 UTC = 29/10 00:30 en Kiritimati. Intl en Node 24.19 da «14 nov», «14 nov 2027» y «14 sept» (R-3). `parseDisplayDate` recorta espacios y comprueba el día con `Date.UTC` |
| T-009 | 5104bad | Test primero: fallaron al importar los módulos; después, la comprobación final de la lista necesitó `waitFor` (el hook se pinta tras resolver la mutación). `loadErrorText` es una constante (el texto de RF-008 no depende del error); `saveErrorText`/`deleteErrorText` reciben el error y dan «Esta tarea ya no existe.» con `TASK_NOT_FOUND`; `isTaskNotFound` (nombre no fijado por el plan). `onSuccess` y `onError` (solo con TASK_NOT_FOUND) devuelven la promesa de `invalidateQueries`, así que `mutateAsync` e `isPending` esperan a la lista nueva (D-7) |
| T-010 | 5104bad | Test primero: falló al importar `./task-form`. Nombres no fijados por el plan: `TASK_FIELD_IDS` (ids fijos, solo hay un diálogo), `submit(form)` devuelve `{ kind: 'create', input } | { kind: 'edit', id, input } | null`, `setField`, `setStatus`, `unchanged`, `showActualEndDate`. Una fecha ilegible viaja al esquema como `null` y conserva su error de RF-017 (el primero gana). «Sin cambios» ignora el fin real fuera de Done. En los tests solo se simula `Date` (`toFake: ['Date']`) para no parar React |
| T-011 | 5104bad | Test primero: falló al montar el catálogo (`--surface-veil no está definido`). Después, las opciones elegidas de los selectores daban 18.66 en vez de 18.53: en R-1 la opción elegida va encima de la pista (`folder + sunken + raised-hover` y `dot + sunken + raised-hover`); con esa composición todos los números de R-1 coinciden. Superficie del diálogo = base + velo + raised. `board-columns-two` usa `max(--board-column-min, (100% - --space-4) / 2)` (el hueco es `gap-4`). `sheet-max-height` = `92dvh`. `dialog::backdrop` lleva también `-webkit-backdrop-filter` (Safari). `design-rules.test.ts` en verde sin cambios |
| T-012 | 5104bad | Test primero: fallaron los cuatro casos de `FormField` y el de `destructive` (el de textarea con error ya pasaba con un `<input>`). `type` pasa a opcional (por defecto 'text'); la 001 ya lo pasa siempre. La ayuda va después del error en `aria-describedby`. Desviación nueva **X-9** en el plan: el radio 24 del textarea (§14) no está en el catálogo; se usa `--radius-md` (26). Los tests de la 001 y la 004 siguen en verde |
| T-013 | 5104bad | Test primero: falló al importar el componente. El radio es `appearance-none absolute inset-0` dentro del `<label>`, así que el contorno de foco global de la 004 rodea la opción entera sin variantes nuevas. Prop extra `hideLegend` (el selector de columna en móvil no muestra la leyenda; sigue siendo el nombre del grupo). `StatusTone` = 'lilac' | 'ink' | 'sage'; sin tono, neutra. user-event 14.6.8 mueve el radio con las flechas en jsdom |
| T-014 | 5104bad | Test primero: falló al importar el componente. Después, `design-rules.test` saltó por la palabra «style=» en un comentario; se reformuló. Pestaña `h-13` con `rounded-tl-md` (26) + hombro en SVG de 72 × 52 (`M0 0C36 0 36 52 72 52H0Z`, `fill-folder`, `aria-hidden`) + cuerpo `rounded-lg rounded-tl-none`. El id del título sale de `useId`. **Captura** (hecha en T-020, la primera vez que la carpeta se pinta en la app): diálogo de crear a 375 y 1280, claro y oscuro, en `chromium`. Pestaña, hombro y cuerpo sin costura visible en los cuatro casos; «Datos» y «Fechas» legibles. Sin cambios en el componente |
| T-015 | 5104bad | jsdom 30.1.3 no tiene `HTMLDialogElement.prototype.showModal` ni `close`: el doble (con `??=`, solo si faltan) pone y quita el atributo `open` y lanza `close`. `taskFixture` da un UUID distinto en cada llamada. Ruta por defecto `GET /api/tasks` → `{ tasks: [] }`. Un test temporal (`zz-dialog-double.test.tsx`) comprobó el doble y `taskFixture` (2/2 en verde) y se borró. Los tests de `apps/web` siguen en verde |
| T-016 | 5104bad | Test primero: fallaron al importar los componentes. Nombres no fijados por el plan: `STATUS_NAMES` y `STATUS_ICONS` se exportan desde `BoardColumn.tsx` (los usan también `Board` y `TaskDialog`). En la cabecera de la columna, el nombre va en `--text-1` (título, D-9) y el icono y «· n» en `--text-2`. El punto de 7 px de la insignia usa `bg-(--amber)` (decorativo, `aria-hidden`). Sin tareas no hay `<ul>`, solo el hueco |
| T-017 | 5104bad | Test primero: falló al importar `./Board`; después, el estado vacío partido en dos `<span>` no casaba con `getByText` (solo mira los nodos de texto directos): el mensaje de RF-006 va en un solo `<p>`. Fuera de la lista de ficheros: `Icon.tsx` admite `size={26}` (§9, estado vacío); icono `ListTodo` («tarea» en §9). El título y el recuento siguen en pantalla con el tablero vacío («0 tareas»). Las columnas usan de momento `md:grid-cols-2 lg:grid-cols-4`; las utilidades de D-16 llegan en T-024. El «Crear tarea» y la apertura de tarjetas aún no hacen nada (T-019) |
| T-005 | 5104bad | **Ejecutado tarde** (después de T-018): un `pnpm dev` abierto ocupaba los puertos 4321 y 3000 y Playwright no reutiliza servidores; el usuario lo cerró. Sin errores de sintaxis ni de tipos (`tsc -p tsconfig.json` y `pnpm lint` en verde). En `chromium`, 12 fallan por la razón esperada: no hay diálogo (T-019–T-023: no aparece `getByRole('dialog')`) y falta la disposición de T-024 («Crear tarea» en y = 127 a 375 px; la lista de Backlog no hace scroll). 4 pasan ya porque el tablero existe desde T-017/T-018 (columnas y recuentos, aislamiento, E-17, E-4). `expectNoAxeViolations` pasa de `design-system.spec.ts` a `helpers.ts` (se quitó la copia en T-018). `auth.spec.ts` y `design-system.spec.ts` en verde |
| T-018 | 5104bad | Test primero: fallaron los 8 casos nuevos. El plan §4.1 pide solo «Cargando…» mientras cualquiera de las dos consultas está pendiente: la cabecera sale cuando llegan las tareas (o hay error de carga). El tablero trae su propia zona de alerta (D-20): en `PrivateArea.test` la de la zona privada es la primera (`pageAlert`), y el test de la 004 del `h1` espera al tablero (`findAllByRole`). Los reintentos de red (1 + 2 + 4 s) se adelantan con temporizadores falsos. `AppHeader` sin email solo pinta el nombre. Error de carga: círculo glass con `CloudOff` (26), texto en `--text-1` y «Reintentar» glass, dentro de la zona `role=alert`. `pnpm test:e2e e2e/design-system.spec.ts e2e/auth.spec.ts`: 131 pasan y 1 *flaky* en WebKit (`/signup` de 320 a 1600, la deuda M-7 que cubre `retries: 1`) |
| T-019 | 5104bad | Test primero: falló al importar `./TaskDialog`; después, los dos casos de `Board` fallaban porque el doble de `showModal` no movía el foco al diálogo: el doble (`test-utils.tsx`) enfoca ahora el primer elemento enfocable, como el navegador. **Punto de control D-24: el E2E del doble Esc pasa en `chromium`, `chrome` y `webkit`**; se mantiene el `<dialog>` nativo (`keydown` con `preventDefault` + `cancel` cancelado), sin plan alternativo. Fuera de la lista: `Button` acepta `autoFocus` (la opción segura de la confirmación) y `ref` (D-14, «Crear tarea»). Textos no fijados por el plan: título del diálogo «Nueva tarea» / «Detalle de la tarea». El formulario no se desmonta durante la confirmación (`hidden`): al volver, el foco vuelve al campo donde estaba. `aria-labelledby` apunta al título de la vista visible. En este esqueleto el formulario solo tiene el título; el resto de campos llega en T-020 |
| T-020 | 5104bad | Test primero: fallaron 9 de los casos nuevos (los dos de título ya pasaban por la validación de T-010). En los tests, `LiveBoard` pinta `Board` con la consulta real (`useTasks`) para comprobar que el diálogo no se cierra hasta tener la lista nueva (D-7). La alerta del diálogo usa el tono `offline` (§12 «Sin conexión»), también para el error inesperado. `handleSubmit` no envía con una petición en curso (E-15), además del `loading` del botón. Al crear, el selector de columna en móvil pasa a Backlog (D-14). Captura de la carpeta (T-014) hecha aquí |
| T-021 | 5104bad | Test primero: fallaron los 6 casos que necesitan el PUT (abrir y validar ya pasaban). `DialogResult` gana `saved` y `notFound` (con el texto); con `saved`, el selector de columna en móvil pasa al estado de la tarea (D-14). Con TASK_NOT_FOUND, el `onError` del hook (que vuelve a pedir la lista) se espera antes del de `mutate`: la tarjeta ya no está cuando se cierra el diálogo. El aviso del tablero usa el tono `info` y se vacía en `openDialog`. Los casos del aviso del tablero van en `TaskDialog.test.tsx` con `LiveBoard` (necesitan la lista de verdad); `Board.test.tsx` no cambia. E-12 se prueba con la isla real (`withQueryClient`, `requireSession`) |
| T-022 | 5104bad | Test primero: fallaron los 10 casos que necesitan el selector o el campo. Después, CA-4.1 dejaba el foco en `body`: el diálogo se cierra en un render y la lista nueva llega en el siguiente (TanStack avisa a los observadores en otra tarea); al cambiar de columna, la tarjeta es otro elemento. El objetivo de foco de `Board` (D-14) lleva ahora el estado esperado y espera a que la tarjeta esté en él, que es lo que dice D-14 («después de pintar la lista nueva»). El selector de estado va en la carpeta «Datos» (R-1 lo mide sobre la carpeta) y solo en edición (RF-011). El aviso de retrasada es un `<p>` con `bg-amber-soft` y `ClockAlert` (no es `role=alert`: no es un error) y usa la tarea guardada. Los casos de recuentos (CA-4.1) van en `TaskDialog.test.tsx` con `LiveBoard` |
| T-023 | 5104bad | Test primero: fallaron los 8 casos. Después, CA-5.5 dejaba el foco en `body` (la misma carrera de T-022): el objetivo «Crear tarea» lleva `removedId` y espera a que la tarea ya no esté en la lista, porque con la última el botón pasa a ser el del estado vacío. La pregunta es un único `<h2>` («¿Borrar «…»? No se puede deshacer.»), que es también el nombre del diálogo; «Cancelar» es la opción segura y recibe el foco. «Borrar tarea» va a la izquierda del pie (`me-auto`). Si el borrado falla, se vuelve al detalle con la alerta de RF-029 en la zona del diálogo; cada acción reinicia el error de la otra |
| T-024 | 5104bad | Test primero: fallaron las cuatro comprobaciones de clases nuevas. Cadena de alto: `div.flex.h-dvh.flex-col` → `main` (`flex-1 min-h-0 overflow-y-auto`, `max-md:pb-24` por el botón fijo) → `Board` (`md:flex-1 md:min-h-0`) → rejilla (`md:grid-rows-1 md:overflow-x-auto md:board-columns-two lg:board-columns`) → lista de la columna (`md:overflow-y-auto`, con `-m-1 p-1` para no recortar el contorno de foco). «Crear tarea» va en un `<span>` `max-md:fixed … max-md:grid` (en la rejilla el botón se estira a todo el ancho). Panel inferior: `max-md:mb-0 max-md:max-w-none max-md:rounded-b-none max-md:sheet-max-height` + asa de 36 × 4 (`bg-3`, `md:hidden`). Fuera de la lista: **`SegmentedControl`** pasa de `h-11 flex-1 px-3` a `min-h-11 flex-auto px-2 py-1`; en las capturas, «In progress · 1» a 375 px se salía de la píldora (RNF-002). E2E de T-005 de móvil, responsive, E-16 y E-17 en verde en `chromium`; `design-system.spec.ts` y `auth.spec.ts`: 132 en verde en los tres proyectos |
| T-025 | 5104bad | `pnpm test:e2e` (los tres ficheros, tres proyectos): 178 pasan y 2 se saltan (RNF-004 solo en `chromium`), sin *flaky* en esta ejecución. axe (AA + `color-contrast-enhanced`) sin infracciones en el tablero y en el diálogo, en claro y oscuro. Sin cambios en `board.spec.ts`, `helpers.ts` ni `apps/web`: el selector `:not(dialog *)` de `createTaskButton` y `tabTo` con Option+Tab en WebKit funcionaron tal cual. La única corrección de aspecto (el `SegmentedControl`) se hizo y anotó en T-024 |
| T-026 | 5104bad | Tres ejecuciones seguidas en `chromium` (`--repeat-each=3 --workers=1`), con 500 tareas creadas por la API (200 Backlog, 100 en cada otra columna): las cuatro columnas con su recuento a la vista en **131, 127 y 120 ms** desde `goto` (límite 2000 ms). E-2: la lista de Backlog hace scroll por su cuenta (`scrollTop` > 0), la ventana no se mueve (`scrollY` = 0) y la cabecera de la columna sigue en la vista. Sin cambios en `board.spec.ts` |
| T-027 | 5104bad | `DESIGN.md` a **1.3.0-todo.1**: `--surface-veil` en §1.4, `--veil-filter` y `--surface-veil` en §6.3, `--board-column-min` y las utilidades de columnas en §3.2, con los mismos valores que `tokens.css` (revisado con `grep`); §1.3 confirma el mapa de estados y dónde va el tono (X-3); §11.2–§11.4 dejan de ser orientativos y recogen X-1, X-2, X-4, X-6, X-7 y X-8; sale el punto 1 de «Pendiente de decidir»; fila nueva en el Historial. **Checklist §21** con capturas del tablero y del detalle a 375, 768 y 1280 en claro, oscuro, claro + «aumentar contraste» y oscuro + «aumentar contraste» (24 capturas, `chromium`): en verde solo tokens, tema oscuro, texto ≥ 7:1 (`tokens.test` + axe AAA), un solo primario, títulos Light ≥ 20 px, alturas y radios, sin bordes sólidos (con «aumentar contraste» aparecen los de ink‑600), estados vacío/carga/error/sin conexión, opcionales y errores, `Intl` y plurales, iconos Lucide 1.4, teclado/foco/`motion-safe`. **Observación para `/sdd-verificar`:** en el detalle conviven dos acentos, la opción elegida del estado (D-15) y «Borrar tarea» en `destructive` (`--pill-rose`, §11.4, D-19); D-15 dice «un solo acento por vista». No se ha cambiado: es una decisión de diseño |
| T-028 | 5104bad | Comprobación con un script sobre las líneas de test **añadidas en esta rama** (`git diff main` + ficheros nuevos) en los globs de la tarea: así no cuentan los IDs homónimos de la 001 y la 004. Se considera que un test «empieza por» un ID si este está en la secuencia de IDs con la que empieza su nombre (también los casos de `it.each`, que se interpolan en el nombre). **114/114.** Faltaban RNF-005 y RNF-006 (los cubrían tests que ya existían: los tres proyectos de Playwright y `design-rules.test.ts`); se añadió RNF-005 al nombre del flujo principal de `e2e/board.spec.ts` y un test RNF-006 en `tokens.test.ts` con los tokens nuevos. Encontrado: RF-001 (Board, e2e); RF-002 (Board, BoardColumn, task-queries…); RF-003 (Board, BoardColumn, e2e…); RF-004 (PrivateArea, e2e, task-queries…); RF-005 (BoardColumn); RF-006 (Board, PrivateArea, TaskDialog); RF-007 (TaskCard, dates); RF-008 (PrivateArea, task-messages); RF-009 (BoardColumn); RF-010 (FormField, TaskDialog, task-form); RF-011 (TaskDialog, task-form, tasks.create…); RF-012 (PrivateArea, TaskCard, TaskDialog…); RF-013 (TaskDialog, api, task-queries…); RF-014 (TaskDialog, task-form, tasks.create…); RF-015 (TaskDialog, tasks.create, shared); RF-016 (FormField, tasks.create, shared); RF-017 (TaskDialog, dates, task-form…); RF-018 (TaskDialog, task-form, tasks.create…); RF-019 (task-form, shared); RF-020 (FormField, task-form, tasks.create…); RF-021 (TaskDialog, e2e, task-form); RF-022 (TaskDialog, e2e); RF-023 (SegmentedControl, TaskDialog, shared); RF-024 (PrivateArea, TaskDialog, task-queries); RF-025 (TaskDialog, task-form); RF-026 (Button, TaskDialog); RF-027 (TaskDialog, api, e2e…); RF-028 (TaskDialog, api, task-messages); RF-029 (TaskDialog, task-messages); RF-030 (TaskDialog, task-messages, task-queries…); RF-031 (TaskDialog); RF-032 (TaskCard, e2e, dates); RF-033 (TaskDialog, e2e); RF-034 (Board, BoardColumn, e2e); RF-035 (BoardColumn, TaskDialog, e2e); RF-036 (Board, e2e); RF-037 (Board, PrivateArea); RF-038 (TaskDialog, task-form); RF-039 (TaskDialog, task-form, tasks.service…); RF-040 (TaskDialog, task-form, shared…); RF-041 (TaskDialog, task-form, shared…); RNF-001 (FormField, e2e, tokens); RNF-002 (Board, SegmentedControl, e2e); RNF-003 (e2e, tasks.delete, tasks.list…); RNF-004 (e2e); RNF-005 (e2e); RNF-006 (tokens); E-1 (Board); E-2 (BoardColumn, e2e); E-3 (shared); E-4 (TaskCard, e2e); E-5 (tasks.create, shared); E-6 (shared); E-7 (dates, task-form); E-8 (TaskCard, shared); E-9 (shared); E-10 (dates); E-11 (dates); E-12 (PrivateArea, TaskDialog); E-13 (tasks.update); E-14 (TaskDialog, tasks.delete, tasks.service…); E-15 (TaskDialog); E-16 (e2e); E-17 (e2e); E-18 (tasks.delete, tasks.service, tasks.update); E-19 (Board, BoardColumn, dates); E-20 (shared); E-21 (TaskDialog, task-form); E-22 (tasks.list); E-23 (TaskDialog, task-form, shared); E-24 (tasks.list); CA-1.1 (Board, e2e); CA-1.2 (BoardColumn); CA-1.3 (Board, e2e); CA-1.4 (e2e, tasks.list); CA-1.5 (TaskCard, dates); CA-1.6 (AppHeader, PrivateArea, task-messages); CA-1.7 (BoardColumn); CA-1.8 (Board, tasks.list); CA-2.1 (PrivateArea, TaskDialog, e2e…); CA-2.2 (TaskDialog, tasks.create); CA-2.3 (TaskDialog, task-form, shared); CA-2.4 (TaskDialog); CA-2.5 (TaskDialog, task-form, shared); CA-2.6 (TaskDialog, dates, task-form); CA-2.7 (TaskDialog, task-messages); CA-3.1 (TaskDialog, e2e); CA-3.2 (TaskDialog, e2e, tasks.update); CA-3.3 (TaskDialog, e2e); CA-3.4 (TaskDialog, e2e, task-form); CA-3.5 (TaskDialog); CA-3.6 (TaskDialog, task-messages, tasks.update); CA-4.1 (TaskDialog, tasks.update); CA-4.2 (SegmentedControl, e2e); CA-4.3 (TaskCard, TaskDialog, e2e…); CA-4.4 (TaskDialog, task-queries); CA-4.5 (TaskDialog, task-form, tasks.update); CA-4.6 (TaskDialog, task-form, tasks.update); CA-4.7 (TaskDialog, task-form, shared…); CA-4.8 (TaskDialog, shared, tasks.update); CA-4.9 (TaskDialog, task-form); CA-5.1 (TaskDialog, e2e); CA-5.2 (TaskDialog, e2e, tasks.delete); CA-5.3 (TaskDialog); CA-5.4 (TaskDialog, task-messages); CA-5.5 (TaskDialog); CA-6.1 (TaskCard, e2e, dates); CA-6.2 (TaskDialog, e2e); CA-6.3 (TaskCard, TaskDialog, e2e…); CA-6.4 (TaskCard, dates); CA-6.5 (TaskCard, dates); CA-7.1 (Board, e2e); CA-7.2 (e2e); CA-7.3 (e2e) |
| T-029 | bc5a287 | `/sdd-verificar` el 2026-10-31: **APTO CON OBSERVACIONES** (`verificacion.md`). Sin bloqueantes. Importantes: I-1 (en móvil, un toque junto al asa del panel inferior cuenta como «clic fuera»; comprobado en `chromium`), I-2 (PR #2 fusionada antes de verificar) e I-3 (commits sin IDs; `0e71e56` contiene T-002, no T-004). Menores M-1…M-6. `pnpm test` 753/753, lint y tipos en verde; `pnpm test:e2e` 177 pasan, 2 saltados y 1 *flaky* de la 004 en WebKit (M-7) |
| T-030 | — | Test primero: fallaron los dos casos unitarios nuevos (dentro del rectángulo, con y sin cambios: cerraba o preguntaba) y el E2E a 375 px (el diálogo desaparecía tras el toque junto al asa), como en la verificación. `handlePointerDown` sigue exigiendo `target === dialog` y además el punto fuera de `getBoundingClientRect()`. En los unitarios, `pointerDownOnDialog(dialog, 'outside' \| 'inside')` simula el rectángulo (jsdom no calcula la disposición) y los tres usos anteriores de `fireEvent.pointerDown(dialog)` pasan a `'outside'`. `pnpm test` 755/755. `board.spec.ts` en los tres proyectos: 48 pasan, 2 saltados y 1 *flaky* en WebKit, en el registro (`getByLabel(/email/i)` no aparece: la isla no se hidrata, M-7 de la 004), antes de abrir el diálogo; el test nuevo y CA-7.1, repetidos 4 veces en WebKit sin reintentos, 8/8 en verde |
| T-031 | — | Test primero: el caso de RF-026 falló porque el botón seguía en `--pill-rose`. «Borrar tarea» del detalle pasa a `variant="glass"`; el de la confirmación sigue en `destructive` (CA-5.1, sin cambios en su test). `DESIGN.md` a **1.3.1-todo.1** (PATCH): §11.4 y fila en el Historial. `pnpm test` 755/755; axe (RNF-001) en claro y oscuro y el flujo principal con el borrado, en verde en `chromium`, `chrome` y `webkit` (9/9) |
| T-032 | — | Caso nuevo en el `it.each` de CA-2.3–CA-2.6 de `TaskDialog.test.tsx`: `'RF-016 E-6 descripción de 5001 caracteres'` (sin POST, mensaje bajo «Descripción (opcional)» y foco en el campo). Como cubre código que ya existía, pasó a la primera; con la regla de longitud de `shared/tasks.ts` anulada a mano falló (se hacía el POST), y el fichero se restauró sin cambios. RNF-004: el tiempo va en `test.info().annotations` (137 ms en `chromium`); `grep -rn "console.log" e2e/` vacío. `pnpm test` 756/756 |
| T-033 | — | Se quitan `formatLongDate` de `dates.ts` y su test de `dates.test.ts`. Al ser un borrado, no hay un test que falle primero. Se queda `longDate`, que `formatShortDate` usa para las fechas de otro año («14 nov 2027», cubierto por CA-1.5). `grep -rn "formatLongDate" apps/ packages/` vacío. `pnpm test` 755/755 |
| T-034 | — | Mismo criterio que T-028: solo las líneas de test **añadidas** desde la base de la rama (`git diff adc7fa7`) en los globs de la tarea, para que no cuenten los IDs homónimos de la 001 y la 004; un ID cuenta si está en la secuencia de IDs con la que empieza el nombre de un test o de un caso de `it.each`. **114/114**, sin tests nuevos que añadir. Los de esta fase aparecen donde tocaba: RF-016 y E-6 ahora también en `TaskDialog.test.tsx` (T-032), RF-021, RF-035 y CA-7.2 en `TaskDialog.test.tsx` y `board.spec.ts` (T-030), y RF-026 en `TaskDialog.test.tsx` (T-031). Siguiente: T-035 (`/sdd-verificar`) en una sesión nueva |
