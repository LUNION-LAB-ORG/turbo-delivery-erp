import { FilleAttenteVM } from "@/types/file-attente.model";
import { useEffect, useState } from "react";

interface Props {
    datas?: FilleAttenteVM[];
}
export function useListeRestaurantController({ datas }: Props) {
    const [paginationDatas, setPaginationDatas] = useState<FilleAttenteVM[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const prevPage = 4;

    const paginate = (data: any, pageNumber: number, perPage: number) => {
        const start = pageNumber * perPage;
        return data.slice(start, start + perPage);
    };


    useEffect(() => {
        const slicedData = paginate(datas || [], currentPage, prevPage);
        setPaginationDatas(slicedData)
    }, [currentPage, datas]);

    return {
        paginationDatas,
        setCurrentPage,
        currentPage,
        prevPage,
        paginate
    }
}