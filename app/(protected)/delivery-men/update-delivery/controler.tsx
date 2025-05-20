import { changerRestaurantLivreur, changerStatusLivreur } from '@/src/actions/delivery-men.actions';
import { LivreurStatutVM, TypeEnum } from '@/types/models';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export function useUpdateDeliveryManController(livreur?: LivreurStatutVM | null, typeLivreur?: string, onClose?: () => void) {
  const [restaurantSelected, setRestuarantSelect] = useState('');
  const router = useRouter();

  const changerRestaurantLivreurs = async () => {
    if (!restaurantSelected) {
      toast.error('Veuillez choisir un restaurant');
      return false;
    }
    try {
      const result = await changerStatusLivreur({
        livreurId: livreur?.livreurId ?? "",
        restaurantId: restaurantSelected,
        typeLivreur: typeLivreur ?? ""
      })
      if (result.status === 'success') {
        toast.success(result.message);
        router.refresh();
        setRestuarantSelect('');
      } else {
        toast.error(result.message);
      }
      onClose && onClose();
    } catch (error) {
      toast.error("Une erreur s'est produite");
    } finally {
      router.refresh();
    }
  };

  return {
    restaurantSelected,
    setRestuarantSelect,
    changerRestaurantLivreurs,
  };
}
