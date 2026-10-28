---
id: NNN
titulo: <Título corto en lenguaje de usuario>
estado: borrador          # borrador | aprobada | en-implementacion | implementada | obsoleta
version: 0.1
autor: <nombre>
creada: AAAA-MM-DD
aprobada:                 # AAAA-MM-DD, por quién
ticket:                   # enlace o ID, si existe
---

# Spec NNN · <Título>

> Esta spec describe QUÉ y POR QUÉ. No contiene decisiones técnicas (eso va en `plan.md`).
> Lo que no se sepa se marca con `[NECESITA ACLARACIÓN: pregunta concreta]`. No se inventa.

## 1. Contexto y problema

<Qué pasa hoy, a quién le duele y por qué merece la pena resolverlo ahora. 3–6 líneas.>

## 2. Objetivos

- <Resultado observable 1>
- <Resultado observable 2>

### Métricas de éxito (opcional)

- <p. ej. el 100 % de las solicitudes se hacen desde la herramienta en el primer mes>

## 3. Usuarios y actores

| Actor | Descripción | Qué necesita |
|-------|-------------|--------------|
|       |             |              |

## 4. Historias de usuario

### HU-1 · <nombre> (P1)

Como <actor>, quiero <acción>, para <beneficio>.

**Criterios de aceptación**

- **CA-1.1** Dado <contexto>, cuando <acción>, entonces <resultado observable>.
- **CA-1.2** Dado …, cuando …, entonces …

### HU-2 · <nombre> (P2)

…

> Prioridades: **P1** imprescindible (sin esto no se publica) · **P2** importante · **P3** deseable.
> Cada historia debería poder entregarse y probarse de forma independiente.

## 5. Requisitos funcionales

Formato EARS (ver `docs/03-buenas-practicas.md`). Uno por línea, atómicos y comprobables.

- **RF-001** CUANDO <evento>, el sistema DEBE <respuesta>. *(HU-1)*
- **RF-002** SI <condición no deseada>, ENTONCES el sistema DEBE <respuesta>. *(HU-1)*
- **RF-003** …

## 6. Requisitos no funcionales

- **RNF-001** Rendimiento: <valor medible>
- **RNF-002** Accesibilidad: <…>
- **RNF-003** Seguridad / privacidad: <…>
- **RNF-004** Compatibilidad: <navegadores, dispositivos>

## 7. Casos límite y errores

| # | Situación | Comportamiento esperado |
|---|-----------|-------------------------|
| E-1 | Sin datos | |
| E-2 | Volumen máximo | |
| E-3 | Sin permisos / sesión caducada | |
| E-4 | Fallo de red / servicio externo | |
| E-5 | Entrada inválida | |

## 8. Entidades y glosario

Conceptos de dominio implicados (sin tipos ni tablas; eso va en el plan).

- **<Entidad>**: <qué es, atributos relevantes para el usuario>

## 9. Fuera de alcance

Lo que explícitamente NO hace esta spec (y, si aplica, dónde se hará).

- <…>

## 10. Dependencias y supuestos

- **Depende de:** <otras specs, servicios, decisiones>
- **Supuestos:** <lo que damos por cierto; si deja de serlo, hay que revisar la spec>

## 11. Aclaraciones

Historial de preguntas resueltas durante `/sdd-clarificar`.

| Fecha | Pregunta | Respuesta | Afecta a |
|-------|----------|-----------|----------|
|       |          |           |          |

## 12. Registro de cambios

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 0.1     |       | Borrador inicial | |
