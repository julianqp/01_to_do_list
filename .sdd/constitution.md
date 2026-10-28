---
proyecto: <nombre>
version: 1.0
actualizada: AAAA-MM-DD
---

# Constitución del proyecto

> Principios no negociables. Toda spec, plan y tarea debe cumplirlos. Una excepción se justifica por escrito en el plan (sección "Comprobación de constitución") y, si es permanente, se convierte en una enmienda aquí.

## 1. Propósito del producto

<Una o dos frases: para quién es y qué problema resuelve.>

## 2. Stack y plataforma

- **C-1** Lenguaje: TypeScript en modo `strict`. Prohibido `any` salvo justificación en comentario.
- **C-2** Frontend: <React + Vite / Next.js / …>
- **C-3** Backend / datos: <…>
- **C-4** Gestor de paquetes: <pnpm>. No se añaden dependencias sin justificarlas en el plan (qué aporta, alternativa nativa, tamaño, mantenimiento).
- **C-5** Despliegue: <Vercel / Dokploy / AWS …>

## 3. Arquitectura

- **C-6** <p. ej. organización por features: `src/features/<feature>/{components,hooks,api,model}`>
- **C-7** <p. ej. la lógica de negocio no depende de la UI; vive en funciones puras testeables>
- **C-8** <p. ej. el acceso a datos pasa siempre por la capa `api/`; los componentes no llaman a `fetch`>

## 4. Calidad

- **C-9** Cada requisito funcional tiene al menos un test automatizado que lo verifica.
- **C-10** Tests: <Vitest + Testing Library>; e2e: <Playwright> para flujos críticos.
- **C-11** Antes de dar una tarea por hecha: tests, linter y comprobación de tipos en verde.
- **C-12** Accesibilidad: WCAG 2.1 AA en todo componente interactivo (teclado, foco, roles ARIA, contraste).

## 5. Seguridad y datos

- **C-13** Nunca secretos en el repositorio. Variables de entorno validadas al arrancar.
- **C-14** Toda entrada externa se valida en el borde (<Zod / …>).
- **C-15** <Datos personales: qué se guarda, dónde, retención>

## 6. Convenciones

- **C-16** Código y nombres en inglés; specs y documentación en castellano.
- **C-17** Commits: Conventional Commits, referenciando la spec (`feat(requests): T-004 … [spec 003]`).
- **C-18** Ramas: `feat/NNN-slug`, `fix/NNN-slug`.

## 7. Simplicidad

- **C-19** Se implementa lo que pide la spec, nada más. Las ideas extra van a "Fuera de alcance" o a una spec nueva.
- **C-20** Se prefiere reutilizar lo existente antes que crear abstracciones nuevas. Una abstracción necesita al menos dos usos reales.

## Enmiendas

| Versión | Fecha | Cambio | Motivo |
|---------|-------|--------|--------|
| 1.0     |       | Versión inicial | |
