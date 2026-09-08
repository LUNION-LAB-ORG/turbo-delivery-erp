'use client';

import { Card } from '@heroui-v3/react';
import { useMemo } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { useCommissionFixeList } from '@/features/revenus/hooks/use-commissionfixe-list';
import { ICommission } from '@/features/revenus/types/commission.types';
import { formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { formatMontant } from '@/utils/format.utils';

interface LastCommissionProps {
    /**
     * La liste, quand l'ecran appelant l'a deja lue.
     *
     * <p>Absente, le composant lit la meme requete lui-meme. Son seul appelant,
     * `analyse/index.tsx`, ne passait RIEN : la carte etait donc vide en production
     * depuis toujours, sur un ecran qui annonce « Commission du mois courant ». La
     * requete est partagee avec le reste de la page par sa cle TanStack, elle ne part
     * pas deux fois.</p>
     */
    commission?: ICommission[];
}

/**
 * Les commissions fixes encaissees ce mois-ci.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un CARROUSEL vertical qui defilait tout seul toutes les SECONDES, monte sur
 * embla, une bibliotheque de plus la ou la v3 n'en a pas besoin. Un montant qui glisse
 * hors de l'ecran au bout d'une seconde ne se lit pas, et deux montants qui ne sont
 * jamais immobiles ensemble ne se comparent pas. Il fallait par ailleurs attendre le tour
 * complet pour revoir une ligne : la carte AFFICHAIT la donnee sans permettre de la
 * consulter. C'est la seule chose retiree, et elle etait fausse.</p>
 *
 * <p>La forme naturelle de cette donnee est une liste : les partenaires les uns sous les
 * autres, les montants alignes a droite en chasse tabulaire pour que les milliers tombent
 * les uns sous les autres, du plus recent au plus ancien. Elle se defile a la main, dans
 * les deux sens, aussi lentement qu'on veut.</p>
 *
 * <p>L'echec de lecture n'a PAS de bouton de relance : `useCommissionFixeList` n'expose
 * pas le `refetch` de TanStack. Un bouton qui n'a rien a appeler serait un bouton mort,
 * exactement ce qu'on chasse ici ; le hook est a completer, il n'appartient pas a ce lot.</p>
 *
 * <p>Trois couleurs disparaissent avec le carrousel : le degrade bleu du bandeau, le bleu
 * du nom de restaurant et le vert du montant. Aucune ne disait quoi que ce soit : ni
 * alerte, ni reussite, ni geste. Aucune n'avait de variante sombre.</p>
 */
export default function LastCommission({ commission }: LastCommissionProps) {
    const { commissionsfixe, isError, isLoading } = useCommissionFixeList();
    const source = commission ?? commissionsfixe;
    // Une liste fournie par l'appelant est deja chargee : les etats de la requete
    // interne ne la concernent pas.
    const piloteParAppelant = commission !== undefined;

    const commissionMoisCourant = useMemo(() => {
        if (!source) return [];

        const maintenant = new Date();
        const moisCourant = maintenant.getMonth();
        const anneeCourante = maintenant.getFullYear();

        return source
            .filter((ligne) => {
                const date = new Date(ligne.createdAt);
                return date.getMonth() === moisCourant && date.getFullYear() === anneeCourante;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [source]);

    const total = commissionMoisCourant.reduce((somme, ligne) => somme + (ligne.commission || 0), 0);

    return (
        <Card>
            <Card.Header className="flex-row items-baseline justify-between gap-3">
                <Card.Title className="text-base">Commissions du mois courant</Card.Title>
                {/* Un echec de lecture ne doit pas s'ecrire « 0 » : le compteur affirmerait
                    un fait qu'on ne connait pas. */}
                <span className="shrink-0 text-xs tabular-nums text-muted">
                    {isError && !piloteParAppelant
                        ? '— commission'
                        : `${commissionMoisCourant.length} commission${commissionMoisCourant.length > 1 ? 's' : ''}`}
                </span>
            </Card.Header>

            <Card.Content className="p-0">
                {isError && !piloteParAppelant ? (
                    <div className="p-4">
                        <EtatErreur compact quoi="les commissions fixes" />
                    </div>
                ) : isLoading && !piloteParAppelant ? (
                    <div className="space-y-2 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                className="h-10 animate-pulse rounded-lg bg-surface-secondary"
                                key={`sq-${i}`}
                            />
                        ))}
                    </div>
                ) : commissionMoisCourant.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-muted">
                        Aucune commission fixe ce mois-ci
                    </p>
                ) : (
                    <>
                        {/* Les libelles « Restaurant » et « Montant » etaient repetes sur
                            chaque vignette du carrousel. Ils sont dits une fois, en tete
                            de colonne, la ou ils servent a lire toute la liste. */}
                        <div className="flex items-center justify-between gap-3 border-b border-separator px-4 py-2 text-xs text-muted">
                            <span>Restaurant</span>
                            <span>Commission</span>
                        </div>
                        <ul className="max-h-80 divide-y divide-separator overflow-y-auto">
                            {commissionMoisCourant.map((ligne) => (
                                <li
                                    className="flex items-start justify-between gap-3 px-4 py-2.5"
                                    key={ligne.id}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {ligne.nomRestaurant}
                                        </p>
                                        <p className="text-xs tabular-nums text-muted">
                                            {formatDateFR(ligne.createdAt)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                        {formatMontant(ligne.commission)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </Card.Content>

            <Card.Footer className="flex items-baseline justify-between gap-3 border-t border-separator">
                <span className="text-sm text-muted">Montant total</span>
                {/* Le total tombe dans la meme colonne que les montants de la liste :
                    c'est la seule facon de verifier une somme d'un coup d'oeil. */}
                <span className="text-base font-semibold tabular-nums text-foreground">
                    {isError && !piloteParAppelant ? '—' : formatMontant(total)}
                </span>
            </Card.Footer>
        </Card>
    );
}
