'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

import { LienBouton } from '@/components/commons/LienBouton';

/**
 * Un lien qui EMPORTE les filtres de l'URL courante.
 *
 * <p>Il vit dans les composants PARTAGES et non dans une feature : il ne connait aucun
 * domaine, il recopie une chaine de requete. Loge dans `classement-partenaires`, il
 * obligeait `rapports-performance` a dependre du classement pour un simple lien.</p>
 *
 * <h3>Pourquoi un lien, et pas un etat a porter</h3>
 * <p>La note demande que le classement « reste filtre par la meme plage de dates que
 * selectionnee en amont ». Les filtres du rapport de performance vivent deja dans l'URL
 * par nuqs : il n'y a donc rien a transporter, il suffit de recopier la chaine de
 * requete. Un etat partage entre les deux ecrans serait une machinerie pour reproduire ce
 * que le navigateur fait deja, et il se perdrait au rechargement de la page.</p>
 *
 * <p>On recopie TOUS les parametres, pas seulement `debut` et `fin`. Le selecteur de
 * perimetre du rapport est en cours de refonte : enumerer les cles ici obligerait a les
 * suivre, et un parametre oublie ferait silencieusement changer de perimetre entre les
 * deux ecrans. Ce qui n'est pas compris par la page d'arrivee est simplement ignore.</p>
 *
 * <h3>La frontiere de Suspense</h3>
 * <p>`useSearchParams` force la page qui l'appelle a etre rendue a la demande. Les ecrans
 * proteges le sont deja (`force-dynamic` sur leur layout), mais le banc d'apercu ne l'est
 * pas : sans cette frontiere, la generation de ce banc echouerait. Le repli rend le MEME
 * lien sans les parametres, pour que le bouton ne disparaisse jamais de la mise en page.</p>
 */
function LienInterne({
  children,
  chemin,
  className,
  taille,
  variante,
}: {
  children: React.ReactNode;
  chemin: string;
  className?: string;
  taille?: 'lg' | 'md' | 'sm';
  variante?: 'danger' | 'ghost' | 'outline' | 'primary' | 'secondary';
}) {
  const parametres = useSearchParams();
  const requete = parametres.toString();

  return (
    <LienBouton
      className={className}
      href={requete ? `${chemin}?${requete}` : chemin}
      taille={taille}
      variante={variante}
    >
      {children}
    </LienBouton>
  );
}

export function LienAvecFiltres({
  children,
  chemin,
  className,
  taille = 'md',
  variante = 'outline',
}: {
  children: React.ReactNode;
  chemin: string;
  className?: string;
  taille?: 'lg' | 'md' | 'sm';
  variante?: 'danger' | 'ghost' | 'outline' | 'primary' | 'secondary';
}) {
  return (
    <React.Suspense
      fallback={
        <LienBouton className={className} href={chemin} taille={taille} variante={variante}>
          {children}
        </LienBouton>
      }
    >
      <LienInterne chemin={chemin} className={className} taille={taille} variante={variante}>
        {children}
      </LienInterne>
    </React.Suspense>
  );
}
