'use client';

import { useEffect } from 'react';
import { Button, Modal } from '@heroui-v3/react';
import { Plus, Save } from 'lucide-react';

import {
  ChampListe,
  ChampMontant,
  ChampTexte,
} from '@/components/commons/champs-formulaire';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useAjouterChargeFixeMutation,
  useModifierChargeFixeMutation,
} from '@/features/charges/queries/charge-fixe.mutation';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import {
  ChargeFixeCreateDTO,
  chargeFixeFormSchema,
} from '@/features/charges/schemas/charge-fixe.schema';

interface AddChargeFixeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeToEdit?: IChargeFixe | null;
}

const cycles = [
  { value: 'MENSUEL', label: 'Tous les mois' },
  { value: 'TRIMESTRIEL', label: 'Tous les trimestres' },
  { value: 'SEMESTRIEL', label: 'Tous les semestres' },
  { value: 'ANNUEL', label: 'Tous les ans' },
];

const EMPTY_FORM: ChargeFixeCreateDTO = {
  designation: '',
  categorieId: '',
  cyclePaiement: 'MENSUEL',
  montant: 0,
  echeanceJour: 1,
};

export default function AddChargeFixeModal({
  isOpen,
  onClose,
  chargeToEdit,
}: AddChargeFixeModalProps) {
  const isEditMode = !!chargeToEdit;

  const { mutate: ajouterChargeFixe, isPending: isAdding } = useAjouterChargeFixeMutation();
  const { mutate: modifierChargeFixe, isPending: isUpdating } = useModifierChargeFixeMutation();
  const isPending = isAdding || isUpdating;

  const { categories, isLoading: isLoadingCategories } = useCategorieDepense();

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ChargeFixeCreateDTO>({
    resolver: zodResolver(chargeFixeFormSchema),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!isOpen) {
      reset(EMPTY_FORM);
      return;
    }

    if (chargeToEdit) {
      reset({
        designation: chargeToEdit.designation,
        categorieId: chargeToEdit.categorie?.id ?? '',
        cyclePaiement: chargeToEdit.cyclePaiement,
        montant: chargeToEdit.montant,
        echeanceJour: chargeToEdit.echeanceJour,
      });
      return;
    }

    reset(EMPTY_FORM);
  }, [chargeToEdit, isOpen, reset]);

  const formValues = watch();

  const onSubmit = (values: ChargeFixeCreateDTO) => {
    if (isEditMode && chargeToEdit) {
      modifierChargeFixe(
        { id: chargeToEdit.id, data: values },
        {
          onSuccess: () => {
            reset(EMPTY_FORM);
            onClose();
          },
        },
      );
      return;
    }

    ajouterChargeFixe(values, {
      onSuccess: () => {
        reset(EMPTY_FORM);
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset(EMPTY_FORM);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Header>
              {/* Le titre etait peint en BLEU — comme celui de la depense variable etait
                  peint en violet. Deux fenetres soeurs du meme module, deux couleurs
                  d'en-tete qui n'appartiennent a aucune palette de l'ERP. */}
              <Modal.Heading>
                {isEditMode ? 'Modifier la charge fixe' : 'Ajouter une charge fixe'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
              <form
                className="flex flex-col gap-6"
                id="form-charge-fixe"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* « Designation », « Categorie », « Date d'echeance » : les libelles
                      etaient ecrits sans accents. */}
                  <ChampTexte
                    erreur={errors.designation?.message}
                    label="Désignation"
                    onChange={(v) => setValue('designation', v, { shouldValidate: true })}
                    placeholder="Loyer du bureau, internet…"
                    valeur={formValues.designation ?? ''}
                  />

                  <ChampListe
                    erreur={errors.categorieId?.message}
                    label="Catégorie"
                    onChange={(v) => setValue('categorieId', v, { shouldValidate: true })}
                    options={categories.map((cat) => ({
                      label: cat.nomCategorie,
                      value: cat.id,
                    }))}
                    placeholder={isLoadingCategories ? 'Chargement…' : 'Rechercher une catégorie'}
                    valeur={formValues.categorieId ?? ''}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <ChampListe
                    erreur={errors.cyclePaiement?.message}
                    label="Cycle de paiement"
                    onChange={(v) =>
                      setValue('cyclePaiement', v as ChargeFixeCreateDTO['cyclePaiement'], {
                        shouldValidate: true,
                      })
                    }
                    options={cycles.map((c) => ({ label: c.label, value: String(c.value) }))}
                    placeholder="Choisir un cycle"
                    valeur={formValues.cyclePaiement ?? ''}
                  />

                  <ChampMontant
                    aide="En francs CFA"
                    erreur={errors.montant?.message}
                    label="Montant"
                    onChange={(v) => setValue('montant', v, { shouldValidate: true })}
                    valeur={formValues.montant}
                  />

                  {/*
                   * Trente-et-une entrees dans une liste deroulante NON cherchable : pour
                   * le 28, il fallait faire defiler jusqu'en bas. Et l'intitule
                   * « Date d'echeance » annoncait une date la ou l'on choisit un JOUR DU
                   * MOIS — ce que la valeur, un nombre de 1 a 31, dit bien.
                   */}
                  <ChampListe
                    erreur={errors.echeanceJour?.message}
                    label="Jour d'échéance dans le mois"
                    onChange={(v) => setValue('echeanceJour', Number(v), { shouldValidate: true })}
                    options={Array.from({ length: 31 }, (_, i) => ({
                      label: `Le ${i + 1}`,
                      value: String(i + 1),
                    }))}
                    placeholder="Choisir un jour"
                    valeur={formValues.echeanceJour ? String(formValues.echeanceJour) : ''}
                  />
                </div>
              </form>
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={handleClose} variant="ghost">
                Annuler
              </Button>
              <Button
                form="form-charge-fixe"
                isDisabled={!isValid || isPending}
                isPending={isPending}
                type="submit"
                variant="primary"
              >
                {isEditMode ? (
                  <>
                    <Save aria-hidden="true" className="size-4" />
                    Enregistrer les modifications
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" className="size-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
