---
id: 003
titulo: Arrastrar y soltar
estado: borrador          # borrador | aprobada | en-implementacion | implementada | obsoleta
version: 0.2
autor: Julian Querol Polo
creada: 2026-10-31
aprobada:                 # AAAA-MM-DD, por quién
ticket:
---

# Spec 003 · Arrastrar y soltar

> Esta spec describe QUÉ y POR QUÉ. No contiene decisiones técnicas (eso va en `plan.md`).
> Lo que no se sepa se marca con `[NECESITA ACLARACIÓN: pregunta concreta]`. No se inventa.
> Lo visual (sombras, escala, hueco de destino, capas, movimiento) lo fija `DESIGN.md` (C-26); esta spec fija **qué pasa, cuándo y con qué texto**. Las referencias «§n» son a `DESIGN.md`; las de otras specs, con el formato `NNN/ID`.

## 1. Contexto y problema

Con la spec 002, el usuario ya tiene su tablero, pero para pasar una tarea de To do a In progress tiene que abrir su detalle, elegir el estado y pulsar «Guardar cambios»: tres pasos para el gesto más habitual de un kanban. Además, dentro de cada columna las tarjetas van siempre de la más reciente a la más antigua (002/RF-002), así que no puede poner arriba lo que quiere hacer primero. Esta spec permite arrastrar una tarjeta a otra columna o a otra posición de su columna, y guarda ese orden. Como todo lo que se arrastra, tiene que poder hacerse también con teclado (C-20).

## 2. Objetivos

- El usuario cambia una tarea de columna arrastrando su tarjeta, sin abrir el detalle.
- El usuario ordena a mano las tarjetas de una columna, y ese orden se mantiene al volver a cargar el tablero.
- Todo lo que se hace arrastrando se puede hacer solo con teclado, y un lector de pantalla anuncia cada paso.
- Si un movimiento no se puede guardar, la tarjeta vuelve a su sitio y el usuario sabe por qué.

## 3. Usuarios y actores

| Actor | Descripción | Qué necesita |
|-------|-------------|--------------|
| Usuario | Persona con sesión iniciada (spec 001) y con su tablero (spec 002) | Mover y ordenar sus tareas con un gesto, con ratón, con el dedo o con teclado |

## 4. Historias de usuario

En los ejemplos, hoy es el 31/10/2026 en el navegador del usuario y la ventana mide 1280 px salvo que se diga otra cosa.

### HU-1 · Mover una tarea a otra columna arrastrando (P1)

Como usuario, quiero arrastrar una tarjeta a otra columna, para cambiar el estado de la tarea en un solo gesto.

**Criterios de aceptación**

- **CA-1.1** Dada «Preparar la demo» en To do (To do · 2, In progress · 3), cuando el usuario la arrastra con el ratón y la suelta en la columna In progress encima de la primera tarjeta, entonces «Preparar la demo» aparece la primera de In progress, los recuentos pasan a «To do · 1» e «In progress · 4» y el total no cambia.
- **CA-1.2** Dado el arrastre de CA-1.1, mientras el usuario mueve el puntero sobre In progress, entonces la tarjeta sigue al puntero levantada y la columna muestra el hueco donde caerá (§8).
- **CA-1.3** Dada «Preparar la demo» movida a In progress como en CA-1.1, cuando el usuario vuelve a cargar el tablero, entonces la tarjeta sigue la primera de In progress.
- **CA-1.4** Dada «Preparar la demo» en In progress con fecha estimada de fin 28/10/2026 (insignia «Retrasada»), cuando el usuario la suelta en Done, entonces la tarjeta pasa a Done sin la insignia «Retrasada» y con la fecha real de fin «31 oct», sin que se abra el detalle. Si el usuario la terminó otro día, la cambia después en el detalle (002/HU-4).
- **CA-1.5** Dada una tarea en Done con fecha real de fin 27/10/2026, cuando el usuario la suelta en To do, entonces la tarjeta pasa a To do sin fecha real de fin (002/RF-041).
- **CA-1.6** Dada la columna Done vacía («Nada terminado todavía»), cuando el usuario suelta en ella una tarjeta, entonces el hueco vacío desaparece, la tarjeta queda en Done y el recuento pasa a «Done · 1».
- **CA-1.7** Dada «Preparar la demo» en pleno arrastre, cuando el usuario la suelta fuera de cualquier columna o pulsa Esc, entonces la tarjeta vuelve a su sitio de antes, no se guarda nada y no aparece ningún aviso.
- **CA-1.8** Dada la tarjeta «Preparar la demo», cuando el usuario hace clic en ella sin desplazar el puntero, entonces se abre su detalle, como en 002/CA-3.1, y no empieza ningún arrastre.
- **CA-1.9** Dado que el servidor no responde, cuando el usuario suelta «Preparar la demo» en In progress, entonces la tarjeta vuelve a To do, a su posición de antes, los recuentos vuelven a los de antes y debajo de la cabecera aparece «No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.».
- **CA-1.10** Dada «Preparar la demo» borrada en otra pestaña, cuando el usuario la arrastra a In progress en esta, entonces aparece «Esta tarea ya no existe.» y la tarjeta desaparece del tablero (002/RF-030).

### HU-2 · Ordenar las tareas de una columna arrastrando (P1)

Como usuario, quiero arrastrar una tarjeta a otra posición de su misma columna, para tener arriba lo que quiero hacer primero.

**Criterios de aceptación**

- **CA-2.1** Dada To do con «Comprar pan», «Llamar al banco» y «Preparar la demo», en este orden, cuando el usuario arrastra «Preparar la demo» y la suelta encima de «Comprar pan», entonces el orden pasa a ser «Preparar la demo», «Comprar pan», «Llamar al banco» y el recuento no cambia.
- **CA-2.2** Dado el orden de CA-2.1, cuando el usuario vuelve a cargar el tablero o entra con su cuenta desde otro navegador, entonces ve el mismo orden.
- **CA-2.3** Dado el orden de CA-2.1, cuando el usuario crea la tarea «Revisar el correo», entonces «Revisar el correo» aparece la primera de Backlog, como en 002/CA-2.1, y el orden de las demás columnas no cambia.
- **CA-2.4** Dada «Preparar la demo» la segunda de To do, cuando el usuario cambia su estado a In progress desde el detalle (002/HU-4), entonces aparece la primera de In progress, y el orden de las demás tarjetas de To do y de In progress no cambia.
- **CA-2.5** Dada una tarjeta que el usuario suelta en el mismo sitio del que salió, cuando termina el arrastre, entonces nada cambia y no aparece ningún aviso.
- **CA-2.6** Dado que el servidor no responde, cuando el usuario suelta «Preparar la demo» encima de «Comprar pan», entonces la columna vuelve al orden de antes y aparece el aviso de CA-1.9.

### HU-3 · Mover y ordenar con teclado (P1)

Como usuario que no usa ratón, quiero mover una tarjeta a otra posición o a otra columna solo con teclado, para hacer lo mismo que con el arrastre (C-20).

Se mueve desde el asa de la tarjeta: Espacio o Enter para cogerla, flechas para moverla, Espacio o Enter para soltarla y Esc para cancelar, con un anuncio del lector de pantalla en cada paso.

**Criterios de aceptación**

- **CA-3.1** Dada «Preparar la demo», la segunda de To do de 3 tarjetas, cuando el usuario llega con Tab a su asa, entonces el asa tiene el foco visible y el lector de pantalla la anuncia como «Mover «Preparar la demo»».
- **CA-3.2** Dado el foco en esa asa, cuando el usuario pulsa Espacio, entonces la tarjeta se levanta y el lector anuncia «Has cogido «Preparar la demo». To do, posición 2 de 3. Usa las flechas para moverla, Espacio para soltarla y Esc para cancelar.».
- **CA-3.3** Dada la tarjeta cogida, cuando el usuario pulsa Flecha arriba, entonces la tarjeta pasa a la posición 1 de To do y el lector anuncia «To do, posición 1 de 3.».
- **CA-3.4** Dada la tarjeta cogida, cuando el usuario pulsa Flecha derecha, entonces la tarjeta pasa a la primera posición de In progress y el lector anuncia «In progress, posición 1 de 4.».
- **CA-3.5** Dada la tarjeta cogida en la posición 1 de In progress, cuando el usuario pulsa Espacio, entonces la tarjeta queda ahí, se guarda como en CA-1.1, el foco sigue en su asa y el lector anuncia «Has soltado «Preparar la demo» en In progress, posición 1 de 4.».
- **CA-3.6** Dada la tarjeta cogida y movida a In progress sin soltar, cuando el usuario pulsa Esc, entonces vuelve a la posición 2 de To do, no se guarda nada, el foco sigue en su asa y el lector anuncia «Movimiento cancelado. «Preparar la demo» sigue en To do, posición 2 de 3.».
- **CA-3.7** Dada una tarjeta cogida en la primera posición de Backlog, cuando el usuario pulsa Flecha arriba o Flecha izquierda, entonces la tarjeta no se mueve.
- **CA-3.8** Dada la tarjeta «Preparar la demo» con el foco en la tarjeta (no en el asa), cuando el usuario pulsa Enter, entonces se abre su detalle, como en 002/CA-3.1.
- **CA-3.9** *(v0.2)* Dada una ventana de 375 px con To do visible y «Preparar la demo» cogida con teclado en la posición 2 de 3, cuando el usuario pulsa Flecha derecha, entonces el tablero muestra In progress, el selector de estados marca In progress, la tarjeta queda la primera y el lector anuncia «In progress, posición 1 de 4.».
- **CA-3.10** *(v0.2)* Dada la situación de CA-3.9, cuando el usuario pulsa Esc, entonces la tarjeta vuelve a la posición 2 de To do, el tablero vuelve a mostrar To do, el selector marca To do y el lector anuncia el mensaje de CA-3.6.

### HU-4 · Arrastrar con el dedo (P2)

Como usuario con pantalla táctil, quiero arrastrar las tarjetas con el dedo, para ordenar mi tablero también desde el móvil o la tablet.

Por debajo de 768 px solo se ve una columna (002/RF-034): allí el arrastre solo ordena la columna visible, y para cambiar de columna se usa el detalle (002/HU-4) o el teclado (HU-3).

**Criterios de aceptación**

- **CA-4.1** Dada una ventana de 1280 px con pantalla táctil, cuando el usuario mantiene el dedo sobre «Preparar la demo» y, sin levantarlo, la lleva a In progress y la suelta, entonces ocurre lo mismo que en CA-1.1.
- **CA-4.2** Dada una ventana de 375 px con To do visible, cuando el usuario desliza el dedo sobre la columna sin mantenerlo antes sobre una tarjeta, entonces la columna hace scroll y no empieza ningún arrastre.
- **CA-4.3** Dada una ventana de 375 px con To do visible y 3 tarjetas, cuando el usuario mantiene el dedo sobre la tercera y la suelta encima de la primera, entonces pasa a ser la primera de To do, como en CA-2.1.
- **CA-4.4** Dada una ventana de 375 px, cuando el usuario toca una tarjeta sin mantener el dedo, entonces se abre su detalle como panel inferior (002/CA-7.2).
- **CA-4.5** *(v0.2)* Dada una ventana de 375 px con To do visible, cuando el usuario arrastra con el dedo «Preparar la demo» y la suelta sobre el selector de estados o fuera de la columna, entonces la tarjeta vuelve a su sitio de antes, no se guarda nada y no aparece ningún aviso (RF-005).

> Prioridades: **P1** imprescindible (sin esto no se publica) · **P2** importante · **P3** deseable.

## 5. Requisitos funcionales

**Arrastrar entre columnas**

- **RF-001** CUANDO el usuario arrastre una tarjeta y la suelte en otra columna, el sistema DEBE cambiar la tarea al estado de esa columna, colocarla en la posición donde se soltó y actualizar los recuentos. *(HU-1)*
- **RF-002** MIENTRAS el usuario arrastra una tarjeta, el sistema DEBE mostrarla levantada, siguiendo al puntero o al dedo, y mostrar en la columna de destino el hueco donde caerá (§8). *(HU-1, HU-2, HU-4)*
- **RF-003** CUANDO el usuario suelte en Done una tarea que no estaba en Done, el sistema DEBE ponerle como fecha real de fin la fecha de hoy del navegador, sin abrir el detalle; el usuario puede cambiarla después desde el detalle (002/RF-038). *(HU-1)*
- **RF-004** CUANDO el usuario suelte fuera de Done una tarea que estaba en Done, el sistema DEBE dejarla sin fecha real de fin (002/RF-041). *(HU-1)*
- **RF-005** SI el usuario suelta la tarjeta fuera de cualquier columna o pulsa Esc durante el arrastre, ENTONCES el sistema DEBE devolverla a su sitio de antes sin guardar nada. *(HU-1)*
- **RF-006** CUANDO el usuario haga clic o toque una tarjeta sin arrastrarla, el sistema DEBE abrir su detalle como en 002/RF-012. *(HU-1, HU-4)*

**Orden dentro de la columna**

- **RF-007** CUANDO el usuario suelte una tarjeta en otra posición de su misma columna, el sistema DEBE colocarla en esa posición y mantener el orden relativo de las demás. *(HU-2)*
- **RF-008** Cada columna DEBE mostrar las tareas en el orden en que el usuario las ha dejado, y ese orden DEBE conservarse al volver a cargar el tablero y desde otro navegador. Sustituye a 002/RF-002. *(HU-2)*
- **RF-009** CUANDO se cree una tarea, el sistema DEBE colocarla la primera de Backlog sin cambiar el orden de las demás tarjetas. *(HU-2)*
- **RF-010** CUANDO se guarde un cambio de estado desde el detalle, el sistema DEBE colocar la tarjeta la primera de la columna nueva, sin cambiar el orden relativo de las demás tarjetas de la columna de origen ni de la de destino. *(HU-2)*
- **RF-011** SI el usuario suelta una tarjeta en el mismo sitio del que salió, ENTONCES el sistema NO DEBE guardar nada. *(HU-2)*

**Teclado y lector de pantalla**

- **RF-012** Cada tarjeta DEBE tener un asa de arrastre, alcanzable con Tab, con el nombre accesible «Mover «<título>»». *(HU-3)*
- **RF-013** CUANDO el usuario pulse Espacio o Enter con el foco en el asa, el sistema DEBE coger la tarjeta y anunciar «Has cogido «<título>». <columna>, posición <n> de <total>. Usa las flechas para moverla, Espacio para soltarla y Esc para cancelar.». *(HU-3)*
- **RF-014** MIENTRAS haya una tarjeta cogida con teclado, Flecha arriba y Flecha abajo DEBEN moverla una posición dentro de su columna, y Flecha izquierda y Flecha derecha DEBEN pasarla a la primera posición de la columna anterior o siguiente; tras cada paso, el sistema DEBE anunciar «<columna>, posición <n> de <total>.». *(HU-3)*
- **RF-015** SI no hay posición o columna en la dirección de la flecha, ENTONCES el sistema DEBE dejar la tarjeta donde está. *(HU-3)*
- **RF-016** CUANDO el usuario pulse Espacio o Enter con una tarjeta cogida, el sistema DEBE soltarla en su posición actual, guardarla como en RF-001 o RF-007, mantener el foco en su asa y anunciar «Has soltado «<título>» en <columna>, posición <n> de <total>.». *(HU-3)*
- **RF-017** CUANDO el usuario pulse Esc con una tarjeta cogida, o el foco salga de su asa, el sistema DEBE devolverla a su sitio de antes sin guardar nada y anunciar «Movimiento cancelado. «<título>» sigue en <columna>, posición <n> de <total>.». *(HU-3)*

**Táctil**

- **RF-018** CUANDO el usuario mantenga el dedo sobre una tarjeta y lo desplace sin levantarlo, el sistema DEBE empezar a arrastrarla; un deslizamiento sin mantener antes el dedo DEBE hacer scroll y no arrastrar. *(HU-4)*
- **RF-019** MIENTRAS la ventana mida menos de 768 px, el arrastre (con el dedo o con el ratón) DEBE limitarse a ordenar las tarjetas de la columna visible; soltar la tarjeta fuera de esa columna, incluido el selector de estados, cuenta como soltarla fuera de cualquier columna (RF-005). *(HU-4)*
- **RF-023** *(v0.2)* MIENTRAS la ventana mida menos de 768 px y haya una tarjeta cogida con teclado, CUANDO Flecha izquierda o Flecha derecha la pasen a otra columna, el sistema DEBE mostrar esa columna y marcarla en el selector de estados; SI el movimiento se cancela (RF-017), ENTONCES DEBE volver a mostrar la columna de partida. *(HU-3, HU-4)*

**Guardar y errores**

- **RF-020** CUANDO el usuario suelte una tarjeta en un sitio nuevo, el sistema DEBE mostrarla ahí antes de que el servidor confirme el cambio. *(HU-1, HU-2, HU-3)*
- **RF-021** SI al guardar un movimiento no se puede contactar con el servidor o este responde con un error inesperado, ENTONCES el sistema DEBE devolver la tarjeta a su columna y posición de antes, restaurar los recuentos y mostrar debajo de la cabecera «No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.». *(HU-1, HU-2)*
- **RF-022** SI el usuario mueve una tarea que ya no existe o no es suya, ENTONCES el sistema DEBE mostrar «Esta tarea ya no existe.» y quitar la tarjeta del tablero (002/RF-030). *(HU-1, HU-2)*

## 6. Requisitos no funcionales

- **RNF-001** Accesibilidad: WCAG 2.2 AA en todo componente interactivo y AAA en el contraste del texto (C-20, C-26), en tema claro y oscuro, también para la tarjeta levantada, el hueco de destino y el asa. Todo lo que se hace arrastrando se puede hacer solo con teclado (HU-3). El asa mide al menos 44 × 44 px por debajo de 1024 px (§4). Con `prefers-reduced-motion`, la tarjeta no se desplaza animada (§8). Se comprueba con pruebas automáticas y con la checklist de §21.
- **RNF-002** Respuesta: con 500 tareas, 200 de ellas en la misma columna, la tarjeta aparece en su sitio nuevo en ≤ 100 ms desde que se suelta, en uso local y en el navegador de desarrollo.
- **RNF-003** Privacidad y seguridad: ningún movimiento permite cambiar el estado o la posición de tareas de otro usuario, ni deducir cuántas tiene; una tarea ajena se trata igual que una inexistente (C-13).
- **RNF-004** Compatibilidad: la misma que 004/RNF-004, con ratón y teclado. El arrastre con el dedo se comprueba con la emulación táctil de esos navegadores.
- **RNF-005** Consistencia: la tarjeta levantada, el hueco de destino, el asa y su capa siguen §6.1, §7, §8 y §14 (`grip-vertical`), y solo usan valores del catálogo de la spec 004 (004/RNF-006).

## 7. Casos límite y errores

| # | Situación | Comportamiento esperado |
|---|-----------|-------------------------|
| E-1 | Se suelta una tarjeta en una columna vacía | Desaparece la frase de columna vacía y la tarjeta queda la primera (CA-1.6) |
| E-2 | Sale de una columna su última tarjeta | La columna muestra su frase de columna vacía (002/RF-005) |
| E-3 | Usuario con una sola tarea | Se puede mover entre columnas; dentro de su columna, cualquier suelta es «el mismo sitio» (RF-011) |
| E-4 | Columna con 200 tarjetas: se arrastra una hasta el borde inferior o superior visible | La columna hace scroll sola en esa dirección mientras la tarjeta esté en el borde |
| E-5 | Ventana de 768 a 1279 px: se arrastra una tarjeta hasta el borde derecho o izquierdo del tablero | El tablero hace scroll horizontal solo, para llegar a las columnas que no se ven (002/RNF-002) |
| E-6 | Título de 200 caracteres en varias líneas | La tarjeta levantada conserva su tamaño y el hueco de destino tiene su altura (§8) |
| E-7 | Sin conexión al soltar | La tarjeta vuelve a su sitio y aparece el aviso de RF-021 |
| E-8 | Sesión caducada al soltar | Pantalla de inicio de sesión con el aviso de 001/RF-013; el movimiento no se guarda |
| E-9 | La tarea se borró en otra pestaña | «Esta tarea ya no existe.» y la tarjeta desaparece (RF-022) |
| E-10 | Se intenta mover una tarea de otro usuario | Igual que si no existiera (RF-022, C-13) |
| E-11 | El usuario reordena la misma columna en dos pestañas | Gana el último movimiento guardado; la otra pestaña ve el orden nuevo al volver a cargar el tablero |
| E-12 | Se mueve otra tarjeta mientras se guarda un movimiento anterior | Se permite; si uno falla, solo su tarjeta vuelve a su sitio de antes |
| E-13 | Una tarea retrasada se suelta en Done | Deja de mostrar «Retrasada» (002/RF-032) |
| E-14 | Se saca de Done una tarea con fecha estimada de fin pasada | Vuelve a mostrar «Retrasada» |
| E-15 | Se reordena una tarjeta dentro de Done | Conserva su fecha real de fin |
| E-16 | Zona horaria: se suelta en Done a las 00:30 del 01/11/2026 hora local | La fecha real de fin es el 01/11/2026: «hoy» es la fecha local del navegador (002/E-10) |
| E-17 | La ventana cambia de tamaño durante un arrastre | El arrastre se cancela y la tarjeta vuelve a su sitio, sin guardar nada |
| E-18 | Hay un diálogo abierto (detalle, crear o confirmación) | No se puede arrastrar: el diálogo es modal (§11.4) |
| E-19 | Tareas creadas antes de esta spec | Conservan el orden que tenían (de la más reciente a la más antigua) hasta que el usuario las mueva |
| E-20 | Idioma | Solo español de España; anuncios y avisos con la voz de §15 |

## 8. Entidades y glosario

- **Tarea**: la de 002 §8, con un dato nuevo: su **posición** dentro de su columna.
- **Posición**: lugar de una tarjeta dentro de su columna, contando desde arriba (1 es la primera). Se guarda con la tarea y ordena las tarjetas en lugar del momento de creación.
- **Arrastrar y soltar**: coger una tarjeta con el ratón o el dedo, llevarla a otra columna o posición y soltarla allí.
- **Asa**: parte de la tarjeta (icono `grip-vertical`, §9) desde la que se coge la tarjeta con teclado.
- **Tarjeta cogida**: tarjeta que el usuario ha cogido con teclado y aún no ha soltado ni cancelado.
- **Hueco de destino**: espacio que muestra la columna, mientras se arrastra, donde caerá la tarjeta.

## 9. Fuera de alcance

- Mover varias tarjetas a la vez.
- Reordenar las columnas arrastrándolas.
- Deshacer un movimiento (aviso con «Deshacer», §12): el movimiento se puede revertir arrastrando de nuevo.
- Avisos de éxito tipo toast al mover: la tarjeta en su sitio nuevo es la confirmación (como en 002 §9).
- Ordenar automáticamente por fechas u otros criterios (ya en «Ideas sin priorizar»: «Buscar, filtrar u ordenar las tareas»).
- Cambiar el estado desde la tarjeta con un menú (ya en «Ideas sin priorizar»).
- Ver en tiempo real los movimientos hechos en otra pestaña u otro dispositivo (E-11).
- Límite de tareas por columna.
- Cambiar de columna deslizando el dedo en móvil (§4; ya en «Ideas sin priorizar»).
- *(v0.2)* Pasar una tarjeta a otra columna arrastrándola por debajo de 768 px (por ejemplo, soltándola sobre el selector de estados): allí se hace desde el detalle o con teclado (RF-019).
- *(v0.2)* Acciones «Subir» y «Bajar» en el detalle de la tarea: la alternativa con teclado es el asa (HU-3).
- Arrastrar tarjetas fuera del tablero (a otra ventana o aplicación) o soltar ficheros en él.

## 10. Dependencias y supuestos

- **Depende de:** spec 002 (`implementada`), por el tablero, las tarjetas, el detalle y sus reglas de estado y fecha real de fin; spec 004 (`implementada`), por el catálogo de valores visuales; spec 001 (`implementada`), por la sesión.
- **Modifica la spec 002:** RF-008 sustituye a 002/RF-002 (orden por momento de creación), y con él a 002/CA-1.8, 002/E-22 y 002/E-24; RF-010 completa 002/RF-024 (dónde entra la tarjeta al cambiar de estado desde el detalle). Se propone añadir en el Registro de cambios de la spec 002 una fila «Modificada por la spec 003». `DESIGN.md` §11.3 («Las tarjetas van de la creada más recientemente a la más antigua») tendrá que actualizarse en el plan.
- **Supuestos:**
  - Con ratón, la tarjeta se arrastra desde cualquier punto; el asa es el punto de entrada para el teclado. Un clic sin desplazar el puntero abre el detalle (RF-006).
  - Con el dedo, el arrastre empieza al mantener el dedo sobre la tarjeta; el tiempo exacto lo fija el plan.
  - Al soltar en Done no se pregunta la fecha real de fin: se pone la de hoy y se corrige en el detalle si hace falta (RF-003).
  - La tarjeta aparece en su sitio nuevo al soltarla, sin esperar al servidor, y vuelve atrás si falla (RF-020, RF-021).
  - El aviso de error al mover sale en la zona de alerta del tablero, debajo de la cabecera, como «Esta tarea ya no existe.» (§11.3), y es el texto de RF-021.
  - Con teclado, al pasar a otra columna la tarjeta entra la primera; luego se ajusta con Flecha arriba y abajo.
  - Que el foco salga del asa con una tarjeta cogida cancela el movimiento (RF-017).
  - Las tareas que ya existen conservan su orden actual al llegar esta spec (E-19).
  - Una tarea nueva sigue entrando la primera de Backlog (RF-009, 002/RF-011).
  - No hay límite de tareas por columna; RNF-002 se mide con 500 tareas, como 002/RNF-004.

## 11. Aclaraciones

Historial de preguntas resueltas durante `/sdd-clarificar`.

| Fecha | Pregunta | Respuesta | Afecta a |
|-------|----------|-----------|----------|
| 2026-10-31 | Al soltar una tarjeta en Done, ¿cómo se pone la fecha real de fin? | Sola, con la fecha de hoy del navegador y sin abrir el detalle; si no es esa, el usuario la cambia después en el detalle | CA-1.4, RF-003, §10 |
| 2026-10-31 | Al cambiar el estado desde el detalle, ¿dónde entra la tarjeta en la columna nueva? | La primera, sin cambiar el orden de las demás (como una tarea nueva en Backlog y como el teclado al pasar de columna) | CA-2.4, RF-010 |
| 2026-10-31 | ¿Cómo se mueve y ordena con teclado (C-20)? | Desde el asa: Espacio o Enter para coger y soltar, flechas para mover, Esc para cancelar, con anuncios. Sin acciones «Subir»/«Bajar» en el detalle | HU-3, §9 |
| 2026-10-31 | Por debajo de 768 px (una sola columna visible), ¿qué permite el arrastre? | Solo ordenar la columna visible; para cambiar de columna, el detalle o el teclado. Soltar sobre el selector de estados no mueve la tarea | HU-4, CA-4.5, RF-019, §9 |
| 2026-10-31 | Por debajo de 768 px, con una tarjeta cogida con teclado, ¿qué hacen Flecha izquierda y derecha? | Pasan la tarjeta a la columna anterior o siguiente, y el tablero muestra esa columna; si se cancela, vuelve a la de partida | CA-3.9, CA-3.10, RF-023 |

## 12. Registro de cambios

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 0.1     | 2026-10-31 | Borrador inicial | Spec 003 del roadmap |
| 0.2     | 2026-10-31 | Resueltas 5 aclaraciones: fecha real de fin automática al soltar en Done (CA-1.4, RF-003); al cambiar de estado desde el detalle, la tarjeta entra la primera (CA-2.4, RF-010); teclado desde el asa (HU-3); por debajo de 768 px el arrastre solo ordena la columna visible (HU-4, RF-019, CA-4.5) y el teclado sí cambia de columna mostrando la nueva (RF-023, CA-3.9, CA-3.10). Dos puntos nuevos en «Fuera de alcance» | `/sdd-clarificar` |
