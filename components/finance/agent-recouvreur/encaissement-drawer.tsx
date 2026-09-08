'use client';

import { Button, ProgressBar } from '@heroui-v3/react';
import { Banknote, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ChipStatutFacture } from '@/components/finance/common/chip-statut-facture';
import type { IAgentFacture as IFactureAgent } from '@/features/agent-recouvreur';
import { formatMontant } from '@/utils/format.utils';

import AjouterPaiementModal, { type IPaiement } from './ajouter-paiement-modal';

interface Props {
  open: boolean;
  onClose: () => void;
  facture: IFactureAgent | null;
  agentNom?: string;
  onPaiementAjoute: (facture: IFactureAgent, paiements: IPaiement[]) => void;
}

/** Une ligne de la fiche : un libelle a gauche, sa valeur a droite. */
function Ligne({
  libelle,
  nombre,
  valeur,
}: {
  libelle: string;
  /** Un chiffre : chasse tabulaire, pour se comparer a celui d'a cote. */
  nombre?: boolean;
  valeur: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted">{libelle}</span>
      <span
        className={`min-w-0 truncate text-right text-sm font-medium text-foreground ${
          nombre ? 'tabular-nums' : ''
        }`}
      >
        {valeur}
      </span>
    </div>
  );
}

/**
 * L'encaissement d'une facture : ce qui est deja rentre, ce qui reste, et les paiements.
 *
 * <h3>Ce qui change</h3>
 * <p>La barre de progression etait deux `<div>` imbriques dont la largeur etait pilotee
 * par un style en ligne : rien n'annoncait la valeur, et le pourcentage a cote passait du
 * gris au bleu puis au vert selon l'avancement, soit trois couleurs pour une meme grandeur
 * deja lue en chiffres. C'est une `ProgressBar`, qui porte sa valeur.</p>
 *
 * <p>Le statut etait une pastille `bg-orange-100` locale, la dix-septieme variante du
 * meme vocabulaire dans ce dossier ; il passe par la pastille partagee. « Partner » et
 * « Base depot partner » etaient ecrits en anglais au milieu d'un ecran francais.</p>
 *
 * <p>L'initiale de l'agent etait posee sur un disque `bg-red-500` : le rouge de marque
 * sur une pastille decorative, a cote de montants qui, eux, n'en avaient pas.</p>
 */
export default function EncaissementModal({
  open,
  onClose,
  facture,
  agentNom = '',
  onPaiementAjoute,
}: Props) {
  const [paiements, setPaiements] = useState<IPaiement[]>([]);
  const [ajouterOpen, setAjouterOpen] = useState(false);

  useEffect(() => {
    if (open) setPaiements([]);
  }, [open, facture]);

  if (!facture) return null;

  // Inclure ce qui est deja recouvre cote serveur (facture.montantRecouvre) +
  // les paiements ajoutes dans cette session.
  const alreadyOnServer = facture.montantRecouvre ?? 0;
  const montantRecouvre = alreadyOnServer + paiements.reduce((acc, p) => acc + p.montant, 0);
  const montantRestant = Math.max(0, facture.montant - montantRecouvre);
  const progression =
    facture.montant > 0 ? Math.min(100, Math.round((montantRecouvre / facture.montant) * 100)) : 0;

  function handlePaiement(p: Omit<IPaiement, 'id'>) {
    const nouveau: IPaiement = { ...p, id: crypto.randomUUID() };
    const updated = [...paiements, nouveau];
    setPaiements(updated);
    setAjouterOpen(false);
    onPaiementAjoute(facture!, updated);
  }

  return (
    <>
      {/*
       * La fenetre d'ajout se superpose a celle-ci : on efface la fenetre du dessous
       * plutot que d'empiler deux dialogues, comme le faisait la version precedente.
       */}
      <FenetreAction
        libelleFermer="Fermer"
        onFermer={onClose}
        ouvert={open && !ajouterOpen}
        titre={`Encaissement de la facture ${facture.numero}`}
      >
        <div className="flex flex-col gap-3 rounded-xl border border-separator bg-surface-secondary p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Informations générales</p>
            <ChipStatutFacture statut={facture.statut} />
          </div>
          <Ligne libelle="Partenaire" valeur={facture.partenaire} />
          <Ligne libelle="Agent recouvreur" valeur={agentNom || '—'} />
          <Ligne libelle="Montant total" nombre valeur={formatMontant(facture.montant)} />
          <Ligne libelle="Cycle de paiement" valeur={facture.cycle} />
          <Ligne
            libelle="Date d'émission"
            valeur={facture.emission !== '—' ? facture.emission : '—'}
          />
          <Ligne
            libelle="Date de dépôt partenaire"
            valeur={facture.depotPartenaire?.date ?? '—'}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-separator p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Progression du recouvrement</p>
            <p className="text-sm font-bold tabular-nums text-foreground">{progression}%</p>
          </div>
          <ProgressBar
            aria-label="Progression du recouvrement"
            color={progression === 100 ? 'success' : 'accent'}
            value={progression}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs text-muted">Montant recouvré</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatMontant(montantRecouvre)}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted">Montant restant</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formatMontant(montantRestant)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">Paiements ({paiements.length})</p>
            <Button onPress={() => setAjouterOpen(true)} size="sm" variant="primary">
              <Plus aria-hidden="true" className="size-3.5" />
              Ajouter paiement
            </Button>
          </div>
          {paiements.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-separator py-8 text-muted">
              <Banknote aria-hidden="true" className="size-8 opacity-30" />
              <p className="text-xs">Aucun paiement enregistré</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {paiements.map((p) => (
                <div
                  className="flex items-start justify-between gap-3 rounded-xl border border-separator px-4 py-3"
                  key={p.id}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{p.type}</p>
                    <p className="text-xs tabular-nums text-muted">{p.date}</p>
                    {p.remarque && <p className="mt-0.5 text-xs text-muted italic">{p.remarque}</p>}
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    {formatMontant(p.montant)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </FenetreAction>

      <AjouterPaiementModal
        facture={facture}
        montantDejaRecouvre={montantRecouvre}
        onClose={() => setAjouterOpen(false)}
        onConfirm={handlePaiement}
        open={ajouterOpen}
      />
    </>
  );
}
