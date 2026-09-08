'use client';

import { useEffect } from 'react';
import { CalendarInput } from '@/components/components-finance/block/dateInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IFacture } from '@/features/revenus/types/recouvrement/prets.types';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ChampListe } from '@/components/commons/champs-formulaire';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import { useRestaurantFactures } from '@/features/recouvrements/hooks/use-restaurant-factures';

interface RecouvrementFormProps {
  form: UseFormReturn<any>;
  factures: IFacture[];
  selectedDate: Date;
  onDateChange: (date?: Date) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFileName?: string;
  disableRestaurant?: boolean;
  /** En mode édition, la preuve n'est pas obligatoire */
  isEdit?: boolean;
  /** URL de la preuve existante (pour le bouton télécharger en mode édition) */
  preuveExistanteUrl?: string;
}

export function RecouvrementForm({ form, selectedDate, onDateChange, onFileChange, selectedFileName, disableRestaurant = false, isEdit = false, preuveExistanteUrl }: RecouvrementFormProps) {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = form;

  const watchedRestaurantId = watch('restaurantId');
  const watchedFactureId = watch('factureId');

  const {
    factures: restaurantFactures,
    factureOptions,
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
    // faux, donc ce nettoyage EFFACAIT la facture deja choisie — en modification, l'agent
    // voyait le champ se vider tout seul et perdait le lien vers la facture qu'il etait en
    // train de recouvrer. Une liste illisible n'est pas une liste vide.
    if (isFacturesError) return;
    const exists = factureOptions.some((option) => option.value === watchedFactureId);
    if (!exists) {
      setValue('factureId', '', { shouldValidate: true });
    }
  }, [factureOptions, watchedFactureId, setValue, isFacturesError]);

  return (
    <div className="space-y-4">
      {/* Sélection facture / restaurant */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Restaurant *</Label>
          <RestaurantSelect
            value={watchedRestaurantId}
            onChange={(value) => {
              const nextRestaurantId = value || '';
              setValue('restaurantId', nextRestaurantId, { shouldValidate: true });
              setValue('factureId', '', { shouldValidate: true });
            }}
            isDisabled={disableRestaurant}
            placeholder="Sélectionnez un restaurant"
            className="w-full"
          />
          {errors.restaurantId && <small className="text-red-500 text-sm">{errors.restaurantId.message as string}</small>}
        </div>

        <div>
          {/*
            * Le choix de facture passait par `react-select`, une QUATRIEME bibliotheque
            * d'interface dont les couleurs ne suivent pas le theme : en theme sombre, le
            * champ et sa liste restaient blancs. Ses trois hauteurs de 36 px etaient
            * ecrites a la main en style en ligne, hors de tout jeton.
            *
            * Le message d'absence est conserve TEL QUEL, et c'est le point important :
            * « Aucune facture disponible » est une affirmation, et sur un echec de lecture
            * elle est fausse. L'agent en conclurait qu'il n'y a plus rien a recouvrer et
            * n'enregistrerait pas l'encaissement. `ChampListe` sait desormais porter ce
            * message.
            */}
          <ChampListe
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
          {errors.factureId && <small className="text-red-500 text-sm">{errors.factureId.message as string}</small>}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Montant */}
        <div>
          <Label>Montant *</Label>
          <Input type="number" {...register('montant', { valueAsNumber: true })} />
          {errors.montant && <small className="text-red-500 text-sm">{errors.montant.message as string}</small>}
        </div>

        {/* Date */}
        <div>
          <Label>Date *</Label>
          <CalendarInput value={selectedDate} onChange={onDateChange} />
          {errors.dateRecouvrement && <small className="text-red-500 text-sm">{errors.dateRecouvrement.message as string}</small>}
        </div>
      </div>

      {/* Fichier */}
      <div>
        <Label>Preuve {isEdit ? '(laisser vide pour conserver)' : '*'}</Label>
        <div className="flex items-center gap-2">
          {/* Bouton télécharger la preuve existante — visible uniquement en mode édition */}
          {isEdit && preuveExistanteUrl && (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => window.open(preuveExistanteUrl, '_blank')}>
              <Download className="size-4" />
              <span>Preuve actuelle</span>
            </Button>
          )}
          <Input type="file" accept="image/*,application/pdf" onChange={onFileChange} className="flex-1" />
        </div>
        {selectedFileName && <small className="text-muted-foreground text-xs mt-1 block">Fichier sélectionné : {selectedFileName}</small>}
        {errors.preuve && <small className="text-red-500 text-sm">{errors.preuve.message as string}</small>}
      </div>
    </div>
  );
}
