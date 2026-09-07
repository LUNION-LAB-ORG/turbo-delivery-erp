'use client';

import { Avatar } from '@heroui-v3/react';

import { createUrlFile, getInitials } from '@/utils/createUrlFile';

/**
 * L'identité d'un coursier dans une liste : sa photo, son nom.
 *
 * <h3>Ce qui change</h3>
 * <p>Les trois écrans de coursiers portaient chacun la même `&lt;img&gt;` nue, avec un
 * repli sur un fichier `/assets/images/avatar.png` — une silhouette grise identique pour
 * tout le monde. Quand ce fichier manque, ou quand l'URL du serveur d'images échoue,
 * l'image cassée s'affichait telle quelle : un carré vide avec le texte alternatif.</p>
 *
 * <p>`Avatar.Fallback` retombe sur les INITIALES, qui distinguent au moins les lignes
 * entre elles, et le repli est déclenché par le composant, pas par le navigateur.</p>
 */
export function CelluleCoursier({
  avatarUrl,
  nom,
  sousTitre,
}: {
  avatarUrl?: null | string;
  nom: string;
  sousTitre?: string;
}) {
  const photo = avatarUrl ? createUrlFile(avatarUrl, 'backend') : undefined;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0">
        {photo && <Avatar.Image alt={nom} src={photo} />}
        <Avatar.Fallback>{getInitials(nom || '?')}</Avatar.Fallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground capitalize">{nom}</p>
        {sousTitre && <p className="truncate text-xs text-muted">{sousTitre}</p>}
      </div>
    </div>
  );
}
