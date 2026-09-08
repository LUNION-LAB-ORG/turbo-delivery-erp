'use client';

import Link from 'next/link';
import React from 'react';

/**
 * Un lien qui a l'allure d'un bouton.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Le `Button` de la v3 est un `<button>` : il ne prend pas de `href`. Pour un geste
 * qui NAVIGUE, on trouvait donc deux contournements dans le code, tous deux invalides :
 * un `<Link>` de Next imbriqué DANS un `Button` — soit `<a>` dans `<button>` — ou
 * l'inverse. Un élément interactif dans un autre élément interactif n'a pas de
 * comportement défini : les lecteurs d'écran annoncent un bouton dont le nom vient d'un
 * lien, et selon le navigateur le clic active l'un, l'autre, ou aucun des deux.</p>
 *
 * <p>Ici c'est un VRAI lien : un `<a href>` que Next route côté client, qu'on peut ouvrir
 * dans un nouvel onglet, copier, ou survoler pour voir sa destination — ce qu'un
 * comptable fait tous les jours pour ouvrir trois factures côte à côte. Il porte
 * simplement les classes du bouton de la bibliothèque, `button button--{taille}
 * button--{variante}`, telles que le `Button` lui-même les émet.</p>
 */
export function LienBouton({
  children,
  className,
  href,
  onClicSimple,
  pleineLargeur,
  taille = 'md',
  variante = 'outline',
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  /**
   * Detourner le clic ORDINAIRE, sans rien perdre.
   *
   * <p>Quand un ecran prefere ouvrir un tiroir plutot que de naviguer, il pose cette
   * fonction : le clic simple l'appelle et la navigation est annulee. Le ctrl-clic, le
   * cmd-clic, le clic du milieu et « ouvrir dans un nouvel onglet » continuent en
   * revanche de suivre le lien — c'est precisement ce qu'un comptable fait pour ouvrir
   * trois dossiers cote a cote, et un `<button>` le lui retirerait.</p>
   */
  onClicSimple?: () => void;
  pleineLargeur?: boolean;
  taille?: 'lg' | 'md' | 'sm';
  variante?: 'danger' | 'ghost' | 'outline' | 'primary' | 'secondary';
}) {
  return (
    <Link
      className={['button', `button--${taille}`, `button--${variante}`, pleineLargeur ? 'w-full' : '', className ?? ''].filter(Boolean).join(' ')}
      href={href}
      onClick={(evenement) => {
        if (!onClicSimple) return;
        // Un clic avec modificateur, ou autre que le bouton gauche, appartient au
        // navigateur : on ne s'en mele pas.
        if (evenement.metaKey || evenement.ctrlKey || evenement.shiftKey || evenement.altKey) return;
        if (evenement.button !== 0) return;
        evenement.preventDefault();
        onClicSimple();
      }}
    >
      {children}
    </Link>
  );
}

export default LienBouton;
