'use client';

import { title } from '@/components/primitives';
import { ArrowDownToLine, Plus, Save } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent, Button, Input, Card, CardHeader, Divider, CardBody, Select, SelectItem } from '@heroui/react';
import { _deliveryFeeCreateSchema, _deliveryFeeUpdateSchema, deliveryFeeCreateSchema } from '@/src/price-list/price-list.schema';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, placeDetails, calculateDistance } from '@/lib/googlemaps-server';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';
import { Restaurant } from '@/types/models';
import useContentHeaderPriceListDefined from '../../../app/(protected)/price-list/useContentHeaderPriceListDefined';
import TextInputToUrl from './searchDelivery';

type LatLng = {
  lat: number;
  lng: number;
};
export default function Header({ initialData }: { initialData: Restaurant[] | null }) {
  const [id, setId] = useState<string>('');
  const { createOrUpdateFee } = useContentHeaderPriceListDefined(initialData, id);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [resulFinalDistance, setResulFinaleDistance] = useState<number>(0);
  const [inputCalculate, setInputCalculate] = useState<{
    point1: LatLng;
    point2: LatLng;
  }>({
    point1: { lat: 0, lng: 0 },
    point2: { lat: 0, lng: 0 },
  });

  const handleInputChange = useCallback(async (value: string) => {
    if (value.length > 2 && !loading) {
      try {
        const result = await autocomplete(value);
        setSuggestions(result);
      } catch (error) {
        console.error('Error fetching autocomplete suggestions:', error);
      }
    } else {
      setSuggestions([]);
    }
  }, []);

  const {
    formState: { errors },
    watch,
    control,
    getValues,
    setValue,
    reset,
  } = useForm<_deliveryFeeCreateSchema>({
    resolver: zodResolver(deliveryFeeCreateSchema),
    defaultValues: {
      name: '',
      restaurantId: '',
      zone: '',
      longitude: 0,
      latitude: 0,
      distanceDebut: 0,
      distanceFin: 0,
      prix: 0,
      commission: 0,
    },
  });

  useEffect(() => {
    if (initialData && restaurantId) {
      const restaurantDetail = initialData?.find((item) => item.id === restaurantId);

      setInputCalculate((prevState) => ({
        ...prevState, // On garde les autres points
        point1: { lat: restaurantDetail?.latitude || 0, lng: restaurantDetail?.longitude || 0 },
      }));
    }
  }, [restaurantId]);

  let longitude = getValues('restaurantId');
  const restaurant = initialData?.find((item) => item.id === longitude);

  const handleSuggestionClick = async (suggestion: PlaceAutocompleteResult) => {
    setLoading(true);
    setValue('zone', suggestion.description, { shouldValidate: true });
    setSuggestions([]);
    try {
      const details = await placeDetails(suggestion.place_id);

      // setInputCalculate()
      setValue('longitude', details.result.geometry?.location.lng ?? 0, { shouldValidate: true });
      setValue('latitude', details.result.geometry?.location.lat ?? 0, { shouldValidate: true });

      let longitude = getValues('longitude');
      let latitude = getValues('latitude');

      setInputCalculate((prev) => ({ ...prev, point2: { lat: latitude, lng: longitude } }));

      const calculateDistanceR = await calculateDistance(inputCalculate.point1, {
        lat: latitude,
        lng: longitude,
      });

      setValue('distanceFin', calculateDistanceR ?? 0);

      setResulFinaleDistance(calculateDistanceR);
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  const w = watch('restaurantId');
  useEffect(() => {
    setId(w);
  }, [w]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className={title({ size: 'h3', class: 'text-primary' })}>Gestions des frais de livraison</h1>
      </div>

      <div className="py-6 flex items-center justify-between">
        <div className="relative">
          <TextInputToUrl />
        </div>

        <div className="flex pt-0 flex-wrap gap-2 sm:pt-4 lg:pt-0 md:pt-0 xl:pt-0">
          <Button variant="bordered" endContent={<ArrowDownToLine />}>
            Exporter
          </Button>
          <Popover isNonModal={false} showArrow placement="bottom">
            <PopoverTrigger>
              <Button color="danger" endContent={<Plus />}>
                Ajouter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px]">
              {(titleProps) => (
                <div className="px-1 py-2 w-full">
                  <Card>
                    <CardHeader className="flex flex-col gap-2">
                      <h2 className="text-xl font-semibold text-red-600">Ajouter un frais de livraison</h2>
                      {restaurant?.typeCommission && <p>Type de commission : {restaurant?.typeCommission}</p>}
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          createOrUpdateFee(getValues());
                        }}
                        className="flex flex-col gap-4 "
                      >
                        <Controller
                          control={control}
                          name="name"
                          render={({ field }) => (
                            <div>
                              <Input
                                {...field}
                                value={field.value.toString() ?? ''}
                                type="text"
                                label="name"
                                variant="bordered"
                                isRequired
                                required
                                aria-invalid={errors.name ? 'true' : 'false'}
                                aria-label="name input"
                                errorMessage={errors.name?.message ?? ''}
                                isInvalid={!!errors.name}
                                name="name"
                                radius="sm"
                              />
                            </div>
                          )}
                        />

                        <Controller
                          control={control}
                          name="restaurantId"
                          render={({ field }) => (
                            <div>
                              <Select
                                {...field}
                                isRequired
                                required
                                label="sélectionner le restaurant"
                                placeholder="Exemple restaurant"
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  setRestaurantId(e.target.value);
                                }}
                              >
                                {initialData && initialData?.filter((item) => item.typeCommission).map((item) => <SelectItem key={item.id}>{item.nomEtablissement}</SelectItem>)}
                              </Select>
                            </div>
                          )}
                        />

                        <Controller
                          control={control}
                          name="zone"
                          render={({ field }) => (
                            <div className="relative">
                              <Input
                                {...field}
                                isRequired
                                aria-invalid={errors.zone ? 'true' : 'false'}
                                aria-label="zone input"
                                errorMessage={errors.zone?.message ?? ''}
                                isInvalid={!!errors.zone}
                                label="Zone"
                                name="zone"
                                placeholder="Entrez une adresse"
                                type="text"
                                value={field.value || ''}
                                onValueChange={handleInputChange}
                                variant="bordered"
                                radius="sm"
                              />
                              {!loading && suggestions && suggestions.length > 0 && (
                                <ul className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg">
                                  {suggestions.map((suggestion) => (
                                    <li key={suggestion.place_id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleSuggestionClick(suggestion)}>
                                      {suggestion.description}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        />
                        <Controller
                          control={control}
                          name="latitude"
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value.toString() ?? ''}
                              type="hidden"
                              label="latitude"
                              variant="bordered"
                              isRequired
                              required
                              aria-invalid={errors.distanceFin ? 'true' : 'false'}
                              aria-label="distanceFin input"
                              errorMessage={errors.distanceFin?.message ?? ''}
                              isInvalid={!!errors.distanceFin}
                              name="distanceFin"
                              radius="sm"
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name="longitude"
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value.toString() ?? ''}
                              type="hidden"
                              label="longitude"
                              variant="bordered"
                              isRequired
                              required
                              aria-invalid={errors.distanceFin ? 'true' : 'false'}
                              aria-label="distanceFin input"
                              errorMessage={errors.distanceFin?.message ?? ''}
                              isInvalid={!!errors.distanceFin}
                              name="distanceFin"
                              radius="sm"
                            />
                          )}
                        />

                        <Controller
                          control={control}
                          name="distanceDebut"
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value.toString() ?? ''}
                              type="hidden"
                              label="Distance début (km)"
                              variant="bordered"
                              isRequired
                              required
                              aria-invalid={errors.distanceDebut ? 'true' : 'false'}
                              aria-label="distanceDebut input"
                              errorMessage={errors.distanceDebut?.message ?? ''}
                              isInvalid={!!errors.distanceDebut}
                              name="distanceDebut"
                              radius="sm"
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name="distanceFin"
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={resulFinalDistance.toString() ?? ''}
                              onValueChange={field.onChange}
                              type="number"
                              label="distance totale"
                              variant="bordered"
                              isRequired
                              required
                              aria-invalid={errors.distanceFin ? 'true' : 'false'}
                              aria-label="distanceFin input"
                              errorMessage={errors.distanceFin?.message ?? ''}
                              isInvalid={!!errors.distanceFin}
                              name="distanceFin"
                              radius="sm"
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name="prix"
                          rules={{ required: 'Ce champ est requis' }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              value={field.value.toString() ?? ''}
                              type="number"
                              label="Prix en XOF"
                              variant="bordered"
                              isRequired
                              required
                              aria-invalid={errors.prix ? 'true' : 'false'}
                              aria-label="prix input"
                              errorMessage={errors.prix?.message ?? ''}
                              isInvalid={!!errors.prix}
                              name="prix"
                              radius="sm"
                            />
                          )}
                        />
                        {restaurant?.typeCommission === 'FIXE' && (
                          <Controller
                            control={control}
                            name="commission"
                            render={({ field }) => (
                              <Input
                                {...field}
                                value={field.value.toString() ?? ''}
                                type="number"
                                label="Commission XOF"
                                variant="bordered"
                                isRequired
                                required
                                aria-invalid={errors.commission ? 'true' : 'false'}
                                aria-label="commission input"
                                errorMessage={errors.commission?.message ?? ''}
                                isInvalid={!!errors.commission}
                                name="commission"
                                radius="sm"
                              />
                            )}
                          />
                        )}
                        <SubmitButton startContent={<Save size={20} />}>Ajouter</SubmitButton>
                      </form>
                    </CardBody>
                  </Card>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
