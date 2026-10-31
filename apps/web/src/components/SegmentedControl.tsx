// DESIGN.md §14 Segmentado: contenedor hundido. Spec 002 D-15: radios nativos, así que las flechas,
// el foco y el anuncio los da el navegador (CA-4.2). Dos usos: el estado en el diálogo y la columna en
// móvil (C-22).
export type StatusTone = 'lilac' | 'ink' | 'sage';

export type SegmentedOption = { value: string; label: string; selectedTone?: StatusTone };

export type SegmentedControlProps = {
  name: string;
  legend: string;
  // El selector de columna en móvil no muestra la leyenda (sigue siendo el nombre del grupo).
  hideLegend?: boolean;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
};

// D-15, §1.3: el tono solo en la opción elegida. Sin tono (Backlog y el selector de columna), neutra.
const SELECTED = {
  neutral: 'bg-raised-hover text-1 shadow-(--shadow-pill)',
  lilac: 'bg-(image:--pill-lilac) text-on-pill shadow-(--shadow-pill)',
  ink: 'bg-(image:--pill-ink) text-on-accent shadow-(--shadow-pill)',
  sage: 'bg-(image:--pill-sage) text-on-pill shadow-(--shadow-pill)',
};

export function SegmentedControl({
  name,
  legend,
  hideLegend = false,
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className={hideLegend ? 'sr-only' : 'mb-2 ps-5 text-sm text-2'}>{legend}</legend>
      <div className="flex gap-1 rounded-pill border border-contrast bg-sunken p-1">
        {options.map((option) => {
          const selected = option.value === value;
          const tone = selected ? SELECTED[option.selectedTone ?? 'neutral'] : 'text-2';
          return (
            // X-4: 44 px como mínimo; una etiqueta larga («In progress · 3» a 375 px) pasa a dos líneas
            // sin salirse (RNF-002). El radio cubre la opción entera: el contorno de foco la rodea.
            <label
              key={option.value}
              className={`relative flex min-h-11 min-w-0 flex-auto cursor-pointer items-center justify-center rounded-pill px-2 py-1 text-center text-sm transition duration-(--dur-fast) ease-out ${tone}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="absolute inset-0 cursor-pointer appearance-none rounded-pill"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
