---
description: SDD fase 6 — implementar la siguiente tarea (o la indicada) con test primero
argument-hint: [T-00x | T-00x..T-00y | "fase N" | vacío = siguiente pendiente] [con commit por tarea]
---

Actúa como desarrollador senior disciplinado. Implementas **exactamente** lo que dice la tarea, con test primero, y paras.

Indicación del usuario: $ARGUMENTS

- Vacío → la primera tarea pendiente cuyas dependencias estén completas.
- `T-00x` → esa tarea.
- `T-00x..T-00y`, una lista (`T-024 T-025 T-027`) o `fase N` → **modo lote** (ver abajo).
- Si incluye "con commit" o "commit por tarea", estás autorizado a hacer un commit al cerrar cada tarea.

## Pasos

1. Lee `tasks.md` de la spec activa, localiza la tarea y comprueba sus dependencias. Si alguna dependencia no está `[x]`, avisa y para.
2. Lee la parte de `spec.md` y `plan.md` que la tarea referencia (RF, CA, D-x) y `.sdd/constitution.md`.
3. Lee los ficheros que vas a tocar y sus vecinos para seguir los patrones existentes.
4. **Test primero**: escribe o ajusta el test que verifica el "Hecho cuando" / los CA cubiertos. Ejecútalo y confirma que falla por la razón correcta.
5. Implementa **lo mínimo** para que pase, siguiendo el plan.
6. Ejecuta tests, linter y comprobación de tipos (comandos en `CLAUDE.md`). Arregla hasta que todo esté en verde.
7. Marca la tarea `[x]` en `tasks.md`, actualiza `progreso` y si `estado` de la spec era `aprobada`, cámbialo a `en-implementacion`.
8. Anota en el **Registro** de `tasks.md` lo relevante: versiones reales instaladas, nombres que el plan no fijaba, problemas encontrados y cómo se resolvieron. Si cambia o se añade una decisión técnica, regístrala también en el plan como `D-x (añadida en T-00x)`.
9. Propón un mensaje de commit: `<tipo>(<ámbito>): T-00x <resumen> [spec NNN]`. Commitea solo si el usuario lo ha pedido o lo indica `CLAUDE.md`.

## Modo lote (varias tareas)

1. Antes de empezar, enseña la lista de tareas que vas a hacer, en el orden en que las harás (respetando "Depende de"), y empieza sin esperar confirmación salvo que alguna tenga una dependencia pendiente fuera del lote.
2. Haz las tareas **de una en una y en orden**, aplicando a cada una los pasos 1–9 completos. No mezcles el trabajo de dos tareas.
3. **Cierra cada tarea antes de abrir la siguiente:** tests, linter y tipos en verde; `[x]` y Registro en `tasks.md`; y, si estás autorizado, **un commit por tarea** (nunca uno para varias).
4. **Para el lote y avisa** en cuanto ocurra cualquiera de estas cosas:
   - algo no encaja con la spec o el plan, o hay que tomar una decisión que el plan no recoge;
   - una tarea no queda en verde tras un intento razonable de arreglarla;
   - una tarea es un punto de control (su "Hecho cuando" dice que se pare y se avise, o es una comprobación de punta a punta);
   - una tarea necesita un comando que instala dependencias, cambia la base de datos o toca Docker y el usuario no lo ha autorizado en este lote;
   - llevas 6 tareas en esta sesión: para y recomienda `/clear` antes de seguir.
5. Al terminar (o al parar), muestra una tabla: tarea · estado · commit · notas, y la siguiente tarea disponible.

## Reglas

- **Una tarea por ejecución, salvo en modo lote.** No te adelantes a tareas que no se te han pedido.
- No toques ficheros fuera de los que indica la tarea salvo que sea imprescindible; si lo es, dilo.
- No amplíes alcance ni "mejores" cosas que no pide la tarea.
- **Si la spec o el plan están mal, son incompletos o inviables, PARA.** Explica el problema y propón `/sdd-cambiar-spec` o un ajuste del plan. No improvises la solución.
- Si una decisión de implementación se desvía del plan, anótala en el plan (sección de decisiones) y avísalo.

## Al terminar

Muestra: tarea completada, ficheros tocados, tests añadidos y su resultado, cualquier desviación, y la siguiente tarea disponible.
