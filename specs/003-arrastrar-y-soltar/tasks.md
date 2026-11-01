---
spec: 003
plan_aprobado: 2026-10-31
progreso: 53/53
---

# Tareas · Spec 003 · Arrastrar y soltar

> Reglas:
> - Una tarea = 15 min a 2 h = un commit.
> - Orden de ejecución de arriba abajo, respetando "Depende de".
> - `[P]` = se puede hacer en paralelo con otras `[P]` de la misma fase (no tocan los mismos ficheros).
> - Al terminar: marcar `[x]`, actualizar `progreso` y anotar el commit.
> - Cada test empieza por el ID que verifica, para comprobar la trazabilidad con `grep` (T-024). **Los IDs de esta spec se repiten en las specs 001, 002 y 004** (CA-1.1, E-1…), así que los tests de la 003 llevan delante `003`: `it('003 CA-1.2 …')`, `it('003 E-8 RF-021 …')`, `test('003 RNF-002 …')`.
> - Lo que se descubra o se decida al implementar (versiones, nombres, desviaciones) va en el Registro. Si cambia una decisión, también va al plan como `D-x (añadida en T-0xx)`.
>
> Convenciones de esta spec:
> - **Rama:** `feat/003-arrastrar-y-soltar` (ya existe, con la spec y el plan). Commits como `feat(api): T-0xx … [spec 003]` (C-24).
> - **Dependencias:** solo `@dnd-kit/core` 6.3.1, fijada, en `apps/web` (plan §2). Solo T-001 toca `package.json` y `pnpm-lock.yaml`.
> - **Test primero y C-19:**
>   - Cada tarea de las fases 1, 3 y 4 escribe primero sus tests unitarios o de integración y los ve fallar por la razón correcta (se anota en el Registro). Después implementa y termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde.
>   - Los E2E nuevos (`e2e/drag-and-drop.spec.ts`) se escriben en T-005 y T-006 y **pueden quedar en rojo** hasta T-021, salvo los que cada tarea de la fase 4 dice que tienen que pasar. `pnpm test:e2e` no forma parte de C-19.
>   - `e2e/auth.spec.ts`, `e2e/design-system.spec.ts` y `e2e/board.spec.ts` siguen en verde, salvo los ajustes de nombres de D-16 (T-014).
> - **Contratos:** los de plan §4.2 y §4.3.
> - **Valores visuales:** solo de `tokens.css` (ADR-0003); sin `style=` ni transformaciones en línea (D-9, D-10).
> - **Postgres:** `pnpm test` (proyecto `api`) y `pnpm test:e2e` necesitan `pnpm db:up`.
> - **Riesgo primero (D-15):** el E2E del teclado entre columnas pasa en T-015 y el táctil en los tres proyectos se comprueba en T-018. Si alguno no se cumple, **parar y avisar** como cambio del plan.
> - **Commits, desde T-026 (verificación M-6):** un commit por tarea. Los commits los hace el usuario, así que el hash de cada tarea se anota en el Registro al empezar la siguiente. Las filas anteriores a T-026 se quedan sin hash, por decisión del usuario.

## Fase 1 · Preparación

Las tres tareas son independientes.

- [x] **T-001** [P] Añadir `@dnd-kit/core` 6.3.1 a `apps/web`
  - Ficheros: `apps/web/package.json`, `pnpm-lock.yaml`
  - Cubre: C-2, D-6 (plan §2 y §9, R-1)
  - Pasos: `pnpm --filter @todo/web add @dnd-kit/core@6.3.1 --save-exact`
  - Hecho cuando:
    - `apps/web/package.json` tiene `"@dnd-kit/core": "6.3.1"` sin `^`;
    - `pnpm ls --filter @todo/web @dnd-kit/core` muestra 6.3.1 y `pnpm install` no avisa de `peerDependencies` con React 19 (riesgo de plan §8);
    - no entra ningún otro paquete de `@dnd-kit` que `utilities` y `accessibility` (ni `sortable` ni `react`);
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-002** [P] Añadir `position` a `Task` con la migración `task_position`, y colocar las tareas nuevas las primeras de Backlog
  - Ficheros:
    - `apps/api/prisma/schema.prisma`: `position Int` e índice `(userId, status, position)` en lugar de `(userId, createdAt)` (plan §4.2);
    - `apps/api/prisma/migrations/<timestamp>_task_position/migration.sql`: creada con `pnpm --filter @todo/api exec prisma migrate dev --create-only --name task_position` y completada con el relleno de E-19 **antes** de aplicarla (plan §4.2, C-5);
    - `apps/api/src/repositories/task.repository.ts`: `lockUser` y `makeRoom` (D-2); `createTask` entra con `makeRoom(backlog, 0)` dentro de una transacción;
    - `apps/api/test/tasks.create.test.ts`.
  - Por qué va aquí: la migración quita el valor por defecto de `position`, así que `createTask` tiene que darla en la misma tarea o la API deja de poder crear.
  - Cubre: RF-008 (dato), RF-009, CA-2.3, E-19, D-1, D-2, C-5
  - Casos (test primero):
    - `003 CA-2.3 RF-009`: con tareas en Backlog, To do e In progress, una tarea nueva sale la primera de Backlog y el orden de las demás columnas no cambia;
    - tres creaciones seguidas en Backlog quedan de la más reciente a la más antigua y sin posiciones repetidas (consulta directa con `prisma`).
  - Hecho cuando:
    - **E-19 (manual):** en la base de desarrollo con tareas de la 002, el orden de cada columna es el mismo antes y después de `pnpm db:migrate`; el antes y el después se anotan en el Registro;
    - la migración de la 002 no cambia (`git diff` vacío en ella);
    - los tests de la 002 siguen en verde (el orden por `createdAt` aún coincide);
    - los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; solo `task.repository.ts` importa Prisma

- [x] **T-003** [P] Anotar en la spec 002 que la modifica la 003
  - Ficheros: `specs/002-tablero-de-tareas/spec.md` (solo el Registro de cambios)
  - Cubre: spec §10, RF-008, RF-010
  - Hecho cuando: el Registro de cambios de la 002 tiene una fila «Modificada por la spec 003»: RF-008 de la 003 sustituye a 002/RF-002 (y con él a 002/CA-1.8, 002/E-22 y 002/E-24), y RF-010 completa 002/RF-024. No cambia nada más de la 002 (`git diff` solo en esa tabla)

## Fase 2 · Contratos y tests

T-004 termina en verde. T-005 y T-006 escriben los E2E, que **deben fallar** por la razón indicada (se anota en el Registro), sin errores de sintaxis ni de tipos.

- [x] **T-004** [P] Definir `moveTaskInputSchema` y `actualEndDateAfterMove` en `shared`
  - Ficheros: `packages/shared/src/tasks.ts`, `packages/shared/src/tasks.test.ts`, `packages/shared/src/index.ts` (si hace falta exportar)
  - Cubre: RF-003, RF-004, E-15, E-16 (`today` como `YYYY-MM-DD`), D-3, D-4, C-10, C-11
  - Casos (test primero):
    - `moveTaskInputSchema`: válido; `index` negativo, decimal o ausente; `status` fuera del enum; `today` inexistente (`2026-02-31`) o con hora;
    - `actualEndDateAfterMove`: entra en Done → `today` (`003 RF-003`); sale de Done → `null` (`003 RF-004`); dentro de Done → la que tenía (`003 E-15`); entre dos columnas que no son Done → `null`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-005** [P] Escribir los E2E de teclado y ratón (en rojo)
  - Ficheros: `e2e/drag-and-drop.spec.ts` (nuevo), `e2e/helpers.ts` (`dragCard` con `page.mouse` y pasos intermedios, `moveHandle`)
  - Cubre: CA-1.1, CA-1.2, CA-1.3, CA-1.6, CA-1.7, CA-1.8, CA-1.9, CA-2.1, CA-2.2, CA-2.5, CA-3.1, CA-3.5, CA-3.6, E-7, E-17, E-18, D-15 (plan §7, E2E 1 y 2)
  - Casos:
    - **D-15, el primero:** con teclado, coger «Preparar la demo» en To do, Flecha derecha y Espacio: el foco sigue en su asa, no se cancela solo y se guarda (CA-3.5); con Esc en vez de Espacio, vuelve (CA-3.6). En `chromium` y `webkit`.
    - CA-3.1 con `tabTo`: el asa tiene el foco visible y el nombre «Mover «Preparar la demo»».
    - **Ratón:** CA-1.1, CA-1.2 (durante el arrastre, la capa sigue al puntero y el hueco está en In progress), CA-1.3 (volver a cargar), CA-1.6, CA-1.7 (soltar fuera y Esc: ninguna petición a `…/move` y sin aviso), CA-1.8 (clic sin mover abre el detalle; arrastrar no lo abre).
    - CA-2.1, CA-2.2 (otro contexto de navegador con la misma cuenta) y CA-2.5 (soltar en el mismo sitio: ninguna petición).
    - CA-1.9 y E-7 con `page.route` abortando `…/move`.
    - E-17 (cambiar el tamaño a mitad de arrastre) y E-18 (con el detalle abierto, ni el ratón ni Tab llegan a una tarjeta o a un asa).
  - Hecho cuando: `pnpm test:e2e e2e/drag-and-drop.spec.ts` falla porque no existen el asa ni el arrastre (no por la sintaxis ni por los tipos); los otros tres ficheros E2E siguen en verde; `pnpm typecheck` y `pnpm lint` en verde

- [x] **T-006** Escribir los E2E de dedo, móvil, accesibilidad y rendimiento (en rojo)
  - Depende de: T-005 (mismos ficheros)
  - Ficheros: `e2e/drag-and-drop.spec.ts`, `e2e/helpers.ts` (`touchDragCard`: CDP en `chromium` y `chrome`, `TouchEvent` en `webkit`, R-6)
  - Cubre: CA-3.9, CA-3.10, CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5, RF-018, RF-019, RF-023, RNF-001, RNF-002, RNF-004, E-4, E-5, E-6 (plan §7, E2E 3 a 7)
  - Casos:
    - **Dedo:** CA-4.1, CA-4.3, CA-4.4 y CA-4.5 en los tres proyectos; CA-4.2 solo en `chromium` y `chrome` (R-6).
    - **Móvil a 375 px con teclado:** CA-3.9 y CA-3.10.
    - **RNF-001:**
      - axe sin infracciones con una tarjeta cogida con teclado, en claro y oscuro;
      - el asa mide 44 × 44 a 375 px y 32 × 32 a 1280 px;
      - con `reducedMotion: 'reduce'`, la capa que sigue al puntero no tiene `scale`.
    - **E-6:** con un título de 200 caracteres, el hueco mide lo mismo que la tarjeta en reposo.
    - **Solo en `chromium`**, con `createTaskViaApi`:
      - RNF-002: 500 tareas, 200 en To do; desde el `pointerup` hasta el primer frame con la tarjeta en su sitio y sin hueco (`MutationObserver` + `requestAnimationFrame`) ≤ 100 ms; el tiempo va en `test.info().annotations`;
      - E-4: con la tarjeta en el borde inferior de la columna de 200, el `scrollTop` de la lista aumenta;
      - E-5: a 1024 px, con la tarjeta en el borde derecho, el `scrollLeft` del tablero aumenta.
  - Hecho cuando: los casos nuevos fallan porque no existen el asa ni el arrastre (no por la sintaxis ni por los tipos); `pnpm typecheck` y `pnpm lint` en verde

## Fase 3 · Núcleo

- [x] **T-007** Ordenar la lista por `position` y colocar la tarjeta la primera al cambiar de estado desde el detalle
  - Depende de: T-002
  - Ficheros:
    - `apps/api/src/repositories/task.repository.ts`: orden `position asc, createdAt desc, id desc` (D-1); `findTaskOfUser`; `updateTaskOfUser(…, { toTop })` con `lockUser` y `makeRoom(estado nuevo, 0)`;
    - `apps/api/src/services/tasks.service.ts`: `updateTask` lee la tarea antes (404 si no es suya) y pide `toTop` solo si cambia `status` (D-5);
    - `apps/api/test/tasks.list.test.ts`, `apps/api/test/tasks.update.test.ts`.
  - Cubre: RF-008, RF-010, CA-2.2 (API), CA-2.4, D-1, D-5, D-16, C-13
  - Casos (test primero):
    - **D-16 en `tasks.list.test.ts`:** el test de 002/CA-1.8 pasa a `003 RF-008` (el orden sale de `position`, forzada con `prisma`, no de `createdAt`); el de 002/E-24 pasa a `003 RF-008 D-1` (con la misma `position`, desempate por `createdAt desc` y después `id desc`); el de 002/E-22 pasa a `003 RF-010`;
    - `003 CA-2.2 RF-008`: dos sesiones de la misma cuenta ven el mismo orden;
    - `003 CA-2.4 RF-010`: la segunda de To do pasa a In progress con `PUT` y sale la primera de In progress; el orden relativo del resto de To do y de In progress no cambia;
    - `003 RF-010`: un `PUT` sin cambio de estado no la mueve;
    - el `PUT` de una tarea ajena sigue dando 404 `TASK_NOT_FOUND` y no cambia el orden de su dueño.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; solo `task.repository.ts` importa Prisma

- [x] **T-008** Implementar `moveTask` en el service y `moveTaskOfUser` en el repository
  - Depende de: T-004, T-007 (mismos ficheros)
  - Ficheros: `apps/api/src/repositories/task.repository.ts` (`moveTaskOfUser`: transacción, `lockUser`, `makeRoom(destino, index, id)` y escritura de `status`, `position` y `actualEndDate` con `where: { id, userId }`), `apps/api/src/services/tasks.service.ts` (`moveTask` con `now?`), `apps/api/src/services/tasks.service.test.ts`
  - Cubre: RF-001, RF-003, RF-004, RF-007, RNF-003, E-10, E-15, D-2, D-4, D-5, C-8, C-13
  - Casos (test primero, en el service con Postgres real):
    - con `now` fijo, entrar en Done con `today` = «hoy UTC + 1» se acepta y con «+ 2» lanza `VALIDATION_ERROR`; dentro de Done no se comprueba (E-15);
    - `003 E-10 RNF-003`: mover una tarea ajena lanza `TASK_NOT_FOUND` y no cambia ni la tarea ni el orden de su dueño;
    - mover a `index` 1 de una columna con tres desplaza solo las de debajo.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; solo `task.repository.ts` importa Prisma

- [x] **T-009** Añadir `POST /api/tasks/:id/move`, con sus tests de integración primero
  - Depende de: T-008
  - Ficheros: `apps/api/test/tasks.move.test.ts` (nuevo), `apps/api/src/routes/tasks.routes.ts` (`requireAuth`, `validateTaskId`, `validateBody(moveTaskInputSchema)`)
  - Cubre: RF-001, RF-003, RF-004, RF-007, RF-022 (API), RNF-003, CA-1.5, CA-2.1, E-9, E-10, E-11, E-15, D-3, C-7, C-9, C-13, C-14 (plan §4.3, API)
  - Casos (test primero; fallan con 404 `NOT_FOUND` hasta montar la ruta):
    - `003 RF-001`: de To do a In progress con `index` 0 → 200 con el estado nuevo, y la lista la pone la primera de In progress;
    - `003 CA-2.1 RF-007`: dentro de To do, de la tercera a la primera; el orden relativo del resto se mantiene;
    - `index` mayor que la columna → al final;
    - `003 RF-003`: entra en Done con `today`; `003 CA-1.5 RF-004`: sale de Done → `actualEndDate: null`; `003 E-15`: dentro de Done conserva la fecha;
    - `today` posterior a «hoy UTC + 1» al entrar en Done → 400 `VALIDATION_ERROR`;
    - cuerpo no válido → 400; sin sesión → 401; sin JSON → 415;
    - `003 E-9 E-10 RF-022`: 404 `TASK_NOT_FOUND` por tarea inexistente, borrada, **ajena** (C-13) y con id mal formado;
    - `003 RNF-003`: el orden de Luis no cambia cuando Ana mueve y crea;
    - `003 E-11`: dos `move` seguidos sobre la misma columna; el orden final es el del segundo y no se repite ninguna posición.
  - Hecho cuando: los tests fallan primero por la ruta que falta; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-010** [P] Crear las funciones puras de orden del tablero
  - Ficheros: `apps/web/src/lib/board-order.ts`, `apps/web/src/lib/board-order.test.ts` (nuevos); `apps/web/src/components/Board.tsx` (solo importar `groupByStatus` desde `board-order.ts`)
  - Cubre: RF-007, RF-011, RF-014, RF-015, CA-3.3, CA-3.4, CA-3.7, E-1, E-3, D-8, D-9
  - Casos (test primero):
    - `placeTask`: quita la tarea por id y la pone en `to`, en la misma columna y en otra; no cambia el orden relativo del resto;
    - `placementOf` y `samePlacement`;
    - `stepPlacement`: arriba y abajo una posición (`003 CA-3.3`); izquierda y derecha a la primera de la columna vecina (`003 CA-3.4`), también si está vacía; en los bordes, `undefined` (`003 CA-3.7 RF-015`); con una sola tarjeta, arriba y abajo no la mueven (`003 E-3`);
    - `placementFromOver`: misma columna hacia arriba y hacia abajo (como `arrayMove`); otra columna por encima y por debajo del centro; columna vacía → al final (`003 E-1`).
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los tests de `Board` de la 002 siguen en verde

- [x] **T-011** [P] Añadir el texto del aviso de mover y los anuncios del teclado
  - Depende de: T-010 (tipo `Placement`)
  - Ficheros: `apps/web/src/lib/task-messages.ts`, `apps/web/src/lib/task-messages.test.ts`
  - Cubre: RF-013, RF-014, RF-016, RF-017, RF-021, RF-022, E-20, D-14
  - Casos (test primero, con el texto exacto de la spec):
    - `moveErrorText`: `TASK_NOT_FOUND` → «Esta tarea ya no existe.»; `NetworkError` y un `ApiError` 500 → «No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.»;
    - `pickedText`, `movedText`, `droppedText` y `cancelledText` con los ejemplos de CA-3.2 a CA-3.6 (`<n>` = `index + 1`; `<total>` cuenta la tarjeta que se mueve) y nombres de columna de `STATUS_NAMES`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-012** Crear `useMoveTask` con actualización optimista y deshacer por tarjeta
  - Depende de: T-004, T-010
  - Ficheros: `apps/web/src/lib/task-queries.ts`, `apps/web/src/lib/task-queries.test.tsx`
  - Cubre: RF-003, RF-004, RF-020, RF-021, RF-022, CA-1.4 (datos), E-12, D-12
  - Casos (test primero):
    - `003 RF-020`: con el `fetch` de `…/move` pendiente, la caché ya tiene la tarjeta en su sitio nuevo;
    - la tarjeta optimista lleva el estado nuevo y la fecha de `actualEndDateAfterMove` (`003 CA-1.4 RF-003`: Done con `today`);
    - `003 RF-021`: con `NetworkError` o 500, la tarjeta vuelve a `from`;
    - `003 RF-022`: con `TASK_NOT_FOUND`, la tarjeta se quita de la caché;
    - `003 E-12`: dos movimientos, el primero falla y el segundo va bien; solo el primero vuelve;
    - `GET /api/tasks` se vuelve a pedir solo cuando no queda ningún movimiento pendiente;
    - sin reintentos.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-013** [P] Añadir el token `--ring-drop` y sus parejas de contraste
  - Ficheros: `apps/web/src/styles/tokens.css`, `apps/web/src/styles/tokens.test.ts`
  - Cubre: RNF-001, RNF-005, X-1 (plan §4.5, §7 «Contraste»)
  - Casos (test primero):
    - `--ring-drop` vale `--ink-500` en claro y `--ink-400` en oscuro;
    - parejas no textuales ≥ 3:1 en N, SB y C+, claro y oscuro: `--ring-drop` sobre `column` y el icono del asa (`--text-2`) sobre `taskCard`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` en verde sin cambiarlo

## Fase 4 · Integración / UI

Todas tocan `Board.tsx`, `BoardColumn.tsx`, `TaskCard.tsx` o `task-move.ts`: van en orden.

- [x] **T-014** Convertir `TaskCard` en un contenedor con botón de abrir, asa y variantes
  - Depende de: T-013
  - Ficheros:
    - `apps/web/src/components/TaskCard.tsx` (D-11; `variant` `rest`, `placeholder`, `lifted` y `overlay`, D-10; `select-none`, D-6), `TaskCard.test.tsx`;
    - D-16, nombres exactos porque el asa también coincide: `apps/web/src/components/Board.test.tsx`, `TaskDialog.test.tsx` (si busca la tarjeta por nombre), `e2e/board.spec.ts`, `e2e/helpers.ts`.
  - Cubre: RF-002 (aspecto), RF-006, RF-012, CA-1.8 (unitario), CA-3.1 (unitario), CA-3.8, RNF-001, RNF-005, D-10, D-11, D-16
  - Casos (test primero):
    - la tarjeta no es un `<button>`: contiene el botón de abrir, con `data-task-id` y el nombre accesible de siempre, y el asa, con `data-task-handle`, nombre «Mover «Preparar la demo»» (`003 CA-3.1 RF-012`) e icono `GripVertical`;
    - clic y Enter en el botón de abrir llaman a `onOpen` (`003 CA-3.8 RF-006`); clic en el asa no; *(spec v2.0: el clic de puntero en el asa sí abre el detalle; este caso lo sustituye T-028)*
    - el asa es `size-11 lg:size-8`, `rounded-pill` y `cursor-grab`; el orden de tabulación es abrir → asa;
    - variantes: `placeholder` con `bg-sunken`, el anillo `--ring-drop`, sin sombra y contenido `invisible`; `lifted` y `overlay` con `--shadow-float` y `motion-safe:scale-102`; `overlay` con `aria-hidden` e `inert`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e e2e/board.spec.ts e2e/design-system.spec.ts` en verde en `chromium`, `chrome` y `webkit` (riesgo de plan §8)

- [x] **T-015** Coger, mover, soltar y cancelar con teclado, con anuncios y foco en el asa
  - Depende de: T-005, T-009, T-011, T-012, T-014
  - Ficheros:
    - `apps/web/src/lib/task-move.ts` (nuevo): `useTaskMove` con el estado `drag`, `displayTasks`, `announcement`, `handleProps` y `commit` (D-7, D-8);
    - `apps/web/src/components/Board.tsx`: región viva `sr-only` `aria-live="assertive"` siempre presente; `DndContext` con los sensores de D-6 (`MouseSensor` y `TouchSensor`) y `accessibility` vacía, aún sin destinos (riesgo React 19 de plan §8);
    - `apps/web/src/components/BoardColumn.tsx`: `handleProps` y `dragMode`/`dragTaskId` hasta la tarjeta (`variant="lifted"`);
    - `apps/web/src/components/Board.test.tsx`.
  - Cubre: RF-001, RF-007, RF-011, RF-013, RF-014, RF-015, RF-016, RF-017, CA-2.5, CA-3.2, CA-3.3, CA-3.4, CA-3.5, CA-3.6, CA-3.7, E-2, D-7, D-8, D-15
  - Casos (test primero, en `Board.test.tsx` con `user-event`, `mockBrowser` y la ruta `POST /api/tasks/<id>/move`):
    - `003 CA-3.2 RF-013`: Espacio en el asa coge la tarjeta (`lifted`) y la región viva dice el texto exacto; Enter hace lo mismo;
    - `003 CA-3.3` y `003 CA-3.4 RF-014`: las flechas la mueven y se anuncia; la página no hace scroll (`preventDefault`);
    - `003 CA-3.7 RF-015`: en el borde no se mueve ni se anuncia;
    - `003 CA-3.5 RF-016`: Espacio la suelta, hace `POST …/move` con `{ status, index, today }`, el foco sigue en su asa y se anuncia; los recuentos cambian (`003 RF-001`);
    - `003 RF-007`: soltar en otra posición de la misma columna;
    - `003 CA-3.6 RF-017`: Esc la devuelve, sin petición, con el foco en el asa y el anuncio; Tab fuera del asa también cancela;
    - `003 CA-2.5 RF-011`: coger y soltar sin mover → ninguna petición;
    - `003 E-2`: mover la única tarjeta de To do → aparece «Nada por hacer».
  - Hecho cuando:
    - los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los tests de la 002 siguen en verde con `DndContext` montado;
    - **el E2E de D-15 y el de CA-3.1 de T-005 pasan en `chromium` y `webkit`.** Si no pasan, **parar y avisar**: es un cambio del plan (R-4).

- [x] **T-016** Poner la fecha real de fin al soltar y mostrar los avisos de mover
  - Depende de: T-015
  - Ficheros: `apps/web/src/lib/task-move.ts` (`today = todayLocal()`, `onNotice`), `apps/web/src/components/Board.tsx` (`notice` pasa a `{ tone, text }`: `offline` para RF-021, `info` para `TASK_NOT_FOUND`), `apps/web/src/components/Board.test.tsx`
  - Cubre: RF-003, RF-004, RF-021, RF-022, CA-1.4, CA-1.5, CA-1.9, CA-1.10, CA-2.6, E-7, E-8, E-9, E-13, E-14, E-16, D-12, D-14
  - Casos (test primero, con teclado y `vi.setSystemTime`):
    - `003 CA-1.4 RF-003 E-13`: una retrasada de In progress soltada en Done pierde «Retrasada» y muestra «31 oct», sin abrir el detalle;
    - `003 CA-1.5 RF-004`: de Done a To do, sin fecha real de fin;
    - `003 E-14`: sacar de Done una tarea con el fin estimado pasado → vuelve «Retrasada»;
    - `003 E-16`: con `TZ=Europe/Madrid` a las 00:30 del 01/11/2026, la petición lleva `today: '2026-11-01'`;
    - `003 CA-1.9 RF-021 E-7`: con `NetworkError` y con 500, la tarjeta vuelve a su posición, los recuentos a los de antes y sale el aviso en la zona de alerta del tablero;
    - `003 CA-2.6`: lo mismo al reordenar dentro de una columna;
    - `003 CA-1.10 RF-022 E-9`: 404 `TASK_NOT_FOUND` → «Esta tarea ya no existe.» y la tarjeta desaparece;
    - `003 E-8`: 401 `SESSION_EXPIRED` → `location.replace('/login?expired=1')`;
    - los avisos de la 002 (borrar, guardar) siguen saliendo con su tono.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-017** Seguir la columna en móvil al mover con teclado
  - Depende de: T-006, T-016
  - Ficheros: `apps/web/src/lib/task-move.ts` (`onMobileColumn` en cada paso a otra columna y al cancelar, D-13), `apps/web/src/components/Board.tsx`, `apps/web/src/components/Board.test.tsx`
  - Cubre: RF-023, CA-3.9, CA-3.10, D-13
  - Casos (test primero):
    - `003 CA-3.9 RF-023`: con To do elegida en el selector, Flecha derecha con la tarjeta cogida marca In progress en el selector y la columna visible pasa a In progress;
    - `003 CA-3.10 RF-023`: Esc vuelve a To do en el selector y en la columna visible, con el anuncio de CA-3.6.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los E2E de CA-3.9 y CA-3.10 de T-006 pasan en `chromium` y `webkit`

- [x] **T-018** Arrastrar con ratón y con el dedo entre columnas y dentro de una columna
  - Depende de: T-017
  - Ficheros: `apps/web/src/lib/task-move.ts` (`dndProps`: `collisionDetection` con `pointerWithin` + `closestCenter`, `measuring` `Always`, `onDragStart`/`Over`/`End`/`Cancel` con `placementFromOver`; fuera de toda columna vuelve al origen), `apps/web/src/components/BoardColumn.tsx` (droppable `column:<status>`; cada tarjeta, draggable y droppable con sus `listeners` en el contenedor), `apps/web/src/components/TaskCard.tsx` (`dragRef`/`dragListeners`), `apps/web/src/components/Board.tsx`
  - Cubre: RF-001, RF-005, RF-006, RF-007, RF-011, RF-018, CA-1.1, CA-1.3, CA-1.6, CA-1.7, CA-1.8, CA-1.9, CA-2.1, CA-2.2, CA-2.5, CA-4.1, E-1, E-7, D-6, D-9
  - Casos: jsdom no calcula posiciones (plan §7), así que esta tarea se prueba con los E2E de T-005 y T-006. Los tests unitarios de `Board` y `TaskCard` siguen en verde.
  - Hecho cuando:
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde;
    - los E2E de ratón de T-005 (CA-1.1, CA-1.3, CA-1.6, CA-1.7, CA-1.8, CA-1.9, CA-2.1, CA-2.2 y CA-2.5) pasan en `chromium`;
    - **el E2E de CA-4.1 (dedo) pasa en `chromium`, `chrome` y `webkit` (R-6, D-15).** Si `webkit` no acepta los `TouchEvent` sintéticos, **parar y avisar**: es un cambio del plan.

- [x] **T-019** Mostrar la tarjeta levantada que sigue al puntero y el hueco de destino
  - Depende de: T-018
  - Ficheros: `apps/web/src/components/Board.tsx` (`DragOverlay` con `TaskCard variant="overlay"` dentro de un contenedor `pointer-events-none fixed inset-0 z-(--z-popover)`, `dropAnimation={null}`), `apps/web/src/components/BoardColumn.tsx` (la tarjeta arrastrada con `variant="placeholder"`), `Board.test.tsx` y `BoardColumn.test.tsx` si comprueban clases
  - Cubre: RF-002, CA-1.2, E-6, RNF-001 (movimiento reducido), RNF-005, D-10, X-1, X-2
  - Hecho cuando: `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los E2E de CA-1.2, E-6 y movimiento reducido de T-005 y T-006 pasan en `chromium`; `design-rules.test.ts` en verde sin cambiarlo

- [x] **T-020** Limitar el arrastre con el dedo y en móvil a la columna visible
  - Depende de: T-019
  - Ficheros: `apps/web/src/lib/task-move.ts`, `apps/web/src/components/BoardColumn.tsx` o `TaskCard.tsx` solo si hace falta un ajuste; los cambios de comportamiento se anotan en el Registro
  - Cubre: RF-018, RF-019, CA-4.2, CA-4.3, CA-4.4, CA-4.5, RNF-004, D-6, D-13
  - Hecho cuando: `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los E2E de dedo de T-006 pasan: CA-4.1, CA-4.3, CA-4.4 y CA-4.5 en `chromium`, `chrome` y `webkit`, y CA-4.2 en `chromium` y `chrome`

## Fase 5 · Pulido y cierre

- [x] **T-021** Poner en verde todos los E2E en los tres proyectos
  - Depende de: T-020
  - Ficheros: `e2e/drag-and-drop.spec.ts` y `e2e/helpers.ts` (solo ajustes de selectores o esperas); cualquier corrección de comportamiento o aspecto en `apps/web` se anota en el Registro
  - Cubre: RNF-001, RNF-004, E-17, E-18 y todos los CA de T-005 y T-006 salvo los de solo `chromium` (T-022)
  - Hecho cuando: `pnpm test:e2e` (los cuatro ficheros) en verde en `chromium`, `chrome` y `webkit`; axe sin infracciones con una tarjeta cogida, en los dos temas; el asa mide 44 px a 375 y 32 px a 1280

- [x] **T-022** Comprobar el rendimiento y el scroll automático con 500 tareas
  - Depende de: T-021 (mismo fichero E2E)
  - Ficheros: `e2e/drag-and-drop.spec.ts` (solo los tests de RNF-002, E-4 y E-5); `apps/web/src/components/TaskCard.tsx` o `BoardColumn.tsx` solo si hace falta `memo` (plan §8)
  - Cubre: RNF-002, E-4, E-5
  - Hecho cuando: en `chromium`, el test de RNF-002 da ≤ 100 ms en tres ejecuciones seguidas (los tiempos se anotan en el Registro); los de E-4 y E-5 pasan; `grep -rn "console.log" e2e/` no encuentra nada

- [x] **T-023** [P] Actualizar `DESIGN.md` a 1.4.0-todo.1 y repasar la checklist §21
  - Depende de: T-019
  - Ficheros: `DESIGN.md`
  - Cubre: RNF-001, RNF-005, X-1, X-2, C-26 (plan §4.6, §7 «Manual»)
  - Hecho cuando:
    - `--ring-drop` está en §1.4 y en la lista de anillos de §6.2, con el mismo valor que `tokens.css` (revisado con `grep`);
    - §11.3 tiene la frase nueva del orden (plan §4.6) y describe el asa, la tarjeta levantada, el hueco con anillo y el aviso «No hemos podido mover la tarea…» en la misma zona de alerta;
    - §8 «Arrastrar» recoge X-1 y X-2;
    - la versión es 1.4.0-todo.1, con su fila en el «Historial»;
    - la checklist §21 repasada sobre la tarjeta levantada, el hueco y el asa a 375, 768 y 1280, en los dos temas y con «aumentar contraste», con el resultado en el Registro (sin prueba con lector de pantalla, plan D-22)

- [x] **T-024** Comprobar la trazabilidad de requisitos, criterios y casos límite en los tests
  - Depende de: T-021, T-022
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, todos los RF, CA, E y RNF
  - Hecho cuando: un `grep` de los tests cuyo nombre empieza por `003 ` en `packages/shared/src/**/*.test.ts`, `apps/api/{src,test}/**/*.test.ts`, `apps/web/src/**/*.test.ts(x)` y `e2e/*.spec.ts` encuentra al menos uno para cada uno de:
    - RF-001…RF-023;
    - CA-1.1…CA-1.10, CA-2.1…CA-2.6, CA-3.1…CA-3.10 y CA-4.1…CA-4.5;
    - E-1…E-20, salvo E-19, que es manual (plan §6) y se comprueba con la nota de T-002 en el Registro;
    - RNF-001…RNF-005.

    Por ejemplo: `grep -rhoE "(it|test)(\.each\([^)]*\))?\('003 [^']*" … | grep -oE "(RF|CA|E|RNF)-[0-9]+(\.[0-9]+)?" | sort -u`. La lista de lo encontrado (79 IDs) se anota en el Registro.

- [x] **T-025** Ejecutar `/sdd-verificar`
  - Depende de: T-021, T-022, T-023, T-024
  - Ficheros: `specs/003-arrastrar-y-soltar/verificacion.md`
  - Cubre: todos
  - Hecho cuando: el informe está escrito; si sale APTO, la spec pasa a `implementada` con la confirmación del usuario

## Fase 6 · Correcciones de la verificación (spec v2.0 y v3.0)

Resuelven `verificacion.md` (T-025, NO APTO), con las decisiones del usuario del 2026-11-01. T-038 y T-039 (spec v3.0) salen del hallazgo de T-031 y van antes de T-032. Van en orden: casi todas tocan `task-move.ts`. Cada una, test primero, termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los E2E que nombra tienen que pasar.

- [x] **T-026** Guardar `drag` y `landing` por id, sin copias de la lista
  - Ficheros: `apps/web/src/lib/task-move.ts`, `apps/web/src/components/Board.tsx` (la capa usa `draggedTask`), `apps/web/src/components/Board.test.tsx` si hace falta
  - Cubre: C-4, D-7, D-8, D-18 (verificación M-5). Sin cambio de comportamiento
  - Pasos:
    - `DragState` lleva `taskId`; la tarea se busca en `tasks` en cada render;
    - si la tarea ya no está, `drag` se borra durante el render, sin anuncio (D-7);
    - `landing = { taskId, to, before }` solo se aplica mientras la tarea siga en `before`, y se vacía al terminar la mutación;
    - fuera `seenTasks`.
  - Casos (test primero): `003 C-4 D-8` en pleno movimiento, si llega un título nuevo en la lista, la vista previa y el anuncio de soltar usan el título nuevo. Falla hoy, porque `drag` guarda una copia. El resto lo protegen los tests actuales.
  - Hecho cuando: el caso falla primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e e2e/drag-and-drop.spec.ts` en verde en `chromium` y `webkit`, y RNF-002 sigue en ≤ 100 ms (el tiempo se anota en el Registro). Si no, **parar y avisar**

- [x] **T-027** Mantener a la vista la tarjeta cogida con teclado
  - Depende de: T-026
  - Ficheros: `e2e/drag-and-drop.spec.ts`, `apps/web/src/lib/task-move.ts` (D-23), `apps/web/src/components/PrivateArea.tsx` (`scroll-padding` de `main`)
  - Cubre: RF-024, CA-3.11, RNF-001, C-20, D-23 (verificación B-1)
  - Casos (E2E primero, porque jsdom no calcula posiciones), en `chromium` y `webkit`:
    - `003 CA-3.11 RF-024` a 1280 × 900 y 1280 × 720, con 12 tarjetas: en cada Flecha abajo hasta el final y Flecha arriba hasta el principio, la tarjeta está dentro de la lista y el asa tiene el foco;
    - lo mismo a 375 × 812: la tarjeta está dentro de la ventana y en el centro del asa está el asa (`elementFromPoint`), no «Crear tarea»;
    - al pasar a otra columna, la tarjeta también queda a la vista.
  - Hecho cuando: los casos fallan primero, a 1280 × 900 desde la 8.ª flecha; después pasan; `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-028** Abrir el detalle con un clic o un toque en el asa
  - Depende de: T-027
  - Ficheros: `apps/web/src/components/TaskCard.tsx` (D-24), `TaskCard.test.tsx`, `Board.test.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-006, RF-013, CA-1.11, CA-4.6, D-24 (verificación I-1)
  - Casos (test primero):
    - `003 CA-1.11 RF-006` en `TaskCard.test`: clic con `detail: 1` en el asa llama a `onOpen` y no a `handleProps.onClick`; con `detail: 0`, al revés. Sustituye el caso «clic en el asa, no» de T-014;
    - `003 CA-1.11` E2E: clic en el asa abre el detalle, no se levanta la tarjeta y la región viva sigue vacía;
    - `003 CA-4.6` E2E a 375 con `tap`: abre el detalle como panel inferior;
    - `003 RF-006` E2E: arrastrar desde el asa mueve la tarjeta y no abre el detalle;
    - `003 RF-017 D-24` con la tarjeta cogida con teclado, un clic en su asa abre el detalle, sin guardar, y el movimiento se cancela.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los E2E de D-15 y CA-3.1 siguen en verde en `chromium` y `webkit` (Espacio y Enter siguen cogiendo). Si no, **parar y avisar**: es el riesgo de D-24

- [x] **T-029** No guardar si se suelta fuera justo al salir de la columna
  - Depende de: T-028
  - Ficheros: `e2e/drag-and-drop.spec.ts`, `apps/web/src/lib/task-move.ts` (D-25)
  - Cubre: E-21, RF-005, CA-1.7, D-25 (verificación M-1)
  - Casos (E2E primero): `003 E-21 RF-005` con la vista previa en In progress, mover el ratón fuera de toda columna y soltar sin esperar (`Promise.all`), 6 veces: ninguna petición a `…/move` y la tarjeta en su sitio, en `chromium` y `webkit`.
  - Hecho cuando: el caso falla primero (6/6 en `chromium` antes del cambio); después pasa; repetido con `--repeat-each=5` sigue en verde; la opción de D-25 que quede se anota en el Registro; `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-030** Llevar el foco a «Crear tarea» si la tarea ya no existe
  - Depende de: T-029
  - Ficheros: `apps/web/src/lib/task-move.ts` (`onTaskGone`, D-26), `apps/web/src/components/Board.tsx`, `Board.test.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-022, CA-3.12, D-26 (verificación M-2)
  - Casos (test primero):
    - `003 CA-3.12 RF-022` en `Board.test`: con 404 al soltar con teclado, el foco acaba en «Crear tarea»; si era la última tarea, en el del estado vacío;
    - `003 RF-022 D-26` si el foco ya salió del asa, no se mueve;
    - `003 CA-3.12` E2E con la tarea borrada de verdad por la API, en `chromium` y `webkit`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-031** Volver a la columna de origen si falla el guardado en móvil
  - Depende de: T-030
  - Ficheros: `apps/web/src/lib/task-move.ts` (D-26), `Board.test.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-023, RF-021, CA-3.13, D-26 (verificación M-2)
  - Casos (test primero):
    - `003 CA-3.13 RF-023` en `Board.test`: con `NetworkError` tras pasar a In progress y soltar, el selector vuelve a To do y la columna visible también;
    - `003 RF-023 D-26` si el foco ya salió del asa, la columna visible no cambia;
    - `003 CA-3.13` E2E a 375 con `page.route` abortando `…/move`: se ve To do, el foco está en el asa y sale el aviso, en `chromium` y `webkit`. Hace falta el E2E porque jsdom no aplica `display: none`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-038** Avisar y volver a la columna sin esperar a la lista
  - Depende de: T-031
  - Ficheros: `apps/web/src/lib/task-queries.ts` (D-29), `apps/web/src/lib/task-queries.test.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-021, RF-023, CA-1.9, CA-1.12 (el aviso), CA-2.6, CA-3.13, D-29 (hallazgo de T-031)
  - Casos (test primero):
    - `003 RF-021 D-29` en `task-queries.test`: con `GET /api/tasks` pendiente, `mutateAsync` de un movimiento fallido ya ha rechazado;
    - `003 CA-1.12 RF-021` E2E con `page.route` abortando `**/api/**`: al soltar con ratón, en menos de 1 s, la tarjeta en su sitio, los recuentos de antes y el aviso;
    - `003 CA-3.13 RF-023` E2E a 375 con la API caída: en menos de 1 s, se ve To do, el foco está en el asa y sale el aviso.
    - Los E2E, en `chromium` y `webkit`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `003 D-12` y `003 RF-021 D-18` siguen en verde sin cambiarlos

- [x] **T-039** Mantener el tablero si falla volver a pedir la lista
  - Depende de: T-038
  - Ficheros: `apps/web/src/components/PrivateArea.tsx` (D-30), `apps/web/src/components/PrivateArea.test.tsx`, `e2e/drag-and-drop.spec.ts`, `specs/002-tablero-de-tareas/spec.md` (solo el Registro de cambios)
  - Cubre: RF-025, E-22, CA-1.12 (el tablero), D-30 (hallazgo de T-031)
  - Casos (test primero):
    - `003 RF-025 E-22` en `PrivateArea.test`: con el tablero cargado, falla el refresco de `tasks` (500, sin reintentos): sigue el tablero, sin el error de carga;
    - lo mismo si falla el refresco de `me`, y la cabecera sigue con el email;
    - `003 CA-1.12 RF-025` E2E con `page.route` abortando `**/api/**`: pasados los reintentos (unos 7 s), el tablero y el aviso de mover siguen a la vista y no aparece «Reintentar», en `chromium` y `webkit`.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; los tests de la 002 (CA-1.6, RF-008 y D-8) siguen en verde **sin cambiarlos**: si alguno cuenta con el comportamiento actual, **parar y avisar**; el Registro de cambios de la 002 tiene una fila «Modificada por la spec 003»: RF-025 acota RF-008 y CA-1.6 a cuando no hay tablero que enseñar (`git diff` solo en esa tabla)

- [x] **T-032** Dar estados de hover y press al asa
  - Depende de: T-039
  - Ficheros: `apps/web/src/components/TaskCard.tsx` (D-27), `TaskCard.test.tsx`, `apps/web/src/styles/tokens.test.ts`
  - Cubre: RNF-005, RNF-001, C-26, D-27 (verificación M-3)
  - Casos (test primero):
    - `003 RNF-005 D-27`: el asa lleva `transition`, `hover:bg-raised-hover` y `motion-safe:active:scale-94`;
    - `003 RNF-001 D-27`: el icono (`--text-2`) sobre `--surface-raised-hover` ≥ 3:1 en N, SB y C+, claro y oscuro.
  - Hecho cuando: los casos fallan primero; después, `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` en verde sin cambiarlo. Si la pareja no llega a 3:1, **parar y avisar**

- [x] **T-033** [P] Mover `STATUS_NAMES` a `lib` y quitar la idea duplicada del roadmap
  - Ficheros: `apps/web/src/lib/task-messages.ts`, `apps/web/src/components/BoardColumn.tsx`, `Board.tsx`, `TaskDialog.tsx`, `specs/roadmap.md` (líneas 77 y 79, «Animar…»: queda una, con los dos orígenes)
  - Cubre: D-28 (verificación M-8). Sin cambio de comportamiento
  - Hecho cuando: `lib/task-messages.ts` no importa nada de `components/`; `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde

- [x] **T-034** Cubrir con E2E lo que solo se probaba con teclado o sin test
  - Depende de: T-032
  - Ficheros: `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-019, RNF-001, CA-1.4, CA-1.5, CA-1.10, CA-2.6 (verificación M-7)
  - Casos, en los tres proyectos:
    - `003 RF-019` con ratón a 375: reordena la columna visible, y soltar sobre el selector no guarda;
    - `003 RNF-001` axe sin infracciones en pleno arrastre con puntero, con la capa y el hueco a la vista, en claro y oscuro;
    - `003 CA-1.4 RF-003` arrastrar con ratón una retrasada a Done: sin «Retrasada» y con la fecha de hoy, sin abrir el detalle;
    - `003 CA-1.5 RF-004` arrastrar con ratón de Done a To do: sin fecha real de fin;
    - `003 CA-1.10 RF-022` con la tarea borrada de verdad, arrastrar con ratón: «Esta tarea ya no existe.» y la tarjeta desaparece;
    - `003 CA-2.6 RF-021` con `page.route` abortando `…/move`, reordenar con ratón: vuelve al orden de antes, con el aviso.
  - Hecho cuando: los casos pasan. Si alguno falla, es un fallo real: se anota y se **avisa** antes de corregir

- [x] **T-035** Intentar reproducir el fallo de CA-2.5 en `webkit`
  - Depende de: T-034
  - Ficheros: `e2e/drag-and-drop.spec.ts` solo si se encuentra la causa
  - Cubre: CA-2.5, RNF-004 (verificación M-7; nota de T-024)
  - Pasos: `pnpm test:e2e e2e/drag-and-drop.spec.ts --project=webkit -g "003 CA-2.5" --repeat-each=100 --retries=0`, y el fichero completo en `webkit` 5 veces, para ver si solo falla con carga.
  - Hecho cuando: el resultado se anota en el Registro. Si se reproduce, se busca la causa y se **avisa** antes de cambiar nada en `apps/web`. Si no, queda anotado como no reproducido, con el número de repeticiones

- [x] **T-036** Comprobar la trazabilidad de los IDs nuevos y la suite completa
  - Depende de: T-026 a T-035, T-038 y T-039
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, C-19, RF-024, RF-025, CA-1.11, CA-1.12, CA-3.11, CA-3.12, CA-3.13, CA-4.6, E-21, E-22
  - Hecho cuando: hay un test cuyo título empieza por `003 ` para cada ID nuevo, con el criterio de T-024 (88 IDs en total, sin contar E-19); `pnpm test`, `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` en verde en los tres proyectos; el Registro tiene el recuento

## Fase 7 · Correcciones de la segunda verificación

Resuelven `verificacion.md` (segunda, APTO CON OBSERVACIONES), con las decisiones del usuario del 2026-11-01: I-1, I-2, el anillo de foco de M-1 y lo que M-5 dice de `plan.md`. La spec no cambia: RF-005, RF-011 y RNF-001 ya piden este comportamiento. *Desde la tercera verificación (NO APTO), con la spec v4.0:* T-044 y T-045 entran aquí, porque corrigen el mismo código de arrastre; T-037 pasa al final de la fase 8. Van en orden, porque comparten `e2e/drag-and-drop.spec.ts` y `plan.md`. Cada una termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde. Los fallos de `/signup` sin hidratar (M-7 de la 004) se anotan aparte y no cuentan como fallos de estas tareas.

- [x] **T-040** No guardar si se suelta en el margen del tablero
  - Ficheros: `apps/web/src/lib/task-move.ts` (`collisionDetection`, `inVisibleColumn`), `apps/web/src/components/Board.tsx` (solo si hace falta un atributo para localizar el contenedor con scroll), `e2e/drag-and-drop.spec.ts`, `specs/003-arrastrar-y-soltar/plan.md` (**D-31**)
  - Cubre: RF-005, CA-1.7, E-5, E-21, D-9, D-25 (verificación I-1)
  - Pasos:
    - una sola comprobación para los dos sitios: el punto tiene que caer en el rectángulo de la columna **recortado con el del tablero visible**;
    - fuera de ese recorte, `collisionDetection` no devuelve ningún destino, así que la vista previa vuelve al origen antes de soltar (D-9), y no solo deja de guardarse;
    - la decisión va al plan como `D-31 (añadida en T-040)`.
  - Casos (E2E primero, porque jsdom no calcula posiciones), en `chromium` y `webkit`:
    - `003 CA-1.7 RF-005 D-31` a 768 y 1024, soltar en el margen derecho con el tablero aún recortado, sin esperar y a los 100 ms: ninguna petición a `…/move`, la tarjeta en su sitio y sin aviso;
    - `003 RF-005 D-31` lo mismo en el margen izquierdo, con el tablero ya desplazado;
    - `003 RF-005 D-31` con el puntero en el margen, la vista previa vuelve al origen;
    - `003 E-5 D-31` con el puntero en el margen, el tablero sigue haciendo scroll solo;
    - `003 RF-001 D-31` soltar en la parte visible de una columna recortada, dentro del tablero: se guarda en esa columna.
  - Hecho cuando:
    - el primer caso falla primero (la verificación midió que, a 768 sin esperar, guarda en `chromium` y `webkit`), y se anota en el Registro;
    - después pasan todos, también con `--repeat-each=5 --retries=0`;
    - `003 CA-1.7`, `003 CA-4.5`, `003 RF-019`, `003 E-5` y `003 E-21` siguen en verde sin cambiarlos.

- [x] **T-041** Volver a medir las tarjetas al cambiar la vista previa
  - Depende de: T-040
  - Ficheros: `apps/web/src/components/Board.tsx` (un componente pequeño dentro de `DndContext`), `apps/web/src/lib/task-move.ts` (comentario de `MEASURING`), `e2e/helpers.ts` (comentario de `dragCard`), `e2e/drag-and-drop.spec.ts`, `specs/003-arrastrar-y-soltar/plan.md` (D-9)
  - Cubre: RF-007, RF-011, CA-2.5, RNF-002, RNF-004, E-4, D-9, D-21, D-32 (verificación I-2)
  - *Acotada en la spec v4.0:* solo la nueva medida (D-32). La oscilación y su test pasan a T-044, y `pnpm test:e2e` en verde, a T-049. `RemeasureOnPreview` ya está en `64f500f` y D-9 y D-32 ya están en el plan.
  - Pasos:
    - `measureDroppableContainers` sale de `useDndContext`, que solo funciona dentro de `DndContext`, y `useTaskMove` está por encima. Por eso hace falta un componente pequeño dentro del contexto, que lo llame en un efecto de layout cuando cambie `drag.current` con el puntero. Sin ids vuelve a medir todas; si RNF-002 lo pide, solo las de las columnas afectadas;
    - sin romper el `memo` de D-21: ese componente no pinta nada y no pasa nada a las tarjetas;
    - decidir si `MeasuringStrategy.Always` sigue haciendo falta, y anotarlo en D-32;
    - corregir los comentarios que repiten la idea antigua: `task-move.ts:78` y `e2e/helpers.ts:182`.
  - Casos:
    - **Antes de cambiar nada**, sin un caso que falle siempre: `pnpm test:e2e e2e/drag-and-drop.spec.ts --project=webkit -g "003 CA-2.5" --repeat-each=200 --retries=0`, con el número de fallos reales en el Registro (la verificación midió 3 de 100). Ya medido: 5 fallos reales de 200;
    - `003 RNF-002 D-9` en `chromium`, reordenar dentro de la columna de 200 tarjetas: ≤ 100 ms desde que se suelta. El test actual saca la tarjeta de esa columna.
  - Hecho cuando:
    - `-g "003 CA-2.5"` en `webkit`, con `--repeat-each=300 --retries=0`, da **0 fallos reales**. Si no, **parar y avisar**. Ya medido: 0 de 300, anotado en el Registro;
    - RNF-002, los dos tests, ≤ 100 ms en tres ejecuciones seguidas en `chromium`, con los tiempos en el Registro (antes de esta tarea, 38,5 / 40,7 / 39 ms);
    - se anota lo que tarda un cambio de vista previa con 200 tarjetas: la spec no pone límite, pero si pasa de 100 ms, **avisar**;
    - `003 E-4` y `003 E-5` siguen en verde;
    - `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde. `003 RF-007 D-9` sigue en rojo hasta T-044.

- [x] **T-044** Corregir la oscilación: la tarjeta cambia de sitio solo al cruzar el centro de la de debajo
  - Depende de: T-041
  - Ficheros: `apps/web/src/lib/board-order.ts` (`placementFromOver`), `board-order.test.ts`, `apps/web/src/lib/task-move.ts` (`onDragOver`, `onDragMove`), `e2e/drag-and-drop.spec.ts`, `e2e/helpers.ts` (solo si hace falta para arrastrar hacia abajo)
  - Cubre: RF-007, RF-011, CA-1.1, CA-2.1, CA-2.5, CA-4.3, RNF-002, RNF-004, D-9, D-20 (verificación B-1). D-9 y D-20 ya recogen la regla en el plan
  - Pasos:
    - en la misma columna, `placementFromOver` usa `below`: la tarjeta cruza a la de debajo solo si su centro ha pasado el de esa tarjeta; si no, queda a su lado, en el lado que marque ese centro. Su contrato no cambia;
    - `onDragOver` y `onDragMove` usan esa misma regla;
    - corregir los comentarios que dicen «como arrayMove» o «no oscila».
  - Casos (unitarios primero):
    - `003 D-9 RF-007` en `board-order.test.ts`, que hoy dice «como arrayMove»: hacia arriba y hacia abajo, con el centro cruzado y sin cruzar; encima de sí misma, no cambia;
    - `003 D-9 RF-007` salto de varias tarjetas: el `over` a tres posiciones y sin cruzar su centro, queda al lado de esa tarjeta;
    - `003 RF-007 D-9`, el E2E que ya existe, **sin cambiarlo**: pasa de rojo a verde en `chromium` y `webkit`;
    - `003 RF-007 D-9` nuevo: el puntero salta varias tarjetas y se queda quieto, y el hueco queda al lado de la tarjeta de debajo, en `chromium` y `webkit`;
    - `003 RF-007 D-9` nuevo: hacia abajo, tocar la siguiente sin llegar a su centro no cambia el orden, y cruzarlo, sí.
  - Hecho cuando:
    - `003 RF-007 D-9` pasa también con `--repeat-each=5 --retries=0`. **Si sigue oscilando, parar y avisar**;
    - `003 CA-1.1`, `003 CA-2.1`, `003 CA-4.3` y `003 E-4` en verde, y `-g "003 CA-2.5"` en `webkit`, con `--repeat-each=200 --retries=0`, da 0 fallos reales;
    - RNF-002, los dos tests, ≤ 100 ms en tres ejecuciones seguidas en `chromium`, con los tiempos en el Registro;
    - cada E2E que haya que ajustar porque arrastre hacia abajo se anota en el Registro con el motivo.

- [x] **T-045** Con el dedo, no guardar si se suelta fuera justo tras cambiar de columna
  - Depende de: T-044 (mismos ficheros)
  - Ficheros: `apps/web/src/lib/task-move.ts`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-005, E-21, D-25, D-33 (verificación I-1). D-33 ya está en el plan; si la solución cambia, se corrige allí
  - Casos (E2E primero, porque jsdom no calcula posiciones), en `chromium` y `webkit`, con 1280 px y `hasTouch`:
    - `003 E-21 RF-005 D-33` llevar la tarjeta de To do a In progress con el dedo, esperar a que se pinte allí, y hacer el último `touchmove` y el `touchend` a la vez sobre el título: ninguna petición a `…/move`, la tarjeta en su sitio y sin aviso;
    - `003 CA-4.1 D-33` soltar con el dedo dentro de In progress tras cambiar de columna: sí se guarda.
  - Hecho cuando:
    - el primer caso falla primero (la verificación midió 12 de 12 guardados), y se anota en el Registro;
    - después pasan los dos, también con `--repeat-each=5 --retries=0`;
    - `003 E-21`, `003 CA-4.3` y `003 CA-4.5` siguen en verde sin cambiarlos.

- [x] **T-042** Dar sitio al anillo de foco del asa de 768 a 1023 px
  - Depende de: T-045
  - Ficheros: `apps/web/src/components/TaskCard.tsx` y `BoardColumn.tsx` (el que haga falta), `TaskCard.test.tsx`, `e2e/drag-and-drop.spec.ts`, `specs/003-arrastrar-y-soltar/plan.md` (D-11, si cambia lo que dice del asa)
  - Cubre: RNF-001, C-20, CA-3.1, CA-3.11, D-11 (verificación M-1, solo el anillo)
  - Pasos: el anillo necesita 4 px alrededor del asa (`outline` 2 + `offset` 2). Se le da sitio llevando el asa hacia dentro, como ya hace desde 1024 px, ajustando el relleno del botón de abrir para que no tape el título, o con más relleno en la lista. La opción elegida y el motivo van al Registro. Solo valores del catálogo, sin `style=` (ADR-0003).
  - Casos (E2E primero), en `chromium` y `webkit`:
    - `003 RNF-001 C-20` a 768 y 1023, con la tarjeta cogida con teclado, primera y última de la columna: al menos 4 px desde el asa hasta cada borde de la lista (la verificación midió 2,04 a la derecha);
    - `003 CA-3.11 RNF-001` a 768, con 12 tarjetas: lo mismo en cada Flecha abajo hasta el final y Flecha arriba hasta el principio, porque `scrollIntoView` deja la tarjeta pegada al borde de la lista (D-23);
    - `003 RNF-001` el asa sigue midiendo 44 × 44 a 768 y 1023;
    - `003 E-6 RNF-001` con un título de 200 caracteres, el asa no tapa el texto a 768.
  - Hecho cuando:
    - el primer caso falla primero; después pasan todos;
    - en una captura a 768, en claro y en oscuro, el anillo se ve entero, anotado en el Registro;
    - `design-rules.test.ts` en verde sin cambiarlo;
    - `pnpm test:e2e e2e/drag-and-drop.spec.ts e2e/design-system.spec.ts` en verde en `chromium` y `webkit`;
    - si dar sitio al anillo cambia algo desde 1024 px, **parar y avisar**.
  - Fuera de esta tarea: la sombra recortada de la tarjeta cogida, la otra parte de M-1.

- [x] **T-043** Limpiar `plan.md`, §4.4 y §4.5
  - Depende de: T-042 (mismo fichero)
  - Ficheros: `specs/003-arrastrar-y-soltar/plan.md`
  - Cubre: C-26 (verificación M-5, solo `plan.md`). Sin cambio de comportamiento
  - Pasos:
    - §4.4: añadir la fila de `apps/web/src/components/PrivateArea.tsx`: tablero si hay datos (D-30) y `scroll-padding` de `main` (D-23), «Modificado»;
    - §4.5, «Asa»: el icono de 16 px se apoya en `DESIGN.md` §11.3, no en §9, que pide el 40 % del diámetro en los botones de icono (17,6 y 12,8 px).
  - Hecho cuando: `git diff` de esta tarea solo cambia esas dos partes; `pnpm lint` en verde.

## Fase 8 · Spec v4.0: ordenar sin arrastrar y soltar sobre «Crear tarea»

Resuelven `verificacion.md` (tercera, NO APTO), con las decisiones del usuario del 2026-11-01: I-2 (WCAG 2.5.7) y M-4. Cada una termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde.

- [x] **T-046** Probar que soltar sobre «Crear tarea» guarda si la columna está debajo
  - Depende de: T-043
  - Ficheros: `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-019, CA-4.5, CA-4.7, D-35 (verificación M-4). Sin cambio de código: la verificación lo midió con ratón y 12 tarjetas
  - Casos, en los tres proyectos, a 375 px, con ratón y con el dedo:
    - `003 CA-4.7 RF-019` con 12 tarjetas, soltar sobre «Crear tarea»: una petición a `…/move`, la tarjeta en el sitio del hueco justo antes de soltar y sin diálogo de crear abierto;
    - `003 CA-4.7 RF-019` con 3 tarjetas, donde la columna termina antes del botón: ninguna petición, la tarjeta en su sitio y sin aviso ni diálogo.
  - Hecho cuando: pasan los dos, con ratón y con el dedo. **Si alguno falla, parar y avisar**: el dedo y la columna corta no se han medido, y sería un cambio de código.

- [x] **T-047** Añadir «Subir» y «Bajar» al detalle de la tarea
  - Depende de: T-046
  - Ficheros: `apps/web/src/components/TaskDialog.tsx`, `TaskDialog.test.tsx`, `Button.tsx`, `Button.test.tsx`, `Board.tsx`, `Board.test.tsx` (solo si hace falta), `apps/web/src/lib/task-messages.ts`, `task-messages.test.ts`
  - Cubre: RF-026, RF-027, RF-028, RF-029, CA-5.1, CA-5.2, CA-5.4 a CA-5.11, E-23, E-24, D-34
  - Pasos (tests primero):
    - `Button` gana `inactive`, a opacidad .45, sin `disabled`, para que conserve el foco (D-34);
    - `Board` pasa `tasks` a `TaskDialog`;
    - el bloque va en la carpeta Datos, debajo del estado, solo al editar: el texto con `movedText`, en un `<p aria-live="polite">`, y los dos botones glass;
    - `MOVE_NEEDS_SAVE` en `task-messages.ts`, con el texto exacto de RF-028.
  - Casos, en `TaskDialog.test.tsx` con la ruta `POST /api/tasks/<id>/move`:
    - `003 CA-5.1 RF-026` posición, botones y que al crear no aparecen;
    - `003 CA-5.2 RF-027` «Subir» manda `index` 0 y el texto cambia, sin cerrar el diálogo, y `003 RF-027` con otra pulsación durante el guardado no se manda otra petición;
    - `003 CA-5.4 RF-026` con Enter y con Espacio, el foco sigue en el botón y cambia la región viva;
    - `003 CA-5.5 RF-028` en los bordes: `aria-disabled`, ninguna petición y el foco se conserva al llegar al borde;
    - `003 CA-5.6 RF-027` conserva el título escrito, «Cancelar» pregunta y, al descartar, la posición se queda;
    - `003 CA-5.7 RF-027` sin otros cambios, «Cancelar» cierra sin preguntar;
    - `003 CA-5.8 RF-028` con el estado cambiado, botones inactivos y el texto, y al volver al estado se activan;
    - `003 CA-5.9 RF-029` con `NetworkError` y con 500: vuelve el texto de antes, aviso en la alerta del diálogo, y sigue abierto;
    - `003 CA-5.10 RF-029` con `TASK_NOT_FOUND`: `onClose` con `notFound`;
    - `003 CA-5.11 RF-027` guardar sin cambiar el estado conserva la posición: en `tasks.update.test.ts` ya está cubierto en la API, aquí que el `PUT` no lleva posición;
    - `003 E-23 RF-028` única de su columna, y `003 E-24` el `index` sale de la lista recibida.
  - Hecho cuando: los casos pasan; los tests de `TaskDialog` de la 002 siguen en verde, solo pasando `tasks` al montarlo; `design-rules.test.ts` en verde sin cambiarlo.

- [x] **T-048** Probar «Subir» y «Bajar» de punta a punta y actualizar `DESIGN.md`
  - Depende de: T-047
  - Ficheros: `e2e/drag-and-drop.spec.ts`, `DESIGN.md`
  - Cubre: RF-026 a RF-029, CA-5.2, CA-5.3, CA-5.4, CA-5.9, CA-5.10, RNF-001, RNF-004, C-26
  - Casos, en los tres proyectos:
    - `003 CA-5.2 RF-027` con clic, cerrar y volver a cargar: el orden se mantiene;
    - `003 CA-5.3 RF-027` con toque a 375 px, en el panel inferior;
    - `003 CA-5.4 RF-026` solo con teclado: foco y anuncio;
    - `003 CA-5.9 RF-029` con `page.route` abortando `…/move`;
    - `003 CA-5.10 RF-029` con la tarea borrada de verdad: el foco en «Crear tarea»;
    - `003 RNF-001` axe con el detalle abierto, con un botón inactivo y el texto de RF-028, en claro y oscuro, y «Subir» y «Bajar» de 44 px de alto a 375 y 1280.
  - Pasos: `DESIGN.md` §11.4 y el historial, a `1.5.0-todo.1` (plan §4.6).
  - Hecho cuando: los casos pasan; en una captura a 1280 y otra a 375, en claro y en oscuro, el bloque se ve como dice §11.4, anotado en el Registro.

- [x] **T-049** Comprobar la trazabilidad de los IDs nuevos y la suite completa
  - Depende de: T-041 a T-048
  - Ficheros: tests existentes (solo si falta alguno)
  - Cubre: C-17, C-19, RF-026 a RF-029, CA-4.7, CA-5.1 a CA-5.11, E-23, E-24
  - Hecho cuando: hay un test cuyo título empieza por `003 ` para cada ID, con el criterio de T-024 (106 IDs, sin contar E-19); `pnpm test`, `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` en verde en los tres proyectos, con los «flaky» identificados; el Registro tiene el recuento.

## Fase 9 · Spec v5.0: correcciones de la cuarta verificación

Resuelven `verificacion.md` (cuarta, APTO CON OBSERVACIONES), con las decisiones del usuario del 2026-11-01: I-1, I-2, M-2 y M-4 a M-7. M-1 queda como riesgo aceptado (plan §8) y M-3 sigue sin tarea. Cada una termina con `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde.

- [x] **T-050** Avisar en el tablero si «Subir» o «Bajar» falla con el diálogo ya cerrado
  - Depende de: T-049
  - Ficheros: `apps/web/src/components/TaskDialog.tsx`, `TaskDialog.test.tsx`, `Board.tsx`, `Board.test.tsx`, `apps/web/src/lib/task-queries.ts`, `task-queries.test.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-021, RF-022, RF-029, CA-5.13, CA-5.14, E-9, E-25, E-26, D-36 (verificación I-1)
  - Pasos (tests primero; se anota en el Registro cómo fallan):
    - `moveWithinColumn` pasa a `mutateAsync` con `.catch`, sin cambiar lo que pasa con el diálogo abierto;
    - prop `onMoveFailedAfterClose` y, en `Board`, el aviso y el foco de D-36;
    - el `ref` de `confirmDelete` y `onError` de `useMoveTask` sin recolocar una tarea que ya no está en la lista.
  - Casos, retener la respuesta de `…/move` con `page.route` hasta que el diálogo esté cerrado, en los tres proyectos:
    - `003 CA-5.13 RF-029` «Subir», «Cancelar» y red abortada: el orden de antes, el aviso de CA-1.9 en el tablero y el foco sigue en la tarjeta;
    - `003 CA-5.14 RF-029` «Subir», «Cancelar» y la tarea borrada de verdad: «Esta tarea ya no existe.», sin tarjeta y el foco en «Crear tarea»; también con la última tarea, en el «Crear tarea» del estado vacío;
    - `003 CA-5.14 RF-029` con el foco ya en otra tarjeta: no se mueve;
    - `003 E-25 RF-029` con otro detalle abierto al llegar el fallo: el foco sigue en él y, al cerrarlo, el aviso está en el tablero;
    - `003 E-26 RF-029` «Subir» y «Borrar tarea», con 404 y con la red abortada: sin aviso y sin la tarjeta;
    - `003 E-8 RF-029` con 401 y el diálogo cerrado: redirige, sin aviso (unitario).
  - Hecho cuando: los casos pasan; `003 CA-5.9`, `003 CA-5.10` y los demás tests de `TaskDialog` siguen en verde sin cambiarlos, salvo pasar la prop nueva al montarlo.

- [x] **T-051** Dejar inactivos «Subir» y «Bajar» mientras se guarda la tarea
  - Depende de: T-050
  - Ficheros: `apps/web/src/components/TaskDialog.tsx`, `TaskDialog.test.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-028, CA-5.12, D-37, 002/RF-013, 002/RF-028 (verificación I-2)
  - Casos (tests primero), con el `PUT` retenido:
    - `003 CA-5.12 RF-028` en `TaskDialog.test.tsx`, durante «Guardando…»: los dos botones con `aria-disabled`, y pulsarlos no manda ninguna petición a `…/move`;
    - `003 CA-5.12 RF-028` en `TaskDialog.test.tsx`, con 500: sale el error de guardar y los botones se activan de nuevo;
    - `003 CA-5.12 RF-028` E2E en `chromium` y `webkit`, pulsando «Subir» durante «Guardando…»: si el `PUT` va bien, el diálogo se cierra; si falla, sale «No hemos podido guardar la tarea…», como en las sondas de la verificación.
  - Hecho cuando: los casos pasan, y el texto de RF-028 no sale durante el guardado si el estado no ha cambiado.

- [x] **T-052** Dejar el foco en «Subir» o «Bajar» tras el clic
  - Depende de: T-051
  - Ficheros: `apps/web/src/components/TaskDialog.tsx`, `e2e/drag-and-drop.spec.ts`
  - Cubre: RF-027, RF-028, D-38 (verificación M-2)
  - Casos (E2E primero; en `webkit` tiene que fallar antes del cambio), en `chromium` y `webkit`:
    - `003 RF-027 D-38` clic en «Bajar»: el foco en el botón y Tab va al campo siguiente, no al primero del formulario;
    - `003 RF-028 D-38` clic en el botón hasta llegar al borde y otro clic ya inactivo: el foco sigue en él.
  - Hecho cuando: los casos pasan; `003 CA-5.4` sigue en verde; se recupera el `toBeFocused` que T-048 quitó de CA-5.9 por este motivo.

- [x] **T-053** Limpiar los restos de M-4 a M-7 y comprobar la trazabilidad y la suite completa
  - Depende de: T-052
  - Ficheros: `apps/web/src/lib/task-move.ts`, `apps/web/src/components/Board.tsx`, `specs/roadmap.md`, `specs/003-arrastrar-y-soltar/tasks.md`, tests existentes (solo si falta alguno)
  - Cubre: C-17, C-19, C-24, verificación M-4 a M-7, CA-5.12 a CA-5.14, E-25, E-26
  - Pasos, sin cambio de comportamiento:
    - **M-4 y M-5:** ya están en el plan §8, desde `/sdd-cambiar-spec`. Sin código: M-5 es deuda de la 004 (C-21);
    - **M-6:** comentario de [task-move.ts:148](../../apps/web/src/lib/task-move.ts#L148) («espera a volver a pedir la lista», y desde D-29 ya no espera) y de [Board.tsx:28](../../apps/web/src/components/Board.tsx#L28) (de D-9 a D-32); historial y `actualizado` de `specs/roadmap.md`, con las v2.0 a v5.0 y las verificaciones. El `measuring` del plan §4.3 y el hash de T-049 ya están corregidos;
    - **M-7:** solo se deja constancia en el Registro de que `9702bc2` junta cinco tareas: arreglarlo exigiría reescribir el historial, que `CLAUDE.md` prohíbe.
  - Hecho cuando: hay un test cuyo título empieza por `003 ` para cada ID, con el criterio de T-024 (111 IDs, sin contar E-19); `pnpm test`, `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` en verde en los tres proyectos, con los «flaky» identificados; el Registro tiene el recuento.

- [x] **T-037** Volver a ejecutar `/sdd-verificar` (quinta verificación)
  - Depende de: T-036, T-040 a T-049 y T-050 a T-053. **Es la última tarea**
  - Ficheros: `specs/003-arrastrar-y-soltar/verificacion.md`
  - Cubre: todos (spec v5.0)
  - Hecho cuando: el informe está escrito, en una sesión nueva si es posible; si sale APTO, la spec pasa a `implementada` con la confirmación del usuario

## Registro

| Tarea | Commit | Notas |
|-------|--------|-------|
| —     |        | 2026-10-31, revisión de las tareas con el usuario. Se confirman: (1) el prefijo `003 ` en los nombres de los tests, porque los IDs se repiten en las specs 001, 002 y 004; (2) la migración `task_position` y `createTask` en la misma tarea (T-002), porque la migración quita el valor por defecto de `position`; (3) `DndContext` se monta en T-015, para cumplir a la vez plan §8 (React 19) y D-15 (teclado primero); (4) E-19 se comprueba a mano (plan §6) y es la única excepción del `grep` de T-024 |
| T-003 |        | Fila «Modificada por la spec 003» en el Registro de cambios de la 002, con versión «—» porque el texto de la 002 no cambia (ni su `version`). `git diff` solo en esa tabla |
| T-004 |        | Test primero: los 18 casos nuevos fallaban con `TypeError: Cannot read properties of undefined` (no existían `moveTaskInputSchema` ni `actualEndDateAfterMove`). `index` como `'0'` (texto) también se rechaza. `index.ts` no cambia: ya reexporta `./tasks`. 773 tests en verde |
| T-005 | | E2E en `e2e/drag-and-drop.spec.ts` (13 tests). Nombres que el plan no fijaba: la capa se localiza como `[inert]` con el título (D-10), el hueco como la tarjeta de la columna de destino con el título oculto (`invisible`, D-10) y la región viva como `[aria-live="assertive"]` (D-7); ayudas nuevas en `helpers.ts`: `moveHandle`, `dragCard` (coge por el centro y por defecto suelta en el cuarto superior del destino), `pointIn` y `tabKey` (sacado de `tabTo`, sin cambio de comportamiento). D-15 se salta en `chrome` con `channel === 'chrome'`. En rojo en `chromium`: 12 fallan porque no existen el asa (`Mover «…»`), la capa `[inert]` ni el arrastre; **E-18 pasa ya en rojo** (comprueba que nada llega a las tarjetas, y aún no hay nada que arrastrar). Los otros tres ficheros, en verde en los tres proyectos (180 + 2 skipped); `board.spec.ts` «axe (dark)» en `webkit` falló una vez porque la isla de `/signup` no se hidrató (deuda M-7 de la 004, `retries: 1`) y pasó 4 de 4 al repetirlo. Hubo que parar el `pnpm dev` del usuario: Playwright no lo reutiliza |
| T-006 | | 14 tests más en `e2e/drag-and-drop.spec.ts` (27 en total); ayudas `touchFinger`, `touchDragCard`, `touchSwipe` y `TOUCH_HOLD_MS` (400 ms, por encima de los 250 de D-6) en `helpers.ts`. **R-6:** en WebKit, `new Touch` da «Illegal constructor» → con el usuario se decide `document.createTouch` + `createTouchList` (plan **D-17**, nota en `research.md` R-6). Hallazgos: a 375 px el scroll es de `main`, no de la ventana (CA-4.2 mira `main.scrollTop`); los tests que esperaban a un elemento sin `expect` previo agotaban el tiempo (RNF-002 se quedaba 4 min), así que todos comprueban antes que la capa existe y RNF-002 da `Infinity` a los 2 s. En rojo, en los tres proyectos: fallan porque no existen el asa, la capa ni el arrastre; **pasan ya en rojo** CA-4.2 (el dedo hace scroll: confirma que CDP sirve) y CA-4.4 (el toque de la 002). CA-4.2 se salta en `webkit` y RNF-002, E-4 y E-5 solo corren en `chromium`. `pnpm test` (773), `pnpm lint` y `pnpm typecheck` en verde |
| T-010 | | `apps/web/src/lib/board-order.ts` con lo de plan §4.3 y, además, los tipos exportados `Over` (el destino de `placementFromOver`) y `MoveKey`. Test primero: el fichero de test fallaba al no resolver `./board-order`; 17 casos. `placeTask` también pone `status = to.status` (la tarea queda en `to` aunque llegue con el estado viejo). `placementFromOver` lanza un error si la tarjeta de debajo no está en `groups` (no debería pasar: los droppables son las tarjetas pintadas). `Board.tsx` solo importa `groupByStatus`. `pnpm test` (790), `pnpm lint` y `pnpm typecheck` en verde; los tests de `Board` de la 002 siguen en verde |
| T-011 | | `moveErrorText`, `pickedText`, `movedText`, `droppedText` y `cancelledText` en `task-messages.ts`, con un ayudante interno `where` («<columna>, posición <n> de <total>»). Los nombres de columna salen de `STATUS_NAMES`, que vive en `components/BoardColumn.tsx`: `task-messages.ts` lo importa de ahí (no se ha movido para no tocar ficheros fuera de la tarea). Test primero: 9 casos fallaban con `moveErrorText is not a function`. `pnpm test` (799), `pnpm lint` y `pnpm typecheck` en verde |
| T-001 | | `@dnd-kit/core` 6.3.1 fijada sin `^`; trae `@dnd-kit/utilities` 3.2.2 y `@dnd-kit/accessibility` 3.1.1. `pnpm install` no avisa de `peerDependencies` con React 19.3.1. No entra `sortable` ni `react`. `pnpm test` (799), `pnpm lint` y `pnpm typecheck` en verde |
| T-002 | | Migración `20261101112910_task_position`, creada con `--create-only` y completada con el relleno de plan §4.2 antes de aplicarla; `git diff` vacío en la de la 002. **E-19 (manual):** en desarrollo hay 1 tarea (`querol1993@gmail.com`, To do): huella del orden `0dfaf51e…` antes y después, igual, pero con una sola tarea no prueba nada. Por eso también se probó en una base temporal `todo_e19` (ya borrada) con 30 tareas de 2 usuarios en 4 estados y `createdAt` repetidos: el orden por `createdAt desc, id desc` antes es idéntico al de `position, createdAt desc, id desc` después, con posiciones 0…n-1 sin repetir en cada columna. Prisma 7 no regenera el cliente con `migrate dev`: hay que ejecutar `pnpm --filter @todo/api exec prisma generate` (el `postinstall` lo hace al instalar). Test primero: los 3 casos fallaban con `Unknown argument position`. Además del caso de la tarea se añade «creaciones a la vez no repiten posición» (`lockUser`, D-2). `pnpm test` (802), `pnpm lint` y `pnpm typecheck` en verde; solo `repositories/` importa Prisma en el código de producción |
| T-007 | | D-16 en `tasks.list.test.ts` (CA-1.8 → `003 RF-008`; E-24 → `003 RF-008 D-1`; E-22 → `003 RF-010`) y casos nuevos en `tasks.update.test.ts`. Test primero: 4 fallaban por el orden (`003 RF-008`, `003 RF-010` ×2 y `003 CA-2.2`); `003 RF-008 D-1`, «sin cambio de estado» y «tarea ajena» ya pasaban porque describen lo que no cambia. `updateTask` valida la fecha antes de leer la tarea (el orden de errores de la 002 no cambia). Nota: `updateTask` de una tarea ajena solo hace la lectura de D-5, así que `makeRoom` no llega a tocar la columna de nadie. `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde |
| T-008 | | `placeTaskOfUser` (interna, dos usos: `toTop` y `moveTaskOfUser`, C-22) concentra transacción + `lockUser` + `makeRoom` + escritura. La fecha «entra nueva» es `status === done && current.status !== done`. Test primero: 5 casos fallaban con `moveTask is not a function`; además de los de la tarea, `003 RF-004` comprueba que salir de Done no mira `today`. `pnpm test` (811), `pnpm lint` y `pnpm typecheck` en verde; solo los repositories importan Prisma |
| T-009 | | Ruta `POST /api/tasks/:id/move` con `validateTaskId` antes de `validateBody` (mismo orden que el PUT). Test primero: 13 de 16 casos fallaban con 404 `NOT_FOUND` (ruta sin montar); los 3 que ya pasaban comprueban el 401, el 415 y el 404 de tarea ajena, que el `requireAuth`/`requireJson` general y un 404 genérico ya cumplían, salvo el `code`. Dos casos más que la lista: mover hacia abajo (`index` no cuenta la tarea) y dos `move` a la vez (`lockUser`). `pnpm test` (827), `pnpm lint` y `pnpm typecheck` en verde |
| T-012 | | `useMoveTask` como en D-12, con `MOVE_KEY` y `updateTasks` internos. Test primero: 8 casos fallaban (`useMutationHook is not a function`, el hook no existía). Aviso para T-016: el `onError` de `mutate()` solo se dispara para la última llamada; con dos movimientos a la vez (E-12) el aviso tiene que salir de la promesa de `mutateAsync`. `pnpm test` (835), `pnpm lint` y `pnpm typecheck` en verde |
| T-013 | | `--ring-drop` en `:root` (`--ink-500`) y en el bloque oscuro (`--ink-400`), con `--color-ring-drop` en `@theme` para poder escribir `inset-ring-ring-drop` en T-014 (como `ring-error`). Test primero: 5 casos fallaban porque el token no existía. `pnpm test` (839), `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` sin cambios |
| T-014 | | D-11 y D-10 en `TaskCard`. La variante `overlay` no lleva `data-task-id` ni `data-task-handle` (nombre que el plan no fijaba: así el foco de 002/D-14 y `taskCard()` solo encuentran la tarjeta real). `dragRef` y `dragListeners` se dejan para T-018, que es la tarea que los lista. Icono del asa de 16 px como dice D-11, aunque §9 pida el 40 % del diámetro. D-16: `TaskCard.test.tsx`, `titlesIn` de `Board.test.tsx` y `BoardColumn.test.tsx` cuentan los botones de abrir; `TaskDialog.test.tsx`, `e2e/board.spec.ts` no hizo falta cambiarlos (usan nombres exactos o `^título`) y en `e2e/helpers.ts` solo cambia un comentario. Test primero: 20 fallaban por no encontrar el asa. `pnpm test` (846), `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e e2e/board.spec.ts e2e/design-system.spec.ts`: 160 pasan y 2 saltados, en los tres proyectos |
| T-015 | | **D-15 superado:** los E2E de D-15 y CA-3.1 pasan en `chromium` y `webkit`, con el foco en el asa y sin cancelarse solo. Decisiones que el plan no fijaba: (1) dnd-kit monta su propia región viva `<div aria-live="assertive">`, vacía con `accessibility` vacía (D-6), así que la región del tablero se localiza como `p[aria-live="assertive"]`, también en el E2E; (2) `landing`: al soltar, la vista previa sigue hasta que `tasks` cambia, porque `onMutate` es asíncrono y TanStack notifica en un `setTimeout(0)`: sin esto la tarjeta volvería un instante a su sitio de antes (ver D-18 del plan); (3) `focusedHandle`: el asa que conserva el foco tras coger, también si la tarjeta vuelve atrás al fallar; se suelta cuando el foco sale de verdad. `today = todayLocal()` entra ya aquí porque la petición lo necesita (T-016 lo comprueba). Test primero: 17 fallaban por no existir la región viva ni el teclado. `pnpm test` (863), `pnpm lint` y `pnpm typecheck` en verde, con `DndContext` montado y los tests de la 002 en verde |
| T-016 | | `notice` pasa a `{ tone, text }` (`BoardNotice`, exportado desde `task-move.ts`). El aviso sale de la promesa de `mutateAsync`, porque el `onError` de `mutate` solo se dispara para la última llamada (E-12, test propio). Con 401 no hay aviso: redirige `withQueryClient` (E-8). **D-19 (añadida):** `networkMode: always`, porque TanStack pausa las mutaciones sin conexión y E-7 pide que la tarjeta vuelva; el test falla sin él. RF-016 también se comprueba al fallar: el foco sigue en el asa cuando la tarjeta vuelve atrás. Queda sin decidir cuándo se borra el aviso tras un movimiento correcto: el plan solo dice «se vacía al abrir otro diálogo» (002/D-20), va a «Ideas sin priorizar». Test primero: los casos fallaban por no haber aviso. `pnpm test` (874), `pnpm lint` y `pnpm typecheck` en verde |
| T-017 | | `onMobileColumn` en cada paso a otra columna y en `cancel` (también al salir el foco). Test primero: 2 de los 4 casos fallaban (los otros describen lo que no cambia). Los E2E de CA-3.9 y CA-3.10 pasan en `chromium` y `webkit`. `pnpm test` (878), `pnpm lint` y `pnpm typecheck` en verde |
| T-018 | | **Punto de riesgo de D-15 superado:** el E2E de CA-4.1 pasa en `chromium`, `chrome` y `webkit` (WebKit acepta los toques de `document.createTouch`, D-17). Los E2E de ratón de la tarea pasan en `chromium`. **Desviaciones:** (1) el «Hecho cuando» solo se cumple junto con T-019: sin `DragOverlay`, dnd-kit mide la colisión con la tarjeta real, que cambia de sitio al pasar de columna; (2) **D-20 (añadida):** `onDragMove`, porque `onDragOver` no se repite si no cambia la tarjeta de debajo y la tarjeta se quedaba segunda; (3) ajustes en mis E2E: CA-1.7 y CA-2.5 comprueban la vista previa en la lista y no la capa, y CA-2.5 sale a otra columna y vuelve; E-17 espera a la cancelación antes de soltar (era una carrera con el evento `resize`). `columnDropId` y `columnDropStatus` van en `board-order.ts` para no crear un ciclo de imports con `BoardColumn`. `pnpm test` (880), `pnpm lint` y `pnpm typecheck` en verde |
| T-019 | | `DragOverlay` con `dropAnimation={null}` dentro del contenedor `pointer-events-none fixed inset-0 z-(--z-popover)`, y la tarjeta arrastrada con `variant="placeholder"`. Hecho junto con T-018 (mismos ficheros; ver su nota): se propone un solo commit. Test nuevo en `BoardColumn.test.tsx` (variante según el modo). Los E2E de CA-1.2, E-6 y movimiento reducido pasan en `chromium`. `pnpm test` (880), `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` sin cambios |
| T-020 | | Sin cambios en `apps/web`: D-13 (columnas ocultas sin medidas) y D-6 (`TouchSensor` con retardo) ya cumplen RF-018 y RF-019. Solo se corrige una expectativa de mi E2E (CA-4.5: In progress tiene 3 tarjetas, no 0). Los E2E de dedo pasan: CA-4.1, CA-4.3, CA-4.4 y CA-4.5 en `chromium`, `chrome` y `webkit`, y CA-4.2 en `chromium` y `chrome`. `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde |
| T-021 | | `pnpm test:e2e` (cuatro ficheros) en los tres proyectos: 251 pasan, 11 saltados (según lo previsto: solo `chromium` o sin `chrome`), 1 «flaky» en `webkit` (hidratación, M-7, pasa al reintentar) y solo falla RNF-002, que es de T-022. axe sin infracciones con una tarjeta cogida, en los dos temas; el asa mide 44 px a 375 y 32 px a 1280. Ajuste de E2E: CA-2.5 vuelve a probar soltar dentro de su propio hueco, y aparte salir a otra columna y volver, 8 px por encima del centro: justo en el centro hay un empate de medio píxel con la tarjeta que ocupó el hueco y `webkit` a veces resolvía «después». Sin correcciones de comportamiento en `apps/web` |
| T-022 | | RNF-002 con 500 tareas (200 en To do): **antes 176,7 / 180,2 / 175,5 ms** (no cumplía); **después 40,2 / 38,4 / 39,5 ms** en tres ejecuciones seguidas en `chromium`. Cambios (plan **D-21, añadida**): `memo` en `TaskCard` y `DraggableCard`, opciones de los sensores constantes, y `handleProps` como un solo objeto estable, lo que cambia el contrato de plan §4.3 (actualizado). E-4 y E-5 pasan. `grep -rn "console.log" e2e/` no encuentra nada. `pnpm test` (880), `pnpm lint` y `pnpm typecheck` en verde |
| T-023 | | `DESIGN.md` a 1.4.0-todo.1 (`--ring-drop` en §1.4 y §6.2, con el mismo valor que `tokens.css`, revisado con `grep`; §8 con X-1 y X-2; §11.3 con el orden, el asa, el movimiento y el aviso; fila en el Historial). Checklist §21 repasada con 36 capturas de la tarjeta levantada, el hueco y el asa a 375, 768 y 1280, en los dos temas y con «aumentar contraste». **Hallazgo y corrección:** la tarjeta levantada era translúcida y el texto de debajo se transparentaba a través del suyo (se veía a 375 en oscuro); lleva `backdrop-glass` (§6.3), con su test. En `specs/roadmap.md`, «Ideas sin priorizar»: animar las tarjetas (X-2) y quitar el aviso de mover tras un movimiento correcto. **Sin prueba con VoiceOver** (plan D-22): el usuario ya lo decidió en 001/RNF-001 y este plan lo había vuelto a incluir sin tenerlo en cuenta. Los anuncios solo se comprueban con tests automáticos: riesgo aceptado, como 001/I-2 |
| T-024 | | El `grep` de los tests que empiezan por `003 ` encuentra los **78 IDs** pedidos: RF-001…RF-023 (23), CA-1.1…CA-1.10, CA-2.1…CA-2.6, CA-3.1…CA-3.10 y CA-4.1…CA-4.5 (31), E-1…E-20 salvo E-19 (19; E-19 se comprueba con la nota de T-002) y RNF-001…RNF-005 (5). La tarea decía 79, pero la suma de su propia lista es 78. Faltaba RNF-004, añadido al nombre del E2E de CA-4.1, que corre con el dedo en los tres proyectos. El `grep` también tiene que mirar los títulos que Prettier parte en otra línea, tras `it.each(…)(`. Pasada final: `pnpm test` (880), `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` en verde (252 pasan, 11 saltados según lo previsto, 1 «flaky» en `webkit` por hidratación, M-7). Un fallo de `toHaveText` en CA-2.5 en `webkit` se vio una vez y pasó al reintentar; no se ha reproducido en 42 repeticiones ni en 3 pasadas del fichero: queda sin explicar |
| T-025 | | `verificacion.md`: **NO APTO**, por un bloqueante (B-1: al bajar una tarjeta con teclado en una columna con scroll, sale de la vista). Además, I-1 (clic o toque en el asa frente a RF-006, pendiente de decidir) y ocho menores. La spec sigue en `en-implementacion`. Hechos en una sesión nueva: `pnpm test` (880), `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` (252 pasan, 11 saltados, 1 «flaky» en `webkit`). Se usó una sonda E2E temporal, ya borrada |
| — | | 2026-11-01, `/sdd-cambiar-spec` tras T-025 (NO APTO), con las decisiones del usuario. Spec v2.0, plan D-23 a D-28 y fase 6 (T-026 a T-037). **B-1, I-1, M-1, M-2, M-3, M-5, M-7 y M-8** pasan a tareas. **M-4** queda resuelta en este cambio: el plan ya recoge `backdrop-glass` (D-10), `focusedHandle` (D-7), `onDragMove` y `columnDropId` (§4.3). **M-6:** un commit por tarea desde T-026; el historial no se reescribe y las filas anteriores se quedan sin hash. Riesgo aceptado: D-24 con lectores de pantalla (D-22) |
| T-026 | 7ba0189 | `drag` y `landing` guardan el id y `draggedTask` se busca en `tasks` en cada render; fuera `seenTasks` (M-5). Test primero: `003 C-4 D-8` fallaba con el título viejo («Preparar la demo» en vez de «Demo renombrada»). **Desviación de D-18, anotada en el plan:** `landing` también se vacía en cuanto la tarea sale de `before`, porque la mutación espera a volver a pedir la lista y, al fallar, la tarjeta reaparecería en su sitio nuevo durante esa petición. Test añadido que la tarea no listaba: `003 RF-021 D-18` (ya pasaba antes del cambio; protege este riesgo). `pnpm test` (882), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e e2e/drag-and-drop.spec.ts` en `chromium` y `webkit`: 50 pasan, 4 saltados según lo previsto, ninguno «flaky». **RNF-002: 41,5 ms** |
| T-027 | 70144d8 | D-23: `scrollIntoView` de la tarjeta en el efecto de layout de D-7, solo con `mode: 'keyboard'`, y `max-md:scroll-pb-24` en `main`. E2E primero, 4 tests en `chromium` y `webkit`: 7 de 8 fallaban y pasaba el de otra columna en `webkit`. A 1280 × 900, la tarjeta se recortaba desde la 7.ª pulsación (posición 8, 13,9 px); la tarea decía 8.ª porque este test exige la tarjeta entera. A 1280 × 720, desde la 5.ª; a 375, «Crear tarea» tapaba el asa desde la 6.ª. **Fichero fuera de la lista, imprescindible:** `test-utils.tsx`, porque jsdom no tiene `scrollIntoView` (doble mínimo, como el de `<dialog>`). Una pasada de CA-3.11 tuvo 1 fallo de `toBeVisible` sin elemento, que no se repitió (compatible con M-7, sin confirmar). `pnpm test` (882), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e e2e/drag-and-drop.spec.ts` en `chromium` y `webkit`: 58 pasan, 4 saltados |
| T-028 | 35f03c1 | D-24 en `TaskCard`: `detail` 0 coge o suelta; 1 o más abre el detalle. Test primero: fallaban CA-1.11 y `003 RF-017 D-24` en unitario, y CA-1.11, CA-4.6 y `003 RF-017 D-24` en E2E, por no abrirse el detalle; «arrastrar desde el asa» ya pasaba, porque describe lo que no cambia. **Parada y decisión del usuario (opción A):** D-24 no preveía dos fallos con la tarjeta ya pasada a otra columna: (1) el detalle abría con el estado de la vista previa y (2) en `webkit` el foco se iba a `BODY` al pulsar y no se abría el detalle. Se resuelven con `Board.openTask` (tarea real) y `handleProps.onMouseDown` (`preventDefault` solo con esa tarjeta cogida con teclado); ajuste anotado en plan D-24 y en el contrato de §4.3. **Causa de la sonda:** dnd-kit 6.3.1 no arranca si el `mousedown` llega con `defaultPrevented`, así que con la tarjeta cogida con teclado no se puede arrastrar con el ratón desde su propia asa (consecuencia aceptada, en D-24). **Fichero fuera de la lista, imprescindible:** `Board.tsx`, además de `task-move.ts`. Test nuevo que la tarea no listaba: `003 RF-017 D-24` del `mousedown`, y `003 RF-013 D-24` separa el caso `detail` 0. `pnpm test` (886), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e e2e/drag-and-drop.spec.ts` en `chromium` y `webkit`, incluidos D-15 y CA-3.1: 66 pasan, 4 saltados, ninguno «flaky» |
| T-029 | 9b6eb86 | **Opción de D-25 que queda: la posición real del puntero.** E2E primero: 6/6 en `chromium` y 6/6 en `webkit` con `--repeat-each=6`. Con `over` del evento seguía fallando 12/12, porque también se actualiza en el render. Queda un oyente en la captura de `window` para `mouseup` y `touchend`, solo durante el arrastre con puntero, y `inVisibleColumn` compara con el rectángulo de las columnas, como `pointerWithin`. **Fichero fuera de la lista, imprescindible:** `BoardColumn.tsx`, para el atributo `data-board-column`, el nombre que el plan no fijaba. Con `--repeat-each=5`: 10 de 10 en `chromium` y `webkit`. `pnpm test` (886), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e e2e/drag-and-drop.spec.ts` en los tres proyectos: 94 pasan, 14 saltados |
| T-030 | 9b6eb86 | D-26 con `onTaskGone`: `Board` reutiliza `focusTarget = { kind: 'create', removedId }`, que espera a que la tarjeta ya no esté y sirve con el «Crear tarea» del estado vacío. `focusTarget` sube por encima de `useTaskMove`. Test primero: fallaban los dos `003 CA-3.12` unitarios y el E2E en `chromium` y `webkit`, con el foco en `BODY` o fuera del botón; `003 RF-022 D-26` ya pasaba, porque describe lo que no cambia. Ayuda nueva en el E2E, `deleteTaskViaApi`: el `DELETE` exige cuerpo JSON (`requireJson`). `pnpm test` (889), `pnpm lint` y `pnpm typecheck` en verde; E2E de CA-3.12, CA-1.10, D-15 y CA-3.1 en `chromium` y `webkit` en verde |
| T-031 | 9b6eb86 | D-26 con `onMobileColumn(origin.status)` al fallar, si el foco seguía en el asa. Test primero: con el cambio quitado, fallaban `003 CA-3.13` en `Board.test` y el E2E en `chromium` y `webkit` (el selector no volvía a To do); `003 RF-023 D-26` ya pasaba, porque describe lo que no cambia. `failWith` sube al módulo de `Board.test`. `pnpm test` (891), `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e e2e/drag-and-drop.spec.ts` en `chromium` y `webkit`: 72 pasan, 4 saltados. **Hallazgo, lote parado:** el E2E de la tarea solo aborta `…/move`, y la lista se vuelve a pedir antes de que `mutateAsync` rechace (nota de D-18). Sonda temporal a 375, ya borrada, en `chromium` y `webkit`: sin conexión, aviso y columna en 30–33 ms; con `GET /api/tasks` lento 1500 ms, unos 1800 ms; **con la API caída y el navegador con red, unos 7 s en In progress sin la tarjeta, sin aviso y con el foco en `BODY`, y después el tablero se sustituye por el error de carga («Reintentar»), así que el aviso de mover no llega a verse.** No cumple RF-021, RF-023, CA-1.9, CA-2.6 ni CA-3.13 en ese caso. No es de esta tarea: viene de `onSettled` (T-012) y de `PrivateArea` (002/D-8). Pendiente de la decisión del usuario |
| — | | 2026-11-01, `/sdd-cambiar-spec` tras el hallazgo de T-031, con la decisión del usuario: corregir las dos causas. Spec v3.0 (RF-021 cambia; nuevos RF-025, CA-1.12 y E-22), plan D-29 y D-30, y tareas T-038 y T-039 antes de T-032. Ninguna tarea `[x]` se rehace: T-031 sigue valiendo y T-038 completa CA-3.13. Por la lectura, ningún test de la 002 cuenta con el comportamiento actual: se confirma en T-039. T-029, T-030 y T-031 comparten el commit 9b6eb86 |
| T-038 | 9fc0587 | D-29: `onSettled` lanza `invalidateQueries` sin devolver su promesa. Test primero: `003 RF-021 D-29` fallaba porque `mutateAsync` no rechazaba con la lista pendiente, y los dos E2E con `**/api/**` abortado, en `chromium` y `webkit`, porque el aviso no llegaba en 1 s. `003 D-12` y `003 RF-021 D-18` siguen en verde sin cambiarlos. **Ajuste de un test de T-028, fuera de la lista de casos:** `003 RF-006` arrastrar desde el asa falló una vez en `webkit` con la lista en otro orden, y no se reprodujo en 30 repeticiones aisladas ni en 3 pasadas del fichero. Causa probable, sin confirmar: se coge por el asa, y el centro de la capa quedaba a unos 3 px de pasar al otro lado de la tarjeta; ahora suelta con `fractionY: 0.1`. Con `--repeat-each=10`, ese test y los de API caída: 60 de 60. `pnpm test` (892), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e e2e/drag-and-drop.spec.ts` en `chromium` y `webkit`: 75 pasan, 4 saltados, 1 «flaky» en `webkit` (CA-2.5, pasa al reintentar: es T-035). Tres pasadas de `webkit` sin reintentos dieron 5 fallos en `/signup` sin hidratar (M-7) |
| T-039 | f2de33f | D-30 en `PrivateArea`: tablero y cabecera dependen de `tasks.data`, `meFailed` y `tasksFailed` solo cuentan sin datos, y `useTasks` pasa a `enabled: Boolean(me.data)`. Test primero: `003 RF-025 E-22` de `tasks` fallaba porque desaparecía el tablero, el de `me` porque salía el error de carga, y el E2E `003 CA-1.12 RF-025 E-22`, en `chromium` y `webkit`, porque no estaba el título «Tablero». **La tarea decía «500, sin reintentos», pero un 500 sí se reintenta:** `apiFetch` lo convierte en `NetworkError` y `withQueryClient` lo reintenta 3 veces. El test cuenta la petición y los 3 reintentos, sin cambio de comportamiento. El refresco se dispara con `visibilitychange`, porque el `QueryClient` de la isla es interno. Casos además de los listados: al fallar `me`, la lista se sigue pidiendo; tras fallar `tasks`, la lista se actualiza la próxima vez (E-22). Los tests de la 002 siguen en verde sin cambiarlos (el diff de `PrivateArea.test.tsx` no borra ninguna línea). Fila «Modificada por la spec 003» en la 002. `pnpm lint` y `pnpm typecheck` en verde; `pnpm test` (894) en verde en la última pasada. `pnpm test:e2e e2e/drag-and-drop.spec.ts` en `chromium` y `webkit`: 78 pasan, 4 saltados, ninguno «flaky»; el E2E nuevo, 10 de 10 con `--repeat-each=5`. **Hallazgo sin resolver, ajeno a esta tarea (no toca `apps/api`):** `003 RF-009 D-2 creaciones a la vez no repiten posición` (`tasks.create.test.ts`, T-002) agotó los 5 s en 1 de 6 pasadas de `pnpm test`. Otra pasada anterior dio 1 fallo que no se identificó, y pudo coincidir con los E2E, que usan la misma base. Después, 8 de 8 en la suite (44–48 ms) y 20 de 20 aislado (155–167 ms). Pasar de menos de 200 ms a más de 5 s apunta a un cuelgue intermitente y no a lentitud, pero la causa no se ha buscado: sin confirmar si es del test o de `createTask`/`lockUser`. Pendiente de la decisión del usuario |
| T-032 | 576f93a | D-27 en el asa, con la escala 0,94 de §8 para botones de icono. Test primero: `003 RNF-005 D-27` fallaba por no tener `transition`. **`003 RNF-001 D-27` no falló primero, ni podía:** D-27 no cambia ningún token y la pareja ya cumplía; es una comprobación nueva con la superficie `taskHandleHover` (`--surface-raised-hover` sobre la tarjeta). Icono sobre esa superficie: 12,27:1 en claro (N, SB y C+) y 5,8 / 5,62 / 5,8:1 en oscuro (N, SB y C+). Como los unitarios solo miran nombres de clase, sonda temporal en `chromium` y `webkit`, ya borrada: en reposo, fondo transparente y sin escala; con hover, `rgba(255, 255, 255, 0.96)`; al pulsar, `scale: 0.94` (el asa pasa de 32 a 30,08 px). `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` en verde sin cambiarlo. Además, aunque la tarea no lo pedía, porque el asa cambia de tamaño al pulsarla: `pnpm test:e2e e2e/drag-and-drop.spec.ts e2e/design-system.spec.ts` en `chromium` y `webkit`: 152 pasan, 4 saltados, ninguno «flaky» |
| T-033 | b570384 | D-28: `STATUS_NAMES` pasa a `lib/task-messages.ts`, y `BoardColumn`, `Board` y `TaskDialog` lo importan de ahí. Sin cambio de comportamiento, así que no hay test que falle primero: la comprobación es `grep`, que antes encontraba `../components/BoardColumn` en `task-messages.ts` y ahora no encuentra nada de `components/`. En el roadmap queda una sola idea de animar las tarjetas, con los dos orígenes. **Fuera de esta tarea, sin tocar:** `lib/messages.ts` y `lib/task-move.ts` siguen importando tipos de `components/` (`AlertTone`, `HandleProps`); son `import type`, no llegan al paquete final, y M-8 solo hablaba de `task-messages.ts`. `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde. E2E no ejecutados: la tarea no los pide |
| T-034 | 149e3c9 | M-7: 7 tests nuevos (RF-019 con ratón a 375; axe en pleno arrastre, en claro y oscuro; CA-1.4, CA-1.5, CA-1.10 y CA-2.6 con ratón). **Los 6 casos pasan en `chromium`, `chrome` y `webkit` (21 de 21), sin cambios en `apps/web`: ningún fallo real.** No se han visto fallar, porque la tarea no lo pide y el comportamiento ya existía; para que no pasen sin probar nada, comprueban su precondición (la insignia, la fecha, la capa en el aire), la respuesta o el número de peticiones a `…/move` y, en CA-1.4 y CA-1.5, la fecha guardada por la API, porque fuera de Done la tarjeta no la enseña. CA-1.5 usa la fecha de hoy y no la del ejemplo (27/10): `createTaskViaApi` no deja otra, y no cambia lo que se comprueba. Sin cambios en `helpers.ts`; `taskViaApi` sale de `deleteTaskViaApi`, sin cambio de comportamiento. Estabilidad, sin reintentos: ×5 de los 7 tests en los tres proyectos (103 de 105), y solo en `webkit`, ×30 de CA-1.5 (28 de 30) y ×15 de los 7 (103 de 105). Los 6 fallos son de `webkit`; 5 están confirmados como `/signup` sin hidratar (M-7), en `openBoard` y antes de llegar al tablero. **El sexto, de CA-1.5 en la tanda ×5, queda sin confirmar:** su error se perdió al borrarse `test-results`; después CA-1.5 pasó 43 de 45, y esos 2 fallos son `/signup`. **Para T-035:** el fichero completo en los tres proyectos dio 124 pasan, 19 saltados y 1 fallo: `003 CA-2.5` en `webkit`, también al reintentar (hasta ahora siempre había pasado al reintentar). No se guardó el mensaje y no se ha investigado, porque es de T-035. `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde |
| T-035 | 9566a81 | **Se reproduce y es un fallo real de `apps/web`, sin corregir: pendiente de la decisión del usuario.** Sin reintentos, en `webkit`: `-g "003 CA-2.5" --repeat-each=100`, 97 pasan, 2 fallos reales y 1 de `/signup` (M-7); fichero completo 5 veces, 1 pasada con fallo de CA-2.5 (no depende de la carga: también falla aislado). Falla en el segundo paso, al salir a In progress y volver: la tarjeta acaba en la posición 3 y **se guarda** (`POST …/move` con `index: 2`). No es solo la vista previa ni un fallo del test. **Causa, medida con una sonda temporal ya borrada** (reescribía `task-move.ts` en la respuesta del servidor de desarrollo, sin tocar el fichero), 12 fallos de 138: (1) al entrar en To do, `over` es «Comprar pan», `below`, índice 1: correcto; (2) se pinta el hueco, «Llamar al banco» baja a 455,5, pero su rectángulo en dnd-kit sigue en 381; con el puntero en 348, `closestCenter` da «Llamar al banco»; (3) en la misma columna, `placementFromOver` da el índice de esa tarjeta sin mirar `below` (D-9): índice 2; (4) el rectángulo de la tarjeta arrastrada también queda en 381 y su hueco en 455,5, así que `over` es ella misma y `onDragMove` (D-20) sale sin corregir, durante los movimientos que siguen y hasta soltar. **D-9 da por hecho algo que no ocurre:** `MeasuringStrategy.Always` solo evita que la medición se desactive; en `core.esm.js`, `useDroppableMeasuring` remide si cambian los `containers` o se llama a `measureDroppableContainers`, no porque las mismas tarjetas cambien de orden (`@dnd-kit/sortable`, que aquí no se usa, sí lo pide). **Alcance:** a velocidad de test, solo `webkit` (12 de 138, 8 de 247 con la primera sonda); `chromium` 0 de 150, `chrome` 0 de 100. Con un movimiento cada 16 ms, 0 de 142 en `webkit` y 0 de 100 en `chromium`: no se ha visto a velocidad de ratón real, lo que no lo descarta. El hueco enseña dónde va a caer antes de soltar. **Sin confirmar:** que sea la causa del fallo de `003 RF-006` en `webkit` (T-038) y que la explicación del «empate de medio píxel» de T-021 estuviera incompleta; el ajuste de 8 px de T-021 no lo evita. Sin cambios en `apps/web` ni en los E2E. `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde. T-036 pide `pnpm test:e2e` en verde: con este fallo, puede salir en rojo al azar |
| T-036 | 17af22e | **Trazabilidad: 88 de 88 IDs**, con el criterio de T-024 y sin contar E-19: RF-001…RF-025 (25), CA-1.1…CA-1.12, CA-2.1…CA-2.6, CA-3.1…CA-3.13 y CA-4.1…CA-4.6 (37), E-1…E-22 salvo E-19 (21) y RNF-001…RNF-005 (5). Los 10 IDs nuevos ya tenían test: no se añade ninguno. El `grep` tiene que aceptar comillas invertidas dentro del título, como en el de E-11 de `tasks.move.test.ts`; con el primer patrón, E-11 salía como falta sin serlo. **Suite, una pasada:** `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e` (cuatro ficheros, tres proyectos) termina con código 0: 304 pasan, 21 saltados según lo previsto (`chrome` 16, `webkit` 5) y 2 «flaky» en `webkit`, que pasan al reintentar: `board.spec.ts` RNF-002 (`/signup` sin hidratar, M-7) y `design-system.spec.ts` CA-5.4 (sin `h1` tras el `goto`, compatible con M-7, sin confirmar). **Este verde no resuelve lo pendiente:** CA-2.5 pasó a la primera en esta pasada, pero el fallo real de T-035 sigue sin corregir (2 de 100 en `webkit`), y el cuelgue de `003 RF-009 D-2` (T-039) sigue sin causa conocida. Ambos, pendientes de la decisión del usuario antes de T-037 |
| T-037 | 406a678 | **Segunda verificación; T-037 sigue pendiente hasta la tercera.** `verificacion.md`: **APTO CON OBSERVACIONES**, en una sesión nueva, sin bloqueantes. Dos importantes: **I-1**, nuevo, soltar en el margen del tablero de 768 a 1279 px guarda el movimiento (RF-005), en `chromium` y `webkit`; **I-2**, el fallo de T-035, reproducido 3 de 100 en `webkit`. Menores: M-1 (anillo de foco y sombra recortados de 768 a 1023 px), M-2 (el cuelgue de T-039: 0 de 26 pasadas solo, 1 de 8 con los E2E a la vez, en otro test con el mismo patrón; causa sin confirmar), M-3 (contraste de la capa en Safari, sin comprobar), M-4 (RF-023 frente a D-26) y M-5 (documentos). `pnpm test` (897), `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` en verde (305 pasan, 21 saltados, 1 «flaky» en `webkit`); RNF-002: 38,5 / 40,7 / 39 ms. Se usaron tres sondas temporales, ya borradas. La spec sigue en `en-implementacion`, pendiente de la decisión del usuario |
| — | | 2026-11-01, decisiones del usuario sobre la segunda verificación: corregir I-1 (T-040), I-2 con la opción 1 (T-041), el anillo de foco de M-1 (T-042) y lo que M-5 dice de `plan.md` (T-043). T-037 vuelve a pendiente hasta la tercera verificación. **Sin tarea:** M-2 (cuelgue de T-039), M-3 (contraste de la capa en Safari), M-4 (RF-023 frente a D-26), la sombra recortada de M-1 y las filas del roadmap de M-5. Las filas del roadmap se añaden al cerrar la spec; lo demás volverá a salir en la tercera verificación si no se decide antes |
| — | | 2026-11-01, `/sdd-cambiar-spec` por la observación M-4, con la decisión del usuario. Spec v3.1: RF-023 recoge la condición de D-26 al fallar el guardado; al cancelar, se vuelve siempre. Sin cambio de comportamiento ni de código: lo cubre `003 RF-023 D-26`. Ninguna tarea nueva, a rehacer ni obsoleta. M-4 deja de estar sin tarea: la tercera verificación (T-037) comprueba que queda resuelta |
| T-040 | 64f500f | D-31: `inVisibleColumn` recorta el rectángulo de cada columna con el del tablero, su padre, y lo usan `collisionDetection` y `onDragEnd`: ningún atributo nuevo, así que `Board.tsx` no cambia. E2E primero, 9 tests en `chromium` y `webkit`: con el código de antes fallaban 12 de 18, con la tarea guardada en el margen a 768 sin esperar en los dos navegadores (lo que midió la verificación) y con el hueco en In progress o Done; E-5 y `003 RF-001 D-31` ya pasaban, porque describen lo que no cambia. Después, 18 de 18 y, con `--repeat-each=5 --retries=0`, 90 de 90. **Dos ajustes en la comprobación de la tarea:** (1) a 1024 solo sobran unos 200 px, y `chromium` a los 100 ms ya puede haber llegado al final, así que ese caso no comprueba que siga recortado (la verificación ya lo midió así); los demás, sí; (2) la vista previa se mira en cada fotograma, porque sin el cambio también acaba volviendo al origen al terminar el scroll. `003 CA-1.7`, `003 CA-4.5`, `003 RF-019`, `003 E-5` y `003 E-21` siguen en verde sin cambiarlos en los tres proyectos: 23 pasan, 9 saltados y 1 fallo en `webkit`, en `toHaveURL` de `signup`, antes de llegar al tablero (M-7, no cuenta, según la fase 7); ese test, 5 de 5 al repetirlo. `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde |
| T-041 | | **Sin cerrar, lote parado: pendiente de la decisión del usuario.** La tarea dice «si oscila, parar y avisar», y oscila. **Medida inicial** (`webkit`, `-g "003 CA-2.5" --repeat-each=200 --retries=0`, ya con T-040): 5 fallos reales, los 5 con «Llamar al banco» antes de «Preparar la demo», y 3 de `/signup` sin hidratar (M-7). **Con `RemeasureOnPreview` en `Board.tsx`** (efecto de layout que llama a `measureDroppableContainers([])` cuando cambia `drag.current` con el puntero), `--repeat-each=300`: **0 fallos reales** y 3 de `/signup`, todos en `openBoard`. I-2 queda corregido. **Oscilación:** `003 RF-007 D-9` falla en `chromium` y `webkit`, y **ya fallaba antes del cambio**: a media altura del título largo, 16 y 4 cambios de orden antes, y 16 y 2 después, en 500 ms, con un temblor de ±1 px. Sonda temporal, ya borrada, con «Corta uno» sobre una tarjeta de 243 px, en una malla de 6 px, bajando y subiendo: **con el puntero quieto, 0 cambios en todas las posiciones**; con el temblor, de 2 a 9 cambios en una o dos posiciones (a unos 40-46 px del borde superior en los dos navegadores y, solo con la medida nueva, a 130 px en `webkit`). Sin medir, las mismas cerca de 40 px. Con dos tarjetas de la misma altura (63 px), 0 cambios en esa malla, que puede saltarse franjas: la sonda no vio la de media altura que sí ve el test. Causa probable, por la lectura del código y sin confirmar: en la misma columna, `onDragOver` lleva la tarjeta al índice de la de debajo sin mirar de qué lado está el centro (D-9), y `onDragMove` la devuelve al cruzar (D-20); D-9 y D-20 dicen que no oscila, y no es cierto con alturas distintas. **Rendimiento, una sola pasada, no las tres que pide la tarea:** soltar entre columnas, 36,2 ms antes y 36,6 ms después; reordenar en la columna de 200, 38,4 y 40,5 ms; un cambio de vista previa, 32,9 y 41 ms. **Falta:** decidir la oscilación, RNF-002 tres veces, E-4 y E-5, `pnpm test:e2e` completo, D-9 en el plan y los comentarios de `task-move.ts` y `e2e/helpers.ts`, y si `Always` sigue haciendo falta. `003 RF-007 D-9` se queda en rojo a propósito hasta entonces |
| — | | 2026-11-01, **M-3 de la segunda verificación, comprobado por el usuario en Safari real:** en tema oscuro, al arrastrar una tarjeta por encima de otra, la capa se ve correcta, así que no hace falta subir su opacidad. Es una comprobación a ojo, sin medir el contraste, y solo sobre otra tarjeta: la capa sobre «Crear tarea» no se ha mirado. La sonda de la verificación daba ahí 4,39:1 en el `webkit` de Playwright, y no se sabe si Safari se comporta igual |
| T-037 | b8924dd | **Tercera verificación; T-037 sigue pendiente hasta la cuarta.** `verificacion.md`: **NO APTO**, en una sesión nueva. Se lanzó antes de terminar T-041 a T-043. Bloqueantes: **B-1**, `003 RF-007 D-9` en rojo por la oscilación, y **B-2**, T-041 a T-043 sin hacer. Importantes: **I-1**, E-21 con el dedo guarda (12 de 12), e **I-2**, WCAG 2.5.7 al ordenar una columna. Menores: M-1 a M-7. `pnpm test` (897), `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e` con 325 pasan, 33 saltados y 2 fallan; CA-2.5 en `webkit`, 0 fallos reales de 200; RNF-002: 39 / 36,4 / 36,4 ms entre columnas y 67,8 / 40,4 / 40,1 ms en la columna de 200. Sondas temporales, fuera del repositorio |
| — | | 2026-11-01, `/sdd-cambiar-spec` tras la tercera verificación, con las decisiones del usuario. **Spec v4.0:** HU-5, RF-026 a RF-029, CA-5.1 a CA-5.11, CA-4.7, E-23 y E-24 («Subir» y «Bajar» en el detalle, al momento, y sin efecto con el estado cambiado sin guardar; I-2); RF-019 (soltar sobre «Crear tarea» con la columna debajo guarda; M-4). **Plan:** cambian D-9 y D-20 (cruzar el centro; B-1) y D-25; nuevas D-32 (`RemeasureOnPreview`, el arreglo de «caer una posición más abajo»), D-33 (I-1), D-34 y D-35. **Tareas:** nuevas T-044 a T-049; T-041 se acota a la nueva medida; T-042 pasa a depender de T-045; T-037 pasa al final, como cuarta verificación. Ninguna tarea `[x]` se rehace ni queda obsoleta. **Lo que la regla de cruzar el centro añade, propuesto en el análisis y confirmado por el usuario:** si el puntero salta varias tarjetas, queda al lado de la de debajo. **Sin tarea:** M-1 (sombra), M-3 y M-5; volverán a salir en la verificación. M-3 pesa más con D-35, porque la capa pasa sobre «Crear tarea» |
| T-041 | 9702bc2 | **Cerrada** (la fila de arriba, con el lote parado, sigue valiendo para la medida inicial; `RemeasureOnPreview` entró en `64f500f`). **`MeasuringStrategy.Always` se quita** (D-32): en `core.esm.js`, durante el arrastre mide igual que el valor por defecto, y solo añade medir fuera del arrastre. Comentarios corregidos en `task-move.ts` (se va con `MEASURING`) y `e2e/helpers.ts`. **CA-2.5**, `webkit`, `--repeat-each=300 --retries=0`, sin `Always`: 297 pasan, **0 fallos reales** y 3 de `/signup` sin hidratar (M-7, en `signup`, dentro de `openBoard`). **RNF-002**, tres pasadas seguidas en `chromium`: entre columnas 19,5 / 19,6 / 19,3 ms (con `Always`, 36,4 / 36,4 / 35,9); reordenar en la columna de 200, 18,8 / 20,1 / 19,2 ms (con `Always`, 40,6 / 41,3 / 40,3). **Un cambio de vista previa con 200 tarjetas:** 42,2 / 40,4 / 40,6 ms, por debajo de 100, sin aviso. **`003 E-4` y `003 E-5`**, los dos, 3 de 3 en `chromium`. E2E del fichero en `chromium` y `webkit` sin `Always`: 110 pasan, 5 saltados, y los 3 fallos son `003 RF-007 D-9` en los dos navegadores, en rojo hasta T-044, y uno de `/signup`. `pnpm test`, `pnpm lint` y `pnpm typecheck` en verde |
| T-044 | 9702bc2 | D-9, D-20: `placementFromOver` usa `below` también en la misma columna y `onDragOver` y `onDragMove` comparten la regla. Unitarios primero: los 3 fallaban por la razón correcta. **Desviación, anotada en D-20:** solo con la regla, `003 RF-007 D-9` seguía oscilando (16 cambios en `chromium`, 2 en `webkit`). Sonda temporal, ya borrada: `over.rect` es una foto de cuando cambia la tarjeta de debajo, así que el margen del plan nunca contaba. Se lee la medida de ahora desde `collisions` (`centerBelow`); la regla no cambia. **Después:** `003 RF-007 D-9` (el E2E que ya existía, sin cambiarlo, y los 2 nuevos), 30 de 30 con `--repeat-each=5 --retries=0` en `chromium` y `webkit`. `-g "003 CA-2.5"` en `webkit`, `--repeat-each=200 --retries=0`: 195 pasan, **0 fallos reales** y 5 de `/signup` (M-7, todos en `openBoard`). **RNF-002**, tres pasadas en `chromium`: entre columnas 19,2 / 19,1 / 19,7 ms; reordenar en la columna de 200, 20,9 / 21,1 / 19,7 ms; un cambio de vista previa, 37,3 / 34,7 / 34,4 ms. `e2e/drag-and-drop.spec.ts` en los tres proyectos, sin reintentos: 150 pasan y 33 saltados, con `003 CA-1.1`, `003 CA-2.1`, `003 CA-4.3` y `003 E-4` en verde. **Ningún E2E ha hecho falta ajustarlo por arrastrar hacia abajo.** `pnpm test` (899), `pnpm lint` y `pnpm typecheck` en verde |
| T-045 | 9702bc2 | D-33, sin cambios en el plan: un oyente de `touchend` en `activatorEvent.target`, además de los de `window`. Va en captura para llegar antes que el del sensor de dnd-kit, que escucha en el mismo elemento y lanza `onDragEnd`. E2E primero: `003 E-21 RF-005 D-33` falla en `chromium` y `webkit` por la razón correcta (se guarda en In progress), y `003 CA-4.1 D-33` ya pasaba, porque describe lo que no cambia. Después, los dos, 20 de 20 con `--repeat-each=5 --retries=0`. `003 E-21`, `003 CA-4.1`, `003 CA-4.3` y `003 CA-4.5` sin cambiarlos, en los tres proyectos: 15 pasan y 3 saltados. `pnpm test` (899), `pnpm lint` y `pnpm typecheck` en verde |
| T-042 | 9702bc2 | **Opción elegida:** llevar el asa hacia dentro con `md:end-1 md:top-1`, como ya hacía desde 1024 px, y `md:pe-12` en el botón de abrir (4 + 44 px, para que no tape el título). Se descarta más relleno en la lista, porque cambiaría el ancho de todas las tarjetas. `lg:end-1 lg:top-1` se quitan porque `md:` ya da esos valores: desde 1024 px no cambia nada. Solo valores del catálogo, sin `style=`. **Falso verde corregido:** la primera versión del caso de 768 y 1023 pasaba, porque medía a mitad de la transición de `scale`; ahora espera a `getAnimations()` y falla como debe. **Primero fallan** 6 de 10 en `chromium` y `webkit`: 2,04 px a la derecha, lo que midió la verificación, y 0,77 px con 12 tarjetas. Después, todos en verde. **Capturas a 768 en `chromium`, en claro y en oscuro:** el anillo se ve entero. `pnpm test:e2e e2e/drag-and-drop.spec.ts e2e/design-system.spec.ts` en `chromium` y `webkit`, sin reintentos: 204 pasan, 5 saltados y 1 fallo de `/signup` sin hidratar (M-7, en `003 CA-1.9`, dentro de `openBoard`, antes de llegar al tablero; no cuenta, según la fase 7). `pnpm test` (900, con `design-rules.test.ts` sin cambiarlo), `pnpm lint` y `pnpm typecheck` en verde. La sombra recortada de M-1 queda fuera, como dice la tarea |
| T-043 | d4c15a6 | M-5, solo `plan.md`: §4.4 gana la fila de `PrivateArea.tsx` y §4.5 apoya el icono de 16 px del asa en `DESIGN.md` §11.3, no en §9. Sin cambio de comportamiento, así que no hay test que falle primero. `pnpm lint` en verde. **`plan.md` también lo toca T-041, T-044 y T-042** (D-9, D-20, D-32 y D-11), en el mismo fichero: el `git diff` conjunto no solo tiene estas dos partes |
| T-046 | 9702bc2 | D-35, sin cambios en `apps/web`: 4 tests nuevos, con ratón y con el dedo, a 375 px. **El dedo y la columna corta, que no se habían medido, se comportan como dice la spec.** Con 12 tarjetas se guarda donde marcaba el hueco, sin diálogo de crear, y sigue igual al volver a cargar; el orden se lee en la captura del mismo evento de soltar, porque la página hace scroll sola (E-4) y el hueco se mueve hasta el último momento. Con 3 tarjetas vuelve, sin petición, aviso ni diálogo. Un primer intento falló por el propio test: al volver a cargar, el móvil enseña otra columna y faltaba elegir To do; el producto ya había pasado esas comprobaciones. 36 de 36 con `--repeat-each=3 --retries=0` en `chromium`, `chrome` y `webkit`. No se han visto fallar, porque la tarea no lo pide y el comportamiento ya existía. `pnpm test` (900), `pnpm lint` y `pnpm typecheck` en verde |
| T-047 | 801dea6 | D-34. Test primero: de 27 tests nuevos, 24 fallaban porque no existían los botones, `inactive` ni `MOVE_NEEDS_SAVE`; los otros 3 describen lo que no cambia (al crear no hay bloque, sin la tarea en la lista tampoco, y el foco de un botón activo). Después, en verde. Los tests de `TaskDialog` de la 002 solo cambian en `renderDialog`, que pasa `tasks`. `Board.test.tsx` no hace falta tocarlo. **Nombres que el plan no fijaba:** `moveWithinColumn` y `stepTo`. **Añadido a D-34, anotado en el plan:** el botón inactivo tampoco lleva la escala al pulsar ni el `hover`, porque pulsarlo no hace nada (CA-5.5); `hover:bg-raised` sale de `VARIANTS` para poder quitarlo. Al guardar o borrar, el aviso de mover solo se reinicia si hubo error, para no perder un movimiento en camino. Tests además de los listados: `003 RF-020 D-34`, `003 E-8 RF-029`, dos de `003 RF-029 D-34` (el aviso se quita con la siguiente acción) y `003 RF-026 D-34` (sin la tarea en la lista). `pnpm test` (927), `pnpm lint` y `pnpm typecheck` en verde; `design-rules.test.ts` sin cambiarlo |
| T-048 | f0df067 | 10 E2E nuevos en los tres proyectos: CA-5.2, CA-5.3, CA-5.4 (Enter y Espacio), CA-5.9, CA-5.10, axe en claro y oscuro (con un botón inactivo y con el texto de RF-028) y 44 px de alto a 375 y 1280. Se escriben después de T-047, así que no se han visto fallar. **Una pasada:** 29 de 30; el fallo era de mi test, que en CA-5.9 miraba el foco tras un clic y `webkit` no enfoca los botones al hacer clic (ver el punto 3 de abajo). **Sin ese `toBeFocused`, con `--repeat-each=3 --retries=0`:** 89 de 90, y el fallo es de `/signup` sin hidratar (M-7, `axe` en oscuro en `webkit`, en `signup`, antes de llegar al tablero). `DESIGN.md` a `1.5.0-todo.1`: §11.4 y su historial; también «Los errores al guardar, borrar o mover» en la misma Alert (plan D-34). **Capturas en `chromium`, en una sonda ya borrada:** a 1280 y a 375, en claro y en oscuro, el bloque se ve como dice §11.4. `pnpm test` (927), `pnpm lint` y `pnpm typecheck` en verde. **Lote parado antes de T-049, tres hallazgos pendientes de la decisión del usuario:** (1) **contradice RF-021:** si se cierra el diálogo con el movimiento en camino y después falla, la tarjeta vuelve, pero no sale ningún aviso (sonda en `chromium`: orden de antes, 0 avisos), porque el `onError` de `mutate` no se dispara con el componente desmontado (D-34). Con `TASK_NOT_FOUND` pasaría lo mismo, por la lectura y sin medir. La ventana es lo que tarde la petición; (2) **anillo de foco del botón inactivo:** la opacidad .45 también le afecta, y baja de 11,02:1 a 2,44:1 en claro y de 10,55:1 a 3,22:1 en oscuro sobre la carpeta (calculado). Se ve en la captura. WCAG 1.4.11 exime a los componentes inactivos y axe no lo marca, pero CA-5.5 deja el foco ahí justo al llegar al borde; (3) **RF-027 dice «el foco en el botón pulsado»:** con teclado se cumple en todos los proyectos; con clic, en `webkit` no, por cómo se comporta Safari con los botones |
| T-049 | 6e90cb6 | **Trazabilidad: 106 de 106 IDs**, con el criterio de T-024 y sin contar E-19: RF-001…RF-029 (29), CA-1.1…CA-1.12, CA-2.1…CA-2.6, CA-3.1…CA-3.13, CA-4.1…CA-4.7 y CA-5.1…CA-5.11 (49), E-1…E-24 salvo E-19 (23) y RNF-001…RNF-005 (5). No falta ninguno, así que no se añade ningún test. **Suite, una pasada sobre `f0df067`:** `pnpm test` (927), `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e` (cuatro ficheros, tres proyectos) termina con código 0, en 5 min: 385 pasan, 42 saltados según lo previsto (`chrome` 36, `webkit` 6) y 2 «flaky» en `webkit`, que pasan al reintentar: `board.spec.ts` CA-3.3 y `003 CA-1.7`. **Los dos «flaky» son `/signup` sin hidratar (M-7):** el primer intento falla en `tabTo`, dentro de `signup`, sin encontrar el campo de email y antes de llegar al tablero. **Este verde no resuelve lo pendiente:** los tres hallazgos de T-048 siguen sin decidir, y el primero contradice RF-021. No hay E2E para ese caso, así que la suite no puede detectarlo. Si alguno cambia código, hay que repetir esta suite |
| T-037 | 2688bb0 | **Cuarta verificación; T-037 sigue pendiente hasta la quinta.** `verificacion.md`: **APTO CON OBSERVACIONES**, en una sesión nueva, sobre `6e90cb6`. Sin bloqueantes. Importantes: **I-1**, «Subir» o «Bajar» con el diálogo ya cerrado falla sin aviso, e **I-2**, pulsarlos con «Guardar cambios» en camino deja el diálogo abierto y oculta el error. Menores: M-1 a M-7. `pnpm test` (927), `pnpm lint` y `pnpm typecheck` en verde; `pnpm test:e2e` con 384 pasan, 42 saltados y 3 «flaky» en `webkit`, todos de `/signup`; trazabilidad, 106 de 106 |
| — | | 2026-11-01, `/sdd-cambiar-spec` tras la cuarta verificación, con las decisiones del usuario. **Spec v5.0:** RF-028 (inactivos con un guardado en camino; I-2), RF-029 (con el diálogo cerrado, aviso en el tablero y foco en «Crear tarea» si seguía en la tarjeta o se perdió; I-1), CA-5.12 a CA-5.14, E-25 y E-26. **La petición citaba RF-029 para I-2 y RF-027 para I-1; con la confirmación del usuario, I-2 va a RF-028 e I-1 a RF-029**, que son los que tratan de eso. **E-26 es nuevo, detectado en el análisis y confirmado por el usuario:** si el usuario borra la tarea con un movimiento en camino, no hay aviso ni vuelve la tarjeta. **Plan:** nuevas D-36 a D-38; D-34 remite a ellas; M-1 y M-4 como riesgos aceptados en §8, M-5 en la fila de la 004, y `measuring` fuera de §4.3 (M-6). **Tareas:** nuevas T-050 a T-053; T-037 pasa a ser la quinta verificación. Ninguna tarea `[x]` se rehace ni queda obsoleta. El hash de T-049 se anota aquí. **Sin tarea:** M-3, que necesita Safari real y volverá a salir en la verificación |
| T-050 | | D-36. **Test primero:** 10 unitarios fallaban por la razón correcta (sin aviso en el tablero, foco en `BODY`, `useMoveTask` volvía a poner la tarea) y, con `apps/web` en `HEAD`, 5 de 7 E2E en `chromium`, por el aviso que no sale; los 2 de E-26 ya pasaban ahí, porque sin aviso no hay falsa alarma: los protege `003 E-26 … D-36` de `task-queries.test.tsx`, que sí fallaba, y sirven para que el aviso nuevo no se cuele. Después: `003 CA-5.13`, `CA-5.14`, `E-25` y `E-26`, 21 de 21 en los tres proyectos; CA-5.9, CA-5.10 y los demás de `TaskDialog`, sin cambios salvo pasar la prop. Los unitarios de integración van en `TaskDialog.test.tsx`, con `LiveBoard` y sus ayudas, así que `Board.test.tsx` no cambia. **Desviación, anotada en D-36:** la comprobación del foco también mira `data-task-handle`: el asa no está dentro del botón con `data-task-id`, y CA-5.14 dice «en la tarjeta». **Hallazgo, sin corregir (fuera de D-36):** si al llegar el 404 esta pestaña aún cree que hay otra tarea, también borrada fuera, el foco va al «Crear tarea» de la cabecera, y al llegar la lista vacía ese botón se desmonta y el foco acaba en `BODY`. Ocurre igual con un 404 de CA-5.10 y de `commit` (D-26), y lo midió un E2E de esta tarea en los tres proyectos; el caso «con la última tarea» se prueba con la tarea como última de la lista al fallar, que es lo que cubre el plan. Queda para la quinta verificación |
| T-051 | | D-37: `inactive={!upTo \|\| saving}` y `inactive={!downTo \|\| saving}`. **Test primero:** los 3 unitarios de `003 CA-5.12` fallaban (sin `aria-disabled`, el diálogo no se cerraba y no salía el error de guardar, lo que midió la verificación I-2) y los 4 E2E, en `chromium` y `webkit`, por no tener `aria-disabled`. Después, en verde; `chrome` se salta, como pide la tarea. El texto de RF-028 no sale durante el guardado (comprobado en el primer unitario). En el E2E, el clic sobre el botón inactivo lleva `force`, porque Playwright espera a que deje de tener `aria-disabled`. **Fallo sin causa demostrada:** `003 E-11 D-2 dos move a la vez` de `tasks.move.test.ts` falló 1 vez en una pasada de `pnpm test`, justo después de unos E2E con tests agotando su tiempo, y no guardé la salida. No se reproduce: 8 de 8 aislado y 3 de 3 con la suite completa tras otros E2E. Esta tarea no toca `apps/api`. Vitest y el servidor de Playwright comparten `todo_test`, y esta prueba lee sin filtrar por usuario, pero es una hipótesis. Se vuelve a mirar en T-053 |
| T-052 | | D-38: un `onClick` en el contenedor de los dos botones. **E2E primero:** antes del cambio, `003 RF-027 D-38`, `003 RF-028 D-38` y el `toBeFocused` recuperado en `003 CA-5.9` fallaban solo en `webkit`, con el botón sin foco, y pasaban en `chromium`, como preveía D-38. Después, 13 de 13 con `003 CA-5.4` y 2 saltados en `chrome`, según lo previsto. `chrome` sí ejecuta CA-5.9 y CA-5.4. Sin unitario, por D-38: `user-event` enfoca al hacer clic. Tab desde «Bajar» va a «Fecha estimada de inicio». `pnpm test` (943), `pnpm lint` y `pnpm typecheck` en verde |
| T-053 | | Sin cambio de comportamiento. **M-6:** comentarios de `task-move.ts` (sin «espera a volver a pedir la lista») y de `Board.tsx` (de D-9 a D-32); `specs/roadmap.md` con `actualizado` y cinco filas de historial: las verificaciones primera a cuarta y las v2.0 a v5.0. **M-4 y M-5:** sin código, ya en plan §8. **M-7:** se deja constancia de que `9702bc2` junta cinco tareas (T-041, T-042, T-044, T-045 y T-046); arreglarlo exigiría reescribir el historial, que `CLAUDE.md` prohíbe. **Trazabilidad: 111 de 111 IDs**, con el criterio de T-024 y sin contar E-19: RF-001…RF-029 (29), CA-1.1…CA-1.12, CA-2.1…CA-2.6, CA-3.1…CA-3.13, CA-4.1…CA-4.7 y CA-5.1…CA-5.14 (52), E-1…E-26 salvo E-19 (25) y RNF-001…RNF-005 (5). No falta ninguno, así que no se añade ningún test. **Suite:** `pnpm lint` y `pnpm typecheck` en verde. `pnpm test:e2e`, dos pasadas en los tres proyectos sin fallos: 414 y 412 pasan, 46 saltados, y 2 y 4 «flaky», todos en `webkit` y todos por la isla sin hidratar (M-7 de la 004): pasan al reintentar, y ninguno es un test nuevo. **`pnpm test` (943) no está en verde siempre:** `003 E-11 D-2 dos move a la vez` de `tasks.move.test.ts` falló en 2 de 11 pasadas de la suite completa, las dos justo después de unos E2E (T-051 y la primera pasada de esta tarea); la última pasada, también tras la E2E completa, da 943 de 943. No guardé la salida de ninguno de los dos fallos, así que **no se sabe en qué comprobación falla ni por qué**. El plan §8 ya recoge un riesgo parecido («los tests de escrituras a la vez (D-2) pueden agotar los 5 s» con `pnpm test` y `pnpm test:e2e` a la vez, verificación M-4), y podría ser la misma causa, aunque aquí las dos órdenes iban una detrás de otra: es una hipótesis, sin comprobar. No se reproduce: 8 de 8 aislado, 15 de 15 con la CPU cargada y 1 de 1 tras una E2E corta. T-050 a T-053 no tocan `apps/api`. Queda para la quinta verificación, con el hallazgo del foco de T-050 |
| T-037 | 7b5c6fb | **Quinta verificación.** `verificacion.md`: **APTO CON OBSERVACIONES**, en una sesión nueva, sobre `d4bd677`. Sin bloqueantes. Importantes: **I-1**, `pnpm test` falla de vez en cuando en las escrituras a la vez (`003 RF-009 D-2`, 1 de 21 pasadas, sin E2E en marcha y sin causa conocida), e **I-2**, el aviso de error del diálogo no se ve con el diálogo desplazado (RF-029, CA-5.9 y 002/RF-028). Menores: M-1 a M-7. `pnpm test` (943), `pnpm lint` y `pnpm typecheck` en verde, salvo esa pasada; `pnpm test:e2e` con 414 pasan, 46 saltados y 2 «flaky» en `webkit`, los dos de `/signup`; trazabilidad, 111 de 111, y E-19 probado con la migración real; RNF-002: 22,3 / 19 / 21,7 ms entre columnas y 22 / 22,2 / 45,3 ms en la columna de 200. Sondas temporales, fuera del repositorio |
| — | | 2026-11-01, cierre con la decisión del usuario: la spec pasa a `implementada` con **APTO CON OBSERVACIONES**, sin corregir nada más en esta rama. **I-1:** riesgo aceptado, con el dato nuevo en el plan §8, e investigarlo pasa a «Ideas sin priorizar». **I-2 y M-1 a M-7:** sin tarea en esta spec, también en «Ideas sin priorizar»; siguen abiertos. Por eso T-050 a T-053 siguen sin hash aquí (M-7) |
