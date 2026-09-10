'use client';

import { Alert, Button } from '@heroui-v3/react';
import { Camera } from 'lucide-react';
import React from 'react';

import { useCapturerInstantaneMutation } from '@/features/classement-partenaires/queries/classement.query';
import type { IClassement } from '@/features/classement-partenaires/types/classement.types';
import { cleMois, libelleMois } from '@/features/classement-partenaires/utils/classement-format.utils';

/**
 * POURQUOI LA TENDANCE EST VIDE.
 *
 * <h3>La raison d'etre de ce bandeau</h3>
 * <p>Aucun instantane n'a jamais ete capture : le travail planifie n'est pas passe. La
 * colonne de tendance sera donc vide, la fiche d'evolution n'aura aucun mois a montrer, et
 * la comparaison n'aura rien a comparer. Un ecran qui se contenterait de ne rien afficher
 * ferait conclure a une panne, ou pire, a une absence d'activite. Il dit donc ce qui
 * manque, pourquoi, et ce qui le comblerait.</p>
 *
 * <h3>Pourquoi le bouton de capture est ici et pas ailleurs</h3>
 * <p>C'est la seule ECRITURE de cet ecran, et c'est aussi le seul geste qui repare
 * l'absence expliquee juste au-dessus. Le poser ailleurs obligerait a repeter
 * l'explication. Il porte l'accent parce qu'il agit ; les exports, qui ne changent rien
 * au serveur, restent en retrait.</p>
 *
 * <h3>Un mois NON CLOS ne se capture pas</h3>
 * <p>Le serveur refuse, et il a raison : un instantane pris en cours de mois figerait des
 * chiffres partiels que plus rien ne completerait, et l'historique cesserait d'etre
 * comparable d'un mois a l'autre. Le bouton est donc absent tant que le mois court, avec
 * la raison ecrite plutot qu'un bouton qui echoue.</p>
 */
export function BandeauHistorique({
  classement,
  onCapturer,
}: {
  classement: IClassement;
  /**
   * ⚠ LE BANC PASSE ICI, ET C'EST LA RAISON D'ETRE DE CETTE PROP.
   *
   * <p>Ce bandeau porte le seul bouton du module qui ECRIT : il capture un instantane, en
   * production, dans une table dont tout l'interet est de ne plus bouger. Monte tel quel
   * dans `app/apercu/classement`, un clic depuis une page de developpement graverait une
   * ligne reelle. Le banc fournit donc son propre gestionnaire, qui n'ecrit rien - comme
   * il le fait deja pour les deux boutons d'export.</p>
   */
  onCapturer?: (mois: string) => void;
}) {
  const capture = useCapturerInstantaneMutation();
  const { instantaneAbsent, periode, tendance } = classement;

  /*
   * Le mois EN COURS, calcule au rendu. Un mois est clos des lors qu'il est anterieur a
   * celui-ci : c'est exactement la regle du serveur, et la reproduire ici evite de
   * proposer un geste dont on sait qu'il sera refuse.
   */
  const moisCourant = cleMois(new Date());
  const estClos = (mois: string | null | undefined) => Boolean(mois) && (mois as string) < moisCourant;

  /** Le mois a capturer : celui qui manque a la TENDANCE d'abord, sinon celui affiche. */
  const moisACapturer = tendance.raison === 'AUCUN_INSTANTANE_PRECEDENT' ? tendance.mois : periode.mois;

  const boutonCapture =
    estClos(moisACapturer) && moisACapturer ? (
      <Button
        className="mt-2 w-fit"
        isPending={onCapturer ? false : capture.isPending}
        onPress={() => (onCapturer ? onCapturer(moisACapturer) : capture.mutate(moisACapturer))}
        size="sm"
        variant="primary"
      >
        <Camera aria-hidden="true" className="size-4" />
        Capturer l&apos;instantané de {libelleMois(moisACapturer)}
      </Button>
    ) : null;

  // La selection ne designe aucun etablissement : il n'y a pas de classement du tout.
  if (tendance.raison === 'SELECTION_VIDE') {
    return (
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Aucun établissement dans cette sélection</Alert.Title>
          <Alert.Description>
            Le groupe demandé n&apos;existe pas, ou ne contient aucun établissement. Le classement
            est vide pour cette raison, pas faute d&apos;activité.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  if (!tendance.disponible) {
    /*
     * On ne dit « ce mois n'a jamais ete capture » que lorsque le serveur le dit
     * (`AUCUN_INSTANTANE_PRECEDENT`). Toute autre raison recevrait ici une explication
     * FAUSSE, ce qui est pire que pas d'explication du tout : le lecteur irait chercher un
     * instantane manquant qui n'est pas le probleme.
     */
    const faute = tendance.raison === 'AUCUN_INSTANTANE_PRECEDENT';

    return (
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Aucune tendance sur ce classement</Alert.Title>
          <Alert.Description>
            {faute ? (
              <>
                La tendance compare chaque rang à celui de {libelleMois(tendance.mois)}, lu dans
                l&apos;historique figé. Ce mois n&apos;a jamais été capturé : la colonne de
                tendance reste donc vide, la fiche d&apos;évolution n&apos;a aucun mois à montrer
                et l&apos;historique est vide.
                {instantaneAbsent && periode.mois ? (
                  <>
                    {' '}
                    Les chiffres affichés pour {libelleMois(periode.mois)} ont été recalculés à
                    l&apos;instant, ils ne viennent pas d&apos;une archive.
                  </>
                ) : null}
                {boutonCapture ? (
                  <>
                    {' '}
                    Capturer l&apos;instantané du mois manquant amorce l&apos;historique ; la
                    tendance apparaîtra sur le mois suivant.
                  </>
                ) : (
                  <>
                    {' '}
                    {libelleMois(moisACapturer)} n&apos;est pas terminé : un instantané pris
                    maintenant figerait des chiffres partiels, et ne peut donc pas être capturé.
                  </>
                )}
              </>
            ) : (
              <>
                Le serveur n&apos;a pas calculé de tendance pour ce classement
                {tendance.raison ? ` (motif : ${tendance.raison})` : ''}. La colonne de tendance
                reste vide pour cette raison, pas faute de mouvement.
              </>
            )}
          </Alert.Description>
          {faute ? boutonCapture : null}
        </Alert.Content>
      </Alert>
    );
  }

  // La tendance existe : une ligne discrete suffit a dire a quoi elle compare.
  return (
    <p className="text-xs text-muted">
      Tendance comparée à l&apos;instantané de {libelleMois(tendance.mois)}. Un écart positif
      signifie que le partenaire a gagné des places.
    </p>
  );
}
