---
spec: 003
plan_aprobado: 2026-10-31
progreso: 23/25
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
    - clic y Enter en el botón de abrir llaman a `onOpen` (`003 CA-3.8 RF-006`); clic en el asa no;
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

- [ ] **T-023** [P] Actualizar `DESIGN.md` a 1.4.0-todo.1 y repasar la checklist §21 y el lector de pantalla
  - Depende de: T-019
  - Ficheros: `DESIGN.md`
  - Cubre: RNF-001, RNF-005, X-1, X-2, C-26 (plan §4.6, §7 «Manual»)
  - Hecho cuando:
    - `--ring-drop` está en §1.4 y en la lista de anillos de §6.2, con el mismo valor que `tokens.css` (revisado con `grep`);
    - §11.3 tiene la frase nueva del orden (plan §4.6) y describe el asa, la tarjeta levantada, el hueco con anillo y el aviso «No hemos podido mover la tarea…» en la misma zona de alerta;
    - §8 «Arrastrar» recoge X-1 y X-2;
    - la versión es 1.4.0-todo.1, con su fila en el «Historial»;
    - la checklist §21 repasada sobre la tarjeta levantada, el hueco y el asa a 375, 768 y 1280, en los dos temas y con «aumentar contraste», y VoiceOver en Safari (coger, mover, soltar y cancelar escuchando los anuncios), con el resultado en el Registro

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

- [ ] **T-025** Ejecutar `/sdd-verificar`
  - Depende de: T-021, T-022, T-023, T-024
  - Ficheros: `specs/003-arrastrar-y-soltar/verificacion.md`
  - Cubre: todos
  - Hecho cuando: el informe está escrito; si sale APTO, la spec pasa a `implementada` con la confirmación del usuario

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
| T-023 | | **Abierta: falta VoiceOver.** Hecho: `DESIGN.md` a 1.4.0-todo.1 (`--ring-drop` en §1.4 y §6.2, con el mismo valor que `tokens.css`, revisado con `grep`; §8 con X-1 y X-2; §11.3 con el orden, el asa, el movimiento y el aviso; fila en el Historial). Checklist §21 repasada con 36 capturas de la tarjeta levantada, el hueco y el asa a 375, 768 y 1280, en los dos temas y con «aumentar contraste». **Hallazgo y corrección:** la tarjeta levantada era translúcida y el texto de debajo se transparentaba a través del suyo (se veía a 375 en oscuro); lleva `backdrop-glass` (§6.3), con su test. En `specs/roadmap.md`, «Ideas sin priorizar»: animar las tarjetas (X-2) y quitar el aviso de mover tras un movimiento correcto. **Pendiente (manual, del usuario):** VoiceOver en Safari: coger, mover, soltar y cancelar escuchando los anuncios |
| T-024 | | El `grep` de los tests que empiezan por `003 ` encuentra los **78 IDs** pedidos: RF-001…RF-023 (23), CA-1.1…CA-1.10, CA-2.1…CA-2.6, CA-3.1…CA-3.10 y CA-4.1…CA-4.5 (31), E-1…E-20 salvo E-19 (19; E-19 se comprueba con la nota de T-002) y RNF-001…RNF-005 (5). La tarea decía 79, pero la suma de su propia lista es 78. Faltaba RNF-004, añadido al nombre del E2E de CA-4.1, que corre con el dedo en los tres proyectos. El `grep` también tiene que mirar los títulos que Prettier parte en otra línea, tras `it.each(…)(`. Pasada final: `pnpm test` (880), `pnpm lint`, `pnpm typecheck` y `pnpm test:e2e` en verde (252 pasan, 11 saltados según lo previsto, 1 «flaky» en `webkit` por hidratación, M-7). Un fallo de `toHaveText` en CA-2.5 en `webkit` se vio una vez y pasó al reintentar; no se ha reproducido en 42 repeticiones ni en 3 pasadas del fichero: queda sin explicar |
