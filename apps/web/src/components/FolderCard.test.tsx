import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FolderCard } from './FolderCard';

afterEach(cleanup);

describe('FolderCard', () => {
  it('D-22 §13 el título es un encabezado h3 que da nombre al grupo con su contenido', () => {
    render(
      <FolderCard title="Datos">
        <label htmlFor="t">Título</label>
        <input id="t" />
      </FolderCard>,
    );
    const heading = screen.getByRole('heading', { level: 3, name: 'Datos' });
    const group = screen.getByRole('group', { name: 'Datos' });

    expect(group.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(group.contains(screen.getByLabelText('Título'))).toBe(true);
    expect(heading.classList).toContain('text-2');
  });

  it('D-22 dos carpetas en la misma página tienen ids distintos', () => {
    render(
      <>
        <FolderCard title="Datos">x</FolderCard>
        <FolderCard title="Fechas">y</FolderCard>
      </>,
    );

    expect(screen.getByRole('group', { name: 'Datos' })).toBeDefined();
    expect(screen.getByRole('group', { name: 'Fechas' })).toBeDefined();
  });

  it('D-22 §5 la forma de la pestaña va en un SVG decorativo con fill-folder, y el cuerpo es folder', () => {
    const { container } = render(<FolderCard title="Fechas">contenido</FolderCard>);
    const svg = container.querySelector('svg')!;

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.classList).toContain('fill-folder');
    expect(screen.getByText('contenido').closest('.bg-folder')).not.toBeNull();
  });
});
