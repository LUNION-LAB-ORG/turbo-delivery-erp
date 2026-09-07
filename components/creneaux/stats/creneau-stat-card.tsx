'use client';

import { ProgressBar } from '@heroui-v3/react';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';

interface CreneauStatCardProps {
  label: string;
  sublabel?: string;
  value: number;
  color?: 'success' | 'accent' | 'warning' | 'danger';
}

/**
 * `accent` retombe sur le NEUTRE, pas sur la couleur de marque.
 *
 * <p>C'est la valeur par defaut de la carte, et le seul appelant l'emploie pour un
 * « Taux de presence » : le chiffre s'ecrivait donc en rouge de marque, et la barre en
 * dessous aussi. Un taux de presence ne dit rien de particulier tant qu'on n'a pas fixe
 * son seuil ; il se lit.</p>
 */
const TON: Record<NonNullable<CreneauStatCardProps['color']>, TonStat> = {
  accent: 'neutre',
  danger: 'danger',
  success: 'succes',
  warning: 'attention',
};

/**
 * `ProgressBar` et `Meter` de la v3 remplissent en ACCENT par defaut, c'est-a-dire dans le
 * rouge de marque : un taux de 92 % s'y peignait dans la couleur de l'alarme, a tous les
 * seuils. La barre reprend la teinte du chiffre qu'elle accompagne.
 */
const TEINTE_BARRE: Record<
  NonNullable<CreneauStatCardProps['color']>,
  'danger' | 'default' | 'success' | 'warning'
> = {
  accent: 'default',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
};

/**
 * Carte de taux d'un creneau, avec sa barre de progression.
 *
 * <p>Enveloppe `CarteStat` en conservant sa signature. C'est le SEUL usage de
 * l'echappatoire `children` du composant partage : la barre de progression n'existe que
 * sur cette carte. Si un deuxieme appelant se met a utiliser `children`, c'est le signal
 * qu'il faut une vraie prop.</p>
 */
export function CreneauStatCard({ label, sublabel, value, color = 'accent' }: CreneauStatCardProps) {
  return (
    <CarteStat libelle={label} valeur={`${value}%`} note={sublabel} ton={TON[color]}>
      {/*
       * La barre etait passee en v3 par une reecriture automatique qui lui avait laisse un
       * attribut `aria-` vide et un `<Label>` REDONDANT — le libelle est deja rendu par la
       * carte, le lecteur d'ecran l'entendait deux fois.
       */}
      <ProgressBar aria-label={label} className="mt-3" color={TEINTE_BARRE[color]} value={value}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </CarteStat>
  );
}
