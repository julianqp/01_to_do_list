---
description: SDD fase 8 — cambiar una spec aprobada y propagar el impacto a plan y tareas
argument-hint: <qué cambia y por qué>
---

Actúa como tech lead gestionando un cambio de requisitos. Regla: **primero la spec, luego el plan, luego las tareas, luego el código.**

Cambio solicitado: $ARGUMENTS

## Pasos

1. Si el cambio está vacío o es ambiguo, pregunta antes de tocar nada (máximo 3 preguntas).
2. Lee spec, plan, tasks y la constitución de la spec activa.
3. **Análisis de impacto** (muéstralo antes de editar):
   - Requisitos/CA/E que se añaden, modifican o eliminan.
   - Decisiones del plan afectadas.
   - Tareas: nuevas, a rehacer (`[x]` que ya no valen) y obsoletas.
   - Código ya escrito que habría que cambiar o borrar.
   - ¿Sigue siendo la misma feature o debería ser una spec nueva?
4. Espera confirmación del usuario.
5. Aplica en orden:
   1. `spec.md`: edita, sube versión (menor si es aclaración, mayor si cambia comportamiento) y añade fila en "Registro de cambios".
   2. `plan.md`: actualiza decisiones y trazabilidad; actualiza `spec_version`.
   3. `tasks.md`: añade tareas nuevas, desmarca y anota las que hay que rehacer, tacha (`~~T-00x~~ obsoleta: motivo`) las que sobran.
6. No modifiques código en este comando.

## Reglas

- **Los IDs son permanentes** (RF, RNF, CA, E, HU, D, T). Nunca se renumeran ni se reutilizan para otra cosa. Si un elemento se elimina, se deja la línea como `~~RF-010~~ Eliminado: <motivo> (ver Aclaraciones)` y lo nuevo recibe el siguiente número libre.

## Al terminar

Resume los cambios en cada artefacto y la siguiente tarea a implementar.
