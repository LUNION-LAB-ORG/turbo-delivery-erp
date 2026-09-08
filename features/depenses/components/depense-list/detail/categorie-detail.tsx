'use client';

import { Button, Tooltip } from '@heroui-v3/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bookmark, Calendar, Eye } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { formatMontant } from '@/utils/format.utils';

interface CategorieDetailModalProps {
  categorie: ICategorieDepense;
}

/**
 * La date d'une categorie, ou un tiret quand elle est illisible.
 *
 * <p>Elle etait rendue BRUTE, telle que le serveur l'envoie :
 * « 2026-03-14T09:22:07.481Z » dans un champ de saisie. Personne ne lit une date sous
 * cette forme, et le fuseau qui la termine laisse croire a une heure qui n'est pas celle
 * du bureau.</p>
 */
function formatDate(valeur: string | undefined) {
  if (!valeur) return '-';
  try {
    return format(parseISO(valeur), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return valeur;
  }
}

/**
 * Ce que vaut une categorie de depense.
 *
 * <h3>Ce qui change</h3>
 * <p>Les cinq valeurs etaient posees dans des `Input` en lecture seule : des champs de
 * SAISIE, avec leur bordure et leur curseur de texte, pour une fiche qui ne se modifie
 * pas. On y cliquait, on selectionnait, et rien ne se passait. Ce sont des valeurs
 * affichees, pas des champs.</p>
 *
 * <p>La reference apparaissait DEUX fois : en rouge de marque dans le titre, puis dans un
 * champ « Reference » juste en dessous. Le rouge de cet ERP est reserve a ce qui appelle
 * un geste ; une reference ne demande rien. Elle est ecrite une fois, sous le nom.</p>
 *
 * <p>Le montant total est ce qu'on vient chercher ici : il passe en premier, en chasse
 * tabulaire, pour se comparer d'une categorie a l'autre.</p>
 *
 * <p>« Imprimer » etait peint en DESTRUCTIF, la couleur de ce qui detruit, a cote d'un
 * « Fermer » neutre. Imprimer ne detruit rien.</p>
 */
export function CategorieDetailModal({ categorie }: CategorieDetailModalProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Tooltip>
        <Button
          aria-label={`Voir les détails de ${categorie.nomCategorie}`}
          isIconOnly
          onPress={() => setOuvert(true)}
          size="sm"
          variant="ghost"
        >
          <Eye aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Voir détails</Tooltip.Content>
      </Tooltip>

      <FenetreAction
        libelleAction="Imprimer"
        libelleFermer="Fermer"
        onAction={() => window.print()}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre="Détails de la catégorie"
      >
        <div className="flex items-center gap-3">
          {/* Le logo sert d'en-tete a la fiche imprimee : « Imprimer » sort cette page
              telle qu'elle est a l'ecran. */}
          <Image
            alt=""
            className="rounded-lg"
            height={40}
            src="/assets/images/logo_turbo.jpg"
            width={40}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {categorie.nomCategorie}
            </p>
            <p className="text-xs tabular-nums text-muted">REF-{categorie.id}</p>
          </div>
        </div>

        <div className="rounded-lg border border-separator bg-surface-secondary p-4">
          <p className="text-xs text-muted">Montant total</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatMontant(categorie.totalDepense)}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-separator p-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <Calendar aria-hidden="true" className="size-3.5" />
              Date de création
            </dt>
            <dd className="mt-1 text-sm tabular-nums text-foreground">
              {formatDate(categorie.createdAt)}
            </dd>
          </div>

          <div className="rounded-lg border border-separator p-3">
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <Bookmark aria-hidden="true" className="size-3.5" />
              Description
            </dt>
            {/* Le gabarit interpolait `${categorie.description}` : une categorie sans
                description affichait donc le mot « undefined ». */}
            <dd className="mt-1 text-sm wrap-break-word text-foreground">
              {categorie.description || 'Aucune description'}
            </dd>
          </div>
        </dl>
      </FenetreAction>
    </>
  );
}
