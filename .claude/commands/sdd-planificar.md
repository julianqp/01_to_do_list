---
description: SDD fase 4 — diseñar el plan técnico (CÓMO) a partir de una spec aprobada
argument-hint: [restricciones o preferencias técnicas opcionales]
---

Actúa como arquitecto/tech lead senior. Vas a diseñar **cómo** se implementa una spec aprobada, dentro de la arquitectura existente.

Indicaciones técnicas del usuario: $ARGUMENTS

## Pasos

1. Localiza la spec activa (ver `CLAUDE.md`). **Si su estado no es `aprobada`, para** y recomienda `/sdd-clarificar`.
2. Lee: la spec completa, `.sdd/constitution.md`, ADRs de `docs/adr/`, specs relacionadas y, si la spec toca la interfaz, `DESIGN.md` (si existe). El plan debe usar sus tokens y componentes; cada desviación se justifica como cualquier otra decisión.
3. **Explora el código** que vaya a verse afectado: estructura, módulos similares, utilidades reutilizables, tipos existentes, patrones de tests. Anota rutas concretas. No diseñes en abstracto.
4. Si hay incógnitas técnicas (una API externa, una librería, rendimiento), investígalas y resume en `specs/NNN-slug/research.md`.
5. Crea `specs/NNN-slug/plan.md` desde `.sdd/templates/plan.md` y rellénalo:
   - Resumen del enfoque.
   - Contexto técnico con rutas reales de código a reutilizar.
   - **Comprobación de constitución** artículo por artículo.
   - Diseño: flujo, modelo de datos, contratos (tipos, API, props), módulos nuevos/modificados.
   - **Decisiones `D-x`** con su porqué y alternativas descartadas.
   - **Tabla de trazabilidad**: cada RF, RNF y E de la spec → cómo se cumple → cómo se prueba. No puede faltar ninguno.
   - Estrategia de pruebas, riesgos, despliegue/rollback.
6. Si el diseño necesita contratos extensos (OpenAPI, esquemas), ponlos en `specs/NNN-slug/contracts/`.
7. Si alguna decisión es transversal al proyecto, propón un ADR (no lo crees sin confirmación).

## Reglas

- **La opción más simple que cumple la spec.** Toda abstracción, capa o dependencia extra se justifica.
- No añadas funcionalidades que no estén en la spec.
- Si descubres que la spec es incompleta, contradictoria o inviable técnicamente, **para y avisa**; propón el cambio de spec en vez de resolverlo en el plan.
- No escribas código de producción. Fragmentos de tipos/firmas en el plan, sí.

## Al terminar

Resume el enfoque, las decisiones clave, riesgos y excepciones a la constitución. Evalúa `.sdd/checklists/revision-plan.md`. Pregunta si aprueba el plan; **solo si dice que sí**, pon `estado: aprobado` y la fecha.

**Commit:** termina con el bloque «Commit sugerido» de `CLAUDE.md` para lo que ha cambiado en esta fase. **No hagas el commit.**
