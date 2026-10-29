import type { MouseEvent } from 'react';
import { Spinner } from './Icon';

// DESIGN.md §14 Button. Píldora de 44 (md) o 52 (lg); X-10: sin tamaño sm.
export type ButtonProps = {
  variant: 'primary' | 'glass';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  // RF-013: Spinner + loadingLabel, aria-disabled e ignora la activación (D-9).
  loading?: boolean;
  loadingLabel?: string;
  // Las dos etiquetas se apilan en la misma celda: el ancho no cambia (D-9).
  children: string;
};

const VARIANTS = {
  primary: 'bg-(image:--grad-primary) text-on-accent shadow-(--shadow-accent)',
  glass:
    'border border-contrast bg-glass backdrop-glass text-1 shadow-(--shadow-pill) hover:bg-raised',
};

const SIZES = { md: 'h-11 px-5', lg: 'h-13 px-6.5' };

const STACKED = 'col-start-1 row-start-1';

export function Button({
  variant,
  size = 'md',
  fullWidth = false,
  type = 'button',
  onClick,
  loading = false,
  loadingLabel,
  children,
}: ButtonProps) {
  // D-9: con `disabled` el botón perdería el foco. preventDefault también cancela el envío
  // implícito de Enter en un campo, que el navegador hace como un clic en este botón.
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.();
  }

  const className = [
    'inline-grid place-items-center rounded-pill text-body whitespace-nowrap',
    'transition duration-(--dur-fast) ease-out motion-safe:active:scale-97',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      className={className}
    >
      <span
        aria-hidden={loading || undefined}
        className={`${STACKED} ${loading ? 'invisible' : ''}`}
      >
        {children}
      </span>
      {loadingLabel !== undefined && (
        <span
          aria-hidden={!loading || undefined}
          className={`${STACKED} inline-flex items-center gap-2 ${loading ? '' : 'invisible'}`}
        >
          <Spinner />
          {loadingLabel}
        </span>
      )}
    </button>
  );
}
