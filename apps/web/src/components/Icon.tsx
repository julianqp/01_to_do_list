import { LoaderCircle, type LucideIcon } from 'lucide-react';

// D-8: Lucide con el trazo de DESIGN.md §9; siempre decorativo (el texto de al lado dice lo mismo).
export type IconProps = { icon: LucideIcon; size?: 16 | 18 | 20 | 22; className?: string };

export function Icon({ icon: LucideIcon, size = 18, className }: IconProps) {
  return <LucideIcon size={size} strokeWidth={1.4} aria-hidden="true" className={className} />;
}

// Anillo de carga: LoaderCircle de 16 px que da una vuelta cada --dur-slow (§12, X-9).
export function Spinner() {
  return <Icon icon={LoaderCircle} size={16} className="animate-spin" />;
}
