import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import { mockBrowser } from './test-utils';

mockBrowser();

afterEach(() => {
  vi.useRealTimers();
});

const EMAIL = 'ana@example.com';

function renderHeader(loggingOut = false) {
  const onLogout = vi.fn();
  render(<AppHeader email={EMAIL} loggingOut={loggingOut} onLogout={onLogout} />);
  const banner = screen.getByRole('banner');
  // La píldora del email es lo único enfocable con el email como texto (D-13).
  const pill = within(banner).getByText(EMAIL, { selector: '[tabindex="0"]' });
  return { onLogout, banner, pill };
}

// jsdom no maqueta: se simula que el texto no cabe (o sí) en la píldora.
function setOverflow(element: HTMLElement, truncated: boolean) {
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: 300 });
  Object.defineProperty(element, 'scrollWidth', {
    configurable: true,
    value: truncated ? 900 : 300,
  });
}

const tooltip = (banner: HTMLElement) =>
  [...banner.querySelectorAll<HTMLElement>('[aria-hidden="true"]')].find(
    (element) => element.textContent === EMAIL,
  );

describe('AppHeader', () => {
  it('CA-2.1 RF-006 RF-024 la cabecera tiene la píldora «Mis tareas» (sin ser encabezado), el email y «Cerrar sesión»', () => {
    const { banner, pill } = renderHeader();

    expect(within(banner).getByText('Mis tareas')).toBeDefined();
    expect(within(banner).queryByRole('heading')).toBeNull();
    expect(pill.textContent).toBe(EMAIL);
    const logout = within(banner).getByRole('button', { name: 'Cerrar sesión' });
    expect(logout.className).toContain('bg-glass');
  });

  it('RF-007 D-11 escritorio y móvil están en el DOM y se alternan con max-md:hidden / md:hidden', () => {
    const { banner, pill } = renderHeader();
    const logout = within(banner).getByRole('button', { name: 'Cerrar sesión' });
    const account = within(banner).getByRole('button', { name: `Cuenta de ${EMAIL}` });

    expect(pill.closest('.max-md\\:hidden')).not.toBeNull();
    expect(logout.closest('.max-md\\:hidden')).not.toBeNull();
    expect(account.closest('.md\\:hidden')).not.toBeNull();
    expect(account.closest('.max-md\\:hidden')).toBeNull();
  });

  it('RF-006 D-11 X-8 la cabecera es fija, con la superficie de cabecera, blur y la capa sticky', () => {
    const { banner } = renderHeader();

    for (const name of ['sticky', 'top-0', 'bg-header', 'backdrop-glass', 'z-(--z-sticky)']) {
      expect(banner.classList).toContain(name);
    }
  });

  it('CA-5.2 RF-015 D-22 la franja de la cabecera lleva el borde de «aumentar contraste»', () => {
    const { banner } = renderHeader();

    expect(banner.classList).toContain('border-b');
    expect(banner.classList).toContain('border-contrast');
  });

  it('RF-006 «Cerrar sesión» llama a onLogout', async () => {
    const { onLogout, banner } = renderHeader();

    await userEvent.setup().click(within(banner).getByRole('button', { name: 'Cerrar sesión' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('CA-4.3 con loggingOut, el botón de escritorio muestra «Cerrando sesión…»', () => {
    const { banner } = renderHeader(true);

    const button = within(banner).getByRole('button', { name: 'Cerrando sesión…' });
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('RF-009 CA-3.1 D-21 el panel abierto del menú no está dentro de un elemento con desenfoque', async () => {
    const { banner } = renderHeader();
    const account = within(banner).getByRole('button', { name: `Cuenta de ${EMAIL}` });

    await userEvent.setup().click(account);

    // Un backdrop-filter dentro de otro solo desenfoca lo que hay en su padre (B-1).
    const panel = document.getElementById(account.getAttribute('aria-controls')!)!;
    expect(screen.getByRole('menu', { name: EMAIL })).toBeDefined();
    expect(panel.parentElement?.closest('.backdrop-glass')).toBeNull();
    expect(banner.contains(panel)).toBe(false);
  });

  it('E-1 D-13 con el email recortado, el foco muestra a los 400 ms un tooltip aria-hidden con el email completo; Esc lo oculta', () => {
    vi.useFakeTimers();
    const { banner, pill } = renderHeader();
    setOverflow(pill, true);

    fireEvent.focus(pill);
    act(() => vi.advanceTimersByTime(399));
    expect(tooltip(banner)).toBeUndefined();
    act(() => vi.advanceTimersByTime(1));
    expect(tooltip(banner)).toBeDefined();

    fireEvent.keyDown(pill, { key: 'Escape' });
    expect(tooltip(banner)).toBeUndefined();
  });

  it('E-1 D-13 también aparece al pasar el ratón y se va al salir', () => {
    vi.useFakeTimers();
    const { banner, pill } = renderHeader();
    setOverflow(pill, true);

    fireEvent.mouseEnter(pill);
    act(() => vi.advanceTimersByTime(400));
    expect(tooltip(banner)).toBeDefined();

    fireEvent.mouseLeave(pill.parentElement!);
    expect(tooltip(banner)).toBeUndefined();
  });

  it('E-1 sin recorte no hay tooltip', () => {
    vi.useFakeTimers();
    const { banner, pill } = renderHeader();
    setOverflow(pill, false);

    fireEvent.focus(pill);
    act(() => vi.advanceTimersByTime(1000));

    expect(tooltip(banner)).toBeUndefined();
  });
});
