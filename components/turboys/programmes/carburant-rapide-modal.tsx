'use client';

import { Label, NumberField } from '@heroui-v3/react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useModifierProgrammeMutation } from '@/features/turboys/queries/programme.query';
import type { IProgramme } from '@/features/turboys/types/programme.types';
import { joursTravailles } from '@/features/turboys/utils/carburant.utils';
import { formatMontant } from '@/utils/format.utils';

import { joursAvecDates, normaliserJours } from './weekly-jours-editor';

/**
 * Le carburant d'un programme, en un geste.
 *
 * <p>Le carburant se pense comme un forfait par personne et par jour travaillé : c'est
 * ainsi que le document papier le posait, et c'est ainsi que les Opérations le
 * saisissent. Ouvrir la modale complète pour toucher six champs identiques, sur vingt
 * programmes déjà publiés, n'avait pas de sens. Un montant, appliqué à chaque jour
 * travaillé, et le total qui en découle, écrit avant d'enregistrer.</p>
 *
 * <p>Le programme n'est pas renvoyé au livreur : le serveur distingue un changement de
 * planning d'une saisie de carburant, et celle-ci ne touche ni au statut ni à
 * l'acceptation. Le total figé de la semaine, lui, suit.</p>
 */
export function CarburantRapideModal({
  isOpen,
  onOpenChange,
  programme,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programme: IProgramme | null;
}) {
  const jours = React.useMemo(() => normaliserJours(programme?.jours), [programme]);
  const nbTravailles = joursTravailles(jours);

  // Si tous les jours travaillés portent déjà le même montant, on le propose ; sinon rien.
  const montantCommun = React.useMemo(() => {
    const montants = new Set(jours.filter((j) => j.actif).map((j) => j.montantCarburant ?? null));
    return montants.size === 1 ? [...montants][0] : null;
  }, [jours]);

  const [montant, setMontant] = React.useState<number>(NaN);
  React.useEffect(() => {
    if (isOpen) setMontant(montantCommun ?? NaN);
  }, [isOpen, montantCommun]);

  const modifier = useModifierProgrammeMutation(() => onOpenChange(false));
  const valide = Number.isFinite(montant) && montant >= 0;
  const total = valide ? montant * nbTravailles : null;

  const enregistrer = () => {
    if (!programme || !valide) return;
    const nouveaux = jours.map((j) => (j.actif ? { ...j, montantCarburant: montant } : j));
    modifier.mutate({ id: programme.id, jours: joursAvecDates(nouveaux, programme.annee, programme.semaine) });
  };

  return (
    <FenetreAction
      enAttente={modifier.isPending}
      libelleAction={total === null ? 'Enregistrer' : `Enregistrer ${formatMontant(total)}`}
      onAction={valide ? enregistrer : undefined}
      onFermer={() => onOpenChange(false)}
      ouvert={isOpen}
      titre={`Carburant de ${programme?.livreurNom ?? 'ce livreur'}`}
    >
      <p className="text-sm text-muted">
        Semaine {programme?.semaine} / {programme?.annee},{' '}
        <span className="tabular-nums">
          {nbTravailles} jour{nbTravailles > 1 ? 's' : ''} travaillé{nbTravailles > 1 ? 's' : ''}
        </span>
        . Le montant s&apos;applique à chacun d&apos;eux ; les jours de repos ne coûtent rien.
      </p>
      <NumberField
        formatOptions={{ maximumFractionDigits: 0 }}
        isDisabled={modifier.isPending || nbTravailles === 0}
        minValue={0}
        onChange={(v) => setMontant(Number.isFinite(v) ? v : NaN)}
        step={500}
        value={montant}
      >
        <Label>Montant par jour travaillé</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input className="text-end tabular-nums" placeholder="4 000" />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Total de la semaine</span>
        <span className="font-semibold tabular-nums text-foreground">
          {total === null ? 'Saisissez un montant' : formatMontant(total)}
        </span>
      </div>
      {nbTravailles === 0 && (
        <p className="text-xs text-muted">Ce programme n&apos;a aucun jour travaillé : rien à quoi appliquer un montant.</p>
      )}
      <p className="text-xs text-muted">
        Le programme n&apos;est pas renvoyé au livreur : il ne voit pas le carburant, et ce qu&apos;il a accepté ne change pas.
      </p>
    </FenetreAction>
  );
}
