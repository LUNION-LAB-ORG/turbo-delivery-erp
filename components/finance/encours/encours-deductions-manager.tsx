'use client';

import { useState } from 'react';
import { Button, Input, Label, Modal, Spinner, TextField } from '@heroui-v3/react';
import { Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  useDeductionsQuery,
  useCreerDeductionMutation,
  useModifierDeductionMutation,
  useSupprimerDeductionMutation,
  formatFcfa,
  IDeductionPartenaire,
} from '@/features/encours';
import EtatErreur from '@/components/commons/EtatErreur';

/** Gestion (CRUD) des déductions / avances par partenaire pour une année (§6). */
export function EncoursDeductionsManager({ annee }: { annee: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: deductions, isError, isFetching, refetch } = useDeductionsQuery(annee);
  const creer = useCreerDeductionMutation();
  const modifier = useModifierDeductionMutation();
  const supprimer = useSupprimerDeductionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupe, setGroupe] = useState('');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');

  // Suppression sous code de sécurité (4 chiffres, défini par le DG ou le
  // DGA) : le modal recueille le code, le backend est seul juge (403 sinon).
  const [suppression, setSuppression] = useState<IDeductionPartenaire | null>(null);
  const [codeSecret, setCodeSecret] = useState('');

  const confirmerSuppression = () => {
    if (!suppression || !/^\d{4}$/.test(codeSecret)) return;
    supprimer.mutate(
      { id: suppression.id, codeSecret: codeSecret.trim() },
      {
        onSuccess: () => {
          setSuppression(null);
          setCodeSecret('');
        },
      },
    );
  };

  const reset = () => {
    setEditingId(null);
    setGroupe('');
    setMontant('');
    setMotif('');
  };

  const startEdit = (d: IDeductionPartenaire) => {
    setEditingId(d.id);
    setGroupe(d.groupePartenaire);
    setMontant(String(d.montant));
    setMotif(d.motif ?? '');
  };

  const submit = () => {
    const dto = {
      groupePartenaire: groupe.trim(),
      montant: Number(montant) || 0,
      motif: motif.trim() || null,
      annee,
    };
    if (!dto.groupePartenaire) return;
    if (editingId) {
      modifier.mutate({ id: editingId, dto }, { onSuccess: reset });
    } else {
      creer.mutate(dto, { onSuccess: reset });
    }
  };

  return (
    <>
      {/*
       * Le seul geste de cet ecran qui ECRIT, donc le seul a porter l'accent. Les deux
       * exports voisins ne font que LIRE : trois boutons peints cote a cote se valent, et
       * l'operateur n'a plus de premier geste. Un ecran, une action principale.
       */}
      <Button onPress={() => setIsOpen(true)} size="sm" variant="primary">
        <Plus aria-hidden="true" className="size-4" />
        Gérer les déductions
      </Button>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-2xl">
              <Modal.Header>
                <Modal.Heading>Déductions et avances {annee}</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextField onChange={setGroupe} value={groupe}>
                    <Label>Partenaire (groupe)</Label>
                    <Input />
                  </TextField>
                  <TextField onChange={setMontant} value={montant}>
                    <Label>Montant (FCFA)</Label>
                    <Input inputMode="numeric" />
                  </TextField>
                  <div className="sm:col-span-2">
                    <TextField onChange={setMotif} value={motif}>
                      <Label>Motif</Label>
                      <Input />
                    </TextField>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    isPending={creer.isPending || modifier.isPending}
                    onPress={submit}
                    size="sm"
                    variant="primary"
                  >
                    {creer.isPending || modifier.isPending ? <Spinner size="sm" /> : null}
                    {editingId ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                  {editingId && (
                    <Button onPress={reset} size="sm" variant="ghost">
                      Annuler l&apos;édition
                    </Button>
                  )}
                </div>

                <div className="divide-y divide-separator">
                  {(deductions ?? []).map((d) => (
                    <div className="flex items-center justify-between gap-2 py-2 text-sm" key={d.id}>
                      <div className="min-w-0">
                        <span className="font-medium text-foreground">{d.groupePartenaire}</span>
                        <span className="text-muted"> · {d.motif || 'Motif non renseigné'}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatFcfa(d.montant)}
                        </span>
                        <Button
                          aria-label={`Modifier la déduction ${d.groupePartenaire}`}
                          isIconOnly
                          onPress={() => startEdit(d)}
                          size="sm"
                          variant="ghost"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </Button>
                        <Button
                          aria-label={`Supprimer la déduction ${d.groupePartenaire}`}
                          isIconOnly
                          onPress={() => {
                            setCodeSecret('');
                            setSuppression(d);
                          }}
                          size="sm"
                          variant="danger-soft"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {/* sur echec, "Aucune deduction" se lirait comme une absence reelle de deduction */}
                  {isError ? (
                    <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les déductions" />
                  ) : (
                    (!deductions || deductions.length === 0) && (
                      <p className="py-2 text-sm text-muted">Aucune déduction pour {annee}.</p>
                    )
                  )}
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button onPress={() => setIsOpen(false)} variant="ghost">
                  Fermer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* La suppression n'aboutit que si le code de sécurité (DG/DGA) est correct. */}
      <Modal
        isOpen={suppression !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSuppression(null);
            setCodeSecret('');
          }
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading className="flex items-center gap-2">
                  <Lock aria-hidden="true" className="size-4 text-danger-soft-foreground" />
                  Code de sécurité requis
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3">
                <p className="text-sm text-muted">
                  Supprimer la déduction{' '}
                  <span className="font-medium text-foreground">{suppression?.groupePartenaire}</span>{' '}
                  de{' '}
                  <span className="font-semibold text-foreground">
                    {formatFcfa(suppression?.montant ?? 0)}
                  </span>{' '}
                  ? Cette action exige le code de sécurité à 4 chiffres défini par le DG ou le DGA.
                </p>
                <TextField
                  autoFocus
                  onChange={(v) => setCodeSecret(v.replace(/\D/g, '').slice(0, 4))}
                  value={codeSecret}
                >
                  <Label>Code de sécurité (4 chiffres)</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={4}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmerSuppression();
                    }}
                    type="password"
                  />
                </TextField>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  onPress={() => {
                    setSuppression(null);
                    setCodeSecret('');
                  }}
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button
                  isDisabled={codeSecret.length !== 4}
                  isPending={supprimer.isPending}
                  onPress={confirmerSuppression}
                  variant="danger"
                >
                  {supprimer.isPending ? <Spinner size="sm" /> : null}
                  Supprimer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
