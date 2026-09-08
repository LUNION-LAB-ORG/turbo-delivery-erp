'use client';

import { Button, Card } from '@heroui-v3/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    TableauResponsive,
    type ColonneResponsive,
} from '@/components/commons/TableauResponsive';
import { ICommission } from '@/features/revenus/types/commission.types';
import { formatMontant } from '@/utils/format.utils';

import {
    CommissionVariableDetailModal,
    formatTauxCommission,
} from './commission-pourcentage-detail-modal';
import CommissionDateFilter from './filtres/commission-date-filter';
import FilterRestaurantComponent from './filtres/commission-restaurant-filter';
import { Pagination } from './pagination';

interface CommissionVariableListProps {
    commissionvariable?: ICommission[];
    /**
     * La lecture a echoue.
     *
     * <p>Sans cet etat, un echec d'API se lit exactement comme « aucune commission », et
     * le comptable en conclut qu'il n'y a rien a encaisser. L'ecran appelant dispose deja
     * de `isError`, il ne le passait qu'aux cartes de statistiques.</p>
     */
    isError?: boolean;
    isLoading?: boolean;
}

/** La date d'une commission, a la minute : deux commissions du meme jour se distinguent. */
function formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
        return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch {
        return dateString;
    }
}

/**
 * Le journal des commissions en pourcentage.
 *
 * <h3>Ce qui change</h3>
 * <p>L'ecran portait DEUX rendus de la meme donnee, ecrits a la main l'un sous l'autre :
 * un `Table` de shadcn cache en dessous de `md`, et une liste de cartes cachee au-dessus.
 * Les deux avaient diverge. La carte tactile n'affichait PAS la date — un tiret occupait
 * sa place — et son bouton « Details » etait un `<button>` sans `onClick` : il s'affichait,
 * se survolait, s'enfoncait, et n'ouvrait rien. Les colonnes sont declarees une fois dans
 * `TableauResponsive`, qui rend le tableau sur poste et les cartes au doigt.</p>
 *
 * <p>Le FILTRE PAR DATE ne filtrait rien. Le champ ecrivait dans `filters.createdAt` et le
 * tri lisait `filters.dateDepense`, un nom herite du module des depenses qu'aucun filtre
 * n'alimentait. Choisir une date ne changeait donc rien a l'ecran. Le filtre sur le
 * montant etait mort de la meme facon, sans champ pour l'alimenter : il est retire.</p>
 *
 * <p>La ligne d'en-tete etait peinte en ROUGE DE MARQUE, sur `bg-red-500` double d'un
 * `bg-accent` par colonne. Le rouge de l'ERP annonce un geste ; un en-tete de colonne
 * n'en appelle aucun.</p>
 *
 * <p>Les montants etaient CENTRES et rendus bruts — « 12500 XOF » — sans separateur de
 * milliers, en chasse proportionnelle, et avec un suffixe qui n'est pas celui du reste de
 * l'ERP. Sur un ecran d'argent, deux nombres qu'on ne peut pas aligner ne se comparent
 * pas : ils sont a droite, en chasse tabulaire, passes par `formatMontant`.</p>
 *
 * <p>Le taux « 10% » etait ecrit EN DUR sur chaque ligne. Voir `formatTauxCommission` : il
 * se deduit desormais de la ligne.</p>
 *
 * <p>La fiche de detail vivait dans un menu deroulant a UNE entree, et cette entree
 * contenait un bouton. Le geste est direct.</p>
 */
export default function CommissionPourcentageList({
    commissionvariable,
    isError = false,
    isLoading = false,
}: CommissionVariableListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filtres, setFiltres] = useState({ createdAt: '', nomRestaurant: '' });
    const [detail, setDetail] = useState<ICommission | null>(null);

    const handleFilterChange = (nom: string, valeur: string) => {
        setFiltres((prec) => ({ ...prec, [nom]: valeur }));
        setCurrentPage(1);
    };

    const commissionsFiltrees = useMemo(() => {
        return (commissionvariable ?? []).filter((ligne) => {
            if (filtres.nomRestaurant && ligne.nomRestaurant !== filtres.nomRestaurant) return false;
            if (filtres.createdAt) {
                const jour = new Date(ligne.createdAt).toISOString().slice(0, 10);
                if (jour !== filtres.createdAt) return false;
            }
            return true;
        });
    }, [commissionvariable, filtres]);

    const totalPages = Math.ceil(commissionsFiltrees.length / itemsPerPage);
    const debut = (currentPage - 1) * itemsPerPage;
    const lignes = commissionsFiltrees.slice(debut, debut + itemsPerPage);

    const colonnes: ColonneResponsive<ICommission>[] = [
        { cle: 'date', libelle: 'Date', rendu: (l) => formatDate(l.createdAt) },
        {
            cle: 'restaurant',
            identite: true,
            libelle: 'Restaurant',
            rendu: (l) => (
                <span className="text-sm font-semibold text-foreground">{l.nomRestaurant}</span>
            ),
        },
        // La localisation etait posee dans une pastille arrondie SANS fond : le dessin
        // d'une etiquette, sans l'etiquette. Un lieu informe, il ne se colorie pas.
        { cle: 'localisation', libelle: 'Localisation', rendu: (l) => l.localisation },
        {
            cle: 'commande',
            libelle: 'Montant commande',
            nombre: true,
            rendu: (l) => formatMontant(l.totalAmount),
        },
        { cle: 'taux', libelle: 'Taux', nombre: true, rendu: (l) => formatTauxCommission(l) },
        {
            cle: 'commission',
            libelle: 'Commission',
            nombre: true,
            rendu: (l) => (
                <span className="font-semibold text-foreground">{formatMontant(l.commission)}</span>
            ),
        },
        {
            actions: true,
            cle: 'actions',
            libelle: 'Actions',
            rendu: (l) => (
                <Button onPress={() => setDetail(l)} size="sm" variant="ghost">
                    <Eye aria-hidden="true" className="size-4" />
                    Voir détails
                </Button>
            ),
        },
    ];

    return (
        <Card className="my-6">
            <Card.Header className="flex-col items-stretch gap-3 md:flex-row md:items-end md:justify-between">
                <Card.Title className="text-base">Liste des commissions en pourcentage</Card.Title>
                {/* Les filtres etaient a l'INTERIEUR du titre, donc dans un element de
                    titre : un lecteur d'ecran annoncait le contenu des deux listes
                    deroulantes comme faisant partie de l'intitule de la section. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:w-auto">
                    <div className="w-full sm:w-52">
                        <CommissionDateFilter onFilterChange={handleFilterChange} />
                    </div>
                    <div className="w-full sm:w-60">
                        <FilterRestaurantComponent
                            commissions={commissionvariable}
                            onFilterChange={handleFilterChange}
                        />
                    </div>
                </div>
            </Card.Header>

            <Card.Content className="p-0">
                <TableauResponsive
                    cleLigne={(l) => String(l.id ?? l.commandeId)}
                    colonnes={colonnes}
                    enChargement={isLoading}
                    erreur={isError}
                    libelle="Commissions en pourcentage"
                    lignes={lignes}
                    quoi="les commissions"
                    vide="Aucune commission pour ces filtres"
                />

                <Pagination
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(taille) => {
                        setItemsPerPage(taille);
                        setCurrentPage(1);
                    }}
                    onPageChange={setCurrentPage}
                    quoi="commissions"
                    totalItems={commissionsFiltrees.length}
                    totalPages={totalPages}
                />
            </Card.Content>

            {detail && (
                <CommissionVariableDetailModal
                    commissionVariable={detail}
                    onFermer={() => setDetail(null)}
                    ouvert
                />
            )}
        </Card>
    );
}
