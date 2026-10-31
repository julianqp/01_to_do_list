import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('D-6 variantes primary y glass, tamaños md (44) y lg (52) y ancho completo', () => {
    render(
      <>
        <Button variant="primary" size="lg" fullWidth>
          Iniciar sesión
        </Button>
        <Button variant="glass">Cerrar sesión</Button>
      </>,
    );
    const primary = screen.getByRole('button', { name: 'Iniciar sesión' });
    const glass = screen.getByRole('button', { name: 'Cerrar sesión' });

    expect(primary.className).toContain('bg-(image:--grad-primary)');
    expect(primary.className).toContain('text-on-accent');
    expect(primary.classList).toContain('h-13');
    expect(primary.classList).toContain('w-full');
    expect(glass.classList).toContain('bg-glass');
    expect(glass.classList).toContain('backdrop-glass');
    expect(glass.classList).toContain('text-1');
    expect(glass.classList).toContain('h-11');
    expect(glass.classList).not.toContain('w-full');
    expect(glass.getAttribute('type')).toBe('button');
  });

  it('RF-026 D-9 D-19 variante destructive: --pill-rose con --text-on-pill', () => {
    render(<Button variant="destructive">Borrar tarea</Button>);
    const button = screen.getByRole('button', { name: 'Borrar tarea' });

    expect(button.className).toContain('bg-(image:--pill-rose)');
    expect(button.classList).toContain('text-on-pill');
    expect(button.classList).toContain('h-11');
  });

  it('RF-014 X-10 la presión escala solo con motion-safe', () => {
    render(<Button variant="primary">Iniciar sesión</Button>);
    expect(screen.getByRole('button').classList).toContain('motion-safe:active:scale-97');
  });

  it('RF-013 CA-4.4 sin espera: el nombre es la etiqueta y el gerundio no se lee', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" loadingLabel="Iniciando sesión…" onClick={onClick}>
        Iniciar sesión
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Iniciar sesión' });

    expect(button.getAttribute('aria-disabled')).toBeNull();
    // D-9: el anillo y el gerundio ocupan su sitio para que el ancho no cambie, pero no se ven.
    expect(button.querySelector('svg')?.closest('.invisible[aria-hidden="true"]')).not.toBeNull();
    await userEvent.setup().click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('RF-013 E-7 D-9 con loading: anillo + gerundio, aria-disabled sin disabled y no se activa', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" loading loadingLabel="Iniciando sesión…" onClick={onClick}>
        Iniciar sesión
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Iniciando sesión…' });

    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.querySelector('svg.lucide-loader-circle')).not.toBeNull();
    // D-9: las dos etiquetas están en el DOM (el ancho es el de la más larga); la normal no se lee.
    expect(button.textContent).toContain('Iniciar sesión');
    await userEvent.setup().click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('RF-013 E-7 D-9 con loading dentro de un formulario no lo envía, ni con clic ni con Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const form = (loading: boolean) => (
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <input aria-label="Email" />
        <Button variant="primary" type="submit" loading={loading} loadingLabel="Iniciando sesión…">
          Iniciar sesión
        </Button>
      </form>
    );
    const { rerender } = render(form(true));

    await user.click(screen.getByRole('button'));
    await user.type(screen.getByLabelText('Email'), 'ana{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();

    // Control: sin espera, Enter en el campo sí envía.
    rerender(form(false));
    await user.type(screen.getByLabelText('Email'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('CA-4.4 al acabar la espera vuelve el texto original y se puede pulsar', async () => {
    const onClick = vi.fn();
    const button = (loading: boolean) => (
      <Button variant="glass" loading={loading} loadingLabel="Cerrando sesión…" onClick={onClick}>
        Cerrar sesión
      </Button>
    );
    const { rerender } = render(button(true));
    expect(screen.getByRole('button', { name: 'Cerrando sesión…' })).toBeDefined();

    rerender(button(false));

    const idle = screen.getByRole('button', { name: 'Cerrar sesión' });
    expect(idle.getAttribute('aria-disabled')).toBeNull();
    await userEvent.setup().click(idle);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
