'use client';

import * as React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { ICommission } from '@/features/revenus/types/commission.types';
import { useUniversalFilter } from '@/hooks/use-universal-filter';

/**
 * Le choix « tout voir », sous une cle qu'aucun restaurant ne peut porter.
 *
 * <p>La sentinelle valait « all » : un partenaire nomme ainsi aurait rendu le filtre
 * incapable de le selectionner.</p>
 */
const TOUS = '__tous__';

interface FilterRestaurantProps {
    commissions?: ICommission[];
    onFilterChange?: (filterName: string, value: string) => void;
}

/**
 * Le filtre par restaurant de la liste des commissions.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `Select` de shadcn, la derniere bibliotheque doublonnee du projet. Un
 * `Select` ne se CHERCHE pas : sur la production, la liste des partenaires depasse la
 * centaine, et il fallait derouler jusqu'a trouver le bon a l'oeil. C'est une `ComboBox`,
 * ou l'on tape les premieres lettres.</p>
 *
 * <p>Le champ n'avait pas d'etiquette, seulement un texte de substitution qui disparait
 * des qu'une valeur est choisie : le filtre en place ne disait plus SUR QUOI il portait.
 * Il en avait deja une, invisible, dans son icone d'entonnoir.</p>
 *
 * <p>Sa largeur montait a `lg:w-[350px]`. Le seuil `lg` de Tailwind ouvre a 1024 px, et la
 * fenetre reelle des postes fait 1000 px coquille comprise : cette largeur ne s'est jamais
 * appliquee chez personne. La largeur est laissee a l'ecran appelant.</p>
 *
 * <p>La liste vide affichait « Aucun restaurant disponible » sous la forme d'une OPTION
 * desactivee, c'est-a-dire d'un choix qu'on ne peut pas faire. C'est l'etat vide de la
 * liste, il est dit comme tel.</p>
 *
 * <p>La prop `moduleName` etait declaree, documentee par son defaut « commission », et
 * lue nulle part.</p>
 */
export default function FilterRestaurantComponent({
    commissions = [],
    onFilterChange,
}: FilterRestaurantProps) {
    const { applyFilter } = useUniversalFilter();
    const [choix, setChoix] = React.useState('');

    const options = React.useMemo(() => {
        const noms = Array.from(
            new Set(commissions.map((c) => c.nomRestaurant).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b, 'fr'));

        if (noms.length === 0) return [];
        return [
            { label: 'Tous les restaurants', value: TOUS },
            ...noms.map((nom) => ({ label: nom, value: nom })),
        ];
    }, [commissions]);

    const changer = (valeur: string) => {
        setChoix(valeur);
        const filtre = valeur === TOUS ? '' : valeur;

        // Le rappel direct sert l'ecran qui filtre sa propre liste ; le filtre universel
        // sert les ecrans qui lisent l'etat partage. Les deux coexistaient deja.
        onFilterChange?.('nomRestaurant', filtre);
        applyFilter('nomRestaurant', filtre);
    };

    return (
        <ChampListe
            label="Restaurant"
            messageListeVide="Aucun restaurant dans les commissions affichées"
            onChange={changer}
            options={options}
            placeholder="Tous les restaurants"
            valeur={choix}
        />
    );
}
