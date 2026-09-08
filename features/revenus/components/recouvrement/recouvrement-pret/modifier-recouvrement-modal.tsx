'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useModifierRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import { usePretListQuery } from '@/features/revenus/queries/prets/pret-list.query';
import {
  RecouvrementEditDTO,
  recouvrementEditSchema,
} from '@/features/revenus/schemas/recouvrement/recouvrement.schema';
import { IRecouvrement } from '@/features/revenus/types/recouvrement/recouvrement.types';
import { createUrlFile } from '@/utils/createUrlFile';

import { RecouvrementForm } from './recouvrement-form';

interface ModifierRecouvrementModalProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  recouvrement: IRecouvrement;
}

export function ModifierRecouvrementModal({
  onOpenChange,
  open,
  recouvrement,
}: ModifierRecouvrementModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(recouvrement.dateRecouvrement));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: factures = [] } = usePretListQuery({});

  const form = useForm<RecouvrementEditDTO>({
    resolver: zodResolver(recouvrementEditSchema),
    defaultValues: {
      dateRecouvrement: new Date(recouvrement.dateRecouvrement),
      factureId: '',
      montant: recouvrement.montant,
      preuve: undefined,
      restaurantId: recouvrement.restaurantId,
    },
  });

  const { handleSubmit, reset, setValue } = form;
  const { isPending: isLoading, mutateAsync: modifierMutation } = useModifierRecouvrementMutation();

  const fermer = () => {
    reset({
      dateRecouvrement: new Date(),
      factureId: '',
      montant: 0,
      preuve: undefined,
      restaurantId: '',
    });
    setSelectedDate(new Date());
    setSelectedFile(null);
    onOpenChange(false);
  };

  // Réinitialiser le formulaire à chaque ouverture avec les données du recouvrement
  useEffect(() => {
    if (open) {
      const date = new Date(recouvrement.dateRecouvrement);
      setSelectedDate(date);
      setSelectedFile(null);
      reset({
        dateRecouvrement: date,
        factureId: '',
        montant: recouvrement.montant,
        preuve: undefined,
        restaurantId: recouvrement.restaurantId,
      });
    }
  }, [open, recouvrement, reset]);

  const onSubmitForm = async (data: RecouvrementEditDTO) => {
    await modifierMutation(
      {
        data: { ...data, preuve: selectedFile ?? undefined },
        id: recouvrement.id,
      },
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
    const d = date || new Date();
    setSelectedDate(d);
    setValue('dateRecouvrement', d, { shouldValidate: true });
  };

  return (
    <FenetreAction
      enAttente={isLoading}
      libelleAction="Enregistrer"
      onAction={handleSubmit(onSubmitForm)}
      onFermer={fermer}
      ouvert={open}
      titre="Modifier le recouvrement"
    >
      <RecouvrementForm
        factures={factures}
        form={form}
        isEdit
        onDateChange={handleDateChange}
        onFileChange={handleFileChange}
        preuveExistanteUrl={
          recouvrement.preuve ? createUrlFile(recouvrement.preuve, 'backend') : undefined
        }
        selectedDate={selectedDate}
        selectedFileName={selectedFile?.name}
      />
    </FenetreAction>
  );
}
