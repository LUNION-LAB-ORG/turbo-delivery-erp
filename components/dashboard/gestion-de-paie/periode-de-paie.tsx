
import { Button, Card, Chip, Dropdown } from '@heroui-v3/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface PeriodeDePaieProps {
    periodes: string[],
    MoisEnCours: string[];
    handlePrevious: () => void;
    handleNext: () => void;
    selectedPeriodIndex: number;
    setSelectedPeriodIndex: (value: number) => void;
    joursDeTravailsValides: (jour: number) => boolean;
    periode?: string;
}
export const PeriodeDePaie = ({
    periodes, handleNext, handlePrevious,
    selectedPeriodIndex, MoisEnCours, setSelectedPeriodIndex,
    joursDeTravailsValides, periode }: PeriodeDePaieProps) => {
    const [startDate, endDate] = (periode ?? "").split(" - ");

    return (
        <div className="mb-5 flex flex-col gap-4 rounded-lg bg-surface">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted">Période</span>

                {/*
                 * Les deux chevrons de navigation etaient DANS le bouton qui ouvre la liste
                 * des periodes : cliquer « periode precedente » declenchait aussi
                 * l'ouverture du menu, qui recouvrait aussitot le resultat. Ce n'etaient
                 * pas non plus des boutons — deux `<ChevronLeft onClick>` — donc rien que
                 * le clavier atteigne, et rien qu'un lecteur d'ecran annonce.
                 */}
                <div className="flex items-center gap-1">
                    <Button
                        aria-label="Période précédente"
                        isIconOnly
                        onPress={handlePrevious}
                        size="sm"
                        variant="ghost"
                    >
                        <ChevronLeft aria-hidden="true" className="size-4" />
                    </Button>

                    <Dropdown>
                        <Button className="min-w-[200px]" variant="outline">
                            {periodes && periodes[selectedPeriodIndex]}
                        </Button>
                        <Dropdown.Popover>
                            <Dropdown.Menu
                                aria-label="Périodes"
                                onAction={(key) => setSelectedPeriodIndex(periodes.indexOf(String(key)))}
                            >
                                {(periodes ?? []).map((prd) => (
                                    <Dropdown.Item id={prd} key={prd} textValue={prd}>
                                        {prd}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown.Popover>
                    </Dropdown>

                    <Button
                        aria-label="Période suivante"
                        isIconOnly
                        onPress={handleNext}
                        size="sm"
                        variant="ghost"
                    >
                        <ChevronRight aria-hidden="true" className="size-4" />
                    </Button>
                </div>
            </div>

            <Card>
                <Card.Content className="gap-4 p-4">
                    <div className="flex justify-between text-sm text-muted">
                        <span>Début du mois : {startDate}</span>
                        <span>Fin du mois : {endDate}</span>
                    </div>

                    {/*
                     * Les pastilles de jours etaient peintes par une expression cassee :
                     * `${cond ? "bg-green-500 text-white" : "…text-muted "}p-1 pl-2…`. Dans
                     * la branche VALIDEE, l'absence d'espace collait les deux morceaux et
                     * produisait la classe `text-whitep-1` — ni le blanc ni le rembourrage
                     * ne s'appliquaient. Les jours valides etaient donc les seuls a n'avoir
                     * ni couleur de texte ni marge interieure.
                     */}
                    <div className="flex flex-wrap items-center gap-1 overflow-auto">
                        {(MoisEnCours ?? []).map((item: string) => {
                            const valide = joursDeTravailsValides(Number(item));
                            return (
                                <Chip
                                    color={valide ? 'success' : 'default'}
                                    key={item}
                                    size="sm"
                                    variant="soft"
                                >
                                    <Chip.Label>
                                        <span className="font-bold tabular-nums">{item}</span>
                                        <span className="sr-only">
                                            {valide ? ' : jour validé' : ' : jour non validé'}
                                        </span>
                                    </Chip.Label>
                                </Chip>
                            );
                        })}
                    </div>

                    <div className="flex justify-between text-sm text-muted">
                        <span>Paie en cours</span>
                        {/* ⚠ « Prochaine paie : Mercredi » est ecrit en dur : le jour ne
                            vient d'aucune donnee et ne change jamais. */}
                        <span>Prochaine paie : mercredi</span>
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
};
