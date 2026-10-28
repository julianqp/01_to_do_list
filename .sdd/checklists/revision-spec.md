# Checklist · Revisión de spec (Puerta 1)

Marca todo antes de pasar la spec a `aprobada`.

## Contenido
- [ ] El problema está claro y justifica el trabajo.
- [ ] Cada historia tiene actor, acción y beneficio, y prioridad (P1/P2/P3).
- [ ] Cada historia tiene criterios de aceptación Dado/Cuando/Entonces con valores concretos.
- [ ] Hay criterios negativos (qué pasa cuando algo va mal).
- [ ] Los requisitos están numerados, son atómicos y siguen EARS.
- [ ] Ningún requisito usa palabras vagas (rápido, fácil, intuitivo, adecuado, etc.).
- [ ] Los requisitos no funcionales tienen valores medibles.
- [ ] Casos límite cubiertos: vacío, máximo, permisos, red, entrada inválida, concurrencia, zona horaria/idioma si aplica.
- [ ] "Fuera de alcance" está rellena.
- [ ] Supuestos y dependencias explícitos.

## Forma
- [ ] No hay decisiones técnicas (frameworks, tablas, endpoints, librerías).
- [ ] No queda ningún `[NECESITA ACLARACIÓN]`.
- [ ] El glosario usa los mismos términos que el resto de la spec.
- [ ] Cabe en ~3 páginas (si no, ¿son dos specs?).

## Coherencia
- [ ] No contradice la constitución ni otras specs `aprobadas`/`implementadas`.
- [ ] Cada RF se puede trazar a una historia.
- [ ] Alguien que no ha participado podría entenderla y decir si una implementación la cumple.
