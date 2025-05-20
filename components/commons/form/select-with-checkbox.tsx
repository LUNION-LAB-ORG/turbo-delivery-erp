'use client';

import { Card, Checkbox, Button, Popover, PopoverTrigger, PopoverContent } from "@heroui/react";

interface SelectWithCheckboxProps {
    className?: string;
    placeholder?: string;
    options: any[];
    onChange?: (selectedOptions: any) => void;
    disabled?: boolean;
    selected: string[];
    setSelected: (selected: any) => void;
    confirmer?: () => void;
}

export function SelectWithCheckbox(props: SelectWithCheckboxProps) {
    const toggleSelection = (name: any) => {
        props.setSelected((prev: any) => (prev.includes(name) ? prev.filter((n: any) => n !== name) : [...prev, name]));
    };

    return (
        <Popover placement="bottom">
            <PopoverTrigger>
                <Button className="w-64 bg-white border border-gray-300 text-gray-700">{props.selected.length > 0 ? props.selected.join(', ') : 'Sélectionner des utilisateurs'}</Button>
            </PopoverTrigger>
            <PopoverContent>
                <Card className="p-4 w-64 shadow-lg border border-red-300">
                    <h3 className="text-red-500 font-semibold mb-2">Sélection</h3>
                    <div className="space-y-2">
                        {props.options.map(({ name, color }) => (
                            <div key={name} className="flex items-center gap-2">
                                <div className={`${color} text-white w-6 h-6 rounded-full text-center`}>{name.charAt(0)}</div>
                                <span className="flex-1 text-sm">{name}</span>
                                <Checkbox isSelected={props.selected.includes(name)} onChange={() => toggleSelection(name)} color="danger" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4">
                        <Button variant="flat" color="default">
                            Annuler
                        </Button>
                        <Button color="danger" onPress={props.confirmer}>
                            Confirmer
                        </Button>
                    </div>
                </Card>
            </PopoverContent>
        </Popover>
    );
}
