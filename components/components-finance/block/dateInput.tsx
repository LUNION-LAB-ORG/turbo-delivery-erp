'use client';

import React from 'react';

import { ChampDate } from '@/components/commons/champs-formulaire';

/**
 * Le choix d'une date, dans les filtres finance.
 *
 * <h3>Ce qui change</h3>
 * <p>Le champ montait quatre composants de la SECONDE bibliotheque (Input, Button,
 * Popover, Calendar) et lisait la saisie libre avec `chrono-node`, dont l'analyseur est
 * ANGLAIS : « 01/02/2025 » y vaut le 2 janvier, pas le 1er fevrier. Sur un ecran francais
 * qui filtre des livraisons par date, la saisie au clavier partait donc un mois plus tot
 * sans que rien ne le signale. Les segments jour / mois / annee de la v3 se saisissent au
 * clavier eux aussi, chacun a sa place, sans interpretation.</p>
 *
 * <p>Ce qui disparait, et c'est voulu : le langage naturel anglais (« tomorrow », « next
 * friday »), qui n'a jamais eu de sens ici.</p>
 *
 * <p>Ce qui apparait : on peut EFFACER la date. L'ancien champ n'appelait `onChange` que
 * lorsqu'une date etait comprise ; vider la saisie laissait donc le filtre en place, et
 * la seule sortie etait de recharger la page.</p>
 *
 * <p>Le texte d'invite devient l'INTITULE du champ. En invite il disparaissait des qu'une
 * date etait choisie, et il ne restait plus rien pour dire ce que cette date filtrait.</p>
 */

type CalendarInputProps = {
  className?: string;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  value?: Date;
};

/**
 * Le format que `ChampDate` echange, en heure LOCALE : `toISOString` decalerait d'un jour.
 *
 * <p>L'annee tient sur QUATRE chiffres, meme quand elle en compte moins. En saisissant
 * « 2026 » au clavier, le champ passe par les annees 2, 20 puis 202 : rendue « 202-03-12 »,
 * cette etape n'est pas une date ISO, `ChampDate` ne la relit pas, et le jour et le mois
 * deja saisis se vidaient sous les doigts de l'operateur.</p>
 */
function enTexte(date?: Date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const annee = String(date.getFullYear()).padStart(4, '0');
  const mois = String(date.getMonth() + 1).padStart(2, '0');
  const jour = String(date.getDate()).padStart(2, '0');
  return `${annee}-${mois}-${jour}`;
}

function enDate(texte: string) {
  if (!texte) return undefined;
  const [annee, mois, jour] = texte.split('-').map(Number);
  if (!annee || !mois || !jour) return undefined;
  // `new Date(an, ...)` renvoie 1902 pour l'an 2 : le constructeur decale les annees a
  // deux chiffres dans les annees 1900. `setFullYear` prend l'annee telle quelle.
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(annee, mois - 1, jour);
  return date;
}

export function CalendarInput({ className, onChange, placeholder, value }: CalendarInputProps) {
  return (
    <div className={className}>
      <ChampDate
        label={placeholder ?? 'Date'}
        onChange={(texte) => onChange?.(enDate(texte))}
        valeur={enTexte(value)}
      />
    </div>
  );
}
