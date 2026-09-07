'use client';

/*
 * Grille de paiement, rendue avec HeroUI V3.
 *
 * <p>Trois defauts corriges au passage, tous invisibles au build et tous payes par le
 * comptable.</p>
 *
 * <p>1. La pastille d'etat du lot, le bandeau « pas encore transmise au DGA » et les
 * boutons de cloture etaient peints en teintes fixes (`bg-amber-50`, `text-amber-900`,
 * `bg-blue-600`) sans variante sombre. Avec la bascule de theme de l'en-tete, l'operateur
 * en sombre recevait un aplat clair a texte fonce : la seule phrase qui lui dit qu'il
 * reste un clic a faire avant que le DGA puisse viser etait la moins lisible de l'ecran.
 * Les jetons d'etat de la V3 suivent les deux themes.</p>
 *
 * <p>2. Le motif de reouverture etait un `textarea` brut avec sa bordure ecrite a la
 * main : ni surface ni anneau de focus du theme, texte sombre sur fond sombre. On ne
 * relisait pas ce qu'on ecrivait pour justifier la reouverture d'une semaine de paie,
 * alors que ce texte part en journal et sera relu par la Direction.</p>
 *
 * <p>3. Le changement de libelle (« Cloture… », « Envoi… ») etait le seul garde-fou
 * contre un second appui pendant l'appel : `disabled` arrivait avec le rendu suivant.
 * `isPending` coupe la pression des l'appui, ce qui compte sur une action qui verrouille
 * une semaine ou transmet un lot de paie.</p>
 */

import { useState } from 'react';
import { Lock, LockKeyhole, LockKeyholeOpen, Send } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  Chip,
  EmptyState,
  Label,
  Modal,
  Spinner,
  TextArea,
} from '@heroui-v3/react';
import EtatErreur from '@/components/commons/EtatErreur';
// La decision annoncee ici — « la pagination se decide pour les quinze ecrans a la
// fois » — est prise : `PaginationTableau` est la primitive commune, et ses points de
// suspension y ont ete ajoutes pour ce cas precis, les longs lots de paie.
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import CreneauSelectPicker from '@/features/validation-tickets/components/CreneauSelectPicker';
import useGrillePaiement from '../hooks/use-grille-paiement';
import { lotStatutLabel } from '../utils/lot-statut-label';
import GrillePaiementSkeleton from './GrillePaiementSkeleton';
import GrillePaiementBanner from './GrillePaiementBanner';
import GrillePaiementStats from './GrillePaiementStats';
import GrillePaiementTable from './GrillePaiementTable';
import GrillePaiementDetailModal from './GrillePaiementDetailModal';
import GrillePaiementSubmitFooter, { blocagesSoumission } from './GrillePaiementSubmitFooter';
import GrillePaiementExportButton from './GrillePaiementExportButton';
import JustificationInclusionModal from './JustificationInclusionModal';
import SoumettreConfirmModal from './SoumettreConfirmModal';
import ValiderLigneConfirmModal from './ValiderLigneConfirmModal';

/** Le serveur refuse un motif plus court : le compteur affiche le meme seuil. */
const MOTIF_REOUVERTURE_MIN = 30;

export default function GrillePaiementContent() {
  const {
    grille,
    lignes,
    isLoading,
    isError,
    refetch,
    creneaux,
    isLoadingCreneaux,
    selectedCreneauId,
    setSelectedCreneauId,
    canSoumettre,
    isSoumettant,
    handleSoumettre,
    isValidantTout,
    handleToutValider,
    canCloturer,
    isCloturant,
    handleCloturerCreneau,
    updateWave,
    waveManquants,
    lignesAValider,
    page,
    setPage,
    totalPages,
    selectedLigne,
    openDetail,
    closeDetail,
    confirmOpen,
    closeConfirm,
    commentaire,
    setCommentaire,
    handleConfirmerSoumission,
    isLotVerrouille,
    lotStatut,
    ligneAValider,
    handleValiderLigne,
    handleConfirmerValidation,
    closeConfirmValidation,
    isValidating,
    canEditInclusion,
    inclusionRequest,
    isModifyingInclusion,
    handleRequestToggleInclusion,
    handleConfirmerInclusion,
    closeInclusionRequest,
    canAnnulerCloture,
    isAnnulantCloture,
    handleAnnulerCloture,
    annulerClotureOpen,
    setAnnulerClotureOpen,
  } = useGrillePaiement();

  const [cloturerOpen, setCloturerOpen] = useState(false);
  const [motifReouverture, setMotifReouverture] = useState('');
  const motifSuffisant = motifReouverture.trim().length >= MOTIF_REOUVERTURE_MIN;

  if (isLoading) return <GrillePaiementSkeleton />;
  // L'echec etait signale par une notification, qui disparait, pendant que l'ecran
  // affichait « Aucune ligne » : rien ne distinguait une grille vide d'une panne.
  if (isError) return <EtatErreur quoi="la grille de paiement" onReessayer={() => refetch()} />;

  if (!grille) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Grille de paiement</h1>
          <p className="text-sm text-muted mt-1">
            Génération automatique depuis les tickets verrouillés.
          </p>
        </div>
        <Card className="items-center justify-center py-24">
          <EmptyState>Aucun créneau verrouillé disponible pour la grille de paiement.</EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Grille de paiement —{' '}
            <span className="text-primary font-bold">{grille.code}</span>
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Génération automatique depuis les tickets verrouillés · Cliquez une ligne pour voir le détail.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap justify-end">
          {lotStatut && lotStatut !== 'EN_ATTENTE' && (
            <Chip color={lotStatut === 'REJETE' ? 'danger' : 'warning'} variant="soft">
              <Lock aria-hidden="true" className="size-3" />
              <Chip.Label>{lotStatutLabel(lotStatut)}</Chip.Label>
            </Chip>
          )}

          {/* Clôture manuelle du créneau : visible tant qu'il n'est pas verrouillé.
              Après clôture, tout ticket saisi part en Régularisation. */}
          {canCloturer && (
            <Button isPending={isCloturant} variant="secondary" onPress={() => setCloturerOpen(true)}>
              {({ isPending }) => (
                <>
                  {isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <LockKeyhole aria-hidden="true" className="size-4" />
                  )}
                  {isPending ? 'Clôture…' : 'Clôturer le créneau'}
                </>
              )}
            </Button>
          )}

          {/* V137 — Annulation de la clôture, réservée à l'administrateur. Rend la
              semaine modifiable pour la compléter, avant de la re-clôturer. */}
          {canAnnulerCloture && (
            <Button
              isPending={isAnnulantCloture}
              variant="outline"
              onPress={() => setAnnulerClotureOpen(true)}
            >
              {({ isPending }) => (
                <>
                  {isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <LockKeyholeOpen aria-hidden="true" className="size-4" />
                  )}
                  {isPending ? 'Réouverture…' : 'Annuler la clôture'}
                </>
              )}
            </Button>
          )}

          <GrillePaiementExportButton
            creneauId={selectedCreneauId ?? undefined}
            grilleCode={grille.code}
            totalItems={grille.lignes.totalElements}
          />

          <CreneauSelectPicker
            creneaux={creneaux}
            selectedCreneauId={selectedCreneauId}
            onSelectCreneau={setSelectedCreneauId}
            disabled={isLoadingCreneaux}
          />
        </div>
      </div>

      <GrillePaiementBanner grille={grille} />

      {/* Lot calculé mais pas encore transmis au DGA : la soumission s'est arrêtée
          à l'étape 1 (CALCUL_EN_COURS), ou une modif d'inclusion a remis le lot en
          calcul. Rien ne le signalait → le comptable ne savait pas qu'il fallait
          re-cliquer « Soumettre au DGA ». On l'affiche clairement + action directe. */}
      {!isLotVerrouille && lotStatut === 'CALCUL_EN_COURS' && (
        <Alert status="warning">
          <Alert.Indicator>
            <Send aria-hidden="true" className="size-4" />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>Grille calculée — pas encore transmise au DGA</Alert.Title>
            <Alert.Description>
              {canSoumettre ? (
                <>
                  Le lot est prêt mais n&apos;a pas encore été soumis (ou une modification l&apos;a remis
                  en calcul). Cliquez « Soumettre au DGA » pour le transmettre — le DGA pourra alors
                  le viser.
                </>
              ) : (
                <>
                  À finaliser avant de pouvoir soumettre :{' '}
                  {blocagesSoumission(waveManquants, lignesAValider).join(' · ')}.
                </>
              )}
            </Alert.Description>
            {/* L'action est posée sous le texte qui la conditionne : le comptable lit
                d'abord ce qui bloque, puis trouve le bouton au même endroit. */}
            <Button
              className="mt-3"
              isDisabled={!canSoumettre}
              isPending={isSoumettant}
              onPress={handleSoumettre}
            >
              {({ isPending }) => (
                <>
                  {isPending ? (
                    <Spinner color="current" size="sm" />
                  ) : (
                    <Send aria-hidden="true" className="size-4" />
                  )}
                  {isPending ? 'Envoi…' : 'Soumettre au DGA'}
                </>
              )}
            </Button>
          </Alert.Content>
        </Alert>
      )}

      <GrillePaiementStats stats={grille.stats} />

      <GrillePaiementTable
        lignes={lignes}
        onRowClick={openDetail}
        onUpdateWave={updateWave}
        onValiderLigne={handleValiderLigne}
        onToggleInclusion={handleRequestToggleInclusion}
        canEditInclusion={canEditInclusion}
        waveManquants={waveManquants}
        creneauDebut={new Date(grille.debut)}
        creneauFin={new Date(grille.fin)}
        readOnly={isLotVerrouille}
      />

      {totalPages > 1 && (
        <div className="flex justify-center">
          <PaginationTableau onPage={(p) => setPage(p - 1)} page={page + 1} total={totalPages} />
        </div>
      )}

      {!isLotVerrouille && (
        <GrillePaiementSubmitFooter
          canSoumettre={canSoumettre}
          isSoumettant={isSoumettant}
          waveManquants={waveManquants}
          lignesAValider={lignesAValider}
          onSoumettre={handleSoumettre}
          onToutValider={handleToutValider}
          isValidantTout={isValidantTout}
        />
      )}

      <GrillePaiementDetailModal
        ligne={selectedLigne}
        creneauCode={grille.code}
        open={!!selectedLigne}
        onClose={closeDetail}
      />

      <SoumettreConfirmModal
        open={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleConfirmerSoumission}
        isLoading={isSoumettant}
        totaux={{
          // Soumission DGA : on présente le « Total à payer » (Indépendants
          // uniquement, V54) — pas le totalNet qui englobe journaliers +
          // superviseurs (payés via un autre circuit). Cohérent avec la carte
          // stats "Total à payer (Indépendants)". Fallback totalNet si l'ancien
          // backend ne renvoie pas encore la décomposition.
          livreurs: grille.stats.nbIndependants ?? grille.stats.totalLivreurs,
          tickets: grille.stats.totalTickets,
          net: grille.stats.totalAPayer ?? grille.stats.totalNet,
        }}
        commentaire={commentaire}
        onCommentaireChange={setCommentaire}
      />

      <ValiderLigneConfirmModal
        open={!!ligneAValider}
        ligne={ligneAValider}
        isLoading={isValidating}
        onClose={closeConfirmValidation}
        onConfirm={handleConfirmerValidation}
      />

      {/* V54 (2026-05) — Modale justification override Comptable. */}
      <JustificationInclusionModal
        open={!!inclusionRequest}
        ligne={inclusionRequest?.ligne ?? null}
        nextValue={inclusionRequest?.nextValue ?? false}
        lotStatut={lotStatut}
        isLoading={isModifyingInclusion}
        onClose={closeInclusionRequest}
        onConfirm={handleConfirmerInclusion}
      />

      {/* Confirmation de clôture manuelle du créneau. */}
      <Modal.Backdrop
        isOpen={cloturerOpen}
        onOpenChange={(ouvert) => {
          if (!ouvert) setCloturerOpen(false);
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />

            <Modal.Header>
              {/* Même cadenas que le bouton qui ouvre la fenêtre : l'opérateur retrouve
                  le geste qu'il vient de déclencher. */}
              <Modal.Icon className="bg-warning-soft text-warning-soft-foreground">
                <LockKeyhole className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Clôturer le créneau</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <p className="text-sm text-foreground">
                Le créneau sera verrouillé. Tout ticket saisi <span className="font-semibold">après</span> la
                clôture ne sera plus comptabilisé directement : il passera par la{' '}
                <span className="font-semibold">Régularisation</span> (circuit tickets en retard).
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button isDisabled={isCloturant} variant="outline" onPress={() => setCloturerOpen(false)}>
                Annuler
              </Button>
              <Button
                isPending={isCloturant}
                onPress={() => {
                  handleCloturerCreneau();
                  setCloturerOpen(false);
                }}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? 'Clôture…' : 'Clôturer'}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* V137 — Annulation de la clôture. Le motif est obligatoire (30 caractères
          minimum, contrôlé aussi côté serveur) : cette action défait une décision
          de fin de semaine sur de la paie, elle doit rester justifiable. */}
      <Modal.Backdrop
        isOpen={annulerClotureOpen}
        onOpenChange={(ouvert) => {
          if (!ouvert) setAnnulerClotureOpen(false);
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />

            <Modal.Header>
              <Modal.Icon className="bg-warning-soft text-warning-soft-foreground">
                <LockKeyholeOpen className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Annuler la clôture du créneau</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-foreground">
                  Le créneau redevient modifiable et les tickets de la semaine y seront à nouveau
                  comptabilisés. Pensez à le <span className="font-semibold">clôturer à nouveau</span>{' '}
                  une fois la semaine complète.
                </p>
                <p className="text-sm text-foreground">
                  La réouverture est refusée si un lot de paie a déjà été soumis au DGA.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="grille-motif-reouverture">Motif de la réouverture</Label>
                  {/* `resize-none` : la poignée de redimensionnement du navigateur laisse
                      tirer la zone au-delà de la fenêtre et décale le pied de page. */}
                  <TextArea
                    fullWidth
                    className="resize-none"
                    id="grille-motif-reouverture"
                    placeholder="Exemple : tickets du samedi non saisis, semaine rouverte pour les ajouter avant clôture."
                    rows={3}
                    value={motifReouverture}
                    onChange={(e) => setMotifReouverture(e.target.value)}
                  />
                  <span className={motifSuffisant ? 'text-xs text-muted' : 'text-xs text-warning-soft-foreground'}>
                    {motifReouverture.trim().length} / {MOTIF_REOUVERTURE_MIN} caractères minimum
                  </span>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                isDisabled={isAnnulantCloture}
                variant="outline"
                onPress={() => setAnnulerClotureOpen(false)}
              >
                Annuler
              </Button>
              <Button isPending={isAnnulantCloture} onPress={() => handleAnnulerCloture(motifReouverture)}>
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? 'Réouverture…' : 'Rouvrir le créneau'}
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
