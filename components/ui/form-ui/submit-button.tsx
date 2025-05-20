'use client';

import { Button, ButtonProps } from "@heroui/react";
import { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

interface Props extends ButtonProps {
    children: ReactNode;
}
export function SubmitButton({ children, ...props }: Props): JSX.Element {
    const { pending } = useFormStatus();

    return (
        <Button
            aria-disabled={pending}
            className="w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(0,0,0,0.44)]"
            color="primary"
            disabled={pending}
            isLoading={pending}
            type="submit"
            {...props}
        >
            {children}
        </Button>
    );
}
