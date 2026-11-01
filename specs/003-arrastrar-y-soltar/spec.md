---
id: 003
titulo: Arrastrar y soltar
estado: en-implementacion # borrador | aprobada | en-implementacion | implementada | obsoleta
version: 5.0
autor: Julian Querol Polo
creada: 2026-10-31
aprobada: 2026-11-01 (v5.0), Julian Querol Polo   # AAAA-MM-DD, por quién; v1.0 el 2026-10-31
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
- *(v4.0)* Todo lo que se hace arrastrando se puede hacer también con un solo clic o toque, sin arrastrar.
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
- **CA-1.11** *(v2.0)* Dada la tarjeta «Preparar la demo», cuando el usuario hace clic en su asa sin desplazar el puntero, entonces se abre su detalle, como en CA-1.8, y la tarjeta no se coge.
- **CA-1.12** *(v3.0)* Dado que el servidor está caído del todo, cuando el usuario suelta «Preparar la demo» en In progress, entonces la tarjeta vuelve a To do, a su posición de antes, los recuentos vuelven a los de antes y aparece el aviso de CA-1.9 sin esperar a ninguna otra respuesta; pasados unos segundos, el tablero y el aviso siguen a la vista.

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
- **CA-3.11** *(v2.0)* Dada To do con 12 tarjetas, más de las que caben a la vista, y la primera cogida con teclado, cuando el usuario pulsa Flecha abajo hasta llevarla a la última posición, entonces en cada paso la columna se desplaza lo justo y sin animación para que la tarjeta y el foco de su asa sigan a la vista, sin quedar tapados por otro elemento. Lo mismo con Flecha arriba, y a 375 px, donde se desplaza la página.
- **CA-3.12** *(v2.0)* Dada «Preparar la demo» borrada en otra pestaña, cuando el usuario la coge con teclado, la pasa a In progress y la suelta, entonces aparece «Esta tarea ya no existe.», la tarjeta desaparece y el foco pasa a «Crear tarea».
- **CA-3.13** *(v2.0)* Dada una ventana de 375 px, con «Preparar la demo» pasada con teclado de To do a In progress y soltada, cuando el servidor no responde, entonces la tarjeta vuelve a la posición 2 de To do, el tablero vuelve a mostrar To do, el selector marca To do, el foco sigue en su asa y aparece el aviso de CA-1.9.

### HU-4 · Arrastrar con el dedo (P2)

Como usuario con pantalla táctil, quiero arrastrar las tarjetas con el dedo, para ordenar mi tablero también desde el móvil o la tablet.

Por debajo de 768 px solo se ve una columna (002/RF-034): allí el arrastre solo ordena la columna visible, y para cambiar de columna se usa el detalle (002/HU-4) o el teclado (HU-3).

**Criterios de aceptación**

- **CA-4.1** Dada una ventana de 1280 px con pantalla táctil, cuando el usuario mantiene el dedo sobre «Preparar la demo» y, sin levantarlo, la lleva a In progress y la suelta, entonces ocurre lo mismo que en CA-1.1.
- **CA-4.2** Dada una ventana de 375 px con To do visible, cuando el usuario desliza el dedo sobre la columna sin mantenerlo antes sobre una tarjeta, entonces la columna hace scroll y no empieza ningún arrastre.
- **CA-4.3** Dada una ventana de 375 px con To do visible y 3 tarjetas, cuando el usuario mantiene el dedo sobre la tercera y la suelta encima de la primera, entonces pasa a ser la primera de To do, como en CA-2.1.
- **CA-4.4** Dada una ventana de 375 px, cuando el usuario toca una tarjeta sin mantener el dedo, entonces se abre su detalle como panel inferior (002/CA-7.2).
- **CA-4.5** *(v0.2)* Dada una ventana de 375 px con To do visible, cuando el usuario arrastra con el dedo «Preparar la demo» y la suelta sobre el selector de estados o fuera de la columna, entonces la tarjeta vuelve a su sitio de antes, no se guarda nada y no aparece ningún aviso (RF-005). Soltarla sobre «Crear tarea» es CA-4.7 *(v4.0)*.
- **CA-4.6** *(v2.0)* Dada una ventana de 375 px, cuando el usuario toca el asa de una tarjeta sin mantener el dedo, entonces se abre su detalle como panel inferior, como en CA-4.4, y la tarjeta no se coge.
- **CA-4.7** *(v4.0)* Dada una ventana de 375 px con To do visible y 12 tarjetas, de modo que la columna queda debajo de «Crear tarea», cuando el usuario arrastra una tarjeta y la suelta sobre ese botón, entonces la tarjeta queda y se guarda en la posición que marcaba el hueco, y no se abre el diálogo de crear. Con solo 3 tarjetas, donde la columna termina antes del botón, soltarla ahí es soltarla fuera, como en CA-4.5.

### HU-5 · Ordenar con un clic o un toque, sin arrastrar (P1) *(v4.0)*

Como usuario que no puede o no quiere arrastrar, quiero subir o bajar una tarea dentro de su columna desde su detalle, para ordenarla con un solo clic o toque (WCAG 2.5.7).

**Criterios de aceptación**

- **CA-5.1** Dada To do con «Comprar pan», «Preparar la demo» y «Llamar al banco», en este orden, cuando el usuario abre el detalle de «Preparar la demo», entonces ve debajo de «Estado» el texto «To do, posición 2 de 3.» y los botones «Subir» y «Bajar». En el diálogo de crear una tarea no aparecen.
- **CA-5.2** Dado el detalle de CA-5.1, cuando el usuario hace clic en «Subir», entonces el texto pasa a «To do, posición 1 de 3.» y el diálogo sigue abierto; al cerrarlo, el orden es «Preparar la demo», «Comprar pan», «Llamar al banco», y se mantiene al volver a cargar el tablero.
- **CA-5.3** Dada una ventana de 375 px con el detalle de CA-5.1 como panel inferior, cuando el usuario toca «Bajar», entonces el texto pasa a «To do, posición 3 de 3.» y la tarea queda la última de To do.
- **CA-5.4** Dado solo el teclado y el foco en «Subir» en el detalle de CA-5.1, cuando el usuario pulsa Enter o Espacio, entonces la tarea sube una posición, el foco sigue en «Subir» y el lector de pantalla anuncia «To do, posición 1 de 3.».
- **CA-5.5** Dada una tarea la primera de su columna, «Subir» está inactivo y, si el usuario lo pulsa, nada cambia y no se guarda nada; igual con «Bajar» en la última. Si el botón se queda inactivo al llegar al borde, conserva el foco.
- **CA-5.6** Dado el detalle de CA-5.1 con el título cambiado y sin guardar, cuando el usuario pulsa «Subir», entonces la tarea sube y el campo conserva el título escrito. «Cancelar» sigue preguntando «¿Descartar los cambios?» y, al descartar, el título vuelve al de antes y la posición nueva se queda.
- **CA-5.7** Dado el detalle de CA-5.1 sin ningún otro cambio, cuando el usuario pulsa «Subir» y después «Cancelar», entonces el diálogo se cierra sin preguntar y la posición nueva se queda.
- **CA-5.8** Dado el detalle de CA-5.1, cuando el usuario elige In progress sin guardar, entonces «Subir» y «Bajar» quedan inactivos y debajo aparece «Guarda el cambio de estado para poder subirla o bajarla.»; si vuelve a elegir To do, se activan de nuevo y el texto desaparece.
- **CA-5.9** Dado que el servidor no responde, cuando el usuario pulsa «Subir» en el detalle de CA-5.1, entonces la tarea vuelve a la posición 2 de To do, el texto vuelve a «To do, posición 2 de 3.», el diálogo sigue abierto y dentro de él aparece el aviso de CA-1.9.
- **CA-5.10** Dada «Preparar la demo» borrada en otra pestaña, cuando el usuario pulsa «Subir» en su detalle, entonces el diálogo se cierra, en el tablero aparece «Esta tarea ya no existe.», la tarjeta desaparece y el foco pasa a «Crear tarea».
- **CA-5.11** Dada la tarea subida como en CA-5.2, cuando el usuario cambia el título y pulsa «Guardar cambios», entonces la tarjeta conserva su posición nueva. Si además cambia el estado, entra la primera de la columna nueva (RF-010).
- **CA-5.12** *(v5.0)* Dado el detalle de CA-5.1 con el título cambiado y «Guardar cambios» en camino («Guardando…»), «Subir» y «Bajar» están inactivos y, si el usuario los pulsa, nada se mueve y no se guarda nada. Si el guardado va bien, el diálogo se cierra (002/RF-013); si falla, aparece el error de guardar (002/RF-028) y los botones se activan de nuevo.
- **CA-5.13** *(v5.0)* Dado que el servidor tarda y al final no responde, cuando el usuario pulsa «Subir» en el detalle de CA-5.1 y cierra el diálogo antes de la respuesta, entonces la tarea vuelve a la posición 2 de To do, en el tablero aparece el aviso de CA-1.9 y el foco no cambia.
- **CA-5.14** *(v5.0)* Dada «Preparar la demo» borrada en otra pestaña, cuando el usuario pulsa «Subir» en su detalle y cierra el diálogo antes de la respuesta, entonces en el tablero aparece «Esta tarea ya no existe.», la tarjeta desaparece y el foco pasa a «Crear tarea» si seguía en la tarjeta o se ha perdido. Si ya está en otro sitio, no cambia.

> Prioridades: **P1** imprescindible (sin esto no se publica) · **P2** importante · **P3** deseable.

## 5. Requisitos funcionales

**Arrastrar entre columnas**

- **RF-001** CUANDO el usuario arrastre una tarjeta y la suelte en otra columna, el sistema DEBE cambiar la tarea al estado de esa columna, colocarla en la posición donde se soltó y actualizar los recuentos. *(HU-1)*
- **RF-002** MIENTRAS el usuario arrastra una tarjeta, el sistema DEBE mostrarla levantada, siguiendo al puntero o al dedo, y mostrar en la columna de destino el hueco donde caerá (§8). *(HU-1, HU-2, HU-4)*
- **RF-003** CUANDO el usuario suelte en Done una tarea que no estaba en Done, el sistema DEBE ponerle como fecha real de fin la fecha de hoy del navegador, sin abrir el detalle; el usuario puede cambiarla después desde el detalle (002/RF-038). *(HU-1)*
- **RF-004** CUANDO el usuario suelte fuera de Done una tarea que estaba en Done, el sistema DEBE dejarla sin fecha real de fin (002/RF-041). *(HU-1)*
- **RF-005** SI el usuario suelta la tarjeta fuera de cualquier columna o pulsa Esc durante el arrastre, ENTONCES el sistema DEBE devolverla a su sitio de antes sin guardar nada. *(HU-1)*
- **RF-006** CUANDO el usuario haga clic o toque una tarjeta sin arrastrarla, también en su asa *(v2.0)*, el sistema DEBE abrir su detalle como en 002/RF-012. *(HU-1, HU-4)*

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
- **RF-024** *(v2.0)* MIENTRAS haya una tarjeta cogida con teclado, tras cada paso el sistema DEBE mantener a la vista la tarjeta y el foco de su asa, desplazando la columna o la página lo justo y sin animación, y sin que queden tapados por otro elemento. *(HU-3)*

**Táctil**

- **RF-018** CUANDO el usuario mantenga el dedo sobre una tarjeta y lo desplace sin levantarlo, el sistema DEBE empezar a arrastrarla; un deslizamiento sin mantener antes el dedo DEBE hacer scroll y no arrastrar. *(HU-4)*
- **RF-019** MIENTRAS la ventana mida menos de 768 px, el arrastre (con el dedo o con el ratón) DEBE limitarse a ordenar las tarjetas de la columna visible; soltar la tarjeta fuera de esa columna, incluido el selector de estados, cuenta como soltarla fuera de cualquier columna (RF-005). *(v4.0)* «Crear tarea», fijo abajo, no cuenta como fuera cuando la columna está debajo de él, porque esa es la zona de scroll automático: la tarjeta queda y se guarda en la posición que marca el hueco. Si la columna termina antes del botón, soltarla sobre él es soltarla fuera. *(HU-4)*
- **RF-023** *(v0.2)* MIENTRAS la ventana mida menos de 768 px y haya una tarjeta cogida con teclado, CUANDO Flecha izquierda o Flecha derecha la pasen a otra columna, el sistema DEBE mostrar esa columna y marcarla en el selector de estados; SI el movimiento se cancela (RF-017), ENTONCES DEBE volver a mostrar la columna de partida. SI falla al guardarse (RF-021) y el foco seguía en su asa *(v3.1)*, ENTONCES DEBE volver a mostrar la columna de partida y mantener el foco en su asa; si el foco ya salió, no cambia ni la columna visible ni el foco. *(HU-3, HU-4)*

**Guardar y errores**

- **RF-020** CUANDO el usuario suelte una tarjeta en un sitio nuevo, el sistema DEBE mostrarla ahí antes de que el servidor confirme el cambio. *(HU-1, HU-2, HU-3)*
- **RF-021** SI al guardar un movimiento no se puede contactar con el servidor o este responde con un error inesperado, ENTONCES el sistema DEBE devolver la tarjeta a su columna y posición de antes, restaurar los recuentos y mostrar debajo de la cabecera «No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.», sin esperar a ninguna otra respuesta del servidor *(v3.0)*. *(HU-1, HU-2)*
- **RF-022** SI el usuario mueve una tarea que ya no existe o no es suya, ENTONCES el sistema DEBE mostrar «Esta tarea ya no existe.» y quitar la tarjeta del tablero (002/RF-030). Si el foco seguía en su asa, DEBE pasar a «Crear tarea» *(v2.0)*. *(HU-1, HU-2, HU-3)*
- **RF-025** *(v3.0)* SI, con el tablero ya a la vista, no se puede volver a obtener la lista de tareas, ENTONCES el sistema DEBE seguir mostrando el tablero con lo que ya tenía y NO DEBE sustituirlo por el error de carga de 002/RF-008. Acota 002/RF-008. *(HU-1, HU-2, HU-3)*

**Ordenar sin arrastrar** *(v4.0)*

- **RF-026** El detalle de una tarea ya creada DEBE mostrar, debajo de «Estado», el texto «<columna>, posición <n> de <total>.» y los botones «Subir» y «Bajar», que se activan con un clic, un toque, Enter o Espacio. Cada cambio de ese texto DEBE anunciarse al lector de pantalla. *(HU-5)*
- **RF-027** CUANDO el usuario pulse «Subir» o «Bajar», el sistema DEBE mover la tarea una posición dentro de su columna y guardarlo al momento, sin pulsar «Guardar cambios», como en RF-007 y RF-020, con el diálogo abierto, el foco en el botón pulsado y los demás campos como estén. Con ese movimiento guardándose, otra pulsación no hace nada. El movimiento no cuenta como cambio sin guardar (002/RF-021), y ni «Cancelar» ni descartar los cambios lo deshacen. *(HU-5)*
- **RF-028** SI no hay posición en esa dirección, el estado elegido en el formulario no es el guardado o hay un guardado de la tarea en camino *(v5.0)*, ENTONCES el botón DEBE quedar inactivo y conservar el foco si lo tenía. Con el estado cambiado sin guardar, DEBE mostrar debajo «Guarda el cambio de estado para poder subirla o bajarla.». *(HU-5)*
- **RF-029** SI el movimiento falla como en RF-021, ENTONCES la tarea DEBE volver a su posición de antes y el aviso de RF-021 DEBE salir dentro del diálogo, sin cerrarlo. SI la tarea ya no existe o no es suya, ENTONCES el diálogo DEBE cerrarse, con el aviso de RF-022 en el tablero y el foco en «Crear tarea». *(v5.0)* SI el diálogo ya se cerró cuando llega el fallo, ENTONCES el aviso de RF-021 o RF-022 DEBE salir en el tablero y, si la tarea ya no existe y el foco seguía en su tarjeta o se ha perdido, el foco DEBE pasar a «Crear tarea»; en cualquier otro caso, el foco no cambia. SI el usuario ha borrado la tarea desde su detalle, ENTONCES el fallo del movimiento NO DEBE mostrar ningún aviso ni devolver la tarjeta al tablero. *(HU-5)*

## 6. Requisitos no funcionales

- **RNF-001** Accesibilidad: WCAG 2.2 AA en todo componente interactivo y AAA en el contraste del texto (C-20, C-26), en tema claro y oscuro, también para la tarjeta levantada, el hueco de destino y el asa. Todo lo que se hace arrastrando se puede hacer solo con teclado (HU-3) y con un solo puntero sin arrastrar (WCAG 2.5.7) *(v4.0)*: ordenar, con «Subir» y «Bajar» (HU-5); cambiar de columna, con el estado del detalle (002/HU-4). El asa mide al menos 44 × 44 px por debajo de 1024 px (§4). Con `prefers-reduced-motion`, la tarjeta no se desplaza animada (§8). Se comprueba con pruebas automáticas y con la checklist de §21.
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
| E-21 | *(v2.0)* Se suelta la tarjeta fuera de cualquier columna en el mismo instante en que sale de ella | La tarjeta vuelve a su sitio de antes y no se guarda nada (RF-005), aunque la vista previa aún la mostrara en la columna |
| E-22 | *(v3.0)* No se puede volver a obtener la lista con el tablero a la vista, tras un movimiento o por cualquier otra causa | El tablero sigue con lo que ya tenía, sin error de carga (RF-025) y sin aviso propio; la lista se actualiza la próxima vez que se pida |
| E-23 | *(v4.0)* La tarea es la única de su columna | El detalle muestra «<columna>, posición 1 de 1.», con «Subir» y «Bajar» inactivos |
| E-24 | *(v4.0)* El orden de la columna cambió en otra pestaña con el detalle abierto | La posición es la de la lista que tiene esta pestaña; al pulsar se guarda como cualquier movimiento y gana el último (E-11) |
| E-25 | *(v5.0)* «Subir» o «Bajar» falla cuando ya hay otro diálogo abierto | El aviso queda en la zona de alerta del tablero, a la vista al cerrar ese diálogo, y el foco no sale de él (RF-029) |
| E-26 | *(v5.0)* Con «Subir» o «Bajar» en camino, el usuario borra la tarea desde su detalle | Si el movimiento falla, no aparece ningún aviso y la tarjeta no vuelve al tablero: es lo que el usuario acaba de pedir (RF-029) |

## 8. Entidades y glosario

- **Tarea**: la de 002 §8, con un dato nuevo: su **posición** dentro de su columna.
- **Posición**: lugar de una tarjeta dentro de su columna, contando desde arriba (1 es la primera). Se guarda con la tarea y ordena las tarjetas en lugar del momento de creación.
- **Arrastrar y soltar**: coger una tarjeta con el ratón o el dedo, llevarla a otra columna o posición y soltarla allí.
- **Asa**: parte de la tarjeta (icono `grip-vertical`, §9) desde la que se coge la tarjeta con teclado. Con el ratón o el dedo se comporta como el resto de la tarjeta: arrastra o abre el detalle *(v2.0)*.
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
- Arrastrar tarjetas fuera del tablero (a otra ventana o aplicación) o soltar ficheros en él.

## 10. Dependencias y supuestos

- **Depende de:** spec 002 (`implementada`), por el tablero, las tarjetas, el detalle y sus reglas de estado y fecha real de fin; spec 004 (`implementada`), por el catálogo de valores visuales; spec 001 (`implementada`), por la sesión.
- **Modifica la spec 002:** RF-008 sustituye a 002/RF-002 (orden por momento de creación), y con él a 002/CA-1.8, 002/E-22 y 002/E-24; RF-010 completa 002/RF-024 (dónde entra la tarjeta al cambiar de estado desde el detalle); RF-025 acota 002/RF-008 y 002/CA-1.6 a cuando no hay tablero que enseñar *(v3.0)*; RF-026 a RF-029 añaden «Subir» y «Bajar» al diálogo de 002/RF-012, y lo que mueven no cuenta como cambio sin guardar de 002/RF-021 *(v4.0)*. Se propone añadir en el Registro de cambios de la spec 002 una fila «Modificada por la spec 003». `DESIGN.md` §11.3 («Las tarjetas van de la creada más recientemente a la más antigua») tendrá que actualizarse en el plan.
- **Supuestos:**
  - Con ratón, la tarjeta se arrastra desde cualquier punto; el asa es el punto de entrada para el teclado. Un clic sin desplazar el puntero abre el detalle, también en el asa (RF-006). Solo Espacio, Enter o la activación de un lector de pantalla cogen la tarjeta *(v2.0)*.
  - Con el dedo, el arrastre empieza al mantener el dedo sobre la tarjeta; el tiempo exacto lo fija el plan.
  - Al soltar en Done no se pregunta la fecha real de fin: se pone la de hoy y se corrige en el detalle si hace falta (RF-003).
  - La tarjeta aparece en su sitio nuevo al soltarla, sin esperar al servidor, y vuelve atrás si falla (RF-020, RF-021).
  - El aviso de error al mover sale en la zona de alerta del tablero, debajo de la cabecera, como «Esta tarea ya no existe.» (§11.3), y es el texto de RF-021.
  - Con teclado, al pasar a otra columna la tarjeta entra la primera; luego se ajusta con Flecha arriba y abajo.
  - Que el foco salga del asa con una tarjeta cogida cancela el movimiento (RF-017).
  - Las tareas que ya existen conservan su orden actual al llegar esta spec (E-19).
  - Una tarea nueva sigue entrando la primera de Backlog (RF-009, 002/RF-011).
  - No hay límite de tareas por columna; RNF-002 se mide con 500 tareas, como 002/RNF-004.
  - *(v4.0)* «Subir» y «Bajar» solo mueven dentro de la columna guardada de la tarea; para cambiar de columna sin arrastrar sigue el estado del detalle (002/HU-4).

## 11. Aclaraciones

Historial de preguntas resueltas durante `/sdd-clarificar`.

| Fecha | Pregunta | Respuesta | Afecta a |
|-------|----------|-----------|----------|
| 2026-10-31 | Al soltar una tarjeta en Done, ¿cómo se pone la fecha real de fin? | Sola, con la fecha de hoy del navegador y sin abrir el detalle; si no es esa, el usuario la cambia después en el detalle | CA-1.4, RF-003, §10 |
| 2026-10-31 | Al cambiar el estado desde el detalle, ¿dónde entra la tarjeta en la columna nueva? | La primera, sin cambiar el orden de las demás (como una tarea nueva en Backlog y como el teclado al pasar de columna) | CA-2.4, RF-010 |
| 2026-10-31 | ¿Cómo se mueve y ordena con teclado (C-20)? | Desde el asa: Espacio o Enter para coger y soltar, flechas para mover, Esc para cancelar, con anuncios. Sin acciones «Subir»/«Bajar» en el detalle | HU-3, §9 |
| 2026-10-31 | Por debajo de 768 px (una sola columna visible), ¿qué permite el arrastre? | Solo ordenar la columna visible; para cambiar de columna, el detalle o el teclado. Soltar sobre el selector de estados no mueve la tarea | HU-4, CA-4.5, RF-019, §9 |
| 2026-10-31 | Por debajo de 768 px, con una tarjeta cogida con teclado, ¿qué hacen Flecha izquierda y derecha? | Pasan la tarjeta a la columna anterior o siguiente, y el tablero muestra esa columna; si se cancela, vuelve a la de partida | CA-3.9, CA-3.10, RF-023 |
| 2026-11-01 | Al mover con teclado en una columna con scroll, ¿cómo se mantiene la tarjeta a la vista? | Con un desplazamiento instantáneo, solo lo justo en cada paso | CA-3.11, RF-024 |
| 2026-11-01 | ¿Qué hace un clic o un toque en el asa? | Abre el detalle, como en el resto de la tarjeta. Solo Espacio, Enter o la activación de un lector cogen la tarjeta | CA-1.11, CA-4.6, RF-006, §8, §10 |
| 2026-11-01 | Si se suelta fuera de una columna en el mismo instante en que se sale, ¿se guarda? | No: se corrige para que se cumpla RF-005 también en ese caso | E-21 |
| 2026-11-01 | Con teclado, al soltar una tarea que ya no existe, ¿adónde va el foco? | A «Crear tarea», como en el detalle de la 002 | CA-3.12, RF-022 |
| 2026-11-01 | A 375 px con teclado, si falla el guardado, ¿qué columna se muestra? | La de origen, con el foco en el asa, igual que al cancelar | CA-3.13, RF-023 |
| 2026-11-01 | Con el servidor caído del todo, ¿cuándo sale el aviso de mover y qué pasa con el tablero? | El aviso y la vuelta de la tarjeta, al momento, y el tablero sigue a la vista: el error de carga solo sale si no hay nada que enseñar. Si solo falla un refresco en segundo plano, no hay aviso | RF-021, RF-025, CA-1.12, E-22 |
| 2026-11-01 | A 375 px con teclado, si falla el guardado cuando el foco ya salió del asa, ¿se vuelve a la columna de origen? | No: no cambia ni la columna visible ni el foco, porque el usuario ya sigue con otra cosa. Al cancelar se vuelve siempre | RF-023 |
| 2026-11-01 | ¿Cómo se ordena una columna con un solo puntero, sin arrastrar (WCAG 2.5.7)? | Con «Subir» y «Bajar» en el detalle, activables también con teclado. Sustituye a la respuesta del 2026-10-31 («Sin acciones Subir/Bajar en el detalle») | HU-5, RF-026, RNF-001, §9 |
| 2026-11-01 | ¿Cuándo se aplica «Subir» o «Bajar»? | Al momento, como un arrastre, sin «Guardar cambios». El diálogo sigue abierto y conserva lo que se esté editando; «Cancelar» no lo deshace, y no cuenta como cambio sin guardar | RF-027, CA-5.2, CA-5.6, CA-5.7 |
| 2026-11-01 | ¿Qué pasa con «Subir» y «Bajar» si se ha cambiado el estado sin guardar? | Quedan inactivos, con un texto que explica por qué, hasta guardar o volver al estado original | RF-028, CA-5.8 |
| 2026-11-01 | Si falla «Subir» o «Bajar», ¿dónde sale el aviso? | Dentro del diálogo, como los demás errores de guardar. Si la tarea ya no existe, el diálogo se cierra y el aviso sale en el tablero | RF-029, CA-5.9, CA-5.10 |
| 2026-11-01 | Por debajo de 768 px, ¿soltar sobre «Crear tarea» es soltar fuera? | No, si la columna está debajo: es la zona de scroll automático y se guarda en la posición que marca el hueco. Si la columna termina antes del botón, sí | RF-019, CA-4.7 |
| 2026-11-01 | ¿Qué pasa con «Subir» y «Bajar» mientras se guarda la tarea? | Quedan inactivos: el guardado no se toca y, al terminar, el diálogo se cierra o muestra su error | RF-028, CA-5.12 |
| 2026-11-01 | Si «Subir» o «Bajar» falla con el diálogo ya cerrado, ¿hay aviso? | Sí, en el tablero, como un fallo al arrastrar | RF-029, CA-5.13, CA-5.14, E-25 |
| 2026-11-01 | Y si además la tarea ya no existe, ¿adónde va el foco? | A «Crear tarea» si seguía en su tarjeta o se ha perdido; si el usuario ya está en otra cosa, no se le mueve | RF-029, CA-5.14, E-25 |
| 2026-11-01 | Con «Subir» o «Bajar» en camino y la tarea borrada desde su detalle, ¿se avisa si el movimiento falla? | No: el fallo puede venir de ese mismo borrado, y el aviso sería una falsa alarma | RF-029, E-26 |

## 12. Registro de cambios

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 0.1     | 2026-10-31 | Borrador inicial | Spec 003 del roadmap |
| 0.2     | 2026-10-31 | Resueltas 5 aclaraciones: fecha real de fin automática al soltar en Done (CA-1.4, RF-003); al cambiar de estado desde el detalle, la tarjeta entra la primera (CA-2.4, RF-010); teclado desde el asa (HU-3); por debajo de 768 px el arrastre solo ordena la columna visible (HU-4, RF-019, CA-4.5) y el teclado sí cambia de columna mostrando la nueva (RF-023, CA-3.9, CA-3.10). Dos puntos nuevos en «Fuera de alcance» | `/sdd-clarificar` |
| 1.0     | 2026-10-31 | Spec aprobada | Aprobación del usuario tras `/sdd-clarificar` |
| 2.0     | 2026-11-01 | Nuevos RF-024, CA-1.11, CA-3.11, CA-3.12, CA-3.13, CA-4.6 y E-21. Cambian RF-006 (un clic o un toque en el asa abre el detalle), RF-022 (foco a «Crear tarea») y RF-023 (volver a la columna de partida si falla el guardado), además del glosario y §10 | `/sdd-verificar` NO APTO (`verificacion.md`: B-1, I-1, M-1, M-2); decisiones del usuario con `/sdd-cambiar-spec` |
| 3.0     | 2026-11-01 | Nuevos RF-025, CA-1.12 y E-22. Cambia RF-021 (sin esperar a otra respuesta del servidor), además de §10 | Hallazgo de T-031: con la API caída no se cumplían RF-021, RF-023, CA-1.9, CA-2.6 ni CA-3.13; decisión del usuario con `/sdd-cambiar-spec` |
| 3.1     | 2026-11-01 | RF-023: al fallar el guardado, vuelve a la columna de partida solo si el foco seguía en su asa; al cancelar, siempre. Sin cambio de comportamiento: recoge lo que ya hacía D-26 | Observación M-4 de `/sdd-verificar` (`verificacion.md`, segunda); decisión del usuario con `/sdd-cambiar-spec` |
| 4.0     | 2026-11-01 | Nuevos HU-5, RF-026 a RF-029, CA-5.1 a CA-5.11, CA-4.7, E-23 y E-24: «Subir» y «Bajar» en el detalle. «Subir» y «Bajar» salen de §9. Cambian RF-019 (soltar sobre «Crear tarea» con la columna debajo guarda, como ya hacía el código) y RNF-001 (cita WCAG 2.5.7), además de §2 y §10. Ningún ID se elimina | Observaciones I-2 y M-4 de `/sdd-verificar` (`verificacion.md`, tercera); decisiones del usuario con `/sdd-cambiar-spec` |
| 5.0     | 2026-11-01 | Nuevos CA-5.12, CA-5.13, CA-5.14, E-25 y E-26. Cambian RF-028 («Subir» y «Bajar» inactivos con un guardado en camino) y RF-029 (fallo con el diálogo ya cerrado: aviso en el tablero y foco definido; sin aviso si el usuario ha borrado la tarea). Ningún ID se elimina | Observaciones I-1 e I-2 de `/sdd-verificar` (`verificacion.md`, cuarta); decisiones del usuario con `/sdd-cambiar-spec` |
