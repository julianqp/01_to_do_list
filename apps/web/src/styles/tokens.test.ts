import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Catálogo de tokens (plan 004 D-1, D-2; RNF-006 b): todos los valores con nombre de DESIGN.md §1–§8
// y los nuevos del plan §4.2 están en tokens.css, con el valor aprobado.

type Block = { path: string[]; declarations: Map<string, string> };

// Lector mínimo de CSS: cada bloque con la ruta de selectores y reglas que lo contienen
// (p. ej. ['@media (width < 768px)', ':root']) y sus declaraciones, con los espacios normalizados.
export function readBlocks(css: string): Block[] {
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
const topLevel = (selector: string) =>
  blocks.find((block) => block.path.length === 1 && block.path[0] === selector)?.declarations ??
  new Map<string, string>();

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
