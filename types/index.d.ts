import { ReactNode, SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
    size?: number;
};

export interface ActionResult<T = any> {
    data?: T | null;
    message?: string;
    errors?: {
        [key: string]: string;
    };
    status?: 'idle' | 'loading' | 'success' | 'error';
    code?: string | number;
}

export interface ErrorCode {
    code: string | number;
    message: string;
}

export interface MarkerData {
    start: google.maps.LatLngLiteral;
    end: google.maps.LatLngLiteral;
    color: string;
}

export interface Sort {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
}

export interface Pageable {
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    offset: number;
    sort: Sort;
    unpaged: boolean;
}

export interface PaginatedResponse<T> {
    content: T[];
    pageable: Pageable;
    totalPages: number;
    totalElements: number;
    last: boolean;
    first: boolean;
    size: number;
    number: number;
    sort: Sort;
    numberOfElements: number;
    empty: boolean;
}
