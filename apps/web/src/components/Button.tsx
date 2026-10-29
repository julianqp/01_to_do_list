// Contrato de plan 004 §4.3: DESIGN.md §14 Button. Píldora de 44 (md) o 52 (lg).
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

export function Button(props: ButtonProps) {
  void props;
  return null;
}
