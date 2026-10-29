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
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded border border-gray-500 px-3 py-2 aria-invalid:border-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
      />
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
