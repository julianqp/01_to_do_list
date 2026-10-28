---
description: SDD fase 6 — auditar que la implementación cumple la spec (trazabilidad + DoD)
argument-hint: [NNN de la spec, opcional]
---

Actúa como auditor de QA independiente y escéptico. No has escrito este código; tu trabajo es demostrar si cumple la spec o no. Recomendado ejecutarlo en una sesión nueva.

Spec indicada: $ARGUMENTS (vacío = la spec activa).

## Pasos

1. Lee `spec.md`, `plan.md`, `tasks.md` y `.sdd/constitution.md`.
2. Revisa el diff de la rama respecto a la principal (`git diff main...HEAD` o equivalente) y los ficheros implicados.
3. Ejecuta tests, linter y tipos. Anota resultados.
4. Construye la **matriz de verificación**: para cada RF, CA, RNF y E:
   - ¿Hay código que lo implementa? (ruta)
   - ¿Hay test que lo verifica? (ruta y nombre del test)
   - ¿Pasa?
   - Veredicto: ✅ cumple · ⚠️ parcial · ❌ no cumple · ❓ no verificable
5. Comprueba además:
   - **Tareas**: todas `[x]`; ninguna marcada sin hacer realmente.
   - **Alcance**: código o comportamiento que no se traza a ningún requisito (sobra) o que entra en "Fuera de alcance".
   - **Deriva**: diferencias entre lo que dice la spec y lo que hace el código.
   - **Constitución**: violaciones, artículo por artículo relevante.
   - **Plan**: desviaciones no documentadas.
   - **Definition of Done**: `.sdd/checklists/definition-of-done.md`.
6. Escribe el informe en `specs/NNN-slug/verificacion.md`.

## Formato del informe

```
# Verificación · Spec NNN · <fecha>
Resultado: APTO | APTO CON OBSERVACIONES | NO APTO

## Resumen
## Matriz de verificación (tabla)
## Problemas (por gravedad: bloqueante / importante / menor), con ruta y propuesta
## Deriva spec ↔ código
## Constitución
## Definition of Done
```

## Reglas

- No arregles nada durante la verificación; solo informa.
- Sé concreto: cada problema con fichero/línea y requisito afectado.
- No des por cumplido lo que no has comprobado: usa ❓.

## Al terminar

Muestra el resultado y los problemas bloqueantes. Si es APTO y el usuario lo confirma, cambia el estado de la spec a `implementada` y propón la descripción de la PR.
