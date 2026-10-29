import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Alert, type AlertTone } from './Alert';

afterEach(cleanup);

const TONES: { tone: AlertTone; icon: string; tint: string }[] = [
  { tone: 'error', icon: 'lucide-circle-alert', tint: 'rose-soft' },
  { tone: 'offline', icon: 'lucide-triangle-alert', tint: 'amber-soft' },
  { tone: 'info', icon: 'lucide-info', tint: 'lilac-soft' },
];

const alertOf = (container: HTMLElement) => {
  const alert = container.querySelector<HTMLElement>('[data-tone]');
  if (!alert) throw new Error('no hay alerta');
  return alert;
};

describe('Alert', () => {
  it.each(TONES)(
    'RF-004 tono $tone → data-tone, icono $icon y tinte $tint',
    ({ tone, icon, tint }) => {
      const alert = alertOf(
        render(<Alert tone={tone}>Email o contraseña incorrectos</Alert>).container,
      );

      expect(alert.dataset.tone).toBe(tone);
      expect(alert.querySelector(`svg.${icon}`)).not.toBeNull();
      expect(alert.className).toContain(`from-${tint}`);
    },
  );

  it('D-14 el icono no añade texto y la alerta no lleva rol propio', () => {
    const alert = alertOf(
      render(<Alert tone="error">Email o contraseña incorrectos</Alert>).container,
    );

    expect(alert.textContent).toBe('Email o contraseña incorrectos');
    expect(alert.querySelector('[role]')).toBeNull();
    expect(alert.hasAttribute('role')).toBe(false);
    expect(alert.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('X-7 E-6 D-5 texto e icono en text-1, raised de radio md con borde de contraste y sin altura fija', () => {
    const alert = alertOf(render(<Alert tone="offline">No se ha podido conectar</Alert>).container);

    for (const name of ['text-1', 'rounded-md', 'bg-raised', 'border', 'border-contrast']) {
      expect(alert.classList).toContain(name);
    }
    expect(alert.className).not.toMatch(/(^|\s)(h|min-h|max-h)-/);
    expect(alert.querySelector('svg')?.getAttribute('class')).not.toMatch(/text-(2|3)\b/);
  });
});
