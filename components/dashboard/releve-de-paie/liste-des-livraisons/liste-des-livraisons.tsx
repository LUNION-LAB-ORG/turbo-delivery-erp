import { SelectField } from '@/components/commons/form/select-field';
import { Button } from '@/components/ui/button';
import { ArrowUp, Calendar, Circle, ClipboardList, Edit, Home, Printer, User } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchBar } from '@/components/commons/form/search-bar';
import { SelectWithCheckbox } from '@/components/commons/form/select-with-checkbox';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useState } from 'react';

const data: any = [
    { id: '1', date: '01/08/2024', partenaire: 'LE SMASH', cout: '11 000 FCFA' },
    { id: '2', date: '02/08/2024', partenaire: 'AGHA', cout: '17 000 FCFA' },
    { id: '3', date: '02/08/2024', partenaire: 'LE SMASH', cout: '11 000 FCFA' },
    { id: '4', date: '03/08/2024', partenaire: 'AGHA', cout: '17 000 FCFA' },
    { id: '5', date: '01/08/2024', partenaire: 'LE SMASH', cout: '11 000 FCFA' },
    { id: '6', date: '01/08/2024', partenaire: 'LE SMASH', cout: '11 000 FCFA' },
    { id: '7', date: '03/08/2024', partenaire: 'AGHA', cout: '17 000 FCFA' },
    { id: '8', date: '03/08/2024', partenaire: 'LE SMASH', cout: '11 000 FCFA' },
];

const items = ['Apple', 'Banana', 'Cherry', 'Grapes', 'Mango', 'Orange', 'Pineapple', 'Strawberry'];

export function ListeDesLivraisons() {
    const [selected, setSelected] = useState([]);
    const [showAccordion, setShowAccordion] = useState(false);

    const confirmer = () => {
        selected.length > 1 ? setShowAccordion(true) : setShowAccordion(false);
    };

    const options = [
        { id: '1', name: 'ABDOUL Konaté', color: 'bg-green-500' },
        { id: '2', name: 'Dosso Ousmane', color: 'bg-purple-500' },
        { id: '3', name: 'FIORI Joël', color: 'bg-blue-400' },
        { id: '4', name: 'JUDICAËL YAO', color: 'bg-yellow-500' },
        { id: '5', name: 'Elvis BROU', color: 'bg-blue-600' },
        { id: '6', name: 'William DO', color: 'bg-purple-400' },
        { id: '7', name: 'Guedenon Régis', color: 'bg-cyan-500' },
    ];

    const oprions2 = [
        { key: 'date1', label: '01/01/2025 - 01/01/2024' },
        { key: 'date2', label: '01/01/2025 - 01/01/2024' },
        { key: 'date3', label: '01/01/2025 - 01/01/2024' },
        { key: 'date4', label: '01/01/2025 - 01/01/2024' },
        { key: 'date5', label: '01/01/2025 - 01/01/2024' },
        { key: 'date6', label: '01/01/2025 - 01/01/2024' },
        { key: 'date7', label: '01/01/2025 - 01/01/2024' },
        { key: 'date8', label: '01/01/2025 - 01/01/2024' },
        { key: 'date9', label: '01/01/2025 - 01/01/2024' },
    ];

    return (
        <>
            <div className="container mt-10 mb-10">
                <SearchBar items={items} />
            </div>
            {showAccordion ? (
                selected.map((item) => (
                    <Accordion type="single" collapsible key={item}>
                        <AccordionItem value={selected[0]}>
                            <AccordionTrigger className="bg-red-200 text-primary-text border-none rounded p-2 mb-1 mt-2 data-[state=open]:bg-red-500 data-[state=open]:text-white">
                                {item}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-col md:flex-row gap-4 p-4 items-start h-full">
                                    <div className="w-full md:w-1/4 bg-gray-100 flex-1 rounded-lg p-4 self-stretch flex flex-col">
                                        <div className=" text-red-500">
                                            <span className="flex gap-2 items-center">
                                                <User /> Profil
                                            </span>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                                            <div className="w-16 h-16 bg-purple-500 text-white text-center rounded-full pt-[8%]">{'KRAH Éric'.charAt(0)}</div>
                                            <h2 className="mt-2 font-semibold text-lg">KRAH Éric</h2>
                                            <div className="mt-6 text-center">
                                                <p className="text-gray-500 text-sm">Total général</p>
                                                <p className="text-red-500 text-2xl font-bold">117 800 F CFA</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-3/4">
                                        <Table className="w-full border rounded-lg">
                                            <TableHeader>
                                                <TableRow className="text-red-500">
                                                    <TableHead className="text-left py-2 px-4">
                                                        <span className="flex gap-4 text-red-500">
                                                            <Calendar size={18} /> Période
                                                        </span>
                                                    </TableHead>
                                                    <TableHead className="text-left py-2 px-4">
                                                        <span className="flex gap-4 text-red-500">
                                                            <Home size={18} /> Partenaire
                                                        </span>
                                                    </TableHead>
                                                    <TableHead className="text-left py-2 px-4">
                                                        <span className="flex gap-4 text-red-500">
                                                            <ClipboardList size={18} /> Coût de livraison
                                                        </span>
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.map((item: any, index: number) => (
                                                    <TableRow key={index} className="hover:bg-red-50">
                                                        <TableCell className="py-2 px-4">
                                                            <Link href={`/analystics/pay-slip/${item.id}/details`} passHref>
                                                                <span className="flex items-center gap-2">
                                                                    <Circle className="text-red-500" /> <span>{item.date}</span>
                                                                </span>
                                                                <p className="text-xs text-gray-500">Total {item.cout}</p>
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="py-2 px-4">
                                                            <Link href={`/analystics/pay-slip/${item.id}/details`}>{item.partenaire}</Link>
                                                        </TableCell>
                                                        <TableCell className="py-2 px-4 font-semibold">
                                                            <Link href={`/analystics/pay-slip/${item.id}/details`} passHref>
                                                                {item.cout}
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                ))
            ) : (
                <div className="flex flex-col md:flex-row gap-4 p-4 items-start h-full">
                    <div className="w-full md:w-1/4 bg-gray-100 flex-1 rounded-lg p-4 self-stretch flex flex-col">
                        <div className=" text-red-500">
                            <span className="flex gap-2 items-center">
                                <User /> Profil
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                            <div className="w-16 h-16 bg-purple-500 text-white text-center rounded-full pt-[8%]">{'KRAH Éric'.charAt(0)}</div>
                            <h2 className="mt-2 font-semibold text-lg">KRAH Éric</h2>
                            <div className="mt-6 text-center">
                                <p className="text-gray-500 text-sm">Total général</p>
                                <p className="text-red-500 text-2xl font-bold">117 800 F CFA</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-3/4">
                        <Table className="w-full border rounded-lg">
                            <TableHeader>
                                <TableRow className="text-red-500">
                                    <TableHead className="text-left py-2 px-4">
                                        <span className="flex gap-4 text-red-500">
                                            <Calendar size={18} /> Période
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-left py-2 px-4">
                                        <span className="flex gap-4 text-red-500">
                                            <Home size={18} /> Partenaire
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-left py-2 px-4">
                                        <span className="flex gap-4 text-red-500">
                                            <ClipboardList size={18} /> Coût de livraison
                                        </span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item: any, index: number) => (
                                    <TableRow key={index} className="hover:bg-red-50">
                                        <TableCell className="py-2 px-4">
                                            <Link href={`/analystics/pay-slip/${item.id}/details`} passHref>
                                                <span className="flex items-center gap-2">
                                                    <Circle className="text-red-500" /> <span>{item.date}</span>
                                                </span>
                                                <p className="text-xs text-gray-500">Total {item.cout}</p>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-2 px-4">
                                            <Link href={`/analystics/pay-slip/${item.id}/details`}>{item.partenaire}</Link>
                                        </TableCell>
                                        <TableCell className="py-2 px-4 font-semibold">
                                            <Link href={`/analystics/pay-slip/${item.id}/details`} passHref>
                                                {item.cout}
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <div className="flex justify-between flex-wrap mt-20">
                <div className="flex gap-4">
                    <span> Nombre de jour</span>
                    <Button className="h-6 pl-4 pr-4" variant={'success'}>
                        {data.length} Jour(s)
                    </Button>
                    <div className="flex gap-4">
                        Net à payer{' '}
                        <span className="text-green-500 font-bold flex gap-2">
                            <ArrowUp className="mr-2" />{' '}
                            {
                                data.map((item: any) => {
                                    const coutTotal = 0;
                                    const cout = coutTotal + item.cout;
                                    return cout;
                                })[0]
                            }{' '}
                        </span>{' '}
                        FCFA
                    </div>
                </div>
                <div className="flex pt-0 flex-wrap gap-2 sm:pt-4 lg:pt-0 md:pt-0 xl:pt-0">
                    <Button className="h-8" variant={'slate'}>
                        <Edit className="mr-2" /> Modifier
                    </Button>
                    <Button className="h-8" variant={'default'}>
                        <Printer className="mr-2" /> Imprimer
                    </Button>
                </div>
            </div>
            <div className="flex gap-4 mt-10 items-center">
                <SelectWithCheckbox options={options} selected={selected} setSelected={setSelected} confirmer={confirmer} />
                <SelectField options={oprions2} label="Période" />
            </div>
        </>
    );
}
