'use client';

import { Label, NumberField } from '@heroui-v3/react';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { modifierProgrammeAction } from '@/features/turboys/actions/programme.actions';
import { programmeKeys } from '@/features/turboys/queries/programme.query';
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
 *
 * <h3>En lot</h3>
 * <p>Le même geste sur les lignes cochées : un montant, appliqué aux jours travaillés de
 * chaque programme. Les envois se font un par un, et le compte des échecs est rendu ; une
 * ligne dont l'envoi échoue garde son état, et l'opérateur le voit.</p>
 */
export function CarburantRapideModal({
  isOpen,
  onOpenChange,
  programmes,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Un programme, ou les lignes cochées. */
  programmes: IProgramme[];
}) {
  const cibles = React.useMemo(
    () => programmes.map((p) => ({ jours: normaliserJours(p.jours), programme: p })),
    [programmes],
  );
  const nbTravailles = cibles.reduce((t, c) => t + joursTravailles(c.jours), 0);
  const plusieurs = cibles.length > 1;

  // Si tous les jours travaillés portent déjà le même montant, on le propose ; sinon rien.
  const montantCommun = React.useMemo(() => {
    const montants = new Set(
      cibles.flatMap((c) => c.jours.filter((j) => j.actif).map((j) => j.montantCarburant ?? null)),
    );
    return montants.size === 1 ? [...montants][0] : null;
  }, [cibles]);

  const [montant, setMontant] = React.useState<number>(NaN);
  React.useEffect(() => {
    if (isOpen) setMontant(montantCommun ?? NaN);
  }, [isOpen, montantCommun]);

  const qc = useQueryClient();
  const [enCours, setEnCours] = React.useState(false);
  const valide = Number.isFinite(montant) && montant >= 0;
  const total = valide ? montant * nbTravailles : null;

  const enregistrer = async () => {
    if (cibles.length === 0 || !valide || enCours) return;
    setEnCours(true);
    let ok = 0;
    const raisons: string[] = [];
    try {
      for (const { jours, programme } of cibles) {
        const nouveaux = jours.map((j) => (j.actif ? { ...j, montantCarburant: montant } : j));
        const r = await modifierProgrammeAction({
          id: programme.id,
          jours: joursAvecDates(nouveaux, programme.annee, programme.semaine),
        });
        if (r.success) ok += 1;
        else if (r.error && !raisons.includes(r.error)) raisons.push(r.error);
      }
      await qc.invalidateQueries({ queryKey: programmeKeys.all });
      const echecs = cibles.length - ok;
      if (echecs === 0) {
        toast.success(plusieurs ? `Carburant enregistré sur ${ok} programmes.` : 'Carburant enregistré.');
        onOpenChange(false);
      } else {
        toast.warning(`${ok} enregistré${ok > 1 ? 's' : ''}, ${echecs} en échec${raisons.length ? ` : ${raisons.join(' ; ')}` : ''}.`);
      }
    } finally {
      setEnCours(false);
    }
  };

  const titre = plusieurs
    ? `Carburant de ${cibles.length} programmes`
    : `Carburant de ${cibles[0]?.programme.livreurNom ?? 'ce livreur'}`;

  return (
    <FenetreAction
      enAttente={enCours}
      libelleAction={total === null ? 'Enregistrer' : `Enregistrer ${formatMontant(total)}`}
      onAction={valide ? () => void enregistrer() : undefined}
      onFermer={() => onOpenChange(false)}
      ouvert={isOpen}
      titre={titre}
    >
      <p className="text-sm text-muted">
        {plusieurs ? `${cibles.length} programmes cochés, ` : `Semaine ${cibles[0]?.programme.semaine} / ${cibles[0]?.programme.annee}, `}
        <span className="tabular-nums">
          {nbTravailles} jour{nbTravailles > 1 ? 's' : ''} travaillé{nbTravailles > 1 ? 's' : ''}
        </span>
        {plusieurs ? ' en tout' : ''}. Le montant s&apos;applique à chacun d&apos;eux ; les jours de repos ne coûtent rien.
      </p>
      <NumberField
        formatOptions={{ maximumFractionDigits: 0 }}
        isDisabled={enCours || nbTravailles === 0}
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
        <span className="text-muted">{plusieurs ? 'Total des programmes cochés' : 'Total de la semaine'}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {total === null ? 'Saisissez un montant' : formatMontant(total)}
        </span>
      </div>
      {nbTravailles === 0 && (
        <p className="text-xs text-muted">
          {plusieurs ? 'Aucun de ces programmes' : 'Ce programme'} n&apos;a de jour travaillé : rien à quoi appliquer un montant.
        </p>
      )}
      <p className="text-xs text-muted">
        {plusieurs ? 'Les programmes ne sont pas renvoyés aux livreurs' : 'Le programme n\u2019est pas renvoyé au livreur'} : ils ne voient pas
        le carburant, et ce qu&apos;ils ont accepté ne change pas.
      </p>
    </FenetreAction>
  );
}
