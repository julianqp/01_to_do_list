import { useEffect, useRef, useState } from 'react';
import { AccountMenu } from './AccountMenu';
import { Button } from './Button';

// DESIGN.md §3.2: cabecera sin barra, con píldoras flotantes, fija al hacer scroll. Un solo uso
// (PrivateArea).
export type LogoutHandler = (callbacks?: { onError?: () => void }) => void;

// Spec 002 D-8: sin email (no se ha podido comprobar la sesión) solo se ve el nombre de la app.
export type AppHeaderProps = { email?: string; loggingOut: boolean; onLogout: LogoutHandler };

// Píldora glass de la cabecera (§3.2), sin el display: cada uso pone el suyo.
const PILL =
  'h-11 rounded-pill border border-contrast bg-glass px-5 text-body text-1 shadow-(--shadow-pill) backdrop-glass';

// DESIGN.md §14 Tooltip: aparece con un retardo de 400 ms.
const TOOLTIP_DELAY_MS = 400;

// E-1, D-13: el email se recorta con «…» y, si está recortado, se ve completo en un tooltip al pasar
// el ratón o al llevar el foco. El tooltip es aria-hidden: el lector ya lee el email entero del DOM.
// Va dentro del mismo contenedor que la píldora para poder pasar el ratón por encima (WCAG 1.4.13).
// X-13: al menos 34 px de alto como la píldora de §14, pero con varias líneas si el email no cabe.
function EmailPill({ email }: { email: string }) {
  const [tooltip, setTooltip] = useState(false);
  const pillRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show() {
    const pill = pillRef.current;
    if (!pill || pill.scrollWidth <= pill.clientWidth) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTooltip(true), TOOLTIP_DELAY_MS);
  }

  function hide() {
    clearTimeout(timer.current);
    setTooltip(false);
  }

  // Esc lo oculta aunque el foco esté en otra parte (WCAG 1.4.13).
  useEffect(() => {
    if (!tooltip) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [tooltip]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <span className="relative flex min-w-0" onMouseEnter={show} onMouseLeave={hide}>
      <span
        ref={pillRef}
        tabIndex={0}
        onFocus={show}
        onBlur={hide}
        className={`${PILL} block max-w-80 min-w-0 truncate leading-11`}
      >
        {email}
      </span>
      {tooltip && (
        <span
          aria-hidden="true"
          className="absolute end-0 top-full z-(--z-tooltip) mt-2 min-h-8.5 w-max max-w-96 rounded-md bg-tooltip px-3.5 py-2 text-sm text-on-tooltip wrap-anywhere"
        >
          {email}
        </span>
      )}
    </span>
  );
}

export function AppHeader({ email, loggingOut, onLogout }: AppHeaderProps) {
  return (
    // D-11, X-8: siempre con la superficie de cabecera y blur. D-22: borde inferior de contraste
    // (transparente salvo con «aumentar contraste», CA-5.2).
    <header className="sticky top-0 z-(--z-sticky) border-b border-contrast bg-header backdrop-glass">
      <div className="mx-auto flex max-w-420 items-center justify-between gap-3 px-4 py-3 md:px-7">
        <span className={`${PILL} inline-flex items-center`}>Mis tareas</span>
        {email !== undefined && (
          <>
            {/* D-11: las dos variantes están en el DOM y se alternan con CSS (RF-006, RF-007). */}
            <div className="flex min-w-0 items-center gap-2 max-md:hidden">
              <EmailPill email={email} />
              <Button
                variant="glass"
                loading={loggingOut}
                loadingLabel="Cerrando sesión…"
                onClick={() => onLogout()}
              >
                Cerrar sesión
              </Button>
            </div>
            <div className="md:hidden">
              <AccountMenu email={email} loggingOut={loggingOut} onLogout={onLogout} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
