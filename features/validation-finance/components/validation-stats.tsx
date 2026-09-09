import EtatErreur from '@/components/commons/EtatErreur';
import { formatMontant, formatNombre } from '@/utils/format.utils';

import { Role, ROLE_CONFIG } from './validation.constants';

interface IChargeTypeStats {
  comptable: { total: number; aDecaisser: number; decaisse: number };
  dga: { enAttente: number; montant: number };
  dg: { enAttente: number; approuvees: number; montant: number };
}

/**
 * Les compteurs de la validation des charges.
 *
 * <h3>Ce qui change</h3>
 * <p>Trois cartes de 90 px empilaient une icone coloriee, un libelle et un chiffre :
 * « Approuvees 598 » en vert, « Montant en attente 0 FCFA » en orange, et trois icones
 * peintes chacune d'une teinte de palette. Aucun de ces chiffres n'appelle
 * un geste : ils disent l'etat de la file, ils ne demandent rien. Le vert ne celebrait
 * rien et l'orange n'avertissait de rien, d'autant moins qu'il valait zero. Ils sont donc
 * neutres, et ce qui reste de couleur sur cet ecran designe uniquement le geste a faire.</p>
 *
 * <p>La forme change avec la couleur. Cet ecran est un poste de travail : sur la fenetre
 * reelle (1000 x 563), la zone utile fait environ 370 px de haut, et trois cartes en
 * mangeaient le quart pour de l'information de contexte. Les chiffres tiennent maintenant
 * sur une reglure d'une ligne, en chasse tabulaire et cales a droite de leur colonne, ce
 * qui les rend comparables d'une bascule de type de charge a l'autre. La place recuperee
 * va au dossier a examiner, qui est ce que l'operateur vient faire ici.</p>
 *
 * <p>Le reperage du role, jusqu'ici pose dans un en-tete de page qui doublonnait le fil
 * de la coquille, vient s'ancrer ici : c'est la meme bande de contexte.</p>
 *
 * <p>L'echec de lecture remplace les CHIFFRES, pas la bande : le role reste affiche, et
 * la relance tient sur la meme ligne. Un bloc d'erreur pleine hauteur a la place d'une
 * reglure de 40 px repoussait la zone de travail vers le bas pour dire une panne.</p>
 */
interface Chiffre {
  libelle: string;
  valeur: string;
}

/**
 * `decaisse` est un nombre sans unite declaree cote serveur : il etait affiche brut,
 * sans separateur. On le formate en NOMBRE, jamais en montant, car lui coller « FCFA »
 * serait affirmer une unite qu'on ne connait pas.
 */
function chiffresDuRole(role: Role, stats: IChargeTypeStats): Chiffre[] {
  if (role === 'comptable') {
    return [
      { libelle: 'Dépenses totales', valeur: formatNombre(stats.comptable.total) },
      { libelle: 'À décaisser', valeur: formatNombre(stats.comptable.aDecaisser) },
      { libelle: 'Décaissé ce mois', valeur: formatNombre(stats.comptable.decaisse) },
    ];
  }
  if (role === 'dga') {
    return [
      { libelle: 'En attente', valeur: formatNombre(stats.dga.enAttente) },
      { libelle: 'Montant en attente', valeur: formatMontant(stats.dga.montant) },
    ];
  }
  return [
    { libelle: 'En attente DG', valeur: formatNombre(stats.dg.enAttente) },
    { libelle: 'Approuvées', valeur: formatNombre(stats.dg.approuvees) },
    { libelle: 'Montant en attente', valeur: formatMontant(stats.dg.montant) },
  ];
}

export function ValidationStats({
  role,
  stats,
  isLoading = false,
  isError = false,
  onReessayer,
  enCours = false,
}: {
  role: Role;
  stats: IChargeTypeStats;
  isLoading?: boolean;
  isError?: boolean;
  onReessayer?: () => void;
  enCours?: boolean;
}) {
  const config = ROLE_CONFIG[role];
  const chiffres = chiffresDuRole(role, stats);

  return (
    <section aria-label="Compteurs de validation" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-large border border-separator bg-surface px-4 py-2.5">
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">{config.label}</span>
        <span aria-hidden="true" className="px-1.5">
          ·
        </span>
        {config.description}
      </p>

      {isError ? (
        <div className="min-w-64 flex-1">
          <EtatErreur compact enCours={enCours} onReessayer={onReessayer} quoi="les compteurs de validation" />
        </div>
      ) : (
        <dl className="flex flex-wrap gap-x-5 gap-y-2">
          {chiffres.map((chiffre) => (
            <div className="min-w-32 border-l border-separator pl-3" key={chiffre.libelle}>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{chiffre.libelle}</dt>
              <dd className="mt-0.5 text-right text-base font-semibold leading-none tabular-nums text-foreground">
                {isLoading ? (
                  <>
                    <span aria-hidden="true" className="ml-auto block h-4 w-20 animate-pulse rounded bg-surface-secondary" />
                    <span className="sr-only">Chargement</span>
                  </>
                ) : (
                  chiffre.valeur
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
