'use client';

import { Button, Checkbox, Chip, Modal, Radio, RadioGroup, Spinner } from '@heroui-v3/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, GitMerge } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  donneesRattacheesCategoriesRequest,
  fusionnerCategoriesRequest,
  type ICategorieDonneesRattachees,
} from '@/features/depenses/apis/fusion-categorie.api';
import { useInvalidateDepenseQuery } from '@/features/depenses/queries/category/index.query';
import { cn } from '@/lib/utils';

interface Props {
  ids: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}

const METRIQUES: { key: keyof ICategorieDonneesRattachees; label: string }[] = [
  { key: 'chargesFixes', label: 'Charges fixes' },
  { key: 'chargesVariables', label: 'Dépenses variables' },
  { key: 'depenses', label: 'Dépenses (décaissées)' },
];

/**
 * Fusion de categories de depense en doublon.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Le volume de donnees rattachees a chaque candidate : c'est lui, et rien d'autre, qui
 * decide laquelle on garde. Le choix se lit donc en fiches comparables, chiffres alignes
 * a droite en chasse tabulaire.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Le bouton de fusion, qui SUPPRIME definitivement les categories perdantes : il prend
 * la teinte du danger, comme toute confirmation destructrice de cet ERP, et non l'accent
 * d'une action ordinaire. La marque « le plus de donnees » etait un jeton VERT : elle ne
 * felicite rien, elle informe, donc elle est neutre. La bordure d'accent, elle, dit
 * laquelle est retenue : elle appelle bien quelque chose, elle reste.</p>
 *
 * <p>Ce qui va disparaitre n'etait ecrit nulle part : on lisait « les 3 categories » et il
 * fallait deduire soi-meme lesquelles des trois. Elles sont nommees.</p>
 */
export function FusionCategoriesDialog({ ids, isOpen, onOpenChange, onDone }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;
  const invalider = useInvalidateDepenseQuery();

  const { data, isError, isLoading } = useQuery({
    queryKey: ['categorie-donnees-rattachees', ...[...ids].sort()],
    queryFn: () => donneesRattacheesCategoriesRequest(ids),
    enabled: isOpen && ids.length >= 2,
    staleTime: 30 * 1000,
  });

  const cats = useMemo(() => data ?? [], [data]);
  // Defaut : garder la categorie qui porte le PLUS de donnees (total le plus eleve).
  const suggereId = useMemo(() => {
    if (cats.length === 0) return '';
    return [...cats].sort((a, b) => b.total - a.total)[0].id;
  }, [cats]);

  const [gardeId, setGardeId] = useState('');
  useEffect(() => {
    if (isOpen && suggereId) setGardeId(suggereId);
  }, [isOpen, suggereId]);

  const [confirme, setConfirme] = useState(false);
  useEffect(() => {
    if (!isOpen) setConfirme(false);
  }, [isOpen]);

  const aSupprimer = useMemo(() => cats.filter((c) => c.id !== gardeId), [cats, gardeId]);

  const fusion = useMutation({
    mutationFn: () => {
      const supprimeIds = ids.filter((id) => id !== gardeId);
      return fusionnerCategoriesRequest(gardeId, supprimeIds, userId ?? '');
    },
    onSuccess: async (r) => {
      toast.success(`Fusion effectuée : ${r.fusionnes} catégorie(s) fusionnée(s).`);
      await invalider();
      onOpenChange(false);
      onDone?.();
    },
    onError: (e: unknown) => {
      toast.error(`Échec de la fusion : ${e instanceof Error ? e.message : 'Erreur inconnue'}`);
    },
  });

  const pretALire = !isLoading && !isError && cats.length >= 2;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <GitMerge aria-hidden="true" className="size-5" />
                  Fusionner des catégories en doublon
                </span>
                <span className="text-xs font-normal text-muted">
                  La catégorie retenue reçoit les charges et dépenses des autres, qui sont
                  ensuite supprimées définitivement.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10">
                  <Spinner />
                  <p className="text-sm text-muted">Analyse des données rattachées…</p>
                </div>
              ) : isError ? (
                <p className="py-6 text-center text-sm text-danger-soft-foreground">
                  Impossible de charger les données rattachées.
                </p>
              ) : cats.length < 2 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Une fusion demande au moins deux catégories.
                </p>
              ) : (
                <RadioGroup onChange={setGardeId} value={gardeId}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {cats.map((c) => {
                      const estSuggere = c.id === suggereId && c.total > 0;
                      const estGarde = c.id === gardeId;
                      return (
                        <div
                          className={cn(
                            'rounded-xl border p-3 transition-colors',
                            estGarde ? 'border-accent bg-accent-soft/30' : 'border-separator',
                          )}
                          key={c.id}
                        >
                          <Radio className="w-full items-start" value={c.id}>
                            <Radio.Content className="flex w-full items-start gap-3">
                              <Radio.Control className="mt-1">
                                <Radio.Indicator />
                              </Radio.Control>
                              <span className="flex min-w-0 flex-1 flex-col items-start">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="truncate text-sm font-semibold text-foreground">
                                    {c.nomCategorie}
                                  </span>
                                  {estSuggere && (
                                    <Chip size="sm" variant="soft">
                                      <Chip.Label>Le plus de données</Chip.Label>
                                    </Chip>
                                  )}
                                </span>
                                {c.description && (
                                  <span className="truncate text-xs text-muted">{c.description}</span>
                                )}
                              </span>
                            </Radio.Content>
                          </Radio>

                          <div className="mt-3 flex flex-col gap-1 border-t border-separator pt-2">
                            {METRIQUES.map((m) => (
                              <div className="flex justify-between text-xs" key={m.key}>
                                <span className="text-muted">{m.label}</span>
                                <span className="font-medium tabular-nums text-foreground">
                                  {c[m.key] as number}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between border-t border-separator pt-1 text-xs font-semibold">
                              <span className="text-muted">Total lignes</span>
                              <span className="tabular-nums text-foreground">{c.total}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              )}

              {/*
               * La confirmation etait un `<input type="checkbox">` BRUT dans un `<label>`
               * peint en `bg-warning-50 text-warning-800` : deux teintes de l'ancienne
               * palette pour un avertissement qui, lui, dit bien quelque chose.
               */}
              {pretALire && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
                  <AlertTriangle
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-warning-soft-foreground"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Checkbox isSelected={confirme} onChange={setConfirme}>
                      <Checkbox.Content className="items-start">
                        <Checkbox.Control className="mt-0.5">
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <span className="flex-1 text-left">
                          Je confirme la suppression définitive de {aSupprimer.length} catégorie
                          {aSupprimer.length > 1 ? 's' : ''}, dont les lignes seront réassignées à
                          celle retenue.
                        </span>
                      </Checkbox.Content>
                    </Checkbox>
                    {aSupprimer.length > 0 && (
                      <p className="pl-6 text-muted">
                        {aSupprimer.map((c) => c.nomCategorie).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Le bouton restait inerte sans un mot quand la session ne portait pas
                  d'identifiant : l'en-tete X-User-Id part vide et le serveur refuse. */}
              {pretALire && !userId && (
                <p className="text-xs text-danger-soft-foreground">
                  Session incomplète : impossible d&apos;identifier l&apos;auteur de la fusion.
                  Reconnectez-vous.
                </p>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                isDisabled={fusion.isPending}
                onPress={() => onOpenChange(false)}
                variant="ghost"
              >
                Annuler
              </Button>
              <Button
                isDisabled={!gardeId || !confirme || cats.length < 2 || !userId}
                isPending={fusion.isPending}
                onPress={() => fusion.mutate()}
                variant="danger"
              >
                {fusion.isPending ? (
                  <Spinner size="sm" />
                ) : (
                  <GitMerge aria-hidden="true" className="size-4" />
                )}
                Fusionner dans cette catégorie
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
