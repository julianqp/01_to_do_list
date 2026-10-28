---
description: SDD fase 2 — crear la spec (QUÉ y POR QUÉ) de una feature nueva
argument-hint: [descripción de la feature, o vacío = siguiente spec del roadmap]
---

Actúa como analista de producto senior. Vas a escribir la **especificación funcional** de una feature. Solo QUÉ y POR QUÉ; nada de CÓMO.

Descripción del usuario:

$ARGUMENTS

## Pasos

1. Lee `.sdd/constitution.md`, `specs/roadmap.md` y lista las specs existentes en `specs/` (títulos y estados) para detectar solapamientos o dependencias.
2. Decide qué spec es, usando el roadmap:
   - **Descripción vacía:** coge la primera spec `pendiente` del roadmap cuyas dependencias estén `hecha`. Si no hay roadmap o no hay ninguna disponible, pide al usuario que describa la feature y para.
   - **La descripción corresponde a una spec del roadmap:** usa su número y título.
   - **No está en el roadmap:** dilo y pregunta si añadirla (con el siguiente número libre entre roadmap y `specs/`) antes de seguir. Si no existe roadmap, recomienda `/sdd-roadmap`, pero continúa si el usuario lo prefiere.
   - **Dependencias:** si alguna dependencia no está `hecha`, avisa. Se puede especificar igualmente, pero no planificar ni implementar hasta que lo esté.
3. Crea `specs/NNN-slug/spec.md` a partir de `.sdd/templates/spec.md` (slug corto en kebab-case, sin tildes ni `ñ`). En el roadmap, pon su estado a `en curso`.
4. Rellena la spec:
   - **Contexto y problema**: reformula la necesidad en términos de usuario.
   - **Historias de usuario** con prioridad P1/P2/P3. Cada una entregable y comprobable por sí sola.
   - **Criterios de aceptación** Dado/Cuando/Entonces con valores concretos, incluyendo escenarios negativos.
   - **Requisitos funcionales** `RF-001…` en formato EARS, atómicos, cada uno ligado a una historia.
   - **Requisitos no funcionales** `RNF-…` solo si aplican, siempre con valores medibles.
   - **Casos límite** `E-…`: piensa en vacío, uno, muchos, máximo, permisos, red, entrada inválida, concurrencia, zona horaria, idioma.
   - **Fuera de alcance**: sé explícito; incluye lo que el usuario podría asumir y no se va a hacer.
   - **Glosario**, **dependencias** y **supuestos**.
5. Todo lo que no sepas con certeza: `[NECESITA ACLARACIÓN: pregunta concreta]` en el sitio exacto. **Máximo 5 marcas**: para lo menos importante, elige un valor razonable y anótalo en "Supuestos".
6. Estado `borrador`, versión `0.1`, fecha de hoy.

## Reglas estrictas

- **Prohibido** mencionar tecnologías, frameworks, librerías, tablas, endpoints, nombres de componentes o ficheros de código.
- Prohibidas las palabras vagas: rápido, fácil, intuitivo, robusto, adecuado, etc., debería, si es posible.
- No inventes funcionalidades que el usuario no haya pedido; si se te ocurren, ponlas en "Fuera de alcance" y añádelas a "Ideas sin priorizar" del roadmap.
- Si la feature es demasiado grande (más de ~5 historias P1 o más de ~3 páginas), propón dividirla en varias specs antes de seguir.
- No escribas código ni crees otros ficheros (salvo actualizar el roadmap).

## Al terminar

Muestra: ruta de la spec, resumen de historias, lista de `[NECESITA ACLARACIÓN]` y supuestos. Recomienda ejecutar `/sdd-clarificar`.
