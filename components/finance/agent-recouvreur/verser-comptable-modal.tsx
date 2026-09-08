'use client';

import { Paperclip } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChampDate, ChampEnveloppe, ChampMontant } from '@/components/commons/champs-formulaire';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  // V52 (2026-05) : data.preuve = data URL base64 du recu uploade.
  // Optional pour retrocompat avec les callers historiques.
  onConfirm: (
    facture: IFactureAgent,
    data: { montant: number; date: string; preuve?: string },
  ) => void;
}

/**
 * Le versement de l'encaisse au caissier.
 *
 * <h3>Ce qui change</h3>
 * <p>Le total collecte disponible etait ecrit en `text-red-500` dans le bandeau de titre :
 * du rouge de marque sur le chiffre de reference du formulaire, qui n'appelle aucun geste
 * et n'est pas une erreur. Il descend dans le corps, en chasse tabulaire, a cote du
 * montant saisi, car c'est la comparaison des deux qui compte.</p>
 *
 * <p>Le champ « Montant verse » etait un `<input type="number">` nu : sans libelle lie,
 * sans etat d'erreur, et le bouton de confirmation partait meme a zero. Il reste libre
 * (un versement partiel est legitime), mais un montant vide est desormais refuse et dit.</p>
 */
export default function VerserComptableModal({ open, onClose, facture, onConfirm }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [montant, setMontant] = useState<number | undefined>(undefined);
  const [date, setDate] = useState(today);
  const [fileName, setFileName] = useState<string | null>(null);
  // V52 : data URL base64 envoyee au backend (avant : seul le nom du
  // fichier etait capture, le contenu etait perdu).
  const [preuveDataUrl, setPreuveDataUrl] = useState<string | null>(null);
  const [erreurMontant, setErreurMontant] = useState<string>();

  useEffect(() => {
    if (open && facture) {
      setMontant(facture.montantRecouvre ?? facture.montant);
      setDate(today);
      setFileName(null);
      setPreuveDataUrl(null);
      setErreurMontant(undefined);
    }
    // `today` est une chaine recalculee a chaque rendu mais de valeur constante :
    // la lister ne relance pas l'effet, elle evite seulement la dependance manquante.
  }, [facture, open, today]);

  if (!facture) return null;

  const totalCollecte = facture.montantRecouvre ?? facture.montant;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setPreuveDataUrl(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreuveDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    if (!facture) return;
    if (!montant || montant <= 0) {
      setErreurMontant('Indiquez le montant versé au caissier.');
      return;
    }
    onConfirm(facture, { date, montant, preuve: preuveDataUrl ?? undefined });
    onClose();
  }

  return (
    <FenetreAction
      libelleAction="Confirmer le versement"
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre="Versement au caissier"
    >
      <div className="flex items-baseline justify-between gap-3 rounded-xl border border-separator bg-surface-secondary px-4 py-3">
        <span className="text-xs text-muted">Total collecté disponible</span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatMontant(totalCollecte)}
        </span>
      </div>

      <ChampMontant
        erreur={erreurMontant}
        label="Montant versé (FCFA)"
        onChange={(v) => {
          setMontant(Number.isNaN(v) ? undefined : v);
          setErreurMontant(undefined);
        }}
        valeur={montant}
      />

      <ChampDate label="Date de versement" onChange={setDate} valeur={date} />

      <ChampEnveloppe label="Preuve de versement">
        {/*
         * Le champ de fichier etait `className="hidden"`, donc hors de l'ordre de
         * tabulation : le recu ne pouvait pas etre joint au clavier.
         */}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-separator bg-surface-secondary px-4 py-4 transition-colors hover:bg-surface-tertiary focus-within:border-accent">
          <Paperclip aria-hidden="true" className="size-4 shrink-0 text-muted" />
          <span className="truncate text-sm text-muted">{fileName ?? 'Téléverser le reçu'}</span>
          <input
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={handleFileChange}
            type="file"
          />
        </label>
      </ChampEnveloppe>
    </FenetreAction>
  );
}
