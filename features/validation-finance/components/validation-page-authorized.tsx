'use client';

import { Button, Spinner } from '@heroui-v3/react';
import { CheckCircle2 } from 'lucide-react';
import { useRef, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import AddDepenseVariableModal from '@/features/charges/components/add-depense-variable-modal';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';

import { useValidationActions } from '../hooks/use-validation-actions';
import { useHistoryData, useValidationData } from '../hooks/use-validation-data';
import { useValidationStats } from '../hooks/use-validation-stats';
import { FileAttente } from './file-attente';
import { HistoryList } from './history-list';
import { CleOnglet, TabSwitcher } from './tab-switcher';
import { ValidationCard } from './validation-card';
import { ChargeType, Role, ROLE_CONFIG } from './validation.constants';
import { ValidationStats } from './validation-stats';

/**
 * Validation des charges : le poste de travail du valideur.
 *
 * <h3>Ce que l'operateur vient faire ici</h3>
 * <p>Signer. Il regarde d'abord ce qui l'attend et le dossier ouvert ; les compteurs sont
 * du contexte, pas la raison de sa venue. L'ecran ouvrait pourtant sur un titre de page,
 * une phrase descriptive, une cloche morte, deux barres d'onglets et trois cartes
 * coloriees, soit cinq bandes empilees avant la premiere information utile, apres quoi le
 * dossier tenait dans le premier tiers et les deux tiers restants etaient blancs.</p>
 *
 * <p>Il reste : une reglure de compteurs, une barre d'onglets, et la zone de travail, qui
 * occupe TOUTE la hauteur restante. La file a gauche, le dossier a droite, la barre de
 * decision en bas du dossier. La hauteur est mesuree : une soustraction ecrite a la main
 * se trompe des qu'une bande change de taille.</p>
 *
 * <h3>Ce qui a disparu, et pourquoi c'etait faux</h3>
 * <ul>
 *   <li>l'en-tete de page : il affichait « Finance & Workflow » quand la coquille affiche
 *       « FINANCE / Validation des charges », soit deux titres et deux noms pour une page ;</li>
 *   <li>sa phrase « Gestion des flux financiers », qui decrit ce que la page montre deja ;</li>
 *   <li>son bouton de notifications : ni `onClick`, ni `aria-label`, ni enfant visible hors
 *       la pastille. Un rond cliquable de 36 px qui ne faisait rien, et que personne ne
 *       voyait. La coquille porte deja une cloche, elle, branchee.</li>
 * </ul>
 * <p>Le compteur qu'il portait n'est pas perdu : c'est « En attente » de la reglure.</p>
 */
export function ValidationPageAuthorized({ userRole }: { userRole: Role }) {
  const [onglet, setOnglet] = useState<CleOnglet>('variable');
  const [chargeType, setChargeType] = useState<ChargeType>('variable');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);

  const { depenses, rawVariables, isLoading, isFetching, isError, refetch, totalFile } = useValidationData(chargeType, userRole);
  const { depenses: historyDepenses, isLoading: isLoadingHistory, isFetching: isFetchingHistory, isError: isErrorHistory, refetch: refetchHistory } = useHistoryData(userRole, onglet === 'historique');
  const { stats, attentes, isLoading: isLoadingStats, isFetching: isFetchingStats, isError: isErrorStats, refetch: refetchStats } = useValidationStats(userRole, chargeType);
  const { handleAccept, handleReject, isPending } = useValidationActions(userRole, chargeType);

  const safeIdx = Math.min(currentIdx, Math.max(0, depenses.length - 1));

  // L'historique n'est pas filtre par type de charge : le type retenu ne bouge donc pas
  // quand on va le consulter, et on retrouve sa file en revenant.
  const changerOnglet = (cle: CleOnglet) => {
    setOnglet(cle);
    if (cle === 'historique') return;
    setChargeType(cle);
    setCurrentIdx(0);
  };

  const handleOpenEdit = () => {
    if (chargeType !== 'variable' || !rawVariables) return;
    const currentId = depenses[safeIdx]?.id;
    if (!currentId) return;
    const raw = rawVariables.find((v) => v.id === currentId);
    if (raw) setChargeVariableToEdit(raw);
  };

  // Ecran « poste de travail » : la file et le dossier defilent a l'interieur, la barre de
  // decision reste sous les yeux. La distance jusqu'au bas de la fenetre est MESUREE, pas
  // devinee : la reglure de compteurs change de hauteur selon le role et le repli du menu.
  const zoneRef = useRef<HTMLDivElement>(null);
  const hauteurZone = useHauteurDisponible(zoneRef);

  const libelleType = chargeType === 'variable' ? 'variables' : 'fixes';
  const libelleTypeSingulier = chargeType === 'variable' ? 'variable' : 'fixe';
  const typeOppose: ChargeType = chargeType === 'variable' ? 'fixe' : 'variable';

  let file;
  if (isLoading) {
    file = (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-large border border-separator bg-surface">
        <Spinner />
      </div>
    );
  } else if (isError) {
    // Sur echec, la file tombait sur « Aucune depense a valider » : le valideur en
    // concluait qu'il n'avait rien a traiter.
    file = (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-large border border-separator bg-surface">
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi={`les charges ${libelleType} à valider`} />
      </div>
    );
  } else if (depenses.length === 0) {
    file = (
      <FileVide
        acceptLabel={ROLE_CONFIG[userRole].acceptLabel}
        libelleType={libelleTypeSingulier}
        onAllerHistorique={() => changerOnglet('historique')}
        onAllerTypeOppose={() => changerOnglet(typeOppose)}
        typeOppose={typeOppose}
      />
    );
  } else {
    file = (
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        <FileAttente depenses={depenses} index={safeIdx} onSelect={setCurrentIdx} totalFile={totalFile} />
        <ValidationCard
          acceptLabel={ROLE_CONFIG[userRole].acceptLabel}
          canAct={depenses.length > 0}
          current={safeIdx}
          depense={depenses[safeIdx]}
          isDGA={userRole === 'dga'}
          isPending={isPending}
          onAccept={handleAccept}
          onEdit={chargeType === 'variable' ? handleOpenEdit : undefined}
          onNext={() => setCurrentIdx((i) => Math.min(depenses.length - 1, i + 1))}
          onPrev={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          onReject={handleReject}
          total={depenses.length}
          totalFile={totalFile}
        />
      </div>
    );
  }

  let historique;
  if (isLoadingHistory) {
    historique = (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-large border border-separator bg-surface">
        <Spinner />
      </div>
    );
  } else if (isErrorHistory) {
    historique = (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-large border border-separator bg-surface">
        <EtatErreur enCours={isFetchingHistory} onReessayer={() => refetchHistory()} quoi="l'historique des validations" />
      </div>
    );
  } else {
    historique = <HistoryList depenses={historyDepenses} />;
  }

  return (
    <>
      {/* La zone de travail est le SEUL enfant mesure : la fenetre de modification est
          hors du flux, elle n'a rien a faire dans le calcul de hauteur. */}
      <div className="flex flex-col gap-3" ref={zoneRef} style={hauteurZone ? { height: hauteurZone } : undefined}>
        <ValidationStats enCours={isFetchingStats} isError={isErrorStats} isLoading={isLoadingStats} onReessayer={() => refetchStats()} role={userRole} stats={stats} />

        <TabSwitcher attentes={attentes} cle={onglet} file={file} historique={historique} onChange={changerOnglet} />
      </div>

      <AddDepenseVariableModal chargeToEdit={chargeVariableToEdit} isOpen={!!chargeVariableToEdit} onClose={() => setChargeVariableToEdit(null)} />
    </>
  );
}

/**
 * La file vide : l'etat le PLUS FREQUENT une fois le travail fait.
 *
 * <p>C'etait une bande de 16 px de texte au milieu de deux tiers d'ecran blanc, qui
 * laissait l'operateur sans rien a faire. Elle dit maintenant ce qu'il reste a regarder et
 * porte les deux seuls gestes encore possibles : l'autre file, et l'historique. Le geste
 * principal prend l'accent, parce qu'il est le seul de cet ecran a ce moment-la.</p>
 */
function FileVide({
  acceptLabel,
  libelleType,
  onAllerHistorique,
  onAllerTypeOppose,
  typeOppose,
}: {
  acceptLabel: string;
  libelleType: string;
  onAllerHistorique: () => void;
  onAllerTypeOppose: () => void;
  typeOppose: ChargeType;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-large border border-separator bg-surface p-8 text-center">
      <CheckCircle2 aria-hidden="true" className="size-10 text-muted" />
      <div>
        <p className="text-base font-semibold text-foreground">
          Aucune charge {libelleType} à {acceptLabel.toLowerCase()}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onPress={onAllerTypeOppose} size="sm" variant="outline">
          Charges {typeOppose === 'fixe' ? 'fixes' : 'variables'}
        </Button>
        <Button onPress={onAllerHistorique} size="sm" variant="primary">
          Voir l&apos;historique
        </Button>
      </div>
    </div>
  );
}
