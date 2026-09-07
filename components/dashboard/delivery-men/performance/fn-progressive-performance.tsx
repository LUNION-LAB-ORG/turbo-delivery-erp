import { ProgressCircle } from '@heroui-v3/react';

/**
 * L'anneau de performance d'un livreur.
 *
 * <h3>Ce qui change</h3>
 * <p>Le `CircularProgress` de la v2 n'existe plus : c'est `ProgressCircle`, et sa piste
 * comme son remplissage sont des ENFANTS explicites. Sans eux, l'anneau ne dessine rien —
 * la colonne serait restée vide sur toutes les lignes.</p>
 *
 * <p>`showValueLabel` disparaît aussi — la v3 ne dessine pas de valeur au centre. Le
 * pourcentage est écrit à côté de l'anneau, où il se lit, et l'anneau porte son
 * `aria-label` pour ceux qui ne le voient pas.</p>
 */
const fnProgressionPerformance = (item: LivreurPerformanceBirdEndTorubo) => {
  if (item.performance == null) {
    // Performance absente ou hors bornes : on ne rend rien plutot qu'un anneau
    // qui affirmerait une valeur. `'null'` renvoyait la chaine, pas le vide.
    return null;
  }

  /*
   * `if (item.performance = 100)` — une AFFECTATION, pas une comparaison.
   *
   * L'expression valait 100, donc toujours vraie : toute performance superieure
   * a 70 tombait dans cette branche. Et comme l'affectation MODIFIE l'objet,
   * la valeur rendue devenait 100 elle aussi : un livreur a 72 % s'affichait
   * en anneau vert plein, et l'objet restait corrompu pour tout ce qui le
   * lisait ensuite dans le meme rendu.
   */
  const ton =
    item.performance <= 35 ? 'danger' : item.performance <= 70 ? 'warning' : 'success';

  return (
    <div className="flex items-center gap-2">
      <ProgressCircle
        aria-label={`Performance : ${item.performance} %`}
        color={ton}
        size="lg"
        value={item.performance}
      >
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {item.performance} %
      </span>
    </div>
  );
};

export default fnProgressionPerformance;
