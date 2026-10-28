<!-- SDD:INICIO — bloque gestionado por el kit SDD -->
# Desarrollo guiado por especificaciones (SDD)

Este proyecto sigue Spec-Driven Development. Estas reglas tienen prioridad sobre cualquier costumbre por defecto.

## Fuentes de verdad (léelas antes de actuar)

1. `.sdd/constitution.md` — principios no negociables. Cítalos por su ID (C-x).
2. `specs/roadmap.md` — qué specs hay, en qué orden y con qué dependencias; ideas sin priorizar.
3. `specs/NNN-slug/spec.md` — QUÉ y POR QUÉ de cada feature.
4. `specs/NNN-slug/plan.md` — CÓMO.
5. `specs/NNN-slug/tasks.md` — PASOS y progreso.
6. `docs/adr/` — decisiones de arquitectura transversales.

Plantillas en `.sdd/templates/`, checklists en `.sdd/checklists/`.

## Flujo y comandos

`/sdd-constitucion` → `/sdd-roadmap` → `/sdd-especificar` → `/sdd-clarificar` → ✋ → `/sdd-planificar` → ✋ → `/sdd-tareas` → `/sdd-implementar` → `/sdd-verificar`. Para cambios sobre una spec aprobada: `/sdd-cambiar-spec`.

## Reglas para el agente

- **No escribas código de producción sin una spec `aprobada` y un plan aprobado**, salvo que el usuario lo pida explícitamente para un cambio trivial (typo, dependencia, fix de una línea).
- **No inventes requisitos.** Si falta información, marca `[NECESITA ACLARACIÓN: …]` o pregunta.
- **No avances de fase sin aprobación explícita** del usuario. Al terminar una fase, para y resume.
- **Spec = sin tecnología.** Nada de frameworks, tablas, endpoints ni librerías en `spec.md`.
- **Implementa una tarea cada vez**, test primero, y marca `[x]` en `tasks.md` al acabar.
- **Si la realidad contradice la spec o el plan** (algo no es posible, falta un caso, hay una opción mejor), **para y avisa**. No improvises ni amplíes alcance.
- **Primero la spec, luego el código.** Ningún cambio de comportamiento sin reflejarlo antes en la spec.
- **Haz solo lo que pide la spec.** Las ideas extra van a "Fuera de alcance" y a "Ideas sin priorizar" del roadmap; nunca se quedan solo en el chat.
- **Nada importante vive solo en el chat.** Si se decide algo (orden de specs, una regla, un cambio), se escribe en el fichero que corresponde.
- **Referencia IDs** (RF-xxx, CA-x.y, T-xxx, D-x, C-x) en commits, comentarios de PR y respuestas.
- Antes de dar algo por hecho: tests, linter y tipos en verde.

## Spec activa

Si no se indica otra, la spec activa es la de número más alto en estado distinto de `implementada`/`obsoleta`, o la que coincida con la rama actual (`feat/NNN-slug`).
<!-- SDD:FIN -->

# Proyecto

<!-- Aquí lo específico del proyecto: comandos (dev, test, lint, typecheck, build), estructura, particularidades. -->

## Comandos

- Desarrollo: `pnpm dev`
- Tests: `pnpm test`
- Lint: `pnpm lint`
- Tipos: `pnpm typecheck`
