import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskCard } from './TaskCard';
import { taskFixture } from './test-utils';

afterEach(cleanup);

const TODAY = '2026-10-29';

function renderCard(overrides: Parameters<typeof taskFixture>[0] = {}, onOpen = vi.fn()) {
  const task = taskFixture(overrides);
  render(<TaskCard task={task} today={TODAY} onOpen={onOpen} />);
  return { task, card: screen.getByRole('button'), onOpen };
}

describe('TaskCard', () => {
  it('RF-012 D-10 es un <button type="button"> con data-task-id que abre el detalle con clic o Enter', async () => {
    const { task, card, onOpen } = renderCard();
    const user = userEvent.setup();

    expect(card.tagName).toBe('BUTTON');
    expect(card.getAttribute('type')).toBe('button');
    expect(card.dataset.taskId).toBe(task.id);

    await user.click(card);
    card.focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('CA-1.5 RF-007 E-4 D-10 muestra el título completo y parte las palabras largas (wrap-anywhere)', () => {
    const title = 'a'.repeat(200);
    renderCard({ title });

    const heading = screen.getByText(title);
    expect(heading.classList).toContain('wrap-anywhere');
    expect(heading.classList).toContain('text-1');
  });

  it('CA-1.5 RF-007 D-18 con las dos fechas estimadas: «14 nov → 28 nov», en --text-2', () => {
    renderCard({ estimatedStartDate: '2026-11-14', estimatedEndDate: '2026-11-28' });

    const dates = screen.getByText('14 nov → 28 nov');
    expect(dates.closest('.text-2')).not.toBeNull();
  });

  it('E-8 RF-007 D-10 solo con el fin estimado: «Fin estimado: 28 nov»', () => {
    renderCard({ estimatedEndDate: '2026-11-28' });

    expect(screen.getByRole('button').textContent).toContain('Fin estimado: 28 nov');
  });

  it('E-8 RF-007 D-10 solo con el inicio estimado: «Inicio estimado: 14 nov»', () => {
    renderCard({ estimatedStartDate: '2026-11-14' });

    expect(screen.getByRole('button').textContent).toContain('Inicio estimado: 14 nov');
  });

  it('RF-007 D-18 una fecha de otro año lleva el año', () => {
    renderCard({ estimatedStartDate: '2026-11-14', estimatedEndDate: '2027-01-10' });

    expect(screen.getByText('14 nov → 10 ene 2027')).toBeDefined();
  });

  it('RF-007 sin fechas no muestra ninguna línea de fechas', () => {
    const { card } = renderCard();

    expect(card.textContent).toBe('Preparar la demo');
  });

  it('CA-4.3 RF-007 D-10 en Done muestra la fecha real de fin, con «Fecha real de fin:» para lectores de pantalla', () => {
    const { card } = renderCard({ status: 'done', actualEndDate: '2026-10-29' });

    const label = screen.getByText('Fecha real de fin:');
    expect(label.classList).toContain('sr-only');
    expect(card.textContent).toContain('Fecha real de fin: 29 oct');
  });

  it('CA-6.1 RF-032 D-10 retrasada: insignia «Retrasada» con su icono', () => {
    const { card } = renderCard({ status: 'in_progress', estimatedEndDate: '2026-10-28' });

    const badge = screen.getByText('Retrasada');
    expect(badge.closest('.bg-amber-soft')).not.toBeNull();
    expect(badge.closest('.text-1')).not.toBeNull();
    expect(badge.parentElement?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(card.textContent).toContain('Retrasada');
  });

  it.each([
    ['CA-6.3 con el fin estimado de hoy', { status: 'todo', estimatedEndDate: TODAY }],
    [
      'CA-6.4 en Done',
      { status: 'done', estimatedEndDate: '2026-10-01', actualEndDate: '2026-10-29' },
    ],
    ['CA-6.5 sin fin estimado', { status: 'in_progress' }],
  ] as const)('%s RF-032 no lleva la insignia', (_name, overrides) => {
    renderCard(overrides);

    expect(screen.queryByText('Retrasada')).toBeNull();
  });

  it('X-2 D-10 con hover no cambia de superficie: sombra glass y desplazamiento con motion-safe', () => {
    const { card } = renderCard();

    expect(card.classList).toContain('bg-raised');
    expect(card.classList).toContain('rounded-lg');
    expect(card.className).toContain('hover:shadow-(--shadow-glass)');
    expect(card.classList).toContain('motion-safe:hover:-translate-y-px');
    expect(card.className).not.toContain('hover:bg-raised-hover');
  });
});
