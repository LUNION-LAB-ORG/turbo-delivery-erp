'use client';

import { Button } from '@heroui-v3/react';
import { Plus } from 'lucide-react';

interface DeductionAddBarProps {
  onAddAbsence?: () => void;
  onAddAdvance?: () => void;
  onAddLoan?: () => void;
}

/**
 * Les trois gestes d'ajout d'une deduction.
 *
 * <h3>Ce qui change</h3>
 * <p>Le bouton venait de shadcn et ecoutait `onClick`. Le `Button` de la v3 n'ecoute que
 * `onPress` et ignore `onClick` EN SILENCE : une reprise mecanique aurait laisse ici trois
 * boutons qui s'affichent, se survolent, s'enfoncent, et n'ouvrent aucune fenetre.</p>
 *
 * <p>Les trois libelles melangeaient deux formes derriere le meme « + » : deux noms
 * (« Absence », « Avance sur salaire ») et une phrase verbale (« Enregistrer un pret »).
 * Ils nomment maintenant tous la meme chose de la meme facon, ce qu'on ajoute.</p>
 *
 * <p>Sans fonction posee, le bouton est desactive plutot que muet : un geste qui ne mene
 * nulle part doit se voir avant le clic, pas apres.</p>
 */
function DeductionAddBar({ onAddAbsence, onAddAdvance, onAddLoan }: DeductionAddBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoutonAjout libelle="Absence" onAjout={onAddAbsence} />
      <BoutonAjout libelle="Avance sur salaire" onAjout={onAddAdvance} />
      <BoutonAjout libelle="Prêt" onAjout={onAddLoan} />
    </div>
  );
}

function BoutonAjout({ libelle, onAjout }: { libelle: string; onAjout?: () => void }) {
  return (
    <Button isDisabled={!onAjout} onPress={onAjout} size="sm" variant="outline">
      <Plus aria-hidden="true" className="size-4" />
      {libelle}
    </Button>
  );
}

export default DeductionAddBar;
