import { useId, type ReactNode } from 'react';

export type FolderCardProps = { title: string; children: ReactNode };

// DESIGN.md §5, firma «tarjeta carpeta»: pestaña con radio 26 arriba a la izquierda que fluye a un
// hombro curvo de 72 × 52 hacia el cuerpo. Spec 002 D-22: superficie --surface-folder (opaca) y el
// hombro en un SVG con fill-folder, sin valores sueltos (ADR-0003). Dos usos: «Datos» y «Fechas» (C-22).
export function FolderCard({ title, children }: FolderCardProps) {
  const titleId = useId();
  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col">
      <div className="flex items-end">
        <div className="flex h-13 items-center rounded-tl-md bg-folder ps-5 pe-2">
          {/* D-9: --text-2 sobre la carpeta (11.02:1 en claro, R-1). */}
          <h3 id={titleId} className="text-h3 text-2">
            {title}
          </h3>
        </div>
        {/* Hombro: de lo alto de la pestaña baja en curva hasta el borde del cuerpo. -ms-px evita la
            costura de medio píxel entre la pestaña y el SVG. */}
        <svg
          aria-hidden="true"
          width="72"
          height="52"
          viewBox="0 0 72 52"
          className="-ms-px shrink-0 fill-folder"
        >
          <path d="M0 0C36 0 36 52 72 52H0Z" />
        </svg>
      </div>
      {/* Cuerpo: sin radio arriba a la izquierda, donde sale la pestaña. */}
      <div className="flex flex-col gap-4 rounded-lg rounded-tl-none bg-folder p-5">{children}</div>
    </div>
  );
}
