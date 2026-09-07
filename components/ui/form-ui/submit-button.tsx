'use client';

import { Button } from '@heroui-v3/react';
import { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/**
 * Le bouton d'envoi d'un formulaire d'action serveur.
 *
 * <h3>Ce qui change</h3>
 * <p>Il portait `border-0 uppercase` et une ombre écrite à la main —
 * `shadow-[0_10px_20px_-10px_rgba(0,0,0,0.44)]`, une valeur en dur, sans variante sombre,
 * qui posait sous le bouton une ombre noire de dix pixels que rien d'autre dans l'ERP ne
 * porte. Et les CAPITALES forcées faisaient épeler le libellé par les lecteurs d'écran.</p>
 *
 * <p>Il portait aussi `disabled` ET `aria-disabled` : le premier retire le bouton de
 * l'ordre de tabulation, si bien qu'un utilisateur au clavier perdait le focus au moment
 * de l'envoi et ne savait plus où il se trouvait. `isPending` du bouton v3 le laisse
 * atteignable tout en annonçant l'attente.</p>
 */
export function SubmitButton({
  children,
  ...props
}: { children: ReactNode } & React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" isPending={pending} type="submit" variant="primary" {...props}>
      {children}
    </Button>
  );
}
