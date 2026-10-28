---
proyecto: to-do-list
actualizado: 2026-10-28
---

# Roadmap

> El troceo del producto en specs, en orden. Es la fuente de verdad de **qué se hace y en qué orden**; el detalle de cada una está en su `spec.md`.
> - El número se reserva aquí y es el que usará la carpeta `specs/NNN-slug/`.
> - Estados: `pendiente` (aún sin spec) · `en curso` (tiene spec, en cualquier fase) · `hecha` (spec `implementada`) · `descartada`.
> - Cada spec debe aportar valor por sí sola y poder probarse sin las siguientes.

## Specs planificadas

| Spec | Título | Depende de | Estado | Por qué en este orden |
|------|--------|------------|--------|-----------------------|
| 001  | Cuentas de usuario | — | pendiente | Todo lo demás depende de saber quién es el usuario. Incluye montar el esqueleto del proyecto |
| 002  | Tablero de tareas | 001 | pendiente | Crear, ver por columnas, editar, borrar y cambiar de estado sin arrastrar. Con esta spec la app ya es útil |
| 003  | Arrastrar y soltar | 002 | pendiente | Mejora de uso con más riesgo (accesibilidad, orden dentro de la columna). Si se retrasa, la 002 ya funciona |

## Ideas sin priorizar

Lo que sale durante el trabajo y no entra en ninguna spec (incluido lo que acaba en "Fuera de alcance"). Se revisan al cerrar cada spec.

- Recuperar o cambiar la contraseña — *origen: conversación de arranque*
- Borrar la cuenta (la constitución C-14 ya fija que el borrado es en cascada) — *origen: revisión de la constitución*
- Despliegue en un entorno real (requiere ADR, ver C-5) — *origen: constitución*

## Historial

| Fecha | Cambio | Motivo |
|-------|--------|--------|
| 2026-10-28 | Roadmap inicial con 001–003 | Troceo acordado al arrancar el proyecto |
