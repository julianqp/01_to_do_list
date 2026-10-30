import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormField } from './FormField';
import { descriptionOf } from './test-utils';

afterEach(cleanup);

describe('FormField · variantes de la spec 002', () => {
  it('D-17 type="text" con inputMode="numeric" y autoComplete="off" (fechas)', () => {
    render(
      <FormField
        id="task-estimated-start"
        label="Fecha estimada de inicio"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText('Fecha estimada de inicio');

    expect(input.tagName).toBe('INPUT');
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.getAttribute('name')).toBe('task-estimated-start');
  });

  it('RF-016 RF-020 multiline es un <textarea> que conserva los saltos de línea', async () => {
    const onChange = vi.fn();
    render(
      <FormField
        id="task-description"
        label="Descripción"
        multiline
        autoComplete="off"
        value={'Revisar\ncon el equipo'}
        onChange={onChange}
      />,
    );
    const textarea = screen.getByLabelText('Descripción') as HTMLTextAreaElement;

    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.value).toBe('Revisar\ncon el equipo');
    expect(textarea.getAttribute('name')).toBe('task-description');
    await userEvent.setup().type(textarea, 'x');
    expect(onChange).toHaveBeenLastCalledWith('Revisar\ncon el equipox');
  });

  it('RF-010 D-9 optional añade «(opcional)» a la etiqueta, en --text-3', () => {
    render(
      <FormField
        id="task-description"
        label="Descripción"
        optional
        multiline
        autoComplete="off"
        value=""
        onChange={() => {}}
      />,
    );

    const textarea = screen.getByLabelText('Descripción (opcional)');
    expect(textarea).toBeDefined();
    expect(screen.getByText('(opcional)').classList).toContain('text-3');
  });

  it('D-17 RNF-001 la ayuda y el error se enlazan con aria-describedby', () => {
    const { rerender } = render(
      <FormField
        id="task-estimated-end"
        label="Fecha estimada de fin"
        type="text"
        autoComplete="off"
        help="Ejemplo: 14/11/2026"
        value=""
        onChange={() => {}}
      />,
    );
    const input = screen.getByLabelText('Fecha estimada de fin');
    expect(descriptionOf(input)).toBe('Ejemplo: 14/11/2026');
    expect(screen.getByText('Ejemplo: 14/11/2026').classList).toContain('text-3');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    rerender(
      <FormField
        id="task-estimated-end"
        label="Fecha estimada de fin"
        type="text"
        autoComplete="off"
        help="Ejemplo: 14/11/2026"
        error="Esa fecha no existe. Escríbela como 14/11/2026."
        value="31/02/2026"
        onChange={() => {}}
      />,
    );
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(descriptionOf(input)).toBe(
      'Esa fecha no existe. Escríbela como 14/11/2026. Ejemplo: 14/11/2026',
    );
  });

  it('RNF-001 un textarea con error lleva aria-invalid y su mensaje', () => {
    render(
      <FormField
        id="task-description"
        label="Descripción"
        multiline
        autoComplete="off"
        error="La descripción puede tener hasta 5000 caracteres. Acórtala un poco."
        value=""
        onChange={() => {}}
      />,
    );
    const textarea = screen.getByLabelText('Descripción');

    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(descriptionOf(textarea)).toBe(
      'La descripción puede tener hasta 5000 caracteres. Acórtala un poco.',
    );
  });
});
