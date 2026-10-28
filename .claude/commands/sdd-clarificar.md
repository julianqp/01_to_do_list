---
description: SDD fase 3 — detectar ambigüedades en la spec y resolverlas con preguntas
argument-hint: [NNN de la spec, opcional]
---

Actúa como revisor crítico de requisitos. Tu trabajo es encontrar lo que falta, lo ambiguo y lo contradictorio en una spec, y resolverlo con el usuario.

Spec indicada: $ARGUMENTS (si está vacío, usa la spec activa según `CLAUDE.md`).

## Pasos

1. Lee la spec, `.sdd/constitution.md` y las specs relacionadas.
2. Analiza por categorías y anota cada hallazgo internamente:
   - Alcance y límites (¿qué entra y qué no?)
   - Actores y permisos
   - Flujos alternativos y errores
   - Datos: formatos, volumen, validaciones, retención
   - Casos límite no cubiertos
   - Requisitos no medibles o con palabras vagas
   - Criterios de aceptación no comprobables
   - Contradicciones internas o con otras specs/constitución
   - Términos usados de forma inconsistente
   - Todas las marcas `[NECESITA ACLARACIÓN]`
3. Prioriza por **impacto × incertidumbre** (lo que más cambiaría el diseño o las pruebas, primero).
4. Haz **como máximo 5 preguntas**, una a una o agrupadas, cada una con:
   - Contexto en una línea (qué parte de la spec afecta).
   - 2–4 opciones concretas (A, B, C…) más "otra".
   - Tu recomendación y por qué.
   Usa la herramienta de preguntas si está disponible.
5. Con cada respuesta, **actualiza la spec en el sitio correcto** (requisito, CA, caso límite, fuera de alcance…), elimina la marca correspondiente y añade una fila en "Aclaraciones".
6. Sube la versión menor (0.1 → 0.2).

## Reglas

- **Los IDs son permanentes** (RF, RNF, CA, E, HU, D, T). Nunca se renumeran ni se reutilizan para otra cosa. Si un elemento se elimina, se deja la línea como `~~RF-010~~ Eliminado: <motivo> (ver Aclaraciones)` y lo nuevo recibe el siguiente número libre.
- No preguntes lo que puedes deducir del código, la constitución u otras specs.
- No preguntes detalles técnicos de implementación (eso es el plan).
- Si tras las 5 preguntas quedan dudas relevantes, dilo y propón otra ronda.

## Al terminar

Muestra: cambios hechos, dudas pendientes (si hay) y, si no queda ninguna, el checklist `.sdd/checklists/revision-spec.md` evaluado punto por punto. Pregunta al usuario si aprueba la spec. **Solo si responde que sí**, cambia `estado: aprobada`, pon la fecha en `aprobada:` y la versión a `1.0`.
