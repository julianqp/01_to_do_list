import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { Icon } from './Icon';

// DESIGN.md §14 Alert. Solo aspecto: el rol lo pone la zona que la contiene (D-14).
export type AlertTone = 'error' | 'offline' | 'info';

export type AlertProps = { tone: AlertTone; children: string };

// El tono se distingue por el tinte y por la forma del icono, nunca solo por el color (§1.3).
// X-7: texto e icono en --text-1 en los tres tonos.
const TONES = {
  error: { icon: CircleAlert, tint: 'from-rose-soft to-rose-soft' },
  offline: { icon: TriangleAlert, tint: 'from-amber-soft to-amber-soft' },
  info: { icon: Info, tint: 'from-lilac-soft to-lilac-soft' },
};

export function Alert({ tone, children }: AlertProps) {
  const { icon, tint } = TONES[tone];
  return (
    // Fondo raised con el tinte encima. E-6: sin altura fija; el texto pasa a varias líneas.
    <div
      data-tone={tone}
      className={`flex items-start gap-3 rounded-md border border-contrast bg-raised bg-linear-to-r px-5 py-3.5 text-1 ${tint}`}
    >
      <Icon icon={icon} className="mt-0.5 shrink-0" />
      <span className="min-w-0 text-pretty">{children}</span>
    </div>
  );
}
