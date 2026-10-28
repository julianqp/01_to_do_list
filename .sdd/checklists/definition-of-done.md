# Definition of Done

Una feature está hecha cuando:

## Trazabilidad
- [ ] Todas las tareas de `tasks.md` están `[x]`.
- [ ] Cada RF y CA tiene al menos un test que lo verifica y pasa.
- [ ] Cada caso límite de la spec está implementado y probado.
- [ ] No hay código que no se trace a una tarea/requisito.

## Calidad
- [ ] Tests, linter y comprobación de tipos en verde (local y CI).
- [ ] Sin `console.log`, código comentado ni TODO sin ticket.
- [ ] Accesibilidad revisada en componentes interactivos.
- [ ] Sin secretos ni datos personales en el código o los logs.

## Documentación
- [ ] `spec.md` refleja exactamente lo que hace el código (sin deriva).
- [ ] Desviaciones del plan anotadas en el plan.
- [ ] ADRs creados si hubo decisiones transversales.
- [ ] Estado de la spec → `implementada`.

## Entrega
- [ ] PR con enlace a la spec, requisitos cubiertos e informe de `/sdd-verificar`.
- [ ] Revisada y aprobada.
