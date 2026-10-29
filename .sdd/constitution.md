---
proyecto: to-do-list
version: 1.1
actualizada: 2026-10-29
---

# Constitución del proyecto

> Principios no negociables. Toda spec, plan y tarea debe cumplirlos. Una excepción se justifica por escrito en el plan (sección "Comprobación de constitución") y, si es permanente, se convierte en una enmienda aquí.

## 1. Propósito del producto

App personal de tareas con tablero kanban y varios usuarios. Cada persona organiza sus propias tareas, y nadie puede ver ni tocar las de otra.

## 2. Stack y plataforma

- **C-1** Lenguaje: TypeScript en modo `strict` en todos los paquetes. Prohibido `any` salvo justificación en comentario.
- **C-2** Monorepo con workspaces de pnpm: `apps/web`, `apps/api` y `packages/shared`. Solo se usa pnpm. No se añaden dependencias sin justificarlas en el plan (qué aportan, alternativa nativa, tamaño, mantenimiento).
- **C-3** Versiones fijadas: Node 24 LTS, declarado en `.nvmrc` y en `engines` del `package.json` raíz. La versión de pnpm se fija con `packageManager` (corepack). `pnpm-workspace.yaml` lleva `engineStrict: true` (pnpm 11 no lee `engine-strict` de `.npmrc`), de modo que `pnpm install` falla con una versión de Node incompatible.
- **C-4** Frontend (`apps/web`): Astro en modo estático + Tailwind. La interactividad vive solo en islas React con TypeScript. El tablero es **una única isla** `client:only="react"`. Los datos de servidor se gestionan con TanStack Query; no se hace `fetch` en `useEffect` ni se copian datos de servidor a estado local.
- **C-5** Backend (`apps/api`): Node + TypeScript + Express 5. PostgreSQL con Prisma. El esquema solo cambia mediante migraciones versionadas y commiteadas; una migración ya aplicada no se edita. Postgres en local con `docker compose`.
- **C-6** Despliegue: de momento solo uso local, sin entorno de producción. Si algún día se despliega, hará falta un ADR, y front y `/api` deberán servirse desde el mismo origen (C-7).

## 3. Arquitectura

- **C-7** Mismo origen: el front llama siempre a rutas relativas `/api/...`. En desarrollo, el proxy de Astro redirige `/api` a Express. No se configura CORS.
- **C-8** La API va en capas `routes → services → repositories`. *Routes*: HTTP y validación de entrada. *Services*: reglas de negocio y autorización. *Repositories*: acceso a datos. **Solo los repositories importan Prisma.** Ninguna capa llama a la capa de encima.
- **C-9** Formato único de errores: toda respuesta de error de la API, incluidas las de validación y los errores no controlados, tiene la forma `{ "error": { "code": string, "message": string } }` y el status HTTP que corresponda. `code` es un identificador estable en `MAYUSCULAS_CON_GUIONES_BAJOS` (p. ej. `TASK_NOT_FOUND`), y su catálogo vive en `packages/shared`. `message` es solo informativo: el front decide el texto que ve el usuario a partir de `code`.
- **C-10** `packages/shared` contiene tipos, esquemas Zod y reglas puras que usan tanto el front como el back. No depende de Express, Prisma, React, el DOM ni de I/O. Ningún esquema o regla que ya esté en `shared` se duplica en `web` o `api`.
- **C-11** Las fechas sin hora se guardan en BD como `@db.Date` y viajan por la API y `shared` como texto `YYYY-MM-DD`, nunca como timestamp con hora o zona horaria.

## 4. Seguridad y datos

- **C-12** Autenticación con sesiones guardadas en BD y cookie `httpOnly`, `secure` y `sameSite=lax`. Contraseñas con argon2id. Ninguna respuesta de la API incluye hashes ni tokens de sesión.
- **C-13** La autorización por usuario se hace siempre en services, filtrando por el usuario autenticado. Una tarea ajena responde **404 con el mismo `code` que una inexistente** (nunca 403). Cada operación sobre tareas tiene un test de acceso a una tarea ajena.
- **C-14** Toda entrada externa (body, params, query) se valida con Zod en la capa routes, usando los esquemas de `shared` cuando son compartidos.
- **C-15** Nunca hay secretos en el repositorio. Las variables de entorno se validan con Zod al arrancar la API, que falla si alguna no es válida.
- **C-16** Datos personales mínimos: email, hash de contraseña, sesiones y tareas. Las sesiones caducan. Borrar una cuenta elimina en cascada todos sus datos. No hay analítica ni trackers de terceros.

## 5. Calidad

- **C-17** Cada requisito funcional tiene al menos un test automatizado que lo verifica.
- **C-18** Tests: Vitest para unitarios, con Testing Library para componentes React. Supertest para la API, contra un Postgres de test real (sin mocks de Prisma). Playwright para el flujo principal de punta a punta.
- **C-19** Una tarea solo se da por hecha con tests, linter y comprobación de tipos en verde (`pnpm test`, `pnpm lint`, `pnpm typecheck`).
- **C-20** Accesibilidad: WCAG 2.2 AA en todo componente interactivo (teclado, foco visible, roles ARIA, contraste). Para el contraste del **texto** rige el objetivo AAA de `DESIGN.md` (C-26), que sustituye al AA. Toda acción de arrastrar (por ejemplo, mover una tarjeta entre columnas) tiene una alternativa sin arrastre usable con teclado.

## 6. Simplicidad

- **C-21** Se implementa lo que pide la spec, nada más. Las ideas extra van a "Fuera de alcance" o a una spec nueva.
- **C-22** Se prefiere reutilizar lo existente antes que crear abstracciones nuevas. Una abstracción necesita al menos dos usos reales.

## 7. Convenciones

- **C-23** Código e identificadores en inglés; specs y documentación en castellano. Nombres de ficheros y ramas sin tildes ni `ñ`.
- **C-24** Commits con Conventional Commits, referenciando IDs (`feat(board): T-004 … [spec 003]`). Ramas `feat/NNN-slug` y `fix/NNN-slug`.
- **C-25** Lint con ESLint (flat config, typescript-eslint, plugin de Astro y reglas de hooks de React) y formato con Prettier. `pnpm lint` termina sin errores.

## 8. Interfaz

- **C-26** La interfaz sigue `DESIGN.md`. Precedencia: `DESIGN.md` manda en lo visual (color, tipografía, espaciado, componentes y tono de los textos); esta constitución, en lo técnico; cada spec, en el comportamiento. Su objetivo de contraste para el texto (AAA: texto normal ≥ 7:1, texto grande ≥ 4.5:1, medido sobre la superficie real) sustituye al AA de C-20 para el texto. Salirse de `DESIGN.md` se justifica en el plan de la spec.

## Enmiendas

| Versión | Fecha      | Cambio          | Motivo |
|---------|------------|-----------------|--------|
| 1.0     | 2026-10-28 | Versión inicial | Arranque del proyecto |
| 1.1     | 2026-10-29 | Nuevo C-26 (la interfaz sigue `DESIGN.md`; contraste AAA en texto). C-20 pasa a WCAG 2.2 (como `DESIGN.md`) y remite a C-26 para el contraste del texto. C-3: `engineStrict` se fija en `pnpm-workspace.yaml` en lugar de `.npmrc` | Llega `DESIGN.md` (Tinta & Niebla) como fuente de verdad visual. pnpm 11 ignora `engine-strict` de `.npmrc` (plan 001, D-14) |
