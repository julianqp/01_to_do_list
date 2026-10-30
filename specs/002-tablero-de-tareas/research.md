---
spec: 002
creado: 2026-10-30
---

# Investigación · Spec 002 · Tablero de tareas

Incógnitas técnicas resueltas antes del plan. Las decisiones que salen de aquí están en `plan.md` (D-x).

## R-1 · Contraste de las superficies nuevas del tablero

**Pregunta:** ¿qué textos de `DESIGN.md` §11.3, §11.4 y §14 llegan a 7:1 (≥ 4.5:1 si es texto grande) sobre las superficies nuevas del tablero, en claro y en oscuro, normal (N), sin blur (SB) y con «aumentar contraste» (C+)?

**Método:** el mismo que `apps/web/src/styles/tokens.test.ts` (plan 004 D-12): se leen los valores de `tokens.css`, se componen las capas translúcidas en sRGB con 8 bits por canal y se mide con `wcagContrast` de `culori`. El script está fuera del repositorio; lo que se queda es la tabla, que se pasará al test (plan §7).

Superficies (de abajo arriba; «base» es el lienzo, o el lienzo con un punto de la retícula en SB):

| Superficie | Composición | Dónde |
|---|---|---|
| `dot` | lienzo + punto | título, recuento total, estado vacío, error de carga |
| `column` | base + glass | columna (= `card` de la 004) |
| `card` | base + glass + raised | tarjeta de tarea (= `field` de la 004) |
| `cardHover` | base + glass + raised-hover | tarjeta con hover o foco, si subiera de nivel (§8) |
| `emptySlot` | base + glass + sunken | hueco de la columna vacía (§11.3) |
| `badgeLate` | `card` + amber-soft | insignia «Retrasada» |
| `dialog` | base + velo `rgba(6,20,27,.32)` + raised | diálogo / panel inferior |
| `folder` | `--surface-folder` (opaco) | carpetas «Datos» y «Fechas» |
| `folderField` | folder + raised | campo dentro de una carpeta |
| `segTrackFolder` / `segOnFolder` | folder + sunken / + raised-hover | selector de estado: pista / opción elegida |
| `segTrackCanvas` / `segOnCanvas` | punto + sunken / + raised-hover | selector de columna en móvil |
| `alertInDialog*` | `dialog` + rose-soft / amber-soft | alertas dentro del diálogo |

Resultados, `[claro N, SB, C+] · [oscuro N, SB, C+]`. En **negrita**, lo que no llega a 7:1:

| Superficie | `--text-1` | `--text-2` | `--text-3` |
|---|---|---|---|
| dot | 12.15 ×3 · 12.87 ×3 | 7.98 ×3 · 9.46 ×3 | **5.79 ×3** · 7.50 ×3 |
| column | 16.31 16.78 16.31 · 15.16 14.20 15.16 | 10.71 11.02 10.71 · 11.14 10.44 11.14 | 7.77 8.00 7.77 · 8.83 8.28 8.83 |
| card | 17.69 17.87 17.69 · 12.02 11.05 12.02 | 11.61 11.74 11.61 · 8.83 8.12 8.83 | 8.43 8.52 8.43 · 7.01 **6.44** 7.01 |
| cardHover | 18.53 18.66 18.69 · 8.81 8.53 7.90 | 12.17 12.25 12.27 · **6.48 6.27 5.80** | 8.83 8.89 8.91 · **5.13 4.97 4.60** |
| emptySlot | 14.44 14.61 13.64 · 15.75 15.33 16.34 | 9.48 9.60 8.96 · 11.57 11.26 12.01 | **6.88 6.96 6.50** · 9.18 8.93 9.52 |
| badgeLate | 15.32 15.49 15.32 · 8.63 8.00 8.63 | 10.06 10.17 10.06 · **6.34 5.88 6.34** | 7.30 7.38 7.30 · **5.03 4.66 5.03** |
| dialog | 15.34 16.78 17.69 · 12.39 11.02 12.02 | 10.08 11.02 11.61 · 9.10 8.10 8.83 | 7.31 8.00 8.43 · 7.22 **6.42** 7.01 |
| folder | 16.78 ×3 · 14.35 ×3 | 11.02 ×3 · 10.55 ×3 | 8.00 ×3 · 8.36 ×3 |
| folderField | 17.72 17.87 17.69 · 11.84 11.05 12.02 | 11.64 11.74 11.61 · 8.70 8.12 8.83 | 8.44 8.52 8.43 · **6.90 6.44** 7.01 |
| segTrackFolder | 14.61 14.61 13.64 · 15.33 15.33 16.34 | 9.60 9.60 8.96 · 11.26 11.26 12.01 | **6.96 6.96 6.50** · 8.93 8.93 9.52 |
| segOnFolder | 18.53 18.53 18.69 · 8.95 8.95 7.90 | 12.17 12.17 12.27 · **6.58 6.58 5.80** | 8.83 8.83 8.91 · **5.21 5.21 4.60** |
| segTrackCanvas | 12.14 12.14 13.64 · 14.69 14.69 16.34 | 7.97 7.97 8.96 · 10.80 10.80 12.01 | **5.78 5.78 6.50** · 8.56 8.56 9.52 |
| segOnCanvas | 18.37 18.37 18.69 · 8.67 8.67 7.90 | 12.07 12.07 12.27 · **6.37 6.37 5.80** | 8.76 8.76 8.91 · **5.05 5.05 4.60** |
| alertInDialogErr | 13.37 14.52 15.21 · 9.05 8.21 8.76 | 8.78 9.54 9.99 · **6.65 6.03 6.44** | — |
| alertInDialogOff | 13.47 14.63 15.32 · 8.92 8.00 8.63 | 8.84 9.60 10.06 · **6.55 5.88 6.34** | — |

Otros valores:

- Botón destructivo (`--pill-rose`, parada más oscura `oklch(0.74 0.11 15)`) con `--text-on-pill`: **7.71** en todos los casos.
- Iconos de estado (no texto, ≥ 3:1) sobre la columna: en `--text-2`, ≥ 10.44. En el color del acento, en claro: sage 2.41, lilac 2.61 y amber 2.76 sobre la tarjeta, **por debajo de 3:1**. `--ink-600` sobre la columna oscura: **2.50**.
- **Diálogo en el peor caso sin desenfoque** (lo que hay detrás no se difumina): con contenido oscuro detrás en claro (`#11212D`) o claro detrás en oscuro (`--text-1`):
  - Claro SB: 15.34 / 10.08 / 7.31.
  - Oscuro SB: 9.36 / **6.88** / **5.45**.

  Con blur (N), lo de detrás queda difuminado y cerca del lienzo, que es lo que mide la fila `dialog`.

**Conclusiones** (D-9, D-10):

1. `--text-3` no sirve en el tablero:
   - falla sobre el lienzo con punto (recuento total, §11.3);
   - falla en el hueco de la columna vacía (§11.3);
   - falla en la tarjeta oscura sin blur (fechas, §11.3);
   - falla en la pista de los selectores.

   Solo cumple sobre la columna y la carpeta. Donde `DESIGN.md` propone `--text-3`, va `--text-2`.
2. Con hover o foco, la tarjeta no puede subir a `--surface-raised-hover`: el `--text-2` de las fechas cae a 5.80 en oscuro. Se eleva con sombra y desplazamiento, no con superficie.
3. Sobre las opciones elegidas de los selectores y sobre las insignias y alertas, solo `--text-1`.
4. Sobre el diálogo, fuera de las carpetas, solo `--text-1` (título y preguntas de confirmación). Etiquetas, ayudas y «(opcional)» van dentro de las carpetas, que son opacas.
5. Los iconos de estado van en `--text-2`, no en el color del acento: el significado lo da la forma del icono y el nombre (§1.3).

## R-2 · `<dialog>` nativo: Esc, cancelar y foco

**Pregunta:** ¿sirve `<dialog>` con `showModal()` para RF-021 (preguntar antes de descartar), que necesita interceptar Esc, y para devolver el foco (RF-022)?

**Hallazgos:**

- `showModal()` pone el diálogo en la capa superior, vuelve inerte el resto de la página y atrapa el foco. Funciona en las dos últimas versiones de Chrome, Edge y Safari (RNF-005).
- Esc lanza el evento `cancel`, que se puede cancelar con `preventDefault()` para pedir confirmación ([MDN, `cancel` de CloseWatcher](https://developer.mozilla.org/en-US/docs/Web/API/CloseWatcher/cancel_event)).
- **Riesgo:** Chromium aplica «close watchers». Sin una activación del usuario entre una petición de cierre y la siguiente, la segunda petición ya no es cancelable y cierra el diálogo ([Intent to Ship de Chromium](https://groups.google.com/a/chromium.org/g/blink-dev/c/jM5au7yYzHM); WPT `close-watcher/user-activation/ny-activate-preventDefault.html`). Pulsar Esc no cuenta como activación. Si el usuario pulsa Esc dos veces seguidas con cambios sin guardar, Chrome cerraría el diálogo sin la pregunta de RF-021.
- El cierre por Esc nace como acción por defecto del `keydown`. No he encontrado documentación que confirme que cancelar el `keydown` de Esc evita la petición de cierre en todos los navegadores. **Queda por verificar** en la primera tarea del diálogo (ver plan D-12 y §8).
- Al cerrarse, el diálogo devuelve el foco al elemento que lo tenía, pero ese elemento puede haber desaparecido: la tarjeta cambia de columna o se borra. El foco se mueve a mano (D-14).

## R-3 · Fechas con `Intl` en `es-ES`

Con `Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })`, en Node 24 (ICU 78.3):

- Fechas del año en curso: «14 ene», «14 may», «14 oct», «14 nov», pero **«14 sept»** (no «sep»).
- Con `year: 'numeric'`: «14 nov 2026».
- Plurales: `new Intl.PluralRules('es-ES')` da `one` para 1 y `other` para 0 y el resto.

Se acepta la salida de `Intl` tal cual (`DESIGN.md` §16: «nunca formatear fechas a mano»). Las fechas `YYYY-MM-DD` se formatean como UTC para que no cambien de día según la zona horaria. «Hoy» sale de la fecha local del navegador (`getFullYear`, `getMonth`, `getDate`), no de `toISOString`, que da la fecha UTC (E-10).

## R-4 · «No posterior a hoy» en el servidor

RF-039 se mide con la fecha de hoy **del navegador**, y el servidor no la conoce. La zona horaria más adelantada va 14 h por delante de UTC, así que la fecha local del navegador nunca supera en más de un día la fecha UTC del servidor. Por eso el servidor acepta como fin real hasta «hoy UTC + 1 día» (D-6). El front aplica el límite exacto con la fecha local.
