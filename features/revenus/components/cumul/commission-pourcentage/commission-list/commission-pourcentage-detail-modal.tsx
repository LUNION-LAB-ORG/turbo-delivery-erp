'use client';

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bike, Calendar, Hash, Home, MapPin, Percent, Receipt } from 'lucide-react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ICommission } from '@/features/revenus/types/commission.types';
import { formatMontant } from '@/utils/format.utils';

interface CommissionVariableDetailModalProps {
    commissionVariable: ICommission;
    onFermer: () => void;
    ouvert: boolean;
}

/**
 * Le taux reellement applique a cette commande.
 *
 * <p>Le tableau ecrivait « 10% » EN DUR sur chaque ligne, a cote du montant. C'etait une
 * affirmation que la ligne ne portait pas : rien dans la reponse ne dit que le taux vaut
 * dix pour cent, et une grille historisee peut avoir change. Le taux se deduit de la
 * ligne elle-meme, et se tait quand la commande vaut zero plutot que de rendre une
 * division impossible.</p>
 */
export function formatTauxCommission(ligne: ICommission): string {
    if (!ligne.totalAmount || ligne.totalAmount <= 0) return '—';
    return new Intl.NumberFormat('fr-FR', {
        maximumFractionDigits: 1,
        style: 'percent',
    }).format(ligne.commission / ligne.totalAmount);
}

function formatDateHeure(dateString: string): string {
    if (!dateString) return '—';
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
        return dateString;
    }
}

/**
 * Une rubrique de la fiche : ce qu'on lit, et la valeur.
 *
 * <p>`nombre` met la valeur en chasse tabulaire : une reference, une date et un montant se
 * relisent chiffre a chiffre, et sans chasse fixe les colonnes de chiffres se decalent
 * d'une ligne a l'autre.</p>
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
 * La fiche d'une commission en pourcentage.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre venait de shadcn et les six valeurs etaient posees dans des `Input`
 * `readOnly`. Un champ de saisie annonce « ici on ecrit » : le curseur y clignote, le
 * lecteur d'ecran annonce une zone de texte, et rien de tout cela n'est vrai. Ce sont des
 * FAITS, ils se lisent. Deux des six portaient d'ailleurs un `id` qui ne correspondait pas
 * au `htmlFor` de leur etiquette — « Localisation » designait un champ nomme
 * `coutCommande`, « Restaurant » un champ nomme `livreur` — donc deux etiquettes rattachees
 * a rien. Un troisieme `id`, `montant_commande`, etait porte par DEUX elements.</p>
 *
 * <p>Le titre annoncait « Details de la commission FIXE » sur le module des commissions en
 * POURCENTAGE : le libelle avait ete recopie du module voisin.</p>
 *
 * <p>La DATE affichait `new Date()`, c'est-a-dire AUJOURD'HUI, sur toutes les commissions
 * quelle que soit leur anciennete. C'etait faux, et invisible tant qu'on ne consultait pas
 * une vieille ligne — la liste, elle, affichait deja `createdAt`. La fiche l'affiche
 * aussi.</p>
 *
 * <p>Les frais de livraison manquaient : c'est le seul montant de la commande que la fiche
 * ne montrait pas, alors que la carte « commissions du mois » l'affiche. Le TAUX manquait
 * de meme, sur une fiche dont c'est justement l'objet.</p>
 *
 * <p>Le montant etait ecrit en ROUGE, comme son etiquette. Le rouge de marque annonce un
 * geste ; une commission encaissee n'en appelle aucun. « Imprimer » etait de meme en
 * `destructive`, alors qu'imprimer ne detruit rien.</p>
 *
 * <p>Le declencheur a quitte le composant : c'etait un `<button>` nu place a l'interieur
 * d'un element de menu, soit un element interactif dans un autre, ce qui n'a pas de
 * comportement defini. La fenetre est desormais PILOTEE par la liste.</p>
 *
 * <p>Le logo de l'entreprise, qui ornait le titre, ne portait aucune information : il
 * disait a l'operateur, dans son propre ERP, chez qui il travaille.</p>
 */
export function CommissionVariableDetailModal({
    commissionVariable,
    onFermer,
    ouvert,
}: CommissionVariableDetailModalProps) {
    return (
        <FenetreAction
            libelleAction="Imprimer"
            libelleFermer="Fermer"
            onAction={() => window.print()}
            onFermer={onFermer}
            ouvert={ouvert}
            titre="Détails de la commission en pourcentage"
        >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Rubrique
                    icone={Hash}
                    libelle="Référence"
                    nombre
                    valeur={`REF-${commissionVariable.commandeId}`}
                />
                <Rubrique
                    icone={Calendar}
                    libelle="Date"
                    nombre
                    valeur={formatDateHeure(commissionVariable.createdAt)}
                />
                <Rubrique
                    icone={Home}
                    libelle="Restaurant"
                    valeur={commissionVariable.nomRestaurant}
                />
                <Rubrique
                    icone={MapPin}
                    libelle="Localisation"
                    valeur={commissionVariable.localisation}
                />
                <Rubrique
                    icone={Receipt}
                    libelle="Montant de la commande"
                    nombre
                    valeur={formatMontant(commissionVariable.totalAmount)}
                />
                <Rubrique
                    icone={Bike}
                    libelle="Frais de livraison"
                    nombre
                    valeur={formatMontant(commissionVariable.fraisLivraison)}
                />
            </div>

            {/* La commission est ce pour quoi on ouvre la fiche : elle occupe une ligne a
                elle seule, plus grande que les rubriques qui la situent. Le taux est colle
                au montant, parce que c'est de lui qu'il se deduit. */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-surface-secondary p-4">
                <div className="flex items-center gap-3">
                    <Percent aria-hidden="true" className="size-5 shrink-0 text-muted" />
                    <div>
                        <p className="text-sm text-muted">Commission</p>
                        <p className="text-xs tabular-nums text-muted">
                            {formatTauxCommission(commissionVariable)} de la commande
                        </p>
                    </div>
                </div>
                <span className="text-2xl font-bold tabular-nums text-foreground">
                    {formatMontant(commissionVariable.commission)}
                </span>
            </div>
        </FenetreAction>
    );
}
