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
import type { IDepotBanqueCaissierBody, IFactureCaissier } from '@/features/caissier';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureCaissier | null;
  onConfirm: (facture: IFactureCaissier, data: IDepotBanqueCaissierBody) => void;
}

// SPEC-RECOUV-002 : referentiel simple des comptes Turbo (a remplacer par un
// vrai referentiel quand il existera). Choix libre possible via « Autre ».
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
 * Le depot en banque enregistre par le caissier.
 *
 * <h3>Ce qui change</h3>
 * <p>Les cinq champs etaient des controles nus (`<input type="date">`, `<select>`), dont
 * l'etat de focus etait peint en `focus:border-green-400`, une couleur qui ne veut rien
 * dire ici, et dont aucun n'annoncait son libelle a un lecteur d'ecran.</p>
 *
 * <p>Le bouton de confirmation etait DESACTIVE tant qu'un des cinq manquait, sans dire
 * lequel : sur un formulaire a cinq obligations, l'operateur ne pouvait que relire. Il
 * repond maintenant, et pointe le champ manquant.</p>
 */
export default function DepotBanqueCaissierModal({ open, onClose, facture, onConfirm }: Props) {
  const [date, setDate] = useState('');
  const [numeroBordereau, setNumeroBordereau] = useState('');
  const [banque, setBanque] = useState('');
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [preuve, setPreuve] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Partial<Record<Champ, string>>>({});

  /*
   * Le pre-remplissage prenait le montant FACTURE, pas l'encaisse recue.
   *
   * <p>Le maillon precedent de la chaine fait l'inverse : le versement au caissier est
   * pre-rempli avec `montantRecouvre`, et la carte du caissier annonce explicitement ce
   * qu'il DETIENT. Ici, une facture de 500 000 F recouvree a 300 000 F proposait
   * 500 000 F au depot, sous une mention « Doit egaler le montant vise » qui poussait a
   * valider tel quel.</p>
   *
   * <p>Le bordereau enregistrait alors 500 000 F pour 300 000 F sortis, et le
   * rapprochement classait la ligne CONCORDANT : l'ecart de 200 000 F n'apparaissait
   * nulle part.</p>
   */
  useEffect(() => {
    if (open && facture) {
      setDate('');
      setNumeroBordereau('');
      setBanque('');
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
      libelleAction="Confirmer le dépôt"
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
         * Le champ de fichier etait `className="hidden"` : hors du flux, il sort aussi de
         * l'ordre de tabulation, et le depot devenait impossible sans souris. `sr-only` le
         * masque a l'oeil en le laissant atteignable au clavier.
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
