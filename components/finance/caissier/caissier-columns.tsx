'use client';

import { Button, Chip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Clock, Landmark } from 'lucide-react';

import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import type { IFactureCaissier } from '@/features/caissier';
import { formatMontant } from '@/utils/format.utils';

/**
 * L'attente, dite d'une seule facon sur toute la chaine de recouvrement.
 *
 * <p>Les trois attentes de cet ecran portaient un CheckCircle2, le signe de ce qui est
 * FAIT, chacune dans une teinte differente : violet pour la DGA, ambre pour la
 * Direction. Un caissier lisant une coche verte a cote de « En attente DGA » en conclut
 * que la piece est passee.</p>
 */
function EnAttente({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <Clock aria-hidden="true" className="size-3.5 shrink-0" /> {children}
        </span>
    );
}

/**
 * Un nombre se compare : chasse tabulaire et alignement a droite, en-tete compris.
 *
 * <p>Le montant et le recouvre etaient alignes a GAUCHE, en chasse proportionnelle : les
 * milliers ne tombaient pas les uns sous les autres et deux lignes voisines ne se
 * lisaient pas d'un coup d'oeil. C'est la colonne la plus regardee de l'ecran.</p>
 */
function Nombre({ children }: { children: React.ReactNode }) {
    return <span className="block text-right tabular-nums">{children}</span>;
}

export function createCaissierColumns(
    onConfirmer: (facture: IFactureCaissier) => void,
    onDepotBanque: (facture: IFactureCaissier) => void,
): ColumnDef<IFactureCaissier>[] {
    return [
        {
            accessorKey: 'numero',
            /* Le numero etait peint en rouge de marque : un identifiant n'appelle aucun geste. */
            cell: ({ row }) => (
                <span className="text-xs font-medium whitespace-nowrap text-foreground">
                    {row.original.numero}
                </span>
            ),
            header: 'N° facture',
        },
        {
            accessorKey: 'partenaire',
            cell: ({ row }) => (
                <span className="text-xs font-medium text-foreground">{row.original.partenaire}</span>
            ),
            header: 'Partenaire',
        },
        {
            accessorKey: 'montant',
            cell: ({ row }) => (
                <Nombre>
                    <span className="text-xs font-bold whitespace-nowrap text-foreground">
                        {formatMontant(row.original.montant)}
                    </span>
                </Nombre>
            ),
            header: () => <Nombre>Montant</Nombre>,
        },
        {
            accessorKey: 'montantRecouvre',
            cell: ({ row }) => {
                const { montantRecouvre, pourcentageRecouvre } = row.original;
                if (!montantRecouvre) {
                    return (
                        <Nombre>
                            <span className="text-xs text-muted">—</span>
                        </Nombre>
                    );
                }
                return (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold tabular-nums whitespace-nowrap text-foreground">
                            {formatMontant(montantRecouvre)}
                        </span>
                        {/* Le vert ne dit plus « recouvre », il dit « INTEGRALEMENT recouvre » :
                            peint sur les 12 % comme sur les 100 %, il ne distinguait rien.
                            Un pourcentage absent rendait la pastille « % », sans chiffre. */}
                        {pourcentageRecouvre != null && (
                            <Chip
                                color={pourcentageRecouvre >= 100 ? 'success' : 'default'}
                                size="sm"
                                variant="soft"
                            >
                                <Chip.Label className="tabular-nums">
                                    {pourcentageRecouvre}%
                                </Chip.Label>
                            </Chip>
                        )}
                    </div>
                );
            },
            header: () => <Nombre>Recouvré</Nombre>,
        },
        {
            accessorKey: 'cycle',
            cell: ({ row }) => <span className="text-xs text-foreground">{row.original.cycle}</span>,
            header: 'Cycle',
        },
        {
            accessorKey: 'emission',
            cell: ({ row }) => (
                <span className="text-xs whitespace-nowrap text-foreground">{row.original.emission}</span>
            ),
            header: 'Émission',
        },
        {
            accessorKey: 'agent',
            cell: ({ row }) => <span className="text-xs text-muted">{row.original.agent}</span>,
            header: 'Agent',
        },
        {
            accessorKey: 'statut',
            cell: ({ row }) => <ChipStatutFacture statut={row.original.statut} />,
            header: 'Statut',
        },
        {
            /**
             * <h3>Un geste par ligne, une seule couleur</h3>
             * <p>Les trois boutons de cette colonne etaient indigo, rouge et vert selon le
             * statut : trois teintes pour un seul et meme sens : faire avancer la facture
             * d'un cran. Le rouge en particulier annoncait un danger sur « Re-soumettre »,
             * qui ne detruit rien. Ce que le statut dit est deja dit par la pastille de la
             * colonne STATUT.</p>
             */
            cell: ({ row }) => {
                const { statut } = row.original;

                if (statut === 'Versé au caissier' || statut === 'Rejeté DGA') {
                    return (
                        <Button
                            className="whitespace-nowrap"
                            onPress={() => onConfirmer(row.original)}
                            size="sm"
                            variant="primary"
                        >
                            <Landmark aria-hidden="true" className="size-3.5" />
                            {statut === 'Rejeté DGA'
                                ? 'Re-soumettre fiche de paiement'
                                : 'Enregistrer fiche de paiement'}
                        </Button>
                    );
                }
                if (statut === 'En attente visa DGA') {
                    return <EnAttente>En attente DGA</EnAttente>;
                }
                // SPEC-RECOUV-002 : apres visa, la Direction doit orienter les fonds.
                // Le depot n'est activable QUE sur « Oriente banque ».
                if (statut === 'Visé DGA') {
                    return <EnAttente>En attente orientation DG</EnAttente>;
                }
                if (statut === 'Conservé en caisse') {
                    return (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                            <Landmark aria-hidden="true" className="size-3.5 shrink-0" /> Conservé en
                            caisse
                        </span>
                    );
                }
                if (statut === 'Orienté banque') {
                    return (
                        <Button
                            className="whitespace-nowrap"
                            onPress={() => onDepotBanque(row.original)}
                            size="sm"
                            variant="primary"
                        >
                            <Landmark aria-hidden="true" className="size-3.5" />
                            Dépôt en banque
                        </Button>
                    );
                }
                if (statut === 'Clôturé') {
                    return (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                            <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0" /> Clôturé
                        </span>
                    );
                }
                return null;
            },
            header: 'Actions',
            id: 'actions',
        },
    ];
}
