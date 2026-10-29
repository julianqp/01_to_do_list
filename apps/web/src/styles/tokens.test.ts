import { converter, wcagContrast, type Rgb } from 'culori';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Catálogo de tokens (plan 004 D-1, D-2; RNF-006 b): todos los valores con nombre de DESIGN.md §1–§8
// y los nuevos del plan §4.2 están en tokens.css, con el valor aprobado.

type Block = { path: string[]; declarations: Map<string, string> };

// Lector mínimo de CSS: cada bloque con la ruta de selectores y reglas que lo contienen
// (p. ej. ['@media (width < 768px)', ':root']) y sus declaraciones, con los espacios normalizados.
function readBlocks(css: string): Block[] {
  const blocks: Block[] = [];
  const stack: Block[] = [];
  let buffer = '';
  const declare = () => {
    const separator = buffer.indexOf(':');
    const block = stack.at(-1);
    if (block && separator > 0) {
      const name = buffer.slice(0, separator).trim();
      block.declarations.set(
        name,
        buffer
          .slice(separator + 1)
          .trim()
          .replace(/\s+/g, ' '),
      );
    }
    buffer = '';
  };
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      const block = {
        path: [...(stack.at(-1)?.path ?? []), buffer.trim()],
        declarations: new Map(),
      };
      blocks.push(block);
      stack.push(block);
      buffer = '';
    } else if (char === ';') {
      declare();
    } else if (char === '}') {
      declare();
      stack.pop();
    } else {
      buffer += char;
    }
  }
  return blocks;
}

// Con jsdom, import.meta.url no es una URL file: (no sirve para fileURLToPath).
const css = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8');
const blocks = readBlocks(css);
// Prettier puede cambiar las comillas de los selectores.
const sameSelector = (a: string, b: string) => a.replaceAll('"', "'") === b.replaceAll('"', "'");
const declarationsAt = (...path: string[]) =>
  blocks.find(
    (block) =>
      block.path.length === path.length &&
      block.path.every((selector, i) => sameSelector(selector, path[i]!)),
  )?.declarations ?? new Map<string, string>();
const topLevel = (selector: string) => declarationsAt(selector);

// Tema claro: lo que no cambia con el tema (`@theme static`) y las variables de `:root`.
const light = new Map([...topLevel('@theme static'), ...topLevel(':root')]);

const accent = (hue: number) => `oklch(0.68 0.11 ${hue})`;
const pill = (hue: number) =>
  `radial-gradient(120% 140% at 0 0, rgba(255,255,255,.45), transparent 55%), linear-gradient(100deg, oklch(0.80 0.10 ${hue}), oklch(0.74 0.11 ${hue}))`;
const HUES = { sage: 150, rose: 15, lilac: 300, amber: 75, signal: 40 } as const;

// DESIGN.md §1–§8 y plan §4.2, con el valor del tema claro. `--bp-*` (§4) se llama
// `--breakpoint-*` en Tailwind (plan §4.6).
const EXPECTED: Record<string, string> = {
  // §1.1 y §1.2
  '--ink-950': '#06141B',
  '--ink-900': '#11212D',
  '--ink-800': '#253745',
  '--ink-700': '#3A4C59',
  '--ink-600': '#4A5C6A',
  '--ink-500': '#627480',
  '--ink-400': '#74858B',
  '--ink-300': '#9BA8AB',
  '--ink-200': '#CCD0CF',
  '--ink-100': '#E3E6E6',
  '--ink-50': '#EEF0F0',
  '--ink-0': '#F8F9F9',
  // §1.3
  '--sage': accent(HUES.sage),
  '--rose': accent(HUES.rose),
  '--lilac': accent(HUES.lilac),
  '--amber': accent(HUES.amber),
  '--signal': accent(HUES.signal),
  '--sage-soft': `oklch(0.68 0.11 ${HUES.sage} / 0.16)`,
  '--rose-soft': `oklch(0.68 0.11 ${HUES.rose} / 0.16)`,
  '--lilac-soft': `oklch(0.68 0.11 ${HUES.lilac} / 0.16)`,
  '--amber-soft': `oklch(0.68 0.11 ${HUES.amber} / 0.16)`,
  '--pill-sage': pill(HUES.sage),
  '--pill-rose': pill(HUES.rose),
  '--pill-lilac': pill(HUES.lilac),
  '--pill-amber': pill(HUES.amber),
  '--pill-ink': 'linear-gradient(100deg, #34495A, var(--ink-800))',
  // §1.4
  '--bg-canvas': 'var(--ink-100)',
  '--surface-glass': 'rgba(244,246,246,.60)',
  '--surface-raised': 'rgba(250,251,251,.80)',
  '--surface-raised-hover': 'rgba(255,255,255,.96)',
  '--surface-sunken': 'rgba(204,208,207,.42)',
  '--surface-folder': '#F1F3F3',
  '--surface-row': '#E8EBEB',
  '--text-1': 'var(--ink-950)',
  '--text-2': 'var(--ink-800)',
  '--text-3': 'var(--ink-700)',
  '--text-on-accent': 'var(--ink-0)',
  '--text-on-pill': 'var(--ink-950)',
  // §2.1 y §2.2
  '--font-sans': "'Geist Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  '--font-mono': "'Geist Mono Variable', ui-monospace, monospace",
  '--text-display': '3.5rem',
  '--text-h1': '2.5rem',
  '--text-h2': '1.875rem',
  '--text-h3': '1.25rem',
  '--text-body': '0.9375rem',
  '--text-sm': '0.8125rem',
  '--text-xs': '0.75rem',
  // §3.1 y §3.3
  '--space-1': 'calc(var(--spacing) * 1)',
  '--space-2': 'calc(var(--spacing) * 2)',
  '--space-3': 'calc(var(--spacing) * 3)',
  '--space-4': 'calc(var(--spacing) * 4)',
  '--space-5': 'calc(var(--spacing) * 5)',
  '--space-6': 'calc(var(--spacing) * 6)',
  '--space-7': 'calc(var(--spacing) * 7)',
  '--space-8': 'calc(var(--spacing) * 8)',
  '--space-10': 'calc(var(--spacing) * 10)',
  '--space-12': 'calc(var(--spacing) * 12)',
  '--space-16': 'calc(var(--spacing) * 16)',
  '--dot-color': 'rgba(6,20,27,.10)',
  '--dot-grid': 'radial-gradient(circle at 1px 1px, var(--dot-color) 1px, transparent 0)',
  '--dot-grid-size': '22px',
  // §4
  '--bp-sm': '480px',
  '--bp-md': '768px',
  '--bp-lg': '1024px',
  '--bp-xl': '1280px',
  '--bp-2xl': '1600px',
  // §5
  '--radius-xs': '8px',
  '--radius-sm': '14px',
  '--radius-md': '26px',
  '--radius-lg': '30px',
  '--radius-xl': '34px',
  '--radius-pill': '999px',
  // §6
  '--shadow-pill':
    'inset 0 1px 0 rgba(255,255,255,.85), 0 1px 2px rgba(6,20,27,.06), 0 4px 12px -2px rgba(6,20,27,.08)',
  '--shadow-glass':
    'inset 0 1px 0 rgba(255,255,255,.85), 0 2px 6px rgba(6,20,27,.05), 0 16px 40px -12px rgba(6,20,27,.18)',
  '--shadow-float':
    'inset 0 1px 0 rgba(255,255,255,.85), 0 0 0 1px var(--border-glass), 0 24px 56px -16px rgba(6,20,27,.28)',
  '--shadow-accent': 'inset 0 1px 0 rgba(255,255,255,.55), 0 6px 18px -6px rgba(6,20,27,.30)',
  '--border-glass': 'rgba(6,20,27,.08)',
  '--glass-filter': 'blur(24px) saturate(140%)',
  '--grad-primary': 'linear-gradient(135deg, #34495A, var(--ink-800), var(--ink-900))',
  // §7
  '--z-base': '0',
  '--z-raised': '1',
  '--z-sticky': '100',
  '--z-drawer': '900',
  '--z-dropdown': '1000',
  '--z-popover': '1100',
  '--z-overlay': '1200',
  '--z-modal': '1300',
  '--z-toast': '1400',
  '--z-tooltip': '1500',
  // §8
  '--ease-out': 'cubic-bezier(.22,1,.36,1)',
  '--ease-spring': 'cubic-bezier(.34,1.4,.64,1)',
  '--dur-fast': '140ms',
  '--dur': '220ms',
  '--dur-slow': '420ms',
  // Nuevos del plan §4.2
  '--surface-header': 'rgba(227,230,230,.80)',
  '--focus-outline': 'var(--ink-800)',
  '--focus-halo': '0 0 0 3px rgba(74,92,106,.18)',
  '--ring-error': 'oklch(0.55 0.11 15)',
  '--border-contrast': 'transparent',
  '--surface-tooltip': 'var(--ink-950)',
  '--text-on-tooltip': 'var(--ink-50)',
  '--animate-spin': 'spin var(--dur-slow) linear infinite',
};

const tailwindName = (token: string) => token.replace(/^--bp-/, '--breakpoint-');

// Prettier reescribe los valores (hex en minúsculas, `.60` → `0.6`, espacio tras las comas): se
// comparan en una forma canónica. Los números de los nombres (`--ink-800`) y de los hex no se tocan.
const canonical = (value: string | undefined) =>
  value
    ?.toLowerCase()
    .replace(/\s*,\s*/g, ',')
    .replace(/(?<![#\w-])-?\d*\.?\d+/g, (number) => String(Number(number)));

describe('tokens.css', () => {
  it.each(Object.entries(EXPECTED))(
    'RNF-006 RNF-005 %s está definido con el valor aprobado',
    (token, value) => {
      expect(canonical(light.get(tailwindName(token)))).toBe(canonical(value));
    },
  );

  it('RNF-006 la escala tipográfica lleva interlineado, tracking y peso de DESIGN.md §2.2', () => {
    const scale = {
      display: ['1.05', '-0.035em', '300'],
      h1: ['1.05', '-0.03em', '300'],
      h2: ['1.1', '-0.025em', '300'],
      h3: ['1.15', '-0.02em', '300'],
      body: ['1.5', '-0.01em', '400'],
      sm: ['1.4', '0', '400'],
      xs: ['1.3', '0', '400'],
    };
    for (const [step, [lineHeight, letterSpacing, fontWeight]] of Object.entries(scale)) {
      expect(light.get(`--text-${step}--line-height`), step).toBe(lineHeight);
      expect(light.get(`--text-${step}--letter-spacing`), step).toBe(letterSpacing);
      expect(light.get(`--text-${step}--font-weight`), step).toBe(fontWeight);
    }
  });

  it('D-1 R-1 vacía los espacios de nombres por defecto de Tailwind', () => {
    for (const namespace of ['color', 'text', 'radius', 'shadow', 'ease', 'breakpoint']) {
      expect(topLevel('@theme static').get(`--${namespace}-*`)).toBe('initial');
    }
  });

  it('RNF-005 ninguna duración pasa de 420 ms y el anillo de carga usa --dur-slow', () => {
    const durations = [...light].filter(([name]) => /^--dur(-|$)/.test(name));
    expect(durations.length).toBeGreaterThan(0);
    for (const [name, value] of durations) {
      expect(value, name).toMatch(/^\d+ms$/);
      expect(parseInt(value), name).toBeLessThanOrEqual(420);
    }
    expect(light.get('--animate-spin')).toContain('var(--dur-slow)');
  });
});

// --- Variantes del tema (T-010) ---

const ROOT = ':root';
const DARK = ":root[data-theme='dark']";
const NO_BLUR = '@supports not (backdrop-filter: blur(1px))';
const MORE_CONTRAST = '@media (prefers-contrast: more)';
const MOBILE = '@media (width < 768px)';

type Theme = 'light' | 'dark';
// N = normal · SB = sin blur (E-3) · C+ = «aumentar contraste» (CA-5.2), como en R-2.
type Variant = 'N' | 'SB' | 'C+';
const THEMES: Theme[] = ['light', 'dark'];
const VARIANTS: Variant[] = ['N', 'SB', 'C+'];

// Los tokens que ve la página en cada caso: los bloques que aplican, en el orden de la cascada.
function tokensFor(theme: Theme, variant: Variant) {
  const paths = [['@theme static'], [ROOT]];
  if (theme === 'dark') paths.push([DARK]);
  const condition = { N: undefined, SB: NO_BLUR, 'C+': MORE_CONTRAST }[variant];
  if (condition) {
    paths.push([condition, ROOT]);
    if (theme === 'dark') paths.push([condition, DARK]);
  }
  return new Map(paths.flatMap((path) => [...declarationsAt(...path)]));
}

function resolveVars(tokens: Map<string, string>, value: string, depth = 0): string {
  if (depth > 10) throw new Error(`referencia circular en ${value}`);
  return value.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
    const referenced = tokens.get(name);
    if (referenced === undefined) throw new Error(`${name} no está definido`);
    return resolveVars(tokens, referenced, depth + 1);
  });
}

// R-2: el navegador compone en sRGB y guarda cada color en 8 bits por canal.
const toRgb = converter('rgb');
const to8bit = (channel: number) => Math.round(Math.min(1, Math.max(0, channel)) * 255) / 255;
function parseColor(value: string): Rgb {
  const color = toRgb(value);
  if (!color) throw new Error(`no es un color: ${value}`);
  return {
    mode: 'rgb',
    r: to8bit(color.r),
    g: to8bit(color.g),
    b: to8bit(color.b),
    alpha: color.alpha ?? 1,
  };
}
function over(bottom: Rgb, top: Rgb): Rgb {
  const alpha = top.alpha ?? 1;
  const mix = (a: number, b: number) => to8bit(b * alpha + a * (1 - alpha));
  return { mode: 'rgb', r: mix(bottom.r, top.r), g: mix(bottom.g, top.g), b: mix(bottom.b, top.b) };
}

function catalog(theme: Theme, variant: Variant) {
  const tokens = tokensFor(theme, variant);
  const value = (name: string) => resolveVars(tokens, `var(${name})`);
  const color = (name: string) => parseColor(value(name));
  const stack = (base: Rgb, ...layers: string[]) => layers.map(color).reduce(over, base);

  const canvas = color('--bg-canvas');
  const dot = over(canvas, color('--dot-color'));
  // Con blur, la retícula se difumina bajo el vidrio y se mide sobre el lienzo liso; sin blur, sobre
  // un punto, que es el peor caso (R-2). Lo que no lleva blur (el título, la alerta bajo la
  // cabecera) siempre está sobre un punto.
  const underGlass = variant === 'SB' ? dot : canvas;
  const card = stack(underGlass, '--surface-glass');
  const field = stack(underGlass, '--surface-glass', '--surface-raised');
  const header = stack(underGlass, '--surface-header');
  const surfaces = {
    canvas: dot,
    card,
    field,
    fieldFocus: stack(underGlass, '--surface-glass', '--surface-raised-hover'),
    headerPill: over(header, color('--surface-glass')),
    menu: over(header, color('--surface-raised')),
    menuFocus: stack(header, '--surface-raised', '--surface-raised-hover'),
    alertError: over(field, color('--rose-soft')),
    alertOffline: over(field, color('--amber-soft')),
    alertInfo: over(field, color('--lilac-soft')),
    alertUnderHeader: stack(dot, '--surface-raised', '--amber-soft'),
    // La parada más clara del degradado es el peor caso para el texto claro.
    primary: parseColor(value('--grad-primary').match(/#[0-9a-f]{6}/i)![0]),
    tooltip: color('--surface-tooltip'),
  };
  return { tokens, value, color, surfaces };
}

const ratio = (a: Rgb, b: Rgb) => Math.round(wcagContrast(a, b) * 100) / 100;

type Surface = keyof ReturnType<typeof catalog>['surfaces'];
type Pair = {
  name: string;
  surface: Surface;
  ink: string;
  min: number;
  // R-2: [N, SB, C+] en claro y en oscuro.
  r2: Record<Theme, [number, number, number]>;
};

// Tabla «Texto por superficie» de plan §4.2 con los números de research R-2.
const TEXT_PAIRS: Pair[] = [
  {
    name: 'título «Mis tareas» sobre el lienzo (grande)',
    surface: 'canvas',
    ink: '--text-1',
    min: 4.5,
    r2: { light: [12.15, 12.15, 12.15], dark: [12.87, 12.87, 12.87] },
  },
  {
    name: 'título y enlace en la tarjeta',
    surface: 'card',
    ink: '--text-1',
    min: 7,
    r2: { light: [16.31, 16.78, 16.31], dark: [15.16, 14.2, 15.16] },
  },
  {
    name: 'etiquetas en la tarjeta',
    surface: 'card',
    ink: '--text-2',
    min: 7,
    r2: { light: [10.71, 11.02, 10.71], dark: [11.14, 10.44, 11.14] },
  },
  {
    name: 'valor del campo',
    surface: 'field',
    ink: '--text-1',
    min: 7,
    r2: { light: [17.69, 17.87, 17.69], dark: [12.02, 11.05, 12.02] },
  },
  {
    name: 'valor del campo con foco',
    surface: 'fieldFocus',
    ink: '--text-1',
    min: 7,
    r2: { light: [18.53, 18.66, 18.69], dark: [8.81, 8.53, 7.9] },
  },
  {
    name: 'píldora glass de la cabecera',
    surface: 'headerPill',
    ink: '--text-1',
    min: 7,
    r2: { light: [16.31, 17.05, 16.31], dark: [15.16, 14.51, 15.16] },
  },
  {
    name: 'email del menú de cuenta',
    surface: 'menu',
    ink: '--text-1',
    min: 7,
    r2: { light: [17.38, 17.72, 17.69], dark: [12.39, 11.18, 12.02] },
  },
  {
    name: 'opción de menú con foco',
    surface: 'menuFocus',
    ink: '--text-1',
    min: 7,
    r2: { light: [18.69, 18.69, 18.69], dark: [8.01, 7.65, 7.9] },
  },
  {
    name: 'alerta de error en la tarjeta',
    surface: 'alertError',
    ink: '--text-1',
    min: 7,
    r2: { light: [15.21, 15.38, 15.21], dark: [8.76, 8.21, 8.76] },
  },
  {
    name: 'alerta sin conexión en la tarjeta',
    surface: 'alertOffline',
    ink: '--text-1',
    min: 7,
    r2: { light: [15.32, 15.49, 15.32], dark: [8.63, 8.0, 8.63] },
  },
  {
    name: 'alerta informativa en la tarjeta',
    surface: 'alertInfo',
    ink: '--text-1',
    min: 7,
    r2: { light: [15.33, 15.47, 15.33], dark: [8.55, 8.02, 8.55] },
  },
  {
    name: 'alerta sin conexión bajo la cabecera',
    surface: 'alertUnderHeader',
    ink: '--text-1',
    min: 7,
    r2: { light: [14.63, 15.18, 15.32], dark: [8.21, 8.0, 8.63] },
  },
  {
    name: 'botón primario',
    surface: 'primary',
    ink: '--text-on-accent',
    min: 7,
    r2: { light: [8.86, 8.86, 8.86], dark: [8.86, 8.86, 8.86] },
  },
  {
    name: 'tooltip',
    surface: 'tooltip',
    ink: '--text-on-tooltip',
    min: 7,
    r2: { light: [16.34, 16.34, 16.34], dark: [16.34, 16.34, 16.34] },
  },
];

// Elementos no textuales (RF-010): ≥ 3:1. R-2 solo da N y SB del anillo de error.
const RING_R2: Record<Theme, Record<'field' | 'card', [number, number]>> = {
  light: { field: [4.86, 4.91], card: [4.48, 4.61] },
  dark: { field: [4.54, 4.17], card: [5.72, 5.36] },
};
// Contorno de foco: peor superficie de las que lo llevan alrededor (R-2).
const FOCUS_R2: Record<Theme, number> = { light: 7.98, dark: 5.62 };
const FOCUS_SURFACES: Surface[] = ['canvas', 'card', 'field', 'headerPill', 'menu', 'menuFocus'];

const SEMANTIC = [
  // DESIGN.md §1.4
  '--bg-canvas',
  '--surface-glass',
  '--surface-raised',
  '--surface-raised-hover',
  '--surface-sunken',
  '--surface-folder',
  '--surface-row',
  '--text-1',
  '--text-2',
  '--text-3',
  '--text-on-accent',
  '--text-on-pill',
  // Los que dependen del tema (plan §4.2)
  '--sage-soft',
  '--rose-soft',
  '--lilac-soft',
  '--amber-soft',
  '--shadow-pill',
  '--shadow-glass',
  '--shadow-float',
  '--shadow-accent',
  '--border-glass',
  '--dot-color',
  '--surface-header',
  '--focus-outline',
  '--focus-halo',
  '--ring-error',
];

describe('tokens.css · variantes y contraste', () => {
  it('RF-016 RNF-006 el bloque oscuro redefine todos los tokens semánticos y los que dependen del tema', () => {
    const dark = declarationsAt(DARK);
    expect(SEMANTIC.filter((token) => !dark.has(token))).toEqual([]);
    expect(dark.get('color-scheme')).toBe('dark');
  });

  it('RNF-006 la escala de móvil (< 768 px) sigue DESIGN.md §2.2', () => {
    const mobile = declarationsAt(MOBILE, ROOT);
    expect(Object.fromEntries(mobile)).toEqual({
      '--text-display': '2.5rem',
      '--text-h1': '2rem',
      '--text-h2': '1.625rem',
      '--text-h3': '1.125rem',
      '--text-body': '1rem',
      '--text-sm': '0.875rem',
      '--text-xs': '0.75rem',
    });
  });

  it.each(THEMES)(
    'CA-5.2 RF-015 con «aumentar contraste» las superficies son opacas y el borde es ink‑600 (%s)',
    (theme) => {
      const { color, value } = catalog(theme, 'C+');
      for (const surface of [
        '--surface-glass',
        '--surface-raised',
        '--surface-raised-hover',
        '--surface-sunken',
        '--surface-header',
      ]) {
        expect(color(surface).alpha, surface).toBe(1);
      }
      expect(value('--border-contrast')).toBe(value('--ink-600'));
      expect(catalog(theme, 'N').value('--border-contrast')).toBe('transparent');
    },
  );

  it.each(THEMES)(
    'E-3 X-11 sin blur, solo glass, raised y la cabecera suben al 92 % (%s)',
    (theme) => {
      const normal = catalog(theme, 'N');
      const { color } = catalog(theme, 'SB');
      for (const surface of ['--surface-glass', '--surface-raised', '--surface-header']) {
        expect(color(surface).alpha, surface).toBe(0.92);
      }
      expect(color('--surface-raised-hover')).toEqual(normal.color('--surface-raised-hover'));
    },
  );

  for (const theme of THEMES) {
    for (const [index, variant] of VARIANTS.entries()) {
      const { color, surfaces } = catalog(theme, variant);

      it.each(TEXT_PAIRS)(
        `CA-3.1 RF-009 ${theme} ${variant}: $name ≥ $min:1 y coincide con R-2`,
        ({ surface, ink, min, r2 }) => {
          const contrast = ratio(color(ink), surfaces[surface]);
          expect(contrast).toBeGreaterThanOrEqual(min);
          expect(contrast).toBeCloseTo(r2[theme][index]!, 2);
        },
      );

      it(`RF-010 ${theme} ${variant}: anillo e icono de error y contorno de foco ≥ 3:1`, () => {
        const ring = color('--ring-error');
        for (const surface of ['field', 'card'] as const) {
          const contrast = ratio(ring, surfaces[surface]);
          expect(contrast, `anillo sobre ${surface}`).toBeGreaterThanOrEqual(3);
          const expected = RING_R2[theme][surface][index];
          if (expected !== undefined)
            expect(contrast, `anillo sobre ${surface}`).toBeCloseTo(expected, 2);
        }
        const focus = color('--focus-outline');
        for (const surface of FOCUS_SURFACES) {
          const contrast = ratio(focus, surfaces[surface]);
          expect(contrast, `foco sobre ${surface}`).toBeGreaterThanOrEqual(3);
          expect(contrast, `foco sobre ${surface}`).toBeGreaterThanOrEqual(FOCUS_R2[theme]);
        }
      });
    }

    it(`RF-010 ${theme}: el peor contorno de foco coincide con R-2`, () => {
      const worst = Math.min(
        ...VARIANTS.flatMap((variant) => {
          const { color, surfaces } = catalog(theme, variant);
          return FOCUS_SURFACES.map((surface) =>
            ratio(color('--focus-outline'), surfaces[surface]),
          );
        }),
      );
      expect(worst).toBeCloseTo(FOCUS_R2[theme], 2);
    });

    it(`X-6 ${theme}: --pill-* (parada más oscura) con --text-on-pill ≥ 7:1 y --pill-ink con ink‑0 = 8.86`, () => {
      const { color, value } = catalog(theme, 'N');
      const darkestStops = ['sage', 'rose', 'lilac', 'amber'].map((tone) => {
        const stops = value(`--pill-${tone}`).match(/oklch\([^)]+\)/g)!;
        return ratio(color('--text-on-pill'), parseColor(stops.at(-1)!));
      });
      expect(Math.min(...darkestStops)).toBeCloseTo(7.71, 2);
      const inkStop = parseColor(value('--pill-ink').match(/#[0-9a-f]{6}/i)![0]);
      expect(ratio(color('--ink-0'), inkStop)).toBeCloseTo(8.86, 2);
    });
  }
});
