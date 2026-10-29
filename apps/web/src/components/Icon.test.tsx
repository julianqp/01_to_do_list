import { cleanup, render } from '@testing-library/react';
import { CircleAlert } from 'lucide-react';
import { afterEach, describe, expect, it } from 'vitest';
import { Icon, Spinner } from './Icon';

afterEach(cleanup);

const svgOf = (container: HTMLElement) => {
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('no hay SVG');
  return svg;
};

describe('Icon', () => {
  it('D-8 pinta el icono de Lucide con trazo 1.4, a 18 px por defecto y decorativo', () => {
    const svg = svgOf(render(<Icon icon={CircleAlert} />).container);

    expect(svg.classList).toContain('lucide-circle-alert');
    expect(svg.getAttribute('stroke-width')).toBe('1.4');
    expect(svg.getAttribute('width')).toBe('18');
    expect(svg.getAttribute('height')).toBe('18');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('D-8 respeta el tamaño y la clase pedidos', () => {
    const svg = svgOf(render(<Icon icon={CircleAlert} size={22} className="shrink-0" />).container);

    expect(svg.getAttribute('width')).toBe('22');
    expect(svg.getAttribute('height')).toBe('22');
    expect(svg.classList).toContain('shrink-0');
  });
});

describe('Spinner', () => {
  it('X-9 RNF-005 es el LoaderCircle de 16 px que gira con animate-spin, decorativo', () => {
    const svg = svgOf(render(<Spinner />).container);

    expect(svg.classList).toContain('lucide-loader-circle');
    expect(svg.classList).toContain('animate-spin');
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('stroke-width')).toBe('1.4');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
