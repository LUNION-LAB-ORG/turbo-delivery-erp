'use client';

import { Download } from 'lucide-react';
import { useEffect, useId } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  ChampDate,
  ChampEnveloppe,
  ChampListe,
  ChampMontant,
} from '@/components/commons/champs-formulaire';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import { useRestaurantFactures } from '@/features/recouvrements/hooks/use-restaurant-factures';
import { IFacture } from '@/features/revenus/types/recouvrement/prets.types';

interface RecouvrementFormProps {
  disableRestaurant?: boolean;
  factures: IFacture[];
  form: UseFormReturn<any>;
  /** En mode édition, la preuve n'est pas obligatoire */
  isEdit?: boolean;
  onDateChange: (date?: Date) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** URL de la preuve existante (pour le lien de téléchargement en mode édition) */
  preuveExistanteUrl?: string;
  selectedDate: Date;
  selectedFileName?: string;
}

/*
 * Le formulaire porte une DATE, le champ partage porte un texte `yyyy-MM-dd`. La conversion
 * se fait par morceaux et non par `toISOString()`, qui bascule en UTC : une date saisie en
 * fin de journee y recule d'un jour selon le fuseau.
 */
const enTexte = (date?: Date) => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mois}-${jour}`;
};

const enDate = (valeur: string) => {
  if (!valeur) return undefined;
  const [annee, mois, jour] = valeur.split('-').map(Number);
  if (!annee || !mois || !jour) return undefined;
  return new Date(annee, mois - 1, jour);
};

export function RecouvrementForm({
  disableRestaurant = false,
  form,
  isEdit = false,
  onDateChange,
  onFileChange,
  preuveExistanteUrl,
  selectedDate,
  selectedFileName,
}: RecouvrementFormProps) {
  const {
    formState: { errors },
    setValue,
    watch,
  } = form;

  const idFichier = useId();
  const watchedRestaurantId = watch('restaurantId');
  const watchedFactureId = watch('factureId');
  const watchedMontant = watch('montant');

  const erreur = (champ: string) => {
    const message = errors[champ]?.message;
    return message ? String(message) : undefined;
  };

  const {
    factureOptions,
    factures: restaurantFactures,
    isLoading: isFacturesLoading,
    // `isError` etait expose par le hook et jamais lu ici. Les deux consequences
    // ci-dessous en decoulaient.
    isError: isFacturesError,
  } = useRestaurantFactures({
    restaurantId: watchedRestaurantId || undefined,
  });

  useEffect(() => {
    if (!watchedFactureId) return;
    // Garde-fou sur l'ECHEC. Sur panne, `factureOptions` est vide, donc `exists` valait
    // faux, donc ce nettoyage EFFACAIT la facture deja choisie : en modification, l'agent
    // voyait le champ se vider tout seul et perdait le lien vers la facture qu'il etait en
    // train de recouvrer. Une liste illisible n'est pas une liste vide.
    if (isFacturesError) return;
    const exists = factureOptions.some((option) => option.value === watchedFactureId);
    if (!exists) {
      setValue('factureId', '', { shouldValidate: true });
    }
  }, [factureOptions, watchedFactureId, setValue, isFacturesError]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/*
         * Le libelle etait un `<Label>` de shadcn sans `htmlFor`, pose a cote d'un
         * `ComboBox` : il ne designait rien, donc le lecteur d'ecran annoncait un champ
         * sans nom et le clic sur le mot ne donnait pas le focus. `ChampEnveloppe` porte
         * le libelle ET le message d'erreur.
         */}
        <ChampEnveloppe erreur={erreur('restaurantId')} label="Restaurant *">
          <RestaurantSelect
            className="w-full"
            isDisabled={disableRestaurant}
            onChange={(value) => {
              setValue('restaurantId', value || '', { shouldValidate: true });
              setValue('factureId', '', { shouldValidate: true });
            }}
            placeholder="Sélectionnez un restaurant"
            value={watchedRestaurantId}
          />
        </ChampEnveloppe>

        {/*
         * Le message d'absence est conserve TEL QUEL, et c'est le point important :
         * « Aucune facture disponible » est une affirmation, et sur un echec de lecture
         * elle est fausse. L'agent en conclurait qu'il n'y a plus rien a recouvrer et
         * n'enregistrerait pas l'encaissement.
         */}
        <ChampListe
          erreur={erreur('factureId')}
          estDesactive={!watchedRestaurantId || isFacturesLoading}
          label="Facture *"
          messageListeVide={
            isFacturesError
              ? "La liste des factures n'a pas pu être lue, réessayez"
              : watchedRestaurantId
                ? 'Aucune facture disponible pour ce restaurant'
                : 'Sélectionnez un restaurant'
          }
          onChange={(valeur) => {
            setValue('factureId', valeur, { shouldValidate: true });
            if (!valeur) return;
            const facture = restaurantFactures.find((f) => f.id === valeur);
            if (facture) {
              setValue('montant', facture.restant ?? 0, { shouldDirty: true, shouldValidate: true });
            }
          }}
          options={factureOptions}
          placeholder={
            watchedRestaurantId ? 'Sélectionnez une facture' : "Sélectionnez un restaurant d'abord"
          }
          valeur={watchedFactureId ?? ''}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/*
         * Le montant etait un `<input type="number">` nu : ni chasse tabulaire, ni
         * separateur de milliers, et rien ne disait la devise. C'est un montant d'argent
         * que l'agent recopie d'un bordereau, il se relit chiffre par chiffre.
         */}
        <ChampMontant
          aide="En FCFA"
          erreur={erreur('montant')}
          label="Montant *"
          onChange={(v) => setValue('montant', Number.isNaN(v) ? 0 : v, { shouldValidate: true })}
          valeur={watchedMontant}
        />

        <ChampDate
          erreur={erreur('dateRecouvrement')}
          label="Date *"
          onChange={(v) => onDateChange(enDate(v))}
          valeur={enTexte(selectedDate)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor={idFichier}>
          Preuve {isEdit ? '(laisser vide pour conserver)' : '*'}
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {/*
           * Le telechargement de la preuve deja enregistree etait un `<button>` appelant
           * `window.open` : impossible de le ctrl-cliquer, de copier son adresse ou de voir
           * la destination au survol. C'est un lien, il en a maintenant la forme.
           */}
          {isEdit && preuveExistanteUrl && (
            <a
              className="button button--sm button--outline shrink-0"
              href={preuveExistanteUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Download aria-hidden="true" className="size-4" />
              <span>Preuve actuelle</span>
            </a>
          )}

          <input
            accept="image/*,application/pdf"
            className="min-w-0 flex-1 rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-surface-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground"
            id={idFichier}
            onChange={onFileChange}
            type="file"
          />
        </div>

        {/* La taille maximale n'etait ecrite NULLE PART avant le refus : on choisissait un
            fichier, on envoyait, et on lisait « ne doit pas depasser 5MB » au retour. */}
        <span className="text-xs text-muted">Image ou PDF, 5 Mo maximum.</span>

        {selectedFileName && (
          <span className="text-xs text-muted">Fichier sélectionné : {selectedFileName}</span>
        )}
        {erreur('preuve') && <span className="text-xs text-danger">{erreur('preuve')}</span>}
      </div>
    </div>
  );
}
