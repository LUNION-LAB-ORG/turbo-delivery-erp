'use client';

import { Card } from '@heroui-v3/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';

import { ICommission } from '@/features/revenus/types/commission.types';
import { formatMontant } from '@/utils/format.utils';

interface LastCommissionProps {
    commission?: ICommission[];
}

/**
 * La date d'une commission, a la minute.
 *
 * <p>L'heure est gardee : deux commissions du meme partenaire tombent souvent le meme
 * jour, et c'est l'heure qui les distingue dans la liste.</p>
 */
function formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
        return dateString;
    }
}

/**
 * Les commissions en pourcentage encaissees ce mois-ci.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un CARROUSEL vertical qui defilait tout seul toutes les SECONDES, monte sur
 * embla via le carrousel de shadcn. Un montant qui glisse hors de l'ecran au bout d'une
 * seconde ne se lit pas, et deux montants qui ne sont jamais immobiles ensemble ne se
 * comparent pas. Il fallait de surcroit attendre le tour complet pour revoir une ligne :
 * la carte AFFICHAIT la donnee sans permettre de la consulter. Le defilement automatique
 * est la seule chose retiree.</p>
 *
 * <p>La forme naturelle de cette donnee est une liste : les partenaires les uns sous les
 * autres, du plus recent au plus ancien, les montants alignes a droite en chasse tabulaire
 * pour que les milliers tombent les uns sous les autres. Elle se defile a la main, dans
 * les deux sens, aussi lentement qu'on veut.</p>
 *
 * <p>Trois couleurs disparaissent avec le carrousel : le degrade bleu du bandeau, le bleu
 * du nom de restaurant et le vert des montants. Aucune ne disait quoi que ce soit — ni
 * alerte, ni reussite, ni geste — et aucune n'avait de variante sombre. L'icone monetaire
 * du titre etait par ailleurs un heroicon recopie a la main, une quatrieme source d'icones
 * a cote de lucide.</p>
 *
 * <p>Le cas VIDE n'etait pas traite : sans commission ce mois-ci, le carrousel rendait
 * 400 px de blanc sous un titre. Il se dit maintenant.</p>
 */
export default function LastCommission({ commission }: LastCommissionProps) {
    const commissionMoisCourant = useMemo(() => {
        if (!commission) return [];

        const maintenant = new Date();
        const moisCourant = maintenant.getMonth();
        const anneeCourante = maintenant.getFullYear();

        return commission
            .filter((ligne) => {
                const date = new Date(ligne.createdAt);
                return date.getMonth() === moisCourant && date.getFullYear() === anneeCourante;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [commission]);

    const total = commissionMoisCourant.reduce((somme, ligne) => somme + (ligne.commission || 0), 0);

    return (
        <Card>
            <Card.Header className="flex-row items-baseline justify-between gap-3">
                <Card.Title className="text-base">Commissions du mois courant</Card.Title>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                    {commissionMoisCourant.length} commission
                    {commissionMoisCourant.length > 1 ? 's' : ''}
                </span>
            </Card.Header>

            <Card.Content className="p-0">
                {commissionMoisCourant.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-muted">
                        Aucune commission ce mois-ci
                    </p>
                ) : (
                    <>
                        {/* Les libelles « Restaurant » et « Commission » etaient repetes sur
                            chaque vignette du carrousel. Ils sont dits une fois, en tete de
                            colonne, la ou ils servent a lire toute la liste. */}
                        <div className="flex items-center justify-between gap-3 border-b border-separator px-4 py-2 text-xs text-muted">
                            <span>Restaurant</span>
                            <span>Commission</span>
                        </div>
                        <ul className="max-h-72 divide-y divide-separator overflow-y-auto">
                            {commissionMoisCourant.map((ligne) => (
                                <li
                                    className="flex items-start justify-between gap-3 px-4 py-2.5"
                                    key={ligne.id}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {ligne.nomRestaurant}
                                        </p>
                                        <p className="truncate text-xs text-muted">
                                            {ligne.localisation}
                                        </p>
                                        <p className="text-xs tabular-nums text-muted">
                                            {formatDate(ligne.createdAt)}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold tabular-nums text-foreground">
                                            {formatMontant(ligne.commission)}
                                        </p>
                                        <p className="text-xs tabular-nums text-muted">
                                            Livraison {formatMontant(ligne.fraisLivraison)}
                                        </p>
                                    </div>
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
                    {formatMontant(total)}
                </span>
            </Card.Footer>
        </Card>
    );
}
