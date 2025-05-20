import { ControllerFieldState } from "react-hook-form";

interface AtlFormErrorMessageProps {
    fieldState: ControllerFieldState;
}

export default function FormErrorMessage({ fieldState }: AtlFormErrorMessageProps) {
    if (!fieldState.error) return <></>;
    return (<div className={"text-red-500 text-sm"}>{fieldState.error?.message}</div>)
}
