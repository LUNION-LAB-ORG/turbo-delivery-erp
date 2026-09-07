'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Chip, Modal } from '@heroui-v3/react';
import { Check, Paperclip, Plus, Save, X } from 'lucide-react';

import {
  ChampListe,
  ChampMontant,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useAjouterChargeVariableMutation,
  useModifierChargeVariableMutation,
} from '@/features/charges/queries/charge-variable.mutation';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useSession } from 'next-auth/react';
import {
  ChargeVariableFormDTO,
  chargeVariableFormSchema,
} from '@/features/charges/schemas/charge-variable.schema';
import { getTodayDateInput } from '@/lib/date-utils';
import { createUrlFile } from '@/utils/createUrlFile';
import { formatMontant } from '@/utils/format.utils';

interface AddDepenseVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (depense: IChargeVariable) => void;
  chargeToEdit?: IChargeVariable | null;
}

const EMPTY_FORM: ChargeVariableFormDTO = {
  designation: '',
  categorieId: '',
  montant: 0,
  description: '',
  dateDepense: getTodayDateInput(),
};

/**
 * Une etape de la chaine Comptable → DGA → DG → Decaissement.
 *
 * <p>L'etape franchie etait un rond `bg-green-500 border-green-500 text-white` : du vert
 * de palette brute, sans variante sombre, pour dire « fait ». Elle prend le jeton de
 * succes du theme, et son etat est annonce — un rond coche muet ne disait rien au lecteur
 * d'ecran, qui n'entendait que « Comptable Saisie » sans savoir ou en etait le dossier.</p>
 */
function Step({ active, label, sub }: { active?: boolean; label: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div
        className={`flex size-10 items-center justify-center rounded-full border-2 ${
          active
            ? 'border-success bg-success text-success-foreground'
            : 'border-separator bg-surface-secondary text-muted'
        }`}
      >
        {active ? <Check aria-hidden="true" className="size-4" /> : null}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
      <span className="sr-only">{active ? 'Étape franchie' : 'Étape à venir'}</span>
    </div>
  );
}

export default function AddDepenseVariableModal({
  isOpen,
  onClose,
  onAdd,
  chargeToEdit,
}: AddDepenseVariableModalProps) {
  const isEditMode = !!chargeToEdit;

  const { mutate: ajouterChargeVariable, isPending: isAdding } = useAjouterChargeVariableMutation();
  const { mutate: modifierChargeVariable, isPending: isUpdating } = useModifierChargeVariableMutation();
  const isPending = isAdding || isUpdating;

  const { categories, isLoading: isLoadingCategories } = useCategorieDepense();
  const { data: session } = useSession();

  const [justificatifFile, setJustificatifFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ChargeVariableFormDTO>({
    resolver: zodResolver(chargeVariableFormSchema),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    if (!isOpen) {
      reset(EMPTY_FORM);
      setJustificatifFile(null);
      return;
    }

    if (chargeToEdit) {
      reset({
        designation: chargeToEdit.designation,
        categorieId: chargeToEdit.categorie?.id ?? '',
        montant: chargeToEdit.montant,
        description: chargeToEdit.description ?? '',
        dateDepense: chargeToEdit.dateDepense ?? getTodayDateInput(),
      });
      return;
    }

    reset(EMPTY_FORM);
    setJustificatifFile(null);
  }, [chargeToEdit, isOpen, reset]);

  const formValues = watch();

  const hasJustificatif = justificatifFile !== null || !!chargeToEdit?.justificatif;

  // Aperçu du justificatif déjà enregistré : on sert le fichier via le proxy
  // /api/fichier (Content-Type correct + inline) plutôt que d'afficher son nom UUID.
  const justificatifUrl = chargeToEdit?.justificatif
    ? `/api/fichier?u=${encodeURIComponent(createUrlFile(chargeToEdit.justificatif, 'backend'))}`
    : null;
  const justificatifEstPdf = (chargeToEdit?.justificatif ?? '').toLowerCase().includes('.pdf');

  const onSubmit = (values: ChargeVariableFormDTO) => {
    if (!hasJustificatif) return;

    const payload = {
      ...values,
      cyclePaiement: 'MENSUEL' as const,
      echeanceJour: 5,
      creerPar: session?.user?.name ?? '',
    };

    if (isEditMode && chargeToEdit) {
      modifierChargeVariable(
        { id: chargeToEdit.id, data: payload, file: justificatifFile },
        {
          onSuccess: () => {
            reset(EMPTY_FORM);
            onClose();
          },
        },
      );
    } else {
      ajouterChargeVariable(
        { data: payload, file: justificatifFile },
        {
          onSuccess: (data) => {
            onAdd?.(data);
            reset(EMPTY_FORM);
            setJustificatifFile(null);
            onClose();
          },
        },
      );
    }
  };

  const handleClose = () => {
    reset(EMPTY_FORM);
    setJustificatifFile(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Header>
              {/* Le titre etait peint en VIOLET, une couleur qui n'existe nulle part
                  ailleurs dans l'ERP — comme le bouton d'enregistrement, la pastille de
                  categorie, le montant de l'apercu et le cadre du justificatif. */}
              <Modal.Heading>
                {isEditMode ? 'Modifier la dépense variable' : 'Ajouter une dépense variable'}
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
          {/* Le bouton d'envoi vit maintenant dans le pied de la fenetre, hors du
              formulaire : il le vise par son `id`. */}
          <form
            className="flex flex-col gap-6"
            id="form-depense-variable"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ChampTexte
                erreur={errors.designation?.message}
                label="Désignation"
                onChange={(v) => setValue('designation', v, { shouldValidate: true })}
                placeholder="Carburant, maintenance…"
                valeur={formValues.designation ?? ''}
              />

              {/*
               * C'etait un `react-select`, la seule bibliotheque de listes du projet a ne
               * pas suivre le theme, et son apparence etait ecrite en HEXADECIMAUX dans un
               * objet `styles` : `#f31260` pour l'erreur, `#7828c8` pour le focus,
               * `#d4d4d8` pour la bordure. Trois couleurs qui n'existent dans aucun jeton,
               * et pas une seule variante sombre — le champ restait blanc a bordure claire
               * sur un fond noir.
               */}
              <ChampListe
                erreur={errors.categorieId?.message}
                label="Catégorie"
                onChange={(v) => setValue('categorieId', v, { shouldValidate: true })}
                options={categories.map((cat) => ({ label: cat.nomCategorie, value: cat.id }))}
                placeholder={isLoadingCategories ? 'Chargement…' : 'Rechercher une catégorie'}
                valeur={formValues.categorieId ?? ''}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ChampMontant
                aide="En francs CFA"
                erreur={errors.montant?.message}
                label="Montant"
                onChange={(v) => setValue('montant', v, { shouldValidate: true })}
                valeur={formValues.montant}
              />

              <ChampTexte
                erreur={errors.dateDepense?.message}
                label="Date de dépense"
                onChange={(v) => setValue('dateDepense', v, { shouldValidate: true })}
                type="date"
                valeur={formValues.dateDepense ?? ''}
              />
            </div>

            <ChampZoneTexte
              label="Description (facultative)"
              onChange={(v) => setValue('description', v)}
              placeholder="Préciser le contexte de la dépense"
              valeur={formValues.description ?? ''}
            />

            {/* Justificatif (fichier) */}
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
                Justificatif <span className="text-danger">*</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setJustificatifFile(e.target.files?.[0] ?? null)}
              />
              {justificatifFile ? (
                <div className="flex items-center gap-2 rounded-lg border border-separator bg-surface-secondary px-4 py-3">
                  <Paperclip aria-hidden="true" className="size-4 shrink-0 text-muted" />
                  <span className="flex-1 truncate text-sm text-foreground">
                    {justificatifFile.name}
                  </span>
                  {/* C'etait un `<button>` nu, sans nom accessible, sur le seul geste qui
                      retire la piece obligatoire du formulaire. */}
                  <Button
                    aria-label="Retirer le justificatif"
                    isIconOnly
                    onPress={() => {
                      setJustificatifFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  className="flex w-full items-center gap-2 rounded-lg border-2 border-dashed border-separator px-4 py-3 text-sm text-muted transition-colors hover:border-foreground/40 hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Paperclip aria-hidden="true" className="size-4" />
                  Joindre un fichier (image ou PDF)
                </button>
              )}
              {justificatifUrl && !justificatifFile && (
                <div className="mt-2">
                  <p className="text-xs text-muted mb-1">Justificatif actuel</p>
                  {justificatifEstPdf ? (
                    <iframe
                      src={justificatifUrl}
                      title="Justificatif actuel (PDF)"
                      className="w-full h-56 rounded-lg border border-separator bg-surface-secondary"
                    />
                  ) : (
                    <a
                      href={justificatifUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ouvrir le justificatif en grand"
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={justificatifUrl}
                        alt="Justificatif actuel"
                        className="max-h-56 w-auto rounded-lg border border-separator object-contain hover:opacity-90 transition-opacity"
                      />
                    </a>
                  )}
                  <p className="text-[11px] text-muted mt-1">
                    Joindre un nouveau fichier remplacera ce justificatif.
                  </p>
                </div>
              )}
              {!hasJustificatif && (
                <p className="mt-1 text-xs text-danger">Le justificatif est obligatoire</p>
              )}
            </div>

            {/* Workflow */}
            <div className="flex items-center justify-between pt-4">
              <Step label="Comptable" sub="Saisie" active />
              <div className="mx-2 h-px flex-1 bg-separator" />
              <Step label="DGA" sub="Visa" />
              <div className="mx-2 h-px flex-1 bg-separator" />
              <Step label="DG" sub="Approbation" />
              <div className="mx-2 h-px flex-1 bg-separator" />
              <Step label="Paiement" sub="Décaissement" />
            </div>

            {/* Aperçu */}
            {isValid && hasJustificatif && (
              <div className="flex flex-col items-start gap-2 rounded-lg bg-surface-secondary p-4">
                <p className="font-semibold text-foreground">{formValues.designation}</p>
                <Chip size="sm" variant="soft">
                  <Chip.Label>
                    {categories.find((c) => c.id === formValues.categorieId)?.nomCategorie}
                  </Chip.Label>
                </Chip>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {formatMontant(formValues.montant)}
                </p>
              </div>
            )}

          </form>
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={handleClose} variant="ghost">
                Annuler
              </Button>
              <Button
                form="form-depense-variable"
                isDisabled={!isValid || !hasJustificatif || isPending}
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

