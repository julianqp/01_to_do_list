---
proyecto: to-do-list
actualizado: 2026-10-31
---

# Roadmap

> El troceo del producto en specs, en orden. Es la fuente de verdad de **qué se hace y en qué orden**; el detalle de cada una está en su `spec.md`.
> - El número se reserva aquí y es el que usará la carpeta `specs/NNN-slug/`.
> - Estados: `pendiente` (aún sin spec) · `en curso` (tiene spec, en cualquier fase) · `hecha` (spec `implementada`) · `descartada`.
> - Cada spec debe aportar valor por sí sola y poder probarse sin las siguientes.

## Specs planificadas

| Spec | Título | Depende de | Estado | Por qué en este orden |
|------|--------|------------|--------|-----------------------|
| 001  | Cuentas de usuario | — | hecha | Todo lo demás depende de saber quién es el usuario. Incluye montar el esqueleto del proyecto |
| 004  | Aplicar el sistema de diseño | 001 | hecha | Da a inicio de sesión, registro y zona privada el aspecto de `DESIGN.md`, con texto más legible (contraste AAA), y deja listos los valores visuales comunes. Va antes de la 002 para que el tablero nazca ya con el sistema de diseño y no haya que rehacerlo |
| 002  | Tablero de tareas | 001, 004 | hecha | Crear, ver por columnas, editar, borrar y cambiar de estado sin arrastrar. Con esta spec la app ya es útil |
| 003  | Arrastrar y soltar | 002 | en curso | Mejora de uso con más riesgo (accesibilidad, orden dentro de la columna). Si se retrasa, la 002 ya funciona |

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
- ~~Enlaces entre las pantallas de inicio de sesión y registro~~ → entra en la spec 001 v2.0 (RF-019) — *origen: spec 001, T-036*
- Roles o cuentas de administrador — *origen: spec 001, fuera de alcance*
- Interfaz en otros idiomas — *origen: spec 001, fuera de alcance*
- Limitar los intentos fallidos de inicio de sesión (revisar con el ADR de despliegue) — *origen: spec 001, aclaración*
- Compatibilidad con Firefox (la app no se va a usar con Firefox; el Firefox de Playwright no arrancaba en macOS 27) — *origen: spec 001 v1.2, fuera de alcance*
- ~~Aviso en la zona privada cuando no se puede contactar con el servidor~~ → entra en la spec 002 (RF-008) — *origen: spec 001, `/sdd-verificar` (M-3)*
- Reescribir los textos de la spec 001 con la voz de `DESIGN.md` §15 (p. ej. «Este campo es obligatorio») — *origen: spec 004, fuera de alcance (`DESIGN.md`, «Pendiente de decidir» 2)*
- Selector de tema claro/oscuro dentro de la app — *origen: spec 004, fuera de alcance*
- Esqueleto de carga mientras se comprueba la sesión o se cargan las tareas del tablero (solo tiene sentido si tarda más de 300 ms; revisar con el ADR de despliegue) — *origen: specs 004 y 002, fuera de alcance*
- Botón para mostrar u ocultar la contraseña en los formularios de acceso — *origen: spec 004, fuera de alcance*
- Probar en navegadores móviles reales (Safari en iOS, Chrome en Android), no solo con la ventana de escritorio estrecha — *origen: spec 004, fuera de alcance*
- Deuda de la spec 004 según su verificación (`specs/004-sistema-de-diseno/verificacion.md`). Revisarla al planificar la 002, que reutiliza el catálogo y el menú:
  - el test de contraste no mide el texto que queda debajo de un panel sin blur (I-1);
  - el test de reglas no vigila la escala de espaciado ni los literales de `global.css` (M-2, m-1);
  - la posición del panel del menú está copiada a mano de la altura de la cabecera (m-2);
  - axe sin `wcag21a` y sin las pantallas de acceso a 375 (M-8);
  - el E2E de E-4 es débil (M-9);
  - WebKit es intermitente con el servidor de desarrollo (M-7, D-20) — *origen: spec 004, `/sdd-verificar`*
- Cambiar el estado de una tarea directamente desde su tarjeta, sin abrir el detalle — *origen: spec 002, fuera de alcance*
- Deshacer el borrado de una tarea (aviso con «Deshacer», §12) — *origen: spec 002, fuera de alcance*
- Avisos de éxito tipo toast al crear, guardar o borrar una tarea — *origen: spec 002, fuera de alcance*
- Buscar, filtrar u ordenar las tareas — *origen: spec 002, fuera de alcance*
- Etiquetas, prioridades, subtareas, comentarios o adjuntos en las tareas — *origen: spec 002, fuera de alcance*
- Recordatorios o notificaciones de fechas — *origen: spec 002, fuera de alcance*
- Archivar u ocultar las tareas terminadas — *origen: spec 002, fuera de alcance*
- Estados o columnas personalizados — *origen: spec 002, fuera de alcance*
- Compartir tareas o tableros con otros usuarios — *origen: spec 002, fuera de alcance*
- Formato en la descripción de la tarea (negritas, listas, enlaces) — *origen: spec 002, fuera de alcance*
- Recalcular «Retrasada» al cambiar el día sin volver a cargar el tablero — *origen: spec 002, fuera de alcance*
- Selector de fecha en calendario (§14) para las fechas de la tarea — *origen: spec 002, fuera de alcance*
- Cambiar de columna deslizando el dedo en móvil (§4) — *origen: spec 002, supuestos*
- Elegir el estado al crear una tarea, o crearla desde una columna concreta — *origen: spec 002, aclaración*
- Trabajar sin conexión o guardar los cambios para enviarlos después (§12) — *origen: spec 002, fuera de alcance*
- Mover varias tarjetas a la vez — *origen: spec 003, fuera de alcance*
- Reordenar las columnas arrastrándolas — *origen: spec 003, fuera de alcance*
- Deshacer un movimiento de tarjeta (aviso con «Deshacer», §12) — *origen: spec 003, fuera de alcance*
- Avisos de éxito tipo toast al mover una tarea — *origen: spec 003, fuera de alcance*
- Ver en tiempo real los cambios hechos en otra pestaña u otro dispositivo — *origen: spec 003, fuera de alcance*
- Límite de tareas por columna — *origen: spec 003, fuera de alcance*
- Arrastrar tarjetas fuera del tablero o soltar ficheros en él — *origen: spec 003, fuera de alcance*
- Pasar una tarjeta a otra columna arrastrándola en móvil (por ejemplo, soltándola sobre el selector de estados) — *origen: spec 003, aclaración*
- Acciones «Subir» y «Bajar» en el detalle de la tarea — *origen: spec 003, aclaración*

## Historial

| Fecha | Cambio | Motivo |
|-------|--------|--------|
| 2026-10-28 | Roadmap inicial con 001–003 | Troceo acordado al arrancar el proyecto |
| 2026-10-28 | 001 pasa a `en curso`; ideas nuevas desde su "Fuera de alcance" | `/sdd-especificar` de la spec 001 |
| 2026-10-28 | 001 aclarada (v0.2) | `/sdd-clarificar` de la spec 001 |
| 2026-10-29 | 001 pasa a v1.2: Firefox sale de RNF-004 y va a "Ideas sin priorizar"; RNF-001 se comprueba solo con tests automáticos | `/sdd-cambiar-spec` de la spec 001, tras `/sdd-verificar` |
| 2026-10-29 | 001 pasa a v2.0: RF-019 (enlaces entre inicio de sesión y registro), que sale de "Ideas sin priorizar" | `/sdd-cambiar-spec` de la spec 001, observación I-1 de `/sdd-verificar` |
| 2026-10-29 | 001 `hecha` (spec v2.0 `implementada`, APTO CON OBSERVACIONES); idea nueva desde su verificación (M-3). Ya estaba en las ideas todo lo de su "Fuera de alcance" | `/sdd-verificar` de la spec 001 |
| 2026-10-29 | Nueva 004 «Aplicar el sistema de diseño», ordenada antes de la 002; la 002 pasa a depender también de la 004 | Llega `DESIGN.md` y la constitución v1.1 (C-26) lo hace obligatorio; las pantallas de la 001 no lo cumplen |
| 2026-10-29 | 004 pasa a `en curso` (spec v0.1); ideas nuevas desde su «Fuera de alcance» | `/sdd-especificar` de la spec 004 |
| 2026-10-29 | 004 aclarada (v0.2) | `/sdd-clarificar` de la spec 004 |
| 2026-10-29 | 004 aclarada (v0.3), segunda ronda | `/sdd-clarificar` de la spec 004 |
| 2026-10-29 | 004 aprobada (spec v1.0) | Aprobación del usuario tras `/sdd-clarificar` |
| 2026-10-29 | 004 vuelve a `borrador` (v0.4): HU-6 pasa a RNF-006 y referencias `NNN/ID`; la 001 anota en su registro lo que le cambia la 004 | Revisión del usuario antes de aprobar |
| 2026-10-29 | 004 aprobada de nuevo (spec v1.0) | Aprobación del usuario tras la revisión de la v0.4 |
| 2026-10-29 | 004: plan aprobado; spec v1.1 (E-12: el foco vuelve al botón de cuenta si falla el cierre de sesión); ADR-0003 (catálogo de tokens vigilado por tests) | `/sdd-planificar` de la spec 004 |
| 2026-10-29 | 004 `hecha` (spec v1.1 `implementada`, APTO CON OBSERVACIONES tras una primera verificación NO APTO por B-1, resuelta en T-027–T-029); ideas nuevas: navegadores móviles reales (de su «Fuera de alcance») y la deuda de su verificación | `/sdd-verificar` de la spec 004 |
| 2026-10-29 | 002 pasa a `en curso` (spec v0.1); entra en ella el aviso de carga fallida (antes en ideas); ideas nuevas desde su «Fuera de alcance» | `/sdd-especificar` de la spec 002 |
| 2026-10-30 | 002 aclarada (v0.2); la 004 anota en su registro que la 002 cambia su título grande a «Tablero» | `/sdd-clarificar` de la spec 002 |
| 2026-10-30 | 002 aprobada (spec v1.0) | Aprobación del usuario tras `/sdd-clarificar` |
| 2026-10-30 | 002: plan aprobado (sin ADR nuevo); `DESIGN.md` pasará a 1.3.0-todo.1 en su rama (plan §4.6) | `/sdd-planificar` de la spec 002 |
| 2026-10-31 | 002 `hecha` (spec v1.1 `implementada`, APTO en la segunda verificación; la primera, APTO CON OBSERVACIONES, se resolvió en T-030–T-035). Spec v1.1 (aclaración de §10) y `DESIGN.md` 1.3.1-todo.1. Ideas: «Trabajar sin conexión» (de su «Fuera de alcance») y el esqueleto de carga se amplía al tablero. La PR #2 se fusionó antes de verificar; el cierre va en una PR de seguimiento | `/sdd-verificar` de la spec 002 |
| 2026-10-31 | 003 pasa a `en curso` (spec v0.1); ideas nuevas desde su «Fuera de alcance». La 003 sustituye el orden por creación de la 002 (002/RF-002) por un orden manual | `/sdd-especificar` de la spec 003 |
| 2026-10-31 | 003 aclarada (v0.2); ideas nuevas desde su «Fuera de alcance» (arrastrar entre columnas en móvil, «Subir»/«Bajar» en el detalle) | `/sdd-clarificar` de la spec 003 |
| 2026-10-31 | 003 aprobada (spec v1.0) | Aprobación del usuario tras `/sdd-clarificar` |
