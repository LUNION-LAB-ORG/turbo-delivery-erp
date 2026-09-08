'use client';

import { Button } from '@heroui-v3/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useAjouterRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import { usePretListQuery } from '@/features/revenus/queries/prets/pret-list.query';
import {
  RecouvrementCreateDTO,
  recouvrementFormSchema,
} from '@/features/revenus/schemas/recouvrement/recouvrement.schema';

import { RecouvrementForm } from './recouvrement-form';

export function CreerRecouvrementModal({
  restaurantId,
  variant = 'ghost',
}: {
  restaurantId?: string;
  variant?: 'ghost' | 'outline';
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: factures = [] } = usePretListQuery({});

  const form = useForm<RecouvrementCreateDTO>({
    resolver: zodResolver(recouvrementFormSchema),
    defaultValues: {
      dateRecouvrement: new Date(),
      factureId: '',
      montant: 0,
      preuve: undefined,
      restaurantId: restaurantId || '',
    },
  });

  const { handleSubmit, reset, setValue } = form;

  const { isPending: isLoading, mutateAsync: recouvrementCreateMutation } =
    useAjouterRecouvrementMutation();

  const fermer = () => {
    reset({
      dateRecouvrement: new Date(),
      factureId: '',
      montant: 0,
      preuve: undefined,
      restaurantId: restaurantId || '',
    });
    setSelectedDate(new Date());
    setSelectedFile(null);
    setOpen(false);
  };

  const onSubmitForm = async (data: RecouvrementCreateDTO) => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier de preuve');
      return;
    }

    await recouvrementCreateMutation(
      { ...data, preuve: selectedFile },
      {
        onSuccess: () => {
          fermer();
        },
      },
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('preuve', file, { shouldValidate: true });
    }
  };

  const handleDateChange = (date?: Date) => {
    setSelectedDate(date || new Date());
    if (date) setValue('dateRecouvrement', date, { shouldValidate: true });
  };

  return (
    <>
      <Button onPress={() => setOpen(true)} variant={variant}>
        <Plus aria-hidden="true" className="size-4" />
        Effectuer un recouvrement
      </Button>

      <FenetreAction
        enAttente={isLoading}
        libelleAction="Ajouter"
        onAction={handleSubmit(onSubmitForm)}
        onFermer={fermer}
        ouvert={open}
        titre="Ajouter un recouvrement"
      >
        <RecouvrementForm
          factures={factures}
          form={form}
          onDateChange={handleDateChange}
          onFileChange={handleFileChange}
          selectedDate={selectedDate}
          selectedFileName={selectedFile?.name}
          disableRestaurant={!!restaurantId}
        />
      </FenetreAction>
    </>
  );
}
