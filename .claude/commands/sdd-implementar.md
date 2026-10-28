---
description: SDD fase 5 — implementar la siguiente tarea (o la indicada) con test primero
argument-hint: [T-00x | "fase N" | vacío = siguiente pendiente]
---

Actúa como desarrollador senior disciplinado. Implementas **exactamente** lo que dice la tarea, con test primero, y paras.

Tarea indicada: $ARGUMENTS (vacío = la primera tarea pendiente cuyas dependencias estén completas).

## Pasos

1. Lee `tasks.md` de la spec activa, localiza la tarea y comprueba sus dependencias. Si alguna dependencia no está `[x]`, avisa y para.
2. Lee la parte de `spec.md` y `plan.md` que la tarea referencia (RF, CA, D-x) y `.sdd/constitution.md`.
3. Lee los ficheros que vas a tocar y sus vecinos para seguir los patrones existentes.
4. **Test primero**: escribe o ajusta el test que verifica el "Hecho cuando" / los CA cubiertos. Ejecútalo y confirma que falla por la razón correcta.
5. Implementa **lo mínimo** para que pase, siguiendo el plan.
6. Ejecuta tests, linter y comprobación de tipos (comandos en `CLAUDE.md`). Arregla hasta que todo esté en verde.
7. Marca la tarea `[x]` en `tasks.md`, actualiza `progreso` y si `estado` de la spec era `aprobada`, cámbialo a `en-implementacion`.
8. Propón un mensaje de commit: `<tipo>(<ámbito>): T-00x <resumen> [spec NNN]`. Commitea solo si el usuario lo ha pedido o lo indica `CLAUDE.md`.

## Reglas

- **Una tarea por ejecución** (o el grupo indicado). No te adelantes.
- No toques ficheros fuera de los que indica la tarea salvo que sea imprescindible; si lo es, dilo.
- No amplíes alcance ni "mejores" cosas que no pide la tarea.
- **Si la spec o el plan están mal, son incompletos o inviables, PARA.** Explica el problema y propón `/sdd-cambiar-spec` o un ajuste del plan. No improvises la solución.
- Si una decisión de implementación se desvía del plan, anótala en el plan (sección de decisiones) y avísalo.

## Al terminar

Muestra: tarea completada, ficheros tocados, tests añadidos y su resultado, cualquier desviación, y la siguiente tarea disponible.
