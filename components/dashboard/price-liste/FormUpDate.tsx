'use client';


import { Card, CardBody, CardHeader, Divider, Input, Popover, PopoverContent, PopoverTrigger } from '@heroui/react';
import { IconEdit } from '@tabler/icons-react';
import {  Save } from 'lucide-react';
import {  useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useContentCtx from '../../../app/(protected)/price-list/useContentCtx';
import { _deliveryFeeCreateSchema, _deliveryFeeUpdateSchema, deliveryFeeUpdateSchema } from '@/src/price-list/price-list.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import { autocomplete, calculateDistance, placeDetails } from '@/lib/googlemaps-server';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';
import { DeliveryFee } from '@/types/price-list';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';

type LatLng = {
  lat: number;
  lng: number;
};

export default function FormUpDate({ initialData, restaurantId, typeCm }: { initialData: DeliveryFee; restaurantId: string | null; typeCm: string | null }) {  
  
  const [typeCommission, setTypeCommission] = useState<string>('type commussion (non definie)');
  const { createOrUpdateFee } = useContentCtx(initialData);
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputCalculate, setInputCalculate] = useState<{
    point1: LatLng;
    point2: LatLng;
  }>({
    point1: { lat: 0, lng: 0 },
    point2: { lat: 0, lng: 0 },
  });

  const [resulFinalDistance, setResulFinaleDistance] = useState<number>(initialData.distanceFin);

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
  } = useForm<_deliveryFeeUpdateSchema>({
    resolver: zodResolver(deliveryFeeUpdateSchema),
    defaultValues: {
      name: initialData.name||'',
      restaurantId: initialData.restaurantId||'',
      id: initialData?.id || '',
      zone: initialData?.zone || '',
      longitude: initialData?.longitude || 0,
      latitude: initialData?.latitude || 0,
      distanceDebut: initialData?.distanceDebut || 0,
      distanceFin: initialData?.distanceFin || 0,
      prix: initialData?.prix || 0,
      commission: initialData?.commission || 0,
    },
  });

  useEffect(() => {
    let comm = 'type commussion (non definie)';

    if (typeCm) 

    comm = typeCm === 'POURCENTAGE' ? 'Type commussion (POURCENTAGE %)' : typeCm === 'FIXE' ? 'Type commussion (XOF)' : ' (Type de commussion Non definie)';
    setTypeCommission(comm);
  }, []);

  useEffect(() => {
    setInputCalculate((prevState) => ({
      ...prevState, // On garde les autres points
      point2: { lat: initialData.latitude || 0, lng: initialData.longitude || 0 },
    }));
  }, []);

  

  useEffect(() => {
    if (restaurantId) {
      setValue('restaurantId', restaurantId);
      const getRestaurantDetail = async () => {
        const detailRestaurant = await getDetailRestaurant(restaurantId);

        // Vérifier si detailRestaurant est défini et a les propriétés longitude et latitude
        if (detailRestaurant?.longitude && detailRestaurant?.latitude) {
          setInputCalculate((prevState) => ({
            ...prevState, // On garde les autres points
            point1: { lat: detailRestaurant.latitude || 0, lng: detailRestaurant.longitude || 0 },
          }));
          
        }
      };

      getRestaurantDetail();
    }
  }, [restaurantId, setValue]);

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

      setValue('distanceFin',calculateDistanceR?? 0 );      

      setResulFinaleDistance(calculateDistanceR);
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover isNonModal={false} showArrow placement="bottom">
      <PopoverTrigger>
        {initialData && (
          <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
            <IconEdit />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[350px]">
        {(titleProps) => (
          <div className="px-1 py-2 w-full">
            <Card>
              <CardHeader className="flex gap-3"></CardHeader>
              <Divider />
              <CardBody>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();     
                    // console.log({data:getValues()});
                                   
                    createOrUpdateFee(getValues());
                  }}
                  className="flex flex-col gap-4"
                >
                  <Controller
                    control={control}
                    name="name"
                    render={({ field }) => (
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
                              aria-invalid={errors.distanceFin ? 'true' : 'false'}
                              aria-label="name input"
                              errorMessage={errors.distanceFin?.message ?? ''}
                              isInvalid={!!errors.distanceFin}
                              name="name"
                              radius="sm"
                            />
                          </div>
                        )}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="restaurantId"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value.toString() ?? ''}
                        type="hidden" // Champ caché
                        label="restaurantId"
                        variant="bordered"
                        isRequired
                        required
                        aria-invalid={errors.restaurantId ? 'true' : 'false'}
                        aria-label="restaurantId"
                        errorMessage={errors.restaurantId?.message ?? ''}
                        isInvalid={!!errors.restaurantId}
                        name="restaurantId"
                        radius="sm"
                        style={{ position: 'absolute', left: '-9999px' }} // Masquer l'élément hors de la vue
                      />
                    )}
                  />

                  {/* <Controller
                                                            control={control}
                                                            name="id"
                                                            render={({ field }) => (
                                                                <Input
                                                                    {...field}
                                                                    value={field.value.toString() ?? ''}
                                                                    type="string"
                                                                    label="id"
                                                                    variant="bordered"
                                                                    isRequired
                                                                    required
                                                                    aria-invalid={errors.restaurantId ? 'true' : 'false'}
                                                                    aria-label="id"
                                                                    errorMessage={errors.restaurantId?.message ?? ''}
                                                                    isInvalid={!!errors.restaurantId}
                                                                    name="id"
                                                                    radius="sm"
                                                                />
                                                            )}
                                                        /> */}

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

                  {/* <div className='px-2 py-2 border-2 rounded-lg flex flex-col gap-1'>
                                                        <h3>distance totale</h3>
                                                        <p>
                                                        { resulFinalDistance?resulFinalDistance:initialData.distanceFin} km
                                                        </p>
                                                    </div> */}
                  <Controller
                    control={control}
                    name="distanceDebut"
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="hidden"
                        value={field.value.toString() ?? ''}
                        // type="number"
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
                  <div></div>
                  <Controller
                    control={control}
                    name="distanceFin"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={resulFinalDistance?.toString() ?? ''}
                        type="number"
                        label="Distance fin (km)"
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
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value.toString() ?? ''}
                        type="number"
                        label="prix"
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


                    {
                      typeCm=== 'POURCENTAGE'?
                      <Controller
                      
                      control={control}
                      name="commission"
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value.toString() ?? ''}
                          type="number"
                          label={typeCommission}
                          variant="bordered"
                          isRequired
                          required
                          aria-invalid={errors.commission ? 'true' : 'false'}
                          aria-label="commission input"
                          errorMessage={errors.commission?.message ?? ''}
                          isInvalid={!!errors.commission}
                          name="commission"
                          radius="sm"
                          hidden
                          className='hidden'
                        />
                      )}
                    />:

                      <Controller
                      control={control}
                      name="commission"
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value.toString() ?? ''}
                          type="number"
                          label={typeCommission}
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
                    }

                  {/* <Controller
                    control={control}
                    name="commission"
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value.toString() ?? ''}
                        type="number"
                        label={typeCommission}
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
                  /> */}
                  <SubmitButton startContent={<Save size={20} />}>Modifier</SubmitButton>
                </form>
              </CardBody>
            </Card>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
