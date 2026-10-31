import { CircleAlert } from 'lucide-react';
import { Icon } from './Icon';

export type FormFieldProps = {
  id: string;
  label: string;
  // Spec 002: 'text' para las fechas «dd/mm/aaaa» (D-17) y el título.
  type?: 'email' | 'password' | 'text';
  // Spec 002 RF-016: un <textarea> (descripción).
  multiline?: boolean;
  // D-12 de la 001; 'off' en los campos de la tarea.
  autoComplete: 'email' | 'new-password' | 'current-password' | 'off';
  inputMode?: 'numeric';
  // DESIGN.md §13: los opcionales llevan «(opcional)» en --text-3 (spec 002 RF-010, D-9).
  optional?: boolean;
  // DESIGN.md §13: ayuda de 12 px en --text-3 bajo el campo (spec 002 D-17).
  help?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const CONTROL =
  'w-full border border-contrast bg-raised px-5 text-body text-1 transition duration-(--dur-fast) ease-out focus:bg-raised-hover focus:shadow-(--focus-halo) aria-invalid:pe-12 aria-invalid:inset-ring-(length:--ring-error-width) aria-invalid:inset-ring-ring-error';
// §14 Input: 52 px en píldora. §14 Textarea: padding 16/20; radio --radius-md (X-9: el 24 de §14 no
// está en el catálogo).
const INPUT = `${CONTROL} h-13 rounded-pill`;
const TEXTAREA = `${CONTROL} min-h-32 resize-y rounded-md py-4`;

// RNF-001: etiqueta visible y error asociado al campo (aria-invalid + aria-describedby).
// `name` = `id`, para que el formulario pueda llevar el foco al primer campo con error.
// Aspecto (DESIGN.md §13, §14 Input; plan 004 D-15): campo raised de 52 px; con foco sube a
// raised-hover con halo; con error, anillo inset de --ring-error e icono al final.
export function FormField({
  id,
  label,
  type = 'text',
  multiline = false,
  autoComplete,
  inputMode,
  optional = false,
  help,
  value,
  onChange,
  error,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;
  const control = {
    id,
    name: id,
    autoComplete,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="ps-5 text-sm text-2">
        {label}
        {optional && <span className="text-3"> (opcional)</span>}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            {...control}
            onChange={(event) => onChange(event.target.value)}
            className={TEXTAREA}
          />
        ) : (
          <input
            {...control}
            type={type}
            inputMode={inputMode}
            onChange={(event) => onChange(event.target.value)}
            className={INPUT}
          />
        )}
        {error && (
          <span
            className={`pointer-events-none absolute end-5 flex items-center ${multiline ? 'top-4' : 'inset-y-0'}`}
          >
            <Icon icon={CircleAlert} className="text-ring-error" />
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="ps-5 text-sm text-1">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="ps-5 text-xs text-3">
          {help}
        </p>
      )}
    </div>
  );
}
