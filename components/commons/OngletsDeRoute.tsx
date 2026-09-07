'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export interface OngletRoute {
  /** Libellé affiché. Une phrase, pas un cri : « Performance des birds », pas « PERFORMANCE DES BIRD ». */
  libelle: string;
  /** Route de destination. Sert aussi à décider quel onglet est actif. */
  href: string;
  /** Vrai pour l'onglet racine, qui ne doit s'allumer que sur une correspondance EXACTE. */
  exact?: boolean;
}

/**
 * Une rangée d'onglets qui NAVIGUENT.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Cinq mises en page — coursiers, performance, créneaux, flotte, analytique — répétaient
 * chacune le même bloc de quinze lignes : un `Tabs` de la v2 dont chaque `Tab` recevait
 * `as={Link}` et rendait `{children}` dans SON panneau. Les cinq panneaux recevaient donc
 * le même contenu, celui de la route courante, et l'onglet actif se calculait à chaque fois
 * par une chaîne de ternaires écrite à la main sur les chemins en dur.</p>
 *
 * <h3>Pourquoi ce ne sont pas des onglets</h3>
 * <p>Un onglet montre un panneau déjà présent dans la page ; ici chaque entrée change
 * d'URL et recharge un segment. Ce sont des LIENS, et les lecteurs d'écran doivent les
 * entendre comme tels — un `role="tab"` promet une bascule instantanée qui n'a pas lieu.
 * D'où un `&lt;nav&gt;` de liens, avec `aria-current="page"` sur celui où l'on est.</p>
 *
 * <p>La rangée défile horizontalement quand elle ne tient pas : sur la fenêtre réelle des
 * postes (1000 px), « Performance des turboys assignés » à côté de « Performance des
 * birds » débordait, et l'ancienne version poussait la PAGE entière vers la droite.</p>
 */
export function OngletsDeRoute({ onglets }: { onglets: readonly OngletRoute[] }) {
  const pathname = usePathname();

  const actif =
    onglets.find((o) => !o.exact && pathname.startsWith(o.href))?.href ??
    onglets.find((o) => pathname === o.href)?.href;

  return (
    <nav aria-label="Sections" className="-mb-px overflow-x-auto border-b border-separator">
      <ul className="flex w-max min-w-full gap-1">
        {onglets.map((o) => {
          const estActif = o.href === actif;
          return (
            <li key={o.href}>
              <Link
                aria-current={estActif ? 'page' : undefined}
                className={[
                  'inline-flex items-center border-b-2 px-4 py-2.5 text-sm whitespace-nowrap transition-colors',
                  estActif
                    ? 'border-accent font-semibold text-foreground'
                    : 'border-transparent text-muted hover:border-separator hover:text-foreground',
                ].join(' ')}
                href={o.href}
              >
                {o.libelle}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
