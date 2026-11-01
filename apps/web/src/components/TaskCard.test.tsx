import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskCard, type TaskCardProps } from './TaskCard';
import { taskFixture } from './test-utils';

afterEach(cleanup);

const TODAY = '2026-10-29';
const renderedCard = () => screen.getAllByRole('button')[0]!;

function renderCard(
  overrides: Parameters<typeof taskFixture>[0] = {},
  onOpen = vi.fn(),
  props: Partial<TaskCardProps> = {},
) {
  const task = taskFixture(overrides);
  render(<TaskCard task={task} today={TODAY} onOpen={onOpen} {...props} />);
  return {
    task,
    // D-11: el primer botón es el de abrir; el segundo, el asa.
    card: screen.getAllByRole('button')[0]!,
    handle: screen.getByRole('button', { name: `Mover «${task.title}»` }),
    onOpen,
  };
}

describe('TaskCard', () => {
  it('003 CA-3.1 RF-012 D-11 la tarjeta no es un <button>: contiene el botón de abrir y el asa, con su nombre e icono', () => {
    const { task, card, handle } = renderCard();

    const container = card.parentElement!;
    expect(container.tagName).toBe('DIV');
    expect(container.contains(handle)).toBe(true);
    expect(card.tagName).toBe('BUTTON');
    expect(card.getAttribute('type')).toBe('button');
    expect(card.dataset.taskId).toBe(task.id);
    expect(card.textContent).toBe('Preparar la demo');
    expect(handle.tagName).toBe('BUTTON');
    expect(handle.getAttribute('type')).toBe('button');
    expect(handle.dataset.taskHandle).toBe(task.id);
    expect(handle.getAttribute('aria-label')).toBe('Mover «Preparar la demo»');
    expect(handle.querySelector('svg.lucide-grip-vertical')).not.toBeNull();
  });

  it('003 CA-1.8 CA-3.8 RF-006 clic y Enter en el botón de abrir llaman a onOpen, no al asa', async () => {
    const onClick = vi.fn();
    const { card, onOpen } = renderCard({}, vi.fn(), {
      handleProps: { onClick, onKeyDown: vi.fn(), onMouseDown: vi.fn(), onBlur: vi.fn() },
    });
    const user = userEvent.setup();

    await user.click(card);
    card.focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('003 CA-1.11 RF-006 D-24 un clic de puntero en el asa (`detail` 1) abre el detalle y no la coge', () => {
    const onClick = vi.fn();
    const { handle, onOpen } = renderCard({}, vi.fn(), {
      handleProps: { onClick, onKeyDown: vi.fn(), onMouseDown: vi.fn(), onBlur: vi.fn() },
    });

    fireEvent.click(handle, { detail: 1 });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('003 RF-013 D-24 un clic sin puntero en el asa (`detail` 0: teclado o lector) la coge y no abre el detalle', () => {
    const onClick = vi.fn();
    const { handle, onOpen } = renderCard({}, vi.fn(), {
      handleProps: { onClick, onKeyDown: vi.fn(), onMouseDown: vi.fn(), onBlur: vi.fn() },
    });

    fireEvent.click(handle, { detail: 0 });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('003 RNF-001 D-11 el asa mide 44 por debajo de 1024 y 32 desde ahí; el orden de tabulación es abrir → asa', async () => {
    const { card, handle } = renderCard();
    const user = userEvent.setup();

    for (const name of ['size-11', 'lg:size-8', 'rounded-pill', 'cursor-grab']) {
      expect(handle.classList).toContain(name);
    }
    await user.tab();
    expect(document.activeElement).toBe(card);
    await user.tab();
    expect(document.activeElement).toBe(handle);
  });

  it('003 RNF-001 C-20 desde 768 px, el asa va 4 px hacia dentro y el botón de abrir le deja sitio', () => {
    const { card, handle } = renderCard();

    for (const name of ['md:end-1', 'md:top-1']) expect(handle.classList).toContain(name);
    for (const name of ['md:pe-12', 'lg:pe-10']) expect(card.classList).toContain(name);
  });

  it('003 RNF-005 D-27 el asa tiene estados de hover y de press, con transición y la escala solo con motion-safe', () => {
    const { handle } = renderCard();

    for (const name of [
      'transition',
      'duration-(--dur-fast)',
      'ease-out',
      'hover:bg-raised-hover',
      'motion-safe:active:scale-94',
    ]) {
      expect(handle.classList).toContain(name);
    }
  });

  it('003 RF-002 D-6 la tarjeta no deja seleccionar el texto (mantener el dedo)', () => {
    const { card } = renderCard();

    expect(card.parentElement!.classList).toContain('select-none');
  });

  it('003 RF-002 E-6 D-10 X-1 `placeholder`: hueco hundido con el anillo, sin sombra y con el contenido invisible', () => {
    const { card, handle } = renderCard({}, vi.fn(), { variant: 'placeholder' });

    const container = card.parentElement!;
    expect(container.classList).toContain('bg-sunken');
    expect(container.className).toContain('inset-ring-ring-drop');
    expect(container.className).toContain('inset-ring-(length:--ring-error-width)');
    expect(container.className).not.toContain('shadow-');
    expect(card.classList).toContain('invisible');
    expect(handle.classList).toContain('invisible');
  });

  it('003 CA-3.2 RF-002 D-10 `lifted`: levantada con --shadow-float y escala solo con motion-safe, por encima de las demás', () => {
    const { card } = renderCard({}, vi.fn(), { variant: 'lifted' });

    const container = card.parentElement!;
    expect(container.className).toContain('shadow-(--shadow-float)');
    expect(container.classList).toContain('motion-safe:scale-102');
    expect(container.classList).toContain('z-(--z-popover)');
    expect(container.hasAttribute('inert')).toBe(false);
  });

  it('003 RF-002 RNF-001 D-10 `overlay`: levantada, con `aria-hidden` e `inert`, sin los atributos de la tarjeta real', () => {
    const task = taskFixture();
    const { container } = render(
      <TaskCard task={task} today={TODAY} onOpen={vi.fn()} variant="overlay" />,
    );

    const overlay = container.firstElementChild!;
    expect(overlay.className).toContain('shadow-(--shadow-float)');
    expect(overlay.classList).toContain('motion-safe:scale-102');
    // §6.3: flota sobre otras tarjetas; sin blur, su texto se transparentaría a través de este.
    expect(overlay.classList).toContain('backdrop-glass');
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
    expect(overlay.hasAttribute('inert')).toBe(true);
    expect(overlay.querySelector('[data-task-id]')).toBeNull();
    expect(overlay.querySelector('[data-task-handle]')).toBeNull();
  });

  it('RF-012 D-10 D-11 el botón de abrir tiene data-task-id y abre con clic o Enter', async () => {
    const { task, card, onOpen } = renderCard();
    const user = userEvent.setup();

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

    expect(renderedCard().textContent).toContain('Fin estimado: 28 nov');
  });

  it('E-8 RF-007 D-10 solo con el inicio estimado: «Inicio estimado: 14 nov»', () => {
    renderCard({ estimatedStartDate: '2026-11-14' });

    expect(renderedCard().textContent).toContain('Inicio estimado: 14 nov');
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
    const container = renderCard().card.parentElement!;

    expect(container.classList).toContain('bg-raised');
    expect(container.classList).toContain('rounded-lg');
    expect(container.className).toContain('hover:shadow-(--shadow-glass)');
    expect(container.classList).toContain('motion-safe:hover:-translate-y-px');
    expect(container.className).not.toContain('hover:bg-raised-hover');
  });
});
