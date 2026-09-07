'use client';

import { Table } from '@heroui-v3/react';

import { formatFcfa, IEncoursDeduction } from '@/features/encours';

/** Bloc « Récapitulatif des déductions & avances » (spec §6). */
export function EncoursDeductionsTable({
  deductions,
  total,
}: {
  deductions: IEncoursDeduction[];
  total: number;
}) {
  if (!deductions || deductions.length === 0) return null;

  return (
    <div className="mt-6 max-w-2xl">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Récapitulatif des déductions &amp; avances
      </h3>
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Déductions et avances">
            <Table.Header>
              <Table.Column id="partenaire" isRowHeader>
                Partenaire
              </Table.Column>
              <Table.Column id="motif">Motif</Table.Column>
              <Table.Column id="montant">Montant déduit</Table.Column>
            </Table.Header>
            {/* La cle React vaut l'`id` de la collection : deux valeurs differentes
                exposent react-aria a recevoir un `id` qui change sur un element deja
                monte, ce qui fait tomber la page entiere. */}
            <Table.Body>
              {deductions.map((d, i) => (
                <Table.Row id={`d-${i}`} key={`d-${i}`}>
                  <Table.Cell>
                    <span className="whitespace-nowrap font-medium">{d.partenaire}</span>
                  </Table.Cell>
                  <Table.Cell>{d.motif || '—'}</Table.Cell>
                  <Table.Cell>
                    <span className="block whitespace-nowrap text-right tabular-nums">
                      {formatFcfa(d.montant)}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {/* Le total etait une LIGNE du tableau : c'est un pied, et le composant en a un. */}
        <Table.Footer className="justify-between text-sm">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-bold tabular-nums text-foreground">{formatFcfa(total)}</span>
        </Table.Footer>
      </Table>
    </div>
  );
}
