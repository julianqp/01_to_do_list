---
id: 004
titulo: Aplicar el sistema de diseño
estado: en-implementacion # borrador | aprobada | en-implementacion | implementada | obsoleta
version: 1.1
autor: Julian Querol Polo
creada: 2026-10-29
aprobada: 2026-10-29, Julian Querol Polo
ticket:
---

# Spec 004 · Aplicar el sistema de diseño

> Esta spec describe QUÉ y POR QUÉ. No contiene decisiones técnicas (eso va en `plan.md`).
> Lo que no se sepa se marca con `[NECESITA ACLARACIÓN: pregunta concreta]`. No se inventa.
> Lo visual (colores, tamaños, radios, sombras, tono) lo fija `DESIGN.md` (C-26); esta spec dice **qué pantallas y estados** deben seguirlo y cómo se comprueba. Las referencias «§n» son a `DESIGN.md`.

## 1. Contexto y problema

Las tres pantallas que existen (inicio de sesión, registro y zona privada, de la spec 001) tienen un aspecto provisional: grises genéricos, bordes rectos y sin un sistema común. No cumplen `DESIGN.md` («Tinta & Niebla»), que la constitución hace obligatorio (C-26), y su texto no llega al contraste exigido (≥ 7:1). Además, no existe todavía un conjunto común de colores, tipografía y medidas, así que el tablero (spec 002) tendría que inventarlos o rehacer estas pantallas después. Esta spec da a las pantallas actuales el aspecto del sistema de diseño, sin cambiar lo que hacen, y deja listos esos valores comunes para la 002.

## 2. Objetivos

- Las pantallas de inicio de sesión, registro y zona privada siguen los patrones de §11.1 y §11.2.
- Todo el texto de esas pantallas tiene un contraste ≥ 7:1 (≥ 4.5:1 si es grande) sobre la superficie en que aparece.
- Las tres pantallas se usan sin perder contenido entre 320 y 1600 px de ancho.
- Los valores visuales de `DESIGN.md` están definidos una sola vez y listos para que la spec 002 los use.
- El comportamiento y los textos de la spec 001 no cambian, salvo lo que indica RF-019.

## 3. Usuarios y actores

| Actor | Descripción | Qué necesita |
|-------|-------------|--------------|
| Visitante | Persona sin sesión (spec 001) | Entrar o crear su cuenta en pantallas con el aspecto y el contraste de `DESIGN.md` |
| Usuario | Persona con sesión (spec 001) | Una zona privada con la cabecera del sistema de diseño |

## 4. Historias de usuario

### HU-1 · Pantallas de acceso con el sistema de diseño (P1)

Como visitante, quiero que las pantallas de inicio de sesión y registro sigan el sistema de diseño, para que tengan el mismo aspecto que el resto de la app y su texto se lea con contraste alto.

**Criterios de aceptación**

- **CA-1.1** Dada una ventana de 1280 px de ancho, cuando el visitante abre la pantalla de inicio de sesión, entonces ve sobre el lienzo punteado una tarjeta de vidrio centrada de 420 px de ancho con, en este orden: el título «Iniciar sesión», el campo Email, el campo Contraseña, el botón «Iniciar sesión» a todo el ancho de la tarjeta y «¿No tienes cuenta? Crear cuenta».
- **CA-1.2** Dada una ventana de 375 px de ancho, cuando el visitante abre la pantalla de registro, entonces la tarjeta ocupa todo el ancho menos 16 px a cada lado y no aparece scroll horizontal.
- **CA-1.3** Dada la cuenta `ana@example.com`, cuando el visitante inicia sesión con una contraseña incorrecta, entonces ve «Email o contraseña incorrectos» en una alerta de error con icono, dentro de la tarjeta y encima del campo Email.
- **CA-1.4** Dado que el servidor no responde, cuando el visitante envía el registro, entonces ve «No se ha podido conectar. Inténtalo de nuevo» en una alerta de sin conexión con icono, encima del campo Email.
- **CA-1.5** Dada una sesión caducada, cuando el usuario llega a la pantalla de inicio de sesión, entonces ve «Tu sesión ha caducado. Vuelve a iniciar sesión» en una alerta informativa con icono, encima del campo Email.
- **CA-1.6** Dado el formulario de registro, cuando el visitante lo envía con el email `ana@`, entonces el campo Email se marca con el anillo de error y un icono, y el mensaje de error de la spec 001 aparece debajo del campo, con el mismo texto que hoy.

### HU-2 · Cabecera de la zona privada (P1)

Como usuario, quiero que la zona privada muestre la cabecera del sistema de diseño, para saber dónde estoy y con qué cuenta.

**Criterios de aceptación**

- **CA-2.1** Dado el usuario `ana@example.com` en una ventana de 1280 px, cuando abre la zona privada, entonces ve una cabecera sin barra, con píldoras flotantes sobre el lienzo: a la izquierda el nombre «Mis tareas» y a la derecha `ana@example.com` y el botón «Cerrar sesión». Debajo de la cabecera, «Mis tareas» aparece de nuevo como título grande de la vista. La pestaña del navegador sigue diciendo «Mis tareas».
- **CA-2.2** Dada una ventana de 375 px, cuando el usuario abre la zona privada, entonces la cabecera muestra solo el nombre «Mis tareas» y un botón de cuenta con la letra «A», sin scroll horizontal; el email y «Cerrar sesión» no están a la vista. Debajo sigue el título grande «Mis tareas», con su tamaño de móvil.
- **CA-2.3** Dado que el servidor no responde, cuando el usuario pulsa «Cerrar sesión», entonces sigue en la zona privada y ve «No se ha podido conectar. Inténtalo de nuevo» en una alerta de sin conexión con icono, debajo de la cabecera.
- **CA-2.4** Dada una ventana de 375 px, cuando el usuario pulsa el botón de cuenta, entonces se abre un menú con `ana@example.com` y la opción «Cerrar sesión»; al elegir «Cerrar sesión» ocurre lo mismo que en 001/RF-011.
- **CA-2.5** Dado el menú de cuenta abierto, cuando el usuario pulsa Esc, hace clic fuera del menú o vuelve a pulsar el botón de cuenta, entonces el menú se cierra; si se cerró con Esc, el foco vuelve al botón de cuenta.
- **CA-2.6** Dada una ventana de 375 px y solo el teclado, cuando el usuario llega al botón de cuenta con Tab y pulsa Enter, entonces se abre el menú y el foco pasa a su primera opción; con las flechas recorre las opciones.

### HU-3 · Leer y manejar todo sin barreras (P1)

Como visitante o usuario, quiero que todo el texto se lea con un contraste alto y que todo se pueda usar con teclado y con el dedo, para usar la app sin forzar la vista ni fallar al pulsar.

**Criterios de aceptación**

- **CA-3.1** Dadas las tres pantallas, en tema claro y en tema oscuro, cuando se mide el contraste de cada texto sobre la superficie en que aparece (lienzo, tarjeta, campo, alerta, botón), entonces el texto normal da ≥ 7:1 y el grande ≥ 4.5:1.
- **CA-3.2** Dada la pantalla de inicio de sesión, cuando el visitante recorre la página con Tab, entonces cada elemento interactivo muestra un indicador de foco visible, en el mismo orden en que se ven.
- **CA-3.3** Dada una ventana de 375 px, cuando se mide cualquier botón, campo o enlace, entonces su zona de pulsación mide al menos 44 × 44 px y está separada al menos 8 px de la siguiente.
- **CA-3.4** Dada la pantalla de registro con el zoom del navegador al 200 % en una ventana de 1280 px, cuando el visitante la recorre, entonces ve todo el contenido sin scroll horizontal.

### HU-4 · Ver que la app está trabajando (P2)

Como visitante o usuario, quiero ver que mi acción se está procesando, para no pulsar dos veces ni pensar que no ha pasado nada.

**Criterios de aceptación**

- **CA-4.1** Dado un servidor que tarda 2 s en responder, cuando el visitante pulsa «Iniciar sesión», entonces, mientras espera, el botón muestra un indicador de progreso y el texto «Iniciando sesión…», mantiene su ancho y no responde a más pulsaciones.
- **CA-4.2** Dado lo mismo, cuando pulsa «Crear cuenta», entonces el botón muestra «Creando cuenta…» con el mismo comportamiento.
- **CA-4.3** Dado lo mismo, cuando el usuario pulsa «Cerrar sesión», entonces el botón muestra «Cerrando sesión…» con el mismo comportamiento.
- **CA-4.4** Dado un envío que termina con error, cuando se recibe la respuesta, entonces el botón vuelve a su texto original y se puede pulsar de nuevo.

### HU-5 · Respetar las preferencias del sistema (P2)

Como visitante o usuario, quiero que la app respete las preferencias de visualización de mi sistema, para usarla con la configuración que necesito.

**Criterios de aceptación**

- **CA-5.1** Dado un sistema con «reducir movimiento» activado, cuando aparece una alerta o se pulsa un botón, entonces no hay desplazamientos ni cambios de tamaño animados; los cambios de color se mantienen.
- **CA-5.2** Dado un sistema con «aumentar contraste» activado, cuando se abre cualquier pantalla, entonces las superficies translúcidas pasan a opacas y llevan un borde de 1 px (§17).
- **CA-5.3** Dado un sistema con el tema oscuro activado, cuando se abre cualquier pantalla, entonces se muestra con los colores del tema oscuro de §1.4 y cumple CA-3.1.
- **CA-5.4** Dado un sistema con el tema claro activado, cuando se abre cualquier pantalla, entonces se muestra con los colores del tema claro de §1.4.

### ~~HU-6~~ Eliminada: pasa a ser RNF-006 (ver Aclaraciones)

- ~~CA-6.1~~ Eliminado: su comprobación pasa a RNF-006 (ver Aclaraciones)
- ~~CA-6.2~~ Eliminado: su comprobación pasa a RNF-006 (ver Aclaraciones)

> Prioridades: **P1** imprescindible (sin esto no se publica) · **P2** importante · **P3** deseable.

## 5. Requisitos funcionales

- **RF-001** Las pantallas de inicio de sesión y registro DEBEN mostrar su contenido en una tarjeta de vidrio centrada sobre el lienzo punteado, de 420 px de ancho como máximo (§11.1). *(HU-1)*
- **RF-002** MIENTRAS la ventana mida menos de 452 px de ancho, las pantallas de acceso DEBEN mostrar la tarjeta a todo el ancho menos 16 px a cada lado. *(HU-1)*
- **RF-003** Cada pantalla de acceso DEBE mostrar, en este orden y en cualquier ancho de ventana: título, avisos de formulario, campo Email, campo Contraseña, botón principal a todo el ancho de la tarjeta y enlace a la otra pantalla. *(HU-1)*
- **RF-004** CUANDO el sistema muestre un aviso de formulario, DEBE hacerlo como alerta con icono dentro de la tarjeta y encima de los campos, de tipo error para «Email o contraseña incorrectos», sin conexión para «No se ha podido conectar. Inténtalo de nuevo» e informativa para «Tu sesión ha caducado. Vuelve a iniciar sesión». *(HU-1)*
- **RF-005** SI un campo tiene un error, ENTONCES el sistema DEBE marcarlo con el anillo de error y un icono, y mostrar el mensaje bajo el campo (§12, §13). *(HU-1)*
- **RF-006** La zona privada DEBE mostrar la cabecera flotante de §3.2, fija al hacer scroll, con el nombre «Mis tareas» a la izquierda y el email del usuario y «Cerrar sesión» a la derecha. *(HU-2)*
- **RF-007** MIENTRAS la ventana mida menos de 768 px, la cabecera DEBE mostrar solo el nombre «Mis tareas» y un botón de cuenta con la inicial del email, en lugar del email y «Cerrar sesión». *(HU-2)*
- **RF-008** SI no se puede cerrar la sesión, ENTONCES el sistema DEBE mostrar el mensaje de error como alerta con icono debajo de la cabecera. *(HU-2)*
- **RF-009** Todo texto de las pantallas DEBE tener un contraste ≥ 7:1, o ≥ 4.5:1 si es texto grande, medido sobre la superficie en que aparece. *(HU-3)*
- **RF-010** Los elementos no textuales que transmiten información (iconos de alerta, anillos de error, indicadores de foco) DEBEN tener un contraste ≥ 3:1 con lo que los rodea. *(HU-3)*
- **RF-011** CUANDO un elemento interactivo reciba el foco con el teclado, el sistema DEBE mostrar un indicador de foco visible (§8). *(HU-3)*
- **RF-012** MIENTRAS la ventana mida menos de 1024 px, cada elemento interactivo DEBE tener una zona de pulsación de al menos 44 × 44 px y estar separado al menos 8 px del siguiente. *(HU-3)*
- **RF-013** MIENTRAS se envía un formulario de acceso o se cierra la sesión, el botón pulsado DEBE mostrar un indicador de progreso y el texto «Iniciando sesión…», «Creando cuenta…» o «Cerrando sesión…», mantener su ancho y no aceptar más pulsaciones. *(HU-4)*
- **RF-014** MIENTRAS el sistema tenga activada la preferencia de reducir movimiento, la app NO DEBE animar desplazamientos ni cambios de tamaño. *(HU-5)*
- **RF-015** MIENTRAS el sistema tenga activada la preferencia de aumentar contraste, la app DEBE mostrar las superficies opacas y con un borde de 1 px (§17). *(HU-5)*
- **RF-016** MIENTRAS el sistema tenga activado el tema oscuro, la app DEBE mostrarse con los colores del tema oscuro de §1.4; en cualquier otro caso, con los del tema claro. *(HU-5)*
- ~~RF-017~~ Eliminado: pasa a RNF-006 (ver Aclaraciones)
- ~~RF-018~~ Eliminado: pasa a RNF-006 (ver Aclaraciones)
- **RF-019** Salvo RF-004 (posición y forma de los avisos), RF-007 y RF-020 (en ventanas de menos de 768 px, el email y «Cerrar sesión» de 001/RF-015 pasan al menú de cuenta) y RF-013 (texto del botón mientras se espera), el sistema DEBE mantener sin cambios los textos, validaciones, mensajes y navegación de la spec 001 v2.0. *(HU-1, HU-2)*
- **RF-020** CUANDO el usuario active el botón de cuenta, el sistema DEBE abrir un menú con su email y la opción «Cerrar sesión». *(HU-2)*
- **RF-021** CUANDO el usuario pulse Esc, haga clic fuera del menú de cuenta o vuelva a activar el botón de cuenta, el sistema DEBE cerrar el menú. *(HU-2)*
- **RF-022** El botón de cuenta y su menú DEBEN poder usarse solo con teclado: abrir con Enter o Espacio, recorrer las opciones con las flechas y, al cerrar con Esc, devolver el foco al botón (§17). *(HU-2)*
- **RF-023** El botón de cuenta DEBE mostrar el primer carácter del email en mayúscula y tener un nombre accesible que incluya el email completo. *(HU-2)*
- **RF-024** La zona privada DEBE mostrar, debajo de la cabecera, el título «Mis tareas» con el estilo de título de vista (§2.2, display), y ese título DEBE ser el encabezado principal de la página. *(HU-2)*

## 6. Requisitos no funcionales

- **RNF-001** Accesibilidad: WCAG 2.2 AA en todo componente interactivo y AAA en el contraste del texto (C-20, C-26); se comprueba con pruebas automáticas y con la checklist de §21.
- **RNF-002** Responsive: las tres pantallas se usan sin scroll horizontal ni contenido cortado a 320, 375, 768, 1024, 1280 y 1600 px de ancho, y con el zoom al 200 % a 1280 px.
- **RNF-003** Privacidad: las fuentes tipográficas y los iconos se sirven desde la propia app; abrir cualquier pantalla no genera ninguna petición a servicios de terceros (C-16).
- **RNF-004** Compatibilidad: las mismas que la spec 001 (dos últimas versiones estables de Chrome, Safari y Edge en escritorio), también con la ventana reducida a anchos de móvil.
- **RNF-005** Movimiento: ninguna animación dura más de 420 ms (§8).
- **RNF-006** Consistencia: todos los colores, tipografía, espaciados, radios, sombras, capas y duraciones de animación de las pantallas salen de un único catálogo de valores basado en `DESIGN.md`. Se comprueba así: (a) ninguna pantalla usa un valor visual que no esté en el catálogo (0 casos en la revisión); (b) el catálogo contiene todos los valores con nombre de §1–§8 para los temas claro y oscuro; (c) los valores que `DESIGN.md` da como pendientes («Pendiente de decidir» 1) cumplen §1.3 y §1.6 y quedan añadidos a `DESIGN.md`.

## 7. Casos límite y errores

| # | Situación | Comportamiento esperado |
|---|-----------|-------------------------|
| E-1 | Email de 254 caracteres en la cabecera | Se recorta con «…» sin desbordar la cabecera; el email completo se ve al pasar el ratón o al llevar el foco, y lo lee un lector de pantalla |
| E-2 | Ventana de 320 px | Las tres pantallas sin scroll horizontal (RNF-002) |
| E-3 | Navegador sin soporte del efecto de desenfoque del vidrio | Las superficies se muestran más opacas (§6.3) y el contraste sigue cumpliendo RF-009 |
| E-4 | La fuente tipográfica aún no se ha descargado o falla | El texto se ve con la fuente de respaldo de §2.1; nunca queda invisible |
| E-5 | Sesión caducada y, después, credenciales incorrectas | Se ven las dos alertas, como hoy: primero la de sesión caducada y debajo la de error |
| E-6 | Mensaje de error largo en una ventana de 320 px | El texto pasa a varias líneas; no se recorta |
| E-7 | Doble pulsación durante un envío | La segunda no tiene efecto (RF-013; 001/E-8) |
| E-8 | El sistema cambia de preferencia (movimiento, contraste o tema) con la app abierta | La app la aplica sin recargar la pantalla |
| E-9 | Idioma | Solo español de España (§16), como en la spec 001 |
| E-10 | Con el menú de cuenta abierto, la ventana pasa a medir 768 px o más | El menú se cierra y la cabecera muestra el email y «Cerrar sesión» (RF-006) |
| E-11 | Email que empieza por un número o un símbolo (p. ej. `1ana@example.com`) | El botón de cuenta muestra ese carácter tal cual: «1» (RF-023) |
| E-12 | «Cerrar sesión» desde el menú de cuenta con un servidor que tarda 2 s | El menú sigue abierto y la opción muestra «Cerrando sesión…» (RF-013); si falla, el menú se cierra, el foco vuelve al botón de cuenta y aparece la alerta de RF-008 |
| E-13 | Se abre cualquier pantalla con el tema oscuro activado en el sistema | Se pinta directamente en tema oscuro, sin que se vea antes el tema claro (RF-016) |
| E-14 | Con el menú de cuenta abierto, el usuario pulsa Tab | El menú se cierra y el foco pasa al siguiente elemento de la página |

## 8. Entidades y glosario

- **Sistema de diseño**: las reglas visuales de `DESIGN.md` («Tinta & Niebla»).
- **Catálogo común de valores**: el conjunto único, con nombre, de colores, tipografía, espaciados, radios, sombras, capas y tiempos de animación de `DESIGN.md`, que usan todas las pantallas.
- **Lienzo punteado**: fondo liso de la app con una retícula de puntos (§3.3).
- **Tarjeta de vidrio**: superficie translúcida con desenfoque que agrupa el contenido (§6).
- **Cabecera flotante**: cabecera sin barra, hecha de píldoras sobre el lienzo (§3.2).
- **Alerta**: aviso con icono y tono (error, sin conexión, informativa) dentro de una tarjeta o bajo la cabecera (§14 Feedback).
- **Texto grande**: ≥ 24 px, o ≥ 19 px con peso 500 (§1.6).
- **Superficie**: lo que hay detrás de un texto (lienzo, tarjeta, campo, alerta, botón).
- **Botón de cuenta**: botón circular de la cabecera, con la inicial del email, que solo aparece en ventanas de menos de 768 px (§14 Avatar).
- **Menú de cuenta**: menú flotante que abre el botón de cuenta, con el email y «Cerrar sesión» (§14 Overlays).

## 9. Fuera de alcance

- Cambiar los textos de la spec 001 para ajustarlos a la voz de §15 (p. ej. «Este campo es obligatorio»): es un cambio de la spec 001 (`DESIGN.md`, «Pendiente de decidir» 4).
- Un selector de tema dentro de la app.
- Esqueleto de carga mientras se comprueba la sesión: en uso local tarda menos de 300 ms y, por debajo de eso, §12 pide no mostrar nada.
- Aviso en la zona privada cuando no se puede contactar con el servidor al cargarla (ya en «Ideas sin priorizar», para la 002).
- Botón para mostrar u ocultar la contraseña.
- El tablero, sus columnas, tarjetas, diálogos y el mapa de colores de los estados (spec 002).
- Navegadores móviles reales y Firefox como plataformas de compatibilidad.
- Notificaciones tipo toast: ninguna acción de estas pantallas las usa.

## 10. Dependencias y supuestos

- **Depende de:** spec 001 (`implementada`), cuyas pantallas se rediseñan, y `DESIGN.md` v1.1.0-todo.1. La spec 002 depende de esta.
- **Supuestos:**
  - Esta spec no cambia ninguna regla de negocio ni la navegación de la 001; sus pruebas siguen pasando sin cambiar lo que comprueban (RF-019).
  - Tipos de alerta: el error de credenciales es de error; el de conexión, de sin conexión (§12); el de sesión caducada, informativa, porque no es un fallo del usuario.
  - Textos en gerundio de los botones (RF-013): «Iniciando sesión…», «Creando cuenta…» y «Cerrando sesión…», siguiendo §12.
  - Un email que no cabe en la cabecera se recorta con «…» y el completo sigue disponible (E-1), como permite §4.
  - El diseño para móvil se comprueba reduciendo la ventana en los navegadores de RNF-004.
  - «Mis tareas» hace de nombre de la app: va a la izquierda de la cabecera y sigue siendo el título de la pestaña. No se añade otro nombre. En la cabecera es solo un nombre; el encabezado principal de la página es el título grande (RF-024).
  - La spec 002 decidirá qué pasa con el título grande «Mis tareas» cuando llegue el tablero (§11.3 propone «Tablero» en ese sitio).
  - Las pantallas de inicio de sesión y registro no llevan cabecera (§11.1).
  - En las pantallas de acceso, el botón principal va siempre dentro de la tarjeta, también en móvil. Es una excepción a §13 («en móvil, el primario va a ancho completo y fijo abajo») que se justifica en el plan (C-26).
  - En ventanas de 768 px o más no se muestra la inicial del email: solo el email y «Cerrar sesión» (§3.2).
  - Las opciones del menú de cuenta miden 44 px de alto, no los 42 px de §14 (Menu), para cumplir RF-012 en pantallas táctiles.
  - El tema sigue siempre la preferencia del sistema; sin preferencia, se usa el claro.
  - Los ficheros de valores del sistema original no están disponibles, así que los valores que `DESIGN.md` da como pendientes se crean desde cero cumpliendo §1.3 y §1.6. El plan propone cada uno con su contraste calculado, se aprueban con el plan y después se añaden a `DESIGN.md`.

## 11. Aclaraciones

Historial de preguntas resueltas durante `/sdd-clarificar`.

| Fecha | Pregunta | Respuesta | Afecta a |
|-------|----------|-----------|----------|
| 2026-10-29 | ¿Qué nombre de la app aparece en la cabecera y en la pestaña de la zona privada? ¿Se mantiene el título «Mis tareas»? | Se queda «Mis tareas», que hace de nombre de la app en la cabecera y en la pestaña | CA-2.1, CA-2.2, RF-006, RF-007 |
| 2026-10-29 | Por debajo de 768 px, ¿botón de cuenta con menú o email y «Cerrar sesión» a la vista? | Botón de cuenta con la inicial del email que abre un menú con el email y «Cerrar sesión». En escritorio no se pregunta por la inicial: se deja sin ella (ver Supuestos) | CA-2.2, CA-2.4–2.6, RF-007, RF-020–RF-023, E-10–E-12 |
| 2026-10-29 | ¿Se aplica ya el tema oscuro o solo se definen sus colores? | Se aplica, siguiendo la preferencia del sistema y sin selector | CA-3.1, CA-5.3, CA-5.4, RF-016 |
| 2026-10-29 | ¿Dónde va «Mis tareas» en la zona privada: solo en la cabecera, también como título grande o solo como título grande? | En la cabecera, como nombre de la app, y además como título grande debajo | CA-2.1, CA-2.2, RF-006, RF-007, RF-024 |
| 2026-10-29 | En las pantallas de acceso en móvil, ¿el botón principal va dentro de la tarjeta (§11.1) o fijo abajo (§13)? | Dentro de la tarjeta en todos los tamaños; el plan justifica la excepción a §13 | RF-003, Supuestos |
| 2026-10-29 | Los valores pendientes de `DESIGN.md` hay que crearlos desde cero: ¿cómo se aprueban? | Se proponen en el plan con su contraste calculado y se aprueban con él | ~~RF-018~~ (hoy RNF-006), Supuestos |
| 2026-10-29 | ¿Los valores visuales comunes son una historia de usuario o un requisito de calidad? (revisión del usuario antes de aprobar) | Requisito no funcional de consistencia (RNF-006). Se eliminan HU-6, CA-6.1, CA-6.2, RF-017, RF-018 y el actor «Persona que desarrolla la app» | RNF-006, §3, §4, §5 |
| 2026-10-29 | Si falla «Cerrar sesión» desde el menú de cuenta y el menú se cierra, ¿dónde queda el foco? (surgió en `/sdd-planificar`) | Vuelve al botón de cuenta, para que no se pierda (WCAG 2.4.3) | E-12 |

## 12. Registro de cambios

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 0.1     | 2026-10-29 | Borrador inicial | Spec 004 del roadmap |
| 0.2     | 2026-10-29 | Resueltas 3 aclaraciones: se queda «Mis tareas»; menú de cuenta en móvil (CA-2.4–2.6, RF-020–RF-023, E-10–E-12); tema oscuro según el sistema (CA-5.4) | `/sdd-clarificar` |
| 0.3     | 2026-10-29 | Título grande «Mis tareas» además del nombre en la cabecera (RF-024, CA-2.1, CA-2.2); botón principal dentro de la tarjeta también en móvil (RF-003); valores pendientes aprobados con el plan; nuevos E-13 (sin destello de tema claro) y E-14 (Tab con el menú abierto); supuestos sobre la cabecera y la 002 | `/sdd-clarificar` (segunda ronda) |
| 1.0     | 2026-10-29 | Spec aprobada; aprobación retirada el mismo día para revisarla (ver 0.4) | Revisión con el checklist de spec superada |
| 0.4     | 2026-10-29 | Vuelve a `borrador` para revisión. Referencias a otras specs con el formato `NNN/ID` (001/RF-011, 001/RF-015, 001/E-8). HU-6, CA-6.1, CA-6.2, RF-017 y RF-018 eliminados y sustituidos por RNF-006; fuera el actor «Persona que desarrolla la app» | Revisión del usuario antes de aprobar |
| 1.0     | 2026-10-29 | Spec aprobada (versión 0.4 sin cambios) | Revisión con el checklist de spec superada |
| 1.1     | 2026-10-29 | E-12: si falla el cierre de sesión desde el menú, el foco vuelve al botón de cuenta | Aclaración surgida en `/sdd-planificar`, aprobada por el usuario (`/sdd-cambiar-spec`) |
