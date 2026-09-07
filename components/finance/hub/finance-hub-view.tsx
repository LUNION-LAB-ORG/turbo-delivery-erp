'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Chip,
  ComboBox,
  Input,
  Label,
  ListBox,
  Modal,
  Spinner,
  Table,
} from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { cn } from '@/lib/utils';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/confirm-modal';
import { useAbility } from '@/hooks/use-ability';
import { useSupprimerChargeFixeMutation } from '@/features/charges/queries/charge-fixe.mutation';
import { useSupprimerChargeVariableMutation } from '@/features/charges/queries/charge-variable.mutation';
import { IChargeFixe } from '@/features/charges/types/charge-fixe.type';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import {
  FinanceStatut,
  IFinanceItem,
  fmtFcfa,
  generateFinancesPdf,
  generateFinancesXlsx,
  nextAction,
  steps,
  useFinancesHub,
} from '@/features/finances-hub';
import { buildMonthOptions, monthKeyToRange } from '@/features/charges/utils/month-filter.utils';
import AddChargeFixeModal from '@/features/charges/components/add-charge-fixe-modal';
import AddDepenseVariableModal from '@/features/charges/components/add-depense-variable-modal';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import RepartitionDepense from '@/features/depenses/components/repartition';
import { Can } from '@/components/auth/Can';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { FinanceHistoriqueTab } from './finance-historique-tab';
import EtatErreur from '@/components/commons/EtatErreur';

const NOW = new Date();
const CUR_MONTH_KEY = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;
// monthKey = "YYYY-MM" → date d'arrêté "YYYY-MM-DD"
const buildDate = (monthKey: string, jour: number) =>
  `${monthKey}-${String(jour).padStart(2, '0')}`;
// Jours réels du mois (28/29/30/31) — le curseur doit atteindre le vrai dernier
// jour, sinon le CA cumulé exclut le 31 sur les mois de 31 jours.
const daysInMonth = (monthKey: string) => {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

/*
 * `color` porte l'echelle semantique, `variant` l'intensite. Les deux etats de passage
 * portaient `primary` et `secondary`, deux couleurs de MARQUE pour des etapes qui
 * n'appellent aucun geste : ils passent au ton neutre.
 */
const STATUT: Record<FinanceStatut, { color: 'danger' | 'default' | 'success' | 'warning'; label: string; plein: boolean }> = {
  pending: { color: 'warning', label: 'En attente', plein: false },
  vise: { color: 'default', label: 'Visé DGA', plein: false },
  approuve: { color: 'default', label: 'Approuvé DG', plein: true },
  paye: { color: 'success', label: 'Payé', plein: true },
  rejete: { color: 'danger', label: 'Rejeté', plein: true },
};

function Stepper({ item, seuil }: { item: IFinanceItem; seuil: number }) {
  const st = steps(item, seuil);
  const cur = nextAction(item, seuil);
  const node = (done: boolean, current = false, skip = false) => (
    <span
      className={`flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border-2 ${
        done
          ? 'border-success bg-success'
          : current
            ? 'border-primary ring-2 ring-primary/20'
            : skip
              ? 'border-dashed border-separator bg-surface-secondary'
              : 'border-separator bg-surface'
      }`}
    >
      {done && <span className="h-1 w-1 rounded-full bg-surface" />}
    </span>
  );
  const line = (done: boolean) => <span className={`h-0.5 flex-1 ${done ? 'bg-success' : 'bg-surface-tertiary'}`} />;
  return (
    <div className="flex min-w-[140px] items-center" title="Saisie → Visa DGA → Accord DG → Payé">
      <span className="flex flex-1 items-center">{node(st.saisie)}{line(st.visa)}</span>
      <span className="flex flex-1 items-center">{node(st.visa, cur === 'vise')}{line(st.dg === true)}</span>
      <span className="flex flex-1 items-center">{node(st.dg === true, cur === 'approuve', st.dg === 'skip')}{line(st.paye)}</span>
      <span className="flex items-center">{node(st.paye, cur === 'pay')}</span>
    </div>
  );
}

const TABS = [
  { k: 'fixe', label: 'Charges fixes' },
  { k: 'variable', label: 'Dépenses variables' },
  { k: 'bap', label: 'Bon à payer' },
  { k: 'all', label: 'Toutes' },
  { k: 'histo', label: 'Mon historique' },
] as const;

const PAGE_SIZE = 12;

export function FinanceHubView() {
  const [monthKey, setMonthKey] = useState(CUR_MONTH_KEY);
  const [jour, setJour] = useState(Math.min(NOW.getDate(), daysInMonth(CUR_MONTH_KEY)));
  const [dateArret, setDateArret] = useState(buildDate(CUR_MONTH_KEY, Math.min(NOW.getDate(), daysInMonth(CUR_MONTH_KEY))));
  const [tab, setTab] = useState<(typeof TABS)[number]['k']>('fixe');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  // Filtre catégorie partagé (nuqs) — même source que le graphique de répartition.
  const { filters: depenseFilters, handleCategoriesChange } = useDepenseDashboardFilters();
  const categorieFilter = depenseFilters.categoriesDepense ?? [];
  // Deep-link email : /finance/dashboard?depense=<id>&mois=<YYYY-MM> → cibler la dépense.
  const [focus, setFocus] = useState<{ depense?: string; mois?: string }>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusDoneRef = useRef(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setFocus({ depense: sp.get('depense') ?? undefined, mois: sp.get('mois') ?? undefined });
  }, []);
  const [isFixeModalOpen, setIsFixeModalOpen] = useState(false);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  // Édition / suppression admin (quel que soit le statut visé/approuvé/décaissé).
  const [chargeFixeToEdit, setChargeFixeToEdit] = useState<IChargeFixe | null>(null);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);
  const [itemToDelete, setItemToDelete] = useState<IFinanceItem | null>(null);
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  // Seul l'admin/direction peut modifier ou supprimer une dépense déjà avancée
  // dans le workflow (le backend l'autorise via X-User-Roles, RBAC désactivé).
  const ability = useAbility();
  const isAdmin = ability.can('manage', 'all');

  /*
   * LA CHAINE DE VALIDATION N'ETAIT GARDEE NULLE PART SUR CET ECRAN.
   *
   * <p>« Viser » (visa DGA), « Approuver » (accord DG) et « Decaisser » ne dependaient que
   * du STATUT de la charge. Un comptable pouvait donc creer sa depense, la viser comme
   * DGA, l'approuver comme DG et la decaisser — seul, en quatre clics. Et comme l'auteur
   * enregistre est la session courante, l'historique portait le visa DGA et l'accord DG a
   * SON nom. La chaine Comptable puis DGA puis DG n'existait plus.</p>
   *
   * <p>La meme action est pourtant gardee ailleurs dans l'application, par
   * `<Can I="valider-dga" a="Depense">`. On applique donc la regle du projet, on n'en
   * invente pas.</p>
   *
   * <p>Le sujet compte : PAS `Finance`. Le recouvreur et le caissier ont `manage Finance`,
   * donc une garde posee sur ce sujet leur ouvrirait tout. Les regles nomment
   * `ChargeFixe`, `ChargeVariable` et `Depense`.</p>
   */
  const sujetDe = (item: IFinanceItem) => (item.type === 'fixe' ? 'ChargeFixe' : 'ChargeVariable');
  const peutViser = (item: IFinanceItem) => ability.can('valider-dga', sujetDe(item));
  const peutApprouver = (item: IFinanceItem) => ability.can('approuver-dg', sujetDe(item));
  const peutDecaisser = (item: IFinanceItem) => ability.can('decaisser', sujetDe(item));
  const peutRejeter = (item: IFinanceItem) => ability.can('rejeter-dga', sujetDe(item)) || ability.can('rejeter-dg', sujetDe(item));
  const delFixe = useSupprimerChargeFixeMutation();
  const delVar = useSupprimerChargeVariableMutation();

  // Période = le mois sélectionné (debut/fin), appliquée CÔTÉ SERVEUR au tableau + au graphique.
  const { debut: periodeDebut, fin: periodeFin } = monthKeyToRange(monthKey);
  const { items, rawFixes, rawVariables, actor, seuil, nbJours, renta, isLoading, isError, isFetching, refetch, busy, runAction } = useFinancesHub(
    dateArret,
    periodeDebut,
    periodeFin,
    categorieFilter,
  );

  // Édition : retrouve l'objet BRUT (IChargeFixe / IChargeVariable) à partir de la
  // ligne unifiée pour ré-alimenter le formulaire de la modale.
  const openEdit = (item: IFinanceItem) => {
    if (item.type === 'fixe') {
      const raw = rawFixes.find((c: any) => c.id === item.id);
      if (raw) setChargeFixeToEdit(raw as IChargeFixe);
    } else {
      const raw = rawVariables.find((c: any) => c.id === item.id);
      if (raw) setChargeVariableToEdit(raw as IChargeVariable);
    }
  };
  const confirmDelete = () => {
    if (!itemToDelete) return;
    const opts = { onSuccess: () => setItemToDelete(null) };
    if (itemToDelete.type === 'fixe') delFixe.mutate(itemToDelete.id, opts);
    else delVar.mutate(itemToDelete.id, opts);
  };
  // Dates (objets) mémoïsées pour le graphique — stables tant que le mois ne change pas.
  const chartDebut = useMemo(() => new Date(periodeDebut), [periodeDebut]);
  const chartFin = useMemo(() => new Date(periodeFin), [periodeFin]);
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

  // Changement de mois : on repositionne le curseur (jour courant si mois en
  // cours, sinon fin de mois) et on recalcule la date d'arrêté → la rentabilité
  // et le prorata reflètent le mois choisi (cf. RentabiliteService back : la
  // fenêtre est dérivée du mois de dateArret).
  const changeMonth = (key: string) => {
    if (!key) return;
    const dim = daysInMonth(key);
    const day = key === CUR_MONTH_KEY ? Math.min(NOW.getDate(), dim) : dim;
    setMonthKey(key);
    setJour(day);
    setDateArret(buildDate(key, day));
  };

  // Deep-link (mail) : applique le mois de la dépense ciblée, une seule fois.
  useEffect(() => {
    if (focus.mois) changeMonth(focus.mois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.mois]);

  // Deep-link : dès que les données du mois sont là, cible la dépense —
  // bon onglet + bonne page + scroll + surbrillance temporaire.
  useEffect(() => {
    if (!focus.depense || focusDoneRef.current || isLoading || items.length === 0) return;
    const it = items.find((i) => i.id === focus.depense);
    if (!it) return; // pas dans ce mois (on attend le refetch) ou déjà traitée
    focusDoneRef.current = true;
    const targetTab = (nextAction(it, seuil) === 'pay' ? 'bap' : it.type) as (typeof TABS)[number]['k'];
    const targetList = targetTab === 'bap'
      ? items.filter((i) => nextAction(i, seuil) === 'pay')
      : items.filter((i) => i.type === targetTab);
    const idx = targetList.findIndex((i) => i.id === it.id);
    setTab(targetTab);
    setPage(idx >= 0 ? Math.floor(idx / PAGE_SIZE) + 1 : 1);
    setHighlightId(it.id);
    setTimeout(() => document.getElementById(`dep-row-${it.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    setTimeout(() => setHighlightId(null), 4500);
  }, [focus.depense, isLoading, items, seuil]);

  const [payTargets, setPayTargets] = useState<IFinanceItem[]>([]);
  const [acc, setAcc] = useState('Caisse physique');
  const [moy, setMoy] = useState('Espèces');

  // KPI / prorata depuis l'API rentabilité
  const k = {
    ca: renta?.caCumule ?? 0,
    dep: renta?.totalCumule ?? 0,
    profit: renta?.profit ?? 0,
    /*
     * `?? true` annoncait « Rentable a ce stade », en vert, quand la requete de
     * rentabilite echouait ou n'avait pas encore repondu : un verdict rendu sur une
     * donnee absente, sur l'ecran ou l'on decide de decaisser. Un troisieme etat dit
     * ce qu'on sait vraiment — on ne sait pas.
     */
    marge: renta?.marge ?? null,
    coutJour: renta?.coutJournalier ?? 0,
    fixeProrata: renta?.fixeProrata ?? 0,
    variableReel: renta?.variableReel ?? 0,
    fixeMensuel: renta?.chargesFixesMensuelles ?? 0,
    jours: renta?.joursEcoules ?? jour,
    // Décomposition du CA + rubriques (réplique du tableau de bord principal)
    fraisLivraison: renta?.fraisLivraison ?? 0,
    commission: renta?.commission ?? 0,
    commissionFixe: renta?.commissionFixe ?? 0,
    commissionPct: renta?.commissionPourcentage ?? 0,
    revenuEncaisse: renta?.revenuEncaisse ?? 0,
    investissement: renta?.investissement ?? 0,
  };
  // Encours = CA pas encore encaissé (cf. tableau de bord principal).
  const encours = Math.max(0, k.ca - k.revenuEncaisse);
  const realDays = daysInMonth(monthKey); // borne du curseur = vrai dernier jour du mois
  // `items` est DÉJÀ filtré par mois + catégorie côté serveur (useFinancesHub).
  const bap = useMemo(() => items.filter((i) => nextAction(i, seuil) === 'pay'), [items, seuil]);
  const bapTotal = bap.reduce((s, i) => s + i.montant, 0);

  const list = useMemo(() => {
    if (tab === 'fixe') return items.filter((i) => i.type === 'fixe');
    if (tab === 'variable') return items.filter((i) => i.type === 'variable');
    if (tab === 'bap') return bap;
    return items;
  }, [items, tab, bap]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paged = useMemo(() => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [list, page]);

  const catKey = categorieFilter.join(',');
  // Changement d'onglet : on efface juste la sélection (la page reste, utile pour le deep-link).
  useEffect(() => { setSel(new Set()); }, [tab]);
  // Changement de filtre (catégorie / mois) : on repart page 1.
  useEffect(() => { setSel(new Set()); setPage(1); }, [catKey, monthKey]);
  useEffect(() => { if (page > pageCount) setPage(1); }, [page, pageCount]);

  // Sélection multiple (par id) + actions groupées sur la sélection de l'onglet.
  const selItems = useMemo(() => list.filter((i) => sel.has(i.id)), [list, sel]);
  const selByAction = (a: 'vise' | 'approuve' | 'pay') => selItems.filter((i) => nextAction(i, seuil) === a);
  const pageIds = paged.map((i) => i.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => sel.has(id));
  const togglePage = (v: boolean) =>
    setSel((p) => { const n = new Set(p); pageIds.forEach((id) => (v ? n.add(id) : n.delete(id))); return n; });
  const toggleOne = (id: string, v: boolean) =>
    setSel((p) => { const n = new Set(p); v ? n.add(id) : n.delete(id); return n; });

  const act = async (item: IFinanceItem, action: 'valider-dga' | 'approuver-dg' | 'rejeter-dga' | 'rejeter-dg' | 'decaisser', label: string, comment?: string): Promise<boolean> => {
    try {
      await runAction(item, action, comment);
      toast.success(`${label} · ${item.designation}`);
      return true;
    } catch (e) {
      toast.error("Action impossible", { description: e instanceof Error ? e.message : 'Erreur' });
      return false;
    }
  };
  const onReject = (item: IFinanceItem) =>
    act(item, item.statut === 'vise' ? 'rejeter-dg' : 'rejeter-dga', 'Rejeté');

  const openPay = (targets: IFinanceItem[]) => {
    if (!targets.length) return;
    setPayTargets(targets);
    onOpen();
  };
  const confirmPay = async () => {
    const comment = `${acc} · ${moy}`;
    const ok: IFinanceItem[] = [];
    for (const item of payTargets) {
      // eslint-disable-next-line no-await-in-loop
      if (await act(item, 'decaisser', 'Décaissé', comment)) ok.push(item);
    }
    onClose();
    setSel(new Set());
    // Résumé UNIQUEMENT sur les décaissements réellement réussis (plus de faux succès).
    if (ok.length > 0) {
      toast.success(`Décaissé ${fmtFcfa(ok.reduce((s, i) => s + i.montant, 0))} depuis ${acc}`);
    }
  };

  // Actions GROUPÉES sur la sélection : chaque bouton n'agit que sur le sous-ensemble
  // éligible (à viser / à approuver / à décaisser), quel que soit l'onglet.
  const bulkViser = async () => {
    for (const it of selByAction('vise').filter(peutViser)) {
      // eslint-disable-next-line no-await-in-loop
      await act(it, 'valider-dga', 'Visa DGA');
    }
    setSel(new Set());
  };
  const bulkApprouver = async () => {
    for (const it of selByAction('approuve').filter(peutApprouver)) {
      // eslint-disable-next-line no-await-in-loop
      await act(it, 'approuver-dg', 'Accord DG');
    }
    setSel(new Set());
  };
  const bulkDecaisser = () => openPay(selByAction('pay').filter(peutDecaisser));

  // Boutons d'action d'une ligne — partagés entre le tableau (desktop) et les
  // cartes tactiles (mobile) pour éviter toute divergence.
  const rowActions = (item: IFinanceItem) => {
    const a = nextAction(item, seuil);
    return (
      <>
        {a === 'vise' && peutViser(item) && (
          <Button isPending={busy} onPress={() => act(item, 'valider-dga', 'Visa DGA')} size="sm" variant="outline">
            Viser
          </Button>
        )}
        {a === 'approuve' && peutApprouver(item) && (
          <Button isPending={busy} onPress={() => act(item, 'approuver-dg', 'Accord DG')} size="sm" variant="outline">
            Approuver
          </Button>
        )}
        {a === 'pay' && peutDecaisser(item) && (
          <Button isPending={busy} onPress={() => openPay([item])} size="sm" variant="primary">
            Décaisser
          </Button>
        )}
        {/* Rejet : seules les dépenses VARIABLES ont un état REJETE côté backend
            (les charges fixes n'ont pas d'endpoint de rejet → on masque le bouton). */}
        {a && item.statut !== 'paye' && item.type === 'variable' && peutRejeter(item) && (
          <Button aria-label="Rejeter" isIconOnly onPress={() => onReject(item)} size="sm" variant="danger-soft">
            <X aria-hidden="true" className="size-4" />
          </Button>
        )}
        {item.statut === 'paye' && <span className="text-[11px] text-muted">Payé</span>}
        {/* Admin : modifier / supprimer QUEL QUE SOIT le statut (hors charges système RH). */}
        {isAdmin && !item.dyn && (
          <>
            <Button aria-label="Modifier" isIconOnly onPress={() => openEdit(item)} size="sm" variant="ghost">
              <Pencil aria-hidden="true" className="size-4" />
            </Button>
            <Button aria-label="Supprimer" isIconOnly onPress={() => setItemToDelete(item)} size="sm" variant="danger-soft">
              <Trash2 aria-hidden="true" className="size-4" />
            </Button>
          </>
        )}
      </>
    );
  };

  // Métadonnées d'en-tête communes aux exports (période + KPI du mois sélectionné).
  const exportMeta = () => ({
    monthLabel: monthOptions.find((m) => m.key === monthKey)?.label ?? monthKey,
    jours: k.jours,
    nbJours,
    ca: k.ca,
    dep: k.dep,
    profit: k.profit,
    marge: k.marge ?? false,
    bapTotal,
  });

  // Excel : vrai fichier .xlsx (Synthèse + Dépenses), montants en nombres sommables.
  const exportXlsx = () => {
    const data = generateFinancesXlsx(items, exportMeta());
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Finances_${monthKey}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF : document HTML isolé imprimé dans une nouvelle fenêtre (pas la page entière).
  const exportPdf = () => {
    const w = window.open('', '_blank');
    if (!w) {
      toast.error('Autorisez les pop-ups pour exporter en PDF.');
      return;
    }
    w.document.write(generateFinancesPdf(items, exportMeta()));
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  const countFor = (kk: string): number | null =>
    kk === 'fixe' ? items.filter((i) => i.type === 'fixe').length
    : kk === 'variable' ? items.filter((i) => i.type === 'variable').length
    : kk === 'bap' ? bap.length
    : kk === 'all' ? items.length
    : null; // histo : compteur non pertinent (pagination côté serveur)

  const pf = k.dep ? (k.fixeProrata / k.dep) * 100 : 50;

  return (
    <div className="space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finances — Dépenses, Décaissement & Rentabilité</h1>
          <p className="text-sm text-muted">
            Module unifié : charges fixes & variables · validation en cascade · prorata temps réel · décaissement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Can I="create" a="ChargeFixe">
            <Button onPress={() => setIsFixeModalOpen(true)} size="sm" variant="outline">
              <Plus aria-hidden="true" className="size-4" />
              Charge fixe
            </Button>
          </Can>
          <Can I="create" a="ChargeVariable">
            <Button onPress={() => setIsVariableModalOpen(true)} size="sm" variant="primary">
              <Plus aria-hidden="true" className="size-4" />
              Dépense
            </Button>
          </Can>
          <ComboBox
            aria-label="Période (mois)"
            className="w-[170px]"
            onSelectionChange={(c) => changeMonth(String(c ?? CUR_MONTH_KEY))}
            selectedKey={monthKey}
          >
            <ComboBox.InputGroup>
              <Input />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox items={monthOptions}>
                {(m: { key: string; label: string }) => (
                  <ListBox.Item id={m.key} textValue={m.label}>
                    {m.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
          <Button onPress={exportXlsx} size="sm" variant="outline">
            <Download aria-hidden="true" className="size-4" />
            Excel
          </Button>
          <Button onPress={exportPdf} size="sm" variant="outline">
            <FileText aria-hidden="true" className="size-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Curseur date d'arrêté */}
      <Card className="border border-separator">
        <Card.Content className="gap-2">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted">
            <span>Date d&apos;arrêté (jour du mois) — pilote le prorata</span>
            <span className="font-bold text-foreground">J{jour} / {realDays}</span>
          </div>
          <input
            type="range" min={1} max={realDays} value={jour}
            onChange={(e) => setJour(Number(e.target.value))}
            onMouseUp={(e) => setDateArret(buildDate(monthKey, Number((e.target as HTMLInputElement).value)))}
            onTouchEnd={(e) => setDateArret(buildDate(monthKey, Number((e.target as HTMLInputElement).value)))}
            className="w-full accent-primary"
          />
        </Card.Content>
      </Card>

      {/* CA cumulé + décomposition (réplique du tableau de bord principal) */}
      <Card className="border border-success/30 bg-success/5">
        <Card.Content className="gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">CA cumulé</span>
            <div className="text-2xl font-bold tabular-nums text-success-soft-foreground">{fmtFcfa(k.ca)}</div>
            <span className="text-xs text-muted">Frais de livraison + commissions + entrées de caisse</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <CaPart label="Frais de livraison" value={fmtFcfa(k.fraisLivraison)} />
            <CaPart label="Commissions" value={fmtFcfa(k.commission)} hint={`Fixe ${fmtFcfa(k.commissionFixe)} · Pourcentage ${fmtFcfa(k.commissionPct)}`} />
          </div>
        </Card.Content>
      </Card>

      {/* Rubriques (réplique du tableau de bord principal) */}
      <GrilleStats colonnes={4}>
        <CarteStat libelle="Revenus encaissés" valeur={fmtFcfa(k.revenuEncaisse)} icone={Banknote} />
        <CarteStat libelle="Investissements" valeur={fmtFcfa(k.investissement)} icone={TrendingUp} />
        <CarteStat libelle="Encours" valeur={fmtFcfa(encours)} note="CA non encore encaissé" icone={Clock} />
        {/* Seule carte coloree du bandeau : le bon a payer appelle une action de
            decaissement, les trois autres ne sont que des constats. */}
        <CarteStat
          libelle="Bon à payer"
          valeur={fmtFcfa(bapTotal)}
          note={`${bap.length} dépense${bap.length > 1 ? 's' : ''} prête${bap.length > 1 ? 's' : ''}`}
          icone={Wallet}
          ton="attention"
        />
      </GrilleStats>

      {/* Dépenses cumulées (détail) + marge */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="border border-separator">
          <Card.Content className="gap-1 p-4">
            <span className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted">Dépenses cumulées<Banknote className="h-4 w-4 text-muted" /></span>
            <span className="text-xl font-bold tabular-nums text-foreground">{fmtFcfa(k.dep)}</span>
            <span className="text-xs text-muted">Charges fixes (prorata) {fmtFcfa(k.fixeProrata)} · Dépenses variables {fmtFcfa(k.variableReel)}</span>
          </Card.Content>
        </Card>
        {/*
         * Marge ou deficit : les six teintes `emerald-*` / `rose-*` et leurs quatre
         * variantes sombres recopiees a la main passent aux jetons `success` et `danger`,
         * qui suivent le theme seuls.
         */}
        <Card
          className={cn(
            'border',
            k.marge === null
              ? 'border-separator'
              : k.marge
                ? 'border-success/30 bg-success/5'
                : 'border-danger/30 bg-danger/5',
          )}
        >
          <Card.Content className="gap-1 p-4">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {k.marge === null ? 'Marge' : k.marge ? 'Marge actuelle' : 'Déficit actuel'}
            </span>
            <span
              className={`text-2xl font-bold tabular-nums ${k.marge === null ? 'text-muted' : k.marge ? 'text-success-soft-foreground' : 'text-danger-soft-foreground'}`}
            >
              {k.marge === null ? '—' : `${k.profit >= 0 ? '+' : ''}${fmtFcfa(k.profit)}`}
            </span>
            <span
              className={`mt-0.5 inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${k.marge === null ? 'bg-surface-secondary text-muted' : k.marge ? 'bg-success/15 text-success-soft-foreground' : 'bg-danger/15 text-danger-soft-foreground'}`}
            >
              {k.marge === null
                ? 'Rentabilité indisponible'
                : k.marge
                  ? 'Rentable à ce stade'
                  : 'En déficit à ce stade'}
            </span>
          </Card.Content>
        </Card>
      </div>

      {/* Décomposition prorata */}
      <Card className="border border-separator">
        <Card.Content>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-default-700"><span className="h-2 w-2 rounded-full bg-primary" />Décomposition au prorata (à J{k.jours})</p>
          <div className="grid grid-cols-2 gap-y-3 sm:grid-cols-4">
            <Cell l="Coût journalier" v={fmtFcfa(k.coutJour)} s={`${fmtFcfa(k.fixeMensuel)} ÷ ${nbJours} j`} />
            <Cell l="Charges fixes prorata" v={fmtFcfa(k.fixeProrata)} s={`${fmtFcfa(k.coutJour)} × ${Math.min(k.jours, nbJours)} j`} />
            <Cell l="Dépenses variables réelles" v={fmtFcfa(k.variableReel)} s={`Jusqu'à J${k.jours}`} />
            <Cell l="Total dépenses" v={fmtFcfa(k.dep)} s="Prorata + variable" accent />
          </div>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full border border-separator">
            <div className="bg-primary" style={{ width: `${pf}%` }} />
            <div className="bg-foreground/80" style={{ width: `${100 - pf}%` }} />
          </div>
          <div className="mt-1.5 flex gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Charges fixes au prorata</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-foreground/80" />Dépenses variables réelles</span>
          </div>
        </Card.Content>
      </Card>

      {/* Graphiques — section « Répartition des dépenses » complète (résumé récurrentes/
          non récurrentes + Top 10 catégories + évolution), déplacée depuis /finance/charges
          et câblée sur le mois + le filtre catégorie du dashboard. */}
      <RepartitionDepense debut={chartDebut} fin={chartFin} />

      {/* Filtre catégorie (à gauche, masqué en « Mon historique ») + onglets */}
      <div className="flex flex-wrap items-center gap-3">
        {tab !== 'histo' && (
          <div className="w-full sm:w-72">
            <CategoriesSelectFilter
              selectedCategories={categorieFilter}
              onCategoriesChange={handleCategoriesChange}
            />
          </div>
        )}
        <div className="flex flex-1 flex-wrap gap-1.5">
          {TABS.map((t) => {
            const c = countFor(t.k);
            return (
              <button key={t.k} onClick={() => setTab(t.k)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${tab === t.k ? 'bg-surface text-foreground shadow-xs ring-1 ring-separator' : 'text-muted hover:text-foreground'}`}>
                {t.label}{c != null && <span className={`rounded-full px-1.5 text-[11px] font-bold ${tab === t.k ? 'bg-accent-soft text-accent-soft-foreground' : 'bg-surface-secondary text-muted'}`}>{c}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'histo' ? (
        <FinanceHistoriqueTab debut={periodeDebut} fin={periodeFin} isAdmin={isAdmin} moi={actor} />
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Spinner />
          <p className="text-sm text-muted">Chargement…</p>
        </div>
      ) : isError ? (
        // sans cette branche le tableau tombait a zero ligne et se lisait comme "rien a traiter"
        <EtatErreur quoi="les charges et dépenses" onReessayer={() => refetch()} enCours={isFetching} />
      ) : (
        <Card className="border border-separator">
          {/* Barre d'actions GROUPÉES sur la sélection (tous les onglets) */}
          {sel.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-separator bg-accent-soft/30 px-4 py-2.5">
              <span className="text-sm font-medium text-muted">{sel.size} sélectionné{sel.size > 1 ? 's' : ''}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {selByAction('vise').filter(peutViser).length > 0 && (
                  <Button isPending={busy} onPress={bulkViser} size="sm" variant="outline">
                    <ShieldCheck aria-hidden="true" className="size-4" />
                    Viser ({selByAction('vise').filter(peutViser).length})
                  </Button>
                )}
                {selByAction('approuve').filter(peutApprouver).length > 0 && (
                  <Button isPending={busy} onPress={bulkApprouver} size="sm" variant="outline">
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    Approuver ({selByAction('approuve').filter(peutApprouver).length})
                  </Button>
                )}
                {selByAction('pay').filter(peutDecaisser).length > 0 && (
                  <Button isPending={busy} onPress={bulkDecaisser} size="sm" variant="primary">
                    <Banknote aria-hidden="true" className="size-4" />
                    Décaisser ({selByAction('pay').filter(peutDecaisser).length})
                  </Button>
                )}
                <Button onPress={() => setSel(new Set())} size="sm" variant="ghost">
                  Effacer
                </Button>
              </div>
            </div>
          )}
          {/*
           * Un `<table>` BRUT, avec ses `<th>` et ses `<td>` peints a la main :
           * `CLAUDE.md` interdit explicitement le balisage de tableau ecrit a la main.
           * La selection est un `Set` a nous, pas celle du composant : les cases portent
           * donc `slot={null}` — sans quoi la v3 leve « A slot prop is required » et la
           * page entiere tombe en 500.
           */}
          <div className="hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Dépenses" className="min-w-[52rem]">
                  <Table.Header>
                    <Table.Column id="coche">
                      <Checkbox
                        aria-label="Tout sélectionner (page)"
                        isIndeterminate={!allPageSelected && pageIds.some((id) => sel.has(id))}
                        isSelected={allPageSelected}
                        onChange={togglePage}
                        slot={null}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                    </Table.Column>
                    <Table.Column id="designation" isRowHeader>
                      Désignation
                    </Table.Column>
                    <Table.Column id="categorie">{tab === 'bap' ? 'Type' : 'Catégorie'}</Table.Column>
                    <Table.Column id="montant">Montant</Table.Column>
                    <Table.Column id="echeance">Échéance</Table.Column>
                    {tab !== 'bap' ? <Table.Column id="validation">Validation</Table.Column> : null}
                    <Table.Column id="statut">Statut</Table.Column>
                    <Table.Column id="action">Action</Table.Column>
                  </Table.Header>

                  <Table.Body
                    renderEmptyState={() => (
                      <p className="py-10 text-center text-sm text-muted">
                        Aucune dépense ne correspond à ces filtres.
                      </p>
                    )}
                  >
                    {paged.map((item) => (
                      <Table.Row id={`dep-row-${item.id}`} key={`dep-row-${item.id}`}>
                        <Table.Cell
                          className={cn(highlightId === item.id && 'bg-accent-soft/40')}
                        >
                          <Checkbox
                            aria-label={`Sélectionner ${item.designation}`}
                            isSelected={sel.has(item.id)}
                            onChange={(v) => toggleOne(item.id, v)}
                            slot={null}
                          >
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>

                        <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                          <span className="flex items-center gap-1.5 font-semibold text-foreground">
                            {item.designation}
                            {item.dyn && (
                              <Chip size="sm" variant="soft">
                                <Chip.Label>RH dyn.</Chip.Label>
                              </Chip>
                            )}
                          </span>
                          <span className="block text-[11px] text-muted">
                            {item.src} · {item.justif ? 'Reçu' : 'sans pièce'}
                          </span>
                        </Table.Cell>

                        <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                          {tab === 'bap' ? (
                            <Chip
                              color={item.type === 'fixe' ? 'default' : 'warning'}
                              size="sm"
                              variant="soft"
                            >
                              <Chip.Label>{item.type === 'fixe' ? 'Fixe' : 'Variable'}</Chip.Label>
                            </Chip>
                          ) : (
                            <span className="text-muted">{item.categorie}</span>
                          )}
                        </Table.Cell>

                        <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                          <span className="block text-right font-semibold tabular-nums">
                            {fmtFcfa(item.montant)}
                          </span>
                        </Table.Cell>

                        <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                          <span className="text-muted">{item.echeance}</span>
                        </Table.Cell>

                        {tab !== 'bap' ? (
                          <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                            <Stepper item={item} seuil={seuil} />
                          </Table.Cell>
                        ) : null}

                        <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                          <Chip
                            color={STATUT[item.statut].color}
                            size="sm"
                            variant={STATUT[item.statut].plein ? 'primary' : 'soft'}
                          >
                            <Chip.Label>{STATUT[item.statut].label}</Chip.Label>
                          </Chip>
                        </Table.Cell>

                        <Table.Cell className={cn(highlightId === item.id && 'bg-accent-soft/40')}>
                          <div className="flex justify-end gap-1.5">{rowActions(item)}</div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>

          {/* Cartes tactiles — mobile (< md), remplacent le tableau à scroll horizontal */}
          <div className="divide-y divide-separator md:hidden">
            {list.length === 0 && (
              <p className="px-3 py-10 text-center text-sm text-muted">Aucune dépense ne correspond à ces filtres.</p>
            )}
            {paged.map((item) => (
              <div
                id={`dep-row-m-${item.id}`}
                key={`m-${item.type}-${item.id}`}
                className={cn('p-3', highlightId === item.id && 'bg-accent-soft/40')}
              >
                <div className="flex items-start gap-2.5">
                  <Checkbox
                    aria-label={`Sélectionner ${item.designation}`}
                    className="mt-0.5"
                    isSelected={sel.has(item.id)}
                    onChange={(v) => toggleOne(item.id, v)}
                    slot={null}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                          {item.designation}
                          {item.dyn && (
                            <Chip size="sm" variant="soft">
                              <Chip.Label>RH dyn.</Chip.Label>
                            </Chip>
                          )}
                        </div>
                        <div className="text-[11px] text-muted">{item.src} · {item.justif ? 'Reçu' : 'sans pièce'}</div>
                      </div>
                      <Chip
                        className="shrink-0"
                        color={STATUT[item.statut].color}
                        size="sm"
                        variant={STATUT[item.statut].plein ? 'primary' : 'soft'}
                      >
                        <Chip.Label>{STATUT[item.statut].label}</Chip.Label>
                      </Chip>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-base font-bold tabular-nums text-foreground">{fmtFcfa(item.montant)}</span>
                      <span className="truncate text-xs text-muted">
                        {tab === 'bap' ? (item.type === 'fixe' ? 'Charge fixe' : 'Dépense variable') : item.categorie}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">Échéance : {item.echeance}</div>
                    {tab !== 'bap' && <div className="mt-2"><Stepper item={item} seuil={seuil} /></div>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {rowActions(item)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator px-4 py-3">
            <span className="text-xs text-muted">
              {list.length} ligne{list.length > 1 ? 's' : ''}
              {sel.size > 0 ? ` · ${sel.size} sélectionnée${sel.size > 1 ? 's' : ''}` : ''}
            </span>
            {pageCount > 1 && <PaginationTableau onPage={setPage} page={page} total={pageCount} />}
          </div>
        </Card>
      )}

      {/* Modal décaissement */}
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-lg">
              <Modal.Header>
                {/*
                 * L'en-tete etait peint en `bg-emerald-600 text-white` : un vert ecrit en
                 * dur, sans variante sombre, pour un titre de fenetre. Le decaissement
                 * n'est pas un succes, c'est une action a confirmer.
                 */}
                <Modal.Heading>
                  Décaisser{' '}
                  {payTargets.length > 1 ? `la sélection (${payTargets.length})` : 'cette dépense'}
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4">
                <div className="rounded-lg bg-surface-secondary p-3 text-sm text-foreground">
                  {payTargets.length === 1 ? (
                    <>
                      {payTargets[0]?.designation}
                      <br />
                      Montant : <b>{fmtFcfa(payTargets[0]?.montant)}</b>
                    </>
                  ) : (
                    <>
                      {payTargets.length} dépenses · Total :{' '}
                      <b>{fmtFcfa(payTargets.reduce((s, i) => s + i.montant, 0))}</b>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <ComboBox
                    onSelectionChange={(c) => setAcc(String(c ?? 'Caisse physique'))}
                    selectedKey={acc}
                  >
                    <Label>Compte débité</Label>
                    <ComboBox.InputGroup>
                      <Input />
                      <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                      <ListBox
                        items={[{ cle: 'Caisse physique' }, { cle: 'Banque' }]}
                      >
                        {(o: { cle: string }) => (
                          <ListBox.Item id={o.cle} textValue={o.cle}>
                            {o.cle}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </ComboBox.Popover>
                  </ComboBox>

                  <ComboBox onSelectionChange={(c) => setMoy(String(c ?? 'Espèces'))} selectedKey={moy}>
                    <Label>Moyen de paiement</Label>
                    <ComboBox.InputGroup>
                      <Input />
                      <ComboBox.Trigger />
                    </ComboBox.InputGroup>
                    <ComboBox.Popover>
                      <ListBox
                        items={['Espèces', 'Chèque', 'Mobile Money', 'Virement'].map((m) => ({
                          cle: m,
                        }))}
                      >
                        {(o: { cle: string }) => (
                          <ListBox.Item id={o.cle} textValue={o.cle}>
                            {o.cle}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        )}
                      </ListBox>
                    </ComboBox.Popover>
                  </ComboBox>
                </div>

                <p className="text-xs text-muted">
                  Le passage en « Payé » crée la sortie de trésorerie (compte + moyen tracés).
                </p>
              </Modal.Body>

              <Modal.Footer>
                <Button onPress={onClose} variant="ghost">
                  Annuler
                </Button>
                <Button isPending={busy} onPress={confirmPay} variant="primary">
                  {busy ? <Spinner size="sm" /> : null}
                  Confirmer le décaissement
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Modales de création (reprises de la page Charges, désormais pilotées ici) */}
      <AddChargeFixeModal isOpen={isFixeModalOpen} onClose={() => setIsFixeModalOpen(false)} chargeToEdit={null} />
      <AddDepenseVariableModal isOpen={isVariableModalOpen} onClose={() => setIsVariableModalOpen(false)} chargeToEdit={null} />

      {/* Modales d'ÉDITION admin (pré-remplies avec l'objet brut) */}
      <AddChargeFixeModal isOpen={!!chargeFixeToEdit} onClose={() => setChargeFixeToEdit(null)} chargeToEdit={chargeFixeToEdit} />
      <AddDepenseVariableModal isOpen={!!chargeVariableToEdit} onClose={() => setChargeVariableToEdit(null)} chargeToEdit={chargeVariableToEdit} />

      {/* Confirmation de SUPPRESSION admin (charge fixe ou dépense variable) */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Supprimer la dépense"
        isLoading={delFixe.isPending || delVar.isPending}
        actions={[{ label: 'Supprimer', onPress: confirmDelete, variante: 'danger' }]}
      >
        <p className="text-sm text-foreground">
          Voulez-vous vraiment supprimer <span className="font-semibold">{itemToDelete?.designation}</span> ? Cette action est irréversible.
        </p>
      </ConfirmModal>
    </div>
  );
}

function CaPart({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-separator bg-surface px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm font-bold tabular-nums text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-muted">{hint}</div>}
    </div>
  );
}

function Cell({ l, v, s, accent }: { l: string; v: string; s: string; accent?: boolean }) {
  return (
    <div className="px-1">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted">{l}</div>
      <div className={`mt-1 text-lg font-bold tabular-nums ${accent ? 'text-accent' : 'text-foreground'}`}>{v}</div>
      <div className="text-[11px] text-muted">{s}</div>
    </div>
  );
}
