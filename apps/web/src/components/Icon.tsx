import type { LucideIcon } from 'lucide-react';

// Contrato de plan 004 §4.3 (D-8): Lucide con el trazo de DESIGN.md §9; siempre decorativo.
export type IconProps = { icon: LucideIcon; size?: 16 | 18 | 20 | 22; className?: string };

export function Icon(props: IconProps) {
  void props;
  return null;
}

// Anillo de carga: LoaderCircle de 16 px que gira (DESIGN.md §12 «Carga de acción»).
export function Spinner() {
  return null;
}
