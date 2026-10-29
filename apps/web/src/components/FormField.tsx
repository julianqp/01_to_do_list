import { CircleAlert } from 'lucide-react';
import { Icon } from './Icon';

export type FormFieldProps = {
  id: string;
  label: string;
  type: 'email' | 'password';
  // D-12.
  autoComplete: 'email' | 'new-password' | 'current-password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

// RNF-001: etiqueta visible y error asociado al campo (aria-invalid + aria-describedby).
// `name` = `id`, para que el formulario pueda llevar el foco al primer campo con error.
// Aspecto (DESIGN.md §13, §14 Input; plan 004 D-15): campo raised de 52 px; con foco sube a
// raised-hover con halo; con error, anillo inset de --ring-error e icono al final.
export function FormField({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  error,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="ps-5 text-sm text-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-13 w-full rounded-pill border border-contrast bg-raised px-5 text-body text-1 transition duration-(--dur-fast) ease-out focus:bg-raised-hover focus:shadow-(--focus-halo) aria-invalid:pe-12 aria-invalid:inset-ring-(length:--ring-error-width) aria-invalid:inset-ring-ring-error"
        />
        {error && (
          <span className="pointer-events-none absolute inset-y-0 end-5 flex items-center">
            <Icon icon={CircleAlert} className="text-ring-error" />
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="ps-5 text-sm text-1">
          {error}
        </p>
      )}
    </div>
  );
}
