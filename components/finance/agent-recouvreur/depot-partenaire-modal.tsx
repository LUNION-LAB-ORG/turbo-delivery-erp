'use client';

import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChampEnveloppe } from '@/components/commons/champs-formulaire';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  agentNom?: string;
  onConfirm: (
    facture: IFactureAgent,
    data: { date: string; montant: number; agent: string },
  ) => void;
}

// Date locale au format YYYY-MM-DD (le toISOString() partirait en UTC et
// decalerait d'un jour autour de minuit cote Abidjan).
function toLocalYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

/** Une valeur que l'agent lit sans pouvoir la changer : elle vient du systeme. */
function LigneLecture({
  aide,
  libelle,
  nombre,
  valeur,
}: {
  aide?: string;
  libelle: string;
  /** Un chiffre : chasse tabulaire, pour se comparer a celui d'a cote. */
  nombre?: boolean;
  valeur: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-separator py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="shrink-0 text-xs text-muted">{libelle}</span>
        <span
          className={`text-right text-sm font-medium text-foreground ${nombre ? 'tabular-nums' : ''}`}
        >
          {valeur}
        </span>
      </div>
      {aide && <p className="text-xs text-muted">{aide}</p>}
    </div>
  );
}

/**
 * Le depot de la facture chez le partenaire.
 *
 * <h3>Ce qui change</h3>
 * <p>Les trois valeurs en lecture seule etaient rendues comme des CHAMPS desactives
 * (bordure, fond, hauteur d'un `<input>`), dont deux etaient de vrais `<input disabled>`.
 * Un champ desactive invite a cliquer, ne repond pas, et n'est meme pas lu par les
 * lecteurs d'ecran. Ce sont des lignes de fiche, elles se lisent comme telles.</p>
 *
 * <p>Leurs libelles etaient introduits par des emojis (une pastille calendrier, un buste,
 * un maillon) qu'aucune synthese vocale ne sait annoncer utilement.</p>
 *
 * <p>Le bouton « Parcourir » etait un `<button>` DANS le `<label>` du champ de fichier :
 * un element interactif dans un autre, dont le clic simulait un clic sur l'input. Le
 * label ouvre deja le selecteur ; l'affordance reste, l'imbrication disparait.</p>
 */
export default function DepotPartenaireModal({
  open,
  onClose,
  facture,
  agentNom = '',
  onConfirm,
}: Props) {
  // Snapshot de la date a l'ouverture du modal. Le Recouvreur ne saisit plus
  // la date manuellement : elle est capturee automatiquement au moment ou il
  // ouvre la confirmation du depot.
  const [submissionMoment, setSubmissionMoment] = useState<Date>(() => new Date());
  const [fileName, setFileName] = useState<string | null>(null);

  // Re-snapshote le moment a chaque ouverture / changement de facture.
  useEffect(() => {
    if (open) {
      setSubmissionMoment(new Date());
      setFileName(null);
    }
  }, [open, facture?.id]);

  if (!facture) return null;

  function handleConfirm() {
    if (!facture) return;
    // Aucun montant recouvre au stade du depot : l'encaissement (acompte/solde)
    // se fait via le bouton « Encaisser » qui apparait une fois le depot enregistre.
    onConfirm(facture, {
      agent: agentNom,
      date: toLocalYMD(submissionMoment),
      montant: 0,
    });
    onClose();
  }

  return (
    <FenetreAction
      libelleAction="Enregistrer le dépôt"
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre="Déposer la facture chez le partenaire"
    >
      <div className="rounded-xl border border-separator bg-surface-secondary px-4 py-3">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {facture.partenaire}
        </p>
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <span className="text-sm font-bold text-foreground">{facture.numero}</span>
          {/* Le montant de la facture etait peint en rouge : il n'est ni une erreur ni un geste. */}
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatMontant(facture.montant)}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-separator px-4 py-1">
        <LigneLecture
          aide="Capturée automatiquement à l'ouverture du formulaire."
          libelle="Date du dépôt"
          valeur={dateFormatter.format(submissionMoment)}
        />
        <LigneLecture libelle="Agent recouvreur" valeur={agentNom || '—'} />
        <LigneLecture
          aide="Aucun paiement n'est saisi au dépôt : utilisez « Encaisser » après enregistrement pour ajouter un acompte ou solder la facture."
          libelle="Montant recouvré (cumul)"
          nombre
          valeur={formatMontant(0)}
        />
      </div>

      <ChampEnveloppe label="Preuve de dépôt">
        {/*
         * `className="hidden"` sortait le champ de fichier de l'ordre de tabulation :
         * joindre le bordereau devenait impossible sans souris.
         */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-separator bg-surface-secondary px-4 py-6 transition-colors hover:bg-surface-tertiary focus-within:border-accent">
          <Upload aria-hidden="true" className="size-5 text-muted" />
          {fileName ? (
            <p className="text-xs font-medium text-foreground">{fileName}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                Glissez-déposez le bordereau partenaire
              </p>
              <p className="text-xs text-muted">
                Bon de réception signé · PDF, PNG, JPG (max 10 Mo)
              </p>
            </>
          )}
          <span className="rounded-lg border border-separator px-4 py-1.5 text-xs font-medium text-foreground">
            Parcourir
          </span>
          <input
            accept=".pdf,.png,.jpg,.jpeg"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            type="file"
          />
        </label>
      </ChampEnveloppe>
    </FenetreAction>
  );
}
