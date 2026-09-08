'use client';

import { Card, Chip } from '@heroui-v3/react';
import { AlertTriangle } from 'lucide-react';

import { TableauResponsive, type ColonneResponsive } from '@/components/commons/TableauResponsive';
import { useCongesQuery, useEligibleEmployeeQuery } from '@/features/conge/queries/conge.query';
import { CongeStatut, IConge } from '@/features/conge/types/conge.type';
import { IEmployee } from '@/features/personnel/types/types';

/** L'anciennete, en annees et mois pleins depuis la date d'embauche. */
const calculerAnciennete = (dateEntree: string): { annees: number; mois: number; libelle: string } => {
  const entree = new Date(dateEntree);
  const aujourdhui = new Date();

  let annees = aujourdhui.getFullYear() - entree.getFullYear();
  let mois = aujourdhui.getMonth() - entree.getMonth();

  // Le mois d'anniversaire n'est pas encore passe cette annee.
  if (mois < 0) {
    annees--;
    mois += 12;
  }

  return {
    annees,
    mois,
    libelle: annees === 0 ? `${mois} mois` : `${annees} an${annees > 1 ? 's' : ''}`,
  };
};

/** Les droits acquis : 30 jours des un an plein, proratises a 2,5 jours par mois avant. */
const calculerDroits = (annees: number, mois: number): number =>
  annees >= 1 ? 30 : Math.floor(mois * 2.5);

/** La date d'embauche est courte : dans une colonne, « 8 septembre 2026 » ne se compare pas. */
const formaterDate = (valeur: string): string => {
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
};

type TonSituation = 'danger' | 'default' | 'warning';

/** La couleur ne sert qu'a separer ce qui presse de ce qui informe. */
const TON_SITUATION: Record<TonSituation, string> = {
  danger: 'text-danger-soft-foreground',
  default: 'text-muted',
  warning: 'text-warning-soft-foreground',
};

type SituationConge = { texte: string; ton: TonSituation } | null;

interface LigneConge {
  anciennete: string;
  droits: number;
  embauche: string;
  enConge: boolean;
  id: string;
  nom: string;
  pris: number;
  restant: number;
  situation: SituationConge;
}

export default function AutomatisationConges() {
  const employesQuery = useEligibleEmployeeQuery({ limit: 1000 });
  const congesQuery = useCongesQuery({ limit: 1000 });
  const { data: employeesData } = employesQuery;
  const { data: congesData } = congesQuery;
  // Les deux lectures comptent : sans les employes la liste est vide, sans les
  // conges chaque ligne annonce « 0 jour pris », ce qui est faux et invisible.
  const lectureEnEchec = employesQuery.isError || congesQuery.isError;

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const conges = congesData?.content || [];

  const lignes: LigneConge[] = employees.map((employee: IEmployee) => {
    const anciennete = calculerAnciennete(employee.entryDate);
    const droits = calculerDroits(anciennete.annees, anciennete.mois);

    const congesEmploye = conges.filter((conge: IConge) => conge.employeeId === employee.id);
    const pris = congesEmploye.reduce((total: number, conge: IConge) => total + (conge.duration || 0), 0);
    const restant = Math.max(0, droits - pris);

    const enConge = congesEmploye.some(
      (conge: IConge) => conge.statut === CongeStatut.EN_COURS || String(conge.statut).toLowerCase().includes('cours'),
    );

    /*
     * LES TROIS SITUATIONS S'EXCLUENT, ELLES SE LISENT DONC EN UNE COLONNE.
     *
     * <p>L'ecran empilait trois encarts independants sous chaque carte. Ils ne peuvent
     * pourtant jamais coexister : « rapidement » demande droits >= 5, ce qu'un employe
     * en periode d'eligibilite (droits < 5) n'a pas ; et il demande restant <= 5 ou
     * pris >= 25, quand « cette annee » demande restant >= 20 ; les deux ensemble
     * exigeraient 45 jours de droits, le maximum etant 30. La chaine ne perd donc
     * aucun message.</p>
     *
     * <p>Le rouge ne peint plus que le retard reel : les deux autres etats informent.</p>
     */
    const doitPartirVite = droits >= 5 && (restant <= 5 || pris >= 25);
    const situation: SituationConge = doitPartirVite
      ? { texte: 'Doit prendre des congés rapidement', ton: 'danger' }
      : restant >= 20
        ? { texte: 'Doit prendre ses congés cette année', ton: 'warning' }
        : droits < 5
          ? { texte: `En période d'éligibilité (${anciennete.libelle})`, ton: 'default' }
          : null;

    return {
      anciennete: anciennete.libelle,
      droits,
      embauche: formaterDate(employee.entryDate),
      enConge,
      id: employee.id,
      nom: employee.name,
      pris,
      restant,
      situation,
    };
  });

  /*
   * LES DROITS SE COMPARENT ENTRE EMPLOYES.
   *
   * <p>C'etait une grille de cartes a quatre colonnes : pour savoir qui doit partir en
   * premier, il fallait lire quarante encarts un par un. Trois nombres par employe, la
   * meme unite, la meme echelle : cela se lit en colonnes alignees. L'unite passe dans
   * l'en-tete plutot que d'etre repetee sur chaque ligne.</p>
   *
   * <p>« Restant » etait peint en vert quand il tombait sous cinq jours et en orange
   * partout ailleurs, c'est-a-dire vert au moment precis ou l'encart rouge d'a cote
   * reclamait un depart. Le nombre est neutre ; c'est la colonne Situation qui alerte.</p>
   */
  const colonnes: ColonneResponsive<LigneConge>[] = [
    {
      cle: 'employe',
      identite: true,
      libelle: 'Employé',
      rendu: (ligne) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{ligne.nom}</span>
          {/* Etre en conge est l'aboutissement normal de la regle, pas une alerte : neutre. */}
          {ligne.enConge && (
            <Chip color="default" size="sm" variant="soft">
              <Chip.Label>En congé</Chip.Label>
            </Chip>
          )}
        </div>
      ),
    },
    { cle: 'embauche', libelle: 'Embauche', rendu: (ligne) => ligne.embauche },
    { cle: 'anciennete', libelle: 'Ancienneté', rendu: (ligne) => ligne.anciennete },
    { cle: 'droits', libelle: 'Droits (jours)', nombre: true, rendu: (ligne) => ligne.droits },
    { cle: 'pris', libelle: 'Pris (jours)', nombre: true, rendu: (ligne) => ligne.pris },
    {
      cle: 'restant',
      libelle: 'Restant (jours)',
      nombre: true,
      rendu: (ligne) => <span className="font-semibold">{ligne.restant}</span>,
    },
    {
      cle: 'situation',
      libelle: 'Situation',
      /*
       * Une phrase n'entre pas dans une pastille : « Doit prendre des conges
       * rapidement » est une consigne, pas un etat. Elle se lit en toutes lettres,
       * precedee du triangle que l'ecran portait deja quand elle appelle un geste.
       */
      rendu: (ligne) =>
        ligne.situation ? (
          <span className={`flex items-start gap-1.5 text-sm ${TON_SITUATION[ligne.situation.ton]}`}>
            {ligne.situation.ton !== 'default' && (
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            )}
            {ligne.situation.texte}
          </span>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <Card.Header>
          <Card.Title className="text-base">Automatisation des congés</Card.Title>
          <Card.Description>
            Les droits sont calculés à partir de la date d&#39;embauche.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="ml-5 list-disc space-y-1 text-sm text-foreground">
            <li>
              <strong>Après 1 an d&#39;ancienneté :</strong> 30 jours de congés annuels
            </li>
            <li>
              <strong>Première année :</strong> 2,5 jours par mois travaillé (proratisé)
            </li>
          </ul>
        </Card.Content>
      </Card>

      <TableauResponsive
        cleLigne={(ligne) => ligne.id}
        colonnes={colonnes}
        enChargement={employesQuery.isLoading || congesQuery.isLoading}
        enCoursDeRelance={employesQuery.isFetching || congesQuery.isFetching}
        erreur={lectureEnEchec}
        libelle="Droits aux congés par employé"
        lignes={lignes}
        onReessayer={() => {
          employesQuery.refetch();
          congesQuery.refetch();
        }}
        quoi="les droits aux congés"
        vide="Aucun employé éligible"
      />
    </div>
  );
}
