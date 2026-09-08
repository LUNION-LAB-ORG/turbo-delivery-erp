'use client';

import { SearchBar } from '@/components/commons/form/search-bar';
import { SelectField } from '@/components/commons/form/select-field';
import { SelectWithCheckbox } from '@/components/commons/form/select-with-checkbox';
import { TableauResponsive, type ColonneResponsive } from '@/components/commons/TableauResponsive';
import { formatMontant } from '@/utils/format.utils';
import { Accordion, Avatar, Button, Card, Chip } from '@heroui-v3/react';
import { Edit, Printer } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

/*
 * Ecran de MAQUETTE : les lignes ci-dessous sont ecrites en dur, la page qui les monte
 * (app/(protected)/analystics/pay-slip/content.tsx) le dit par un bandeau.
 *
 * Le cout etait une CHAINE, « 11 000 FCFA ». Impossible a additionner : le « Net a payer »
 * du pied lisait `coutTotal + item.cout` avec `coutTotal` remis a zero a chaque tour, ne
 * gardait que le premier resultat, et affichait donc « 011 000 FCFA FCFA ». Un montant se
 * porte en nombre et se formate au rendu.
 */
type Livraison = { cout: number; date: string; id: string; partenaire: string };

const LIVRAISONS: readonly Livraison[] = [
    { id: '1', date: '01/08/2024', partenaire: 'LE SMASH', cout: 11000 },
    { id: '2', date: '02/08/2024', partenaire: 'AGHA', cout: 17000 },
    { id: '3', date: '02/08/2024', partenaire: 'LE SMASH', cout: 11000 },
    { id: '4', date: '03/08/2024', partenaire: 'AGHA', cout: 17000 },
    { id: '5', date: '01/08/2024', partenaire: 'LE SMASH', cout: 11000 },
    { id: '6', date: '01/08/2024', partenaire: 'LE SMASH', cout: 11000 },
    { id: '7', date: '03/08/2024', partenaire: 'AGHA', cout: 17000 },
    { id: '8', date: '03/08/2024', partenaire: 'LE SMASH', cout: 11000 },
];

const TOTAL = LIVRAISONS.reduce((somme, l) => somme + l.cout, 0);
// « Nombre de jour » comptait les LIGNES : huit livraisons reparties sur trois dates
// s'annoncaient « 8 jour(s) ». Un jour travaille deux fois reste un jour.
const JOURS = new Set(LIVRAISONS.map((l) => l.date)).size;

// La barre de recherche se voyait servir « Apple, Banana, Cherry… » : les fruits du
// gabarit d'origine, dans un releve de paie ivoirien. Elle propose les partenaires servis.
const PARTENAIRES = Array.from(new Set(LIVRAISONS.map((l) => l.partenaire)));

const COLONNES: readonly ColonneResponsive<Livraison>[] = [
    {
        cle: 'date',
        libelle: 'Période',
        identite: true,
        /*
         * Les trois cellules de la ligne portaient CHACUNE un lien vers la meme fiche, et
         * la premiere repetait en plus « Total 11 000 FCFA » juste sous la date, montant
         * deja tenu par la colonne de droite. Un lien par ligne, un montant par ligne.
         */
        rendu: (l) => (
            <Link
                className="font-medium text-foreground underline-offset-2 hover:underline"
                href={`/analystics/pay-slip/${l.id}/details`}
            >
                {l.date}
            </Link>
        ),
    },
    { cle: 'partenaire', libelle: 'Partenaire', rendu: (l) => l.partenaire },
    {
        cle: 'cout',
        libelle: 'Coût de livraison',
        nombre: true,
        rendu: (l) => formatMontant(l.cout),
    },
];

/**
 * Le releve d'UN livreur : qui il est, ce qu'il a livre, ce qu'on lui doit.
 *
 * <p>Ce bloc etait ecrit DEUX FOIS a l'identique dans le fichier, une fois dans la branche
 * accordeon et une fois dans la branche simple, table et cartes mobiles comprises. Chaque
 * correction devait donc etre faite deux fois, et ne l'etait pas toujours.</p>
 */
function ReleveLivreur({ nom }: { nom: string }) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
            {/*
             * Le panneau de profil etait peint au rouge de marque : titre « Profil » en
             * rouge, pastille d'initiale en violet, total general en rouge et en gras. Le
             * total n'appelle aucun geste, et il ne valait pas non plus la somme des
             * lignes : « 117 800 F CFA » etait ecrit en dur, sous un tableau qui totalise
             * 106 000. Deux totaux contradictoires sur le meme ecran.
             */}
            <Card className="w-full md:w-64 md:shrink-0">
                <Card.Header>
                    <Card.Title>Profil</Card.Title>
                </Card.Header>
                <Card.Content className="items-center gap-1 pb-6 text-center">
                    <Avatar size="lg">
                        <Avatar.Fallback>{nom.charAt(0).toUpperCase()}</Avatar.Fallback>
                    </Avatar>
                    <p className="mt-2 text-lg font-semibold text-foreground">{nom}</p>
                    <p className="mt-6 text-sm text-muted">Total général</p>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                        {formatMontant(TOTAL)}
                    </p>
                </Card.Content>
            </Card>

            <div className="min-w-0 flex-1">
                <TableauResponsive
                    cleLigne={(l) => l.id}
                    colonnes={COLONNES}
                    libelle={`Livraisons de ${nom}`}
                    lignes={LIVRAISONS}
                    vide="Aucune livraison"
                />
            </div>
        </div>
    );
}

export function ListeDesLivraisons() {
    const [selected, setSelected] = useState<string[]>([]);
    const [showAccordion, setShowAccordion] = useState(false);
    const [periode, setPeriode] = useState<string>('');

    const confirmer = () => {
        setShowAccordion(selected.length > 1);
    };

    /*
     * Chaque nom portait une classe de fond (`bg-green-500`, `bg-purple-400`…) que plus
     * personne ne lit : `SelectWithCheckbox` ne rend que le nom et sa case. Sept couleurs
     * qui ne disaient rien, et rien ne les affichait.
     */
    const options = [
        { id: '1', name: 'ABDOUL Konaté' },
        { id: '2', name: 'Dosso Ousmane' },
        { id: '3', name: 'FIORI Joël' },
        { id: '4', name: 'JUDICAËL YAO' },
        { id: '5', name: 'Elvis BROU' },
        { id: '6', name: 'William DO' },
        { id: '7', name: 'Guedenon Régis' },
    ];

    /*
     * `SelectField` lit le libelle de chaque option sous la CLE portee par sa prop
     * `label` : avec `label="Période"`, il cherchait `item['Période']` sur des objets qui
     * n'avaient que `key` et `label`. Les neuf options s'affichaient donc VIDES, et leur
     * valeur aussi. Elles portent la clef attendue.
     */
    const periodes = Array.from({ length: 9 }, (_, i) => ({
        id: `date${i + 1}`,
        Période: '01/01/2025 - 01/01/2024',
    }));

    return (
        <>
            <div className="container mb-10 mt-10">
                <SearchBar items={PARTENAIRES} />
            </div>

            {showAccordion ? (
                /*
                 * C'etait un `Accordion` shadcn PAR nom selectionne, chacun avec un seul
                 * volet dont la valeur etait `selected[0]` : les volets partageaient donc
                 * tous la meme clef et s'ouvraient ensemble. Un seul groupe, une entree par
                 * nom, et le bandeau rouge du declencheur laisse place au style de la v3.
                 */
                <Accordion>
                    {selected.map((nom) => (
                        <Accordion.Item id={nom} key={nom}>
                            <Accordion.Heading>
                                <Accordion.Trigger>
                                    {nom}
                                    <Accordion.Indicator />
                                </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                                <Accordion.Body>
                                    <ReleveLivreur nom={nom} />
                                </Accordion.Body>
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>
            ) : (
                <ReleveLivreur nom="KRAH Éric" />
            )}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                    {/* Le compte etait rendu par un BOUTON rouge, cliquable, sans geste. */}
                    <span className="flex items-center gap-2 text-sm text-muted">
                        Nombre de jours
                        <Chip size="sm" variant="soft">
                            <Chip.Label>{JOURS} jour(s)</Chip.Label>
                        </Chip>
                    </span>
                    {/*
                     * « Net a payer » etait precede d'une FLECHE VERS LE HAUT en vert : la
                     * grammaire d'une hausse, sur un total qui ne se compare a rien.
                     */}
                    <span className="flex items-center gap-2 text-sm text-muted">
                        Net à payer
                        <span className="text-base font-bold tabular-nums text-foreground">
                            {formatMontant(TOTAL)}
                        </span>
                    </span>
                </div>
                {/*
                 * Ces deux boutons n'ont AUCUN gestionnaire, ni avant ni maintenant : ils
                 * appartiennent a la maquette. « Imprimer » etait rouge comme « Modifier ».
                 */}
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline">
                        <Edit aria-hidden="true" className="size-4" />
                        Modifier
                    </Button>
                    <Button variant="primary">
                        <Printer aria-hidden="true" className="size-4" />
                        Imprimer
                    </Button>
                </div>
            </div>

            <div className="mt-10 flex flex-wrap items-end gap-4">
                <SelectWithCheckbox
                    confirmer={confirmer}
                    options={options}
                    selected={selected}
                    setSelected={setSelected}
                />
                <SelectField
                    label="Période"
                    options={periodes}
                    setValue={setPeriode}
                    value={periode}
                />
            </div>
        </>
    );
}
