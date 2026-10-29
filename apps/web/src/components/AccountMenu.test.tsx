import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AccountMenu } from './AccountMenu';
import type { LogoutHandler } from './AppHeader';
import { mockBrowser } from './test-utils';

const browser = mockBrowser();

const EMAIL = 'ana@example.com';

function renderMenu(email = EMAIL) {
  const onLogout = vi.fn();
  const user = userEvent.setup();
  render(
    <>
      <AccountMenu email={email} loggingOut={false} onLogout={onLogout} />
      {/* E-14: lo siguiente que se puede enfocar después del menú. */}
      <button type="button">Siguiente</button>
    </>,
  );
  const button = screen.getByRole('button', { name: `Cuenta de ${email}` });
  return { user, onLogout, button };
}

const menu = () => screen.queryByRole('menu');
const option = () => screen.getByRole('menuitem', { name: 'Cerrar sesión' });

describe('AccountMenu', () => {
  it('RF-023 D-16 el botón muestra la inicial y se llama «Cuenta de {email}»', () => {
    const { button } = renderMenu();

    expect(button.textContent).toBe('A');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(menu()).toBeNull();
  });

  it('E-11 RF-023 si el email no empieza por una letra, la inicial es ese carácter', () => {
    const { button } = renderMenu('1ana@example.com');

    expect(button.textContent).toBe('1');
  });

  it('CA-2.4 RF-020 al activarlo abre el panel con el email y la opción «Cerrar sesión», que cierra la sesión', async () => {
    const { user, onLogout, button } = renderMenu();

    await user.click(button);

    expect(button.getAttribute('aria-expanded')).toBe('true');
    const list = screen.getByRole('menu', { name: EMAIL });
    expect(document.getElementById(button.getAttribute('aria-controls')!)?.textContent).toContain(
      EMAIL,
    );
    expect(list.contains(option())).toBe(true);
    await user.click(option());
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Espacio', ' '],
  ])('CA-2.6 RF-022 con %s se abre y el foco pasa a la primera opción', async (_name, key) => {
    const { user, button } = renderMenu();
    await user.tab();
    expect(document.activeElement).toBe(button);

    await user.keyboard(key);

    expect(menu()).not.toBeNull();
    expect(document.activeElement).toBe(option());
  });

  it('CA-2.6 RF-022 las flechas recorren las opciones en bucle', async () => {
    const { user, button } = renderMenu();
    await user.click(button);
    const items = screen.getAllByRole('menuitem');

    for (const key of ['{ArrowDown}', '{ArrowUp}', '{ArrowUp}', '{ArrowDown}']) {
      const current = items.indexOf(document.activeElement as HTMLElement);
      await user.keyboard(key);
      const step = key === '{ArrowDown}' ? 1 : -1;
      expect(document.activeElement).toBe(items[(current + step + items.length) % items.length]);
    }
  });

  it('CA-2.5 RF-021 RF-022 Esc cierra el menú y devuelve el foco al botón', async () => {
    const { user, button } = renderMenu();
    await user.click(button);

    await user.keyboard('{Escape}');

    expect(menu()).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);
  });

  it('CA-2.5 RF-021 un pointerdown fuera del panel lo cierra', async () => {
    const { user, button } = renderMenu();
    await user.click(button);

    fireEvent.pointerDown(document.body);

    expect(menu()).toBeNull();
  });

  it('CA-2.5 RF-021 volver a pulsar el botón cierra el menú', async () => {
    const { user, button } = renderMenu();
    await user.click(button);

    await user.click(button);

    expect(menu()).toBeNull();
  });

  it('E-14 con Tab desde la opción, el menú se cierra y el foco pasa a lo siguiente de la página', async () => {
    const { user, button } = renderMenu();
    await user.click(button);
    expect(document.activeElement).toBe(option());

    await user.tab();

    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Siguiente' }));
  });

  it('RF-012 X-2 X-3 el botón de cuenta y las opciones miden 44 px', async () => {
    const { user, button } = renderMenu();
    await user.click(button);

    expect(button.classList).toContain('size-11');
    expect(option().classList).toContain('h-11');
  });
});

describe('AccountMenu · espera, error y cambio de ancho', () => {
  function renderControlled() {
    const onLogout = vi.fn<LogoutHandler>();
    const user = userEvent.setup();
    const menuWith = (loggingOut: boolean) => (
      <AccountMenu email={EMAIL} loggingOut={loggingOut} onLogout={onLogout} />
    );
    const { rerender } = render(menuWith(false));
    const button = screen.getByRole('button', { name: `Cuenta de ${EMAIL}` });
    return { user, onLogout, button, setLoggingOut: (value: boolean) => rerender(menuWith(value)) };
  }

  it('CA-4.3 RF-013 E-12 mientras se cierra la sesión el menú sigue abierto con «Cerrando sesión…»', async () => {
    const { user, onLogout, button, setLoggingOut } = renderControlled();
    await user.click(button);
    await user.click(option());
    setLoggingOut(true);

    const pending = screen.getByRole('menuitem', { name: 'Cerrando sesión…' });
    expect(menu()).not.toBeNull();
    expect(pending.getAttribute('aria-disabled')).toBe('true');
    expect(pending.querySelector('svg.lucide-loader-circle')).not.toBeNull();
    await user.click(pending);
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('E-12 si falla, el menú se cierra y el foco vuelve al botón de cuenta', async () => {
    const { user, onLogout, button, setLoggingOut } = renderControlled();
    await user.click(button);
    await user.click(option());
    setLoggingOut(true);

    const [callbacks] = onLogout.mock.calls[0]!;
    act(() => {
      setLoggingOut(false);
      callbacks?.onError?.();
    });

    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('E-10 con el menú abierto, pasar a 768 px o más lo cierra', async () => {
    const { user, button } = renderControlled();
    await user.click(button);

    act(() => browser.setMediaMatches('(min-width: 768px)', true));

    expect(menu()).toBeNull();
  });
});
