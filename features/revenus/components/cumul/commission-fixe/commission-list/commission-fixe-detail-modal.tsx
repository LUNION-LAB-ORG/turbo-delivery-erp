'use client';

import { Calendar, Hash, Home, MapPin, Percent } from 'lucide-react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ICommission } from '@/features/revenus/types/commission.types';
import { formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { formatMontant } from '@/utils/format.utils';

interface CommissionFixeDetailModalProps {
    commissionFixee: ICommission;
    onFermer: () => void;
    ouvert: boolean;
}

/**
 * Une rubrique de la fiche : ce qu'on lit, et la valeur.
 *
 * <p>`nombre` met la valeur en chasse tabulaire : une reference, une date et un montant
 * se relisent chiffre a chiffre, et sans chasse fixe les colonnes de chiffres se
 * decalent d'une ligne a l'autre.</p>
 */
function Rubrique({
    icone: Icone,
    libelle,
    nombre,
    valeur,
}: {
    icone: typeof Hash;
    libelle: string;
    nombre?: boolean;
    valeur: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-separator bg-surface-secondary p-3">
            <Icone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{libelle}</p>
                <p
                    className={`wrap-break-word text-sm font-medium text-foreground ${
                        nombre ? 'tabular-nums' : ''
                    }`}
                >
                    {valeur}
                </p>
            </div>
        </div>
    );
}

/**
 * La fiche d'une commission fixe.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre venait de shadcn et les cinq valeurs etaient posees dans des `Input`
 * `readOnly`. Un champ de saisie annonce « ici on ecrit » : le curseur y clignote, le
 * lecteur d'ecran annonce une zone de texte, et rien de tout cela n'est vrai. Ce sont des
 * FAITS, ils se lisent. Deux des cinq portaient d'ailleurs un `id` qui ne correspondait
 * pas au `htmlFor` de leur etiquette : « Localisation » designait un champ nomme
 * `coutCommande`, « Restaurant » un champ nomme `livreur`, donc deux etiquettes qui
 * n'etaient rattachees a rien.</p>
 *
 * <p>La DATE affichait `new Date()`, c'est-a-dire AUJOURD'HUI, sur toutes les commissions
 * quelle que soit leur anciennete. C'etait faux, et invisible tant qu'on ne consultait
 * pas une vieille ligne. Elle affiche `createdAt`.</p>
 *
 * <p>Le montant etait ecrit en ROUGE, comme son etiquette. Le rouge de marque annonce un
 * geste ; une commission encaissee n'en appelle aucun. Il est neutre et en chasse
 * tabulaire. Le montant etait par ailleurs le seul des deux boutons du pied a etre peint :
 * « Imprimer » etait en `destructive`, alors qu'imprimer ne detruit rien.</p>
 *
 * <p>Le declencheur a disparu du composant : c'etait un `<button>` nu place a l'interieur
 * d'un element de menu, soit un element interactif dans un autre, ce qui n'a pas de
 * comportement defini et n'etait atteignable par aucun clavier. La fenetre est desormais
 * PILOTEE par la liste, comme celle des investissements.</p>
 *
 * <p>Le logo de l'entreprise, qui ornait le titre, ne portait aucune information : il
 * disait a l'operateur, dans son propre ERP, chez qui il travaille.</p>
 */
export function CommissionFixeDetailModal({
    commissionFixee,
    onFermer,
    ouvert,
}: CommissionFixeDetailModalProps) {
    return (
        <FenetreAction
            libelleAction="Imprimer"
            libelleFermer="Fermer"
            onAction={() => window.print()}
            onFermer={onFermer}
            ouvert={ouvert}
            titre="Détails de la commission fixe"
        >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Rubrique
                    icone={Hash}
                    libelle="Référence"
                    nombre
                    valeur={`REF-${commissionFixee.commandeId}`}
                />
                <Rubrique
                    icone={Calendar}
                    libelle="Date"
                    nombre
                    valeur={formatDateFR(commissionFixee.createdAt)}
                />
                <Rubrique icone={Home} libelle="Restaurant" valeur={commissionFixee.nomRestaurant} />
                <Rubrique
                    icone={MapPin}
                    libelle="Localisation"
                    valeur={commissionFixee.localisation}
                />
            </div>

            {/* La commission est ce pour quoi on ouvre la fiche : elle occupe une ligne a
                elle seule, plus grande que les rubriques qui la situent. */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-surface-secondary p-4">
                <div className="flex items-center gap-3">
                    <Percent aria-hidden="true" className="size-5 shrink-0 text-muted" />
                    <span className="text-sm text-muted">Commission</span>
                </div>
                <span className="text-2xl font-bold tabular-nums text-foreground">
                    {formatMontant(commissionFixee.commission)}
                </span>
            </div>
        </FenetreAction>
    );
}
