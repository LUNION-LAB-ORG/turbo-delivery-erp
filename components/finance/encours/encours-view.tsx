'use client';

import { useRef } from 'react';
import { useQueryStates } from 'nuqs';
import { Alert, Button, Spinner } from '@heroui-v3/react';

import {
  encoursFilters,
  useEncoursQuery,
  useEncoursGroupesQuery,
  IEncoursReleve,
} from '@/features/encours';

import { EncoursKpiCards } from './encours-kpi-cards';
import { EncoursFiltres } from './encours-filtres';
import { EncoursSectionsTabs } from './encours-sections-tabs';
import { EncoursDeductionsManager } from './encours-deductions-manager';
import { EncoursExportButton } from './encours-export-button';
import { EncoursExportDusButton } from './encours-export-dus-button';
import { useHauteurReleve } from './encours-hauteur';

/**
 * Encours - restes a payer.
 *
 * <h3>Ce que l'ecran repond, dans l'ordre ou l'operateur le demande</h3>
 * <p>Il ouvre cette page pour relancer des partenaires. Il lui faut donc, du haut vers le
 * bas : ce qui reste du et ce qui est en retard, puis le releve ligne a ligne, qui est le
 * geste lui-meme. Le reste - la saisonnalite, le classement des partenaires, le registre
 * des avances - se lit, mais apres.</p>
 *
 * <p>« Apres » etait ecrit ici en empilement : quatre blocs a la suite, 1 400 px sur une
 * fenetre de 563. Ce n'est plus une hierarchie, c'est une file d'attente au defilement.
 * Les trois sections passent sous des onglets (`encours-sections-tabs`), qui les mettent a
 * une distance EGALE d'un clic au lieu de les ranger par ordre de fatigue. Ce qui est
 * commun aux trois - le bandeau de chiffres, la barre de filtres, les exports, l'alerte de
 * lecture - reste au-dessus.</p>
 *
 * <p>La barre de filtres est un composant a part (`encours-filtres`), avec l'explication
 * du bloc blanc qu'elle formait ; elle est ainsi montable sur le banc d'apercu.</p>
 */
export function EncoursView() {
  const [filters, setFilters] = useQueryStates(encoursFilters.filter, encoursFilters.option);

  const params = {
    annee: filters.annee,
    mois: filters.mois ? Number(filters.mois) : null,
    cycle: filters.cycle || null,
    partenaire: filters.partenaire || null,
    stores: filters.stores ?? [],
  };

  const { data: releve, isError, isFetching, isLoading, refetch } = useEncoursQuery(params);
  const { data: groupes } = useEncoursGroupesQuery();

  /*
   * Le releve precedent reste a l'ecran pendant qu'on en charge un autre.
   *
   * <p>Chaque changement de filtre cree une nouvelle cle de requete : sans cela, l'ecran
   * se vidait entierement et un spinner remplacait le tableau a chaque clic, y compris
   * pour passer de « Mars » a « Avril ». La requete est partagee (`features/encours`) et
   * n'est pas de ce perimetre ; le report se fait donc ici, et l'attente se dit par un
   * indicateur discret au lieu d'un ecran blanc.</p>
   */
  const dernierReleve = useRef<IEncoursReleve | undefined>(undefined);
  if (releve) dernierReleve.current = releve;
  const affiche = releve ?? dernierReleve.current;

  /*
   * En ECHEC, ce report devient un piege : `isLoading` vaut faux (TanStack : isPending &&
   * isFetching), donc `affiche` retombe sur le releve precedent et l'operateur lit une
   * alerte rouge avec, juste dessous, des montants complets qui appartiennent au filtre
   * d'AVANT. Rien n'est retire de l'ecran - un montant deja lu n'a pas a disparaitre -
   * mais il est DIT a quoi il appartient, et les deux exports sont neutralises : un PDF
   * porterait l'entete du filtre demande sur les chiffres de l'ancien.
   */
  const relevePerime = isError && Boolean(affiche);

  // La hauteur du releve se mesure jusqu'au PLI. Les graphiques et le registre ne sont
  // plus des freres suivants - ils sont sous leurs propres onglets - donc rien a
  // soustraire : le cadre s'arrete au bas de la fenetre. `zoneReleve` est une
  // reference-FONCTION parce que le panneau du releve se demonte quand un autre onglet
  // s'ouvre. Voir `encours-hauteur`.
  const { hauteur: hauteurReleve, zoneReleve } = useHauteurReleve();

  return (
    <div className="flex flex-col gap-2.5 p-3 sm:p-4">
      {/*
       * Le titre et les gestes sur UNE ligne, la phrase de definition en dessous.
       * Empilee sous le titre, elle mesure 480 px : elle poussait les trois boutons sur
       * une ligne a eux, soit 40 px pris au releve sur une fenetre qui en fait 563.
       */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className="text-lg font-semibold leading-tight text-foreground">
          Encours, restes à payer
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {isFetching && affiche ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Spinner size="sm" /> Mise à jour…
            </span>
          ) : null}
          <EncoursDeductionsManager annee={filters.annee} />
          <EncoursExportDusButton
            isDisabled={isLoading || relevePerime}
            params={params}
            releve={affiche}
          />
          <EncoursExportButton
            isDisabled={!affiche || isLoading || relevePerime}
            params={params}
          />
        </div>
      </div>

      <p className="-mt-1 text-xs text-muted">
        Factures éditées non encore recouvrées, détail par facture (mois / quinzaine / semaine)
      </p>

      <EncoursFiltres groupes={groupes ?? []} onChange={setFilters} valeurs={filters} />

      {isLoading && !affiche && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Spinner size="sm" /> Chargement du relevé…
        </div>
      )}

      {/*
       * L'echec n'offrait aucune reprise : il fallait recharger la page entiere pour
       * retenter une lecture. L'alerte est collee au bandeau qu'elle qualifie, et dit
       * elle-meme ce que sont les montants restes a l'ecran.
       */}
      {isError && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {relevePerime
                ? 'Le relevé n’a pas pu être lu. Les montants ci-dessous sont ceux de la dernière lecture réussie, pas ceux du filtre demandé ; les exports sont suspendus.'
                : 'Le relevé n’a pas pu être lu.'}
            </Alert.Description>
          </Alert.Content>
          <Button isPending={isFetching} onPress={() => void refetch()} size="sm" variant="outline">
            Réessayer
          </Button>
        </Alert>
      )}

      {affiche && <EncoursKpiCards releve={affiche} />}

      {/*
       * Les trois sections. La barre d'onglets est montee meme sans releve : c'est elle
       * qui porte l'enveloppe mesuree du cadre de defilement, et cette enveloppe doit
       * exister au premier rendu (voir `encours-sections-tabs`).
       */}
      <EncoursSectionsTabs hauteur={hauteurReleve} releve={affiche} zoneReleve={zoneReleve} />
    </div>
  );
}
