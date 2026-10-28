---
description: SDD fase 1 — crear o reordenar el roadmap (troceo del producto en specs)
argument-hint: [descripción del producto o del cambio en el roadmap]
---

Actúa como product manager técnico. Tu objetivo es mantener `specs/roadmap.md`: la lista ordenada de specs en que se divide el producto.

Indicaciones del usuario: $ARGUMENTS

## Pasos

1. Lee `.sdd/constitution.md`, `specs/roadmap.md` si existe, y los títulos y estados de las specs de `specs/`.
2. **Si no existe el roadmap**, créalo desde `.sdd/templates/roadmap.md`:
   - Si las indicaciones no describen el producto, pide al usuario que lo haga y para.
   - Propón un troceo en specs siguiendo estas reglas:
     - Cada spec es una **porción vertical**: aporta valor a la persona usuaria y se puede probar sola (no "el backend" y "el frontend" por separado).
     - Primero lo que es dependencia de todo lo demás (p. ej. cuentas de usuario).
     - Lo antes posible, una spec con la que el producto ya sea usable.
     - Las mejoras complejas o arriesgadas, en specs aparte al final.
     - Tamaño orientativo: de 1 a 5 historias de usuario por spec.
   - Para cada spec: número, título en lenguaje de usuario, dependencias y por qué va en ese orden.
3. **Si ya existe**, aplica el cambio pedido (añadir, reordenar, dividir, descartar, mover una idea a spec):
   - No cambies el número de una spec que ya tiene carpeta en `specs/`.
   - Los números nuevos son el siguiente libre entre el roadmap y `specs/`.
   - Una spec descartada se queda en la tabla con estado `descartada`.
   - Añade una fila al "Historial".
4. Sincroniza estados: si una spec tiene carpeta, su estado es `en curso` o `hecha` (si su `spec.md` está `implementada`).
5. Señala riesgos del troceo: dependencias circulares, specs demasiado grandes, specs que no aportan valor por sí solas.

## Reglas

- No escribas specs ni código; solo el roadmap.
- Nada de tecnología en los títulos ni en los motivos.

## Al terminar

Muestra la tabla, explica brevemente el orden y pregunta si lo aprueba. Recomienda `/sdd-especificar` con la primera spec `pendiente`.
