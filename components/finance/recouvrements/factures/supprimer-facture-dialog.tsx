'use client';

import { Checkbox } from '@heroui-v3/react';
import { AlertTriangle, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useSupprimerFactureMutation } from '@/features/recouvrements/queries/facture.mutation';
import { getStatutLabel } from '@/features/recouvrements/utils/facture.utils';

import {
  LIBELLE_COMPOSANTE,
  useApercuSuppressionQuery,
} from '@/features/facturation-plage';

interface SupprimerFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatJour = (d?: string) => {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd MMM yyyy', { locale: fr });
  } catch {
    return d;
  }
};

export const SupprimerFactureDialog = ({ facture, open, onOpenChange }: SupprimerFactureDialogProps) => {
  const { mutate: supprimerFacture, isPending: isLoading } = useSupprimerFactureMutation();

  // RG-06 / §5.3 : on demande au serveur ce que la suppression va emporter AVANT de
  // proposer de confirmer. Sans ça, supprimer une facture de frais laissait sa jumelle
  // de commission seule dans les encours, sans que rien ne l'annonce.
  const {
    data: apercu,
    isError: apercuEnErreur,
    isFetching: apercuEnCours,
    refetch: relancerApercu,
  } = useApercuSuppressionQuery(facture.id, open);
  const [supprimerLiee, setSupprimerLiee] = useState(false);
  const [motif, setMotif] = useState('');

  useEffect(() => {
    if (!open) {
      // Le choix ne doit jamais survivre à la fermeture : le rouvrir sur une AUTRE
      // facture avec « supprimer la jumelle » déjà coché emporterait une facture que
      // personne n'a demandé de supprimer.
      setSupprimerLiee(false);
      setMotif('');
    }
  }, [open]);

  const montantRegle = facture.montantRegle || 0;
  const aDesEncaissements = montantRegle > 0;
  const aUneJumelle = Boolean(apercu?.factureLieeId);

  const handleDelete = () => {
    supprimerFacture(
      { id: facture.id, motif: motif.trim() || undefined, supprimerLiee },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <FenetreAction
      destructif
      enAttente={isLoading}
      libelleAction={supprimerLiee ? 'Supprimer les 2 factures' : 'Supprimer définitivement'}
      onAction={handleDelete}
      onFermer={() => onOpenChange(false)}
      ouvert={open}
      titre="Supprimer définitivement la facture ?"
    >
      <p className="text-sm text-foreground">
        La facture <strong>{facture.code}</strong> du restaurant{' '}
        <strong>{facture.restaurantName}</strong> sera <strong>définitivement supprimée</strong>. À
        utiliser pour retirer un <strong>doublon</strong> ou une facture erronée.
      </p>

      {/* Identité de la facture : pour bien supprimer la BONNE parmi des doublons proches. */}
      <div className="space-y-1 rounded-md border border-separator bg-surface-secondary p-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Type / période</span>
          <span className="text-right font-medium capitalize tabular-nums">
            {facture.type?.toLowerCase()} · {formatJour(facture.periodeDebut)} → {formatJour(facture.periodeFin)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Montant</span>
          <span className="text-right font-semibold tabular-nums">{formatCFA(facture.montant || 0)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Statut</span>
          <span className="text-right font-medium">{getStatutLabel(facture.statut)}</span>
        </div>
      </div>

      <div className="space-y-1 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
        <p className="font-medium text-danger-soft-foreground">Cette action supprime définitivement :</p>
        <ul className="list-disc pl-5 text-muted">
          <li>la facture et tout son historique finance ;</li>
          <li>les encaissements/recouvrements qui ne portent que sur cette facture ;</li>
          <li>les contestations rattachées.</li>
        </ul>
      </div>

      {/* L'avertissement etait peint en `amber-50` / `amber-700`, deux teintes de palette
          sans variante sombre : du brun sur un fond creme en theme sombre. Les jetons
          d'attention du theme suivent les deux. L'emoji cede la place a une icone. */}
      {aDesEncaissements && (
        <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm font-medium text-warning-soft-foreground">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Cette facture a déjà <span className="tabular-nums">{formatCFA(montantRegle)}</span>{' '}
            encaissé. Vérifiez bien que c&apos;est le doublon à supprimer avant de continuer.
          </span>
        </p>
      )}

      {/* Apercu en echec : sans ce bloc, l'absence de jumelle etait AFFIRMEE alors qu'elle
          n'avait pas pu etre verifiee, et la facture liee restait seule dans les encours. */}
      {apercuEnErreur && (
        <EtatErreur
          quoi="les factures liées"
          onReessayer={() => relancerApercu()}
          enCours={apercuEnCours}
        />
      )}

      {aUneJumelle && (
        <div className="space-y-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-warning-soft-foreground">
            <Link2 aria-hidden="true" className="size-4" />
            Cette facture est liée à une autre
          </p>
          <p className="text-foreground">
            <strong>{apercu?.factureLieeCode}</strong> porte{' '}
            {LIBELLE_COMPOSANTE[apercu?.factureLieeComposante ?? ''] ??
              apercu?.factureLieeComposante}{' '}
            sur la même période, pour{' '}
            <span className="tabular-nums">{formatCFA(apercu?.factureLieeMontant ?? 0)}</span>. Les
            deux couvrent ensemble la totalité de ce qui est facturé au partenaire.
          </p>
          {/* Une case a cocher nue, sans etat de focus ni nom accessible, decidait du sort
              d'une SECONDE facture. Celle de la v3 porte les deux. */}
          <Checkbox isSelected={supprimerLiee} onChange={setSupprimerLiee}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="flex-1 text-sm text-foreground">
                Supprimer aussi <strong>{apercu?.factureLieeCode}</strong>
                <span className="block text-xs font-normal text-muted">
                  Décoché, la facture liée est conservée et son lien est retiré. Elle reste seule
                  dans les encours sur cette période.
                </span>
              </span>
            </Checkbox.Content>
          </Checkbox>
        </div>
      )}

      <ChampTexte
        aide="Journalisé avec votre nom et la période libérée (RG-06)."
        label="Motif de la suppression"
        onChange={setMotif}
        placeholder="Ex. doublon de la facture F20260801-AGHA-00123"
        valeur={motif}
      />

      <p className="text-xs text-muted">
        Action <strong>irréversible</strong> : la facture ne pourra pas être récupérée. La période
        qu&apos;elle couvrait redevient facturable.
      </p>
    </FenetreAction>
  );
};
