'use client';

import { Description, FieldError, Label, Radio, RadioGroup, TextArea } from '@heroui-v3/react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import type { OrientationFonds } from '@/features/orientation-fonds';
import { formatMontant } from '@/utils/format.utils';

import { formatDateFr, type LigneOrientation, MOTIF_MIN } from './ligne-orientation';

/**
 * Ce que le geste engage, dit avant le geste.
 *
 * <p>Orienter des fonds deplace de l'argent. Une confirmation qui annonce seulement
 * « 40 factures » laisse le decideur ignorer ce qu'il signe : le nombre d'operations ET
 * leur poids en francs sont sur la meme ligne, en chasse tabulaire.</p>
 */
function Enjeu({ montant, nombre }: { montant: number; nombre: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-surface-secondary px-3 py-2.5">
      <span className="text-sm text-muted">
        {nombre > 1 ? `${nombre} opérations` : '1 opération'}
      </span>
      <span className="text-base font-bold tabular-nums text-foreground">
        {formatMontant(montant)}
      </span>
    </div>
  );
}

/** Une ligne du rappel : libelle a gauche, valeur a droite. */
function LigneFiche({
  children,
  libelle,
}: {
  children: React.ReactNode;
  libelle: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{libelle}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  );
}

/** Rappel en lecture seule de l'operation ciblee (SPEC-RECOUV-002 §4.1). */
function FicheOperation({ ligne }: { ligne: LigneOrientation }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-separator bg-surface-secondary p-3 text-xs">
      <LigneFiche libelle="N° facture">
        <span className="font-medium">{ligne.numero}</span>
      </LigneFiche>
      <LigneFiche libelle="Partenaire">
        <span className="font-medium">{ligne.partenaire}</span>
      </LigneFiche>
      <LigneFiche libelle="Montant recouvré">
        <span className="font-semibold tabular-nums">{formatMontant(ligne.montant)}</span>
      </LigneFiche>
      <LigneFiche libelle="N° de visa">
        <span className="font-semibold">{ligne.numeroVisa ?? '—'}</span>
      </LigneFiche>
      <LigneFiche libelle="Date du visa">{formatDateFr(ligne.dateVisa)}</LigneFiche>
      <LigneFiche libelle="Viseur">{ligne.viseur ?? '—'}</LigneFiche>
    </div>
  );
}

/**
 * La decision d'orientation, pour UNE operation comme pour un lot.
 *
 * <p>La fenetre etait doublee : une pour la ligne, une autre a ecrire pour le lot. C'est
 * la meme decision, les memes deux issues, la meme regle de motif. Elle est ecrite une
 * fois et se laisse dire combien d'operations elle couvre.</p>
 *
 * <h3>La couleur des deux gestes du pied</h3>
 * <p>Elle vient de `FenetreAction` et elle est deja juste : « Orienter les fonds » ENGAGE,
 * il porte l'accent ; « Annuler » ne fait que renoncer, il reste neutre. La fenetre n'est
 * pas declaree `destructif` a dessein : orienter ne detruit ni ne retire rien, cela ROUTE
 * de l'argent vers une destination. Le ton du danger est garde pour ce qui efface.</p>
 *
 * <p>Les deux issues du choix sont deux DESTINATIONS, pas une alerte et un succes : elles
 * ne portent aucune couleur. L'avertissement du bas, lui, en porte une, parce qu'il dit
 * une consequence (la decision est tracee et vaut autorisation).</p>
 */
export function FenetreOrientation({
  enAttente = false,
  ligneUnique,
  montant,
  nombre,
  onConfirmer,
  onFermer,
  ouvert,
}: {
  enAttente?: boolean;
  /** Une seule operation ciblee : sa fiche est rappelee en lecture seule. */
  ligneUnique?: LigneOrientation;
  montant: number;
  nombre: number;
  onConfirmer: (orientation: OrientationFonds, motif?: string) => void;
  onFermer: () => void;
  ouvert: boolean;
}) {
  const [choix, setChoix] = React.useState<OrientationFonds>('DEPOT_BANQUE');
  const [motif, setMotif] = React.useState('');

  // La fenetre est montee en permanence : sans cette remise a zero, le motif d'une
  // conservation precedente resterait saisi sur l'operation suivante.
  React.useEffect(() => {
    if (ouvert) {
      setChoix('DEPOT_BANQUE');
      setMotif('');
    }
  }, [ouvert]);

  const motifRequis = choix === 'CONSERVATION_CAISSE';
  const motifValide = !motifRequis || motif.trim().length >= MOTIF_MIN;

  // Le rappel sur le visa automatique ne se montre que s'il concerne l'operation ciblee.
  // Sur une facture DEJA visee, il ne disait rien d'elle : c'est la phrase generique que
  // l'ancienne carte affichait sur toutes les lignes, et qui n'a fait que se deplacer dans
  // la fenetre. Un lot, lui, peut toujours contenir des operations sans visa.
  const visaAPoser = !ligneUnique || !ligneUnique.numeroVisa;

  return (
    <FenetreAction
      actionInactive={!motifValide}
      enAttente={enAttente}
      libelleAction={nombre > 1 ? `Orienter ${nombre} opérations` : 'Orienter les fonds'}
      onAction={() => onConfirmer(choix, motifRequis ? motif.trim() : undefined)}
      onFermer={onFermer}
      ouvert={ouvert}
      titre="Orienter les fonds"
    >
      <Enjeu montant={montant} nombre={nombre} />

      {ligneUnique && <FicheOperation ligne={ligneUnique} />}

      <RadioGroup onChange={(v) => setChoix(v as OrientationFonds)} value={choix}>
        <Radio value="DEPOT_BANQUE">
          <Radio.Content className="items-start">
            <Radio.Control className="mt-1">
              <Radio.Indicator />
            </Radio.Control>
            <span className="flex flex-col items-start">
              <span className="text-sm text-foreground">Autoriser le dépôt en banque</span>
              <span className="text-xs text-muted">
                Le Comptable pourra exécuter le dépôt bancaire (bordereau + preuve).
              </span>
            </span>
          </Radio.Content>
        </Radio>
        <Radio value="CONSERVATION_CAISSE">
          <Radio.Content className="items-start">
            <Radio.Control className="mt-1">
              <Radio.Indicator />
            </Radio.Control>
            <span className="flex flex-col items-start">
              <span className="text-sm text-foreground">Conserver en caisse (fonds de roulement)</span>
              <span className="text-xs text-muted">
                Garder les fonds en caisse comme fonds de roulement (aucun dépôt).
              </span>
            </span>
          </Radio.Content>
        </Radio>
      </RadioGroup>

      {motifRequis && (
        <div className="flex flex-col gap-1">
          <Label>Motif de conservation</Label>
          <TextArea
            onChange={(e) => setMotif(e.target.value)}
            placeholder={`Obligatoire : minimum ${MOTIF_MIN} caractères`}
            required
            rows={3}
            value={motif}
          />
          {motif.length > 0 && !motifValide ? (
            <FieldError>{`${motif.trim().length}/${MOTIF_MIN} caractères`}</FieldError>
          ) : (
            <Description>{`${motif.trim().length}/${MOTIF_MIN} caractères`}</Description>
          )}
          {nombre > 1 && (
            <Description>Ce motif sera enregistré sur chacune des {nombre} opérations.</Description>
          )}
        </div>
      )}

      {/* L'avertissement dit quelque chose : il garde son ton, en jetons du theme. */}
      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
        <span>
          La décision est tracée (auteur + horodatage) et vaut autorisation : c&apos;est elle qui
          débloque (ou non) l&apos;action du Comptable.
          {nombre > 1 && ` Elle sera appliquée ${nombre} fois, une par opération.`}
          {visaAPoser &&
            " Le visa DGA est posé automatiquement (N° de visa généré) sur les opérations qui n'en ont pas encore."}
        </span>
      </div>
    </FenetreAction>
  );
}

/**
 * Sortie de caisse : elle se motive toujours, et elle ne se fait qu'une operation a la fois.
 *
 * <p>Le geste porte l'accent, pas le ton du danger : sortir des fonds de la caisse pour les
 * deposer en banque, c'est les remettre sur leur chemin normal, ce n'est pas une
 * suppression. Ce qui l'encadre est le MOTIF obligatoire, pas une couleur d'alerte.</p>
 */
export function FenetreReorientation({
  enAttente = false,
  ligne,
  onConfirmer,
  onFermer,
}: {
  enAttente?: boolean;
  ligne: LigneOrientation | null;
  onConfirmer: (motif: string) => void;
  onFermer: () => void;
}) {
  const [motif, setMotif] = React.useState('');

  React.useEffect(() => {
    if (ligne) setMotif('');
  }, [ligne]);

  const valide = motif.trim().length >= MOTIF_MIN;

  return (
    <FenetreAction
      actionInactive={!valide}
      enAttente={enAttente}
      libelleAction="Confirmer la ré-orientation"
      onAction={() => onConfirmer(motif.trim())}
      onFermer={onFermer}
      ouvert={!!ligne}
      titre="Ré-orienter vers la banque"
    >
      {ligne && <Enjeu montant={ligne.montant} nombre={1} />}
      {ligne && <FicheOperation ligne={ligne} />}

      <div className="flex flex-col gap-1">
        <Label>Motif de ré-orientation</Label>
        <TextArea
          onChange={(e) => setMotif(e.target.value)}
          placeholder={`Obligatoire : minimum ${MOTIF_MIN} caractères (toute sortie de caisse doit être tracée)`}
          required
          rows={3}
          value={motif}
        />
        {motif.length > 0 && !valide ? (
          <FieldError>{`${motif.trim().length}/${MOTIF_MIN} caractères`}</FieldError>
        ) : (
          <Description>{`${motif.trim().length}/${MOTIF_MIN} caractères`}</Description>
        )}
      </div>
    </FenetreAction>
  );
}
