'use client';

import { Chip } from '@heroui-v3/react';
import { addDays, endOfDay, format, getISOWeek, intervalToDuration, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCreneauActifQuery } from '../queries/creneau.query';

/**
 * Le bandeau de la semaine de creneaux en cours.
 *
 * <h3>Ce qui change</h3>
 * <p>L'etiquette de statut venait de la SECONDE bibliotheque de composants, et chacun de
 * ses quatre statuts portait ses couleurs ecrites a la main — `bg-orange-500`,
 * `bg-red-500`, `bg-blue-500`, `bg-green-600`, avec leurs teintes de survol, sur une
 * etiquette qui ne se survole pas. Quatre teintes de palette brute, aucune variante
 * sombre.</p>
 *
 * <p>Elles se reduisent a trois etats qui disent quelque chose : la saisie EN COURS est le
 * seul moment ou l'operateur a un geste a faire, et un compte a rebours court a cote —
 * c'est l'attention. La chaine ACHEVEE (V2 valide) est la reussite. Le verrouillage et le
 * premier visa sont des etapes intermediaires normales : elles restent neutres, comme les
 * etats d'attente de la chaine de visa des depenses.</p>
 *
 * <p>Le compte a rebours etait en `text-red-500`, sans variante sombre non plus. C'est une
 * echeance annoncee, pas une panne : il prend le jeton d'attention.</p>
 */

const STATUT_CONFIG: Record<string, { color: 'default' | 'success' | 'warning'; label: string }> = {
  OUVERT: { color: 'warning', label: 'Saisie en cours' },
  V1_VALIDE: { color: 'default', label: 'V1 Validé' },
  V2_VALIDE: { color: 'success', label: 'V2 Validé' },
  VERROUILLE: { color: 'default', label: 'Verrouillé' },
};

function computeCountdown(dateFin: Date): string {
  const end = endOfDay(dateFin);
  const now = new Date();
  if (end <= now) return '0j 00h 00min';
  const { days = 0, hours = 0, minutes = 0 } = intervalToDuration({ start: now, end });
  return `${days}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
}

function formatRange(dateDebut: string, dateFin: string): string {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  if (isSameMonth(debut, fin)) {
    return `Du ${format(debut, 'd')} au ${format(fin, 'd MMMM yyyy', { locale: fr })}`;
  }
  return `Du ${format(debut, 'd MMMM', { locale: fr })} au ${format(fin, 'd MMMM yyyy', { locale: fr })}`;
}

export function CreneauActifBanner() {
  const { data: creneau, isLoading } = useCreneauActifQuery();
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!creneau) return;
    const dateVerrouillage = addDays(creneau.dateFin, 3);
    setCountdown(computeCountdown(dateVerrouillage));
    const id = setInterval(() => setCountdown(computeCountdown(dateVerrouillage)), 60_000);
    return () => clearInterval(id);
  }, [creneau]);

  if (isLoading || !creneau) return null;

  const week = getISOWeek(new Date(creneau.dateDebut));
  const range = formatRange(creneau.dateDebut, creneau.dateFin);
  // Repli pour un statut inconnu du serveur : le code brut, sans ton, plutot que rien.
  const statut = STATUT_CONFIG[creneau.statut] ?? {
    color: 'default' as const,
    label: creneau.statut,
  };

  return (
    <div className="mb-4 rounded-lg border border-separator bg-surface px-5 py-4">
      <p className="text-base font-bold text-foreground">
        Semaine {week} — {range}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Statut :</span>
          <Chip color={statut.color} size="sm" variant="soft">
            <Chip.Label className="whitespace-nowrap">{statut.label}</Chip.Label>
          </Chip>
        </div>
        {countdown && (
          <div className="flex items-center gap-1.5 text-warning-soft-foreground">
            <Clock aria-hidden="true" className="size-4" />
            <span className="text-sm font-medium tabular-nums">Verrouillage auto dans {countdown}</span>
          </div>
        )}
      </div>
    </div>
  );
}
