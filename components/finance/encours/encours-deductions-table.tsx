'use client';

import { Table } from '@heroui-v3/react';

import { formatFcfa, formatNombre, IEncoursDeduction } from '@/features/encours';

/**
 * Recapitulatif des deductions & avances (spec §6) - le registre annuel, tous partenaires.
 *
 * <p>Il tenait dans la moitie gauche de l'ecran (`max-w-2xl`), la moitie droite vide. Le
 * motif est du texte libre saisi par un comptable : « avance versee le 12/06 sur la
 * facture de mai, a retenir sur les deux prochaines quinzaines ». Dans une colonne de
 * 240 px il se repliait sur cinq lignes, et chaque ligne du registre occupait la hauteur
 * d'un paragraphe. Le bloc prend maintenant toute la largeur, et c'est le motif qui
 * absorbe la place restante : les deux colonnes chiffrees, elles, ne se replient pas.</p>
 */
export function EncoursDeductionsTable({
  deductions,
  total,
}: {
  deductions: IEncoursDeduction[];
  total: number;
}) {
  if (!deductions || deductions.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">
          Récapitulatif des déductions &amp; avances
        </h3>
        <span className="text-xs text-muted">
          {formatNombre(deductions.length)} déduction{deductions.length > 1 ? 's' : ''} au registre
        </span>
      </div>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Déductions et avances">
            <Table.Header>
              <Table.Column className="w-56" id="partenaire" isRowHeader>
                Partenaire
              </Table.Column>
              {/* Le motif est le seul contenu de largeur variable : il prend le reste. */}
              <Table.Column id="motif">Motif</Table.Column>
              <Table.Column className="w-44 text-right" id="montant">
                Montant déduit
              </Table.Column>
            </Table.Header>
            {/* La cle React vaut l'`id` de la collection : deux valeurs differentes
                exposent react-aria a recevoir un `id` qui change sur un element deja
                monte, ce qui fait tomber la page entiere. */}
            <Table.Body>
              {deductions.map((d, i) => (
                <Table.Row id={`d-${i}`} key={`d-${i}`}>
                  <Table.Cell className="align-top">
                    <span className="font-medium text-foreground">{d.partenaire}</span>
                  </Table.Cell>
                  <Table.Cell className="align-top text-muted">
                    {d.motif || <span className="text-muted">Motif non renseigné</span>}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-right align-top tabular-nums">
                    {formatFcfa(d.montant)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {/* Le total etait une LIGNE du tableau : c'est un pied, et le composant en a un. */}
        <Table.Footer className="justify-between text-sm">
          <span className="font-semibold text-foreground">Total du registre</span>
          <span className="font-bold tabular-nums text-foreground">{formatFcfa(total)}</span>
        </Table.Footer>
      </Table>
    </section>
  );
}
