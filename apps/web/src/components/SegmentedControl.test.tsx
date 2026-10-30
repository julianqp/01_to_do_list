import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SegmentedControl, type SegmentedOption } from './SegmentedControl';

afterEach(cleanup);

const STATUS_OPTIONS: SegmentedOption[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To do', selectedTone: 'lilac' },
  { value: 'in_progress', label: 'In progress', selectedTone: 'ink' },
  { value: 'done', label: 'Done', selectedTone: 'sage' },
];

function Controlled({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('todo');
  return (
    <SegmentedControl
      name="task-status"
      legend="Estado"
      options={STATUS_OPTIONS}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const optionOf = (radio: HTMLElement) => radio.closest('label')!;

describe('SegmentedControl', () => {
  it('RF-023 D-15 un <fieldset> con <legend> y un radio por opción con su etiqueta; el elegido, marcado', () => {
    render(<Controlled onChange={() => {}} />);
    const group = screen.getByRole('group', { name: 'Estado' });

    expect(group.tagName).toBe('FIELDSET');
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((radio) => radio.getAttribute('name'))).toEqual(Array(4).fill('task-status'));
    expect(radios.map((radio) => optionOf(radio).textContent)).toEqual([
      'Backlog',
      'To do',
      'In progress',
      'Done',
    ]);
    expect(screen.getByRole('radio', { name: 'To do' })).toHaveProperty('checked', true);
    expect(screen.getByRole('radio', { name: 'Backlog' })).toHaveProperty('checked', false);
  });

  it('CA-4.2 RF-023 las flechas cambian la opción y llaman a onChange', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('radio', { name: 'To do' }));
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenLastCalledWith('in_progress');
    expect(screen.getByRole('radio', { name: 'In progress' })).toHaveProperty('checked', true);
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'In progress' }));

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('backlog');
  });

  it('RF-023 un clic en la etiqueta elige la opción', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await userEvent.setup().click(screen.getByText('Done'));

    expect(onChange).toHaveBeenLastCalledWith('done');
  });

  it('D-15 selectedTone aplica la clase del tono solo a la opción elegida', () => {
    const { rerender } = render(
      <SegmentedControl
        name="task-status"
        legend="Estado"
        options={STATUS_OPTIONS}
        value="todo"
        onChange={() => {}}
      />,
    );
    const label = (name: string) => optionOf(screen.getByRole('radio', { name }));

    expect(label('To do').className).toContain('bg-(image:--pill-lilac)');
    expect(label('To do').classList).toContain('text-on-pill');
    expect(label('In progress').className).not.toContain('--pill-ink');
    expect(label('In progress').classList).toContain('text-2');
    expect(label('Done').className).not.toContain('--pill-sage');

    rerender(
      <SegmentedControl
        name="task-status"
        legend="Estado"
        options={STATUS_OPTIONS}
        value="in_progress"
        onChange={() => {}}
      />,
    );
    expect(label('In progress').className).toContain('bg-(image:--pill-ink)');
    expect(label('In progress').classList).toContain('text-on-accent');
    expect(label('To do').className).not.toContain('--pill-lilac');
  });

  it('D-15 sin tono, la opción elegida es neutra (raised-hover + --text-1)', () => {
    render(
      <SegmentedControl
        name="board-column"
        legend="Columna"
        options={[
          { value: 'backlog', label: 'Backlog · 2' },
          { value: 'done', label: 'Done · 0' },
        ]}
        value="backlog"
        onChange={() => {}}
      />,
    );
    const chosen = optionOf(screen.getByRole('radio', { name: 'Backlog · 2' }));

    expect(chosen.classList).toContain('bg-raised-hover');
    expect(chosen.classList).toContain('text-1');
  });

  it('X-4 RNF-002 las opciones miden 44 px como mínimo (min-h-11) y crecen si la etiqueta no cabe', () => {
    render(<Controlled onChange={() => {}} />);

    for (const radio of screen.getAllByRole('radio')) {
      expect(optionOf(radio).classList).toContain('min-h-11');
      expect(optionOf(radio).classList).not.toContain('h-11');
    }
  });
});
