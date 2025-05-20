'use client';

import { useState } from 'react';
import { Button, Card, Popover, PopoverTrigger, PopoverContent, DatePicker } from "@heroui/react";
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';

export function DatePickers() {
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([new Date(), new Date()]);
    const [startDate, endDate] = dateRange;

    const formatDate = (date: Date | null) => (date ? format(date, 'dd MMM yyyy', { locale: fr }) : '');

    return (
        <div className="mb-4">
            <Popover placement="bottom">
                <PopoverTrigger>
                    <Button className="w-64 bg-white border rounded-full border-gray-300 text-gray-700">
                        <span className="flex gap-4">
                            {startDate && endDate ? `${formatDate(startDate)} - ${formatDate(endDate)}` : 'Sélectionner une période'}
                            <ChevronDown />
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Card className="p-4 w-72 shadow-lg border border-red-300">
                        <h3 className="text-red-500 font-semibold mb-2">Dates enregistrées</h3>
                        {/* <DatePicker
                            selected={startDate || new Date()}
                            onChange={(dates) => setDateRange(dates as any)}
                            startDate={startDate}
                            endDate={endDate}
                            selectsRange
                            inline
                            locale={fr}
                            className="w-full"
                        /> */}
                        <Button variant="light" className="w-full mt-3">
                            Afficher toutes les dates
                        </Button>
                        <div className="flex justify-between mt-4">
                            <Button variant="flat" color="default" onClick={() => setDateRange([null, null])}>
                                Annuler
                            </Button>
                            <Button color="danger">Appliquer</Button>
                        </div>
                    </Card>
                </PopoverContent>
            </Popover>
        </div>
    );
}
