---
spec: NNN
plan_aprobado: AAAA-MM-DD
progreso: 0/N
---

# Tareas · Spec NNN · <Título>

> Reglas:
> - Una tarea = 15 min a 2 h = un commit.
> - Orden de ejecución de arriba abajo, respetando "Depende de".
> - `[P]` = se puede hacer en paralelo con otras `[P]` de la misma fase (no tocan los mismos ficheros).
> - Al terminar: marcar `[x]`, actualizar `progreso` y anotar el commit.

## Fase 1 · Preparación

- [ ] **T-001** <Título imperativo>
  - Ficheros: `src/...`
  - Cubre: RF-00x
  - Hecho cuando: <comprobación concreta: comando que pasa, comportamiento observable>

## Fase 2 · Contratos y tests (primero en rojo)

- [ ] **T-002** [P] Definir tipos/esquemas de <…>
  - Ficheros: `…`
  - Cubre: RF-00x
  - Hecho cuando: `pnpm typecheck` pasa
- [ ] **T-003** [P] Tests para CA-1.1, CA-1.2
  - Ficheros: `….test.ts`
  - Cubre: CA-1.1, CA-1.2
  - Hecho cuando: los tests existen y fallan por la razón correcta

## Fase 3 · Núcleo

- [ ] **T-004** <…>
  - Depende de: T-002, T-003
  - Ficheros: `…`
  - Cubre: RF-001
  - Hecho cuando: T-003 en verde

## Fase 4 · Integración / UI

- [ ] **T-00x** …

## Fase 5 · Pulido y cierre

- [ ] **T-00x** Casos límite E-1…E-n
- [ ] **T-00x** Accesibilidad (RNF-00x)
- [ ] **T-00x** Documentación / changelog
- [ ] **T-00x** Ejecutar `/sdd-verificar`

## Registro

| Tarea | Commit | Notas |
|-------|--------|-------|
|       |        |       |
