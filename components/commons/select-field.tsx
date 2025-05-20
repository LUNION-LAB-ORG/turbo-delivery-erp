

import { Select, SelectItem } from "@heroui/select";
import { useEffect, useState } from "react";

interface Props {
    size?: "sm" | "md" | "lg";
    options?: any[];
    label: string;
    selectValue?: string;
    setSelectValue?: (event?: any) => void;
    asDefaulValue?: boolean;
    livreur?: any;
    setLivreur?: (livreur?: any) => void;
}

export function SelectField(props: Props) {
    const selectedKey = props.options?.find(option => option[props.label] === props.selectValue)?.id ?? "";

    const [selectedValue, setSelectedValue] = useState<string | undefined>(selectedKey);

    useEffect(() => {
        const newSelectedKey = props.options?.find(option => option[props.label] === props.selectValue)?.id ?? "";
        setSelectedValue(newSelectedKey);
    }, [props.selectValue, props.options]);

    const handleChange = (event: any) => {
        const newValue = event.target.value;
        setSelectedValue(newValue);
        const newLabel = props.options?.find(option => option.id === newValue)?.id ?? "";
        props.setSelectValue && props.setSelectValue(newLabel);
        props.setLivreur && props.setLivreur(props.livreur)
    };

    return (
        <Select
            label={""}
            selectedKeys={[selectedValue || "default"]}
            size={props.size}
            aria-labelledby=" "
            className="max-w-xs"
            onChange={handleChange}
        >
            {(props.options || []).map((option) => (
                <SelectItem key={option.id} value={option.id}>
                    {option[props.label]}
                </SelectItem>
            ))}
        </Select>
    );
}

