---
id: 002
titulo: Tablero de tareas
estado: en-implementacion # borrador | aprobada | en-implementacion | implementada | obsoleta
version: 1.0
autor: Julian Querol Polo
creada: 2026-10-29
aprobada: 2026-10-30, Julian Querol Polo
ticket:
---

# Spec 002 · Tablero de tareas

> Esta spec describe QUÉ y POR QUÉ. No contiene decisiones técnicas (eso va en `plan.md`).
> Lo que no se sepa se marca con `[NECESITA ACLARACIÓN: pregunta concreta]`. No se inventa.
> Lo visual (colores, tamaños, radios, sombras, iconos, tono) lo fija `DESIGN.md` (C-26); esta spec fija **qué pasa, cuándo y con qué texto**. Las referencias «§n» son a `DESIGN.md`; las de otras specs, con el formato `NNN/ID`.

## 1. Contexto y problema

Hoy una persona puede crear su cuenta y entrar en su zona privada (spec 001), que ya tiene el aspecto del sistema de diseño (spec 004), pero la zona privada está vacía: no hay forma de apuntar una tarea. Sin eso, la app no sirve para nada. Esta spec añade el tablero: cada usuario crea sus tareas, las ve repartidas en cuatro columnas según su estado, las edita, las cambia de estado sin arrastrar y las borra. Además, el tablero avisa de las tareas cuya fecha estimada de fin ya ha pasado. Nadie ve ni toca las tareas de otra persona (C-13). Arrastrar las tarjetas queda para la spec 003.

## 2. Objetivos

- El usuario ve todas sus tareas, y solo las suyas, repartidas en las columnas Backlog, To do, In progress y Done.
- El usuario puede crear, editar, cambiar de estado y borrar una tarea, todo con teclado y sin arrastrar.
- El usuario distingue a simple vista qué tareas están retrasadas, sin depender solo del color.
- El tablero se usa sin perder contenido entre 320 y 1600 px de ancho.

## 3. Usuarios y actores

| Actor | Descripción | Qué necesita |
|-------|-------------|--------------|
| Usuario | Persona con sesión iniciada (spec 001) | Apuntar sus tareas, ver en qué estado está cada una y mantenerlas al día |

## 4. Historias de usuario

En los ejemplos, hoy es el 29/10/2026 en el navegador del usuario.

### HU-1 · Ver mi tablero (P1)

Como usuario, quiero ver mis tareas repartidas en columnas según su estado, para saber de un vistazo qué tengo pendiente, en curso y terminado.

**Criterios de aceptación**

- **CA-1.1** Dado el usuario `ana@example.com` con 2 tareas en Backlog, 1 en To do, 3 en In progress y 0 en Done, en una ventana de 1280 px, cuando abre la zona privada, entonces ve debajo de la cabecera el título «Tablero» con el recuento «6 tareas», el botón «Crear tarea» y cuatro columnas en este orden: «Backlog · 2», «To do · 1», «In progress · 3» y «Done · 0».
- **CA-1.2** Dada la columna Done sin tareas, cuando el usuario ve el tablero, entonces esa columna muestra un hueco con el texto «Nada terminado todavía» en lugar de estar en blanco.
- **CA-1.3** Dado un usuario sin ninguna tarea, cuando abre la zona privada, entonces ve, en lugar de las columnas, el mensaje «Todavía no tienes tareas. Crea la primera y empieza a organizarte.» con el botón «Crear tarea».
- **CA-1.4** Dadas las tareas «Preparar la demo» de `ana@example.com` y «Comprar pan» de `luis@example.com`, cuando Ana abre su tablero, entonces ve «Preparar la demo» y no ve «Comprar pan» ni ningún recuento que la incluya.
- **CA-1.5** Dada una tarea con fecha estimada de inicio 14/11/2026 y de fin 28/11/2026, cuando el usuario ve su tarjeta, entonces la tarjeta muestra el título completo (en varias líneas si no cabe en una) y «14 nov → 28 nov».
- **CA-1.6** Dado que el servidor no responde, cuando el usuario abre la zona privada, entonces ve, debajo de la cabecera, el mensaje «No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.» con el botón «Reintentar», y no una pantalla en blanco; al pulsar «Reintentar» con el servidor ya disponible, ve su tablero.
- **CA-1.7** Dado un lector de pantalla, cuando el usuario llega a la columna In progress con 3 tareas, entonces la columna se anuncia como «In progress, 3 tareas».
- **CA-1.8** Dadas en To do la tarea «Comprar pan», creada el 20/10/2026, y «Preparar la demo», creada el 25/10/2026, cuando el usuario ve el tablero, entonces «Preparar la demo» aparece encima de «Comprar pan».

### HU-2 · Crear una tarea (P1)

Como usuario, quiero crear una tarea con un título y, si quiero, una descripción y unas fechas estimadas, para apuntar lo que tengo que hacer.

**Criterios de aceptación**

- **CA-2.1** Dado el tablero, cuando el usuario pulsa «Crear tarea», escribe el título «Preparar la demo» y pulsa «Crear tarea» en el diálogo, entonces el diálogo se cierra, la tarjeta «Preparar la demo» aparece la primera de la columna Backlog y el recuento total sube en 1.
- **CA-2.2** Dado el diálogo de crear, cuando el usuario escribe la descripción «Revisar con el equipo», la fecha estimada de inicio 14/11/2026 y la de fin 28/11/2026 y crea la tarea, entonces su detalle muestra esos tres datos tal cual.
- **CA-2.3** Dado el diálogo de crear, cuando el usuario lo envía con el título vacío o solo con espacios, entonces no se crea la tarea, el foco va al campo Título y bajo él aparece «Escribe un título para la tarea.».
- **CA-2.4** Dado el diálogo de crear, cuando el usuario escribe un título de 201 caracteres y lo envía, entonces no se crea la tarea y bajo el campo aparece «El título puede tener hasta 200 caracteres. Acórtalo un poco.».
- **CA-2.5** Dado el diálogo de crear, cuando el usuario pone como fecha estimada de inicio 28/11/2026 y como fin 14/11/2026 y lo envía, entonces no se crea la tarea y bajo la fecha de fin aparece «La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.».
- **CA-2.6** Dado el diálogo de crear, cuando el usuario escribe «31/02/2026» como fecha y lo envía, entonces no se crea la tarea y bajo ese campo aparece «Esa fecha no existe. Escríbela como 14/11/2026.».
- **CA-2.7** Dado que el servidor no responde, cuando el usuario envía el diálogo de crear, entonces el diálogo sigue abierto con todo lo escrito y muestra «No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.».

### HU-3 · Ver y editar una tarea (P1)

Como usuario, quiero abrir una tarea para ver todos sus datos y cambiarlos, para mantenerla al día.

**Criterios de aceptación**

- **CA-3.1** Dada la tarjeta «Preparar la demo», cuando el usuario hace clic en ella o llega a ella con Tab y pulsa Enter, entonces se abre un diálogo con el título, la descripción, el estado y las fechas de la tarea.
- **CA-3.2** Dado ese diálogo, cuando el usuario cambia el título a «Preparar la demo final» y pulsa «Guardar cambios», entonces el diálogo se cierra y la tarjeta muestra «Preparar la demo final».
- **CA-3.3** Dado ese diálogo con el título cambiado y sin guardar, cuando el usuario pulsa Esc, «Cancelar» o fuera del diálogo, entonces se le pregunta «¿Descartar los cambios?» con las opciones «Descartar cambios» y «Seguir editando»; con «Descartar cambios» el diálogo se cierra y la tarea no cambia; con «Seguir editando» vuelve al diálogo con lo que había escrito.
- **CA-3.4** Dado ese diálogo sin ningún cambio, cuando el usuario pulsa Esc, entonces el diálogo se cierra sin preguntar y el foco vuelve a la tarjeta «Preparar la demo».
- **CA-3.5** Dado ese diálogo, cuando el usuario borra el título y pulsa «Guardar cambios», entonces la tarea no cambia y aparece el mismo error que en CA-2.3.
- **CA-3.6** Dada la tarea abierta en dos pestañas, cuando se borra en una y en la otra se pulsa «Guardar cambios», entonces se muestra «Esta tarea ya no existe.», el diálogo se cierra y la tarjeta desaparece del tablero.

### HU-4 · Cambiar el estado de una tarea sin arrastrar (P1)

Como usuario, quiero cambiar el estado de una tarea desde su detalle, con ratón o solo con teclado, para reflejar en qué punto está.

**Criterios de aceptación**

- **CA-4.1** Dada la tarea «Preparar la demo» en To do, cuando el usuario abre su detalle, elige el estado In progress y pulsa «Guardar cambios», entonces la tarjeta pasa de la columna To do a In progress y los recuentos de las dos columnas cambian en 1.
- **CA-4.2** Dado solo el teclado, cuando el usuario llega a la tarjeta con Tab, la abre con Enter, cambia el estado con las flechas y guarda con Enter en «Guardar cambios», entonces ocurre lo mismo que en CA-4.1.
- **CA-4.3** Dada la tarea «Preparar la demo» en In progress, cuando el usuario elige Done en su detalle, entonces aparece el campo Fecha real de fin con «29/10/2026»; al guardar, la tarjeta pasa a Done y muestra la fecha real de fin «29 oct».
- **CA-4.4** Dado que el servidor no responde, cuando el usuario guarda el cambio de estado, entonces la tarjeta sigue en su columna de antes, el diálogo sigue abierto con el estado elegido y muestra el mensaje de CA-2.7.
- **CA-4.5** Dado el detalle de CA-4.3, cuando el usuario cambia la fecha real de fin a «27/10/2026» y guarda, entonces la tarjeta en Done muestra «27 oct».
- **CA-4.6** Dado el detalle de CA-4.3, cuando el usuario cambia la fecha real de fin a «30/10/2026» y guarda, entonces la tarea no cambia y bajo el campo aparece «La fecha real de fin no puede ser posterior a hoy. Cambia la fecha.».
- **CA-4.7** Dado el detalle de CA-4.3, cuando el usuario vacía la fecha real de fin y guarda, entonces la tarea no cambia y bajo el campo aparece «Escribe el día en que terminaste la tarea.».
- **CA-4.8** Dada una tarea en Done con fecha real de fin 27/10/2026, cuando el usuario la pasa a In progress y guarda, entonces la tarjeta pasa a In progress sin fecha real de fin; si más tarde la vuelve a pasar a Done, el campo aparece con la fecha de hoy, no con «27/10/2026».
- **CA-4.9** Dado el detalle de una tarea en To do, cuando el usuario lo abre, entonces no ve el campo Fecha real de fin.

### HU-5 · Borrar una tarea (P1)

Como usuario, quiero borrar una tarea que ya no necesito, para que no me estorbe en el tablero.

**Criterios de aceptación**

- **CA-5.1** Dado el detalle de «Preparar la demo», cuando el usuario pulsa «Borrar tarea», entonces se le pregunta «¿Borrar «Preparar la demo»? No se puede deshacer.» con las opciones «Borrar tarea» y «Cancelar».
- **CA-5.2** Dada esa pregunta, cuando el usuario elige «Borrar tarea», entonces los diálogos se cierran, la tarjeta desaparece, los recuentos bajan en 1 y el foco pasa al botón «Crear tarea».
- **CA-5.3** Dada esa pregunta, cuando el usuario elige «Cancelar» o pulsa Esc, entonces vuelve al detalle y la tarea sigue existiendo.
- **CA-5.4** Dado que el servidor no responde, cuando el usuario confirma el borrado, entonces la tarea no desaparece y el detalle muestra «No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.».
- **CA-5.5** Dado un usuario con una sola tarea, cuando la borra, entonces ve el mensaje de tablero vacío de CA-1.3.

### HU-6 · Ver qué tareas van retrasadas (P2)

Como usuario, quiero que el tablero me avise de las tareas cuya fecha estimada de fin ya ha pasado, para atenderlas antes.

**Criterios de aceptación**

- **CA-6.1** Dada una tarea en In progress con fecha estimada de fin 28/10/2026, cuando el usuario ve el tablero, entonces su tarjeta muestra la insignia «Retrasada» con su icono, además del estado.
- **CA-6.2** Dada esa tarea, cuando el usuario abre su detalle, entonces ve el aviso «Esta tarea tenía que terminar el 28 oct.».
- **CA-6.3** Dada una tarea en To do con fecha estimada de fin 29/10/2026 (hoy), cuando el usuario ve el tablero, entonces no aparece como retrasada.
- **CA-6.4** Dada una tarea en Done con fecha estimada de fin 01/10/2026, cuando el usuario ve el tablero, entonces no aparece como retrasada.
- **CA-6.5** Dada una tarea sin fecha estimada de fin, cuando el usuario ve el tablero, entonces no aparece como retrasada.

### HU-7 · Usar el tablero en el móvil (P2)

Como usuario, quiero manejar el tablero en una pantalla estrecha, para consultar y actualizar mis tareas desde el móvil.

**Criterios de aceptación**

- **CA-7.1** Dada una ventana de 375 px, cuando el usuario abre el tablero, entonces ve una sola columna y, encima, un selector con los cuatro estados y su recuento; al elegir «Done» pasa a ver la columna Done. No aparece scroll horizontal en la página.
- **CA-7.2** Dada una ventana de 375 px, cuando el usuario abre una tarea, entonces el detalle se abre como panel desde abajo y permite lo mismo que en HU-3, HU-4 y HU-5.
- **CA-7.3** Dada una ventana de 375 px, cuando el usuario ve el tablero, entonces el botón «Crear tarea» está en la parte inferior de la pantalla, a la vista sin hacer scroll.

> Prioridades: **P1** imprescindible (sin esto no se publica) · **P2** importante · **P3** deseable.

## 5. Requisitos funcionales

**Tablero**

- **RF-001** La zona privada DEBE mostrar, debajo de la cabecera de 004/RF-006, el tablero con cuatro columnas en este orden: Backlog, To do, In progress y Done. *(HU-1)*
- **RF-002** Cada columna DEBE mostrar las tareas del usuario que están en su estado, ordenadas por su momento de creación, de la más reciente a la más antigua. *(HU-1)*
- **RF-003** El tablero DEBE mostrar el recuento total de tareas del usuario («6 tareas», «1 tarea») y cada columna su nombre y su recuento («In progress · 3»). *(HU-1)*
- **RF-004** El tablero DEBE mostrar solo las tareas del usuario con la sesión iniciada. *(HU-1)*
- **RF-005** SI una columna no tiene tareas, ENTONCES el sistema DEBE mostrar en ella un hueco con el texto «Nada en el backlog», «Nada por hacer», «Nada en curso» o «Nada terminado todavía», según la columna. *(HU-1)*
- **RF-006** SI el usuario no tiene ninguna tarea, ENTONCES el sistema DEBE mostrar, en lugar de las columnas, «Todavía no tienes tareas. Crea la primera y empieza a organizarte.» con el botón «Crear tarea». *(HU-1)*
- **RF-007** Cada tarjeta DEBE mostrar el título completo de la tarea y, si las tiene, sus fechas estimadas de inicio y de fin (§11.3); en Done, además, la fecha real de fin. *(HU-1)*
- **RF-008** SI no se pueden cargar las tareas porque no se puede contactar con el servidor o este responde con un error inesperado, ENTONCES el sistema DEBE mostrar «No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.» con el botón «Reintentar», que vuelve a intentar la carga. *(HU-1)*
- **RF-009** Cada columna DEBE tener un nombre accesible con su estado y su recuento («In progress, 3 tareas»). *(HU-1)*
- **RF-037** *(v0.2)* La zona privada DEBE mostrar debajo de la cabecera el título «Tablero» como encabezado principal de la página, en lugar del título «Mis tareas» de 004/RF-024. «Mis tareas» sigue siendo el nombre de la app en la cabecera y en la pestaña del navegador. *(HU-1)*

**Crear y editar**

- **RF-010** CUANDO el usuario pulse «Crear tarea» en el tablero, el sistema DEBE abrir un diálogo con los campos Título, Descripción (opcional), Fecha estimada de inicio (opcional) y Fecha estimada de fin (opcional). *(HU-2)*
- **RF-011** CUANDO el usuario envíe el diálogo de crear con datos válidos, el sistema DEBE crear la tarea a su nombre en el estado Backlog, cerrar el diálogo y mostrar la tarjeta en la columna Backlog. *(HU-2)*
- **RF-012** CUANDO el usuario active una tarjeta (clic, o Enter con el foco en ella), el sistema DEBE abrir un diálogo con el título, la descripción, el estado y las fechas de la tarea, todos modificables. *(HU-3, HU-4)*
- **RF-013** CUANDO el usuario pulse «Guardar cambios» con datos válidos, el sistema DEBE guardar todos los cambios del diálogo, cerrarlo y mostrar la tarjeta actualizada en la columna de su estado. *(HU-3, HU-4)*
- **RF-014** SI el título está vacío o solo tiene espacios, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo el campo «Escribe un título para la tarea.». *(HU-2, HU-3)*
- **RF-015** SI el título tiene más de 200 caracteres, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo el campo «El título puede tener hasta 200 caracteres. Acórtalo un poco.». *(HU-2, HU-3)*
- **RF-016** SI la descripción tiene más de 5000 caracteres, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo el campo «La descripción puede tener hasta 5000 caracteres. Acórtala un poco.». *(HU-2, HU-3)*
- **RF-017** SI una fecha (estimada o real) no existe en el calendario o no tiene la forma día/mes/año con el año en cuatro cifras, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo ese campo «Esa fecha no existe. Escríbela como 14/11/2026.». *(HU-2, HU-3)*
- **RF-018** SI la fecha estimada de fin es anterior a la fecha estimada de inicio, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo la fecha de fin «La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.». *(HU-2, HU-3)*
- **RF-019** CUANDO el sistema rechace un envío por errores de campo, DEBE llevar el foco al primer campo con error. *(HU-2, HU-3)*
- **RF-020** El sistema DEBE guardar el título sin los espacios iniciales y finales, y la descripción con sus saltos de línea tal cual. *(HU-2, HU-3)*
- **RF-021** SI el usuario intenta cerrar un diálogo de crear o editar con cambios sin guardar (Esc, «Cancelar» o clic fuera), ENTONCES el sistema DEBE preguntar «¿Descartar los cambios?» con las opciones «Descartar cambios» y «Seguir editando». *(HU-3)*
- **RF-022** CUANDO se cierre el diálogo de una tarea sin borrarla, el sistema DEBE devolver el foco a su tarjeta; al cerrar el de crear sin crear, al botón «Crear tarea». *(HU-2, HU-3)*

**Estado**

- **RF-023** El diálogo de una tarea DEBE permitir elegir su estado entre Backlog, To do, In progress y Done con ratón, con el dedo o solo con teclado. *(HU-4)*
- **RF-024** CUANDO se guarde un cambio de estado, el sistema DEBE mostrar la tarjeta en la columna del nuevo estado y actualizar los recuentos. *(HU-4)*
- **RF-025** CUANDO el usuario elija Done en el detalle de una tarea que no está en Done, el sistema DEBE rellenar la fecha real de fin con la fecha de hoy del navegador, que el usuario puede cambiar antes de guardar. *(HU-4)*
- **RF-038** *(v0.2)* El detalle DEBE mostrar el campo Fecha real de fin, modificable, solo mientras el estado elegido sea Done. *(HU-4)*
- **RF-039** *(v0.2)* SI la fecha real de fin es posterior a la fecha de hoy del navegador, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo el campo «La fecha real de fin no puede ser posterior a hoy. Cambia la fecha.». *(HU-4)*
- **RF-040** *(v0.2)* SI el estado elegido es Done y la fecha real de fin está vacía, ENTONCES el sistema DEBE rechazar el envío y mostrar bajo el campo «Escribe el día en que terminaste la tarea.». *(HU-4)*
- **RF-041** *(v0.2)* CUANDO se guarde una tarea con un estado distinto de Done, el sistema DEBE dejarla sin fecha real de fin. *(HU-4)*

**Borrar**

- **RF-026** CUANDO el usuario pulse «Borrar tarea» en el detalle, el sistema DEBE preguntar «¿Borrar «<título>»? No se puede deshacer.» con las opciones «Borrar tarea» y «Cancelar». *(HU-5)*
- **RF-027** CUANDO el usuario confirme el borrado, el sistema DEBE eliminar la tarea, cerrar los diálogos, quitar la tarjeta del tablero y llevar el foco al botón «Crear tarea». *(HU-5)*

**Errores al guardar**

- **RF-028** SI al crear o guardar no se puede contactar con el servidor o este responde con un error inesperado, ENTONCES el sistema DEBE dejar el diálogo abierto con lo escrito y mostrar en él «No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.». *(HU-2, HU-3, HU-4)*
- **RF-029** SI al borrar no se puede contactar con el servidor o este responde con un error inesperado, ENTONCES el sistema DEBE mantener la tarea y mostrar en el detalle «No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.». *(HU-5)*
- **RF-030** SI el usuario guarda o borra una tarea que ya no existe o no es suya, ENTONCES el sistema DEBE mostrar «Esta tarea ya no existe.», cerrar el diálogo y quitar la tarjeta del tablero. *(HU-3, HU-5)*
- **RF-031** MIENTRAS se crea, guarda o borra una tarea, el botón pulsado DEBE mostrar un indicador de progreso y el texto «Creando tarea…», «Guardando…» o «Borrando…», mantener su ancho y no aceptar más pulsaciones (§12). *(HU-2, HU-3, HU-5)*

**Retrasadas**

- **RF-032** MIENTRAS una tarea no esté en Done y su fecha estimada de fin sea anterior a la fecha de hoy en el navegador, el sistema DEBE mostrar en su tarjeta la insignia «Retrasada» con su icono. *(HU-6)*
- **RF-033** MIENTRAS una tarea esté retrasada, su detalle DEBE mostrar «Esta tarea tenía que terminar el <fecha estimada de fin>.». *(HU-6)*

**Móvil**

- **RF-034** MIENTRAS la ventana mida menos de 768 px, el tablero DEBE mostrar una sola columna y, encima, un selector con los cuatro estados y sus recuentos para cambiar de columna. *(HU-7)*
- **RF-035** MIENTRAS la ventana mida menos de 768 px, el detalle y el diálogo de crear DEBEN abrirse como panel desde la parte inferior de la pantalla (§4). *(HU-7)*
- **RF-036** MIENTRAS la ventana mida menos de 768 px, el botón «Crear tarea» DEBE estar fijo en la parte inferior de la pantalla. *(HU-7)*

## 6. Requisitos no funcionales

- **RNF-001** Accesibilidad: WCAG 2.2 AA en todo componente interactivo y AAA en el contraste del texto (C-20, C-26), en tema claro y oscuro y sobre cada superficie del tablero (columna, tarjeta, diálogo, insignia). El diálogo atrapa el foco y todo el tablero se usa solo con teclado. Se comprueba con pruebas automáticas y con la checklist de §21.
- **RNF-002** Responsive: el tablero, el detalle y el diálogo de crear se usan sin scroll horizontal de la página ni contenido cortado a 320, 375, 768, 1024, 1280 y 1600 px de ancho, y con el zoom al 200 % a 1280 px. Entre 768 y 1279 px las columnas pueden desplazarse en horizontal dentro del tablero (§4).
- **RNF-003** Privacidad y seguridad: ninguna acción permite ver, contar, cambiar ni borrar tareas de otro usuario; una tarea ajena se trata igual que una inexistente (C-13). De cada tarea solo se guardan los datos del glosario (C-16).
- **RNF-004** Rendimiento: con 500 tareas, el tablero muestra todas las columnas en ≤ 2 s desde que se abre la zona privada, en uso local y en el navegador de desarrollo.
- **RNF-005** Compatibilidad: la misma que 004/RNF-004.
- **RNF-006** Consistencia: el tablero solo usa valores del catálogo de la spec 004 (004/RNF-006), y los elementos nuevos (columna, tarjeta, insignia, diálogo, panel inferior, selector de estado) siguen §11.3, §11.4 y §14.

## 7. Casos límite y errores

| # | Situación | Comportamiento esperado |
|---|-----------|-------------------------|
| E-1 | Usuario sin tareas | Mensaje de tablero vacío (RF-006) |
| E-2 | Usuario con 500 tareas, 200 en la misma columna | La columna hace scroll por su cuenta y la cabecera queda fija (§3.2); se cumple RNF-004 |
| E-3 | Título de 200 / 201 caracteres | 200 se acepta; 201 se rechaza (RF-015). Se cuentan caracteres, no bytes; tildes y emoji cuentan como uno |
| E-4 | Título con una palabra de 200 caracteres sin espacios | La tarjeta parte la palabra en varias líneas; no desborda la columna |
| E-5 | Título «  Comprar pan  » | Se guarda y se muestra «Comprar pan» (RF-020) |
| E-6 | Descripción de 5000 / 5001 caracteres | 5000 se acepta; 5001 se rechaza (RF-016) |
| E-7 | Fechas «31/02/2026», «2026-11-14» o «14/11/26» | Se rechazan con el mensaje de RF-017 |
| E-8 | Fecha estimada de fin sin fecha de inicio, o al revés | Se acepta; la tarjeta muestra solo la fecha que hay |
| E-9 | Fecha estimada de inicio igual a la de fin | Se acepta |
| E-10 | Zona horaria: tarea con fin estimado el 28/10/2026, consultada a las 00:30 del 29/10/2026 hora local | Aparece como retrasada: «hoy» es la fecha local del navegador (§16); las fechas no tienen hora (C-11) |
| E-11 | El día cambia con el tablero abierto | Al volver a cargar el tablero, las insignias «Retrasada» se recalculan con la fecha nueva |
| E-12 | Sesión caducada al crear, guardar o borrar | Pantalla de inicio de sesión con el aviso de 001/RF-013; lo escrito en el diálogo se pierde |
| E-13 | Tarea abierta en dos pestañas y editada en las dos | Gana el último «Guardar cambios»; la otra pestaña ve los datos nuevos al volver a cargar el tablero |
| E-14 | Se borra en una pestaña una tarea abierta en otra | Al guardar o borrar en la segunda: «Esta tarea ya no existe.» (RF-030) |
| E-15 | Doble pulsación en «Crear tarea» del diálogo | Se crea una sola tarea (RF-031) |
| E-16 | Con el detalle abierto, la ventana pasa de 1280 a 375 px o al revés | El detalle sigue abierto, con lo escrito, en la forma que toque (diálogo o panel inferior) |
| E-17 | Con la columna Done elegida en móvil, la ventana pasa a medir 768 px o más | Se ven las columnas del tamaño nuevo; ninguna tarea se oculta |
| E-18 | Se intenta abrir o cambiar una tarea de otro usuario | El sistema responde igual que si no existiera (RF-030, C-13) |
| E-19 | Idioma | Solo español de España; fechas y plurales según §16 («1 tarea», «2 tareas») |
| E-20 | Fecha real de fin anterior a la fecha estimada de inicio (la tarea se terminó antes de lo previsto) | Se acepta; solo se exige que no sea posterior a hoy (RF-039) |
| E-21 | Se edita el título de una tarea en Done sin cambiar su estado | Conserva su fecha real de fin; no se cambia por la de hoy (RF-025 solo actúa al pasar a Done) |
| E-22 | Una tarea cambia de columna | En la columna nueva ocupa el sitio que le toca por su momento de creación (RF-002), no el primero |
| E-23 | En el detalle, el usuario elige Done, después In progress y guarda | La tarea se guarda en In progress sin fecha real de fin (RF-041) |
| E-24 | Dos tareas creadas el mismo día | Va arriba la creada más tarde: RF-002 ordena por el momento exacto de creación, no solo por el día |

## 8. Entidades y glosario

- **Tarea**: algo que el usuario tiene que hacer. Pertenece a un solo usuario. Datos: título (obligatorio, 1–200 caracteres), descripción (opcional, hasta 5000 caracteres), estado, fecha estimada de inicio (opcional), fecha estimada de fin (opcional), fecha real de fin (solo en Done) y momento de creación. Las fechas son días, sin hora (C-11).
- **Estado**: punto en que está una tarea. Uno de cuatro, con estos nombres: **Backlog** (apuntada, sin planificar), **To do** (lista para empezar), **In progress** (en curso) y **Done** (terminada).
- **Tablero**: vista de la zona privada, con el título «Tablero», que tiene una columna por estado.
- **Columna**: parte del tablero con las tareas de un estado, su nombre y su recuento.
- **Tarjeta**: representación de una tarea en su columna.
- **Detalle**: diálogo (o panel inferior en móvil) donde se ven y editan todos los datos de una tarea, se cambia su estado y se borra.
- **Tarea retrasada**: tarea que no está en Done y cuya fecha estimada de fin es anterior a la fecha de hoy en el navegador.
- **Fecha real de fin**: día en que la tarea se terminó. Solo la tienen las tareas en Done. Al pasar una tarea a Done, la app propone el día de hoy y el usuario puede cambiarlo (nunca a un día futuro); al salir de Done, se pierde.
- **Momento de creación**: cuándo se creó la tarea. No se muestra; solo ordena las tarjetas (RF-002).

## 9. Fuera de alcance

- Arrastrar y soltar tarjetas, y ordenar a mano dentro de una columna (spec 003).
- Cambiar el estado directamente desde la tarjeta, sin abrir el detalle.
- Elegir el estado al crear una tarea, o crearla desde una columna concreta: toda tarea nueva entra en Backlog (RF-011).
- Deshacer un borrado; el borrado se confirma antes (§11.4).
- Avisos de éxito tipo toast al crear, guardar o borrar: la tarjeta que aparece, cambia o desaparece es la confirmación.
- Buscar, filtrar u ordenar tareas por otros criterios.
- Etiquetas, prioridades, subtareas, comentarios o adjuntos.
- Recordatorios o notificaciones cuando se acerca o pasa una fecha.
- Archivar u ocultar las tareas terminadas.
- Estados o columnas personalizados, o más de cuatro.
- Compartir tareas o tableros con otros usuarios.
- Formato en la descripción (negritas, listas, enlaces): es texto plano.
- Esqueleto de carga del tablero: en uso local tarda menos de 300 ms (§12; ya en «Ideas sin priorizar»).
- Recalcular «Retrasada» a medianoche sin volver a cargar el tablero (E-11).
- Trabajar sin conexión o guardar cambios para enviarlos después (§12).
- Selector de fecha en calendario: las fechas se escriben como «14/11/2026» (ver Supuestos).

## 10. Dependencias y supuestos

- **Depende de:** spec 001 (`implementada`), por la cuenta, la sesión y la zona privada; spec 004 (`implementada`), por la cabecera, el catálogo de valores visuales y los patrones de `DESIGN.md` (v1.2.1-todo.1). La spec 003 depende de esta.
- **Supuestos:**
  - Se mantiene HU-6 (retrasadas) aunque la descripción de la feature no la pedía: la pide `DESIGN.md` §1.3 y el usuario la confirma como P2 (ver Aclaraciones).
  - Se confirma el mapa de estados de §1.3: Backlog en tinta neutra, To do en lilac, In progress en tinta, Done en sage y «Retrasada» en amber como insignia añadida, cada uno con su icono. Al aprobar la spec se quita de «Pendiente de decidir» de `DESIGN.md`.
  - La spec 002 incluye el aviso cuando no se pueden cargar las tareas (RF-008), que estaba en «Ideas sin priorizar» para valorarlo aquí.
  - El título y la descripción son los únicos textos de la tarea; las fechas estimadas son opcionales y la tarea puede no tener ninguna.
  - Límites: título 1–200 caracteres y descripción hasta 5000.
  - Las fechas se escriben a mano como día/mes/año (§13: «14/11/2026»). El selector de calendario de §14 queda fuera de esta spec.
  - Se valida al pulsar «Crear tarea» o «Guardar cambios», como en la spec 001, y el foco va al primer error (§13).
  - El estado se cambia dentro del detalle y se guarda con «Guardar cambios», junto con el resto de cambios; no se guarda al elegirlo.
  - «Borrar tarea» solo está en el detalle, no en la tarjeta.
  - En la tarjeta, las fechas van sin año si son del año en curso («14 nov → 28 nov») y con año si no («14 nov 2027»); en el detalle, siempre con año.
  - No hay límite de tareas por usuario; RNF-004 se mide con 500.
  - En móvil, se cambia de columna con el selector de estados; deslizar el dedo para cambiar de columna (§4) no se incluye.
  - En móvil, al abrir el tablero se ve la columna Backlog.
  - Textos de espera en los botones: «Creando tarea…», «Guardando…» y «Borrando…» (§12).

## 11. Aclaraciones

Historial de preguntas resueltas durante `/sdd-clarificar`.

| Fecha | Pregunta | Respuesta | Afecta a |
|-------|----------|-----------|----------|
| 2026-10-30 | Cuando una tarea pasa a Done, ¿quién pone la fecha real de fin y qué pasa con ella si sale de Done? | La app propone la fecha de hoy y el usuario puede cambiarla, nunca a un día futuro; es obligatoria en Done y se borra al salir de Done | CA-4.3, CA-4.5–CA-4.9, RF-017, RF-025, RF-038–RF-041, E-20, E-21, E-23, §8 |
| 2026-10-30 | ¿En qué columna entra una tarea nueva? | Siempre en Backlog; el diálogo de crear no tiene estado | CA-2.1, RF-011, §9 |
| 2026-10-30 | ¿En qué orden van las tarjetas dentro de una columna? | De la creada más recientemente a la más antigua (el orden manual llega con la 003) | RF-002, CA-1.8, E-22, E-24, §8 |
| 2026-10-30 | El aviso de tareas retrasadas no estaba en la descripción (viene de `DESIGN.md` §1.3): ¿se queda? | Se queda, como P2 | HU-6, §10 |
| 2026-10-30 | ¿El título grande de la vista pasa a «Tablero» o se queda «Mis tareas» (lo dejó abierto la 004)? | «Tablero»; «Mis tareas» sigue como nombre de la app en la cabecera y la pestaña | CA-1.1, RF-037, §8; modifica 004/RF-024 |

## 12. Registro de cambios

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 0.1     | 2026-10-29 | Borrador inicial | Spec 002 del roadmap |
| 0.2     | 2026-10-30 | Resueltas 5 aclaraciones: título «Tablero» (RF-037); tarea nueva en Backlog (RF-011); orden por creación (RF-002, CA-1.8); fecha real de fin propuesta al pasar a Done, editable y no futura (RF-025, RF-038–RF-041, CA-4.5–CA-4.9); HU-6 se mantiene. Nuevos E-20–E-24 | `/sdd-clarificar` |
| 1.0     | 2026-10-30 | Spec aprobada (versión 0.2 sin cambios) | Revisión con el checklist de spec superada; extensión de ~5 páginas aceptada sin dividir |
