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
| 001  | Cuentas de usuario | — | en curso | Todo lo demás depende de saber quién es el usuario. Incluye montar el esqueleto del proyecto |
| 002  | Tablero de tareas | 001 | pendiente | Crear, ver por columnas, editar, borrar y cambiar de estado sin arrastrar. Con esta spec la app ya es útil |
| 003  | Arrastrar y soltar | 002 | pendiente | Mejora de uso con más riesgo (accesibilidad, orden dentro de la columna). Si se retrasa, la 002 ya funciona |

## Ideas sin priorizar

Lo que sale durante el trabajo y no entra en ninguna spec (incluido lo que acaba en "Fuera de alcance"). Se revisan al cerrar cada spec.

- Recuperar o cambiar la contraseña — *origen: conversación de arranque*
- Borrar la cuenta (la constitución C-16 ya fija que el borrado es en cascada) — *origen: revisión de la constitución*
- Despliegue en un entorno real (requiere ADR, ver C-6) — *origen: constitución*
- Cambiar el email de la cuenta — *origen: spec 001, fuera de alcance*
- Verificar el email con un correo de confirmación — *origen: spec 001, fuera de alcance*
- Inicio de sesión con proveedores externos y doble factor — *origen: spec 001, fuera de alcance*
- Casilla "Recordarme" / duración de sesión elegida por el usuario — *origen: spec 001, fuera de alcance*
- Ver y cerrar las sesiones abiertas en otros navegadores — *origen: spec 001, fuera de alcance*
- Perfil de usuario (nombre, foto, preferencias) — *origen: spec 001, fuera de alcance*
- Roles o cuentas de administrador — *origen: spec 001, fuera de alcance*
- Interfaz en otros idiomas — *origen: spec 001, fuera de alcance*
- Limitar los intentos fallidos de inicio de sesión (revisar con el ADR de despliegue) — *origen: spec 001, aclaración*

## Historial

| Fecha | Cambio | Motivo |
|-------|--------|--------|
| 2026-10-28 | Roadmap inicial con 001–003 | Troceo acordado al arrancar el proyecto |
| 2026-10-28 | 001 pasa a `en curso`; ideas nuevas desde su "Fuera de alcance" | `/sdd-especificar` de la spec 001 |
| 2026-10-28 | 001 aclarada (v0.2) | `/sdd-clarificar` de la spec 001 |
