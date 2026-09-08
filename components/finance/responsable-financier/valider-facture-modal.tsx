'use client';

import { Alert } from '@heroui-v3/react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { formatMontant } from '@/utils/format.utils';

import type { IFactureRF } from './responsable-financier-columns';

type CyclePaiement = 'Journalier' | 'Hebdomadaire' | 'Mensuel';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureRF | null;
  onConfirm: (facture: IFactureRF, cycle: CyclePaiement) => void;
}

/**
 * Mapping backend `facture.type` → libelle UI cycle. Le backend stocke des
 * codes upper-case (QUOTIDIEN, HEBDOMADAIRE, MENSUEL) derives du restaurant
 * par FacturationJobService.mapMethodToFactureType, on n'a plus a les
 * re-saisir (fix A1 workflow facture, 2026-05).
 */
function backendCycleToLabel(raw: string | undefined): CyclePaiement {
  if (!raw) return 'Mensuel';
  const upper = raw.toUpperCase();
  if (upper.startsWith('QUOTID') || upper === 'JOURNALIER') return 'Journalier';
  if (upper.startsWith('HEBDO')) return 'Hebdomadaire';
  if (upper.startsWith('MENSU')) return 'Mensuel';
  // Fallback : si le backend renvoie deja un libelle UI lisible, l'utiliser.
  if (raw === 'Journalier' || raw === 'Hebdomadaire' || raw === 'Mensuel') {
    return raw as CyclePaiement;
  }
  return 'Mensuel';
}

/** Une valeur qu'on lit sans pouvoir la modifier : elle vient de la facture. */
function LigneLecture({
  aide,
  libelle,
  nombre,
  valeur,
}: {
  aide?: string;
  libelle: string;
  /** Un chiffre : chasse tabulaire, pour qu'il se compare a celui d'a cote. */
  nombre?: boolean;
  valeur: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-separator py-2 last:border-b-0">
      <span className="shrink-0 text-xs text-muted">{libelle}</span>
      <span className="flex min-w-0 items-baseline gap-2 text-right">
        {aide && <span className="text-xs text-muted italic">{aide}</span>}
        <span
          className={`text-sm font-medium text-foreground ${nombre ? 'tabular-nums' : ''}`}
        >
          {valeur}
        </span>
      </span>
    </div>
  );
}

/**
 * La validation d'une facture par le responsable financier.
 *
 * <h3>Ce qui change</h3>
 * <p>Quatre valeurs en lecture seule etaient rendues comme des CHAMPS : bordure, fond,
 * hauteur d'un `<input>`. Elles invitaient a cliquer et ne repondaient pas. Elles se
 * lisent maintenant comme ce qu'elles sont, une fiche.</p>
 *
 * <p>Le bouton de validation etait `bg-red-600` : le rouge de marque sur un geste qui ne
 * detruit rien : il lance un recouvrement. Et le bandeau d'explication etait bleu, une
 * teinte sans variante sombre et absente du reste de l'ERP.</p>
 */
export default function ValiderFactureModal({ open, onClose, facture, onConfirm }: Props) {
  // Fix A1 : le cycle est derive du restaurant cote backend (champ
  // facture.cycle deja set a la creation) et n'est plus saisi par l'utilisateur.
  // On le calcule au render a partir de la facture courante pour rester
  // synchronise meme si plusieurs validations sont ouvertes successivement.
  const cycleAffiche = backendCycleToLabel(facture?.cycle);

  if (!facture) return null;

  function handleConfirm() {
    // Fix A1 : on envoie quand meme le cycle au backend pour compatibilite
    // (le backend l'ignore s'il est null, mais on garde le contrat existant
    // cote frontend pour ne pas avoir a toucher la mutation).
    if (facture) onConfirm(facture, cycleAffiche);
    onClose();
  }

  return (
    <FenetreAction
      libelleAction="Valider la facture"
      onAction={handleConfirm}
      onFermer={onClose}
      ouvert={open}
      titre="Valider la facture"
    >
      <Alert status="default">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Validation de facture</Alert.Title>
          <Alert.Description>
            Vous êtes sur le point de valider la facture <strong>{facture.numero}</strong> pour le
            partenaire <strong>{facture.partenaire}</strong>. Cette action déclenchera le processus
            de recouvrement.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <div className="rounded-xl border border-separator bg-surface-secondary px-4 py-1">
        <LigneLecture libelle="N° facture" valeur={facture.numero} />
        <LigneLecture libelle="Partenaire" valeur={facture.partenaire} />
        <LigneLecture libelle="Montant" nombre valeur={formatMontant(facture.montant)} />
        {/* Cycle de paiement, Fix A1 : lecture seule, derive du restaurant. */}
        <LigneLecture
          aide="configuré dans le profil partenaire"
          libelle="Cycle de paiement"
          valeur={cycleAffiche}
        />
      </div>
    </FenetreAction>
  );
}
