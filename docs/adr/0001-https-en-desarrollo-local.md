---
id: ADR-0001
titulo: Servimos el front en desarrollo local por HTTPS con un certificado autofirmado
estado: aceptada
fecha: 2026-10-28
specs: [001]
---

# ADR-0001 · HTTPS en desarrollo local con certificado autofirmado

## Contexto

C-12 exige que la cookie de sesión lleve `Secure`, y C-6 fija que de momento la app solo se usa en local. Chrome y Firefox aceptan cookies `Secure` en `http://localhost`, pero Safari/WebKit no: solo las guarda si la página se sirve por HTTPS (bugs de WebKit [218980](https://bugs.webkit.org/show_bug.cgi?id=218980), [231035](https://bugs.webkit.org/show_bug.cgi?id=231035), [232088](https://bugs.webkit.org/show_bug.cgi?id=232088)). La spec 001 (RNF-004) incluye Safari entre los navegadores soportados. Sin HTTPS, iniciar sesión en Safari no funcionaría nunca. Detalle en `specs/001-cuentas-de-usuario/research.md` (R-1).

## Decisión

En desarrollo, el front se sirve por `https://localhost:4321` con un certificado autofirmado que genera `@vitejs/plugin-basic-ssl`, configurado en `apps/web/astro.config.mjs`. La API sigue escuchando por `http://localhost:3000` y solo se le llega a través del proxy `/api` del servidor de desarrollo (C-7). Playwright usa `ignoreHTTPSErrors: true`.

## Alternativas consideradas

| Opción | Ventajas | Inconvenientes | Por qué no |
|--------|----------|----------------|------------|
| mkcert (certificado de confianza local) | Sin avisos en el navegador | Hay que instalar mkcert y su CA en cada máquina, fuera del repo | El usuario prefirió no depender de una herramienta externa |
| Quitar Safari de los navegadores soportados | Sin cambios técnicos | Recorta la spec; Safari no funcionaría hasta que hubiera despliegue | Recorta funcionalidad pedida |
| Cookie sin `Secure` solo en desarrollo | Simple | Excepción a C-12; el desarrollo y un futuro despliegue se comportarían distinto | Debilita una regla de seguridad no negociable |

## Consecuencias

- **Positivas:** se cumple C-12 en todos los navegadores desde el primer día; desarrollo y E2E usan las mismas condiciones de cookie que un despliegue con HTTPS.
- **Negativas / deuda aceptada:** cada navegador muestra una vez el aviso de certificado no fiable, que hay que aceptar; una dependencia de desarrollo más. Si molesta, se puede cambiar a mkcert tocando solo `astro.config.mjs`.
- **Cambios en la constitución:** ninguno.
