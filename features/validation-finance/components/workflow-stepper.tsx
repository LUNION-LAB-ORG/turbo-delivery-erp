import { Check, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import { S_APPROUVE, S_DECAISSE, S_EN_ATTENTE_DG, S_REJETE_DG, S_REJETE_DGA, S_VERIFIE_DGA, S_VUE_DGA } from './validation.constants';

/**
 * Le chemin d'une depense, de la saisie au decaissement.
 *
 * <h3>Ce qui change</h3>
 * <p>Vert pour les etapes franchies, bleu pour l'etape en cours : deux teintes de palette
 * brute, sans variante sombre, pour dire une position. Une etape franchie n'appelle aucun
 * geste et ne merite donc aucune couleur, sa coche suffit a la distinguer. L'etape EN
 * COURS, elle, dit ou l'on est : c'est le meme usage legitime de l'accent que l'onglet
 * ouvert, et c'est la seule teinte qui reste sur le chemin normal.</p>
 *
 * <h3>Le rejet etait invisible</h3>
 * <p>`stepFromStatut` rendait -1 pour les deux statuts de rejet, et -1 ne correspondait a
 * aucune etape : les quatre pastilles restaient grises, exactement comme une depense qui
 * n'aurait jamais commence. Un dossier REFUSE s'affichait donc comme un dossier neuf. Le
 * rejet est desormais pose sur l'etape ou il s'est produit, en teinte de danger : c'est
 * bien ce qui detruit le parcours.</p>
 */
const ETAPES = [
  { label: 'Comptable', sub: 'Saisie' },
  { label: 'DGA', sub: 'Validation' },
  { label: 'DG', sub: 'Approbation' },
  { label: 'Paiement', sub: 'Décaissement' },
];

function etapeCourante(statut: string): number {
  if ([S_DECAISSE, S_VUE_DGA].includes(statut)) return 4;
  if (statut === S_APPROUVE) return 3;
  if (statut === S_EN_ATTENTE_DG || statut === S_VERIFIE_DGA) return 2;
  return 1;
}

/** L'etape ou le parcours s'est arrete, ou `null` quand rien n'a ete refuse. */
function etapeDuRejet(statut: string): number | null {
  if (statut === S_REJETE_DGA) return 1;
  if (statut === S_REJETE_DG) return 2;
  return null;
}

const PASTILLE = {
  franchie: 'border-separator bg-surface-secondary text-foreground',
  courante: 'border-accent bg-accent-soft text-accent-soft-foreground',
  refusee: 'border-danger bg-danger-soft text-danger-soft-foreground',
  aVenir: 'border-separator bg-surface text-muted',
};

export function WorkflowStepper({ statut }: { statut: string }) {
  const rejet = etapeDuRejet(statut);
  const active = etapeCourante(statut);

  return (
    <ol className="flex items-start py-3">
      {ETAPES.map((etape, i) => {
        const refusee = rejet === i;
        const franchie = rejet === null ? active > i : rejet > i;
        const courante = rejet === null && active === i;
        const dernier = i === ETAPES.length - 1;

        const etat = refusee ? 'refusee' : franchie ? 'franchie' : courante ? 'courante' : 'aVenir';

        return (
          <li className="flex flex-1 items-center" key={etape.label}>
            <div className="flex w-16 shrink-0 flex-col items-center text-center">
              <span
                aria-current={courante || refusee ? 'step' : undefined}
                className={cn('flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums', PASTILLE[etat])}
              >
                {refusee ? <X aria-hidden="true" className="size-4" /> : franchie ? <Check aria-hidden="true" className="size-4" /> : i + 1}
              </span>
              <span className={cn('mt-1 text-[11px] leading-tight', refusee ? 'font-semibold text-danger-soft-foreground' : courante ? 'font-semibold text-foreground' : 'text-muted')}>
                {etape.label}
              </span>
              <span className="text-[10px] leading-tight text-muted">{refusee ? 'Refusé' : etape.sub}</span>
            </div>
            {/* Le trait de liaison est neutre : il relie, il ne qualifie pas. */}
            {!dernier && <span aria-hidden="true" className={cn('mt-4 h-0.5 flex-1 self-start', franchie ? 'bg-foreground/25' : 'bg-separator')} />}
          </li>
        );
      })}
    </ol>
  );
}
