# Research · Spec 001 · Cuentas de usuario

Incógnitas técnicas resueltas antes del plan (2026-10-28). Versiones consultadas en el registro de npm ese día.

## R-1 · Cookies `Secure` en Safari sobre `http://localhost`

- **Pregunta:** ¿cumplir C-12 (cookie `secure`) funciona en local en los navegadores de RNF-004?
- **Hallazgo:** Chrome y Firefox aceptan cookies `Secure` en `http://localhost`. **Safari/WebKit no** (bugs de WebKit [218980](https://bugs.webkit.org/show_bug.cgi?id=218980), [231035](https://bugs.webkit.org/show_bug.cgi?id=231035), [232088](https://bugs.webkit.org/show_bug.cgi?id=232088)): solo las guarda si la página se sirve por HTTPS.
- **Conclusión:** sin HTTPS en local, el inicio de sesión no funcionaría nunca en Safari. El usuario eligió servir el front en desarrollo por HTTPS con un certificado autofirmado (`@vitejs/plugin-basic-ssl`, compatible con Vite 6–8; Astro 7.4 usa Vite 8). Ver D-1.

## R-2 · Argon2id sin dependencias

- **Pregunta:** C-12 exige argon2id y C-2 pide preferir lo nativo.
- **Hallazgo:** Node 24.7+ incluye `crypto.argon2()` / `crypto.argon2Sync()`. Probado en Node 24.19.0: con `argon2id`, m=19456 KiB, t=2, p=1 (parámetros mínimos de OWASP) tarda unos 17 ms y no emite `ExperimentalWarning`. No calcula ni verifica el formato PHC (`$argon2id$v=19$m=…,t=…,p=…$sal$hash`): hay que montarlo a mano (unas 25 líneas) y comparar con `crypto.timingSafeEqual`.
- **Alternativas:** `@node-rs/argon2` 2.2.2 (binarios precompilados, `hash`/`verify` con PHC) y `argon2` 0.45.1 (binding nativo de C). Las dos añaden una dependencia nativa.
- **Conclusión:** usar la API nativa detrás de dos funciones (`hashPassword`, `verifyPassword`). Si en algún momento diera problemas, se cambia por `@node-rs/argon2` sin tocar a quien las llama. Ver D-4.

## R-3 · Compatibilidad de versiones

| Paquete | Versión | Nota |
|---------|---------|------|
| typescript | **6.0.3** | La última es 7.0.2, pero typescript-eslint 8.72 exige `typescript <6.1.0` y `@astrojs/check` acepta `^5 \|\| ^6`. Se fija la 6.0 |
| prisma / @prisma/client / @prisma/adapter-pg | **7.10.1** | La etiqueta `latest` del CLI `prisma` apunta a `8.0.0-rc.28` (versión candidata). Se fija la 7.10.1 estable en los tres. `adapter-pg` ya trae `pg` |
| astro / @astrojs/react | 7.4.3 / 7.1.2 | Astro necesita Node ≥ 22.23 |
| react / react-dom | 19.3.1 | |
| @tanstack/react-query | 5.105.0 | Requiere React 18 o 19 |
| tailwindcss / @tailwindcss/vite | 4.3.3 | |
| express | 5.3.0 | `res.cookie()` y `res.clearCookie()` vienen incluidos; leer cookies no |
| zod | 4.6.7 | |
| vitest | 5.0.5 | Node 22.12+ o 24 |
| @playwright/test | 1.64.1 | |
| eslint / typescript-eslint | 10.13.0 / 8.72.1 | |
| eslint-plugin-astro / eslint-plugin-react-hooks | 3.2.1 / 7.1.1 | Compatibles con ESLint 10 |
| prettier / prettier-plugin-astro | 3.9.10 / 1.1.2 | |
| pnpm | 11.20.0 | La instalada en local; se fija con `packageManager` |
| Node | 24.19.0 | La instalada; `.nvmrc` = `24` |

## R-4 · Validación de email con Zod 4

Probado `z.string().trim().toLowerCase().min(1).max(254).pipe(z.email())`:

- `"  ANA@Example.com "` → válido, `ana@example.com` (RF-003).
- `"ana@"` → formato no válido (CA-1.3).
- `"   "` → obligatorio (E-1).
- Un email de 254 caracteres (parte local de 64 + dominio con etiquetas ≤ 63) → válido; uno de 255 → supera el máximo (E-2).
- `"ñandú@correo.es"` → formato no válido. El usuario lo dio por bueno y se recoge en E-10 (spec v1.1).
- En JavaScript, `"😀".length` vale 2 y `[..."😀"].length` vale 1: para contar en caracteres y no en bytes (E-4), la longitud de la contraseña se mide por puntos de código.

## R-5 · Sesión deslizante y aviso de sesión caducada

Si la cookie caducara a la vez que la sesión (7 días), el navegador la borraría y el servidor no sabría distinguir "sesión caducada" de "sin sesión". El aviso de RF-013 no se vería nunca. Por eso la cookie vive más (30 días) que la sesión del servidor (7 días deslizantes): el servidor ve el token, encuentra la sesión caducada y responde `SESSION_EXPIRED`. Ver D-3.

## R-6 · Volver "atrás" tras cerrar sesión (CA-3.2)

Chrome, Firefox y Safari restauran páginas desde la caché de ida y vuelta (bfcache) sin volver a ejecutar JavaScript, así que podría reaparecer la zona privada con el email. La solución es escuchar `pageshow` con `event.persisted === true` en la zona privada y recargar; la recarga vuelve a comprobar la sesión. Se prueba en el E2E.
