---
id: ADR-0003
titulo: Los valores visuales solo salen de tokens.css, expuesto a Tailwind con @theme y vigilado por tests
estado: aceptada
fecha: 2026-10-29
specs: [004]
---

# ADR-0003 · Catálogo de tokens vigilado por tests

## Contexto

C-26 obliga a que la interfaz siga `DESIGN.md`. `DESIGN.md` §18 fija `apps/web/src/styles/tokens.css` como fuente de verdad de los tokens y prohíbe los hex sueltos, las clases de color genéricas de Tailwind y los z-index numéricos. La spec 004 (RNF-006) pide además que ninguna pantalla use un valor fuera del catálogo («0 casos»), y RF-009 y RF-010 piden contraste AAA en texto y 3:1 en lo demás, en cada superficie y en cada tema.

Afecta a todas las specs con interfaz (002, 003 y las siguientes). Hay tres problemas técnicos (`specs/004-sistema-de-diseno/research.md`, R-1):

- Varios nombres de `DESIGN.md` coinciden con espacios de nombres de Tailwind 4, como `--text-*`, `--radius-*` y `--shadow-*`.
- Tailwind descompone las sombras multicapa.
- Tailwind no puede impedir valores arbitrarios como `p-[7px]` o `bg-[#fff]`.

Además, axe no calcula el contraste sobre vidrio (`backdrop-filter`), degradados ni la retícula de puntos.

## Decisión

1. **Un solo catálogo.** `tokens.css` usa los nombres de `DESIGN.md` y se importa en `global.css` después de Tailwind. Tiene tres partes:
   - `@theme static`: tipografía, radios, curvas y breakpoints, con `initial` en cada espacio de nombres para quitar los valores por defecto de Tailwind (la paleta genérica desaparece).
   - `@theme inline`: nombres de clase de los colores semánticos.
   - Variables normales: colores, sombras, capas, duraciones y retícula, con sus variantes de tema oscuro (`:root[data-theme='dark']`), «aumentar contraste» y «sin blur».

   Los primitivos (`--ink-*`, acentos) no tienen clase. Las sombras, capas y duraciones se usan como `shadow-(--token)`, `z-(--token)` y `duration-(--token)`.
2. **Test de reglas** (`apps/web/src/design-rules.test.ts`). Revisa los componentes, las páginas y `global.css`, y falla si encuentra:
   - colores literales;
   - valores arbitrarios entre corchetes;
   - `style=`;
   - capas, duraciones o retardos numéricos;
   - transformaciones sin `motion-safe:`;
   - referencias `(--x)` a tokens que no existen.

   Solo `tokens.css` puede tener valores literales.
3. **Test de contraste** (`apps/web/src/styles/tokens.test.ts`). Lee `tokens.css`, compone las superficies translúcidas sobre su fondo real con `culori` y exige los mínimos de `DESIGN.md` §1.6 para cada pareja de texto (o elemento no textual) y superficie. Lo hace en claro, en oscuro, sin blur y con «aumentar contraste». Las parejas permitidas son una tabla explícita, y cada spec que añade una superficie o un texto nuevo la amplía.
4. **axe en E2E** (`@axe-core/playwright`) como segunda red, en los dos temas.

Detalle y valores: `specs/004-sistema-de-diseno/plan.md` (D-1, D-3, D-12).

## Alternativas consideradas

| Opción | Ventajas | Inconvenientes | Por qué no |
|--------|----------|----------------|------------|
| Generar `tokens.css` desde un módulo TypeScript | Valores tipados, reutilizables en los tests | Un paso de build más para valores que solo consume CSS | Complejidad sin beneficio: el test lee el CSS directamente |
| Todo el catálogo dentro de `@theme` | Un solo bloque | Tailwind descompone las sombras multicapa; `@theme` no admite variantes por tema ni media queries | No funciona para sombras ni temas (R-1) |
| Revisión manual del uso de tokens en cada `/sdd-verificar` | Sin código de test | No impide que una spec meta valores sueltos; depende de la atención de quien revisa | RNF-006 pide «0 casos» y comprobables |
| Regla de ESLint propia | Error en el editor | Más código y mantenimiento que una expresión regular sobre clases | Mismo resultado con un test sencillo |
| Solo axe para el contraste | Sin código propio | No mide sobre vidrio, degradados ni retícula; deja la mayoría de parejas como «incompletas» | Cobertura insuficiente para RF-009 |

## Consecuencias

- **Positivas:**
  - Las specs 002 y 003 heredan el catálogo y las reglas sin decidir nada nuevo.
  - Un valor suelto o un contraste insuficiente rompe `pnpm test`, en vez de descubrirse en la revisión visual.
  - El tema oscuro y «aumentar contraste» funcionan sin tocar los componentes (`DESIGN.md` §1.5).
- **Negativas / deuda aceptada:**
  - La tabla de parejas texto–superficie del test hay que mantenerla a mano. Si un componente usa una pareja que no está en ella, el test no lo ve: lo cubren axe, donde puede calcular, y la checklist de `DESIGN.md` §21.
  - El test de reglas usa expresiones regulares sobre las clases. Una clase construida dinámicamente con concatenación de cadenas podría escaparse, así que las clases se escriben completas.
  - Un valor nuevo exige tocar `tokens.css` y `DESIGN.md` en la misma rama (`DESIGN.md` §19).
- **Cambios en la constitución:** ninguno. Desarrolla C-26 y `DESIGN.md` §18.
