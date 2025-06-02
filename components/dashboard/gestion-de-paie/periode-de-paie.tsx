
import { Button, Card, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";


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
        <div className=" mb-5 bg-white rounded-lg">
            <div className="lg:flex md:flex  xl:flex items-center  mb-4 gap-4 flex-wrap">
                <div className="text-gray-500">Période</div>
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            variant="bordered"
                            className="min-w-[200px] flex justify-between items-center px-4 py-2 rounded-full border-gray-300"
                        >
                            <ChevronLeft className="text-gray-500 cursor-pointer" onClick={handlePrevious} />
                            {periodes && periodes[selectedPeriodIndex]}
                            <ChevronRight className="text-gray-500 cursor-pointer" onClick={handleNext} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label="Périodes"
                        onAction={(key) => setSelectedPeriodIndex(periodes.indexOf(key as any))}
                        className="overflow-auto"
                    >
                        {periodes && periodes.map((prd) => (
                            <DropdownItem key={prd}>{prd}</DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </div>
            <Card className="mt-5 p-4">
                <div className="mb-4 text-sm text-gray-500 flex justify-between">
                    <span>Début du mois &nbsp;:&nbsp;&nbsp; {startDate}</span>
                    <span>Fin du mois &nbsp;:&nbsp;&nbsp; {endDate}</span>
                </div>
                <div className="flex justify-around ">
                    <div className="flex items-center gap-1 overflow-auto">
                        {MoisEnCours && MoisEnCours.map((item: string) => {
                            return (
                                <div key={item} className="min-w-8 h-auto lg:w-8 xl:w-8 md:w-8 lg:h-8 xl:h-8 md:h-8 flex items-center justify-center text-white text-sm rounded-lg">
                                    <span className={`${joursDeTravailsValides(Number(item)) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400 "}p-1 pl-2 pr-2 font-bold rounded-md `}>{item}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="mt-4 text-sm text-gray-400 flex justify-between">
                    <span>Paie en cours</span>
                    <span>Prochaine paie: Mercredi</span>
                </div>
            </Card>
        </div>
    );
};

