'use client';

import { useMemo, useState } from 'react';

import { ChampDate, ChampListe } from '@/components/commons/champs-formulaire';
import { useLivraisonList } from '@/features/revenus/hooks/use-livraison-list';
import { useUniversalFilter } from '@/hooks/use-universal-filter';

/**
 * Les deux filtres de la barre des revenus : une date de livraison, un livreur.
 *
 * <h3>Ce qui change</h3>
 * <p>Les deux champs venaient de shadcn : un `Select` pour le livreur, et un
 * `CalendarInput` maison qui monte à lui seul quatre primitives shadcn (bouton,
 * calendrier, champ, popover). Ils deviennent les champs partagés de l'ERP, donc la
 * ComboBox CHERCHABLE : la liste des livreurs se compte en centaines, et un `Select`
 * obligeait à la dérouler jusqu'au bon nom.</p>
 *
 * <p>Aucun des deux champs n'avait de LIBELLÉ : on lisait « Date de livraison » et
 * « Filtrer par livreur » en texte fantôme, qui disparaît dès qu'une valeur est choisie.
 * Une fois deux filtres posés, plus rien à l'écran ne disait ce qu'ils filtraient.</p>
 *
 * <p>La date circule désormais en texte `yyyy-MM-dd`, la forme que le serveur attend.
 * Elle passait avant par `toISOString()`, qui convertit en UTC : une date choisie en fin
 * de journée depuis un fuseau à l'est partait au serveur décalée d'un jour.</p>
 */

/*
 * Sentinelle du « pas de filtre ». Une option d'identifiant VIDE serait avalee par la
 * ComboBox, qui traite la chaine vide comme « rien de selectionne » et n'afficherait
 * donc jamais « Tous les livreurs » comme choix courant.
 */
const TOUS = 'tous';

export default function FilterPeriode() {
    const [dateLivraison, setDateLivraison] = useState('');
    const [livreur, setLivreur] = useState(TOUS);

    const { applyFilter } = useUniversalFilter();
    const { isError, livraisons } = useLivraisonList();

    const options = useMemo(() => {
        const noms = new Set<string>();
        (Array.isArray(livraisons) ? livraisons : []).forEach((livraison) => {
            if (livraison.nomLivreur) noms.add(livraison.nomLivreur);
        });

        return [
            { label: 'Tous les livreurs', value: TOUS },
            ...Array.from(noms)
                .sort((a, b) => a.localeCompare(b, 'fr'))
                .map((nom) => ({ label: nom, value: nom })),
        ];
    }, [livraisons]);

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:w-52">
                <ChampDate
                    label="Date de livraison"
                    onChange={(valeur) => {
                        setDateLivraison(valeur);
                        applyFilter('dateLivraison', valeur);
                    }}
                    valeur={dateLivraison}
                />
            </div>

            <div className="w-full md:w-60">
                <ChampListe
                    label="Livreur"
                    /*
                     * « Aucun livreur disponible » etait une AFFIRMATION, et l'ancien
                     * ecran la posait aussi quand la lecture des livraisons avait
                     * echoue : l'operateur en concluait qu'aucun livreur n'avait roule.
                     */
                    messageListeVide={
                        isError
                            ? 'Les livraisons n’ont pas pu être lues : la liste est indisponible.'
                            : 'Aucun livreur dans les livraisons chargées.'
                    }
                    onChange={(valeur) => {
                        setLivreur(valeur);
                        applyFilter('search', valeur === TOUS ? '' : valeur);
                    }}
                    options={options}
                    placeholder="Chercher un livreur…"
                    valeur={livreur}
                />
            </div>
        </div>
    );
}
