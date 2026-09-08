'use client';

import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChampTexte } from '@/components/commons/champs-formulaire';
import type { IFactureCaissier } from '@/features/caissier';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureCaissier | null;
  onConfirm: (facture: IFactureCaissier, data: { reference: string }) => void;
}

/**
 * L'enregistrement de la fiche de paiement, cote caisse.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre etait une coquille montee a la main : un `createPortal` vers
 * `#modal-portal`, un fond `bg-black/50` ecrit en dur, un bandeau `bg-indigo-50` avec un
 * texte `text-indigo-900`, et une croix de fermeture faite d'un `<button>` nu sans nom
 * accessible. Rien de tout cela ne suivait le theme sombre.</p>
 *
 * <p>Le bouton d'enregistrement etait DESACTIVE tant que la reference etait vide, sans
 * jamais dire pourquoi. Il est maintenant cliquable et repond : la reference manquante
 * s'affiche sous le champ, la ou l'operateur regarde.</p>
 */
export default function ConfirmerReceptionModal({ open, onClose, facture, onConfirm }: Props) {
  const [reference, setReference] = useState('');
  const [erreur, setErreur] = useState<string>();

  useEffect(() => {
    if (open) {
      setReference('');
      setErreur(undefined);
    }
  }, [open]);

  if (!facture) return null;

  function handleConfirm() {
    if (!facture) return;
    if (!reference.trim()) {
      setErreur('La référence de la fiche de paiement est obligatoire.');
      return;
    }
    onConfirm(facture, { reference });
    onClose();
  }

  return (
    <FenetreAction
      libelleAction="Enregistrer la fiche"
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre="Enregistrer la fiche de paiement"
    >
      {/* Le numero et le partenaire vivaient dans le bandeau de titre : la fenetre
          partagee n'a qu'un titre, ils descendent donc dans le corps ou ils restent lus. */}
      <div className="flex flex-col gap-2 rounded-xl border border-separator bg-surface-secondary px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Facture</span>
          <span className="text-sm font-medium text-foreground">{facture.numero}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Partenaire</span>
          <span className="text-sm text-foreground">{facture.partenaire}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted">Montant recouvré</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatMontant(facture.montantRecouvre ?? facture.montant)}
          </span>
        </div>
      </div>

      <ChampTexte
        aide="Obligatoire."
        erreur={erreur}
        label="Référence fiche de paiement"
        onChange={(v) => {
          setReference(v);
          if (erreur) setErreur(undefined);
        }}
        placeholder="Ex : FP-2026-0042"
        valeur={reference}
      />
    </FenetreAction>
  );
}
