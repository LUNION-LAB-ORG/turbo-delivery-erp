'use client';

import { Avatar } from '@heroui-v3/react';

import ButtonRetour from '@/components/commons/bouton-retour';
import ListPerformanceApercu from '@/components/dashboard/delivery-men/performance-apercu/list-performance';
import { LivreurDetail } from '@/types/livreur';
import { PerformanceCreneauId } from '@/types/performance-creneauId';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

interface Props {
  data: PerformanceCreneauId;
  infoUser: LivreurDetail;
}

/**
 * L'apercu de performance d'un coursier.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Le sujet de cet ecran est le tableau de progression, pas la fiche du coursier. Mais
 * on y arrive depuis la liste des performances, par le menu d'une ligne, et le depot
 * porte des homonymes au point qu'une note de fusion de doublons existe : avant de lire
 * des chiffres, il faut savoir de qui ils sont. L'en-tete repond donc a « suis-je sur le
 * bon coursier » et rien de plus, sur UNE ligne.</p>
 *
 * <p>C'est la difference avec la fiche coursier voisine (`[driver_id]`), ou l'identite
 * est le sujet et occupe legitimement une Card entiere. Ici elle n'est qu'une
 * verification : la mettre en Card pleine largeur avec un avatar de 64 px, un titre en
 * `text-2xl` et un sous-titre coutait environ 180 px avant la premiere donnee. Sur la
 * fenetre reelle du poste (environ 1000 x 563 px, coquille comprise), c'est un tiers de
 * la hauteur utile depense a redire ce que l'operateur venait de cliquer. Retour, photo,
 * nom, identifiants et etiquette d'ecran tiennent maintenant sur une seule ligne
 * d'environ 48 px.</p>
 *
 * <h3>Ordre du nom</h3>
 * <p>L'ecran affiche NOM puis PRENOMS, comme avant la conversion et comme la fiche
 * coursier (`[driver_id]`). Le depot est partage sur ce point (`men/[id]/edit-content`
 * fait l'inverse), mais avec des homonymes on cherche par le nom : c'est le premier mot
 * qui doit correspondre d'un ecran a l'autre. Une version intermediaire avait inverse
 * l'ordre sans le dire ; c'est retabli.</p>
 *
 * <h3>Chiffres</h3>
 * <p>Matricule et telephone sont rendus en `font-mono tabular-nums`, comme sur la fiche
 * coursier : ce sont justement les valeurs qu'on compare a l'oeil entre deux ecrans, et
 * en chasse proportionnelle deux matricules voisins ne s'alignent pas. Le point de
 * separation est un element a part, `aria-hidden`, sinon un lecteur d'ecran l'annonce
 * entre les deux valeurs.</p>
 *
 * <h3>Ce qui a ete retire</h3>
 * <p>Le nom etait enferme dans un cadre gris termine par un chevron vers le bas, cale sur
 * `max-w-sm` : le dessin exact d'une liste deroulante. Il n'y avait ni gestionnaire, ni
 * etat, ni liste de coursiers sur cette page ; rien ne s'ouvrait. C'etait un selecteur
 * promis et jamais construit, et un cadre qui appelle un clic sans rien faire coute plus
 * qu'il ne rend. Si l'equipe veut changer de coursier sans repasser par la liste, cela se
 * construit en ComboBox, avec la liste des coursiers et un changement de route.</p>
 *
 * <p>Le cadre etait peint en gris ecrit en dur, hors des jetons du theme : sur fond sombre
 * le gris clair reste clair et le texte disparait dedans. Le titre, lui, portait la
 * couleur de MARQUE. Un titre de page n'appelle aucun geste ; c'est sa graisse qui le
 * porte, pas sa teinte.</p>
 *
 * <p>Quatre imports morts ont saute (`Card` depuis la couche v2 proscrite,
 * `EmptyDataTable`, `TableCreneau`, `SectionHeaderRetour`) : aucun n'etait rendu.</p>
 *
 * <h3>Signale, pas touche</h3>
 * <p>Le tableau lui-meme vit dans `components/dashboard/delivery-men/performance-apercu/
 * list-performance.tsx`, un composant partage que ce fichier n'a pas a modifier. Trois
 * defauts y sont visibles depuis cet ecran :</p>
 * <p>1. l'etiquette « Creneau du : ... » est peinte en `bg-red-500 text-red-500 text-white`
 * : le rouge de marque sur une date, qui n'appelle aucun geste, en palette brute sans
 * variante sombre, avec deux couleurs de texte qui se contredisent sur le meme element.</p>
 * <p>2. la table des mois ecrite a la main sert « Mais » pour mai, « Jull » pour juillet,
 * « Des » pour decembre, « Fev » sans accent, et `undefined` hors des douze cas : du texte
 * faux affiche en production.</p>
 * <p>3. `FakeTableCreneau` est rendu DEUX FOIS en bas de l'ecran : des zeros fabriques
 * presentes comme des donnees.</p>
 * <p>4. `infoUser` lui est passe mais n'est jamais lu dans son corps. La prop reste
 * transmise, le contrat du composant n'etant pas a nous, mais le lien est mort.</p>
 *
 * <p>Le montage photo + initiales existe deja empaquete dans
 * `_composants/cellule-coursier.tsx`. Il n'est pas reutilise ici parce qu'il rend un
 * avatar de 36 px et un `<p>` : cet ecran a besoin d'un `<h1>`, seul titre de la page.
 * Lui ajouter une taille et un niveau de titre toucherait un composant partage par trois
 * listes de coursiers, donc c'est signale et non fait.</p>
 */
export default function Content({ data, infoUser }: Props) {
  // NOM puis PRENOMS : c'est l'ordre d'avant la conversion et celui de la fiche coursier.
  // Avec des homonymes, on cherche par le nom.
  const nomComplet = [infoUser.nom, infoUser.prenoms].filter(Boolean).join(' ').trim();

  // Le service qui rend cette fiche est `backend` (voir livreur-info.action) : c'est ce
  // resolveur-la qui sait fabriquer l'URL du fichier. Sans chemin, on ne l'appelle pas,
  // il rendrait une adresse tronquee et le navigateur une image cassee.
  const photo = infoUser.avatarUrl?.trim() ? createUrlFile(infoUser.avatarUrl, 'backend') : undefined;

  const matricule = infoUser.matricule?.trim() ?? '';
  const telephone = infoUser.telephone?.trim() ?? '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ButtonRetour />
        <span className="text-sm text-muted">Aperçu performance</span>

        <Avatar className="size-12 shrink-0">
          {/*
           * Sans nom, `alt` vide rendrait la photo decorative : l'operateur non voyant
           * n'apprendrait meme pas qu'il y en a une.
           */}
          {photo && <Avatar.Image alt={`Photo de ${nomComplet || 'ce coursier'}`} src={photo} />}
          <Avatar.Fallback>{getInitials(nomComplet || '?')}</Avatar.Fallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          {/*
           * Un nom vide rendait un espace : l'en-tete paraissait vide sans dire pourquoi.
           * Le dire est plus utile que le taire.
           */}
          <h1 className="truncate text-xl font-semibold text-foreground capitalize">
            {nomComplet || 'Nom non renseigné'}
          </h1>

          {/*
           * Deux identifiants au plus, et seulement ceux qui existent : un point de
           * separation tout seul dirait qu'il y a une donnee la ou il n'y en a pas.
           */}
          {(matricule || telephone) && (
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              {matricule && <span className="font-mono tabular-nums">{matricule}</span>}
              {matricule && telephone && <span aria-hidden="true">·</span>}
              {telephone && <span className="font-mono tabular-nums">{telephone}</span>}
            </p>
          )}
        </div>
      </div>

      <ListPerformanceApercu data={data} infoUser={infoUser} />
    </div>
  );
}
