'use client';

import { Button, Card } from '@heroui-v3/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';

import {
    TableauResponsive,
    type ColonneResponsive,
} from '@/components/commons/TableauResponsive';
import FilterPeriode from '@/features/revenus/components/filtres/periode/filter-periode';
import FilterRestaurant from '@/features/revenus/components/filtres/restaurant/filter-restaurant';
import { useCommissionFixeList } from '@/features/revenus/hooks/use-commissionfixe-list';
import { ICommission } from '@/features/revenus/types/commission.types';
import { formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { formatMontant } from '@/utils/format.utils';

import { CommissionFixeDetailModal } from './commission-fixe-detail-modal';

interface ICommissionFixe {
    /**
     * La liste, quand l'ecran appelant l'a deja lue.
     *
     * <p>Absente, le composant lit la meme requete lui-meme. Son seul appelant,
     * `commissison-fixe-client.tsx`, ne passait RIEN, si bien que le tableau etait vide
     * en production. La requete est partagee par sa cle TanStack, elle ne part pas deux
     * fois.</p>
     */
    commissionFixe?: ICommission[];
}

/**
 * Le seul geste d'une ligne : ouvrir la fiche.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un menu deroulant de shadcn a UN SEUL element, et cet element contenait la
 * fenetre entiere avec son propre declencheur : un `<button>` nu pose a l'interieur d'un
 * element de menu, lui-meme interactif. Deux elements interactifs imbriques n'ont pas de
 * comportement defini (le clavier n'atteignait jamais le bouton interne), et il fallait
 * un `onSelect={(e) => e.preventDefault()}` pour empecher le menu de se fermer avant que
 * la fenetre s'ouvre. Deux clics pour un seul geste.</p>
 *
 * <p>Un bouton, une fenetre pilotee. La liste mobile recopiait ce montage a l'identique,
 * en l'enveloppant en plus dans un `<button>` supplementaire : le meme composant sert
 * maintenant aux deux rendus.</p>
 */
function ActionsCommission({ commission }: { commission: ICommission }) {
    const [ouvert, setOuvert] = useState(false);

    return (
        <>
            <Button onPress={() => setOuvert(true)} size="sm" variant="ghost">
                <Eye aria-hidden="true" className="size-4" />
                Voir détails
            </Button>
            <CommissionFixeDetailModal
                commissionFixee={commission}
                onFermer={() => setOuvert(false)}
                ouvert={ouvert}
            />
        </>
    );
}

const colonnes: readonly ColonneResponsive<ICommission>[] = [
    {
        cle: 'date',
        libelle: 'Date',
        nombre: true,
        // Cette colonne rendait `new Date()`, donc AUJOURD'HUI sur toutes les lignes :
        // un tableau de dates identiques, faux, et impossible a trier de l'oeil.
        rendu: (ligne) => formatDateFR(ligne.createdAt),
    },
    {
        cle: 'restaurant',
        identite: true,
        libelle: 'Restaurant',
        // La colonne affichait `restaurantId`, un identifiant technique, la ou les cartes
        // mobiles affichaient deja `nomRestaurant` : les deux rendus divergeaient.
        rendu: (ligne) => <span className="font-semibold">{ligne.nomRestaurant}</span>,
    },
    {
        cle: 'localisation',
        libelle: 'Localisation',
        // Le texte portait `rounded-full px-3 py-1` : le dessin d'une pastille, sans fond
        // ni bordure, donc rien qu'un decalage qui desalignait la colonne.
        rendu: (ligne) => ligne.localisation,
    },
    {
        cle: 'commission',
        libelle: 'Commission',
        nombre: true,
        // Le montant etait rendu brut, sans separateur de milliers, suivi de « XOF ».
        // Le suffixe unique de l'ERP est « FCFA », et 1250000 ne se lit pas.
        rendu: (ligne) => formatMontant(ligne.commission),
    },
    {
        actions: true,
        cle: 'actions',
        libelle: 'Actions',
        rendu: (ligne) => <ActionsCommission commission={ligne} />,
    },
];

/**
 * La liste des commissions fixes.
 *
 * <h3>Ce qui change</h3>
 * <p>Le tableau et les cartes tactiles etaient ecrits DEUX fois, l'un sous l'autre, et
 * divergeaient deja : le nom du restaurant sur mobile, son identifiant sur poste ; la date
 * de creation sur mobile, la date du jour sur poste. Les colonnes sont declarees une seule
 * fois et `TableauResponsive` decide de la forme selon la largeur.</p>
 *
 * <p>La rangee d'en-tetes etait peinte en ROUGE DE MARQUE, texte blanc. Le rouge de l'ERP
 * annonce un geste ; une ligne d'en-tetes n'en appelle aucun, et cet aplat rouge etait la
 * chose la plus voyante d'un ecran ou ce qui compte est la colonne des montants.</p>
 *
 * <p>L'ecran ne savait pas dire qu'une lecture avait ECHOUE : les deux rendus affichaient
 * une liste vide, ce qui se lit comme « il n'y a pas de commission ». Il ne savait pas non
 * plus dire qu'elle etait en cours.</p>
 */
export default function CommissionFixe({ commissionFixe }: ICommissionFixe) {
    const { commissionsfixe, filters, handlePageChange, isError, isLoading } =
        useCommissionFixeList();
    const piloteParAppelant = commissionFixe !== undefined;
    const lignes = commissionFixe ?? commissionsfixe ?? [];

    // Tant que la lecture tourne ou a echoue, la longueur de `lignes` ne dit rien de la
    // page : elle vaut zero parce qu'on ne sait pas, pas parce qu'il n'y a rien.
    const compteConnu = piloteParAppelant || (!isLoading && !isError);
    // Le service ne renvoie pas de total : la derniere page est celle qui n'est pas
    // pleine. C'est la seule chose qu'on sache honnetement, et elle suffit a savoir si
    // « Suivant » mene quelque part.
    const dernierePage = lignes.length < filters.limit;

    return (
        <Card className="my-6">
            <Card.Header className="flex-row flex-wrap items-end justify-between gap-3">
                <Card.Title className="text-base">Liste des commissions fixes</Card.Title>
                <div className="flex flex-wrap items-end gap-2 text-sm font-normal">
                    <FilterPeriode />
                    <FilterRestaurant />
                </div>
            </Card.Header>

            <Card.Content className="p-0">
                <TableauResponsive
                    cleLigne={(ligne) => ligne.id || ligne.commandeId}
                    colonnes={colonnes}
                    enChargement={!piloteParAppelant && isLoading}
                    erreur={!piloteParAppelant && isError}
                    libelle="Commissions fixes"
                    lignes={lignes}
                    quoi="les commissions fixes"
                    vide="Aucune commission fixe"
                />
            </Card.Content>

            <Card.Footer className="flex items-center justify-between gap-3 border-t border-separator">
                {/*
                  * Le compteur annoncait « Affichage de 1 a N sur N » avec le MEME nombre
                  * des deux cotes : la longueur de la page courante presentee comme le
                  * total. C'etait faux des la deuxieme page. Le service ne renvoie pas de
                  * total, donc on dit ce qu'on sait.
                  */}
                <p className="text-sm text-muted">
                    Page <span className="tabular-nums">{filters.page}</span>
                    {compteConnu ? (
                        <>
                            , <span className="tabular-nums">{lignes.length}</span> commission
                            {lignes.length > 1 ? 's' : ''} affichée{lignes.length > 1 ? 's' : ''}
                        </>
                    ) : null}
                </p>
                {/*
                  * Les deux boutons n'avaient AUCUN gestionnaire : ils s'affichaient, se
                  * survolaient, s'enfoncaient, et la page ne changeait jamais. « Precedent »
                  * etait grise en dur, ce qui laissait croire a une pagination reelle
                  * bloquee au debut.
                  */}
                <div className="flex gap-2">
                    <Button
                        isDisabled={filters.page <= 1}
                        onPress={() => handlePageChange(filters.page - 1)}
                        size="sm"
                        variant="outline"
                    >
                        Précédent
                    </Button>
                    <Button
                        isDisabled={!compteConnu || dernierePage}
                        onPress={() => handlePageChange(filters.page + 1)}
                        size="sm"
                        variant="outline"
                    >
                        Suivant
                    </Button>
                </div>
            </Card.Footer>
        </Card>
    );
}
