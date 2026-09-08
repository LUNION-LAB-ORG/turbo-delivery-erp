'use client';

import { Alert, Spinner } from '@heroui-v3/react';
import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChampEnveloppe, ChampZoneTexte } from '@/components/commons/champs-formulaire';
import type { IAgentFacture } from '@/features/agent-recouvreur';

import { formatMontant } from './agent-recouvreur-columns';

/** Restant du d'une facture (montant total − deja recouvre). */
export function resteAEncaisser(f: IAgentFacture) {
  return Math.max(0, f.montant - (f.montantRecouvre ?? 0));
}

interface Props {
  open: boolean;
  onClose: () => void;
  factures: IAgentFacture[];
  running: boolean;
  progress: { done: number; total: number };
  onConfirm: (shared: { preuve?: string; remarque?: string }) => void;
}

/**
 * Encaissement en masse : marque chaque facture selectionnee comme « soldee a
 * 100% » (paiement de type Solde = restant du). Un seul justificatif + une seule
 * remarque, optionnels, appliques a tout le lot. La logique d'enregistrement
 * (boucle sur la mutation d'encaissement unitaire) vit dans agent-recouvreur-view.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre etait montee a la main, avec un fond `bg-black/50` en dur et une croix de
 * fermeture sans nom accessible. Pendant l'encaissement, cette croix restait la SEULE
 * sortie et elle etait desactivee : la fenetre ne se fermait plus, et le clic sur le fond
 * etait neutralise lui aussi.</p>
 *
 * <p>Les montants du lot etaient en chasse proportionnelle, alignes a gauche, sous un
 * total qui l'etait aussi : on ne pouvait pas verifier d'un coup d'oeil que la somme des
 * lignes faisait le total annonce.</p>
 */
export default function EncaisserLotModal({
  open,
  onClose,
  factures,
  running,
  progress,
  onConfirm,
}: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [preuveDataUrl, setPreuveDataUrl] = useState<string | null>(null);
  const [remarque, setRemarque] = useState('');

  useEffect(() => {
    if (open) {
      setFileName(null);
      setPreuveDataUrl(null);
      setRemarque('');
    }
  }, [open]);

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

  const total = factures.reduce((s, f) => s + resteAEncaisser(f), 0);

  /*
   * Sans facture eligible, le bouton est INERTE, pas silencieux.
   *
   * <p>Il se contentait de sortir au clic. L'ecran affichait alors « Encaisser 0
   * facture(s) a 100% » a plein contraste, le bouton s'enfoncait, et rien ne se passait.
   * Le corps de la fenetre disait bien « Aucune facture eligible selectionnee », mais un
   * bouton qui a l'air de marcher contredit le texte a cote de lui. `FenetreAction` sait
   * desormais neutraliser son action.</p>
   */
  const rienAEncaisser = factures.length === 0;

  function handleConfirm() {
    if (rienAEncaisser) return;
    onConfirm({ preuve: preuveDataUrl ?? undefined, remarque: remarque.trim() || undefined });
  }

  return (
    <FenetreAction
      actionInactive={rienAEncaisser}
      enAttente={running}
      libelleAction={
        running ? 'Encaissement…' : `Encaisser ${factures.length} facture(s) à 100%`
      }
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre="Encaisser la sélection à 100%"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted">{factures.length} facture(s) sélectionnée(s)</span>
        <span className="text-sm font-bold tabular-nums text-foreground">
          {formatMontant(total)}
        </span>
      </div>

      <Alert status="default">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>
            Chaque facture ci-dessous sera enregistrée comme <strong>réglée à 100%</strong>{' '}
            (paiement « Solde » du restant dû, daté d&apos;aujourd&apos;hui). Le versement au
            caissier reste une étape séparée.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="max-h-56 divide-y divide-separator overflow-y-auto rounded-xl border border-separator">
        {factures.map((f) => (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5" key={f.id}>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{f.numero}</p>
              <p className="truncate text-xs text-muted">{f.partenaire}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatMontant(resteAEncaisser(f))}
            </p>
          </div>
        ))}
        {factures.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted">
            Aucune facture éligible sélectionnée.
          </p>
        )}
      </div>

      <ChampEnveloppe label="Justificatif partagé (optionnel, appliqué à tout le lot)">
        {/*
         * `className="hidden"` sortait le champ de fichier de l'ordre de tabulation :
         * joindre le justificatif devenait impossible sans souris.
         */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-separator bg-surface-secondary px-4 py-4 transition-colors hover:bg-surface-tertiary focus-within:border-accent">
          <Upload aria-hidden="true" className="size-5 text-muted" />
          {fileName ? (
            <p className="text-xs font-medium text-foreground">{fileName}</p>
          ) : (
            <p className="text-center text-xs text-muted">
              Choisir un fichier
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

      <ChampZoneTexte
        label="Remarque partagée (optionnel)"
        lignes={2}
        onChange={setRemarque}
        placeholder="Ex. : encaissement groupé AL DAR du jour…"
        valeur={remarque}
      />

      {running && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Spinner color="current" size="sm" />
          <span className="tabular-nums">
            Encaissement en cours… {progress.done}/{progress.total}
          </span>
        </p>
      )}
    </FenetreAction>
  );
}
