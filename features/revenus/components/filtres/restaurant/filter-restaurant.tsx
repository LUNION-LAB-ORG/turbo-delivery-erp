'use client';

import { useMemo } from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { useLivraisonList } from '@/features/revenus/hooks/use-livraison-list';
import { ILivraison } from '@/features/revenus/types/livraison.types';
import { useUniversalFilter } from '@/hooks/use-universal-filter';

/**
 * Le filtre par restaurant des listes de livraisons.
 *
 * <h3>Ce qui change</h3>
 * <p>C'était un `Select` de shadcn, sans libellé, à dérouler jusqu'au bon nom. C'est
 * désormais la ComboBox partagée de l'ERP, cherchable, et le restaurant choisi se lit
 * dans le champ.</p>
 *
 * <h3>Le filtre était MORT</h3>
 * <p>Il posait `applyFilter('restaurant', …)`, que le pont des filtres globaux traduit en
 * `restaurantId` pour le module livraison. Or `restaurantId` n'existe ni dans l'état
 * d'URL des livraisons (`livraison.filter.ts`) ni dans les paramètres envoyés à l'API,
 * qui n'y connaît que `nomRestaurant`. Choisir un restaurant ne changeait donc RIEN :
 * la liste restait identique, sans le moindre signe que le filtre n'avait pas porté.</p>
 *
 * <p>Le champ affichait par ailleurs `filters.nomRestaurant`, c'est-à-dire une valeur que
 * rien n'écrivait : il revenait toujours sur « Tous les restaurants » au rechargement.
 * Les deux bouts sont raccordés sur `nomRestaurant`, la seule clé que la chaîne
 * comprenne de bout en bout.</p>
 */

/*
 * Sentinelle du « pas de filtre » : voir le meme jeton dans le filtre de periode. La
 * chaine vide vaut « rien de selectionne » pour la ComboBox et n'est donc pas choisissable.
 */
const TOUS = 'tous';

export default function FilterRestaurant({ livraisons = [] }: { livraisons?: ILivraison[] }) {
    const { applyFilter } = useUniversalFilter();
    const { filters, isError } = useLivraisonList();

    const options = useMemo(() => {
        const noms = new Set<string>();
        (Array.isArray(livraisons) ? livraisons : []).forEach((livraison) => {
            if (livraison.nomRestaurant) noms.add(livraison.nomRestaurant);
        });

        return [
            { label: 'Tous les restaurants', value: TOUS },
            ...Array.from(noms)
                .sort((a, b) => a.localeCompare(b, 'fr'))
                .map((nom) => ({ label: nom, value: nom })),
        ];
    }, [livraisons]);

    return (
        <div className="w-full py-4 md:w-72">
            <ChampListe
                label="Restaurant"
                messageListeVide={
                    isError
                        ? 'Les livraisons n’ont pas pu être lues : la liste est indisponible.'
                        : 'Aucun restaurant dans les livraisons chargées.'
                }
                onChange={(valeur) => applyFilter('nomRestaurant', valeur === TOUS ? '' : valeur)}
                options={options}
                placeholder="Chercher un restaurant…"
                valeur={filters.nomRestaurant || TOUS}
            />
        </div>
    );
}
