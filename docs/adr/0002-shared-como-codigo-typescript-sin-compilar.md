---
id: ADR-0002
titulo: packages/shared se consume como código TypeScript sin compilar
estado: aceptada
fecha: 2026-10-28
specs: [001]
---

# ADR-0002 · `packages/shared` como código TypeScript sin compilar

## Contexto

C-10 pone en `packages/shared` los tipos, esquemas Zod y reglas que usan a la vez `apps/web` y `apps/api`. Hay que decidir cómo lo consumen: compilado a JavaScript o directamente como código TypeScript. La decisión afecta a todo el monorepo y a todas las specs. La API se ejecuta en desarrollo con `tsx`, y el front lo compila Vite (Astro).

## Decisión

`packages/shared` no tiene paso de build. Su `package.json` expone el código fuente (`"exports": { ".": "./src/index.ts" }`) y lo consumen como dependencia del workspace (`"@todo/shared": "workspace:*"`). `tsx` en la API y Vite en el front transforman el TypeScript al vuelo. La comprobación de tipos la hace `tsc --noEmit` en cada paquete.

## Alternativas consideradas

| Opción | Ventajas | Inconvenientes | Por qué no |
|--------|----------|----------------|------------|
| Compilar `shared` a `dist/` | Paquete consumible por cualquier runtime | Un script de build y otro de vigilancia de cambios más; riesgo de usar un `dist` desactualizado | Complejidad sin beneficio mientras todo el código sea nuestro |
| Quitar tipos con el Node 24 nativo, sin `tsx` | Una dependencia menos | Solo admite sintaxis que se pueda borrar sin más; no hay garantías con el cliente generado de Prisma ni con fuentes TS de paquetes enlazados | Riesgo de fallos difíciles de diagnosticar |
| TypeScript project references | Compilación incremental | Configuración más compleja | Innecesario a este tamaño |

## Consecuencias

- **Positivas:** un cambio en `shared` se ve al instante en web y api; no hay artefactos compilados que mantener.
- **Negativas / deuda aceptada:** `shared` solo puede usarse desde herramientas que entienden TypeScript (`tsx`, Vite, Vitest). Si algún día se despliega la API compilada (C-6), habrá que revisar esta decisión con un ADR nuevo.
- **Cambios en la constitución:** ninguno.
