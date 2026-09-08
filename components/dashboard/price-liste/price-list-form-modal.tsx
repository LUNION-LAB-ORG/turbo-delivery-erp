'use client';
import { Description, FieldError, Label, ListBox, NumberField } from '@heroui-v3/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, calculateDistance, geocodeAddressServer, placeDetails } from '@/lib/googlemaps-server';
import { DeliveryFee } from '@/types/price-list';
import { priceListSchema, PriceListFormData } from '@/features/price-list/schemas/price-list.schema';
import { useCreateDeliveryFeeMutation, useUpdatePriceListMutation } from '@/features/price-list/queries/price-list.mutation';
import { useQuery } from '@tanstack/react-query';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe, ChampMontant, ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';

type LatLng = { lat: number; lng: number };

/**
 * Un nombre a virgule.
 *
 * <p>`ChampMontant` arrondit a l'unite : c'est juste pour des francs, mais cela raboterait
 * une distance que Google rend au dixieme de kilometre, et une commission exprimee en
 * pourcentage. Tant que le champ partage n'accepte pas de decimales, celui-ci reste ici.</p>
 */
function ChampDecimal({
  aide,
  decimales = 1,
  erreur,
  label,
  max,
  onChange,
  valeur,
}: {
  aide?: string;
  decimales?: number;
  erreur?: string;
  label: string;
  max?: number;
  onChange: (v: number) => void;
  valeur: number | undefined;
}) {
  return (
    <NumberField
      formatOptions={{ maximumFractionDigits: decimales }}
      isInvalid={Boolean(erreur)}
      maxValue={max}
      minValue={0}
      onChange={onChange}
      value={valeur ?? Number.NaN}
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {aide && !erreur && <Description>{aide}</Description>}
      {erreur && <FieldError>{erreur}</FieldError>}
    </NumberField>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: DeliveryFee | null;
}

export default function PriceListFormModal({ open, onClose, mode, initialData }: Props) {
  const createMutation = useCreateDeliveryFeeMutation();
  const updateMutation = useUpdatePriceListMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const isEdit = mode === 'edit';

  // getAllRestaurants relance desormais. Le tableau vide rendait le formulaire menteur:
  // en creation le selecteur de restaurant n'avait aucune option donc rien n'etait
  // enregistrable, et en modification typeCommission restait nul, ce qui faisait
  // disparaitre les champs Commission et Seuil comme s'ils n'existaient pas.
  const {
    data: allRestaurants = [],
    isError: isRestaurantsError,
    isFetching: isRestaurantsFetching,
    refetch: refetchRestaurants,
  } = useQuery({
    queryKey: ['restaurants', 'all'],
    queryFn: () => getAllRestaurants(),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<PriceListFormData>({
    resolver: zodResolver(priceListSchema),
    defaultValues: buildDefaults(initialData),
  });

  const { control, handleSubmit, setValue, reset, watch } = form;

  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(initialData));
    setSuggestions([]);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedRestaurantId = watch('restaurantId');
  const watchedLat = watch('latitude');
  const watchedLng = watch('longitude');
  const currentRestaurant = allRestaurants.find((r) => r.id === watchedRestaurantId);
  const typeCommission = currentRestaurant?.typeCommission ?? null;
  // Coordinates can live at root level or inside `position` depending on the restaurant
  const restaurantLat = currentRestaurant?.latitude ?? currentRestaurant?.position?.latitude ?? 0;
  const restaurantLng = currentRestaurant?.longitude ?? currentRestaurant?.position?.longitude ?? 0;
  const restaurantHasCoords = !!restaurantLat && !!restaurantLng;
  const restaurantPoint: LatLng = { lat: restaurantLat, lng: restaurantLng };

  const enPourcentage = typeCommission === 'POURCENTAGE';
  const commissionLabel = enPourcentage ? 'Commission (%) *' : 'Commission (XOF) *';

  const optionsRestaurants = allRestaurants
    .slice()
    .sort((a, b) => a.nomEtablissement.localeCompare(b.nomEtablissement))
    .map((r) => ({ label: r.nomEtablissement, value: r.id }));

  // Recalculate distance when restaurant changes after zone is already selected
  useEffect(() => {
    if (isEdit) return;
    if (!watchedLat || !watchedLng) return;
    const getOrigin = async (): Promise<LatLng | null> => {
      if (restaurantHasCoords) return restaurantPoint;
      if (currentRestaurant?.localisation) return geocodeAddressServer(currentRestaurant.localisation);
      return null;
    };
    getOrigin()
      .then((origin) => origin && calculateDistance(origin, { lat: watchedLat, lng: watchedLng }))
      .then((distance) => { if (distance) setValue('distanceFin', distance); })
      .catch(() => {});
  }, [watchedRestaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleZoneChange = useCallback(
    async (value: string) => {
      if (value.length > 2 && !loadingGeo) {
        try {
          setSuggestions(await autocomplete(value));
        } catch {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    },
    [loadingGeo],
  );

  const handleSuggestionClick = async (suggestion: PlaceAutocompleteResult) => {
    setLoadingGeo(true);
    setValue('zone', suggestion.description, { shouldValidate: true });
    setSuggestions([]);
    try {
      const details = await placeDetails(suggestion.place_id);
      const lat = details.result.geometry?.location.lat ?? 0;
      const lng = details.result.geometry?.location.lng ?? 0;
      setValue('latitude', lat);
      setValue('longitude', lng);
      let origin = restaurantHasCoords ? restaurantPoint : null;
      if (!origin && currentRestaurant?.localisation) {
        origin = await geocodeAddressServer(currentRestaurant.localisation);
      }
      if (origin) {
        const distance = await calculateDistance(origin, { lat, lng });
        setValue('distanceFin', distance ?? 0);
      }
    } catch {
      // echec silencieux : la distance reste saisissable a la main
    } finally {
      setLoadingGeo(false);
    }
  };

  const onSubmit = (data: PriceListFormData) => {
    if (isEdit) {
      updateMutation.mutate(data, { onSuccess: () => onClose() });
    } else {
      createMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  const onError = (errors: Record<string, unknown>) => {
    console.error('Validation errors:', errors);
  };

  const envoyer = handleSubmit(onSubmit, onError);

  return (
    /*
     * C'etait une coquille de `Dialog` shadcn, avec son propre pied de boutons a
     * l'interieur du formulaire. `FenetreAction` porte le titre, le retrait et le geste :
     * l'attente et le libelle destructif y sont dits une fois pour tout l'ERP.
     * Le geste est retire tant que la liste des restaurants n'a pas pu etre lue : sans
     * elle, rien de saisi n'est enregistrable.
     */
    <FenetreAction
      enAttente={isPending}
      libelleAction={isRestaurantsError ? undefined : isEdit ? 'Modifier' : 'Ajouter'}
      onAction={() => envoyer()}
      onFermer={onClose}
      ouvert={open}
      titre={isEdit ? 'Modifier un frais de livraison' : 'Ajouter un frais de livraison'}
    >
      {/* On remplace le formulaire entier plutot que le seul selecteur: sans la liste
          des restaurants, les champs restants sont muets ou absents et une saisie
          terminee ne pourrait pas etre enregistree. */}
      {isRestaurantsError ? (
        <EtatErreur
          quoi="la liste des restaurants"
          onReessayer={() => refetchRestaurants()}
          enCours={isRestaurantsFetching}
        />
      ) : (
        <form
          className="flex flex-col gap-4"
          id="price-list-form"
          onSubmit={(e) => {
            e.preventDefault();
            envoyer();
          }}
        >
          {/* Nom + restaurant (creation) | nom seul (modification).
              L'asterisque du champ obligatoire vit dans le libelle : les champs partages
              n'exposent pas encore `estRequis`. */}
          <div className={isEdit ? '' : 'grid gap-3 sm:grid-cols-2'}>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <ChampTexte
                  erreur={fieldState.error?.message}
                  label="Nom *"
                  onChange={field.onChange}
                  placeholder="Nom du frais"
                  valeur={field.value ?? ''}
                />
              )}
            />

            {!isEdit && (
              <Controller
                name="restaurantId"
                control={control}
                render={({ field, fieldState }) => (
                  /*
                   * C'etait un `<select>` natif habille a la main. La liste porte plusieurs
                   * centaines d'etablissements : on la CHERCHE, on ne la deroule pas.
                   */
                  <ChampListe
                    erreur={fieldState.error?.message}
                    estDesactive={isRestaurantsFetching && optionsRestaurants.length === 0}
                    label="Restaurant *"
                    messageListeVide={
                      isRestaurantsFetching ? 'Lecture en cours…' : 'Aucun restaurant'
                    }
                    onChange={field.onChange}
                    options={optionsRestaurants}
                    placeholder="Rechercher un restaurant"
                    valeur={field.value ?? ''}
                  />
                )}
              />
            )}
            {isEdit && (
              <Controller
                name="restaurantId"
                control={control}
                render={({ field }) => <input type="hidden" {...field} />}
              />
            )}
          </div>

          {/* Zone avec autocomplete Google Maps */}
          <Controller
            name="zone"
            control={control}
            render={({ field, fieldState }) => (
              <div className="relative">
                <ChampTexte
                  erreur={fieldState.error?.message}
                  label="Zone *"
                  onChange={(v) => {
                    field.onChange(v);
                    handleZoneChange(v);
                  }}
                  placeholder="Entrez une adresse"
                  valeur={field.value ?? ''}
                />
                {/*
                 * Chaque proposition etait un `<li onClick>` : ni focalisable, ni activable
                 * au clavier, et rien n'annoncait a un lecteur d'ecran qu'une liste venait
                 * d'apparaitre sous le champ. La `ListBox` de la v3 se parcourt aux
                 * fleches, s'active a Entree, et se dit.
                 */}
                {!loadingGeo && suggestions.length > 0 && (
                  <ListBox
                    aria-label="Adresses proposées"
                    className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-separator bg-surface shadow-lg"
                    items={suggestions.map((s) => ({ id: s.place_id, label: s.description }))}
                    onAction={(cle) => {
                      const choix = suggestions.find((s) => s.place_id === cle);
                      if (choix) handleSuggestionClick(choix);
                    }}
                  >
                    {(o: { id: string; label: string }) => (
                      <ListBox.Item id={o.id} textValue={o.label}>
                        {o.label}
                      </ListBox.Item>
                    )}
                  </ListBox>
                )}
              </div>
            )}
          />

          {/* Champs cachés */}
          <Controller control={control} name="latitude" render={({ field }) => <input type="hidden" {...field} />} />
          <Controller control={control} name="longitude" render={({ field }) => <input type="hidden" {...field} />} />
          <Controller control={control} name="distanceDebut" render={({ field }) => <input type="hidden" {...field} />} />

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Google rend la distance au dixieme de kilometre : un champ entier
                l'arrondirait, et le tarif se calerait sur la mauvaise tranche. */}
            <Controller
              name="distanceFin"
              control={control}
              render={({ field, fieldState }) => (
                <ChampDecimal
                  erreur={fieldState.error?.message}
                  label="Distance (km) *"
                  onChange={field.onChange}
                  valeur={field.value}
                />
              )}
            />

            <Controller
              name="prix"
              control={control}
              render={({ field, fieldState }) => (
                <ChampMontant
                  erreur={fieldState.error?.message}
                  label="Prix (XOF) *"
                  onChange={field.onChange}
                  valeur={field.value}
                />
              )}
            />
          </div>

          {/* Commission + Seuil : visibles uniquement si typeCommission est defini.
              Le seuil d'application n'est pertinent que pour le montant fixe (SPEC « Seuil »). */}
          {typeCommission && (
            <div className={typeCommission === 'FIXE' ? 'grid gap-3 sm:grid-cols-2' : ''}>
              <Controller
                name="commission"
                control={control}
                render={({ field, fieldState }) =>
                  enPourcentage ? (
                    <ChampDecimal
                      decimales={2}
                      erreur={fieldState.error?.message}
                      label={commissionLabel}
                      max={100}
                      onChange={field.onChange}
                      valeur={field.value}
                    />
                  ) : (
                    <ChampMontant
                      erreur={fieldState.error?.message}
                      label={commissionLabel}
                      onChange={field.onChange}
                      valeur={field.value}
                    />
                  )
                }
              />

              {typeCommission === 'FIXE' && (
                <Controller
                  name="seuilCommission"
                  control={control}
                  render={({ field, fieldState }) => (
                    <ChampMontant
                      aide="Laisser à 0 pour appliquer la commission à toutes les commandes."
                      erreur={fieldState.error?.message}
                      label="Seuil d'application (XOF)"
                      onChange={field.onChange}
                      valeur={field.value ?? 0}
                    />
                  )}
                />
              )}
            </div>
          )}
        </form>
      )}
    </FenetreAction>
  );
}

function buildDefaults(initialData?: DeliveryFee | null): PriceListFormData {
  return {
    id: initialData?.id ?? '',
    name: initialData?.name ?? '',
    restaurantId: initialData?.restaurantId ?? '',
    zone: initialData?.zone ?? '',
    latitude: initialData?.latitude ?? 0,
    longitude: initialData?.longitude ?? 0,
    distanceDebut: initialData?.distanceDebut ?? 0,
    distanceFin: initialData?.distanceFin ?? 0,
    prix: initialData?.prix ?? 0,
    commission: initialData?.commission ?? 0,
    seuilCommission: initialData?.seuilCommission ?? 0,
  };
}
