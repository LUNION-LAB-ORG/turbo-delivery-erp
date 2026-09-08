'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Hash, Percent, Store, User, Wallet } from 'lucide-react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ILivraison } from '@/features/revenus/types/livraison.types';
import { formatMontant } from '@/utils/format.utils';

interface LivraisonDetailModalProps {
  livraison: ILivraison;
  onFermer: () => void;
  ouvert: boolean;
}

function formatDateHeure(dateString: string) {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateString;
  }
}

/**
 * Une rubrique de la fiche : ce que c'est, et ce que ca vaut.
 *
 * <p>`nombre` aligne la valeur a DROITE en chasse tabulaire : le cout, les frais et la
 * commission se lisent alors les uns sous les autres, chiffre par chiffre.</p>
 */
function Rubrique({
  icone: Icone,
  libelle,
  nombre,
  valeur,
}: {
  icone: React.ComponentType<{ className?: string }>;
  libelle: string;
  nombre?: boolean;
  valeur: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-separator py-2 last:border-b-0">
      <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
        <Icone aria-hidden="true" className="size-4" />
        {libelle}
      </span>
      <span
        className={`min-w-0 text-right text-sm font-medium text-foreground ${
          nombre ? 'tabular-nums' : 'wrap-break-word'
        }`}
      >
        {valeur}
      </span>
    </div>
  );
}

/**
 * Le detail d'une livraison.
 *
 * <h3>Ce qui change</h3>
 * <p>Les cinq valeurs etaient posees dans des `Input` de shadcn en `readOnly` : un champ
 * de saisie promet une saisie. On pouvait cliquer dedans, y placer le curseur, y
 * selectionner du texte, et rien ne s'enregistrait, alors que c'est une fiche qui se LIT. Les
 * bordures et les hauteurs de champ occupaient par ailleurs la moitie de la fenetre pour
 * cinq lignes de texte.</p>
 *
 * <p>Deux valeurs manquaient a une fiche qui s'annonce comme le detail de la course : le
 * RESTAURANT, qui figure dans le filtre de la page mais nulle part dans la liste, et les
 * FRAIS DE LIVRAISON, jusque-la visibles dans le tableau et absents ici. Elles sont deja
 * chargees, elles s'affichent.</p>
 *
 * <p>La date sortait telle que le serveur l'ecrit, horodatage ISO compris. Elle se lit
 * maintenant comme partout ailleurs dans l'ERP.</p>
 *
 * <p>« Imprimer » etait peint en ROUGE DESTRUCTIF a cote d'un « Fermer » neutre : rien
 * n'est detruit ici. La fenetre est pilotee par la ligne qui l'ouvre, et non plus par un
 * declencheur a elle : c'etait un `<button>` nu place DANS un element de menu, donc un
 * element interactif dans un autre, que le clavier n'atteignait pas.</p>
 */
export function LivraisonDetailModal({ livraison, onFermer, ouvert }: LivraisonDetailModalProps) {
  return (
    <FenetreAction
      libelleAction="Imprimer"
      libelleFermer="Fermer"
      onAction={() => window.print()}
      onFermer={onFermer}
      ouvert={ouvert}
      titre={`Livraison REF-${livraison.refCommande}`}
    >
      <div className="flex flex-col">
        <Rubrique
          icone={Hash}
          libelle="Référence"
          valeur={`REF-${livraison.refCommande}`}
        />
        <Rubrique
          icone={Calendar}
          libelle="Date"
          nombre
          valeur={formatDateHeure(livraison.createdAt)}
        />
        <Rubrique icone={User} libelle="Livreur" valeur={livraison.nomLivreur} />
        <Rubrique icone={Store} libelle="Restaurant" valeur={livraison.nomRestaurant} />
        <Rubrique
          icone={Wallet}
          libelle="Coût commande"
          nombre
          valeur={formatMontant(livraison.totalAmount)}
        />
        <Rubrique
          icone={Wallet}
          libelle="Frais de livraison"
          nombre
          valeur={formatMontant(livraison.fraisLivraison)}
        />
        <Rubrique
          icone={Percent}
          libelle="Commission"
          nombre
          valeur={formatMontant(livraison.commission)}
        />
      </div>
    </FenetreAction>
  );
}
