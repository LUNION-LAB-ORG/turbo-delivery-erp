'use client';

import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  ChampDate,
  ChampEnveloppe,
  ChampListe,
  ChampMontant,
  ChampTexte,
} from '@/components/commons/champs-formulaire';
import type { IDepotBanqueDTO } from '@/features/responsable-financier';

import type { IFactureRF } from './responsable-financier-columns';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, data: IDepotBanqueDTO) => void;
}

// SPEC-RECOUV-002 : referentiel simple des comptes Turbo (placeholder).
const BANQUES = [
  'NSIA Banque',
  'Ecobank',
  'SGCI',
  'BICICI',
  'Coris Bank',
  'Orange Money',
  'Wave',
  'Autre',
].map((b) => ({ label: b, value: b }));

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Champ = 'banque' | 'date' | 'montant' | 'numeroBordereau' | 'preuve';

/**
 * Le depot en banque enregistre par le responsable financier.
 *
 * <h3>Ce qui change</h3>
 * <p>Meme coquille montee a la main que chez le caissier, et memes defauts : un fond
 * `bg-black/50` en dur, une croix de fermeture sans nom accessible, cinq controles nus
 * dont le focus etait peint en vert, et un bouton desactive qui ne disait pas ce qui
 * manquait. Les deux ecrans partagent maintenant la meme fenetre et les memes champs :
 * un depot se saisit de la meme facon des deux cotes de la chaine.</p>
 */
export default function DepotBanqueModal({ open, onClose, facture, onConfirm }: Props) {
  const [date, setDate] = useState('');
  const [numeroBordereau, setNumeroBordereau] = useState('');
  const [banque, setBanque] = useState('');
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [preuve, setPreuve] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});

  useEffect(() => {
    if (open && facture) {
      setDate('');
      setNumeroBordereau('');
      setBanque('');
      // Le montant REELLEMENT encaisse, pas la valeur faciale de la facture.
      setMontant(facture.montantRecouvre ?? facture.montant ?? undefined);
      setPreuve(null);
      setFileName(null);
      setErreurs({});
    }
  }, [open, facture]);

  if (!facture) return null;

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setPreuve(await fileToDataUrl(file));
    setErreurs((e) => ({ ...e, preuve: undefined }));
  };

  function handleConfirm() {
    if (!facture) return;
    const manque: Partial<Record<Champ, string>> = {};
    if (!date.trim()) manque.date = 'Indiquez la date du dépôt.';
    if (!numeroBordereau.trim()) manque.numeroBordereau = 'Indiquez le numéro du bordereau.';
    if (!banque.trim()) manque.banque = 'Choisissez la banque ou l’agence.';
    if (!montant || montant <= 0) manque.montant = 'Indiquez le montant réellement déposé.';
    if (!preuve) manque.preuve = 'Le bordereau scanné est obligatoire.';
    if (Object.keys(manque).length > 0) {
      setErreurs(manque);
      return;
    }

    onConfirm(facture, {
      banqueAgence: banque.trim(),
      date: date.trim(),
      montantDepose: montant as number,
      numeroBordereau: numeroBordereau.trim(),
      preuveBordereau: preuve as string,
    });
    onClose();
  }

  return (
    <FenetreAction
      libelleAction="Enregistrer le dépôt"
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre="Dépôt en banque"
    >
      <p className="text-sm text-muted">
        Facture <strong className="font-medium text-foreground">{facture.numero}</strong>,{' '}
        {facture.partenaire}
      </p>

      <ChampDate
        erreur={erreurs.date}
        label="Date de dépôt"
        onChange={(v) => {
          setDate(v);
          setErreurs((e) => ({ ...e, date: undefined }));
        }}
        valeur={date}
      />

      <ChampTexte
        erreur={erreurs.numeroBordereau}
        label="N° de bordereau"
        onChange={(v) => {
          setNumeroBordereau(v);
          setErreurs((e) => ({ ...e, numeroBordereau: undefined }));
        }}
        placeholder="ex. BRD-2026-001"
        valeur={numeroBordereau}
      />

      <ChampListe
        erreur={erreurs.banque}
        label="Banque / agence"
        onChange={(v) => {
          setBanque(v);
          setErreurs((e) => ({ ...e, banque: undefined }));
        }}
        options={BANQUES}
        placeholder="Sélectionner…"
        valeur={banque}
      />

      <ChampMontant
        aide="Le montant réellement déposé, qui peut différer du montant facturé."
        erreur={erreurs.montant}
        label="Montant déposé"
        onChange={(v) => {
          setMontant(Number.isNaN(v) ? undefined : v);
          setErreurs((e) => ({ ...e, montant: undefined }));
        }}
        valeur={montant}
      />

      <ChampEnveloppe erreur={erreurs.preuve} label="Preuve (bordereau scanné)">
        {/*
         * `className="hidden"` sortait le champ de fichier de l'ordre de tabulation : le
         * depot devenait impossible sans souris. `sr-only` le masque sans le retirer.
         */}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-separator bg-surface-secondary px-4 py-3 transition-colors hover:bg-surface-tertiary focus-within:border-accent">
          <Upload aria-hidden="true" className="size-4 shrink-0 text-muted" />
          <span className="truncate text-xs text-muted">
            {fileName ?? 'Importer le bordereau (PDF, PNG, JPG)'}
          </span>
          <input
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
            type="file"
          />
        </label>
      </ChampEnveloppe>
    </FenetreAction>
  );
}
