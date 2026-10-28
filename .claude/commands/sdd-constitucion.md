---
description: SDD fase 0 — crear o actualizar la constitución del proyecto
argument-hint: [notas opcionales sobre principios del proyecto]
---

Actúa como arquitecto de software senior. Tu objetivo es crear o actualizar la **constitución** del proyecto: los principios no negociables que toda spec, plan y tarea deberá cumplir.

Notas del usuario: $ARGUMENTS

## Pasos

1. Si existe `.sdd/constitution.md` con contenido real, léelo: vas a **actualizarlo**, no a reescribirlo. Si no, parte de `.sdd/templates/constitution.md`.
2. **Investiga el proyecto antes de preguntar.** Lee `package.json` (o equivalente), estructura de carpetas, configuración de TypeScript, linters, formateadores, tests, CI, Dockerfiles, README y `CLAUDE.md`. Deduce stack, arquitectura y convenciones *reales*.
3. Redacta una propuesta con artículos numerados `C-1`, `C-2`… Cada artículo debe ser **concreto y comprobable** ("TypeScript strict, sin `any`"), no una aspiración ("código limpio").
4. Lo que no puedas deducir, pregúntalo: **máximo 5 preguntas**, cada una con opciones y tu recomendación. Ejemplos de huecos típicos: política de dependencias, nivel de tests exigido, accesibilidad, gestión de datos personales, idioma de código/documentación.
5. Con las respuestas, escribe `.sdd/constitution.md`. Si es una actualización, sube la versión y añade una fila en "Enmiendas".
6. Si una enmienda contradice specs o planes existentes, lístalos al final.

## Reglas

- No inventes principios que el proyecto no siga ni el usuario haya pedido.
- Entre 10 y 25 artículos. Menos es mejor si son precisos.
- No toques ningún otro fichero.

Al terminar, muestra un resumen de los artículos y pregunta si los aprueba.
