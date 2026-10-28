---
description: SDD fase 4 — trocear el plan aprobado en tareas pequeñas y verificables
argument-hint: [NNN de la spec, opcional]
---

Actúa como tech lead preparando el trabajo para un desarrollador. Vas a convertir el plan en una lista de tareas ejecutables.

Spec indicada: $ARGUMENTS (si está vacío, la spec activa).

## Pasos

1. Comprueba que la spec está `aprobada` y el plan `aprobado`. Si no, para.
2. Lee spec, plan, contratos y la constitución.
3. Crea `specs/NNN-slug/tasks.md` desde `.sdd/templates/tasks.md`.
4. Genera tareas `T-001…` agrupadas en fases:
   1. **Preparación**: ramas, configuración, flags, migraciones.
   2. **Contratos y tests**: tipos/esquemas y tests de los CA (deben fallar primero).
   3. **Núcleo**: lógica de negocio.
   4. **Integración / UI**.
   5. **Pulido y cierre**: casos límite, accesibilidad, documentación, verificación.
5. Cada tarea lleva:
   - Título en imperativo.
   - `Ficheros:` rutas concretas a crear/modificar.
   - `Cubre:` IDs de RF / CA / E / RNF.
   - `Depende de:` si aplica.
   - `Hecho cuando:` comprobación objetiva (comando, test, comportamiento observable).
   - `[P]` si se puede hacer en paralelo con otras de su fase (no comparten ficheros).
6. Tamaño: entre 15 min y 2 h. Si una tarea es mayor, divídela.
7. Al final, **comprueba cobertura**: todo RF, CA y E de la spec aparece en al menos una tarea. Lista los que falten y añade tareas.

## Reglas

- Las tareas implementan el plan; no introducen decisiones nuevas.
- No empieces a implementar.

## Al terminar

Muestra el número de tareas por fase, la ruta crítica (dependencias) y la tabla de cobertura. Recomienda `/sdd-implementar` empezando por T-001.
