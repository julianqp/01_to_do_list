---
id: 001
titulo: Cuentas de usuario
estado: en-implementacion # borrador | aprobada | en-implementacion | implementada | obsoleta
version: 1.1
autor: Julian Querol Polo
creada: 2026-10-28
aprobada: 2026-10-28, Julian Querol Polo
ticket:
---

# Spec 001 · Cuentas de usuario

> Esta spec describe QUÉ y POR QUÉ. No contiene decisiones técnicas (eso va en `plan.md`).
> Lo que no se sepa se marca con `[NECESITA ACLARACIÓN: pregunta concreta]`. No se inventa.

## 1. Contexto y problema

La app es un gestor de tareas personal que usarán varias personas, y cada una solo debe ver y tocar sus propias tareas. Hoy la app no existe y no hay forma de saber quién la está usando. Antes de construir el tablero (spec 002) hace falta que cada persona pueda crear una cuenta, entrar con ella y salir, y que nadie sin sesión llegue a la zona privada. Sin esto, cualquier tarea que se guarde no tendría dueño.

## 2. Objetivos

- Una persona puede crear su cuenta con email y contraseña y empezar a usar la zona privada sin pasos intermedios.
- Una persona con cuenta puede entrar, salir y volver más tarde sin tener que registrarse de nuevo.
- Nadie sin sesión válida puede ver la zona privada.

## 3. Usuarios y actores

| Actor | Descripción | Qué necesita |
|-------|-------------|--------------|
| Visitante | Persona sin sesión iniciada (tenga cuenta o no) | Crear una cuenta o iniciar sesión |
| Usuario | Persona con sesión iniciada | Usar su zona privada y cerrar sesión |

## 4. Historias de usuario

### HU-1 · Crear una cuenta (P1)

Como visitante, quiero crear una cuenta con mi email y una contraseña, para tener un espacio propio en la app.

**Criterios de aceptación**

- **CA-1.1** Dado que no existe ninguna cuenta con `ana@example.com`, cuando el visitante se registra con ese email y la contraseña `correcta-horse-1`, entonces se crea la cuenta, queda con la sesión iniciada y ve la zona privada con el texto `ana@example.com`.
- **CA-1.2** Dado que ya existe una cuenta con `ana@example.com`, cuando un visitante intenta registrarse con `ANA@Example.com `, entonces no se crea ninguna cuenta y se muestra junto al campo email el mensaje "Ya existe una cuenta con ese email".
- **CA-1.3** Dado el formulario de registro, cuando el visitante envía `ana@` como email, entonces no se crea la cuenta y se indica junto al campo email que el formato no es válido.
- **CA-1.4** Dado el formulario de registro, cuando el visitante envía una contraseña de 7 caracteres, entonces no se crea la cuenta y se indica junto al campo contraseña la longitud mínima exigida.
- **CA-1.5** Dado el formulario de registro, cuando el visitante lo envía con los dos campos vacíos, entonces no se crea la cuenta y se indica en cada campo que es obligatorio.

### HU-2 · Iniciar sesión (P1)

Como visitante con cuenta, quiero iniciar sesión con mi email y contraseña, para acceder a mi zona privada.

**Criterios de aceptación**

- **CA-2.1** Dado que existe la cuenta `ana@example.com` con contraseña `correcta-horse-1`, cuando el visitante inicia sesión con esos datos, entonces queda con la sesión iniciada y ve la zona privada.
- **CA-2.2** Dada esa misma cuenta, cuando el visitante inicia sesión con `Ana@Example.com` y la contraseña correcta, entonces también entra.
- **CA-2.3** Dada esa misma cuenta, cuando el visitante introduce una contraseña incorrecta, entonces no entra y ve el mensaje "Email o contraseña incorrectos".
- **CA-2.4** Dado que no existe ninguna cuenta con `luis@example.com`, cuando el visitante intenta entrar con ese email, entonces ve exactamente el mismo mensaje que en CA-2.3.
- **CA-2.5** Dado un error de inicio de sesión, cuando se vuelve a mostrar el formulario, entonces el campo email conserva lo escrito y el campo contraseña aparece vacío.

### HU-3 · Cerrar sesión (P1)

Como usuario, quiero cerrar sesión, para que nadie más pueda usar mi cuenta desde este navegador.

**Criterios de aceptación**

- **CA-3.1** Dado un usuario con sesión iniciada, cuando pulsa "Cerrar sesión", entonces ve la pantalla de inicio de sesión.
- **CA-3.2** Dado un usuario que acaba de cerrar sesión, cuando intenta volver a la zona privada (con "atrás" del navegador o escribiendo su dirección), entonces ve la pantalla de inicio de sesión y no la zona privada.

### HU-4 · Proteger la zona privada (P1)

Como usuario, quiero que solo se pueda entrar a mi zona privada con sesión iniciada, para que nadie vea mis datos.

**Criterios de aceptación**

- **CA-4.1** Dado un visitante sin sesión, cuando abre la dirección de la zona privada, entonces ve la pantalla de inicio de sesión.
- **CA-4.2** Dado un usuario cuya sesión ha caducado, cuando realiza cualquier acción en la zona privada, entonces ve la pantalla de inicio de sesión con el mensaje "Tu sesión ha caducado. Vuelve a iniciar sesión".
- **CA-4.3** Dado un usuario con sesión iniciada, cuando abre la pantalla de inicio de sesión o la de registro, entonces ve la zona privada.

### HU-5 · Mantener la sesión entre visitas (P2)

Como usuario, quiero seguir dentro de la app al volver a abrirla, para no tener que iniciar sesión cada vez.

**Criterios de aceptación**

- **CA-5.1** Dado un usuario que inició sesión hace 1 hora y cerró el navegador sin cerrar sesión, cuando vuelve a abrir la app, entonces ve la zona privada sin introducir credenciales.
- **CA-5.2** Dado un usuario que usó la app por última vez hace 8 días sin cerrar sesión, cuando vuelve a abrirla, entonces ve la pantalla de inicio de sesión.
- **CA-5.3** Dado un usuario que usó la app por última vez hace 6 días sin cerrar sesión, cuando vuelve a abrirla, entonces ve la zona privada sin introducir credenciales y su sesión no caduca hasta pasados otros 7 días sin uso.

> Prioridades: **P1** imprescindible (sin esto no se publica) · **P2** importante · **P3** deseable.

## 5. Requisitos funcionales

- **RF-001** CUANDO un visitante envía el registro con un email válido no registrado y una contraseña válida, el sistema DEBE crear la cuenta. *(HU-1)*
- **RF-002** CUANDO se crea una cuenta, el sistema DEBE iniciar sesión con ella y mostrar la zona privada. *(HU-1)*
- **RF-003** El sistema DEBE tratar los emails sin distinguir mayúsculas de minúsculas y sin los espacios iniciales y finales, tanto al registrar como al iniciar sesión. *(HU-1, HU-2)*
- **RF-004** SI el email del registro ya pertenece a una cuenta, ENTONCES el sistema DEBE rechazar el registro sin crear ni modificar ninguna cuenta y mostrar "Ya existe una cuenta con ese email" junto al campo email. *(HU-1)*
- **RF-005** SI el email no tiene formato `parte-local@dominio` o supera 254 caracteres, ENTONCES el sistema DEBE rechazar el registro e indicarlo junto al campo email. *(HU-1)*
- **RF-006** SI la contraseña del registro tiene menos de 8 o más de 128 caracteres, ENTONCES el sistema DEBE rechazar el registro e indicar los límites junto al campo contraseña. No se exigen reglas de composición (mayúsculas, números, símbolos). *(HU-1)*
- **RF-007** SI falta algún campo obligatorio, ENTONCES el sistema DEBE rechazar el envío e indicar qué campo falta. *(HU-1, HU-2)*
- **RF-008** CUANDO un visitante envía un email registrado y su contraseña correcta, el sistema DEBE iniciar sesión y mostrar la zona privada. *(HU-2)*
- **RF-009** SI el email no está registrado o la contraseña no coincide, ENTONCES el sistema DEBE mostrar el mensaje único "Email o contraseña incorrectos", sin indicar cuál de los dos falla. *(HU-2)*
- **RF-010** SI al enviar un formulario no se puede contactar con el servidor o este responde con un error inesperado, ENTONCES el sistema DEBE mostrar "No se ha podido conectar. Inténtalo de nuevo", conservar el email escrito y vaciar la contraseña. *(HU-1, HU-2)*
- **RF-011** CUANDO el usuario pulsa "Cerrar sesión", el sistema DEBE invalidar la sesión actual y mostrar la pantalla de inicio de sesión. *(HU-3)*
- **RF-012** MIENTRAS no haya una sesión válida, el sistema DEBE mostrar la pantalla de inicio de sesión en lugar de la zona privada. *(HU-4)*
- **RF-013** SI una acción en la zona privada se realiza con una sesión caducada, ENTONCES el sistema DEBE mostrar la pantalla de inicio de sesión con el mensaje "Tu sesión ha caducado. Vuelve a iniciar sesión". *(HU-4)*
- **RF-014** MIENTRAS haya una sesión válida, el sistema DEBE mostrar la zona privada en lugar de las pantallas de inicio de sesión y registro. *(HU-4)*
- **RF-015** La zona privada DEBE mostrar el email del usuario y la opción "Cerrar sesión". *(HU-1, HU-3)*
- **RF-016** El sistema DEBE conservar la sesión al cerrar y reabrir el navegador hasta que caduque o se cierre la sesión. *(HU-5)*
- **RF-017** SI una sesión pasa 7 días seguidos sin uso, ENTONCES el sistema DEBE considerarla caducada. *(HU-5)*
- **RF-018** CUANDO el usuario carga la zona privada o realiza una acción en ella con una sesión válida, el sistema DEBE reiniciar el plazo de 7 días de esa sesión. *(HU-5)*

## 6. Requisitos no funcionales

- **RNF-001** Accesibilidad: los formularios de registro e inicio de sesión cumplen WCAG 2.1 AA; se completan solo con teclado, cada campo tiene etiqueta visible y los mensajes de error se asocian a su campo y se anuncian a lectores de pantalla (C-20).
- **RNF-002** Seguridad: la contraseña nunca se muestra, se guarda ni se devuelve en claro; solo se conserva de forma no reversible (C-12).
- **RNF-003** Privacidad: de cada cuenta solo se guardan email, contraseña protegida y sesiones (C-16).
- **RNF-004** Compatibilidad: las dos últimas versiones estables de Chrome, Firefox, Safari y Edge en escritorio.

## 7. Casos límite y errores

| # | Situación | Comportamiento esperado |
|---|-----------|-------------------------|
| E-1 | Email vacío o solo con espacios; contraseña vacía o formada solo por espacios | Se rechaza e indica cada campo obligatorio (RF-007) |
| E-2 | Email de 254 caracteres / de 255 | 254 se acepta; 255 se rechaza (RF-005) |
| E-3 | Contraseña de 8 / 128 / 129 caracteres | 8 y 128 se aceptan; 129 se rechaza (RF-006) |
| E-4 | Contraseña con espacios mezclados con otros caracteres, tildes o emoji | Se acepta tal cual, sin recortar espacios; cuenta en caracteres, no en bytes |
| E-5 | Sesión caducada a mitad de uso | Pantalla de inicio de sesión con el aviso de RF-013 |
| E-6 | Dos pestañas abiertas; se cierra sesión en una | En la otra, la siguiente acción lleva a la pantalla de inicio de sesión |
| E-7 | Sin conexión con el servidor, o error inesperado del servidor, al enviar un formulario | Mensaje "No se ha podido conectar. Inténtalo de nuevo"; se conserva el email escrito y se vacía la contraseña (RF-010) |
| E-8 | Doble clic en "Crear cuenta" o dos registros simultáneos con el mismo email | Se crea como máximo una cuenta; el otro intento se trata como en RF-004 |
| E-9 | Misma cuenta con sesión en dos navegadores | Ambas sesiones son válidas; cerrar sesión en uno no cierra la del otro |
| E-10 | Email con caracteres fuera de ASCII (p. ej. `ñandú@correo.es`) | Se rechaza como formato no válido (RF-005) |

## 8. Entidades y glosario

- **Cuenta**: identidad de una persona en la app. Se identifica por su email (único, sin distinguir mayúsculas) y se protege con una contraseña.
- **Sesión**: estado de "dentro de la app" de una cuenta en un navegador concreto. Empieza al registrarse o iniciar sesión y termina al cerrar sesión o al caducar, tras 7 días seguidos sin uso.
- **Zona privada**: parte de la app accesible solo con sesión. En esta spec muestra el email del usuario y "Cerrar sesión"; la spec 002 añadirá el tablero.
- **Visitante / Usuario**: ver sección 3.

## 9. Fuera de alcance

- Recuperar u olvidar la contraseña y cambiarla (ya en "Ideas sin priorizar").
- Borrar la cuenta (ya en "Ideas sin priorizar").
- Cambiar el email de la cuenta.
- Verificar el email enviando un correo de confirmación.
- Inicio de sesión con proveedores externos (Google, GitHub…) y doble factor.
- Limitar los intentos fallidos de inicio de sesión (se revisará con el ADR de despliegue, C-6).
- Casilla "Recordarme" u opciones de duración de sesión elegidas por el usuario.
- Ver o cerrar las sesiones abiertas en otros navegadores.
- Perfil de usuario (nombre, foto, preferencias).
- Roles o cuentas de administrador.
- Idiomas distintos del castellano.
- Las tareas y el tablero (spec 002).

## 10. Dependencias y supuestos

- **Depende de:** ninguna spec. Es la base de 002 y 003, que usarán la cuenta para separar las tareas de cada persona.
- **Nota del roadmap:** esta spec incluye montar el esqueleto del proyecto; eso es trabajo técnico y se detalla en el plan, no aquí.
- **Supuestos:**
  - Registrarse inicia sesión automáticamente (RF-002).
  - No se verifica que el email exista; basta con que tenga formato válido.
  - Una cuenta puede tener sesiones abiertas en varios navegadores a la vez (E-9).
  - Cerrar sesión solo cierra la sesión del navegador actual.
  - Una contraseña formada solo por espacios cuenta como vacía (E-1).
  - Toda la interfaz está en castellano.
  - Mientras no exista la spec 002, la zona privada solo muestra el email y "Cerrar sesión".

## 11. Aclaraciones

| Fecha | Pregunta | Respuesta | Afecta a |
|-------|----------|-----------|----------|
| 2026-10-28 | ¿Qué mensaje ve quien se registra con un email que ya tiene cuenta? | Explícito: "Ya existe una cuenta con ese email". Sin verificación por correo, un mensaje genérico no evitaría averiguar qué emails existen | CA-1.2, RF-004 |
| 2026-10-28 | ¿Qué reglas debe cumplir la contraseña? | Solo longitud de 8 a 128 caracteres, sin reglas de composición | RF-006 |
| 2026-10-28 | ¿Se limitan los intentos fallidos de inicio de sesión? | No por ahora (uso solo local, C-6); se revisará con el ADR de despliegue | RF-010 (antiguo), §9 |
| 2026-10-28 | ¿Cuánto dura una sesión? | Caduca tras 7 días seguidos sin uso; cada uso renueva el plazo | RF-017, RF-018, CA-5.2, CA-5.3 |
| 2026-10-28 | ¿Qué ve el usuario si el servidor responde con un error inesperado? (surgió en `/sdd-planificar`) | El mismo mensaje y comportamiento que sin conexión | RF-010, E-7 |
| 2026-10-28 | ¿Se aceptan emails con caracteres fuera de ASCII? (surgió en `/sdd-planificar`) | No; se rechazan como formato no válido | E-10 |

## 12. Registro de cambios

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 0.1     | 2026-10-28 | Borrador inicial | Primera spec del roadmap |
| 0.2     | 2026-10-28 | Resueltas 4 aclaraciones; RF-010 pasa a ser el error de conexión (E-7); nuevos RF-018 y CA-5.3; E-1 y E-4 aclarados | `/sdd-clarificar` |
| 1.0     | 2026-10-28 | Spec aprobada | Revisión con el checklist de spec superada |
| 1.1     | 2026-10-28 | RF-010 y E-7 cubren también el error inesperado del servidor; nuevo E-10 (emails fuera de ASCII) | Huecos detectados en `/sdd-planificar`, aprobados por el usuario |
