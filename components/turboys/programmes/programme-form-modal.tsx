'use client';

import {
  Alert,
  Button,
  ComboBox,
  Input,
  Label,
  ListBox,
  Modal,
  NumberField,
} from '@heroui-v3/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe } from '@/components/commons/champs-formulaire';
import { DeliveryMan } from '@/types/models';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import {
  useCreerProgrammeMutation,
  useModifierProgrammeMutation,
} from '@/features/turboys/queries/programme.query';
import { IJourProgramme, IProgramme } from '@/features/turboys/types/programme.types';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

import { defaultJours, joursAvecDates, normaliserJours, WeeklyJoursEditor } from './weekly-jours-editor';

const nomLivreur = (l: {
  matricule?: string;
  nom: string | null;
  prenoms: string | null;
  telephone?: string;
}) => `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim() || l.telephone || l.matricule || 'Livreur';

/**
 * Créer ou modifier le programme hebdomadaire d'un livreur.
 *
 * <h3>Ce qui change</h3>
 * <p>« Annuler » était ROUGE, et le seul geste qui engage — enregistrer un programme qui
 * renvoie une notification au livreur — était en bleu à côté. Se raviser n'est pas
 * dangereux.</p>
 *
 * <p>L'avertissement « ce programme a déjà été envoyé » était un `&lt;div&gt;` peint à la
 * main en `bg-warning-50 text-warning-700`, sans variante sombre : sur un poste en thème
 * sombre, du texte ambre foncé sur un fond ambre clair. C'est un `Alert`, qui porte aussi
 * son rôle pour les lecteurs d'écran — l'ancien n'était annoncé nulle part.</p>
 *
 * <p>L'année et la semaine étaient deux `&lt;input type="number"&gt;` dont la valeur
 * remontait en TEXTE : `Number(v) || 0` transformait toute saisie partielle en zéro, et
 * l'erreur « Année ou semaine invalide » n'arrivait qu'au moment d'envoyer.</p>
 */
export function ProgrammeFormModal({
  anneeInitiale,
  isOpen,
  onOpenChange,
  programme,
  semaineInitiale,
}: {
  anneeInitiale: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programme?: IProgramme | null;
  semaineInitiale: number;
}) {
  const isEdit = !!programme;
  const livreursQuery = useLivreursListQuery();
  const restaurantsQuery = useQuery({
    queryFn: getAllRestaurants,
    queryKey: ['restaurants', 'all', 'programmes'],
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = React.useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );

  const [livreurId, setLivreurId] = React.useState('');
  const [annee, setAnnee] = React.useState(anneeInitiale);
  const [semaine, setSemaine] = React.useState(semaineInitiale);
  const [jours, setJours] = React.useState<IJourProgramme[]>(defaultJours());
  // Le site de la semaine : celui du programme (ou de la fiche du livreur) à l'ouverture.
  const [siteId, setSiteId] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    if (programme) {
      setJours(normaliserJours(programme.jours));
      setSiteId(programme.siteId ?? '');
    } else {
      setLivreurId('');
      setAnnee(anneeInitiale);
      setSemaine(semaineInitiale);
      setJours(defaultJours());
      setSiteId('');
    }
  }, [isOpen, programme, anneeInitiale, semaineInitiale]);

  const creer = useCreerProgrammeMutation(() => onOpenChange(false));
  const modifier = useModifierProgrammeMutation(() => onOpenChange(false));
  const isLoading = creer.isPending || modifier.isPending;

  const onSubmit = () => {
    if (isEdit) {
      const siteChange = siteId !== (programme!.siteId ?? '');
      modifier.mutate({
        id: programme!.id,
        jours: joursAvecDates(jours, programme!.annee, programme!.semaine),
        siteModifie: siteChange,
        sitePartnerId: siteChange ? siteId || null : undefined,
      });
      return;
    }
    if (!livreurId) {
      toast.error('Sélectionnez un livreur.');
      return;
    }
    // La semaine 0 existe dans la convention du backend : les premiers jours de janvier
    // tombés avant la semaine qui contient le 4.
    if (annee < 2020 || semaine < 0 || semaine > 53) {
      toast.error('Année ou semaine invalide.');
      return;
    }
    creer.mutate({ annee, jours: joursAvecDates(jours, annee, semaine), livreurId, semaine, sitePartnerId: siteId || null });
  };

  const dejaEnvoye = isEdit && ['ACCEPTE', 'NOTIFIE', 'REFUSE'].includes(programme?.statut ?? '');

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-3xl">
            <Modal.Header>
              <div className="flex flex-col gap-0.5">
                <Modal.Heading>
                  {isEdit ? 'Modifier le programme' : 'Nouveau programme hebdomadaire'}
                </Modal.Heading>
                {isEdit && (
                  <span className="text-sm text-muted">
                    {programme!.livreurNom ?? 'Livreur'} — semaine {programme!.semaine} /{' '}
                    {programme!.annee}
                  </span>
                )}
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              {!isEdit && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Une liste de livreurs illisible donne un menu deroulant vide, qui se
                      lit comme « aucun livreur » : on le dit, et on propose de relancer. */}
                  {livreursQuery.isError ? (
                    <div className="sm:col-span-3">
                      <EtatErreur
                        enCours={livreursQuery.isFetching}
                        onReessayer={() => void livreursQuery.refetch()}
                        quoi="la liste des livreurs"
                      />
                    </div>
                  ) : (
                    /* La liste des livreurs peut etre longue : on cherche par nom,
                       matricule ou telephone, on ne deroule pas. */
                    <ComboBox
                      className="sm:col-span-3"
                      isDisabled={isLoading}
                      onSelectionChange={(key) => setLivreurId(key == null ? '' : String(key))}
                      selectedKey={livreurId || null}
                    >
                      <Label>Livreur</Label>
                      <ComboBox.InputGroup>
                        <Input placeholder="Rechercher un livreur, un matricule, un numéro" />
                        <ComboBox.Trigger />
                      </ComboBox.InputGroup>
                      <ComboBox.Popover>
                        <ListBox items={livreursQuery.data ?? []}>
                          {(l: DeliveryMan) => (
                            <ListBox.Item
                              id={l.id}
                              textValue={`${nomLivreur(l)}${l.matricule ? ` ${l.matricule}` : ''}${l.telephone ? ` ${l.telephone}` : ''}`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{nomLivreur(l)}</span>
                                {(l.matricule || l.telephone) && (
                                  <span className="text-xs text-muted">
                                    {[l.matricule, l.telephone].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </div>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          )}
                        </ListBox>
                      </ComboBox.Popover>
                    </ComboBox>
                  )}

                  <NumberField
                    formatOptions={{ useGrouping: false }}
                    isDisabled={isLoading}
                    minValue={2020}
                    onChange={setAnnee}
                    value={annee}
                  >
                    <Label>Année</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>

                  <NumberField
                    isDisabled={isLoading}
                    maxValue={53}
                    minValue={0}
                    onChange={setSemaine}
                    value={semaine}
                  >
                    {/* Le libellé disait « ISO » : la numérotation est celle du backend,
                        identique en milieu d'année, différente autour du Nouvel An. */}
                    <Label>Semaine</Label>
                    <NumberField.Group>
                      <NumberField.DecrementButton />
                      <NumberField.Input />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
                </div>
              )}

              {dejaEnvoye && (
                <Alert status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Ce programme a déjà été envoyé au livreur</Alert.Title>
                    <Alert.Description>
                      {programme?.statut === 'ACCEPTE'
                        ? 'Il a été accepté. '
                        : programme?.statut === 'REFUSE'
                          ? 'Il a été refusé. '
                          : ''}
                      Modifier ses jours, ses horaires ou ses postes le renverra pour une
                      nouvelle acceptation, et le livreur sera notifié. Le carburant seul ne
                      le renvoie pas.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              )}

              {/*
               * Le site de la semaine. La majorité des livreurs gardent le même site d'une
               * semaine à l'autre ; celui-ci ne vaut que pour cette semaine, la fiche du
               * livreur ne bouge pas. Une liste qui se cherche : les partenaires se comptent
               * par centaines.
               */}
              <div className="flex flex-col gap-1">
                <ChampListe
                  estDesactive={isLoading || restaurantsQuery.isLoading}
                  label="Site de la semaine"
                  messageListeVide={restaurantsQuery.isError ? 'La liste des partenaires n’a pas pu être lue.' : undefined}
                  onChange={setSiteId}
                  options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                  placeholder={restaurantsQuery.isLoading ? 'Chargement…' : 'Celui de la fiche du livreur'}
                  valeur={siteId}
                />
                <p className="text-xs text-muted">
                  {isEdit && programme?.siteId && !programme.siteDeLaSemaine && siteId === programme.siteId
                    ? 'Hérité de la fiche du livreur. Un autre site ne vaudra que pour cette semaine.'
                    : siteId
                      ? 'Ne vaut que pour cette semaine : la fiche du livreur ne change pas.'
                      : 'Sans choix, le programme prend le site de la fiche du livreur.'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-foreground">Jours travaillés</p>
                {/* getAllRestaurants relance desormais. L editeur ne montre le selecteur
                    « Postes / partenaires desservis » que si la liste est non vide : sans
                    ce message, une lecture en echec se lit comme « aucun poste a affecter »
                    et le programme part sans poste. On garde l edition des horaires. */}
                {restaurantsQuery.isError && (
                  <EtatErreur
                    enCours={restaurantsQuery.isFetching}
                    onReessayer={() => void restaurantsQuery.refetch()}
                    quoi="la liste des partenaires"
                  />
                )}
                <WeeklyJoursEditor
                  disabled={isLoading}
                  onChange={setJours}
                  restaurants={restaurants}
                  value={jours}
                />
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button isDisabled={isLoading} onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button isPending={isLoading} onPress={onSubmit} variant="primary">
                {isEdit ? 'Enregistrer' : 'Créer le brouillon'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
