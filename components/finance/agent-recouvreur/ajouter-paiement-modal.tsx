'use client';

import { Label, Radio, RadioGroup } from '@heroui-v3/react';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  ChampDate,
  ChampEnveloppe,
  ChampMontant,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

export interface IPaiement {
  id: string;
  type: 'Acompte' | 'Solde';
  date: string;
  montant: number;
  preuve?: string;
  remarque?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  montantDejaRecouvre: number;
  onConfirm: (paiement: Omit<IPaiement, 'id'>) => void;
}

/** Les trois chiffres du haut : ils ne valent que compares les uns aux autres. */
function ColonneMontant({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs text-muted">{libelle}</span>
      <span className="text-sm font-bold tabular-nums text-foreground">
        {formatMontant(valeur)}
      </span>
    </div>
  );
}

/**
 * L'enregistrement d'un paiement sur une facture en recouvrement.
 *
 * <h3>Ce qui change</h3>
 * <p>Le choix « Acompte / Solde » etait fait de deux `<button>` peints en bleu quand ils
 * etaient retenus : rien n'indiquait a un lecteur d'ecran qu'il s'agissait d'un choix
 * exclusif, ni lequel des deux etait actif. C'est un groupe de boutons radio.</p>
 *
 * <p>Le bandeau de resume etait `bg-blue-50 border-blue-100`, le restant du a recouvrer
 * `text-red-500`, et les libelles introduits par des emojis (calendrier, billet). Les
 * trois montants etaient en chasse proportionnelle, alignes a gauche : c'est pourtant leur
 * comparaison qui decide du type de paiement.</p>
 *
 * <p>Enfin le bouton d'enregistrement etait DESACTIVE tant que la date ou le montant
 * manquaient, sans dire lequel.</p>
 */
export default function AjouterPaiementModal({
  open,
  onClose,
  facture,
  montantDejaRecouvre,
  onConfirm,
}: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<'Acompte' | 'Solde'>('Acompte');
  const [date, setDate] = useState(today);
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [fileName, setFileName] = useState<string | null>(null);
  // V52 (2026-05) : on stocke aussi le contenu en data URL base64 pour
  // l'envoi au backend. Avant : seul le nom du fichier etait capture,
  // donc la preuve etait silencieusement perdue au backend (champ DTO
  // recevait juste un nom de fichier sans contenu).
  const [preuveDataUrl, setPreuveDataUrl] = useState<string | null>(null);
  const [remarque, setRemarque] = useState('');
  const [erreurs, setErreurs] = useState<{ date?: string; montant?: string }>({});

  useEffect(() => {
    if (open) {
      setType('Acompte');
      setDate(today);
      setMontant(undefined);
      setFileName(null);
      setPreuveDataUrl(null);
      setRemarque('');
      setErreurs({});
    }
  }, [open, today]);

  if (!facture) return null;

  const restant = facture.montant - montantDejaRecouvre;

  // Auto-selectionner « Solde » quand le montant saisi couvre le restant du.
  function handleMontantChange(value: number) {
    const valide = Number.isNaN(value) ? undefined : value;
    setMontant(valide);
    setErreurs((e) => ({ ...e, montant: undefined }));
    const v = valide ?? 0;
    if (v > 0 && restant > 0 && v >= restant) setType('Solde');
    else if (v < restant) setType('Acompte');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setPreuveDataUrl(null);
      return;
    }
    setFileName(file.name);
    // V52 : lire le fichier en data URL base64 pour l'envoyer au backend.
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreuveDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    const manque: { date?: string; montant?: string } = {};
    if (!date) manque.date = 'Indiquez la date du paiement.';
    if (!montant || montant <= 0) manque.montant = 'Indiquez le montant reçu.';
    if (Object.keys(manque).length > 0) {
      setErreurs(manque);
      return;
    }
    // V52 : envoyer la data URL base64 (pas juste le nom du fichier comme
    // avant) pour que le backend puisse persister la preuve.
    onConfirm({
      date,
      montant: montant as number,
      preuve: preuveDataUrl ?? undefined,
      remarque: remarque || undefined,
      type,
    });
    onClose();
  }

  return (
    <FenetreAction
      libelleAction="Enregistrer le paiement"
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre={`Ajouter un paiement sur la facture ${facture.numero}`}
    >
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3">
        <ColonneMontant libelle="Montant total" valeur={facture.montant} />
        <ColonneMontant libelle="Déjà recouvré" valeur={montantDejaRecouvre} />
        <ColonneMontant libelle="Restant à recouvrer" valeur={restant} />
      </div>

      <RadioGroup
        onChange={(v) => setType(v as 'Acompte' | 'Solde')}
        value={type}
      >
        <Label>Type de paiement</Label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { description: 'Paiement partiel', valeur: 'Acompte' },
              { description: 'Paiement total', valeur: 'Solde' },
            ] as const
          ).map((choix) => (
            <Radio key={choix.valeur} value={choix.valeur}>
              <Radio.Content className="flex w-full items-center gap-3">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <span className="flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{choix.valeur}</span>
                  <span className="text-xs text-muted">{choix.description}</span>
                </span>
              </Radio.Content>
            </Radio>
          ))}
        </div>
      </RadioGroup>

      <ChampDate
        erreur={erreurs.date}
        label="Date du paiement"
        onChange={(v) => {
          setDate(v);
          setErreurs((e) => ({ ...e, date: undefined }));
        }}
        valeur={date}
      />

      <ChampMontant
        erreur={erreurs.montant}
        label="Montant (FCFA)"
        onChange={handleMontantChange}
        valeur={montant}
      />

      <ChampEnveloppe label="Preuve de paiement">
        {/*
         * `className="hidden"` sortait le champ de fichier de l'ordre de tabulation :
         * joindre la preuve devenait impossible sans souris.
         */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-separator bg-surface-secondary px-4 py-5 transition-colors hover:bg-surface-tertiary focus-within:border-accent">
          <Upload aria-hidden="true" className="size-5 text-muted" />
          {fileName ? (
            <p className="text-xs font-medium text-foreground">{fileName}</p>
          ) : (
            <p className="text-center text-xs text-muted">
              Choisir pour télécharger
              <br />
              PNG, JPG ou PDF (max 10 Mo)
            </p>
          )}
          <input
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={handleFileChange}
            type="file"
          />
        </label>
      </ChampEnveloppe>

      {/*
       * Le libelle de la remarque portait une case a cocher NON BRANCHEE : elle ne
       * pilotait rien, ne se lisait nulle part, et laissait croire qu'il fallait la cocher
       * pour que la remarque soit prise en compte. Le champ, lui, a toujours ete envoye.
       */}
      <ChampZoneTexte
        label="Remarque (optionnel)"
        lignes={2}
        onChange={setRemarque}
        placeholder="Écrivez des remarques sur ce paiement…"
        valeur={remarque}
      />
    </FenetreAction>
  );
}
