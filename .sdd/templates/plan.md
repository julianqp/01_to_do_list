---
spec: NNN
spec_version: X.Y        # versión de la spec sobre la que se planifica
estado: borrador         # borrador | aprobado
creado: AAAA-MM-DD
aprobado:
---

# Plan técnico · Spec NNN · <Título>

> CÓMO se cumple `spec.md`. Cada decisión se justifica contra la spec y la constitución.

## 1. Resumen

<3–5 líneas: el enfoque técnico en lenguaje llano.>

## 2. Contexto técnico

- **Código existente relevante:** <rutas, componentes, utilidades que se reutilizan>
- **Patrones del proyecto que se siguen:** <…>
- **Dependencias nuevas:** ninguna / <paquete — por qué — alternativa descartada>

## 3. Comprobación de constitución

| Artículo | Cumple | Nota |
|----------|--------|------|
| C-1      | ✅     |      |
| C-4      | ✅     | Sin dependencias nuevas |
| …        | ⚠️     | Excepción: <qué y por qué> |

## 4. Diseño

### 4.1 Arquitectura y flujo

<Diagrama (Mermaid/ASCII) o descripción del flujo de datos entre piezas.>

```mermaid
flowchart LR
  UI[Componente] --> Hook --> API --> Servicio
```

### 4.2 Modelo de datos

<Tipos / esquemas / tablas nuevas o modificadas. Migraciones.>

```ts
// tipos clave
```

### 4.3 Contratos

<Endpoints, firmas de funciones públicas, eventos, props de componentes. Lo que otras piezas consumen.>

| Contrato | Entrada | Salida | Errores |
|----------|---------|--------|---------|
|          |         |        |         |

### 4.4 Componentes / módulos

| Módulo | Ruta | Responsabilidad | Nuevo/Modificado |
|--------|------|-----------------|------------------|
|        |      |                 |                  |

## 5. Decisiones

- **D-1** <Decisión>.
  - *Por qué:* <…>
  - *Alternativas descartadas:* <opción — motivo en una línea>
- **D-2** …

> Si una decisión afecta a más de esta feature, crea un ADR en `docs/adr/` y enlázalo.

## 6. Trazabilidad

| Requisito | Cómo se cumple (decisión / módulo) | Cómo se prueba |
|-----------|------------------------------------|----------------|
| RF-001    |                                    | unit / integración / e2e |
| RF-002    |                                    |                |
| RNF-001   |                                    |                |
| E-1       |                                    |                |

Todo RF, RNF y caso límite de la spec debe aparecer aquí.

## 7. Estrategia de pruebas

- **Unitarias:** <qué lógica>
- **Integración:** <qué piezas juntas>
- **E2E:** <qué flujo>
- **Manual:** <lo que no merece automatizar, y por qué>

## 8. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
|        |              |         |            |

## 9. Despliegue y operación

- Feature flag: sí/no
- Migraciones / datos: <…>
- Observabilidad: <logs, métricas, alertas>
- Rollback: <cómo se deshace>

## 10. Preguntas abiertas

- <Si las hay, el plan no se aprueba hasta resolverlas.>
