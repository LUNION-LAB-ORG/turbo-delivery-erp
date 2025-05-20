import { Select, SelectItem } from "@heroui/react";



interface SelectFieldProps {
    id?: string,
    options: any[],
    required?: boolean,
    className?: string,
    placeholder?: string,
    optionLabel?: string,
    optionValue?: string,
    value?: any,
    setValue?: (value: any) => void,
    label: string;
    disabled?: boolean;
}
export function SelectField(props: SelectFieldProps) {
    const handleChange = (event: any) => {
        props.setValue && props.setValue(event.target.value);
    }
    return (
        <div className="flex w-full flex-wrap md:flex-nowrap gap-4">
            <Select className="max-w-lg " label={""} aria-label={props.label} onChange={handleChange} placeholder={props.placeholder}>
                {props.options.map((item) => (
                    <SelectItem key={item.id} aria-placeholder="selectionnée une période" value={item.id}>{item[props.label]}</SelectItem>
                ))}
            </Select>
        </div>
    );
}
