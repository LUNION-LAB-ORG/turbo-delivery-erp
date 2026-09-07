'use client';

import { ComboBox, Input, Label, ListBox } from '@heroui-v3/react';
import { useMemo } from 'react';

import { useDeliveryFeesByRestaurantQuery } from '@/features/price-list/queries/price-list.query';
import type { Ticket } from '@/types/bon-livraison.model';
import type { DeliveryFee } from '@/types/delivery-fee.model';

/**
 * Le choix de zone d'une ligne en cours de saisie.
 *
 * <p>Choisir une zone ne renseigne pas qu'un libelle : la grille tarifaire du partenaire
 * porte le prix de livraison ET la commission de cette zone. Les trois valeurs sont donc
 * posees ensemble, comme le faisait l'ecran d'origine.</p>
 *
 * <h3>Ce qui change par rapport au selecteur precedent</h3>
 * <p>Il allait chercher la grille dans un `useEffect` monte par LIGNE : douze lignes
 * declenchaient douze appels reseau pour la meme grille, a chaque re-rendu du tableau.
 * La requete passe desormais par le cache de TanStack, deja present dans le projet, avec
 * une cle par restaurant — une seule lecture, partagee par toutes les lignes.</p>
 */

interface SelecteurZoneProps {
    /** Placement dans la grille du parent : un enfant de grille porte son propre span. */
    className?: string;
    /**
     * Afficher « Zone » au-dessus du champ.
     *
     * <p>Vrai dans les formulaires — carte mobile, plan de saisie — ou tous les champs
     * voisins portent le leur. FAUX dans le tableau : l'en-tete de colonne dit deja
     * « Zone », et le libelle en double ajoutait une ligne a cette seule cellule, qui
     * poussait son champ vers le bas et desalignait toute la rangee.</p>
     */
    libelleVisible?: boolean;
    onPatch: (id: string, patch: Partial<Ticket>) => void;
    restaurantId: string;
    ticketId: string;
    zoneId?: string;
}

export function SelecteurZone({
    className,
    libelleVisible = true,
    onPatch,
    restaurantId,
    ticketId,
    zoneId,
}: SelecteurZoneProps) {
    const { data, isPending, isError } = useDeliveryFeesByRestaurantQuery(restaurantId || null, 0, 100);

    const zones: DeliveryFee[] = useMemo(() => data?.content ?? [], [data]);
    const options = useMemo(
        () => zones.map((z) => ({ value: z.id ?? '', label: z.name ?? `Zone ${z.id}` })),
        [zones],
    );

    const choisir = (cle: string) => {
        const zone = zones.find((z) => z.id === cle);
        if (!zone) return;
        /*
         * La zone pose le PRIX DE LIVRAISON, pas la commission.
         *
         * <p>Elle ecrivait aussi `coutLivraison` depuis `zone.commission`, alors que
         * `applyTicketPatch` reecrit ce meme champ avec le taux du PARTENAIRE des que le
         * montant de commande change. Deux sources, une seule case, et rien pour
         * arbitrer : selon qu'on choisissait la zone avant ou apres le montant, deux
         * operateurs voyaient deux commissions differentes sur la meme ligne.</p>
         *
         * <p>Le serveur tranche deja : `createBonLivraison` recalcule la commission
         * depuis le partenaire et ecrase les deux champs avant d'envoyer. Ce que la zone
         * affichait n'etait donc jamais enregistre. L'ecran cesse de l'annoncer.</p>
         */
        onPatch(ticketId, {
            zoneId: zone.id,
            nomZone: zone.name ?? '',
            montantLivraison: String(zone.prix ?? 0),
        });
    };

    /*
     * Ce qui ferme le champ, c'est l'ABSENCE DE ZONES, pas un drapeau d'erreur.
     *
     * <p>Une premiere version fermait sur `isError`. Or une lecture peut echouer puis etre
     * servie par le cache : le champ restait alors barre alors que les zones etaient la,
     * sous les yeux. L'echec ne compte que s'il ne laisse rien.</p>
     */
    const indisponible = !restaurantId || (options.length === 0 && !isPending);

    // Le message d'attente porte l'etat de la grille : sans partenaire il n'y a rien a
    // chercher, et une grille absente ne doit pas se confondre avec une grille vide.
    const invite = !restaurantId
        ? 'Partenaire d’abord'
        : isPending && options.length === 0
          ? 'Chargement…'
          : options.length === 0
            ? isError
                ? 'Grille indisponible'
                : 'Aucune zone'
            : 'Rechercher une zone…';

    return (
        <ComboBox
            // Le libelle cache reste un NOM : sans lui le champ n'est plus annonce du
            // tout, et l'en-tete de colonne ne suffit pas a un lecteur d'ecran.
            aria-label={libelleVisible ? undefined : 'Zone'}
            className={className}
            isDisabled={indisponible}
            onSelectionChange={(c) => choisir(String(c ?? ''))}
            selectedKey={zoneId || null}
        >
            {libelleVisible ? <Label>Zone</Label> : null}
            <ComboBox.InputGroup>
                <Input placeholder={invite} />
                <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
                <ListBox items={options}>
                    {(o: { value: string; label: string }) => (
                        <ListBox.Item id={o.value} textValue={o.label}>
                            {o.label}
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    )}
                </ListBox>
            </ComboBox.Popover>
        </ComboBox>
    );
}
